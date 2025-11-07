document.addEventListener("DOMContentLoaded", function() {

    const menuToggle = document.getElementById("menu-toggle");
    const sidebar = document.getElementById("admin-sidebar");
    const overlay = document.getElementById("sidebar-overlay");

    if (menuToggle && sidebar && overlay) {
        
        // Open sidebar
        menuToggle.addEventListener("click", function() {
            sidebar.classList.add("active");
            overlay.classList.add("active");
        });

        // Close sidebar by clicking overlay
        overlay.addEventListener("click", function() {
            sidebar.classList.remove("active");
            overlay.classList.remove("active");
        });
    }

});