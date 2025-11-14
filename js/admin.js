// js/admin.js
import { protectPage, setupLogoutButton } from './auth-guard.js';
import { db, collection, query, where, getDocs, limit, orderBy } from './firebase.js';

// --- 1. SET UP THE PAGE ---
protectPage({ expectedRole: 'admin' });
setupLogoutButton();

// Listen for the 'user-loaded' event
document.addEventListener('user-loaded', (e) => {
    const userData = e.detail.userData;
    
    // Populate the admin's name in the dropdown
    const adminNameEl = document.getElementById('admin-name');
    if (adminNameEl) {
        adminNameEl.textContent = userData.firstName || 'Admin';
    }
    
    loadAdminDashboard();
});

// --- 2. MAIN DATA FETCHING ---
async function loadAdminDashboard() {
    await Promise.all([
        fetchAdminStats(),
        fetchRecentActivity()
    ]);
}

// --- 3. FETCH STATS ---
async function fetchAdminStats() {
    try {
        const complaintsRef = collection(db, "complaints");
        const requestsRef = collection(db, "document_requests");
        const usersRef = collection(db, "users");

        const pendingComplaintsQuery = query(complaintsRef, where("status", "==", "Pending"));
        const pendingRequestsQuery = query(requestsRef, where("status", "==", "Pending"));
        const allUsersQuery = query(usersRef, where("accountType", "==", "user"));

        const [
            pendingComplaintsSnap, 
            pendingRequestsSnap, 
            allUsersSnap
        ] = await Promise.all([
            getDocs(pendingComplaintsQuery),
            getDocs(pendingRequestsQuery),
            getDocs(allUsersQuery)
        ]);

        document.getElementById('stats-pending-complaints').textContent = pendingComplaintsSnap.size;
        document.getElementById('stats-pending-requests').textContent = pendingRequestsSnap.size;
        document.getElementById('stats-total-users').textContent = allUsersSnap.size;

    } catch (error) {
        console.error("Error fetching admin stats:", error);
    }
}

// --- 4. FETCH RECENT ACTIVITY ---
async function fetchRecentActivity() {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;

    try {
        const complaintsRef = collection(db, "complaints");
        const complaintsQuery = query(complaintsRef, orderBy("createdAt", "desc"), limit(5));
        
        const complaintsSnap = await getDocs(complaintsQuery);

        activityList.innerHTML = ''; 
        
        if (complaintsSnap.empty) {
            activityList.innerHTML = '<li class="activity-item-placeholder">No recent complaints found.</li>';
            return;
        }

        complaintsSnap.forEach(itemDoc => {
            const item = itemDoc.data();
            
            // --- THIS IS THE FIX ---
            // Create an <a> link tag
            const link = document.createElement('a');
            link.href = 'manage-complaints.html'; // Links to the main complaints page
            link.className = 'activity-item-link'; // Use this for styling if needed

            // Create the <li> list item
            const li = document.createElement('li');
            li.className = 'activity-item';
            
            const statusClass = item.status ? item.status.toLowerCase() : 'pending';
            const dateDisplay = item.createdAt ? item.createdAt.toDate().toLocaleDateString() : 'N/A';

            li.innerHTML = `
                <div class="activity-info">
                    <i class="activity-icon fa-solid fa-comment-dots"></i>
                    <div class="activity-details">
                        <p>${item.subject || 'Complaint'}</p>
                        <span class="date">Submitted on: ${dateDisplay}</span>
                    </div>
                </div>
                <span class="activity-status ${statusClass}">${item.status}</span>
            `;
            
            // Append the <li> to the <a>, and the <a> to the list
            link.appendChild(li);
            activityList.appendChild(link);
            // --- END FIX ---
        });

    } catch (error) {
        console.error("Error fetching recent activity:", error);
        activityList.innerHTML = '<li class="activity-item-placeholder">Could not load activity.</li>';
    }
}