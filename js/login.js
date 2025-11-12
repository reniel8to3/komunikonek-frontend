// js/login.js

// ============================================
// IMPORTS
// ============================================
import { 
    auth, 
    signInWithEmailAndPassword,
    signInWithPhoneNumber,
    RecaptchaVerifier,
    signOut,
    setPersistence,
    browserSessionPersistence,
    browserLocalPersistence
} from './firebase.js';
import { langStrings } from './translations.js';

// ============================================
// LOGIN.JS
// ============================================

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
        accountType: 'user' // 'user' or 'admin'
    };

    // ============================================
    // DOM ELEMENTS
    // ============================================
    const Elements = {
        // Language
        langEnBtn: document.getElementById('lang-en'),
        langFilBtn: document.getElementById('lang-fil'),
        
        // Role Selector
        roleSelector: document.getElementById('login-as-selector'),
        roleButtons: document.querySelectorAll('#login-as-selector .role-button'),
        glider: document.querySelector('#login-as-selector .glider'),
        
        // Forms
        loginForm: document.getElementById('login-form'),
        emailLoginSection: document.getElementById('email-login-section'),
        phoneLoginSection: document.getElementById('phone-login-section'),
        
        // Toggles
        showPhoneLoginBtn: document.getElementById('show-phone-login-btn'),
        showEmailLoginLink: document.getElementById('show-email-login-link'),
        
        // Email Fields
        emailInput: document.getElementById('email'),
        passwordInput: document.getElementById('password'),
        passwordToggle: document.querySelector('.password-toggle'),
        rememberMe: document.getElementById('remember-me'),
        emailLoginBtn: document.getElementById('email-login-btn'),
        
        // Phone Fields
        phoneInput: document.getElementById('login-phone'),
        sendOtpButton: document.getElementById('login-send-otp-btn'),
        otpSection: document.getElementById('login-otp-section'),
        otpInputs: document.querySelectorAll('#login-otp-section .otp-input'),
        verifyOtpButton: document.getElementById('login-verify-otp-btn'),

        // Slideshow
        slides: document.querySelectorAll('.slide'),
        dots: document.querySelectorAll('.dot'),
        slidePrevBtn: document.getElementById('slide-prev'),
        slideNextBtn: document.getElementById('slide-next'),
        
        // Toast
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
            'expired-callback': () => {
                console.log("reCAPTCHA expired, resetting...");
                setupRecaptcha();
            }
        });
    }
    // Setup reCAPTCHA immediately for the phone path
    setupRecaptcha();

    // ============================================
    // TRANSLATION / I18N
    // ============================================
    function setLanguage(lang) {
        if (typeof langStrings === 'undefined' || !langStrings[lang]) {
            console.error(`Translation for language "${lang}" not found.`);
            return;
        }
        AppState.currentLang = lang;
        document.documentElement.lang = lang;
        
        document.querySelectorAll('[data-key]').forEach(el => {
            const key = el.getAttribute('data-key');
            if (!key) return;
            const translation = langStrings[lang][key];
            if (!translation) return;
            
            if (el.tagName === 'TITLE') {
                document.title = "KomuniKonek | " + translation;
            } else {
                el.textContent = translation;
            }
        });
        
        Elements.langEnBtn?.classList.toggle('active', lang === 'en');
        Elements.langFilBtn?.classList.toggle('active', lang === 'fil');
    }
    Elements.langEnBtn?.addEventListener('click', () => setLanguage('en'));
    Elements.langFilBtn?.addEventListener('click', () => setLanguage('fil'));
    setLanguage('en'); // Initialize

    // ============================================
    // UTILITY FUNCTIONS (from signup.js)
    // ============================================
    function showElement(element, displayType = 'block') {
        if (element) element.style.display = displayType;
    }
    function hideElement(element) {
        if (element) element.style.display = 'none';
    }
    
    function setButtonLoading(button, isLoading) {
        if (!button) return;
        const textSpan = button.querySelector('.button-text');
        const loaderSpan = button.querySelector('.button-loader');
        button.disabled = isLoading;
        if (textSpan) textSpan.style.display = isLoading ? 'none' : '';
        if (loaderSpan) loaderSpan.style.display = isLoading ? 'inline-block' : 'none';
    }
    
    function showToast(message, type = 'info') {
        if (!Elements.toast) return;
        Elements.toast.textContent = message;
        Elements.toast.className = `toast ${type}`;
        Elements.toast.classList.remove('hidden');
        setTimeout(() => {
            Elements.toast.classList.add('hidden');
        }, 3000);
    }
    
    function setError(input, messageKey) {
        if (!input) return;
        let message = langStrings[AppState.currentLang]?.[messageKey] || messageKey;
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

    // ============================================
    // UI HANDLERS (Slideshow, Toggles)
    // ============================================

    // --- Sliding Role Selector ---
    function setupSlidingToggle(selector, buttons, glider) {
        if (!selector || buttons.length === 0 || !glider) return;
        const updateGlider = (button) => {
            glider.style.width = `${button.offsetWidth}px`;
            glider.style.transform = `translateX(${button.offsetLeft}px)`;
        };
        const activeButton = selector.querySelector('.role-button.active');
        if (activeButton) {
            AppState.accountType = activeButton.dataset.role || 'user'; // Set initial role
            updateGlider(activeButton);
        }
        
        buttons.forEach(button => {
            button.addEventListener('click', function() {
                buttons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                updateGlider(this);
                AppState.accountType = this.dataset.role || 'user'; // Update role on click
            });
        });
    }
    setupSlidingToggle(Elements.roleSelector, Elements.roleButtons, Elements.glider);

    // --- Password Show/Hide Toggle ---
    Elements.passwordToggle?.addEventListener('click', function() {
        const type = Elements.passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        Elements.passwordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });

    // --- Phone/Email View Toggle Logic ---
    Elements.showPhoneLoginBtn?.addEventListener('click', () => {
        hideElement(Elements.emailLoginSection);
        showElement(Elements.phoneLoginSection);
    });
    Elements.showEmailLoginLink?.addEventListener('click', (e) => {
        e.preventDefault();
        showElement(Elements.emailLoginSection);
        hideElement(Elements.phoneLoginSection);
        hideElement(Elements.otpSection);
        // Reset phone state
        confirmationResult = null;
        if (Elements.phoneInput) {
            Elements.phoneInput.disabled = false;
            setSuccess(Elements.phoneInput);
        }
        setButtonLoading(Elements.sendOtpButton, false);
    });
    
    // --- Slideshow Logic ---
    let slideIndex = 0;
    let slideInterval;
    function showSlide(n) {
        if (Elements.slides.length === 0) return;
        slideIndex = (n + Elements.slides.length) % Elements.slides.length;
        Elements.slides.forEach(slide => slide.style.display = "none");
        Elements.dots.forEach(dot => dot.classList.remove("active"));
        if (Elements.slides[slideIndex]) Elements.slides[slideIndex].style.display = "block";
        if (Elements.dots[slideIndex]) Elements.dots[slideIndex].classList.add("active");
    }
    function nextSlide() { showSlide(++slideIndex); }
    function prevSlide() { showSlide(--slideIndex); }
    function resetSlideTimer() {
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, 4000);
    }
    Elements.dots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
            showSlide(index);
            resetSlideTimer();
        });
    });
    Elements.slidePrevBtn?.addEventListener('click', () => { prevSlide(); resetSlideTimer(); });
    Elements.slideNextBtn?.addEventListener('click', () => { nextSlide(); resetSlideTimer(); });
    showSlide(slideIndex);
    resetSlideTimer();

    // ============================================
    // LOGIN LOGIC
    // ============================================

    // --- 1. Email Login ---
    Elements.loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Only run this if the email section is visible
        if (Elements.emailLoginSection.style.display === 'none') return;
        
        setButtonLoading(Elements.emailLoginBtn, true);
        let isValid = true;
        
        const email = Elements.emailInput.value.trim();
        const password = Elements.passwordInput.value.trim();

        // Validation
        if (email === '') {
            setError(Elements.emailInput, 'errRequired');
            isValid = false;
        } else if (!isValidEmail(email)) {
            setError(Elements.emailInput, 'errEmail');
            isValid = false;
        } else {
            setSuccess(Elements.emailInput);
        }

        if (password === '') {
            setError(Elements.passwordInput, 'errRequired');
            isValid = false;
        } else {
            setSuccess(Elements.passwordInput);
        }

        if (!isValid) {
            setButtonLoading(Elements.emailLoginBtn, false);
            return;
        }

        try {
            // Set persistence based on "Remember me"
            const persistence = Elements.rememberMe.checked ? browserLocalPersistence : browserSessionPersistence;
            await setPersistence(auth, persistence);
            
            // Sign in
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // --- CRITICAL: Email Verification Check ---
            // We add a check for test accounts that might not have verification
            if (!user.emailVerified && !user.email.endsWith('@test.com')) {
                await signOut(auth); // Log them out
                showToast(langStrings[AppState.currentLang]['errEmailNotVerified'] || "Please verify your email first. Check your inbox.", "error");
                setButtonLoading(Elements.emailLoginBtn, false);
                return;
            }

            showToast("Login successful!", "success");
            
            // --- FIX: Role-based redirect ---
            if (AppState.accountType === 'admin') {
                window.location.href = 'admin.html'; // Go to admin page
            } else {
                window.location.href = 'index.html'; // Go to user dashboard (index.html)
            }
            // --- END FIX ---

        } catch (error) {
            console.error("Email login error:", error.code);
            let msg = error.message;
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                msg = langStrings[AppState.currentLang]['errInvalidLogin'] || "Invalid email or password.";
            } else if (error.code === 'auth/too-many-requests') {
                msg = "Too many failed attempts. Please reset your password or try again later.";
            }
            showToast(msg, "error");
            setButtonLoading(Elements.emailLoginBtn, false);
        }
    });

    // --- 2. Phone "Send OTP" ---
    Elements.sendOtpButton?.addEventListener('click', async () => {
        setButtonLoading(Elements.sendOtpButton, true);
        const phoneValue = Elements.phoneInput.value.trim();

        if (!isValidPhone(phoneValue)) {
            setError(Elements.phoneInput, 'errPhoneLength');
            setButtonLoading(Elements.sendOtpButton, false);
            return;
        }
        
        setSuccess(Elements.phoneInput);
        const phoneNumber = '+63' + (phoneValue.startsWith('0') ? phoneValue.substring(1) : phoneValue);
        
        try {
            setupRecaptcha(); // Get a fresh verifier
            console.log("Sending OTP to:", phoneNumber);
            confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
            
            showToast("OTP sent successfully!", "success");
            showElement(Elements.otpSection);
            Elements.phoneInput.disabled = true;
            Elements.roleSelector.classList.add('disabled');
            Elements.roleButtons.forEach(btn => btn.disabled = true);
            
        } catch (error) {
            console.error("OTP Send Error:", error);
            showToast("Failed to send OTP. Please try again.", "error");
            if (recaptchaVerifier) recaptchaVerifier.clear();
        } finally {
            setButtonLoading(Elements.sendOtpButton, false);
        }
    });

    // --- 3. Phone "Verify OTP" ---
    Elements.verifyOtpButton?.addEventListener('click', async () => {
        setButtonLoading(Elements.verifyOtpButton, true);
        const otpCode = Array.from(Elements.otpInputs).map(input => input.value).join('');

        if (otpCode.length !== 6) {
            showToast("Please enter the full 6-digit OTP", "error");
            setButtonLoading(Elements.verifyOtpButton, false);
            return;
        }

        if (!confirmationResult) {
            showToast("Please send an OTP first", "error");
            setButtonLoading(Elements.verifyOtpButton, false);
            return;
        }

        try {
            const userCredential = await confirmationResult.confirm(otpCode);
            const user = userCredential.user;
            console.log("Phone login successful:", user.uid);
            
            showToast("Login successful!", "success");

            // --- FIX: Role-based redirect ---
            if (AppState.accountType === 'admin') {
                window.location.href = 'admin.html'; // Go to admin page
            } else {
                window.location.href = 'index.html'; // Go to user dashboard (index.html)
            }
            // --- END FIX ---

        } catch (error) {
            console.error("OTP Verify Error:", error);
            showToast(langStrings[AppState.currentLang]['errInvalidOtp'] || "Invalid OTP. Please try again.", "error");
            setButtonLoading(Elements.verifyOtpButton, false);
        }
    });
    
    // --- 4. OTP Input Helpers ---
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
    setupOtpInput(Elements.otpInputs);

    // Validation helpers
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }
    function isValidPhone(phone) {
        return /^[0-9]{10}$/.test(phone);
    }
});