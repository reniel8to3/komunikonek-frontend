document.addEventListener("DOMContentLoaded", function() {

    // --- Get Elements ---
    const step1Account = document.getElementById('step-1-account');
    const step2Personal = document.getElementById('step-2-personal');
    
    const sendOtpButton = document.getElementById('send-otp-button');
    const otpSection = document.getElementById('otp-section');
    const verifyOtpButton = document.getElementById('verify-otp-button');
    const backButton = document.getElementById('back-button');

    const passwordInput = document.getElementById('password');
    const togglePassword = document.querySelector('.password-toggle');

    // --- 1. "Send OTP" Button Click ---
    // (In a real app, you'd validate email/pass before showing this)
    sendOtpButton.addEventListener('click', function() {
        // Show the OTP section
        otpSection.style.display = 'block';
        // Disable the button to prevent multiple clicks
        sendOtpButton.textContent = 'Resend OTP';
        console.log('OTP Sent (simulation)');
    });

    // --- 2. "Verify OTP" Button Click ---
    // (In a real app, you'd check the OTP code here)
    verifyOtpButton.addEventListener('click', function() {
        // Simulate successful verification
        console.log('OTP Verified (simulation)');
        
        // Hide Step 1 and Show Step 2
        step1Account.style.display = 'none';
        step2Personal.style.display = 'block';
    });

    // --- 3. "Back" Button Click ---
    backButton.addEventListener('click', function() {
        // Hide Step 2 and Show Step 1
        step2Personal.style.display = 'none';
        step1Account.style.display = 'block';
    });

    // --- 4. Password Toggle (Copied from login.js) ---
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Toggle the icon class
            if (type === 'password') {
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            } else {
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            }
        });
    }

    // --- 5. Role Selector Toggles (Copied from login.js logic) ---
    // Find ALL role selectors on the page
    const allRoleSelectors = document.querySelectorAll('.role-selector');

    allRoleSelectors.forEach(selector => {
        const buttons = selector.querySelectorAll('.role-button');
        buttons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove 'active' from siblings
                buttons.forEach(btn => btn.classList.remove('active'));
                // Add 'active' to the one clicked
                this.classList.add('active');
            });
        });
    });

    // --- 6. (UPDATED) OTP Input Auto-Tab & Validation ---
    const otpInputs = document.querySelectorAll('.otp-input');

    otpInputs.forEach((input, index) => {

        // NEW: Add listener to strip non-numeric characters
        input.addEventListener('input', function() {
            // This regex removes anything that is NOT a digit
            this.value = this.value.replace(/[^0-9]/g, '');
        });

        // Keep keyup for auto-tabbing
        input.addEventListener('keyup', (e) => {
            // Check if the key is a number (0-9)
            if (e.key.match(/^[0-9]$/) && index < otpInputs.length - 1) {
                // Move to next input if a number is pressed
                if (this.value) { // Only move if a value was entered
                    otpInputs[index + 1].focus();
                }
            } else if (e.key === 'Backspace' && index > 0) {
                // Move to previous input on backspace
                otpInputs[index - 1].focus();
            }
        });
    });

});