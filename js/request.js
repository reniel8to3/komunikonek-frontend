// js/request.js
import { protectPage, setupLogoutButton } from './auth-guard.js';
// We only import what we need (no file upload)
import { db, collection, addDoc, serverTimestamp } from './firebase.js';

// We wrap EVERYTHING in a DOMContentLoaded listener.
document.addEventListener('DOMContentLoaded', () => {
    
    let currentUserId = null;

    // --- 1. SET UP THE PAGE ---
    protectPage({ expectedRole: 'user' });
    setupLogoutButton(); // Activates the logout button in your navbar

    // Listen for the 'user-loaded' event from auth-guard.js
    document.addEventListener('user-loaded', (e) => {
        currentUserId = e.detail.user.uid;
        console.log("Request Document page loaded for user:", currentUserId);
    });

    // --- 2. GET FORM & HIDE UPLOAD ---
    const requestForm = document.getElementById('request-form');
    const submitButton = document.querySelector('.form-button-filled');

    // Hide the file upload UI since we aren't using it
    const fileUpload = document.getElementById('file-upload');
    const fileUploadGroup = fileUpload?.closest('.form-group');
    if (fileUploadGroup) {
        fileUploadGroup.style.display = 'none';
    }

    // --- 3. FORM SUBMIT LISTENER ---
    requestForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUserId) {
            showToast("Error: User not identified. Please try logging in again.", "error");
            return;
        }
        
        setButtonLoading(submitButton, true);
        showToast("Submitting request...", "info");

        // --- 4a. GET ELEMENT VALUES ---
        const documentTypeEl = document.getElementById('document-type');
        const purposeEl = document.getElementById('purpose');
        const otherDocumentTypeEl = document.getElementById('other-document-type'); // <-- NEW

        try {
            // --- 4b. Prepare Document Data (UPDATED) ---
            let finalDocumentType = documentTypeEl.value;
            if (finalDocumentType === 'Other') {
                finalDocumentType = otherDocumentTypeEl.value || 'Other (Not Specified)';
            }
            // --- END UPDATE ---

            const newRequest = {
                userId: currentUserId,
                documentType: finalDocumentType, // <-- Uses new variable
                purpose: purposeEl.value,
                fileUrls: [], // Send an empty array
                status: "Pending", 
                createdAt: serverTimestamp(),
                progress: [
                    {
                        status: "Pending",
                        notes: "Your document request has been submitted.",
                        timestamp: new Date() 
                    }
                ]
            };

            // --- 4c. Save to Firestore ---
            const docRef = await addDoc(collection(db, "document_requests"), newRequest);
            
            console.log("Request submitted with ID: ", docRef.id);
            showToast("Request submitted successfully!", "success");

            setTimeout(() => {
                window.location.href = 'my-activity.html#documents'; // Go to activity page, show documents tab
            }, 2000);

        } catch (error) {
            console.error("Error submitting request: ", error);
            showToast("Error submitting request. Please try again.", "error");
            setButtonLoading(submitButton, false);
        }
    });

}); // --- End of DOMContentLoaded listener ---


// --- 5. UTILITY FUNCTIONS (Must be outside the listener) ---
function setButtonLoading(button, isLoading) {
    if (!button) return;
    button.disabled = isLoading;
    button.textContent = isLoading ? "Submitting..." : "SUBMIT REQUEST";
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