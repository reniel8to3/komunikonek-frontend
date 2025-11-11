document.addEventListener("DOMContentLoaded", function() {

    // --- =============================== ---
    // --- ADMIN SIDEBAR LOGIC (MOVED TO TOP) ---
    // --- =============================== ---

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
    
    // --- =============================== ---
    // --- Active Sidebar Link Logic ---
    // --- =============================== ---

    try {
        const currentPage = window.location.pathname.split("/").pop();
        if (currentPage) {
            let pageKey = currentPage.replace(".html", "");
            
            // Special case for the main dashboard
            if (pageKey === "admin" || pageKey === "") {
                 const dashboardLink = document.querySelector(`.sidebar-nav li[data-page="admin"]`);
                 if(dashboardLink) dashboardLink.classList.add("active");
            } else {
                const activeLink = document.querySelector(`.sidebar-nav li[data-page="${pageKey}"]`);
                if (activeLink) {
                    document.querySelectorAll(".sidebar-nav li").forEach(li => li.classList.remove("active"));
                    activeLink.classList.add("active");
                }
            }
        }
    } catch (e) {
        console.error("Active sidebar link logic failed:", e);
    }

    // --- =============================== ---
    // --- I18N (TRANSLATION) LOGIC ---
    // --- =============================== ---
    
    let currentLang = 'en'; // Make currentLang globally accessible in this script
    
    try {
        const langEnBtn = document.getElementById('lang-en');
        const langFilBtn = document.getElementById('lang-fil');
        const translatableElements = document.querySelectorAll('[data-key]');
        
        const setLanguage = (lang) => {
            if (typeof langStrings === 'undefined' || !langStrings[lang]) {
                console.error(`Translation for language "${lang}" not found.`);
                return;
            }

            currentLang = lang; // Update global lang
            document.documentElement.lang = lang;
            
            translatableElements.forEach(el => {
                const key = el.getAttribute('data-key');
                if (!key) return;
                
                const translation = langStrings[lang][key];
                
                if (translation) {
                    if (el.tagName === 'TITLE') {
                        document.title = "KomuniKonek | " + translation;
                    } else {
                        // This handles text nodes, including those inside other elements
                        const directText = Array.from(el.childNodes).find(node => node.nodeType === 3 && node.textContent.trim() !== '');
                        if (directText) {
                            directText.textContent = translation;
                        } else {
                            el.textContent = translation;
                        }
                    }
                }
            });
            
            if (lang === 'fil') {
                if(langFilBtn) langFilBtn.classList.add('active');
                if(langEnBtn) langEnBtn.classList.remove('active');
            } else {
                if(langEnBtn) langEnBtn.classList.add('active');
                if(langFilBtn) langFilBtn.classList.remove('active');
            }
        };

        if (langEnBtn && langFilBtn) {
            langEnBtn.addEventListener('click', () => setLanguage('en'));
            langFilBtn.addEventListener('click', () => setLanguage('fil'));
        }
        
        if (typeof langStrings !== 'undefined') {
            setLanguage('en');
        } else {
            console.error("translations.js not found. Page will not be translated.");
        }
    } catch (e) {
        console.error("Translation script failed:", e);
    }
    
    // --- =============================== ---
    // --- ADMIN TABLE ACTION LOGIC ---
    // --- =============================== ---

    // 1. Delete Button Logic
    const deleteButtons = document.querySelectorAll(".delete-btn");
    deleteButtons.forEach(button => {
        button.addEventListener("click", function() {
            const confirmText = currentLang === 'fil' 
                ? 'Sigurado ka bang gusto mong burahin ito?' 
                : 'Are you sure you want to delete this?';

            if (confirm(confirmText)) {
                this.closest("tr").remove();
            }
        });
    });

    // 2. Edit/Status Button Logic (A simple example)
    const editButtons = document.querySelectorAll(".action-button.edit");
    editButtons.forEach(button => {
        button.addEventListener("click", function() {
            const row = this.closest("tr");
            const statusBadge = row.querySelector(".role-badge");

            if (!statusBadge) return; // Not a row with a status

            // This is a simple toggle logic for demonstration
            if (statusBadge.classList.contains("pending")) {
                statusBadge.classList.remove("pending");
                statusBadge.classList.add("in-progress");
                statusBadge.setAttribute("data-key", "inProgress");
                statusBadge.textContent = langStrings[currentLang]["inProgress"];
                this.textContent = langStrings[currentLang]["markAs"] + " " + langStrings[currentLang]["resolved"];
                
            } else if (statusBadge.classList.contains("in-progress")) {
                statusBadge.classList.remove("in-progress");
                statusBadge.classList.add("resolved");
                statusBadge.setAttribute("data-key", "resolved");
                statusBadge.textContent = langStrings[currentLang]["resolved"];
                this.remove(); // Remove the button once resolved
            
            } else if (statusBadge.classList.contains("ready")) {
                statusBadge.classList.remove("ready");
                statusBadge.classList.add("resolved");
                statusBadge.setAttribute("data-key", "resolved");
                statusBadge.textContent = langStrings[currentLang]["resolved"];
                this.remove(); // Remove the button once resolved
            }
        });
    });

});