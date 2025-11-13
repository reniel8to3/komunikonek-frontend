// js/index.js
import { protectPage, setupLogoutButton } from './auth-guard.js';
import { db, collection, query, where, getDocs, limit, orderBy } from './firebase.js';

let announcementSlideInterval;
let announcementSlideIndex = 0;

// --- 1. PROTECT PAGE & LOAD USER ---
protectPage({ expectedRole: 'user' });

document.addEventListener('user-loaded', (e) => {
    const user = e.detail.user;
    const userData = e.detail.userData;
    
    const welcomeEl = document.getElementById('user-name');
    if (welcomeEl) {
        welcomeEl.textContent = userData.firstName || user.email;
    }
    
    loadDashboardData(user.uid);
});

setupLogoutButton();


// --- 2. MAIN DATA FETCHING ---
async function loadDashboardData(userId) {
    await Promise.all([
        fetchStats(userId),
        fetchAnnouncements(),
        fetchRecentActivity(userId)
    ]);
}

// --- 3. FETCH STATS ---
async function fetchStats(userId) {
    try {
        const complaintsRef = collection(db, "complaints");
        const requestsRef = collection(db, "document_requests");

        const pendingComplaintsQuery = query(complaintsRef, where("userId", "==", userId), where("status", "==", "Pending"));
        const pendingRequestsQuery = query(requestsRef, where("userId", "==", userId), where("status", "==", "Pending"));
        const resolvedComplaintsQuery = query(complaintsRef, where("userId", "==", userId), where("status", "==", "Resolved"));
        const resolvedRequestsQuery = query(requestsRef, where("userId", "==", userId), where("status", "==", "Resolved"));

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

        document.getElementById('stats-pending-complaints').textContent = pendingComplaintsSnap.size;
        document.getElementById('stats-pending-requests').textContent = pendingRequestsSnap.size;
        document.getElementById('stats-resolved').textContent = resolvedComplaintsSnap.size + resolvedRequestsSnap.size;

    } catch (error) {
        console.error("Error fetching stats:", error);
    }
}

// --- 4. FETCH ANNOUNCEMENTS (NEWS CARD STYLE) ---
async function fetchAnnouncements() {
    const slideshowContainer = document.getElementById('announcements-slideshow');
    const dotsContainer = document.getElementById('announcement-dots');
    
    if (!slideshowContainer || !dotsContainer) return;

    try {
        const announcementsRef = collection(db, "announcements");
        const q = query(announcementsRef, orderBy("createdAt", "desc"), limit(5));
        const querySnapshot = await getDocs(q);

        slideshowContainer.innerHTML = ''; 
        dotsContainer.innerHTML = ''; 

        if (querySnapshot.empty) {
            slideshowContainer.innerHTML = `
                <div class="announcement-slide active empty-state">
                    <div class="icon-circle"><i class="fa-solid fa-bell-slash"></i></div>
                    <h4>No Announcements</h4>
                    <p>There is no new information at this time.</p>
                </div>`;
            return;
        }

        let slideIndex = 0;
        querySnapshot.forEach((doc) => {
            const announcement = doc.data();
            const isActive = slideIndex === 0 ? 'active' : '';
            
            // Format Date
            const dateStr = announcement.createdAt ? announcement.createdAt.toDate().toLocaleDateString('en-US', { 
                year: 'numeric', month: 'long', day: 'numeric' 
            }) : 'Just now';

            // Get author name, default to 'Admin'
            const author = announcement.authorName || 'Admin';
            
            // Create a placeholder image (you can change this URL later)
            const imageUrl = `https://placehold.co/600x400/0038A8/FFFFFF?text=${encodeURIComponent(announcement.title.substring(0, 10))}`;

            // Create Slide
            const slide = document.createElement('div');
            slide.className = `announcement-slide ${isActive}`;
            slide.dataset.index = slideIndex;
            
            // --- THIS HTML MATCHES THE NEW CSS ---
            slide.innerHTML = `
                <img class="announcement-image" src="${imageUrl}" alt="${announcement.title}">
                <div class="announcement-content">
                    <span class="announcement-date"><i class="fa-regular fa-calendar"></i> ${dateStr}</span>
                    <h4 class="announcement-title">${announcement.title}</h4>
                    <div class="announcement-body">${announcement.body}</div>
                    <div class="announcement-footer">
                        <span class="announcement-author">Posted by: <strong>${author}</strong></span>
                    </div>
                </div>
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
    announcementSlideInterval = setInterval(nextAnnouncementSlide, 6000); 
}

function resetAnnouncementTimer() {
    clearInterval(announcementSlideInterval);
    announcementSlideInterval = setInterval(nextAnnouncementSlide, 6000);
}


// --- 5. FETCH RECENT ACTIVITY ---
async function fetchRecentActivity(userId) {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;

    try {
        const complaintsRef = collection(db, "complaints");
        const complaintsQuery = query(complaintsRef, where("userId", "==", userId), orderBy("createdAt", "desc"), limit(2));
        
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

        allActivity.sort((a, b) => b.createdAt - a.createdAt);
        const recentActivity = allActivity.slice(0, 3);

        activityList.innerHTML = '';

        if (recentActivity.length === 0) {
            activityList.innerHTML = '<li class="activity-item-placeholder" data-key="activityNone">No recent activity found.</li>';
            return;
        }

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

            const statusClass = item.status ? item.status.toLowerCase() : 'pending'; 

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