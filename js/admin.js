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
        fetchRecentActivity(),
        fetchAnalytics() // <--- NEW: Load the charts
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
            
            // Create an <a> link tag
            const link = document.createElement('a');
            link.href = 'manage-complaints.html'; 
            link.className = 'activity-item-link'; 

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
            
            link.appendChild(li);
            activityList.appendChild(link);
        });

    } catch (error) {
        console.error("Error fetching recent activity:", error);
        activityList.innerHTML = '<li class="activity-item-placeholder">Could not load activity.</li>';
    }
}

// --- 5. NEW: ANALYTICS CHARTS ---
async function fetchAnalytics() {
    try {
        // Get all complaints to process stats
        // (Note: For huge datasets, use Aggregation Queries, but for now this is fine)
        const complaintsRef = collection(db, "complaints");
        const snapshot = await getDocs(complaintsRef);
        
        const complaints = [];
        snapshot.forEach(doc => complaints.push(doc.data()));

        // Process Data for Charts
        const monthlyData = processMonthlyData(complaints);
        const typeData = processTypeData(complaints);

        // Render Charts
        initActivityChart(monthlyData);
        initTypesChart(typeData);

    } catch (error) {
        console.error("Error loading analytics:", error);
    }
}

// Helper: Group by Month (Jan-Dec)
function processMonthlyData(items) {
    const counts = Array(12).fill(0); // [0, 0, 0, ...] for 12 months
    const currentYear = new Date().getFullYear();

    items.forEach(item => {
        if (item.createdAt) {
            const date = item.createdAt.toDate();
            // Only count this year's data for the line chart
            if (date.getFullYear() === currentYear) {
                counts[date.getMonth()]++; // 0 = Jan, 1 = Feb, etc.
            }
        }
    });
    return counts;
}

// Helper: Group by Type (Noise, Waste, etc.)
function processTypeData(items) {
    const counts = {};
    items.forEach(item => {
        // Normalize type to lowercase to avoid duplicates like "Noise" vs "noise"
        const type = (item.type || 'Other').toLowerCase(); 
        counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
}

// --- Chart 1: Monthly Activity (Line Chart) ---
function initActivityChart(data) {
    const ctx = document.getElementById('activityChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Complaints (2025)',
                data: data,
                borderColor: '#0038A8',
                backgroundColor: 'rgba(0, 56, 168, 0.1)',
                borderWidth: 2,
                tension: 0.4, // Smooth curves
                fill: true,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#0038A8',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }, // Hide top legend
                tooltip: {
                    backgroundColor: '#333',
                    titleFont: { size: 13 },
                    bodyFont: { size: 13 },
                    padding: 10,
                    cornerRadius: 4
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { borderDash: [5, 5], color: '#f0f0f0' },
                    ticks: { stepSize: 1 } // Ensure whole numbers
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

// --- Chart 2: Complaint Types (Doughnut Chart) ---
function initTypesChart(typeCounts) {
    const ctx = document.getElementById('typesChart');
    if (!ctx) return;

    // Define nice colors for known types
    const colorMap = {
        'noise': '#FF6384',   // Red
        'waste': '#36A2EB',   // Blue
        'safety': '#FFCE56',  // Yellow
        'other': '#4BC0C0',   // Teal
        'infrastructure': '#9966FF' // Purple
    };

    // Convert counts object to arrays for Chart.js
    const labels = Object.keys(typeCounts).map(key => key.charAt(0).toUpperCase() + key.slice(1)); // Capitalize
    const data = Object.values(typeCounts);
    const colors = Object.keys(typeCounts).map(key => colorMap[key] || '#cbd5e1'); // Default gray if unknown

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 0, // Cleaner look
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { usePointStyle: true, padding: 20 }
                }
            },
            cutout: '75%', // Makes it a thin ring
        }
    });
}