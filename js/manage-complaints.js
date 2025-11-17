// js/manage-complaints.js
import { protectPage, setupLogoutButton } from './auth-guard.js';
import { db, collection, query, getDocs, doc, getDoc, updateDoc, where, orderBy } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SETUP THE PAGE ---
    protectPage({ expectedRole: 'admin' });
    setupLogoutButton();

    const tableBody = document.getElementById('table-body');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const updateForm = document.getElementById('update-form');
    const statusFilter = document.getElementById('status-filter');
    
    // --- GLOBALS FOR SORTING & DATA CACHE ---
    let allLoadedData = []; // Caches all fetched/merged data
    let currentSortBy = 'createdAt'; // Default sort field
    let currentSortOrder = 'desc'; // Default sort order

    let activeDocId = null;
    let activeDocType = 'complaints';

    document.addEventListener('user-loaded', (e) => {
        const adminNameEl = document.getElementById('admin-name');
        if (adminNameEl) {
            adminNameEl.textContent = e.detail.userData.firstName || 'Admin';
        }
        
        // Inject admin name into profile dropdown
        const profileDropdown = document.getElementById('profile-dropdown');
        if (profileDropdown) {
             profileDropdown.innerHTML = `<p>Logged in as: <strong>${e.detail.userData.firstName || 'Admin'}</strong></p>`;
        }

        loadComplaints(); // Load all on initial page load
    });
    
    // --- EVENT LISTENER FOR THE FILTER ---
    statusFilter?.addEventListener('change', () => {
        // Filtering REQUIRES a new fetch from Firebase
        loadComplaints(statusFilter.value);
    });

    // --- EVENT LISTENERS FOR TABLE HEADERS (SORTING) ---
    document.querySelectorAll('.sortable-header').forEach(header => {
        header.addEventListener('click', () => {
            const newSortBy = header.dataset.sort;

            if (currentSortBy === newSortBy) {
                // Flip direction
                currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                // Set new sort field
                currentSortBy = newSortBy;
                currentSortOrder = 'asc'; // Default to asc when new field
            }
            
            // Sorting does NOT require a new fetch, just re-render
            renderTable(); 
        });
    });

    // --- 2. LOAD ALL COMPLAINTS (NOW WITH FILTER) ---
    async function loadComplaints(filter = 'all') {
        if (!tableBody) return;
        tableBody.innerHTML = '<tr><td colspan="5" class="placeholder-cell">Loading complaints...</td></tr>';
        
        try {
            const complaintsRef = collection(db, "complaints");
            
            let q;
            if (filter === 'all') {
                // Default query: filter 'all', sort by date (best for performance)
                q = query(complaintsRef, orderBy("createdAt", "desc"));
            } else {
                // Filtered query: also sort by date
                q = query(complaintsRef, where("status", "==", filter), orderBy("createdAt", "desc"));
            }
            
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                tableBody.innerHTML = `<tr><td colspan="5" class="placeholder-cell">No complaints found with status: ${filter}</td></tr>`;
                allLoadedData = []; // Clear cache
                return;
            }

            // --- DATA FETCHING & MERGING ---
            const userFetchPromises = [];
            const complaintData = [];

            querySnapshot.forEach(docSnap => {
                const complaint = docSnap.data();
                complaintData.push({ id: docSnap.id, ...complaint });
                if (complaint.userId) {
                    userFetchPromises.push(getDoc(doc(db, "users", complaint.userId)));
                } else {
                    userFetchPromises.push(null); 
                }
            });

            const userDocs = await Promise.all(userFetchPromises);
            
            // --- Build the allLoadedData cache ---
            allLoadedData = []; // Clear cache before loading
            complaintData.forEach((complaint, index) => {
                let complainantName = "Unknown User";
                const userDoc = userDocs[index];
                if (userDoc && userDoc.exists()) {
                    complainantName = userDoc.data().firstName + ' ' + userDoc.data().lastName;
                }
                
                // Add the merged data to our cache
                allLoadedData.push({
                    ...complaint, // has .subject, .status, .createdAt, etc.
                    id: complaint.id, // Ensure ID is present
                    complainant: complainantName // add the name
                });
            });

            // --- Call renderTable to sort and display ---
            // Set default sort state before first render
            currentSortBy = 'createdAt';
            currentSortOrder = 'desc';
            renderTable();

        } catch (error) {
            console.error("Error loading complaints: ", error);
            tableBody.innerHTML = '<tr><td colspan="5" class="placeholder-cell">Error loading data.</td></tr>';
        }
    }

    // --- NEW FUNCTION: renderTable() ---
    // This function reads from allLoadedData, sorts it, and builds the HTML
    function renderTable() {
        if (!tableBody) return;
        tableBody.innerHTML = ''; // Clear the table

        // Update header UI
        document.querySelectorAll('.sortable-header').forEach(header => {
            if (header.dataset.sort === currentSortBy) {
                header.dataset.order = currentSortOrder;
            } else {
                delete header.dataset.order;
            }
        });

        if (allLoadedData.length === 0) {
            // This case is handled by loadComplaints, but good to have a fallback
            tableBody.innerHTML = `<tr><td colspan="5" class="placeholder-cell">No complaints found.</td></tr>`;
            return;
        }

        // --- THIS IS THE CORE SORTING LOGIC ---
        const sortedData = [...allLoadedData]; // Create a copy to sort
        
        sortedData.sort((a, b) => {
            // Get the values to compare, default to "" if null/undefined
            // Special handling for createdAt
            if (currentSortBy === 'createdAt') {
                const dateA = a.createdAt ? a.createdAt.toDate().getTime() : 0;
                const dateB = b.createdAt ? b.createdAt.toDate().getTime() : 0;
                return currentSortOrder === 'asc' ? dateA - dateB : dateB - dateA;
            }

            // Handle string sorting (subject, complainant)
            const valA = (a[currentSortBy] || "").toString().toLowerCase();
            const valB = (b[currentSortBy] || "").toString().toLowerCase();

            if (valA < valB) {
                return currentSortOrder === 'asc' ? -1 : 1;
            }
            if (valA > valB) {
                return currentSortOrder === 'asc' ? 1 : -1;
            }
            return 0; // they are equal
        });
        // --- END SORTING LOGIC ---


        // --- Render the sorted data ---
        sortedData.forEach(complaint => {
            const tr = document.createElement('tr');
            const status = complaint.status || 'Pending';
            const statusClass = status.toLowerCase().replace(/\s+/g, '-');
            
            tr.innerHTML = `
                <td>${complaint.createdAt ? complaint.createdAt.toDate().toLocaleDateString() : 'N/A'}</td>
                <td>${complaint.subject}</td>
                <td class="complainant-name">${complaint.complainant}</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td> 
                <td>
                    <button class="action-btn update-btn" data-id="${complaint.id}">Update</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
        
        // Re-attach update button listeners
        document.querySelectorAll('.update-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                activeDocId = e.target.dataset.id;
                openUpdateModal(e.target.dataset.id);
            });
        });
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
        // Use the same safety check here
        document.getElementById('modal-status').value = item.status || 'Pending';
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
            loadComplaints(statusFilter.value); // Refresh table
            
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