// js/manage-feedback.js
import { protectPage, setupLogoutButton } from './auth-guard.js';
import { db, collection, query, getDocs, doc, getDoc, updateDoc, orderBy } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SETUP THE PAGE ---
    protectPage({ expectedRole: 'admin' });
    setupLogoutButton();

    const tableBody = document.getElementById('table-body');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const modalReadBtn = document.getElementById('modal-read-btn');
    
    // Modal fields
    const modalUserName = document.getElementById('modal-user-name');
    const modalSubject = document.getElementById('modal-subject');
    const modalFeedbackText = document.getElementById('modal-feedback-text');
    
    let activeDocId = null; 

    document.addEventListener('user-loaded', (e) => {
        const adminNameEl = document.getElementById('admin-name');
        if (adminNameEl) {
            adminNameEl.textContent = e.detail.userData.firstName || 'Admin';
        }
        loadFeedback();
    });

    // --- 2. LOAD ALL FEEDBACK ---
    async function loadFeedback() {
        if (!tableBody) return;
        tableBody.innerHTML = '<tr><td colspan="5" class="placeholder-cell">Loading feedback...</td></tr>';
        
        try {
            const feedbackRef = collection(db, "feedback");
            const q = query(feedbackRef, orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="5" class="placeholder-cell">No feedback found.</td></tr>';
                return;
            }

            tableBody.innerHTML = ''; 
            
            const userFetchPromises = [];
            const feedbackData = [];

            querySnapshot.forEach(docSnap => {
                const item = docSnap.data();
                feedbackData.push({ id: docSnap.id, ...item });
                if (item.userId) {
                    userFetchPromises.push(getDoc(doc(db, "users", item.userId)));
                } else {
                    userFetchPromises.push(null);
                }
            });

            const userDocs = await Promise.all(userFetchPromises);

            feedbackData.forEach((item, index) => {
                let userName = "Unknown User";
                const userDoc = userDocs[index];
                if (userDoc && userDoc.exists()) {
                    userName = userDoc.data().firstName + ' ' + userDoc.data().lastName;
                }
                
                const tr = document.createElement('tr');
                const statusClass = item.status.toLowerCase().replace(/\s+/g, '-');
                
                tr.innerHTML = `
                    <td>${item.createdAt.toDate().toLocaleDateString()}</td>
                    <td>${item.subject}</td>
                    <td class="complainant-name">${userName}</td>
                    <td><span class="status-badge ${statusClass}">${item.status}</span></td>
                    <td>
                        <button class="action-btn view-btn" data-id="${item.id}">View</button>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
            
            document.querySelectorAll('.view-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    activeDocId = e.target.dataset.id;
                    openViewModal(e.target.dataset.id);
                });
            });

        } catch (error) {
            console.error("Error loading feedback: ", error);
            tableBody.innerHTML = '<tr><td colspan="5" class="placeholder-cell">Error loading data.</td></tr>';
        }
    }

    // --- 3. MODAL AND UPDATE LOGIC ---
    
    async function openViewModal(docId) {
        if (!docId) return;
        
        const docRef = doc(db, "feedback", docId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            showToast("Error: Could not find that item.", "error");
            return;
        }
        
        const item = docSnap.data();
        
        // Fetch user name
        let userName = "Unknown";
        if (item.userId) {
            const userDoc = await getDoc(doc(db, "users", item.userId));
            if (userDoc.exists()) {
                userName = userDoc.data().firstName + ' ' + userDoc.data().lastName;
            }
        }

        // Populate modal
        modalUserName.textContent = userName;
        modalSubject.textContent = item.subject;
        modalFeedbackText.textContent = item.feedbackText;
        
        // Show "Mark as Read" button only if status is "New"
        if (item.status === "New") {
            modalReadBtn.style.display = 'block';
        } else {
            modalReadBtn.style.display = 'none';
        }
        
        modalOverlay.classList.add('is-open');
    }

    function closeModal() {
        modalOverlay.classList.remove('is-open');
        activeDocId = null;
    }

    modalCancelBtn.addEventListener('click', closeModal);

    // This button just updates the status to "Read"
    modalReadBtn.addEventListener('click', async () => {
        if (!activeDocId) return;

        setButtonLoading(modalReadBtn, true, "Saving...");

        try {
            const docRef = doc(db, "feedback", activeDocId);
            await updateDoc(docRef, {
                status: "Read"
            });

            showToast("Feedback marked as read.", "success");
            closeModal();
            loadFeedback(); // Refresh the table
            
        } catch (error) {
            console.error("Error updating status:", error);
            showToast("Failed to update status. Please try again.", "error");
        } finally {
            setButtonLoading(modalReadBtn, false, "MARK AS READ");
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