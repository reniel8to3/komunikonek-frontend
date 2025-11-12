// js/manage-complaints.js
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
    
    let activeDocId = null; // Store the doc ID for the modal
    let activeDocType = 'complaints'; // Set the collection name

    document.addEventListener('user-loaded', (e) => {
        // Populate the admin's name
        const adminNameEl = document.getElementById('admin-name');
        if (adminNameEl) {
            adminNameEl.textContent = e.detail.userData.firstName || 'Admin';
        }
        
        loadComplaints();
    });

    // --- 2. LOAD ALL COMPLAINTS ---
    async function loadComplaints() {
        if (!tableBody) return;
        tableBody.innerHTML = '<tr><td colspan="5" class="placeholder-cell">Loading complaints...</td></tr>';
        
        try {
            const complaintsRef = collection(db, "complaints");
            // Order by most recent first
            const q = query(complaintsRef, orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="5" class="placeholder-cell">No complaints found.</td></tr>';
                return;
            }

            tableBody.innerHTML = ''; // Clear loading
            
            // Use Promise.all to fetch all user names in parallel for efficiency
            const userFetchPromises = [];
            const complaintData = [];

            querySnapshot.forEach(docSnap => {
                const complaint = docSnap.data();
                complaintData.push({ id: docSnap.id, ...complaint });
                
                // Add a promise to fetch the user's name
                if (complaint.userId) {
                    userFetchPromises.push(getDoc(doc(db, "users", complaint.userId)));
                } else {
                    userFetchPromises.push(null); // Add a null placeholder
                }
            });

            const userDocs = await Promise.all(userFetchPromises);
            
            // Now render the table
            complaintData.forEach((complaint, index) => {
                let complainantName = "Unknown User";
                const userDoc = userDocs[index];
                if (userDoc && userDoc.exists()) {
                    complainantName = userDoc.data().firstName + ' ' + userDoc.data().lastName;
                }
                
                const tr = document.createElement('tr');
                const statusClass = complaint.status.toLowerCase().replace(/\s+/g, '-');
                
                tr.innerHTML = `
                    <td>${complaint.createdAt.toDate().toLocaleDateString()}</td>
                    <td>${complaint.subject}</td>
                    <td class="complainant-name">${complainantName}</td>
                    <td><span class="status-badge ${statusClass}">${complaint.status}</span></td>
                    <td>
                        <button class="action-btn update-btn" data-id="${complaint.id}">Update</button>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
            
            // Add event listeners to the new buttons
            document.querySelectorAll('.update-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    activeDocId = e.target.dataset.id;
                    openUpdateModal(e.target.dataset.id);
                });
            });

        } catch (error) {
            console.error("Error loading complaints: ", error);
            tableBody.innerHTML = '<tr><td colspan="5" class="placeholder-cell">Error loading data.</td></tr>';
        }
    }

    // --- 3. MODAL AND UPDATE LOGIC ---
    
    async function openUpdateModal(docId) {
        if (!docId) return;
        
        // Fetch the current item's data to pre-fill the modal
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

            // Update the document
            await updateDoc(docRef, {
                status: newStatus,
                progress: [...currentProgress, newProgressStep]
            });

            showToast("Status updated successfully!", "success");
            closeModal();
            loadComplaints(); // Refresh the table
            
        } catch (error) {
            console.error("Error updating status:", error);
            showToast("Failed to update status. Please try again.", "error");
        } finally {
            setButtonLoading(saveButton, false, "SAVE UPDATE");
        }
    });

});

// --- UTILITY FUNCTIONS ---
function setButtonLoading(button, isLoading, loadingText = "Loading...") { /* ... same as before ... */ }
function showToast(message, type = 'info') { /* ... same as before ... */ }