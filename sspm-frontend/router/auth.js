import { showWarningToast } from "../js/toast.js";
document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("token");

    if (!token) {
        redirectToLogin();
        return;
    }

    try {
        // Decode JWT and check expiration
        const payload = JSON.parse(atob(token.split('.')[1])); // Decode Base64
        const exp = payload.exp * 1000; // Convert to milliseconds
        const now = Date.now();

        if (now >= exp) {
            logoutUser();  // ✅ Delayed logout by 5 seconds
            showWarningToast("Session expired! Please log in again.");
        }
    } catch (error) {
        console.error("❌ Invalid token format. Logging out.");
        logoutUser();  // ✅ Delays logout by 5 seconds
    }
});

// ✅ Remove duplicated logout logic from `auth.js`
function redirectToLogin() {
    window.location.href = "/page/index.html";
    showWarningToast("You need to log in first!");
}
