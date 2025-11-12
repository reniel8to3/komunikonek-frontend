// js/index.js
import { protectPage, setupLogoutButton } from './auth-guard.js';
import { db, collection, query, where, getDocs, limit, orderBy } from './firebase.js';

let announcementSlideInterval;
let announcementSlideIndex = 0;

// --- 1. PROTECT PAGE & LOAD USER ---
// Protect this page, only allow 'user'
protectPage({ expectedRole: 'user' });

// Listen for the 'user-loaded' event (from auth-guard.js)
document.addEventListener('user-loaded', (e) => {
    const user = e.detail.user;
    const userData = e.detail.userData;
    
    // Populate the header
    const welcomeEl = document.getElementById('user-name');
    if (welcomeEl) {
        // Use their first name if it exists, otherwise use their email
        welcomeEl.textContent = userData.firstName || user.email;
    }
    
    // Load all dashboard data
    loadDashboardData(user.uid);
});

// Activate the logout button
setupLogoutButton();


// --- 2. MAIN DATA FETCHING ---
async function loadDashboardData(userId) {
    // Run all data fetches in parallel
    await Promise.all([
        fetchStats(userId),
        fetchAnnouncements(),
        fetchRecentActivity(userId)
    ]);
}

// --- 3. FETCH STATS WIDGETS ---
async function fetchStats(userId) {
    try {
        // Define references
        const complaintsRef = collection(db, "complaints");
        const requestsRef = collection(db, "document_requests");

        // Create queries
        const pendingComplaintsQuery = query(complaintsRef, where("userId", "==", userId), where("status", "==", "Pending"));
        const pendingRequestsQuery = query(requestsRef, where("userId", "==", userId), where("status", "==", "Pending"));
        const resolvedComplaintsQuery = query(complaintsRef, where("userId", "==", userId), where("status", "==", "Resolved"));
        const resolvedRequestsQuery = query(requestsRef, where("userId", "==", userId), where("status", "==", "Resolved"));

        // Get snapshots
        const [
            pendingComplaintsSnap, 
            pendingRequestsSnap, 
            resolvedComplaintsSnap, 
            resolvedRequestsSnap
        ] = await Promise.all([
            getDocs(pendingComplaintsQuery),
            getDocs(pendingRequestsQuery),
            getDocs(resolvedComplaintsQuery),
            getDocs(resolvedRequestsQuery)
        ]);

        // Calculate totals
        const totalPendingComplaints = pendingComplaintsSnap.size;
        const totalPendingRequests = pendingRequestsSnap.size;
        const totalResolved = resolvedComplaintsSnap.size + resolvedRequestsSnap.size;

        // Update HTML
        document.getElementById('stats-pending-complaints').textContent = totalPendingComplaints;
        document.getElementById('stats-pending-requests').textContent = totalPendingRequests;
        document.getElementById('stats-resolved').textContent = totalResolved;

    } catch (error) {
        console.error("Error fetching stats:", error);
    }
}

// --- 4. FETCH ANNOUNCEMENTS SLIDESHOW ---
async function fetchAnnouncements() {
    const slideshowContainer = document.getElementById('announcements-slideshow');
    const dotsContainer = document.getElementById('announcement-dots');
    
    if (!slideshowContainer || !dotsContainer) return;

    try {
        const announcementsRef = collection(db, "announcements");
        const q = query(announcementsRef, orderBy("createdAt", "desc"), limit(5));
        const querySnapshot = await getDocs(q);

        slideshowContainer.innerHTML = ''; // Clear loading message
        dotsContainer.innerHTML = ''; // Clear dots

        if (querySnapshot.empty) {
            slideshowContainer.innerHTML = '<div class="announcement-slide active"><h4>No Announcements</h4><p>There is no new information at this time.</p></div>';
            return;
        }

        let slideIndex = 0;
        querySnapshot.forEach((doc) => {
            const announcement = doc.data();
            const isActive = slideIndex === 0 ? 'active' : '';

            // Create Slide
            const slide = document.createElement('div');
            slide.className = `announcement-slide ${isActive}`;
            slide.dataset.index = slideIndex;
            slide.innerHTML = `
                <h4>${announcement.title}</h4>
                <p>${announcement.body}</p>
            `;
            slideshowContainer.appendChild(slide);

            // Create Dot
            const dot = document.createElement('span');
            dot.className = `dot ${isActive}`;
            dot.dataset.index = slideIndex;
            dot.addEventListener('click', () => showAnnouncementSlide(dot.dataset.index));
            dotsContainer.appendChild(dot);
            
            slideIndex++;
        });

        // Start the slideshow timer
        startAnnouncementSlideshow();

    } catch (error) {
        console.error("Error fetching announcements:", error);
        slideshowContainer.innerHTML = '<div class="announcement-slide active"><h4>Error</h4><p>Could not load announcements.</p></div>';
    }
}

function showAnnouncementSlide(index) {
    const slides = document.querySelectorAll('#announcements-slideshow .announcement-slide');
    const dots = document.querySelectorAll('#announcement-dots .dot');

    if (slides.length === 0) return;
    
    announcementSlideIndex = Number(index);

    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));

    slides[announcementSlideIndex].classList.add('active');
    dots[announcementSlideIndex].classList.add('active');
    
    resetAnnouncementTimer();
}

function nextAnnouncementSlide() {
    const slides = document.querySelectorAll('#announcements-slideshow .announcement-slide');
    let nextIndex = announcementSlideIndex + 1;
    if (nextIndex >= slides.length) {
        nextIndex = 0;
    }
    showAnnouncementSlide(nextIndex);
}

function startAnnouncementSlideshow() {
    if (announcementSlideInterval) clearInterval(announcementSlideInterval);
    announcementSlideInterval = setInterval(nextAnnouncementSlide, 5000); // Change slide every 5 seconds
}

function resetAnnouncementTimer() {
    clearInterval(announcementSlideInterval);
    announcementSlideInterval = setInterval(nextAnnouncementSlide, 5000);
}


// --- 5. FETCH RECENT ACTIVITY ---
async function fetchRecentActivity(userId) {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;

    try {
        // Get last 2 complaints
        const complaintsRef = collection(db, "complaints");
        const complaintsQuery = query(complaintsRef, where("userId", "==", userId), orderBy("createdAt", "desc"), limit(2));
        
        // Get last 2 document requests
        const requestsRef = collection(db, "document_requests");
        const requestsQuery = query(requestsRef, where("userId", "==", userId), orderBy("createdAt", "desc"), limit(2));

        const [complaintsSnap, requestsSnap] = await Promise.all([
            getDocs(complaintsQuery),
            getDocs(requestsQuery)
        ]);

        let allActivity = [];

        complaintsSnap.forEach(doc => {
            allActivity.push({ ...doc.data(), type: 'complaint', createdAt: doc.data().createdAt.toDate() });
        });

        requestsSnap.forEach(doc => {
            allActivity.push({ ...doc.data(), type: 'request', createdAt: doc.data().createdAt.toDate() });
        });

        // Sort all items by date and take the most recent 3
        allActivity.sort((a, b) => b.createdAt - a.createdAt);
        const recentActivity = allActivity.slice(0, 3);

        // Clear the loading message
        activityList.innerHTML = '';

        if (recentActivity.length === 0) {
            activityList.innerHTML = '<li class="activity-item-placeholder" data-key="activityNone">No recent activity found.</li>';
            // You may need to add 'activityNone' to your translations.js
            return;
        }

        // Render to HTML
        recentActivity.forEach(item => {
            const li = document.createElement('li');
            li.className = 'activity-item';
            
            let iconClass, title;
            if (item.type === 'complaint') {
                iconClass = 'fa-solid fa-bullhorn';
                title = item.subject || 'Complaint Submitted';
            } else {
                iconClass = 'fa-solid fa-file-lines';
                title = item.documentType || 'Document Requested';
            }

            const statusClass = item.status ? item.status.toLowerCase() : 'pending'; // e.g., 'pending', 'resolved'

            li.innerHTML = `
                <div class="activity-info">
                    <i class="${iconClass}"></i>
                    <div class="activity-details">
                        <p>${title}</p>
                        <span class="date">Submitted on ${item.createdAt.toLocaleDateString()}</span>
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