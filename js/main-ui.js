// js/main-ui.js

// Wait for the HTML to be fully loaded
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. "Other" Complaint Field Toggle ---
    const complaintType = document.getElementById('complaint-type');
    const otherGroup = document.getElementById('other-complaint-group');

    complaintType?.addEventListener('change', () => {
        if (complaintType.value === 'other') {
            otherGroup.style.display = 'block';
        } else {
            otherGroup.style.display = 'none';
        }
    });

    // --- 2. Cancel Button Logic ---
    const cancelButton = document.querySelector('.form-button-outlined');
    cancelButton?.addEventListener('click', () => {
        // Go back to the dashboard
        window.location.href = 'index.html';
    });

}); // End of DOMContentLoaded