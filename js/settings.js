// js/settings.js
import { protectPage, setupLogoutButton } from './auth-guard.js';
import { auth, db, doc, getDoc, setDoc, sendPasswordResetEmail } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
    
    let currentUserId = null;
    let currentUserEmail = null;

    // --- 1. SET UP THE PAGE ---
    protectPage({ expectedRole: 'user' });
    setupLogoutButton(); 

    // --- 2. GET FORM ELEMENTS ---
    const profileForm = document.getElementById('profile-form');
    const saveButton = document.getElementById('save-profile-btn');
    const changePasswordButton = document.getElementById('change-password-btn');
    
    const firstNameInput = document.getElementById('first-name');
    const lastNameInput = document.getElementById('last-name');
    const middleNameInput = document.getElementById('middle-name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const houseNumberInput = document.getElementById('house-number');
    const streetInput = document.getElementById('street');
    const passwordCard = document.getElementById('password-card');

    // --- NEW: Get Modal Elements ---
    const confirmModal = document.getElementById('confirm-modal-overlay');
    const confirmEmailDisplay = document.getElementById('confirm-email-display');
    const confirmCancelBtn = document.getElementById('confirm-modal-cancel');
    const confirmSendBtn = document.getElementById('confirm-modal-confirm');

    // --- 3. LOAD USER DATA ---
    document.addEventListener('user-loaded', async (e) => {
        currentUserId = e.detail.user.uid;
        const userData = e.detail.userData;
        
        firstNameInput.value = userData.firstName || '';
        lastNameInput.value = userData.lastName || '';
        middleNameInput.value = userData.middleName || '';
        houseNumberInput.value = userData.address?.houseNumber || '';
        streetInput.value = userData.address?.street || '';

        if (userData.email) {
            emailInput.value = userData.email;
            currentUserEmail = userData.email;
            passwordCard.style.display = 'block'; 
        } else {
            emailInput.value = "N/A (Phone Sign-in)";
            passwordCard.style.display = 'none'; 
        }
        
        phoneInput.value = userData.phone || "N/A (Email Sign-in)";
        
        document.querySelectorAll('.form-input').forEach(input => {
            if (input.value) {
                input.classList.add('not-empty');
            }
        });
    });

    // --- 4. SAVE PROFILE CHANGES ---
    profileForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUserId) {
            showToast("Error: User not identified. Please try logging in again.", "error");
            return;
        }
        
        setButtonLoading(saveButton, true, "Saving...");

        try {
            const userDocRef = doc(db, "users", currentUserId);
            
            await setDoc(userDocRef, {
                firstName: firstNameInput.value,
                lastName: lastNameInput.value,
                middleName: middleNameInput.value,
                address: {
                    houseNumber: houseNumberInput.value,
                    street: streetInput.value
                }
            }, { merge: true });

            showToast("Profile updated successfully!", "success");

        } catch (error) {
            console.error("Error updating profile: ", error);
            showToast("Error updating profile. Please try again.", "error");
        } finally {
            setButtonLoading(saveButton, false, "SAVE CHANGES");
        }
    });
    
    // --- 5. CHANGE PASSWORD LOGIC (UPDATED) ---
    
    // Step 5a: "SEND RESET LINK" button now opens the modal
    changePasswordButton?.addEventListener('click', () => {
        if (!currentUserEmail) {
            showToast("No email on file to send reset link.", "error");
            return;
        }
        // Set the email in the modal text
        confirmEmailDisplay.textContent = currentUserEmail;
        // Open the modal
        confirmModal.classList.add('is-open');
    });

    // Step 5b: "CANCEL" button in modal closes it
    confirmCancelBtn?.addEventListener('click', () => {
        confirmModal.classList.remove('is-open');
    });

    // Step 5c: "SEND LINK" button in modal does the work
    confirmSendBtn?.addEventListener('click', async () => {
        setButtonLoading(confirmSendBtn, true, "Sending...");
        
        try {
            await sendPasswordResetEmail(auth, currentUserEmail);
            confirmModal.classList.remove('is-open'); // Close modal on success
            showToast("Password reset email sent! Check your inbox.", "success");
        } catch (error) {
            console.error("Error sending password reset: ", error);
            showToast(error.message, "error");
        } finally {
            setButtonLoading(confirmSendBtn, false, "SEND LINK");
        }
    });

}); // --- End of DOMContentLoaded listener ---


// --- UTILITY FUNCTIONS ---
function setButtonLoading(button, isLoading, loadingText = "Loading...") {
    if (!button) return;
    const originalText = button.dataset.originalText || button.textContent;
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

// This CSS class is needed for the labels to float correctly on pre-filled data
document.head.insertAdjacentHTML("beforeend", `
<style>
    .form-input:disabled,
    .form-input.not-empty {
        padding-top: 22px;
        padding-bottom: 6px;
    }
    .form-input:disabled + .form-label,
    .form-input.not-empty + .form-label {
        top: -8px;
        left: 13px;
        font-size: 0.8em;
    }
</style>
`);