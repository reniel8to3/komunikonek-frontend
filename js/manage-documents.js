// js/manage-documents.js
import { protectPage, setupLogoutButton } from './auth-guard.js';
import { db, collection, query, getDocs, doc, getDoc, updateDoc, where } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SETUP THE PAGE ---
    protectPage({ expectedRole: 'admin' });
    setupLogoutButton();

    const tableBody = document.getElementById('table-body');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const updateForm = document.getElementById('update-form');
    const statusFilter = document.getElementById('status-filter'); // <-- NEW
    
    let activeDocId = null;
    let activeDocType = 'document_requests'; 

    document.addEventListener('user-loaded', (e) => {
        const adminNameEl = document.getElementById('admin-name');
        if (adminNameEl) {
            adminNameEl.textContent = e.detail.userData.firstName || 'Admin';
        }
        loadDocuments(); // Load all on initial page load
    });
    
    // --- NEW: EVENT LISTENER FOR THE FILTER ---
    statusFilter?.addEventListener('change', () => {
        loadDocuments(statusFilter.value);
    });

    // --- 2. LOAD ALL DOCUMENT REQUESTS (NOW WITH FILTER) ---
    async function loadDocuments(filter = 'all') { // <-- UPDATED
        if (!tableBody) return;
        tableBody.innerHTML = '<tr><td colspan="5" class="placeholder-cell">Loading requests...</td></tr>';
        
        try {
            const requestsRef = collection(db, activeDocType);
            
            // --- UPDATED QUERY LOGIC ---
            let q;
            if (filter === 'all') {
                q = query(requestsRef);
            } else {
                q = query(requestsRef, where("status", "==", filter));
            }
            // --- END UPDATED QUERY ---
            
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                tableBody.innerHTML = `<tr><td colspan="5" class="placeholder-cell">No document requests found with status: ${filter}</td></tr>`;
                return;
            }

            tableBody.innerHTML = '';
            
            const userFetchPromises = [];
            const requestData = [];

            querySnapshot.forEach(docSnap => {
                const request = docSnap.data();
                requestData.push({ id: docSnap.id, ...request });
                if (request.userId) {
                    userFetchPromises.push(getDoc(doc(db, "users", request.userId)));
                } else {
                    userFetchPromises.push(null);
                }
            });

            const userDocs = await Promise.all(userFetchPromises);

            // --- NEW: Sort by date in JavaScript (avoids index errors) ---
            requestData.sort((a, b) => {
                const dateA = a.createdAt ? a.createdAt.toDate() : new Date(0);
                const dateB = b.createdAt ? b.createdAt.toDate() : new Date(0);
                return dateB - dateA;
            });
            // --- END SORT ---

            requestData.forEach((request, index) => {
                let requesterName = "Unknown User";
                const userDoc = userDocs[index];
                if (userDoc && userDoc.exists()) {
                    requesterName = userDoc.data().firstName + ' ' + userDoc.data().lastName;
                }
                
                const tr = document.createElement('tr');
                const statusClass = request.status.toLowerCase().replace(/\s+/g, '-');
                
                tr.innerHTML = `
                    <td>${request.createdAt.toDate().toLocaleDateString()}</td>
                    <td>${request.documentType}</td>
                    <td class="complainant-name">${requesterName}</td>
                    <td><span class="status-badge ${statusClass}">${request.status}</span></td>
                    <td>
                        <button class="action-btn update-btn" data-id="${request.id}">Update</button>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
            
            document.querySelectorAll('.update-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    activeDocId = e.target.dataset.id;
                    openUpdateModal(e.target.dataset.id);
                });
            });

        } catch (error) {
            console.error("Error loading documents: ", error);
            tableBody.innerHTML = '<tr><td colspan="5" class="placeholder-cell">Error loading data.</td></tr>';
        }
    }

    // --- 3. MODAL AND UPDATE LOGIC ---
    
    async function openUpdateModal(docId) {
        if (!docId) return;
        
        const docRef = doc(db, activeDocType, docId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            showToast("Error: Could not find that item.", "error");
            return;
        }
        
        const item = docSnap.data();
        document.getElementById('modal-status').value = item.status;
        document.getElementById('modal-notes').value = '';
        
        modalOverlay.classList.add('is-open');
    }

    function closeModal() {
        modalOverlay.classList.remove('is-open');
        activeDocId = null;
    }

    modalCancelBtn.addEventListener('click', closeModal);

    updateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!activeDocId) return;

        const saveButton = document.getElementById('modal-save-btn');
        setButtonLoading(saveButton, true, "Saving...");

        const newStatus = document.getElementById('modal-status').value;
        const newNotes = document.getElementById('modal-notes').value;

        try {
            const docRef = doc(db, activeDocType, activeDocId);
            const docSnap = await getDoc(docRef);
            const item = docSnap.data();

            const currentProgress = item.progress || [];
            
            const newProgressStep = {
                status: newStatus,
                notes: newNotes,
                timestamp: new Date()
            };

            await updateDoc(docRef, {
                status: newStatus,
                progress: [...currentProgress, newProgressStep]
            });

            showToast("Status updated successfully!", "success");
            closeModal();
            loadDocuments(statusFilter.value); // <-- UPDATED: Refresh table with current filter
            
        } catch (error) {
            console.error("Error updating status:", error);
            showToast("Failed to update status. Please try again.", "error");
        } finally {
            setButtonLoading(saveButton, false, "SAVE UPDATE");
        }
    });

});

// --- UTILITY FUNCTIONS ---
function setButtonLoading(button, isLoading, loadingText = "Loading...") {
    if (!button) return;
    const originalText = button.dataset.originalText || button.textContent;
    if (!button.dataset.originalText) {
        button.dataset.originalText = button.textContent;
    }
    
    button.disabled = isLoading;
    button.textContent = isLoading ? loadingText : originalText;
}
function showToast(message, type = 'info') {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}