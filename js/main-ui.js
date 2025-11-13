// js/main-ui.js

// This runs on every page that imports it
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Hamburger Menu Logic ---
    const menuButton = document.getElementById('mobile-menu-button');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    const toggleMenu = (e) => {
        e.stopPropagation();
        sidebar?.classList.toggle('is-open');
        overlay?.classList.toggle('is-open');
    };

    menuButton?.addEventListener('click', toggleMenu);
    overlay?.addEventListener('click', toggleMenu);


    // --- 2. Profile Dropdown Logic ---
    const profileButton = document.getElementById('profile-button');
    const profileDropdown = document.getElementById('profile-dropdown');

    profileButton?.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('active');
    });

    // Close dropdown if clicking outside
    window.addEventListener('click', (e) => {
        if (profileDropdown?.classList.contains('active') && 
            !profileDropdown.contains(e.target) && 
            !profileButton.contains(e.target)) 
        {
            profileDropdown.classList.remove('active');
        }
    });

    // --- 3. "Other" Complaint Field Toggle ---
    const complaintType = document.getElementById('complaint-type');
    const otherComplaintGroup = document.getElementById('other-complaint-group');

    complaintType?.addEventListener('change', () => {
        if (complaintType.value === 'other') {
            otherComplaintGroup.style.display = 'block';
        } else {
            otherComplaintGroup.style.display = 'none';
        }
    });
    
    // --- 4. "Other" Document Field Toggle ---
    const documentType = document.getElementById('document-type');
    const otherDocumentGroup = document.getElementById('other-document-group');

    documentType?.addEventListener('change', () => {
        if (documentType.value === 'Other') {
            otherDocumentGroup.style.display = 'block';
        } else {
            otherDocumentGroup.style.display = 'none';
        }
    });

    // --- 5. Cancel Button Logic ---
    const cancelButtons = document.querySelectorAll('.form-button-outlined');
    cancelButtons.forEach(cancelButton => {
        if (cancelButton.id !== 'change-password-btn' && cancelButton.id !== 'confirm-modal-cancel') {
             cancelButton.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }
    });

    // --- 6. NEW: File Name Display Logic (for BOTH pages) ---
    
    // For submit-complaint.html
    const fileUpload = document.getElementById('file-upload');
    const fileNameDisplay = document.getElementById('file-name');
    fileUpload?.addEventListener('change', () => {
        if (fileUpload.files.length > 0) {
            fileNameDisplay.textContent = `${fileUpload.files.length} file(s) selected`;
        } else {
            fileNameDisplay.textContent = "No file chosen";
        }
    });

    // For request-document.html
    const fileUploadReq = document.getElementById('file-upload-req');
    const fileNameDisplayReq = document.getElementById('file-name-req');
    fileUploadReq?.addEventListener('change', () => {
        if (fileUploadReq.files.length > 0) {
            fileNameDisplayReq.textContent = `${fileUploadReq.files.length} file(s) selected`;
        } else {
            fileNameDisplayReq.textContent = "No file chosen";
        }
    });
    
});