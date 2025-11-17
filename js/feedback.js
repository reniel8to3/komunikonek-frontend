// js/feedback.js
import { protectPage, setupLogoutButton } from './auth-guard.js';
import { db, collection, addDoc, serverTimestamp } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
    
    let currentUserId = null;

    // --- 1. SET UP THE PAGE ---
    protectPage({ expectedRole: 'user' });
    setupLogoutButton(); 

    document.addEventListener('user-loaded', (e) => {
        currentUserId = e.detail.user.uid;
        console.log("Feedback page loaded for user:", currentUserId);
    });

    // --- 2. GET FORM ELEMENTS ---
    const feedbackForm = document.getElementById('feedback-form');
    const submitButton = document.querySelector('.form-button-filled');
    const subjectInput = document.getElementById('feedback-subject');
    const textInput = document.getElementById('feedback-text');
    const charCounter = document.getElementById('feedback-char-counter');

    // --- 3. CHARACTER COUNTER ---
    textInput?.addEventListener('input', () => {
        const len = textInput.value.length;
        if(charCounter) {
            charCounter.textContent = `${len}/1000`;
            charCounter.style.color = len > 950 ? '#CE1126' : '#6c757d';
        }
    });

    // --- 4. FORM SUBMIT LISTENER ---
    feedbackForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // --- 4a. VALIDATION ---
        let isValid = true;
        if (subjectInput.value.trim() === '') {
            setError(subjectInput, "Please select a subject.");
            isValid = false;
        } else {
            setSuccess(subjectInput);
        }
        
        if (textInput.value.trim() === '') {
            setError(textInput, "Feedback text is required.");
            isValid = false;
        } else {
            setSuccess(textInput);
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
        
        setButtonLoading(submitButton, true, "Sending...");

        try {
            // --- 4b. Prepare Feedback Data ---
            const newFeedback = {
                userId: currentUserId,
                subject: subjectInput.value,
                feedbackText: textInput.value,
                status: "New", 
                createdAt: serverTimestamp()
            };

            // --- 4c. Save to Firestore ---
            const docRef = await addDoc(collection(db, "feedback"), newFeedback);
            
            console.log("Feedback submitted with ID: ", docRef.id);
            showToast("Thank you! Your feedback has been sent.", "success");

            setTimeout(() => {
                window.location.href = 'index.html'; // Go back to dashboard
            }, 2000);

        } catch (error) {
            console.error("Error submitting feedback: ", error);
            showToast("Error submitting feedback. Please try again.", "error");
            setButtonLoading(submitButton, false, "SEND FEEDBACK");
        }
    });

}); // --- End of DOMContentLoaded listener ---


// --- 5. UTILITY FUNCTIONS ---
function setButtonLoading(button, isLoading, loadingText = "Sending...") {
    if (!button) return;
    const originalText = button.dataset.originalText || "SEND FEEDBACK";
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

// --- Validation Helpers ---
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