// adminpanel/js/auth-check.js

// Run this immediately before rendering the page to avoid flicker if possible
supabaseClient.auth.getSession().then(({ data: { session } }) => {
    if (!session) {
        // Not logged in, redirect to login page
        window.location.href = 'login.html';
    } else {
        // Logged in, show the page content
        document.body.style.display = 'block';
    }
});

// Hide body initially to prevent flash of content before redirect
document.addEventListener("DOMContentLoaded", () => {
    if (document.body) {
        document.body.style.display = 'none';
    }
});
