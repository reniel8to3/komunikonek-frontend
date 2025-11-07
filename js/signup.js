document.addEventListener("DOMContentLoaded", function() {

    // --- =============================== ---
    // --- I18N (TRANSLATION) LOGIC ---
    // --- =============================== ---
    
    const langEnBtn = document.getElementById('lang-en');
    const langFilBtn = document.getElementById('lang-fil');
    const translatableElements = document.querySelectorAll('[data-key]');
    let currentLang = 'en';
    
    const setLanguage = (lang) => { /* ... (translation logic is unchanged) ... */ };
    // (Your existing setLanguage function is here)
    
    if (langEnBtn && langFilBtn) { /* ... (translation listeners are unchanged) ... */ }
    if (typeof langStrings !== 'undefined') { /* ... (translation init is unchanged) ... */ }

    // --- =============================== ---
    // --- SIGNUP PAGE LOGIC ---
    // --- =============================== ---

    // --- 1. Get ALL Elements ---
    // (All your existing `getElementById` calls are here...)
    
    // --- NEW: Toggle Elements ---
    const signupAsSelector = document.getElementById('signup-as-selector');
    const registerWithSelector = document.getElementById('register-with-selector');

    // --- (Your other logic sections 2, 3, 4, 5, 5b are unchanged) ---
    
    // --- 6. (NEW) Sliding Toggle Logic ---
    function setupSlidingToggle(selectorElement) {
        if (!selectorElement) return;
        const glider = selectorElement.querySelector('.glider');
        const buttons = selectorElement.querySelectorAll('.role-button');
        
        if (!glider || buttons.length === 0) return;

        // Set initial position
        const activeButton = selectorElement.querySelector('.role-button.active');
        if (activeButton) {
            glider.style.width = `${activeButton.offsetWidth}px`;
            glider.style.transform = `translateX(${activeButton.offsetLeft - 3}px)`;
        }

        buttons.forEach(button => {
            button.addEventListener('click', function() {
                buttons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Move the glider
                glider.style.width = `${this.offsetWidth}px`;
                glider.style.transform = `translateX(${this.offsetLeft - 3}px)`;
            });
        });
    }
    
    // Initialize both toggles
    setupSlidingToggle(signupAsSelector);
    setupSlidingToggle(registerWithSelector);


    // --- 7. Continuous OTP Input Logic ---
    // (This section is unchanged)
    
    // --- 8. Email/Phone Toggle Logic ---
    // (This section IS still needed to HIDE and SHOW the form fields)
    if (registerEmailBtn && registerPhoneBtn && emailFormGroup && phoneFormGroup) {
        registerEmailBtn.addEventListener('click', function() {
            emailFormGroup.style.display = 'block';
            phoneFormGroup.style.display = 'none';
        });
        registerPhoneBtn.addEventListener('click', function() {
            emailFormGroup.style.display = 'none';
            phoneFormGroup.style.display = 'block';
        });
    }

    // --- (Rest of your JS file is unchanged: sections 9, 10, 11, 12, 13) ---

});