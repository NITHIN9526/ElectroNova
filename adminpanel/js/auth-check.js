// adminpanel/js/auth-check.js

// Run this session check immediately
supabaseClient.auth.getSession().then(({ data: { session } }) => {
    if (!session) {
        // Not logged in, redirect to login page
        window.location.href = 'login.html';
    } else {
        // Logged in, show the page content.
        // If the DOM is already parsed, document.body will exist and we show it.
        // Otherwise, we wait for DOMContentLoaded to set it to block.
        if (document.body) {
            document.body.style.display = 'block';
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                if (document.body) {
                    document.body.style.display = 'block';
                }
            });
        }
    }
}).catch(err => {
    console.error("Auth check failed:", err);
    window.location.href = 'login.html';
});
