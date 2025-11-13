// js/request.js
import { protectPage, setupLogoutButton } from './auth-guard.js';
import { db, collection, addDoc, serverTimestamp } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
    
    let currentUserId = null;

    // --- 1. SET UP THE PAGE ---
    protectPage({ expectedRole: 'user' });
    setupLogoutButton(); 

    document.addEventListener('user-loaded', (e) => {
        currentUserId = e.detail.user.uid;
        console.log("Request Document page loaded for user:", currentUserId);
    });

    // --- 2. GET FORM ELEMENTS ---
    const requestForm = document.getElementById('request-form');
    const submitButton = document.querySelector('.form-button-filled');
    const purposeInput = document.getElementById('purpose');
    const charCounter = document.getElementById('purpose-char-counter');
    
    // --- 3. HIDE UPLOAD & SETUP COUNTER ---
    const fileUploadGroup = document.getElementById('file-upload')?.closest('.form-group');
    if (fileUploadGroup) {
        fileUploadGroup.style.display = 'none';
    }

    purposeInput?.addEventListener('input', () => {
        const len = purposeInput.value.length;
        charCounter.textContent = `${len}/1000`;
        charCounter.style.color = len > 950 ? '#CE1126' : '#6c757d';
    });


    // --- 4. FORM SUBMIT LISTENER ---
    requestForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // --- 4a. VALIDATION ---
        let isValid = true;
        if (purposeInput.value.trim() === '') {
            setError(purposeInput, "Purpose is required.");
            isValid = false;
        } else {
            setSuccess(purposeInput);
        }

        if (!isValid) {
            showToast("Please fill in all required fields.", "error");
            return;
        }
        // --- END VALIDATION ---

        if (!currentUserId) {
            showToast("Error: User not identified. Please try logging in again.", "error");
            return;
        }
        
        setButtonLoading(submitButton, true, "Submitting...");

        const documentTypeEl = document.getElementById('document-type');
        const otherDocumentTypeEl = document.getElementById('other-document-type');

        try {
            let finalDocumentType = documentTypeEl.value;
            if (finalDocumentType === 'Other') {
                finalDocumentType = otherDocumentTypeEl.value || 'Other (Not Specified)';
            }

            const newRequest = {
                userId: currentUserId,
                documentType: finalDocumentType,
                purpose: purposeInput.value,
                fileUrls: [], 
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

            const docRef = await addDoc(collection(db, "document_requests"), newRequest);
            
            console.log("Request submitted with ID: ", docRef.id);
            showToast("Request submitted successfully!", "success");

            setTimeout(() => {
                window.location.href = 'my-activity.html#documents'; 
            }, 2000);

        } catch (error) {
            console.error("Error submitting request: ", error);
            showToast("Error submitting request. Please try again.", "error");
            setButtonLoading(submitButton, false, "SUBMIT REQUEST");
        }
    });

}); // --- End of DOMContentLoaded listener ---


// --- 5. UTILITY FUNCTIONS ---
function setButtonLoading(button, isLoading, loadingText = "Submitting...") {
    if (!button) return;
    const originalText = button.dataset.originalText || "SUBMIT REQUEST";
    if (!button.dataset.originalText) {
        button.dataset.originalText = button.textContent;
    }
    
    button.disabled = isLoading;
    button.textContent = isLoading ? loadingText : originalText;
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

// --- NEW: Validation Helpers ---
function setError(inputElement, message) {
    const formGroup = inputElement.closest('.form-group');
    const errorElement = formGroup.querySelector('.error-message');
    
    formGroup.classList.add('error');
    if (errorElement) {
        errorElement.textContent = message;
    }
}

function setSuccess(inputElement) {
    const formGroup = inputElement.closest('.form-group');
    const errorElement = formGroup.querySelector('.error-message');
    
    formGroup.classList.remove('error');
    if (errorElement) {
        errorElement.textContent = '';
    }
}