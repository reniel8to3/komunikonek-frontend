document.addEventListener("DOMContentLoaded", function() {

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
    
    const signupOtpInputs = otpSection.querySelectorAll('.otp-input');

    sendOtpButton.addEventListener('click', function() {
        
        if (validateStep1()) {
            otpSection.style.display = 'block';
            sendOtpButton.textContent = 'Resend OTP';
            console.log('OTP Sent (simulation)');
        } else {
            console.log('Step 1 Validation Failed');
        }
    });

    verifyOtpButton.addEventListener('click', function() {
        console.log('OTP Verified (simulation)');
        step1Account.style.display = 'none';
        step2Personal.style.display = 'block';
    });

    backButton.addEventListener('click', function() {
        step2Personal.style.display = 'none';
        step1Account.style.display = 'block';
    });

    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const type = signupPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            signupPasswordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    const allRoleSelectors = document.querySelectorAll('.role-selector');
    allRoleSelectors.forEach(selector => {
        if (selector.id === 'register-with-selector') {
            return; 
        }
        const buttons = selector.querySelectorAll('.role-button');
        buttons.forEach(button => {
            button.addEventListener('click', function() {
                buttons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
            });
        });
    });

    setupOtpInput(signupOtpInputs);

    registerEmailBtn.addEventListener('click', function() {
        this.classList.add('active');
        registerPhoneBtn.classList.remove('active');
        emailFormGroup.style.display = 'block';
        phoneFormGroup.style.display = 'none';
    });
    registerPhoneBtn.addEventListener('click', function() {
        this.classList.add('active');
        registerEmailBtn.classList.remove('active');
        emailFormGroup.style.display = 'none';
        phoneFormGroup.style.display = 'block';
    });

    if (signupPhoneInput) {
        signupPhoneInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }

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

    function validateStep1() {
        let isValid = true;
        const passwordValue = signupPasswordInput.value.trim();
        
        const isEmailActive = registerEmailBtn.classList.contains('active');

        if (isEmailActive) {
            const emailValue = signupEmailInput.value.trim();
            if (emailValue === '') {
                setError(signupEmailInput, 'Email is required');
                isValid = false;
            } else if (!isValidEmail(emailValue)) {
                setError(signupEmailInput, 'Provide a valid email address (e.g., user@domain.com)');
                isValid = false;
            } else {
                setSuccess(signupEmailInput);
            }
        } else {
            const phoneValue = signupPhoneInput.value.trim();
            if (phoneValue === '') {
                setError(signupPhoneInput, 'Phone number is required');
                isValid = false;
            } else if (phoneValue.length < 10) {
                setError(signupPhoneInput, 'Please enter a 10-digit phone number');
                isValid = false;
            } else {
                setSuccess(signupPhoneInput);
            }
        }

        if (passwordValue === '') {
            setError(signupPasswordInput, 'Password is required');
            isValid = false;
        } else if (passwordValue.length < 8) {
            setError(signupPasswordInput, 'Password must be at least 8 characters long');
            isValid = false;
        } else {
            setSuccess(signupPasswordInput);
        }

        return isValid;
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

});