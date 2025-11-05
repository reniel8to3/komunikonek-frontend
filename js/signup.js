document.addEventListener("DOMContentLoaded", function() {

    // --- 1. Get ALL Elements ---
    const step1Account = document.getElementById('step-1-account');
    const step2Personal = document.getElementById('step-2-personal');
    
    const sendOtpButton = document.getElementById('send-otp-button');
    const otpSection = document.getElementById('otp-section');
    const verifyOtpButton = document.getElementById('verify-otp-button');
    const backButton = document.getElementById('back-button');

    // Step 1 Form Inputs
    const signupEmailInput = document.getElementById('email');
    const signupPasswordInput = document.getElementById('password');
    const signupPhoneInput = document.getElementById('phone');
    const togglePassword = document.querySelector('.password-toggle');

    // Email/Phone Toggle
    const registerEmailBtn = document.getElementById('register-email-btn');
    const registerPhoneBtn = document.getElementById('register-phone-btn');
    const emailFormGroup = document.getElementById('email-form-group');
    const phoneFormGroup = document.getElementById('phone-form-group');
    
    // OTP Inputs
    const signupOtpInputs = otpSection.querySelectorAll('.otp-input');


    // --- 2. "Send OTP" Button Click (NOW WITH VALIDATION) ---
    sendOtpButton.addEventListener('click', function() {
        
        // Run validation first
        if (validateStep1()) {
            // If valid, show OTP section
            otpSection.style.display = 'block';
            sendOtpButton.textContent = 'Resend OTP';
            console.log('OTP Sent (simulation)');
        } else {
            console.log('Step 1 Validation Failed');
        }
    });

    // --- 3. "Verify OTP" Button Click ---
    verifyOtpButton.addEventListener('click', function() {
        // Here you would validate the OTP
        console.log('OTP Verified (simulation)');
        step1Account.style.display = 'none';
        step2Personal.style.display = 'block';
    });

    // --- 4. "Back" Button Click ---
    backButton.addEventListener('click', function() {
        step2Personal.style.display = 'none';
        step1Account.style.display = 'block';
    });

    // --- 5. Password Toggle ---
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const type = signupPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            signupPasswordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    // --- 6. Role Selector Toggles ---
    const allRoleSelectors = document.querySelectorAll('.role-selector');
    allRoleSelectors.forEach(selector => {
        if (selector.id === 'register-with-selector') {
            return; // Skip this one, it has custom logic
        }
        const buttons = selector.querySelectorAll('.role-button');
        buttons.forEach(button => {
            button.addEventListener('click', function() {
                buttons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
            });
        });
    });

    // --- 7. Continuous OTP Input Logic ---
    setupOtpInput(signupOtpInputs);


    // --- 8. Email/Phone Toggle Logic ---
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

    // --- 9. Phone Input Validation (Numbers Only) ---
    if (signupPhoneInput) {
        signupPhoneInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }

    // --- =============================== ---
    // --- NEW: VALIDATION HELPER FUNCTIONS ---
    // --- =============================== ---

    // 10. Helper Functions
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

    // 11. Step 1 Validation Function
    function validateStep1() {
        let isValid = true;
        const passwordValue = signupPasswordInput.value.trim();
        
        // Check which tab is active
        const isEmailActive = registerEmailBtn.classList.contains('active');

        if (isEmailActive) {
            // Validate Email
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
            // Validate Phone
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

        // Validate Password (common to both)
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

    // 12. Central OTP setup function
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