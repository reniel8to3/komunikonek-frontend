document.addEventListener("DOMContentLoaded", function() {

    const roleButtons = document.querySelectorAll('.role-button');

    roleButtons.forEach(button => {
        button.addEventListener('click', function() {
            roleButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            
            this.classList.add('active'); 
        });
    });

    const passwordInput = document.getElementById('password');
    const togglePassword = document.querySelector('.password-toggle'); 

    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
          
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            
            if (type === 'password') {
               
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            } else {
               
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            }
            
        });
    }

});