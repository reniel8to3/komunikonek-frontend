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
    // --- SIGNUP PAGE LOGIC ---
    // --- =============================== ---

    // --- 1. Get ALL Elements ---
    const step1Account = document.getElementById('step-1-account');
    const step2Personal = document.getElementById('step-2-personal');
    const sendOtpButton = document.getElementById('send-otp-button');
    const otpSection = document.getElementById('otp-section');
    const verifyOtpButton = document.getElementById('verify-otp-button');
    const backButton = document.getElementById('back-button');
    const signupEmailInput = document.getElementById('email');
    const signupPasswordInput = document.getElementById('password');
    const signupPhoneInput = document.getElementById('phone');
    const togglePassword = document.querySelector('.password-toggle');
    const registerEmailBtn = document.getElementById('register-email-btn');
    const registerPhoneBtn = document.getElementById('register-phone-btn');
    const emailFormGroup = document.getElementById('email-form-group');
    const phoneFormGroup = document.getElementById('phone-form-group');
    const signupOtpInputs = document.querySelectorAll('#otp-section .otp-input');
    
    // Get Toggles
    const signUpAsToggle = document.getElementById('signup-as-selector');
    const registerWithToggle = document.getElementById('register-with-selector');
    const signUpAsButtons = signUpAsToggle ? signUpAsToggle.querySelectorAll('.role-button') : [];

    // Birthday Dropdowns
    const dayDropdown = document.getElementById('day');
    const yearDropdown = document.getElementById('year');
    
    // Password Checklist
    const passChecklist = document.getElementById('password-checklist');
    const passLength = document.getElementById('pass-length');
    const passCapital = document.getElementById('pass-capital');
    const passNumber = document.getElementById('pass-number');
    const passSymbol = document.getElementById('pass-symbol');

    // --- 2. "Send OTP" Button Click (UPDATED) ---
    if (sendOtpButton) {
        sendOtpButton.addEventListener('click', function() {
            if (validateStep1()) {
                if(otpSection) otpSection.style.display = 'block';
                this.textContent = (langStrings[currentLang] && langStrings[currentLang]['sendOtp']) ? langStrings[currentLang]['sendOtp'] : 'Send OTP';
                console.log('OTP Sent (simulation)');

                // --- NEW: Disable all inputs ---
                if(signupEmailInput) signupEmailInput.disabled = true;
                if(signupPhoneInput) signupPhoneInput.disabled = true;
                if(signupPasswordInput) signupPasswordInput.disabled = true;
                if(registerEmailBtn) registerEmailBtn.disabled = true;
                if(registerPhoneBtn) registerPhoneBtn.disabled = true;
                signUpAsButtons.forEach(btn => btn.disabled = true);
                sendOtpButton.disabled = true;
                
                // Add disabled class for styling
                if(signUpAsToggle) signUpAsToggle.classList.add('disabled');
                if(registerWithToggle) registerWithToggle.classList.add('disabled');
                // --- End of new code ---

            } else {
                console.log('Step 1 Validation Failed');
            }
        });
    }

    // --- 3. "Verify OTP" Button Click ---
    if (verifyOtpButton) {
        verifyOtpButton.addEventListener('click', function() {
            // Here you would validate the OTP
            console.log('OTP Verified (simulation)');
            if(step1Account) step1Account.style.display = 'none';
            if(step2Personal) step2Personal.style.display = 'block';
        });
    }

    // --- 4. "Back" Button Click (UPDATED) ---
    if (backButton) {
        backButton.addEventListener('click', function() {
            if(step2Personal) step2Personal.style.display = 'none';
            if(step1Account) step1Account.style.display = 'block';

            // --- NEW: Re-enable all inputs ---
            if(signupEmailInput) signupEmailInput.disabled = false;
            if(signupPhoneInput) signupPhoneInput.disabled = false;
            if(signupPasswordInput) signupPasswordInput.disabled = false;
            if(registerEmailBtn) registerEmailBtn.disabled = false;
            if(registerPhoneBtn) registerPhoneBtn.disabled = false;
            signUpAsButtons.forEach(btn => btn.disabled = false);
            if(sendOtpButton) sendOtpButton.disabled = false;
            
            // Remove disabled class
            if(signUpAsToggle) signUpAsToggle.classList.remove('disabled');
            if(registerWithToggle) registerWithToggle.classList.remove('disabled');

            // Hide OTP section
            if(otpSection) otpSection.style.display = 'none';
            // --- End of new code ---
        });
    }

    // --- 5. Password Toggle ---
    if (togglePassword && signupPasswordInput) {
        togglePassword.addEventListener('click', function() {
            const type = signupPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            signupPasswordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    // --- 5b. PASSWORD CHECKLIST LOGIC ---
    if (signupPasswordInput && passChecklist) {
        signupPasswordInput.addEventListener('focus', () => {
            passChecklist.style.display = 'block';
        });
        
        signupPasswordInput.addEventListener('keyup', () => {
            const pass = signupPasswordInput.value;
            validateCheck(passLength, pass.length >= 8);
            validateCheck(passCapital, /[A-Z]/.test(pass));
            validateCheck(passNumber, /[0-9]/.test(pass));
            validateCheck(passSymbol, /[^A-Za-z0-9]/.test(pass));
        });
    }
    
    function validateCheck(element, is_valid) {
        if (!element) return;
        if (is_valid) {
            element.classList.add('valid');
        } else {
            element.classList.remove('valid');
        }
    }

    // --- 6. Sliding Toggle Logic ---
    function setupSlidingToggle(selectorElement) {
        if (!selectorElement) return;
        const glider = selectorElement.querySelector('.glider');
        const buttons = selectorElement.querySelectorAll('.role-button');
        
        if (!glider || buttons.length === 0) return;

        const activeButton = selectorElement.querySelector('.role-button.active');
        if (activeButton) {
            glider.style.width = `${activeButton.offsetWidth}px`;
            glider.style.transform = `translateX(${activeButton.offsetLeft - 3}px)`;
        }

        buttons.forEach(button => {
            button.addEventListener('click', function() {
                if (this.disabled) return; // Do nothing if disabled
                buttons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                glider.style.width = `${this.offsetWidth}px`;
                glider.style.transform = `translateX(${this.offsetLeft - 3}px)`;
            });
        });
    }
    
    setupSlidingToggle(signUpAsToggle);
    setupSlidingToggle(registerWithToggle);


    // --- 7. Continuous OTP Input Logic ---
    setupOtpInput(signupOtpInputs);


    // --- 8. Email/Phone Toggle Logic ---
    if (registerEmailBtn && registerPhoneBtn && emailFormGroup && phoneFormGroup) {
        registerEmailBtn.addEventListener('click', function() {
            if (this.disabled) return; // Do nothing if disabled
            emailFormGroup.style.display = 'block';
            phoneFormGroup.style.display = 'none';
        });
        registerPhoneBtn.addEventListener('click', function() {
            if (this.disabled) return; // Do nothing if disabled
            emailFormGroup.style.display = 'none';
            phoneFormGroup.style.display = 'block';
        });
    }

    // --- 9. Phone Input Validation (Numbers Only) ---
    if (signupPhoneInput) {
        signupPhoneInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }

    // --- 10. Validation Helper Functions ---
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
        if(errorDisplay) {
            errorDisplay.innerText = '';
        }
        formGroup.classList.remove('error');
    }

    function isValidEmail(email) {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

    // --- 11. Step 1 Validation Function ---
    function validateStep1() {
        let isValid = true;
        const passwordValue = signupPasswordInput.value.trim();
        const isEmailActive = registerEmailBtn.classList.contains('active');

        if (isEmailActive) {
            const emailValue = signupEmailInput.value.trim();
            if (emailValue === '') {
                setError(signupEmailInput, 'errRequired');
                isValid = false;
            } else if (!isValidEmail(emailValue)) {
                setError(signupEmailInput, 'errEmail');
                isValid = false;
            } else {
                setSuccess(signupEmailInput);
            }
        } else {
            const phoneValue = signupPhoneInput.value.trim();
            if (phoneValue === '') {
                setError(signupPhoneInput, 'errRequired');
                isValid = false;
            } else if (phoneValue.length < 10) {
                setError(signupPhoneInput, 'errPhoneLength');
                isValid = false;
            } else {
                setSuccess(signupPhoneInput);
            }
        }

        // Validate Password (common to both)
        if (passwordValue === '') {
            setError(signupPasswordInput, 'errRequired');
            isValid = false;
        } else if (passwordValue.length < 8) {
            setError(signupPasswordInput, 'errPassLength');
            isValid = false;
        } else {
            setSuccess(signupPasswordInput);
        }

        return isValid;
    }

    // --- 12. Central OTP setup function ---
    function setupOtpInput(otpInputs) {
        otpInputs.forEach((input, index) => {
            input.addEventListener('input', function() {
                this.value = this.value.replace(/[^0-9]/g, '');
                if (this.value && index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
            });
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

    // --- 13. Populate Birthday Dropdowns ---
    function populateDays() {
        if (!dayDropdown) return;
        for (let i = 1; i <= 31; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.text = i;
            dayDropdown.appendChild(option);
        }
    }

    function populateYears() {
        if (!yearDropdown) return;
        const currentYear = new Date().getFullYear();
        const maxYear = currentYear - 18; // Must be 18+
        const minYear = currentYear - 100; // Max 100 years old

        for (let i = maxYear; i >= minYear; i--) {
            const option = document.createElement('option');
            option.value = i;
            option.text = i;
            yearDropdown.appendChild(option);
        }
    }

    populateDays();
    populateYears();

});