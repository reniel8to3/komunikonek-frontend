document.addEventListener("DOMContentLoaded", function() {

    // --- Get Elements ---
    const fileUploadInput = document.getElementById("file-upload");
    const fileNameDisplay = document.getElementById("file-name");
    const noFileChosenText = fileNameDisplay ? fileNameDisplay.textContent : "No file chosen";
    const cancelButton = document.getElementById("cancel-button");
    const docTypeDropdown = document.getElementById("doc-type");
    const otherDocGroup = document.getElementById("other-doc-group");

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

    // --- Show/Hide "Other" field ---
    if (docTypeDropdown && otherDocGroup) {
        docTypeDropdown.addEventListener("change", function() {
            if (this.value === 'other') {
                otherDocGroup.style.display = 'block';
            } else {
                otherDocGroup.style.display = 'none';
            }
        });
    }

 
});