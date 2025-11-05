document.addEventListener("DOMContentLoaded", function() {
    
    const loginForm = document.getElementById('login-form');
    
    const roleButtons = document.querySelectorAll('.role-button');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.querySelector('.password-toggle');

    const emailLoginSection = document.getElementById('email-login-section');
    const phoneLoginSection = document.getElementById('phone-login-section');
    const showPhoneLoginBtn = document.getElementById('show-phone-login-btn');
    const showEmailLoginLink = document.getElementById('show-email-login-link');
    const loginPhoneInput = document.getElementById('login-phone');
    const loginSendOtpBtn = document.getElementById('login-send-otp-btn');
    const loginOtpSection = document.getElementById('login-otp-section');
    const loginOtpInputs = loginOtpSection.querySelectorAll('.otp-input');
    
    const emailInput = document.getElementById('email');

    const langEnBtn = document.getElementById('lang-en');
    const langFilBtn = document.getElementById('lang-fil');
    const translatableElements = document.querySelectorAll('[data-key]');
    let currentLang = 'en'; 

    if (roleButtons.length > 0) {
        roleButtons.forEach(button => {
            button.addEventListener('click', function() {
                roleButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active'); 
            });
        });
    }

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    if (showPhoneLoginBtn && showEmailLoginLink && emailLoginSection && phoneLoginSection) {
        showPhoneLoginBtn.addEventListener('click', function() {
            emailLoginSection.style.display = 'none';
            phoneLoginSection.style.display = 'block';
        });
        showEmailLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            emailLoginSection.style.display = 'block';
            phoneLoginSection.style.display = 'none';
        });
    }

    if (loginSendOtpBtn) {
        loginSendOtpBtn.addEventListener('click', function() {
            if (validatePhoneInput()) {
                setSuccess(loginPhoneInput);
                loginOtpSection.style.display = 'block';
                loginSendOtpBtn.textContent = langStrings[currentLang]['sendOtp'];
                console.log('Login OTP Sent (simulation)');
            }
        });
    }

    if (loginPhoneInput) {
        loginPhoneInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }

    setupOtpInput(loginOtpInputs);
    
    function setError(input, messageKey) {
        const message = langStrings[currentLang][messageKey] || messageKey; 
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

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            let isEmailValid = validateEmailForm();
            if (isEmailValid) {
                console.log('Email Form is Valid! Submitting... (simulation)');
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

    try {
        const setLanguage = (lang) => {
            currentLang = lang;
            document.documentElement.lang = lang;
            
            translatableElements.forEach(el => {
                const key = el.getAttribute('data-key');
                if (!key) return;
               
                const translation = (langStrings[lang] && langStrings[lang][key]) ? langStrings[lang][key] : langStrings['en'][key];
                
                if (translation) {
                    if (el.tagName === 'TITLE') {
                        document.title = "KomuniKonek | " + translation;
                    } else {
                        el.textContent = translation;
                    }
                }
            });
            
            if (lang === 'fil') {
                langFilBtn.classList.add('active');
                langEnBtn.classList.remove('active');
            } else {
                langEnBtn.classList.add('active');
                langFilBtn.classList.remove('active');
            }
        };

        if (langEnBtn && langFilBtn) {
            langEnBtn.addEventListener('click', () => setLanguage('en'));
            langFilBtn.addEventListener('click', () => setLanguage('fil'));
        }


        setLanguage('en');
    } catch (e) {
        console.error("Translation script failed. Page will work in default language.", e);

    }

});