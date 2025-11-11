document.addEventListener("DOMContentLoaded", function() {
    
    // --- 1. Get ALL Elements ---
    const loginForm = document.getElementById('login-form');
    const roleSelector = document.querySelector('.role-selector');
    const roleButtons = document.querySelectorAll('.role-button');
    const glider = document.querySelector('.glider');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.querySelector('.password-toggle');
    const emailLoginSection = document.getElementById('email-login-section');
    const phoneLoginSection = document.getElementById('phone-login-section');
    const showPhoneLoginBtn = document.getElementById('show-phone-login-btn');
    const showEmailLoginLink = document.getElementById('show-email-login-link');
    const loginPhoneInput = document.getElementById('login-phone');
    const loginSendOtpBtn = document.getElementById('login-send-otp-btn');
    const loginOtpSection = document.getElementById('login-otp-section');
    const loginOtpInputs = document.querySelectorAll('#login-otp-section .otp-input');
    const emailInput = document.getElementById('email');
    const langEnBtn = document.getElementById('lang-en');
    const langFilBtn = document.getElementById('lang-fil');
    const translatableElements = document.querySelectorAll('[data-key]');
    let currentLang = 'en';
    const loginVerifyOtpBtn = document.getElementById('login-verify-otp-btn');
    const slides = document.querySelectorAll(".slide");
    const dots = document.querySelectorAll(".dot");
    const slidePrevBtn = document.getElementById('slide-prev');
    const slideNextBtn = document.getElementById('slide-next');

    // --- =============================== ---
    // --- CORE LOGIC (Resilient) ---
    // --- =============================== ---

    // --- 2. Sliding Role Selector ---
    if (roleSelector && roleButtons.length > 0 && glider) {
        const activeButton = document.querySelector('.role-button.active');
        if (activeButton) {
            glider.style.width = `${activeButton.offsetWidth}px`;
            glider.style.transform = `translateX(${activeButton.offsetLeft}px)`;
        }
        roleButtons.forEach(button => {
            button.addEventListener('click', function() {
                roleButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                glider.style.width = `${this.offsetWidth}px`;
                glider.style.transform = `translateX(${this.offsetLeft}px)`;
            });
        });
    }

    // --- 3. Password Show/Hide Toggle ---
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    // --- 4. Phone Login Toggle Logic ---
    if (showPhoneLoginBtn && showEmailLoginLink && emailLoginSection && phoneLoginSection) {
        showPhoneLoginBtn.addEventListener('click', function() {
            emailLoginSection.style.display = 'none';
            phoneLoginSection.style.display = 'block';
        });
        showEmailLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            emailLoginSection.style.display = 'block';
            phoneLoginSection.style.display = 'none';
            
            if(loginPhoneInput) loginPhoneInput.disabled = false;
            if(loginSendOtpBtn) loginSendOtpBtn.disabled = false;
            if(roleSelector) roleSelector.classList.remove('disabled');
            roleButtons.forEach(btn => btn.disabled = false);
            if(loginOtpSection) loginOtpSection.style.display = 'none';
        });
    }

    // --- 5. "Send OTP" (Login) Button Logic ---
    if (loginSendOtpBtn) {
        loginSendOtpBtn.addEventListener('click', function() {
            if (validatePhoneInput()) {
                setSuccess(loginPhoneInput);
                if(loginOtpSection) loginOtpSection.style.display = 'block';
                this.textContent = (langStrings[currentLang] && langStrings[currentLang]['sendOtp']) ? langStrings[currentLang]['sendOtp'] : 'Send OTP';
                console.log('Login OTP Sent (simulation)');

                if(loginPhoneInput) loginPhoneInput.disabled = true;
                if(loginSendOtpBtn) loginSendOtpBtn.disabled = true;
                if(roleSelector) roleSelector.classList.add('disabled');
                roleButtons.forEach(btn => btn.disabled = true);
            }
        });
    }

    // --- 5b. "Verify & Sign In" (Phone) Button Logic ---
    if (loginVerifyOtpBtn) {
        loginVerifyOtpBtn.addEventListener('click', function() {
            console.log('Phone OTP Verified! Submitting... (simulation)');
            const activeRoleButton = document.querySelector('.role-selector .role-button.active');
            if (activeRoleButton && activeRoleButton.textContent.trim() === 'Admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'index.html';
            }
        });
    }

    // --- 6. Phone Input Validation (Numbers Only) ---
    if (loginPhoneInput) {
        loginPhoneInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }

    // --- 7. Continuous OTP Input Logic ---
    setupOtpInput(loginOtpInputs);
    
    // --- 8. Validation Helper Functions ---
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

    // --- 9. Main Form Submit Listener (for EMAIL form) ---
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            let isEmailValid = validateEmailForm();
            if (isEmailValid) {
                console.log('Email Form is Valid! Submitting... (simulation)');
                const activeRoleButton = document.querySelector('.role-selector .role-button.active');
                if (activeRoleButton && activeRoleButton.textContent.trim() === 'Admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'index.html';
                }
            }
        });
    }
    function validateEmailForm() {
        let isValid = true;
        const emailValue = emailInput.value.trim();
        const passwordValue = passwordInput.value.trim();
        if (emailValue === '') {
            setError(emailInput, 'errRequired');
            isValid = false;
        } else if (!isValidEmail(emailValue)) {
            setError(emailInput, 'errEmail');
            isValid = false;
        } else {
            setSuccess(emailInput);
        }
        if (passwordValue === '') {
            setError(passwordInput, 'errRequired');
            isValid = false;
        } else if (passwordValue.length < 8) {
            setError(passwordInput, 'errPassLength');
            isValid = false;
        } else {
            setSuccess(passwordInput);
        }
        return isValid;
    }
    function validatePhoneInput() {
        const phoneValue = loginPhoneInput.value.trim();
        if (phoneValue.length < 10) {
            setError(loginPhoneInput, 'errPhoneLength');
            return false;
        } else {
            setSuccess(loginPhoneInput);
            return true;
        }
    }

    // --- 10. Central OTP setup function ---
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

    // --- 11. I18N (TRANSLATION) LOGIC ---
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
    
    // --- 12. SLIDESHOW LOGIC ---
    
    let slideIndex = 0;
    let slideInterval; 

    function showSlide(n) {
        if (slides.length === 0) return;
        slideIndex = (n + slides.length) % slides.length;
        slides.forEach(slide => slide.style.display = "none");
        dots.forEach(dot => dot.classList.remove("active"));
        if (slides[slideIndex] && dots[slideIndex]) {
            slides[slideIndex].style.display = "block";
            dots[slideIndex].classList.add("active");
        }
    }

    function nextSlide() {
        showSlide(++slideIndex);
    }

    function prevSlide() {
        showSlide(--slideIndex);
    }
    
    function resetSlideTimer() {
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, 4000);
    }

    dots.forEach((dot, index) => {
        dot.addEventListener("click", function() {
            showSlide(index);
            resetSlideTimer();
        });
    });

    if (slidePrevBtn && slideNextBtn) {
        slidePrevBtn.addEventListener('click', () => {
            prevSlide();
            resetSlideTimer();
        });
        slideNextBtn.addEventListener('click', () => {
            nextSlide();
            resetSlideTimer();
        });
    }

    showSlide(slideIndex);
    resetSlideTimer();

});