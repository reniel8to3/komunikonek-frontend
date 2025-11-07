document.addEventListener("DOMContentLoaded", function() {

    // --- =============================== ---
    // --- I18N (TRANSLATION) LOGIC ---
    // --- =============================== ---
    
    const langEnBtn = document.getElementById('lang-en');
    const langFilBtn = document.getElementById('lang-fil');
    const translatableElements = document.querySelectorAll('[data-key]');
    let currentLang = 'en';
    
    const setLanguage = (lang) => {
        if (typeof langStrings === 'undefined' || !langStrings[lang]) {
            console.error(`Translation for language "${lang}" not found.`);
            return;
        }

        currentLang = lang;
        document.documentElement.lang = lang;
        
        translatableElements.forEach(el => {
            const key = el.getAttribute('data-key');
            if (!key) return;
            
            const translation = langStrings[lang][key];
            
            if (translation) {
                if (el.tagName === 'TITLE') {
                    document.title = "KomuniKonek | " + translation;
                } else {
                    el.textContent = translation;
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


    // --- =============================== ---
    // --- ADMIN SIDEBAR LOGIC ---
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

});