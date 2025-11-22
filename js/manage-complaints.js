import { protectPage, setupLogoutButton } from './auth-guard.js';
import { db, collection, query, getDocs, doc, getDoc, updateDoc, where, orderBy } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SETUP THE PAGE ---
    protectPage({ expectedRole: 'admin' });
    setupLogoutButton();

    const tableBody = document.getElementById('table-body');
    const modalOverlay = document.getElementById('status-modal');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const updateForm = document.getElementById('status-form');
    const statusFilter = document.getElementById('status-filter');
    
    let allLoadedData = []; 
    let currentSortBy = 'createdAt'; 
    let currentSortOrder = 'desc'; 
    let activeDocId = null;

    document.addEventListener('user-loaded', (e) => {
        const adminNameEl = document.getElementById('admin-name');
        if (adminNameEl) {
            adminNameEl.textContent = e.detail.userData.firstName || 'Admin';
        }
        loadComplaints(); 
    });
    
    statusFilter?.addEventListener('change', () => {
        loadComplaints(statusFilter.value);
    });

    document.querySelectorAll('.sortable-header').forEach(header => {
        header.addEventListener('click', () => {
            const newSortBy = header.dataset.sort;
            if (currentSortBy === newSortBy) {
                currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortBy = newSortBy;
                currentSortOrder = 'asc';
            }
            renderTable(); 
        });
    });

    // --- 2. LOAD ALL COMPLAINTS ---
    async function loadComplaints(filter = 'all') {
        if (!tableBody) return;
        tableBody.innerHTML = '<tr><td colspan="6" class="placeholder-cell">Loading complaints...</td></tr>';
        
        try {
            const complaintsRef = collection(db, "complaints");
            let q;
            if (filter === 'all') {
                q = query(complaintsRef, orderBy("createdAt", "desc"));
            } else {
                q = query(complaintsRef, where("status", "==", filter), orderBy("createdAt", "desc"));
            }
            
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                tableBody.innerHTML = `<tr><td colspan="6" class="placeholder-cell">No complaints found.</td></tr>`;
                allLoadedData = []; 
                return;
            }

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
            
            allLoadedData = []; 
            complaintData.forEach((complaint, index) => {
                let complainantName = "Unknown User";
                const userDoc = userDocs[index];
                if (userDoc && userDoc.exists()) {
                    complainantName = userDoc.data().firstName + ' ' + userDoc.data().lastName;
                }
                
                allLoadedData.push({
                    ...complaint, 
                    id: complaint.id, 
                    complainant: complainantName
                });
            });

            currentSortBy = 'createdAt';
            currentSortOrder = 'desc';
            renderTable();

        } catch (error) {
            console.error("Error loading complaints: ", error);
            tableBody.innerHTML = '<tr><td colspan="6" class="placeholder-cell">Error loading data.</td></tr>';
        }
    }

    // --- RENDER TABLE ---
    function renderTable() {
        if (!tableBody) return;
        tableBody.innerHTML = ''; 

        const sortedData = [...allLoadedData]; 
        sortedData.sort((a, b) => {
            if (currentSortBy === 'createdAt') {
                const dateA = a.createdAt ? a.createdAt.toDate().getTime() : 0;
                const dateB = b.createdAt ? b.createdAt.toDate().getTime() : 0;
                return currentSortOrder === 'asc' ? dateA - dateB : dateB - dateA;
            }
            const valA = (a[currentSortBy] || "").toString().toLowerCase();
            const valB = (b[currentSortBy] || "").toString().toLowerCase();
            if (valA < valB) return currentSortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return currentSortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        if (sortedData.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="placeholder-cell">No complaints found.</td></tr>`;
            return;
        }

        sortedData.forEach(complaint => {
            const tr = document.createElement('tr');
            const status = complaint.status || 'Pending';
            const type = complaint.type || 'Other';
            
            // Status Color Logic (Matches CSS classes in admin-tables.css)
            let statusClass = 'pending';
            const s = status.toLowerCase();
            if(s === 'resolved') statusClass = 'resolved';
            if(s === 'approved') statusClass = 'approved';
            if(s === 'processing') statusClass = 'processing';
            if(s === 'rejected') statusClass = 'rejected';

            tr.innerHTML = `
                <td>${complaint.createdAt ? complaint.createdAt.toDate().toLocaleDateString() : 'N/A'}</td>
                <td style="font-weight:600; color:#333;">${complaint.subject}</td>
                <td><span class="type-badge">${type}</span></td>
                <td class="complainant-name">${complaint.complainant}</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td> 
                <td>
                    <button class="action-btn update-btn" data-id="${complaint.id}">Update</button>
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
    }

    // --- 3. MODAL LOGIC ---
    async function openUpdateModal(docId) {
        if (!docId) return;
        const docRef = doc(db, "complaints", docId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return;
        
        const item = docSnap.data();
        document.getElementById('modal-status-select').value = item.status || 'Pending';
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
        saveButton.textContent = "Saving...";
        saveButton.disabled = true;

        const newStatus = document.getElementById('modal-status-select').value;
        const newNotes = document.getElementById('modal-notes').value;

        try {
            const docRef = doc(db, "complaints", activeDocId);
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

            alert("Status updated successfully!");
            closeModal();
            loadComplaints(statusFilter.value); 
            
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status.");
        } finally {
            saveButton.textContent = "SAVE UPDATE";
            saveButton.disabled = false;
        }
    });
});