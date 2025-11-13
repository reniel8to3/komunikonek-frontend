// js/submit-complaint.js
import { protectPage, setupLogoutButton } from './auth-guard.js';
import { db, storage, collection, addDoc, serverTimestamp, ref, uploadBytes, getDownloadURL } from './firebase.js';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

// We wrap EVERYTHING in a DOMContentLoaded listener.
document.addEventListener('DOMContentLoaded', () => {
    
    let currentUserId = null;
    let filesToUpload = []; // Store valid files here

    // --- 1. SET UP THE PAGE ---
    protectPage({ expectedRole: 'user' });
    setupLogoutButton(); 

    document.addEventListener('user-loaded', (e) => {
        currentUserId = e.detail.user.uid;
        console.log("Submit Complaint page loaded for user:", currentUserId);
    });

    // --- 2. GET FORM ELEMENTS ---
    const complaintForm = document.getElementById('complaint-form');
    const submitButton = document.querySelector('.form-button-filled');
    const complaintSubject = document.getElementById('subject'); 
    const incidentDate = document.getElementById('incident-date');
    const complaintDescription = document.getElementById('description'); 
    const charCounter = document.getElementById('complaint-char-counter');
    const fileUpload = document.getElementById('file-upload');
    const fileNameDisplay = document.getElementById('file-name');

    // --- 3. CHARACTER COUNTER ---
    complaintDescription?.addEventListener('input', () => {
        const len = complaintDescription.value.length;
        if(charCounter) {
            charCounter.textContent = `${len}/1000`;
            charCounter.style.color = len > 950 ? '#CE1126' : '#6c757d';
        }
    });

    // --- 4. FILE UPLOAD LISTENER (with Validation) ---
    fileUpload?.addEventListener('change', (e) => {
        filesToUpload = []; // Reset the array
        const selectedFiles = Array.from(e.target.files);
        
        let validFiles = [];
        let error = null;

        for (const file of selectedFiles) {
            if (file.size > MAX_SIZE) {
                error = `File "${file.name}" is too large (Max 10MB).`;
                break;
            }
            if (!ALLOWED_TYPES.includes(file.type)) {
                error = `File "${file.name}" is not a valid image type.`;
                break;
            }
            validFiles.push(file);
        }

        if (error) {
            showToast(error, "error");
            fileUpload.value = ""; // Clear the input
            fileNameDisplay.textContent = "No file chosen";
        } else {
            filesToUpload = validFiles;
            fileNameDisplay.textContent = `${filesToUpload.length} file(s) selected`;
        }
    });

    // --- 5. FORM SUBMIT LISTENER ---
    complaintForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // --- 5a. VALIDATION ---
        let isValid = true;
        if (complaintSubject.value.trim() === '') {
            setError(complaintSubject, "Subject is required.");
            isValid = false;
        } else {
            setSuccess(complaintSubject);
        }
        
        if (complaintDescription.value.trim() === '') {
            setError(complaintDescription, "Description is required.");
            isValid = false;
        } else {
            setSuccess(complaintDescription);
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
        
        // Get element values
        const complaintType = document.getElementById('complaint-type');
        const otherComplaintType = document.getElementById('other-complaint-type');

        try {
            // --- 5b. Handle File Uploads ---
            let fileURLs = [];
            if (filesToUpload.length > 0) {
                showToast("Uploading files (0%)...", "info");
                
                const uploadPromises = filesToUpload.map(async (file, index) => {
                    const storageRef = ref(storage, `complaints/${currentUserId}/${Date.now()}_${file.name}`);
                    await uploadBytes(storageRef, file);
                    const downloadURL = await getDownloadURL(storageRef);
                    
                    showToast(`Uploading files (${Math.round(((index + 1) / filesToUpload.length) * 100)}%)...`, "info");
                    
                    return downloadURL;
                });

                fileURLs = await Promise.all(uploadPromises);
                showToast("File upload complete!", "success");
            }

            // --- 5c. Prepare Complaint Data ---
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
                fileUrls: fileURLs, // <-- ADDED THE URLS
                status: "Pending", 
                createdAt: serverTimestamp(),
                progress: [
                    {
                        status: "Pending",
                        notes: "Your complaint has been submitted and is awaiting review.",
                        timestamp: new Date() 
                    }
                ]
            };

            // --- 5d. Save to Firestore ---
            const docRef = await addDoc(collection(db, "complaints"), newComplaint);
            
            console.log("Complaint submitted with ID: ", docRef.id);
            showToast("Complaint submitted successfully!", "success");

            setTimeout(() => {
                window.location.href = 'my-activity.html';
            }, 2000);

        } catch (error) {
            console.error("Error submitting complaint: ", error);
            showToast("Error submitting complaint. Please try again.", "error");
            setButtonLoading(submitButton, false, "SUBMIT COMPLAINT");
        }
    });

}); // --- End of DOMContentLoaded listener ---


// --- 6. UTILITY FUNCTIONS (Must be outside the listener) ---
function setButtonLoading(button, isLoading, loadingText = "Submitting...") {
    if (!button) return;
    const originalText = button.dataset.originalText || "SUBMIT COMPLAINT";
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