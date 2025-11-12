// js/my-activity.js
import { protectPage, setupLogoutButton } from './auth-guard.js';
// We REMOVED orderBy from the import, as we won't use it in the query
import { db, collection, query, where, getDocs } from './firebase.js'; 

document.addEventListener("DOMContentLoaded", function() {

    const tabs = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");
    const complaintsList = document.getElementById('complaints-list');
    const documentsList = document.getElementById('documents-list');

    let currentUserId = null;

    // --- 1. SECURE THE PAGE & GET USER ---
    protectPage({ expectedRole: 'user' });
    setupLogoutButton();

    document.addEventListener('user-loaded', (e) => {
        currentUserId = e.detail.user.uid;
        console.log("My Activity page loaded for user:", currentUserId);
        
        // Now that we have the user, fetch their activity
        fetchMyActivity(currentUserId);
    });

    // --- 2. FETCH DATA FROM FIRESTORE ---
    async function fetchMyActivity(userId) {
        if (!userId) return;
        
        // Run fetches in parallel
        await Promise.all([
            fetchComplaints(userId),
            fetchDocuments(userId)
        ]);
    }

    async function fetchComplaints(userId) {
        if (!complaintsList) return;
        
        try {
            const complaintsRef = collection(db, "complaints");
            // --- THIS IS THE FIX ---
            // We REMOVED the orderBy("createdAt", "desc") from the query
            const q = query(complaintsRef, 
                        where("userId", "==", userId));
            
            const querySnapshot = await getDocs(q);
            
            complaintsList.innerHTML = ''; 
            
            if (querySnapshot.empty) {
                complaintsList.innerHTML = '<li class="activity-placeholder">You have not submitted any complaints.</li>';
                return;
            }

            // --- NEW: Sort the results in JavaScript ---
            const complaints = [];
            querySnapshot.forEach((doc) => {
                complaints.push({ id: doc.id, ...doc.data() });
            });
            // Now we sort the array by the createdAt date, newest first
            complaints.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
            // --- END NEW ---

            // Now we loop over the *sorted* array
            for (const complaint of complaints) {
                const card = createActivityCard(complaint, 'complaint');
                complaintsList.appendChild(card);
            }

        } catch (error) {
            console.error("Error fetching complaints:", error);
            complaintsList.innerHTML = '<li class="activity-placeholder">Error loading complaints.</li>';
        }
    }

    async function fetchDocuments(userId) {
        if (!documentsList) return;

        try {
            const requestsRef = collection(db, "document_requests");
            // --- THIS IS THE FIX ---
            // We REMOVED the orderBy("createdAt", "desc") from the query
            const q = query(requestsRef, 
                        where("userId", "==", userId));

            const querySnapshot = await getDocs(q);

            documentsList.innerHTML = ''; 

            if (querySnapshot.empty) {
                documentsList.innerHTML = '<li class="activity-placeholder">You have not requested any documents.</li>';
                return;
            }

            // --- NEW: Sort the results in JavaScript ---
            const requests = [];
            querySnapshot.forEach((doc) => {
                requests.push({ id: doc.id, ...doc.data() });
            });
            requests.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
            // --- END NEW ---

            // Now we loop over the *sorted* array
            for (const request of requests) {
                const card = createActivityCard(request, 'document');
                documentsList.appendChild(card);
            }

        } catch (error) {
            console.error("Error fetching documents:", error);
            documentsList.innerHTML = '<li class="activity-placeholder">Error loading document requests.</li>';
        }
    }

    // --- 3. CREATE HTML FOR ACTIVITY CARDS ---
    function createActivityCard(item, type) {
        // --- THIS MAKES IT CLICKABLE ---
        const link = document.createElement('a');
        link.className = 'activity-card-link';
        // Pass the id and type in the URL
        link.href = `activity-detail.html?id=${item.id}&type=${type}`;
        
        const li = document.createElement('li');
        li.className = 'activity-card';

        const iconClass = (type === 'complaint') ? 'fa-bullhorn' : 'fa-file-lines';
        let title = (type === 'complaint') ? item.subject : item.documentType;
        let subtext = (type === 'complaint') ? `Incident Date: ${item.incidentDate}` : `Purpose: ${item.purpose}`;
        
        if (!title) title = (type === 'complaint') ? "Complaint" : "Document Request";
        if (!subtext) subtext = "No details provided.";

        const status = item.status || 'Pending';
        const statusClass = status.toLowerCase().replace(/\s+/g, '-'); 

        li.innerHTML = `
            <div class="activity-info">
                <i class="activity-icon fa-solid ${iconClass}"></i>
                <div class="activity-details">
                    <h3>${title}</h3>
                    <p>${subtext}</p>
                    <p class="date">Submitted on: ${item.createdAt ? item.createdAt.toDate().toLocaleDateString() : 'N/A'}</p>
                </div>
            </div>
            <span class="activity-status ${statusClass}">${status}</span>
        `;
        
        link.appendChild(li);
        return link; // Return the link, not the li
    }


    // --- 4. TAB SWITCHING LOGIC (Your code) ---
    function showTab(tabId) {
        const targetContent = document.getElementById(tabId);
        
        tabs.forEach(t => t.classList.remove("active"));
        tabContents.forEach(c => c.classList.remove("active"));

        const activeButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
        if(activeButton) activeButton.classList.add("active");
        if(targetContent) targetContent.classList.add("active");
    }

    if (tabs.length > 0 && tabContents.length > 0) {
        tabs.forEach(tab => {
            tab.addEventListener("click", function(e) {
                e.preventDefault(); 
                const targetId = this.getAttribute("data-tab");
                window.location.hash = targetId; // Set the hash
                showTab(targetId);
            });
        });
    }

    // Check URL hash on page load
    if (window.location.hash === '#documents') {
        showTab('documents');
    } else {
        showTab('complaints'); // Default tab
    }

});