// js/submit-complaint.js
import { protectPage, setupLogoutButton } from './auth-guard.js';
import { db, collection, addDoc, serverTimestamp } from './firebase.js';

// We wrap EVERYTHING in a DOMContentLoaded listener.
document.addEventListener('DOMContentLoaded', () => {
    
    let currentUserId = null;

    // --- 1. SET UP THE PAGE ---
    protectPage({ expectedRole: 'user' });
    setupLogoutButton(); 

    document.addEventListener('user-loaded', (e) => {
        currentUserId = e.detail.user.uid;
        console.log("Submit Complaint page loaded for user:", currentUserId);
    });

    // --- 2. GET FORM & HIDE UPLOAD ---
    const complaintForm = document.getElementById('complaint-form');
    const submitButton = document.querySelector('.form-button-filled');
    const fileUpload = document.getElementById('file-upload');
    const fileUploadGroup = fileUpload?.closest('.form-group');
    if (fileUploadGroup) {
        fileUploadGroup.style.display = 'none';
    }

    // --- 3. FORM SUBMIT LISTENER ---
    complaintForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUserId) {
            showToast("Error: User not identified. Please try logging in again.", "error");
            return;
        }
        
        setButtonLoading(submitButton, true);
        showToast("Submitting complaint...", "info");

        // --- 4a. GET ELEMENT VALUES ---
        const complaintType = document.getElementById('complaint-type');
        const otherComplaintType = document.getElementById('other-complaint-type');
        const complaintSubject = document.getElementById('subject'); 
        const incidentDate = document.getElementById('incident-date');
        const complaintDescription = document.getElementById('description'); 

        try {
            // --- 4b. Prepare Complaint Data ---
            let finalComplaintType = complaintType.value;
            if (finalComplaintType === 'other') {
                finalComplaintType = otherComplaintType.value || 'Other';
            }

            const newComplaint = {
                userId: currentUserId,
                type: finalComplaintType,
                subject: complaintSubject.value,
                incidentDate: incidentDate.value,
                description: complaintDescription.value,
                fileUrls: [], 
                status: "Pending", 
                createdAt: serverTimestamp(), // This one is correct
                progress: [
                    {
                        status: "Pending",
                        notes: "Your complaint has been submitted and is awaiting review.",
                        // --- THIS IS THE FIX ---
                        timestamp: new Date() // Changed from serverTimestamp()
                        // --- END FIX ---
                    }
                ]
            };

            // --- 4c. Save to Firestore ---
            const docRef = await addDoc(collection(db, "complaints"), newComplaint);
            
            console.log("Complaint submitted with ID: ", docRef.id);
            showToast("Complaint submitted successfully!", "success");

            setTimeout(() => {
                window.location.href = 'my-activity.html';
            }, 2000);

        } catch (error) {
            console.error("Error submitting complaint: ", error);
            showToast("Error submitting complaint. Please try again.", "error");
            setButtonLoading(submitButton, false);
        }
    });

}); // --- End of DOMContentLoaded listener ---


// --- 5. UTILITY FUNCTIONS (Must be outside the listener) ---
function setButtonLoading(button, isLoading) {
    if (!button) return;
    button.disabled = isLoading;
    button.textContent = isLoading ? "Submitting..." : "SUBMIT COMPLAINT";
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