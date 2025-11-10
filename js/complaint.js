document.addEventListener("DOMContentLoaded", function() {

    // --- Get Elements ---
    const fileUploadInput = document.getElementById("file-upload");
    const fileNameDisplay = document.getElementById("file-name");
    const noFileChosenText = fileNameDisplay ? fileNameDisplay.textContent : "No file chosen";
    const cancelButton = document.querySelector(".form-button-outlined");
    
    // --- NEW: Elements for "Other" field ---
    const complaintTypeDropdown = document.getElementById("complaint-type");
    const otherComplaintGroup = document.getElementById("other-complaint-group");

    // --- File Upload Logic ---
    if (fileUploadInput && fileNameDisplay) {
        fileUploadInput.addEventListener("change", function() {
            if (fileUploadInput.files.length > 1) {
                fileNameDisplay.textContent = `${fileUploadInput.files.length} files selected`;
            } else if (fileUploadInput.files.length === 1) {
                fileNameDisplay.textContent = fileUploadInput.files[0].name;
            } else {
                fileNameDisplay.textContent = noFileChosenText;
            }
        });
    }

    // --- Cancel Button Logic ---
    if (cancelButton) {
        cancelButton.addEventListener("click", function(e) {
            e.preventDefault();
            window.location.href = 'index.html';
        });
    }
    
    // --- NEW: Show/Hide "Other" field ---
    if (complaintTypeDropdown && otherComplaintGroup) {
        complaintTypeDropdown.addEventListener("change", function() {
            // Check if the selected value is 'other'
            if (this.value === 'other') {
                otherComplaintGroup.style.display = 'block';
            } else {
                otherComplaintGroup.style.display = 'none';
            }
        });
    }
});