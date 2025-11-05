// --- =============================== ---
    // --- I18N (TRANSLATION) LOGIC ---
    // --- =============================== ---
    
    // Get toggle buttons
    const langEnBtn = document.getElementById('lang-en');
    const langFilBtn = document.getElementById('lang-fil');

    // Find all elements that need translation
    const translatableElements = document.querySelectorAll('[data-key]');
    
    const setLanguage = (lang) => {
        // 1. Set HTML lang attribute
        document.documentElement.lang = lang;
        
        // 2. Loop through all tagged elements
        translatableElements.forEach(el => {
            const key = el.getAttribute('data-key');
            // 3. Find the translation
            const translation = langStrings[lang][key];
            
            if (translation) {
                // Special case for <title>
                if (el.tagName === 'TITLE') {
                    el.textContent = "KomuniKonek | " + translation;
                } else {
                    el.textContent = translation;
                }
            }
        });
        
        // 4. Update button active state
        if (lang === 'fil') {
            langFilBtn.classList.add('active');
            langEnBtn.classList.remove('active');
        } else {
            langEnBtn.classList.add('active');
            langFilBtn.classList.remove('active');
        }
    };

    // Add click listeners
    langEnBtn.addEventListener('click', () => setLanguage('en'));
    langFilBtn.addEventListener('click', () => setLanguage('fil'));

    // Set default language on load
    setLanguage('en');
    
    
document.addEventListener("DOMContentLoaded", function() {

    // --- 1. Get ALL Elements ---
    const roleButtons = document.querySelectorAll('.role-button');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.querySelector('.password-toggle');
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');

    // Phone Toggle Elements
    const emailLoginSection = document.getElementById('email-login-section');
    const phoneLoginSection = document.getElementById('phone-login-section');
    const showPhoneLoginBtn = document.getElementById('show-phone-login-btn');
    const showEmailLoginLink = document.getElementById('show-email-login-link');
    const loginPhoneInput = document.getElementById('login-phone');
    const loginSendOtpBtn = document.getElementById('login-send-otp-btn');
    const loginOtpSection = document.getElementById('login-otp-section');
    const loginOtpInputs = loginOtpSection.querySelectorAll('.otp-input');
    
    // --- 2. Role Selector (User/Admin) ---
    roleButtons.forEach(button => {
        button.addEventListener('click', function() {
            roleButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active'); 
        });
    });

    // --- 3. Password Show/Hide Toggle ---
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    // --- 4. Phone Login Toggle Logic ---
    showPhoneLoginBtn.addEventListener('click', function() {
        emailLoginSection.style.display = 'none';
        phoneLoginSection.style.display = 'block';
    });
    showEmailLoginLink.addEventListener('click', function(e) {
        e.preventDefault();
        emailLoginSection.style.display = 'block';
        phoneLoginSection.style.display = 'none';
    });

    // --- 5. "Send OTP" (Login) Button Logic ---
    loginSendOtpBtn.addEventListener('click', function() {
        // Validate phone number
        const phoneValue = loginPhoneInput.value.trim();
        if (phoneValue.length === 10) {
            setSuccess(loginPhoneInput);
            loginOtpSection.style.display = 'block';
            loginSendOtpBtn.textContent = 'Resend OTP';
            console.log('Login OTP Sent (simulation)');
        } else {
            setError(loginPhoneInput, 'Please enter a 10-digit phone number.');
        }
    });

    // --- 6. Phone Input Validation (Numbers Only) ---
    if (loginPhoneInput) {
        loginPhoneInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }

    // --- 7. Continuous OTP Input Logic ---
    setupOtpInput(loginOtpInputs);

    
    // --- =============================== ---
    // --- VALIDATION LOGIC ---
    // --- =============================== ---

    // 8. Helper Functions
    function setError(input, message) {
        const formGroup = input.closest('.form-group');
        const errorDisplay = formGroup.querySelector('.error-message');

        errorDisplay.innerText = message;
        formGroup.classList.add('error');
    }

    function setSuccess(input) {
        const formGroup = input.closest('.form-group');
        const errorDisplay = formGroup.querySelector('.error-message');

        if(errorDisplay) {
            errorDisplay.innerText = '';
        }
        formGroup.classList.remove('error');
    }

    function isValidEmail(email) {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

    // 9. Main Form Submit Listener
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        let isEmailValid = validateEmailForm();
        
        if (isEmailValid) {
            console.log('Email Form is Valid! Submitting... (simulation)');
            // loginForm.submit();
        }
    });

    // UPDATED validation function
    function validateEmailForm() {
        let isValid = true;
        const emailValue = emailInput.value.trim();
        const passwordValue = passwordInput.value.trim();

        // Validate Email
        if (emailValue === '') {
            setError(emailInput, 'Email is required');
            isValid = false;
        } else if (!isValidEmail(emailValue)) {
            setError(emailInput, 'Provide a valid email address (e.g., user@domain.com)');
            isValid = false;
        } else {
            setSuccess(emailInput);
        }

        // Validate Password
        if (passwordValue === '') {
            setError(passwordInput, 'Password is required');
            isValid = false;
        } else if (passwordValue.length < 8) { // <-- NEW CHECK
            setError(passwordInput, 'Password must be at least 8 characters long');
            isValid = false;
        } else {
            setSuccess(passwordInput);
        }
        
        return isValid;
    }

    // 10. Central OTP setup function
    function setupOtpInput(otpInputs) {
        otpInputs.forEach((input, index) => {
            // 1. Restrict to numbers ONLY and auto-tab forward
            input.addEventListener('input', function() {
                this.value = this.value.replace(/[^0-9]/g, '');
                if (this.value && index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
            });

            // 2. Handle Backspace & Arrow keys
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !input.value && index > 0) {
                    e.preventDefault();
                    otpInputs[index - 1].focus();
                }
                if (e.key === 'ArrowLeft' && index > 0) {
                    otpInputs[index - 1].focus();
                }
                if (e.key === 'ArrowRight' && index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
            });

            // 3. Handle PASTE
            input.addEventListener('paste', function(e) {
                e.preventDefault();
                const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
                
                for (let i = 0; i < pastedData.length; i++) {
                    if (index + i < otpInputs.length) {
                        otpInputs[index + i].value = pastedData[i];
                    }
                }
                
                const lastFilledIndex = Math.min(index + pastedData.length - 1, otpInputs.length - 1);
                if (lastFilledIndex >= 0) {
                    otpInputs[lastFilledIndex].focus();
                }
            });
        });
    }

});