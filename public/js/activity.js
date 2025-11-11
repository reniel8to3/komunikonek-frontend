document.addEventListener("DOMContentLoaded", function() {

    const tabs = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");

    // This function shows a tab by its ID (e.g., "complaints")
    function showTab(tabId) {
        const targetContent = document.getElementById(tabId);
        
        tabs.forEach(t => t.classList.remove("active"));
        tabContents.forEach(c => c.classList.remove("active"));

        // Find the button that controls this tab and activate it
        const activeButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
        if(activeButton) activeButton.classList.add("active");
        if(targetContent) targetContent.classList.add("active");
    }

    if (tabs.length > 0 && tabContents.length > 0) {
        // Add click listener to each tab
        tabs.forEach(tab => {
            tab.addEventListener("click", function(e) {
                e.preventDefault(); // Stop the <a> link from jumping
                const targetId = this.getAttribute("data-tab");
                showTab(targetId);
            });
        });
    }

    // Check if the URL has a hash (e.g., #documents)
    if (window.location.hash === '#documents') {
        showTab('documents');
    } else {
        showTab('complaints'); // Show the default 'complaints' tab
    }

});