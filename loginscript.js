document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");
    const forgotPasswordForm = document.getElementById("forgot-password-form");
    const resetPasswordForm = document.getElementById("reset-password-form");

    const loginContainer = document.getElementById("login_pane");
    const signupContainer = document.getElementById("signup_pane");
    const forgotPasswordContainer = document.getElementById("forgot_pane");
    const resetPasswordContainer = document.getElementById("reset_pane");

    // Show only login form on page load
    // loginContainer.style.display = "block";
    signupContainer.style.display = "none";
    forgotPasswordContainer.style.display = "none";
    resetPasswordContainer.style.display = "none";

    document.getElementById("go-to-signup").addEventListener("click", function () {
        loginContainer.style.display = "none";
        signupContainer.style.display = "block";
    });

    document.getElementById("go-to-forgot-password").addEventListener("click", function () {
        loginContainer.style.display = "none";
        forgotPasswordContainer.style.display = "block";
    });

    document.getElementById("go-back-to-login").addEventListener("click", function () {
        signupContainer.style.display = "none";
        forgotPasswordContainer.style.display = "none";
        resetPasswordContainer.style.display = "none";
        loginContainer.style.display = "block";
    });

    document.getElementById("submit-forgot-password").addEventListener("click", function () {
        // Simulating reset code verification
        forgotPasswordContainer.style.display = "none";
        resetPasswordContainer.style.display = "block";
    });

    document.getElementById("submit-reset-password").addEventListener("click", function () {
        // Redirect to index.html after reset
        window.location.href = "index.html";
    });

    signupForm.addEventListener("submit", function (event) {
        event.preventDefault();
        window.location.href = "index.html";
    });
});
