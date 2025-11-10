document.addEventListener("DOMContentLoaded", function() {

    // --- =============================== ---
    // --- PROFILE DROPDOWN LOGIC (MOVED TO TOP) ---
    // --- =============================== ---
    
    const profileButton = document.getElementById("profile-button");
    const profileDropdown = document.getElementById("profile-dropdown");

    if (profileButton && profileDropdown) {
        profileButton.addEventListener("click", function(e) {
            e.stopPropagation(); 
            profileDropdown.classList.toggle("active");
        });
    }

    window.addEventListener("click", function(e) {
        if (profileDropdown && profileDropdown.classList.contains("active")) {
            if (!profileDropdown.contains(e.target) && e.target !== profileButton) {
                profileDropdown.classList.remove("active");
            }
        }
    });

    // --- =============================== ---
    // --- I18N (TRANSLATION) LOGIC ---
    // --- =============================== ---
    
    try {
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
                        // This specifically targets spans, which is what we used
                        const span = el.querySelector('span[data-key]');
                        if(span){
                            span.textContent = translation;
                        } else if (el.hasAttribute('data-key')) {
                            // This is a fallback for simple elements
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

});