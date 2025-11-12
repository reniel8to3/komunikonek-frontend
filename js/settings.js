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

    // --- 3. LOAD USER DATA ---
    document.addEventListener('user-loaded', async (e) => {
        currentUserId = e.detail.user.uid;
        const userData = e.detail.userData;
        
        // Populate the form with data from Firestore
        firstNameInput.value = userData.firstName || '';
        lastNameInput.value = userData.lastName || '';
        middleNameInput.value = userData.middleName || '';
        houseNumberInput.value = userData.address?.houseNumber || '';
        streetInput.value = userData.address?.street || '';

        // Populate disabled fields
        if (userData.email) {
            emailInput.value = userData.email;
            currentUserEmail = userData.email;
            passwordCard.style.display = 'block'; // Show change password button
        } else {
            emailInput.value = "N/A (Phone Sign-in)";
            passwordCard.style.display = 'none'; // Hide change password button
        }
        
        phoneInput.value = userData.phone || "N/A (Email Sign-in)";
        
        // This is a Material CSS fix to make labels float up
        document.querySelectorAll('.form-input').forEach(input => {
            if (input.value) {
                input.classList.add('not-empty'); // You might need to adjust this class
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
            
            // We use setDoc with merge:true to *update* the document
            // without overwriting fields that aren't in the form (like 'accountType')
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
    
    // --- 5. CHANGE PASSWORD BUTTON ---
    changePasswordButton?.addEventListener('click', async () => {
        if (!currentUserEmail) {
            showToast("No email on file to send reset link.", "error");
            return;
        }
        
        setButtonLoading(changePasswordButton, true, "Sending...");
        try {
            await sendPasswordResetEmail(auth, currentUserEmail);
            showToast("Password reset email sent! Check your inbox.", "success");
        } catch (error) {
            console.error("Error sending password reset: ", error);
            showToast(error.message, "error");
        } finally {
            setButtonLoading(changePasswordButton, false, "SEND RESET LINK");
        }
    });

}); // --- End of DOMContentLoaded listener ---


// --- UTILITY FUNCTIONS ---
function setButtonLoading(button, isLoading, loadingText = "Saving...") {
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