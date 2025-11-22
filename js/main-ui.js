// js/main-ui.js

const initMainUI = () => {
    // --- 1. SIDEBAR TOGGLE LOGIC ---
    const mobileMenuBtn = document.getElementById('mobile-menu-button');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    function toggleSidebar() {
        if (sidebar && overlay) {
            sidebar.classList.toggle('is-open');
            overlay.classList.toggle('is-open');
        }
    }

    function closeSidebar() {
        if (sidebar && overlay) {
            sidebar.classList.remove('is-open');
            overlay.classList.remove('is-open');
        }
    }

    if (mobileMenuBtn) {
        // Clone to remove old listeners
        const newBtn = mobileMenuBtn.cloneNode(true);
        mobileMenuBtn.parentNode.replaceChild(newBtn, mobileMenuBtn);
        newBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSidebar();
        });
    }

    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
    }

    const navLinks = document.querySelectorAll('.sidebar-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });
    });

    // --- 2. PROFILE DROPDOWN LOGIC ---
    const profileBtn = document.getElementById('profile-button');
    const profileDropdown = document.getElementById('profile-dropdown');

    if (profileBtn && profileDropdown) {
        const newProfileBtn = profileBtn.cloneNode(true);
        profileBtn.parentNode.replaceChild(newProfileBtn, profileBtn);
        
        newProfileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!profileDropdown.contains(e.target) && !newProfileBtn.contains(e.target)) {
                profileDropdown.classList.remove('active');
            }
        });
    }
    
    // --- 3. SMART CANCEL BUTTON LOGIC (THE FIX) ---
    const cancelButtons = document.querySelectorAll('.form-button-outlined');
    cancelButtons.forEach(cancelButton => {
        
        // Check if this button is inside a modal
        const insideModal = cancelButton.closest('.modal-content');

        if (insideModal) {
            // CASE A: Inside a modal -> Just close the modal
            cancelButton.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent form submission
                const modalOverlay = cancelButton.closest('.modal-overlay');
                if (modalOverlay) {
                    modalOverlay.classList.remove('is-open');
                    // Also ensure CSS visibility is reset if needed
                    modalOverlay.style.opacity = ''; 
                    modalOverlay.style.visibility = '';
                }
            });
        } else {
            // CASE B: Normal page button -> Redirect to Dashboard
            // Exclude specific buttons like password reset
            if (cancelButton.id !== 'change-password-btn' && cancelButton.id !== 'confirm-modal-cancel') {
                cancelButton.addEventListener('click', () => {
                    // If on admin side, go to admin.html, else index.html
                    if (window.location.pathname.includes('manage') || window.location.pathname.includes('admin')) {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                });
            }
        }
    });

    // --- 4. Toggle Logic for Forms ---
    const complaintType = document.getElementById('complaint-type');
    const otherComplaintGroup = document.getElementById('other-complaint-group');
    if (complaintType && otherComplaintGroup) {
        complaintType.addEventListener('change', () => {
            otherComplaintGroup.style.display = (complaintType.value === 'other') ? 'block' : 'none';
        });
    }

    const documentType = document.getElementById('document-type');
    const otherDocumentGroup = document.getElementById('other-document-group');
    if (documentType && otherDocumentGroup) {
        documentType.addEventListener('change', () => {
            otherDocumentGroup.style.display = (documentType.value === 'Other') ? 'block' : 'none';
        });
    }
    
    // --- 5. File Name Display ---
    const setupFileUpload = (inputId, displayId) => {
        const input = document.getElementById(inputId);
        const display = document.getElementById(displayId);
        if(input && display) {
            input.addEventListener('change', () => {
                if (input.files.length > 0) {
                    display.textContent = `${input.files.length} file(s) selected`;
                } else {
                    display.textContent = "No file chosen";
                }
            });
        }
    }
    setupFileUpload('file-upload', 'file-name');
    setupFileUpload('file-upload-req', 'file-name-req');
};

// Initialize immediately if DOM is ready, otherwise wait
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMainUI);
} else {
    initMainUI();
}