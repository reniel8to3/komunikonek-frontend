import { protectPage, setupLogoutButton } from './auth-guard.js';
import { db, collection, query, getDocs, doc, getDoc, updateDoc, orderBy } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SETUP THE PAGE ---
    protectPage({ expectedRole: 'admin' });
    setupLogoutButton();

    const tableBody = document.getElementById('table-body');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const updateForm = document.getElementById('update-form');
    const modalUserName = document.getElementById('modal-user-name');
    
    let activeDocId = null; // Store the doc ID for the modal
    let activeDocType = 'users'; // Set the collection name

    document.addEventListener('user-loaded', (e) => {
        const adminNameEl = document.getElementById('admin-name');
        if (adminNameEl) {
            adminNameEl.textContent = e.detail.userData.firstName || 'Admin';
        }
        loadUsers();
    });

    // --- 2. LOAD ALL USERS ---
    async function loadUsers() {
        if (!tableBody) return;
        tableBody.innerHTML = '<tr><td colspan="4" class="placeholder-cell">Loading users...</td></tr>';
        
        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, orderBy("createdAt", "desc")); // Order by newest first
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="4" class="placeholder-cell">No users found.</td></tr>';
                return;
            }

            tableBody.innerHTML = ''; // Clear loading
            
            for (const docSnap of querySnapshot.docs) {
                const user = docSnap.data();
                const docId = docSnap.id;
                
                const tr = document.createElement('tr');
                const statusClass = user.accountType.toLowerCase();
                const userName = (user.firstName || 'N/A') + ' ' + (user.lastName || '');
                
                tr.innerHTML = `
                    <td class="complainant-name">${userName}</td>
                    <td>${user.email || user.phone}</td>
                    <td><span class="status-badge ${statusClass}">${user.accountType}</span></td>
                    <td>
                        <button class="action-btn update-btn" data-id="${docId}">Update Role</button>
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
            console.error("Error loading users: ", error);
            tableBody.innerHTML = '<tr><td colspan="4" class="placeholder-cell">Error loading data.</td></tr>';
        }
    }

    // --- 3. MODAL AND UPDATE LOGIC ---
    
    async function openUpdateModal(docId) {
        if (!docId) return;
        
        const docRef = doc(db, activeDocType, docId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            showToast("Error: Could not find that user.", "error");
            return;
        }
        
        const item = docSnap.data();
        document.getElementById('modal-status').value = item.accountType;
        modalUserName.textContent = item.firstName + ' ' + item.lastName;
        
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

        const newRole = document.getElementById('modal-status').value;

        try {
            const docRef = doc(db, activeDocType, activeDocId);
            
            // Update the document
            await updateDoc(docRef, {
                accountType: newRole
            });

            showToast("Role updated successfully!", "success");
            closeModal();
            loadUsers(); // Refresh the table
            
        } catch (error) {
            console.error("Error updating role:", error);
            showToast("Failed to update role. Please try again.", "error");
        } finally {
            setButtonLoading(saveButton, false, "SAVE ROLE");
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