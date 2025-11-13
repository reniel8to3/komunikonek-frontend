// js/manage-announcements.js
import { protectPage, setupLogoutButton } from './auth-guard.js';
import { 
    db, 
    collection, 
    query, 
    getDocs, 
    doc, 
    getDoc, 
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    orderBy
} from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SETUP THE PAGE ---
    protectPage({ expectedRole: 'admin' });
    setupLogoutButton();

    const tableBody = document.getElementById('table-body');
    const createNewBtn = document.getElementById('create-new-btn');
    
    // Edit Modal
    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const updateForm = document.getElementById('update-form');
    const modalSaveBtn = document.getElementById('modal-save-btn');
    const titleInput = document.getElementById('modal-title-input');
    const bodyInput = document.getElementById('modal-body');
    const statusInput = document.getElementById('modal-status');
    
    // Delete Modal
    const deleteModalOverlay = document.getElementById('delete-modal-overlay');
    const deleteCancelBtn = document.getElementById('delete-modal-cancel');
    const deleteConfirmBtn = document.getElementById('delete-modal-confirm');
    
    let activeDocId = null; 
    let adminUserId = null;
    let adminName = 'Admin'; // Default author name

    document.addEventListener('user-loaded', (e) => {
        adminUserId = e.detail.user.uid;
        adminName = e.detail.userData.firstName || 'Admin'; // <-- GET ADMIN'S NAME
        
        const adminNameEl = document.getElementById('admin-name');
        if (adminNameEl) {
            adminNameEl.textContent = e.detail.userData.firstName || 'Admin';
        }
        loadAnnouncements();
    });

    // --- 2. LOAD ALL ANNOUNCEMENTS ---
    async function loadAnnouncements() {
        if (!tableBody) return;
        tableBody.innerHTML = '<tr><td colspan="4" class="placeholder-cell">Loading announcements...</td></tr>';
        
        try {
            const announcementsRef = collection(db, "announcements");
            const q = query(announcementsRef, orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="4" class="placeholder-cell">No announcements found.</td></tr>';
                return;
            }

            tableBody.innerHTML = ''; 
            
            for (const docSnap of querySnapshot.docs) {
                const item = docSnap.data();
                const docId = docSnap.id;
                
                const tr = document.createElement('tr');
                const statusClass = item.status.toLowerCase();
                
                tr.innerHTML = `
                    <td>${item.title}</td>
                    <td>${item.createdAt.toDate().toLocaleDateString()}</td>
                    <td><span class="status-badge ${statusClass}">${item.status}</span></td>
                    <td>
                        <div class="action-btn-group">
                            <button class="action-btn edit" data-id="${docId}">Edit</button>
                            <button class="action-btn delete" data-id="${docId}">Delete</button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(tr);
            }
            
            document.querySelectorAll('.edit').forEach(button => {
                button.addEventListener('click', (e) => {
                    openModal(e.target.dataset.id); 
                });
            });
            
            document.querySelectorAll('.delete').forEach(button => {
                button.addEventListener('click', (e) => {
                    openDeleteModal(e.target.dataset.id); 
                });
            });

        } catch (error) {
            console.error("Error loading announcements: ", error);
            tableBody.innerHTML = '<tr><td colspan="4" class="placeholder-cell">Error loading data.</td></tr>';
        }
    }

    // --- 3. MODAL AND CREATE/UPDATE LOGIC ---
    async function openModal(docId = null) {
        activeDocId = docId; 
        
        if (docId) {
            modalTitle.textContent = 'Edit Announcement';
            const docRef = doc(db, "announcements", docId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const item = docSnap.data();
                titleInput.value = item.title;
                bodyInput.value = item.body;
                statusInput.value = item.status;
            }
        } else {
            modalTitle.textContent = 'Create Announcement';
            updateForm.reset(); 
        }
        modalOverlay.classList.add('is-open');
    }

    function closeModal() {
        modalOverlay.classList.remove('is-open');
        activeDocId = null;
    }

    createNewBtn.addEventListener('click', () => openModal()); 
    modalCancelBtn.addEventListener('click', closeModal);

    updateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        setButtonLoading(modalSaveBtn, true, "Saving...");

        const data = {
            title: titleInput.value,
            body: bodyInput.value,
            status: statusInput.value,
            authorId: adminUserId,
            authorName: adminName // <-- ADD THE AUTHOR'S NAME
        };

        try {
            if (activeDocId) {
                data.updatedAt = serverTimestamp();
                const docRef = doc(db, "announcements", activeDocId);
                await updateDoc(docRef, data);
                showToast("Announcement updated successfully!", "success");
            } else {
                data.createdAt = serverTimestamp();
                await addDoc(collection(db, "announcements"), data);
                showToast("Announcement created successfully!", "success");
            }
            
            closeModal();
            loadAnnouncements(); 
            
        } catch (error) {
            console.error("Error saving document:", error);
            showToast("Failed to save. Please try again.", "error");
        } finally {
            setButtonLoading(modalSaveBtn, false, "SAVE");
        }
    });
    
    // --- 4. DELETE LOGIC ---
    function openDeleteModal(docId) {
        activeDocId = docId;
        deleteModalOverlay.classList.add('is-open');
    }
    function closeDeleteModal() {
        deleteModalOverlay.classList.remove('is-open');
        activeDocId = null;
    }
    deleteCancelBtn.addEventListener('click', closeDeleteModal);
    deleteConfirmBtn.addEventListener('click', async () => {
        if (!activeDocId) return;
        
        setButtonLoading(deleteConfirmBtn, true, "Deleting...");
        try {
            await deleteDoc(doc(db, "announcements", activeDocId));
            showToast("Announcement deleted.", "success");
            closeDeleteModal();
            loadAnnouncements(); 
        } catch (error) {
            console.error("Error deleting document:", error);
            showToast("Failed to delete. Please try again.", "error");
        } finally {
            setButtonLoading(deleteConfirmBtn, false, "DELETE");
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