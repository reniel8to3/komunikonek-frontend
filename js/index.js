// js/index.js
import { protectPage, setupLogoutButton } from './auth-guard.js';
import { db, collection, query, where, getDocs, limit, orderBy, getCountFromServer } from './firebase.js';

let announcementSlideInterval;
let announcementSlideIndex = 0;

// --- 1. PROTECT PAGE & LOAD USER ---
protectPage({ expectedRole: 'user' });

document.addEventListener('user-loaded', (e) => {
    const user = e.detail.user;
    const userData = e.detail.userData;
    
    const welcomeEl = document.getElementById('user-name');
    if (welcomeEl) {
        welcomeEl.textContent = userData.firstName || user.email.split('@')[0];
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
        const resolvedRequestsQuery = query(requestsRef, where("userId", "==", userId), where("status", "in", ["Resolved", "Completed"]));

        const [
            pendingComplaintsSnap, 
            pendingRequestsSnap, 
            resolvedComplaintsSnap, 
            resolvedRequestsSnap
        ] = await Promise.all([
            getCountFromServer(pendingComplaintsQuery),
            getCountFromServer(pendingRequestsQuery),
            getCountFromServer(resolvedComplaintsQuery), 
            getCountFromServer(resolvedRequestsQuery)
        ]);

        document.getElementById('stats-pending-complaints').textContent = pendingComplaintsSnap.data().count;
        document.getElementById('stats-pending-requests').textContent = pendingRequestsSnap.data().count;
        document.getElementById('stats-resolved').textContent = resolvedComplaintsSnap.data().count + resolvedRequestsSnap.data().count;

    } catch (error) {
        console.error("Error fetching stats:", error);
    }
}

// --- 4. FETCH ANNOUNCEMENTS (NEW CARD STYLE) ---
async function fetchAnnouncements() {
    const slideshowContainer = document.getElementById('announcements-slideshow');
    const dotsContainer = document.getElementById('announcement-dots');
    
    if (!slideshowContainer || !dotsContainer) return;

    try {
        const announcementsRef = collection(db, "announcements");
        const q = query(announcementsRef, where("status", "==", "Published"));
        const querySnapshot = await getDocs(q);

        slideshowContainer.innerHTML = ''; 
        dotsContainer.innerHTML = ''; 

        if (querySnapshot.empty) {
            slideshowContainer.innerHTML = `
                <div class="announcement-slide active" style="display:block; text-align:center; padding:30px;">
                    <h4 style="color:#666;">No active announcements.</h4>
                </div>`;
            return;
        }

        let announcements = [];
        querySnapshot.forEach(doc => {
            announcements.push({ id: doc.id, ...doc.data() });
        });

        announcements.sort((a, b) => {
            const dateA = a.createdAt ? a.createdAt.toMillis() : 0;
            const dateB = b.createdAt ? b.createdAt.toMillis() : 0;
            return dateB - dateA; 
        });

        const recentAnnouncements = announcements.slice(0, 5);

        let slideIndex = 0;
        let slidesHTML = '';
        let dotsHTML = '';

        recentAnnouncements.forEach((data) => {
            const isActive = slideIndex === 0 ? 'active' : '';
            
            const dateStr = data.createdAt ? data.createdAt.toDate().toLocaleDateString('en-US', { 
                year: 'numeric', month: 'long', day: 'numeric' 
            }) : 'Just now';

            const author = data.authorName || 'Admin';
            
            // --- IMAGE LOGIC ---
            let imageStyle = ''; 
            // Generate Initials: Take first 2 letters of title
            let initials = data.title ? data.title.substring(0, 2).toUpperCase() : 'AN';
            let imageContent = `<h2>${initials}</h2>`; 
            
            if (data.imageUrl) {
                imageStyle = `background-image: url('${data.imageUrl}');`;
                imageContent = ''; 
            }

            const description = data.shortDescription || data.body || 'Click to read more...';

            slidesHTML += `
                <div class="announcement-slide ${isActive}" data-index="${slideIndex}" onclick="viewAnnouncement('${data.title}', '${data.body?.replace(/'/g, "\\'")}')">
                    <div class="announcement-image-box" style="${imageStyle}">
                        ${imageContent}
                    </div>
                    <div class="announcement-content">
                        <div class="ann-date"><i class="fa-regular fa-calendar"></i> ${dateStr}</div>
                        <h3 class="ann-title">${data.title}</h3>
                        <p class="ann-short-desc">${description}</p>
                        <div class="ann-footer">
                            <div class="ann-author">Posted by: <strong>${author}</strong></div>
                            <span class="read-more-btn">Read More</span>
                        </div>
                    </div>
                </div>
            `;

            dotsHTML += `<span class="dot ${isActive}" data-index="${slideIndex}"></span>`;
            slideIndex++;
        });

        slideshowContainer.innerHTML = slidesHTML;
        dotsContainer.innerHTML = dotsHTML;

        document.querySelectorAll('.dot').forEach(dot => {
            dot.addEventListener('click', (e) => showAnnouncementSlide(e.target.dataset.index));
        });

        startAnnouncementSlideshow();

    } catch (error) {
        console.error("Error fetching announcements:", error);
        slideshowContainer.innerHTML = '<div class="announcement-slide active"><h4>Error loading announcements.</h4></div>';
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
    if (!slides.length) return;
    
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

// Function to handle click (Simple Alert for now)
window.viewAnnouncement = (title, body) => {
    alert(`📢 ${title}\n\n${body}`);
};


// --- 5. FETCH RECENT ACTIVITY ---
async function fetchRecentActivity(userId) {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;

    try {
        const complaintsRef = collection(db, "complaints");
        const qC = query(complaintsRef, where("userId", "==", userId));
        const requestsRef = collection(db, "document_requests");
        const qD = query(requestsRef, where("userId", "==", userId));

        const [snapC, snapD] = await Promise.all([getDocs(qC), getDocs(qD)]);

        let allActivity = [];

        snapC.forEach(doc => {
            const d = doc.data();
            if(d.createdAt) allActivity.push({ ...d, type: 'complaint', createdAt: d.createdAt.toDate() });
        });

        snapD.forEach(doc => {
            const d = doc.data();
            if(d.createdAt) allActivity.push({ ...d, type: 'request', createdAt: d.createdAt.toDate() });
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
                    <div class="activity-icon">
                        <i class="${iconClass}"></i>
                    </div>
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