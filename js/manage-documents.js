// js/manage-documents.js
import { protectPage, setupLogoutButton } from './auth-guard.js';
import { db, collection, query, getDocs, doc, getDoc, updateDoc } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SETUP THE PAGE ---
    protectPage({ expectedRole: 'admin' });
    setupLogoutButton();

    const tableBody = document.getElementById('table-body');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const updateForm = document.getElementById('update-form');
    
    let activeDocId = null; // Store the doc ID for the modal
    let activeDocType = 'document_requests'; // Set the collection name

    document.addEventListener('user-loaded', (e) => {
        // Populate the admin's name
        const adminNameEl = document.getElementById('admin-name');
        if (adminNameEl) {
            adminNameEl.textContent = e.detail.userData.firstName || 'Admin';
        }
        
        // Now that admin is verified, load the data
        loadDocuments();
    });

    // --- 2. LOAD ALL DOCUMENT REQUESTS ---
    async function loadDocuments() {
        if (!tableBody) return;
        tableBody.innerHTML = '<tr><td colspan="5" class="placeholder-cell">Loading requests...</td></tr>';
        
        try {
            const requestsRef = collection(db, activeDocType);
            const q = query(requestsRef); // Get all documents
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="5" class="placeholder-cell">No document requests found.</td></tr>';
                return;
            }

            tableBody.innerHTML = ''; // Clear loading
            
            for (const docSnap of querySnapshot.docs) {
                const request = docSnap.data();
                const docId = docSnap.id;
                
                // Fetch the user's name
                let requesterName = "Unknown User";
                if (request.userId) {
                    const userDoc = await getDoc(doc(db, "users", request.userId));
                    if (userDoc.exists()) {
                        requesterName = userDoc.data().firstName + ' ' + userDoc.data().lastName;
                    }
                }
                
                // Create table row
                const tr = document.createElement('tr');
                const statusClass = request.status.toLowerCase().replace(/\s+/g, '-');
                
                tr.innerHTML = `
                    <td>${request.createdAt.toDate().toLocaleDateString()}</td>
                    <td>${request.documentType}</td>
                    <td class="complainant-name">${requesterName}</td>
                    <td><span class="status-badge ${statusClass}">${request.status}</span></td>
                    <td>
                        <button class="action-btn update-btn" data-id="${docId}">Update</button>
                    </td>
                `;
                tableBody.appendChild(tr);
            }
            
            // Add event listeners to the new buttons
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
        document.getElementById('modal-notes').value = ''; // Clear notes
        
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
            loadDocuments(); // Refresh the table
            
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