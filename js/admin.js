// js/admin.js
import { protectPage, setupLogoutButton } from './auth-guard.js';
// Note: We are not sorting by time in the query to avoid Index errors for now.
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
    
    // Now that admin is verified, load the data
    loadAdminDashboard();
});

// --- 2. MAIN DATA FETCHING ---
async function loadAdminDashboard() {
    // Run all data fetches in parallel
    await Promise.all([
        fetchAdminStats(),
        fetchRecentActivity()
    ]);
}

// --- 3. FETCH STATS ---
async function fetchAdminStats() {
    try {
        // Define references
        const complaintsRef = collection(db, "complaints");
        const requestsRef = collection(db, "document_requests");
        const usersRef = collection(db, "users");

        // Create queries
        const pendingComplaintsQuery = query(complaintsRef, where("status", "==", "Pending"));
        const pendingRequestsQuery = query(requestsRef, where("status", "==", "Pending"));
        const allUsersQuery = query(usersRef, where("accountType", "==", "user"));

        // Get snapshots
        const [
            pendingComplaintsSnap, 
            pendingRequestsSnap, 
            allUsersSnap
        ] = await Promise.all([
            getDocs(pendingComplaintsQuery),
            getDocs(pendingRequestsQuery),
            getDocs(allUsersQuery)
        ]);

        // Update HTML
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
        // Get recent complaints (limit to 20 to sort client-side)
        const complaintsRef = collection(db, "complaints");
        const complaintsQuery = query(complaintsRef, limit(20)); 
        
        const complaintsSnap = await getDocs(complaintsQuery);

        activityList.innerHTML = ''; // Clear loading
        
        if (complaintsSnap.empty) {
            activityList.innerHTML = '<li class="activity-item-placeholder">No recent complaints found.</li>';
            return;
        }

        // Sort in JavaScript with Safety Check
        let complaints = [];
        complaintsSnap.forEach(doc => complaints.push(doc.data()));
        
        // --- THIS IS THE FIX ---
        complaints.sort((a, b) => {
            // If createdAt is missing, treat it as a very old date (0)
            const dateA = a.createdAt ? a.createdAt.toDate() : new Date(0);
            const dateB = b.createdAt ? b.createdAt.toDate() : new Date(0);
            return dateB - dateA; // Newest first
        });
        // --- END FIX ---
        
        // Take just the first 5
        const recentComplaints = complaints.slice(0, 5);

        // Render to HTML
        recentComplaints.forEach(item => {
            const li = document.createElement('li');
            li.className = 'activity-item';
            
            const statusClass = item.status ? item.status.toLowerCase() : 'pending';
            
            // Safety check for date display
            const dateDisplay = item.createdAt ? item.createdAt.toDate().toLocaleDateString() : 'N/A';

            li.innerHTML = `
                <div class="activity-info">
                    <i class="activity-icon fa-solid fa-bullhorn"></i>
                    <div class="activity-details">
                        <p>${item.subject || 'Complaint'}</p>
                        <span class="date">Submitted on: ${dateDisplay}</span>
                    </div>
                </div>
                <span class="activity-status ${statusClass}">${item.status}</span>
            `;
            activityList.appendChild(li);
        });

    } catch (error) {
        console.error("Error fetching recent activity:", error);
        activityList.innerHTML = '<li class="activity-item-placeholder">Could not load activity.</li>';
    }
}