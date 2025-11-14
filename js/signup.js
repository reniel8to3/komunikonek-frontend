// js/signup.js
import { 
    auth, 
    db, 
    createUserWithEmailAndPassword, 
    sendEmailVerification,
    signOut,
    RecaptchaVerifier, 
    signInWithPhoneNumber,
    doc,
    setDoc,
    serverTimestamp
} from './firebase.js';
import { langStrings } from './translations.js';

document.addEventListener("DOMContentLoaded", function() {
    
    // ============================================
    // FIREBASE STATE
    // ============================================
    let confirmationResult = null;
    let recaptchaVerifier = null;

    // ============================================
    // STATE MANAGEMENT
    // ============================================
    const AppState = {
        currentLang: 'en',
        currentStep: 1,
        registrationType: 'email', 
        accountType: 'user', 
        otpSent: false,
        otpVerified: false,
        otpTimer: null,
        otpCountdown: 60
    };

    // ============================================
    // DOM ELEMENTS
    // ============================================
    const Elements = {
        langEnBtn: document.getElementById('lang-en'),
        langFilBtn: document.getElementById('lang-fil'),
        step1: document.getElementById('step-1-account'),
        step2: document.getElementById('step-2-personal'),
        backButton: document.getElementById('back-button'),
        signupAsSelector: document.getElementById('signup-as-selector'),
        signupAsButtons: document.querySelectorAll('#signup-as-selector .role-button'),
        registerWithSelector: document.getElementById('register-with-selector'),
        registerEmailBtn: document.getElementById('register-email-btn'),
        registerPhoneBtn: document.getElementById('register-phone-btn'),
        emailFormGroup: document.getElementById('email-form-group'),
        phoneFormGroup: document.getElementById('phone-form-group'),
        passwordFormGroup: document.getElementById('password-form-group'),
        emailInput: document.getElementById('email'),
        phoneInput: document.getElementById('phone'),
        passwordInput: document.getElementById('password'),
        passwordToggle: document.querySelector('.password-toggle'),
        passChecklist: document.getElementById('password-checklist'),
        passLength: document.getElementById('pass-length'),
        passCapital: document.getElementById('pass-capital'),
        passNumber: document.getElementById('pass-number'),
        passSymbol: document.getElementById('pass-symbol'),
        sendOtpButton: document.getElementById('send-otp-button'),
        sendOtpButtonText: document.querySelector('#send-otp-button .button-text'),
        otpSection: document.getElementById('otp-section'),
        otpInputs: document.querySelectorAll('.otp-input'),
        verifyOtpButton: document.getElementById('verify-otp-button'),
        resendOtpButton: document.getElementById('resend-otp-button'),
        otpCountdownSpan: document.getElementById('otp-countdown'),
        otpTimerDisplay: document.getElementById('otp-timer'), // Renamed
        firstNameInput: document.getElementById('first-name'),
        lastNameInput: document.getElementById('last-name'),
        middleNameInput: document.getElementById('middle-name'),
        houseNumberInput: document.getElementById('house-number'),
        streetInput: document.getElementById('street'),
        monthSelect: document.getElementById('month'),
        daySelect: document.getElementById('day'),
        yearSelect: document.getElementById('year'),
        signupFormStep2: document.getElementById('signup-form-step2'),
        slides: document.querySelectorAll('.slide'),
        dots: document.querySelectorAll('.dot'),
        slidePrevBtn: document.getElementById('slide-prev'),
        slideNextBtn: document.getElementById('slide-next'),
        toast: document.getElementById('toast')
    };
    
    // ============================================
    // FIREBASE RECAPTCHA SETUP
    // ============================================
    function setupRecaptcha() {
        if (recaptchaVerifier) {
            recaptchaVerifier.clear(); 
        }
        recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': (response) => { console.log("reCAPTCHA verified"); },
            'expired-callback': () => { setupRecaptcha(); }
        });
    }
    setupRecaptcha(); 

    // ============================================
    // TRANSLATION / I18N
    // ============================================
    function setLanguage(lang) {
        if (typeof langStrings === 'undefined' || !langStrings[lang]) return;
        AppState.currentLang = lang;
        document.documentElement.lang = lang;
        
        document.querySelectorAll('[data-key]').forEach(el => {
            const key = el.getAttribute('data-key');
            if (!key || !langStrings[lang][key]) return;
            const translation = langStrings[lang][key];
            
            if (el.tagName === 'TITLE') {
                document.title = "KomuniKonek | " + translation;
            } else if (el.tagName === 'OPTION') {
                if (el.value === "") el.textContent = translation;
            } else {
                el.textContent = translation;
            }
        });
        
        Elements.langEnBtn?.classList.toggle('active', lang === 'en');
        Elements.langFilBtn?.classList.toggle('active', lang === 'fil');
        updateContinueButtonText(lang);
    }
    
    function updateContinueButtonText(lang) {
        if (Elements.sendOtpButtonText) {
            let key = (AppState.registrationType === 'email') ? 'continueBtn' : 'sendOtp';
            if (langStrings[lang]?.[key]) {
                Elements.sendOtpButtonText.textContent = langStrings[lang][key];
            }
        }
    }
    Elements.langEnBtn?.addEventListener('click', () => setLanguage('en'));
    Elements.langFilBtn?.addEventListener('click', () => setLanguage('fil'));
    
    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    function showElement(element) { element?.classList.remove('hidden'); }
    function hideElement(element) { element?.classList.add('hidden'); }
    
    function setButtonLoading(button, isLoading, text = null) {
        if (!button) return;
        button.disabled = isLoading;
        const textSpan = button.querySelector('.button-text');
        const loaderSpan = button.querySelector('.button-loader');
        
        if (textSpan) textSpan.style.display = isLoading ? 'none' : '';
        if (loaderSpan) loaderSpan.style.display = isLoading ? 'inline-block' : 'none';
        
        if (text && textSpan && !isLoading) {
            textSpan.textContent = text;
        }
    }
    
    function showToast(message, type = 'info') {
        if (!Elements.toast) return;
        Elements.toast.textContent = message;
        Elements.toast.className = `toast ${type}`;
        showElement(Elements.toast);
        setTimeout(() => { hideElement(Elements.toast); }, 3000);
    }
    
    // ============================================
    // VALIDATION FUNCTIONS
    // ============================================
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }
    function isValidPhone(phone) { return /^[0-9]{10}$/.test(phone); }
    function isValidPassword(password) {
        return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
    }
    
    function setError(input, messageKey) {
        if (!input) return;
        let message = messageKey;
        if (langStrings[AppState.currentLang]?.[messageKey]) {
            message = langStrings[AppState.currentLang][messageKey];
        }
        const formGroup = input.closest('.form-group');
        if (!formGroup) return;
        const errorDisplay = formGroup.querySelector('.error-message');
        if (errorDisplay) errorDisplay.textContent = message;
        formGroup.classList.add('error');
    }
    function setSuccess(input) {
        if (!input) return;
        const formGroup = input.closest('.form-group');
        if (!formGroup) return;
        const errorDisplay = formGroup.querySelector('.error-message');
        if (errorDisplay) errorDisplay.textContent = '';
        formGroup.classList.remove('error');
    }
    
    function validateStep1() {
        let isValid = true;
        
        if (AppState.registrationType === 'email') {
            const emailValue = Elements.emailInput?.value.trim();
            if (!emailValue) {
                setError(Elements.emailInput, 'errRequired'); isValid = false;
            } else if (!isValidEmail(emailValue)) {
                setError(Elements.emailInput, 'errEmail'); isValid = false;
            } else { setSuccess(Elements.emailInput); }
            
            const passwordValue = Elements.passwordInput?.value.trim();
            if (!passwordValue) {
                setError(Elements.passwordInput, 'errRequired'); isValid = false;
            } else if (!isValidPassword(passwordValue)) {
                setError(Elements.passwordInput, 'errPassRequirements'); isValid = false;
            } else { setSuccess(Elements.passwordInput); }
            
        } else { // 'phone'
            const phoneValue = Elements.phoneInput?.value.trim();
            if (!phoneValue) {
                setError(Elements.phoneInput, 'errRequired'); isValid = false;
            } else if (!isValidPhone(phoneValue)) {
                setError(Elements.phoneInput, 'errPhoneLength'); isValid = false;
            } else { setSuccess(Elements.phoneInput); }
            
            setSuccess(Elements.passwordInput); // Not required for phone
        }
        return isValid;
    }
    
    function validateStep2() {
        let isValid = true;
        const requiredFields = [
            { input: Elements.firstNameInput, key: 'errRequired' },
            { input: Elements.lastNameInput, key: 'errRequired' },
            { input: Elements.houseNumberInput, key: 'errRequired' },
            { input: Elements.streetInput, key: 'errRequired' },
            { input: Elements.monthSelect, key: 'errRequired' },
            { input: Elements.daySelect, key: 'errRequired' },
            { input: Elements.yearSelect, key: 'errRequired' }
        ];
        
        requiredFields.forEach(field => {
            if (!field.input?.value.trim()) {
                setError(field.input, field.key); isValid = false;
            } else { setSuccess(field.input); }
        });
        return isValid;
    }

    // ============================================
    // PASSWORD HANDLING
    // ============================================
    function updatePasswordChecklist(password) {
        if (!Elements.passChecklist) return;
        const checks = [
            { element: Elements.passLength, valid: password.length >= 8 },
            { element: Elements.passCapital, valid: /[A-Z]/.test(password) },
            { element: Elements.passNumber, valid: /[0-9]/.test(password) },
            { element: Elements.passSymbol, valid: /[^A-Za-z0-9]/.test(password) }
        ];
        checks.forEach(check => { check.element?.classList.toggle('valid', check.valid); });
    }
    Elements.passwordInput?.addEventListener('focus', () => { showElement(Elements.passChecklist); });
    Elements.passwordInput?.addEventListener('blur', () => {
        if (!isValidPassword(Elements.passwordInput.value) && Elements.passwordInput.value.length > 0) return;
        hideElement(Elements.passChecklist);
    });
    Elements.passwordInput?.addEventListener('input', (e) => { updatePasswordChecklist(e.target.value); });
    Elements.passwordToggle?.addEventListener('click', function() {
        if (!Elements.passwordInput) return;
        const type = Elements.passwordInput.type === 'password' ? 'text' : 'password';
        Elements.passwordInput.type = type;
        const icon = this.querySelector('i');
        icon?.classList.toggle('fa-eye');
        icon?.classList.toggle('fa-eye-slash');
        this.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
    });

    // ============================================
    // TOGGLE HANDLERS
    // ============================================
    function setupSlidingToggle(selectorElement) {
        if (!selectorElement) return;
        const glider = selectorElement.querySelector('.glider');
        const buttons = selectorElement.querySelectorAll('.role-button');
        if (!glider || buttons.length === 0) return;
        const updateGlider = (button) => {
            glider.style.width = `${button.offsetWidth}px`;
            glider.style.transform = `translateX(${button.offsetLeft}px)`;
        };
        const activeButton = selectorElement.querySelector('.role-button.active');
        if (activeButton) updateGlider(activeButton);
        buttons.forEach(button => {
            button.addEventListener('click', function() {
                if (this.disabled) return;
                buttons.forEach(btn => {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-checked', 'false');
                });
                this.classList.add('active');
                this.setAttribute('aria-checked', 'true');
                updateGlider(this);
            });
        });
    }
    setupSlidingToggle(Elements.signupAsSelector);
    setupSlidingToggle(Elements.registerWithSelector);
    
    Elements.signupAsButtons?.forEach(button => {
        button.addEventListener('click', function() {
            AppState.accountType = this.dataset.role || 'user';
        });
    });
    
    Elements.registerEmailBtn?.addEventListener('click', function() {
        if (this.disabled) return;
        AppState.registrationType = 'email';
        AppState.otpVerified = false; 
        showElement(Elements.emailFormGroup);
        showElement(Elements.passwordFormGroup); 
        hideElement(Elements.phoneFormGroup);
        hideElement(Elements.otpSection); 
        showElement(Elements.sendOtpButton);
        updateContinueButtonText(AppState.currentLang);
        if (Elements.phoneInput) {
            setSuccess(Elements.phoneInput);
            Elements.phoneInput.value = '';
        }
    });
    
    Elements.registerPhoneBtn?.addEventListener('click', function() {
        if (this.disabled) return;
        AppState.registrationType = 'phone';
        AppState.otpVerified = false; 
        hideElement(Elements.emailFormGroup);
        hideElement(Elements.passwordFormGroup); 
        showElement(Elements.phoneFormGroup);
        showElement(Elements.sendOtpButton); 
        updateContinueButtonText(AppState.currentLang); 
        if (Elements.emailInput) {
            setSuccess(Elements.emailInput);
            Elements.emailInput.value = '';
        }
        if (Elements.passwordInput) {
            setSuccess(Elements.passwordInput);
            Elements.passwordInput.value = '';
        }
    });

    // ============================================
    // OTP HANDLING
    // ============================================
    function setupOtpInputs() {
        Elements.otpInputs.forEach((input, index) => {
            input.addEventListener('input', function() {
                this.value = this.value.replace(/[^0-9]/g, '');
                if (this.value && index < Elements.otpInputs.length - 1) {
                    Elements.otpInputs[index + 1].focus();
                }
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !input.value && index > 0) {
                    e.preventDefault();
                    Elements.otpInputs[index - 1].focus();
                }
            });
        });
    }
    setupOtpInputs();
    
    function startOtpTimer() {
        AppState.otpCountdown = 60;
        if (Elements.resendOtpButton) hideElement(Elements.resendOtpButton);
        if (Elements.otpTimerDisplay) showElement(Elements.otpTimerDisplay);
        
        if (AppState.otpTimer) clearInterval(AppState.otpTimer);
        
        AppState.otpTimer = setInterval(() => {
            AppState.otpCountdown--;
            if (Elements.otpCountdownSpan) {
                Elements.otpCountdownSpan.textContent = AppState.otpCountdown;
            }
            if (AppState.otpCountdown <= 0) {
                clearInterval(AppState.otpTimer);
                hideElement(Elements.otpTimerDisplay);
                showElement(Elements.resendOtpButton);
            }
        }, 1000);
    }
    
    function getOtpCode() {
        return Array.from(Elements.otpInputs).map(input => input.value).join('');
    }
    function clearOtpInputs() {
        Elements.otpInputs.forEach(input => { input.value = ''; });
        Elements.otpInputs[0]?.focus();
    }
    
    function disableStep1Inputs(disabled) {
        if (Elements.emailInput) Elements.emailInput.disabled = disabled;
        if (Elements.phoneInput) Elements.phoneInput.disabled = disabled;
        if (Elements.passwordInput) Elements.passwordInput.disabled = disabled;
        Elements.signupAsSelector?.classList.toggle('disabled', disabled);
        Elements.registerWithSelector?.classList.toggle('disabled', disabled);
    }
    
    // --- "Continue" / "Send OTP" Button ---
    Elements.sendOtpButton?.addEventListener('click', async function() {
        if (!validateStep1()) {
            showToast('Please fix the errors before continuing', 'error');
            return;
        }
        
        setButtonLoading(this, true);
        
        if (AppState.registrationType === 'email') {
            AppState.otpVerified = true; 
            
            hideElement(Elements.step1);
            showElement(Elements.step2);
            AppState.currentStep = 2;
            Elements.firstNameInput?.focus();
            
            setButtonLoading(this, false);

        } else {
            // --- PHONE PATH ---
            try {
                const phoneValue = Elements.phoneInput.value.trim();
                const phoneNumber = '+63' + (phoneValue.startsWith('0') ? phoneValue.substring(1) : phoneValue);

                setupRecaptcha(); 
                console.log("Sending OTP to:", phoneNumber); 
                confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
                
                AppState.otpSent = true;
                showElement(Elements.otpSection);
                startOtpTimer();
                hideElement(Elements.sendOtpButton);
                
                disableStep1Inputs(true);
                
                showToast('OTP sent successfully!', 'success');
                Elements.otpInputs[0]?.focus();

            } catch (error) {
                console.error('Error sending OTP:', error);
                showToast(`Failed to send OTP. Check console and Firebase config.`, 'error');
                if (recaptchaVerifier) {
                    recaptchaVerifier.clear(); 
                }
            } finally {
                setButtonLoading(this, false);
            }
        }
    });
    
    Elements.resendOtpButton?.addEventListener('click', async function() {
        setButtonLoading(this, true); 
        clearOtpInputs();
        
        try {
            const phoneValue = Elements.phoneInput.value.trim();
            const phoneNumber = '+63' + (phoneValue.startsWith('0') ? phoneValue.substring(1) : phoneValue);
            
            setupRecaptcha(); 
            console.log("Resending OTP to:", phoneNumber); 
            confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
            
            startOtpTimer();
            showToast('OTP resent successfully!', 'success');
            
        } catch (error) {
            console.error('Error resending OTP:', error);
            showToast('Failed to resend OTP. Please try again.', 'error');
            if (recaptchaVerifier) {
                recaptchaVerifier.clear(); 
            }
        } finally {
            setButtonLoading(this, false);
        }
    });
    
    Elements.verifyOtpButton?.addEventListener('click', async function() {
        const otpCode = getOtpCode();
        if (otpCode.length !== 6) {
            showToast('Please enter the complete OTP code', 'error');
            return;
        }
        setButtonLoading(this, true);
        
        try {
            if (!confirmationResult) {
                throw new Error("OTP not sent. Please try again.");
            }
            const userCredential = await confirmationResult.confirm(otpCode);
            const user = userCredential.user;
            console.log("Phone user verified:", user.uid);

            AppState.otpVerified = true; 
            clearInterval(AppState.otpTimer);
            
            hideElement(Elements.step1);
            showElement(Elements.step2);
            AppState.currentStep = 2;
            
            showToast('OTP verified successfully!', 'success');
            Elements.firstNameInput?.focus();
            
        } catch (error) {
            console.error('Error verifying OTP:', error);
            showToast('Invalid OTP. Please try again.', 'error');
            clearOtpInputs();
        } finally {
            setButtonLoading(this, false);
        }
    });

    // ============================================
    // STEP NAVIGATION
    // ============================================
    Elements.backButton?.addEventListener('click', function() {
        hideElement(Elements.step2);
        showElement(Elements.step1);
        AppState.currentStep = 1;
        
        if (AppState.otpSent) {
            showElement(Elements.sendOtpButton);
            hideElement(Elements.otpSection);
            clearInterval(AppState.otpTimer);
            AppState.otpSent = false;
            AppState.otpVerified = false; 
            clearOtpInputs();
        }
        
        disableStep1Inputs(false);
        
        confirmationResult = null;
        // If the user was logged in via phone, log them out
        if (auth.currentUser && AppState.registrationType === 'phone') {
            signOut(auth);
        }
    });

    // ============================================
    // FORM SUBMISSIONS (FINAL)
    // ============================================
    Elements.signupFormStep2?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        setButtonLoading(submitButton, true);

        if (!validateStep2()) {
            showToast('Please fill in all required fields', 'error');
            setButtonLoading(submitButton, false);
            return;
        }
        
        if (!AppState.otpVerified) { // Security check
            showToast('Account not verified. Please go back.', 'error');
            setButtonLoading(submitButton, false);
            return;
        }

        const formData = {
            accountType: AppState.accountType,
            firstName: Elements.firstNameInput?.value.trim(),
            lastName: Elements.lastNameInput?.value.trim(),
            middleName: Elements.middleNameInput?.value.trim(),
            address: {
                houseNumber: Elements.houseNumberInput?.value.trim(),
                street: Elements.streetInput?.value.trim()
            },
            birthDate: {
                month: Elements.monthSelect?.value,
                day: Elements.daySelect?.value,
                year: Elements.yearSelect?.value
            },
            createdAt: serverTimestamp() // Use server time
        };

        try {
            let user;

            if (AppState.registrationType === 'email') {
                // --- EMAIL PATH ---
                const email = Elements.emailInput.value;
                const password = Elements.passwordInput.value;
                formData.email = email;
                
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                user = userCredential.user;

                await setDoc(doc(db, "users", user.uid), formData);
                await sendEmailVerification(user);
                await signOut(auth); // Log them out
                
                window.location.href = 'verify-email.html'; 

            } else {
                // --- PHONE PATH ---
                user = auth.currentUser;
                if (!user) throw new Error("User not found. Please sign up again.");

                formData.phone = user.phoneNumber;
                
                await setDoc(doc(db, "users", user.uid), formData);
                
                showToast('Account created successfully!', 'success');
                
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }

        } catch (error) {
            console.error('Error creating account:', error);
            showToast(`Failed to create account: ${error.message}`, 'error');
        } finally {
            setButtonLoading(submitButton, false);
        }
    });

    // ============================================
    // BIRTHDAY DROPDOWNS
    // ============================================
    function populateDays() {
        if (!Elements.daySelect) return;
        const currentDay = Elements.daySelect.value;
        Elements.daySelect.innerHTML = '<option value="" disabled selected hidden data-key="day">Day</option>'; 
        for (let i = 1; i <= 31; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            if (i == currentDay) option.selected = true;
            Elements.daySelect.appendChild(option);
        }
    }
    function populateYears() {
        if (!Elements.yearSelect) return;
        const currentYearValue = Elements.yearSelect.value;
        Elements.yearSelect.innerHTML = '<option value="" disabled selected hidden data-key="year">Year</option>';
        const currentYear = new Date().getFullYear();
        const maxYear = currentYear - 18; 
        const minYear = currentYear - 100;
        for (let i = maxYear; i >= minYear; i--) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            if (i == currentYearValue) option.selected = true;
            Elements.yearSelect.appendChild(option);
        }
    }
    populateDays();
    populateYears();
    setLanguage(AppState.currentLang); 

    // ============================================
    // SLIDESHOW
    // ============================================
    let slideIndex = 0;
    let slideInterval;
    function showSlide(n) {
        if (Elements.slides.length === 0) return;
        slideIndex = (n + Elements.slides.length) % Elements.slides.length;
        Elements.slides.forEach((slide, index) => {
            slide.classList.toggle('active', index === slideIndex);
        });
        Elements.dots.forEach((dot, index) => {
            const isActive = index === slideIndex;
            dot.classList.toggle('active', isActive);
            dot.setAttribute('aria-selected', isActive);
        });
    }
    function nextSlide() { showSlide(++slideIndex); }
    function prevSlide() { showSlide(--slideIndex); }
    function resetSlideTimer() {
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, 4000);
    }
    Elements.dots.forEach((dot, index) => {
        dot.addEventListener('click', () => { showSlide(index); resetSlideTimer(); });
    });
    Elements.slidePrevBtn?.addEventListener('click', () => { prevSlide(); resetSlideTimer(); });
    Elements.slideNextBtn?.addEventListener('click', () => { nextSlide(); resetSlideTimer(); });
    showSlide(slideIndex);
    resetSlideTimer();
    
    const slideshowContainer = document.querySelector('.slideshow-container');
    slideshowContainer?.addEventListener('mouseenter', () => { clearInterval(slideInterval); });
    slideshowContainer?.addEventListener('mouseleave', () => { resetSlideTimer(); });

    // ============================================
    // CLEANUP
    // ============================================
    window.addEventListener('beforeunload', () => {
        clearInterval(slideInterval);
        clearInterval(AppState.otpTimer);
    });

});