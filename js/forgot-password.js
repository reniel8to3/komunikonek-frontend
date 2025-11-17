// 1. IMPORT FIREBASE FUNCTIONS FIRST
import { auth, sendPasswordResetEmail } from './firebase.js';
import { langStrings } from './translations.js';

document.addEventListener("DOMContentLoaded", function() {
    
    // --- Get ALL Elements ---
    const forgotForm = document.getElementById('forgot-form');
    const emailInput = document.getElementById('email');
    const langEnBtn = document.getElementById('lang-en');
    const langFilBtn = document.getElementById('lang-fil');
    const translatableElements = document.querySelectorAll('[data-key]');
    let currentLang = 'en';

    // --- =============================== ---
    // --- I18N (TRANSLATION) LOGIC ---
    // --- =============================== ---
    
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
    // --- VALIDATION LOGIC ---
    // --- =============================== ---

    function setError(input, messageKey) {
        let message = messageKey;
        if (typeof langStrings !== 'undefined' && langStrings[currentLang] && langStrings[currentLang][messageKey]) {
            message = langStrings[currentLang][messageKey];
        }
        
        const formGroup = input.closest('.form-group');
        if (!formGroup) return;
        const errorDisplay = formGroup.querySelector('.error-message');
        if (errorDisplay) {
            errorDisplay.innerText = message;
        }
        formGroup.classList.add('error');
    }

    function setSuccess(input) {
        const formGroup = input.closest('.form-group');
        if (!formGroup) return;
        const errorDisplay = formGroup.querySelector('.error-message');
        if (errorDisplay) {
            errorDisplay.innerText = '';
        }
        formGroup.classList.remove('error');
    }

    function isValidEmail(email) {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

    if (forgotForm) {
        forgotForm.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Form submit prevented - handling with JavaScript');
            
            let isValid = true;
            const emailValue = emailInput.value.trim();

            // --- 1. Validate Form ---
            if (emailValue === '') {
                setError(emailInput, 'errRequired');
                isValid = false;
            } else if (!isValidEmail(emailValue)) {
                setError(emailInput, 'errEmail');
                isValid = false;
            } else {
                setSuccess(emailInput);
            }
            
            // --- 2. If Valid, Call Firebase ---
            if (isValid) {
                console.log('Form is Valid! Calling Firebase...');
                
                // Call the Firebase function
                sendPasswordResetEmail(auth, emailValue)
                    .then(() => {
                        // SUCCESS! Show the success message.
                        console.log("Password reset email sent successfully.");
                        const card = document.querySelector('.login-card');
                        card.innerHTML = `<h2 class="welcome-header">Check Your Email</h2>
                                          <p class="sign-in-text">A password reset link has been sent to ${emailValue}.</p>
                                          <a href="login.html" class="signup-link">Back to Sign in</a>`;
                    })
                    .catch((error) => {
                        // ERROR! Use your existing setError function.
                        console.error("Firebase Error:", error.code, error.message);
                        
                        if (error.code === 'auth/user-not-found') {
                            // Use a specific error key for translation
                            setError(emailInput, 'errUserNotFound'); 
                        } else {
                            // A generic error for other issues
                            setError(emailInput, 'errGeneric');
                        }
                    });
            }
        });
    }

});