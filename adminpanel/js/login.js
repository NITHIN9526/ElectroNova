// adminpanel/js/login.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitBtn = document.getElementById('login-btn');
    const loaderContainer = document.getElementById('login-loader');

    // Check if already logged in
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            window.location.href = 'index.html';
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        submitBtn.disabled = true;
        loaderContainer.style.display = 'flex';

        const email = emailInput.value;
        const password = passwordInput.value;

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            showToast(error.message, "error");
            submitBtn.disabled = false;
            loaderContainer.style.display = 'none';
        } else {
            showToast("Login successful! Redirecting...", "success");
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    });
});

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast';
    toast.classList.add(type);
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}
