// js/activity-detail.js
import { protectPage, setupLogoutButton } from './auth-guard.js';
import { db, doc, getDoc } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
    
    let currentUserId = null;

    // --- 1. SET UP THE PAGE ---
    protectPage({ expectedRole: 'user' });
    setupLogoutButton();

    document.addEventListener('user-loaded', (e) => {
        currentUserId = e.detail.user.uid;
        // Now that we have the user, get the item ID from the URL
        loadItemDetails();
    });

    // --- 2. GET ITEM ID FROM URL ---
    async function loadItemDetails() {
        const params = new URLSearchParams(window.location.search);
        const itemId = params.get('id');
        const itemType = params.get('type'); // 'complaint' or 'document'

        if (!itemId || !itemType) {
            document.getElementById('detail-title').textContent = "Error";
            document.getElementById('info-list').innerHTML = '<li>Invalid link. No ID provided.</li>';
            return;
        }

        // Determine the correct collection
        const collectionName = (itemType === 'complaint') ? 'complaints' : 'document_requests';

        // --- 3. FETCH THE DOCUMENT FROM FIRESTORE ---
        try {
            const docRef = doc(db, collectionName, itemId);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                document.getElementById('detail-title').textContent = "Error";
                document.getElementById('info-list').innerHTML = '<li>Item not found.</li>';
                return;
            }

            const item = docSnap.data();

            // Security Check: Make sure this item belongs to the logged-in user
            if (item.userId !== currentUserId) {
                document.getElementById('detail-title').textContent = "Access Denied";
                document.getElementById('info-list').innerHTML = '<li>You do not have permission to view this item.</li>';
                return;
            }

            // --- 4. RENDER THE PAGE ---
            renderPageDetails(item, itemType);
            renderTimeline(item.progress);

        } catch (error) {
            console.error("Error fetching document:", error);
            document.getElementById('detail-title').textContent = "Error";
            document.getElementById('info-list').innerHTML = '<li>Could not load item details.</li>';
        }
    }

    // --- 5. RENDER FUNCTIONS ---
    function renderPageDetails(item, type) {
        const title = (type === 'complaint') ? item.subject : item.documentType;
        const status = item.status || 'Pending';
        const statusClass = status.toLowerCase().replace(/\s+/g, '-');
        
        document.getElementById('detail-title').textContent = title;
        document.getElementById('detail-created-at').textContent = item.createdAt.toDate().toLocaleString();
        
        const statusEl = document.getElementById('detail-status');
        statusEl.textContent = status;
        statusEl.className = `activity-status ${statusClass}`; // Update class for color

        // Build the details list
        const infoList = document.getElementById('info-list');
        infoList.innerHTML = ''; // Clear
        
        if (type === 'complaint') {
            infoList.innerHTML = `
                <li><span>Type</span> ${item.type}</li>
                <li><span>Incident Date</span> ${item.incidentDate}</li>
                <li><span>Description</span> ${item.description || 'N/A'}</li>
            `;
        } else {
            infoList.innerHTML = `
                <li><span>Document</span> ${item.documentType}</li>
                <li><span>Purpose</span> ${item.purpose || 'N/A'}</li>
            `;
        }
    }

    function renderTimeline(progressArray) {
        const timelineList = document.getElementById('timeline-list');
        timelineList.innerHTML = ''; // Clear

        if (!progressArray || progressArray.length === 0) {
            timelineList.innerHTML = '<li>No progress updates found.</li>';
            return;
        }
        
        // Sort by timestamp just in case
        progressArray.sort((a, b) => a.timestamp.toDate() - b.timestamp.toDate());

        progressArray.forEach(step => {
            const li = document.createElement('li');
            li.className = 'timeline-item';
            li.innerHTML = `
                <h4>${step.status}</h4>
                <p>${step.notes}</p>
                <span class="date">${step.timestamp.toDate().toLocaleString()}</span>
            `;
            timelineList.appendChild(li);
        });
    }

});