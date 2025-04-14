import { showAlertMessage } from "../js/toast.js";
document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ Logout script loaded!");

    const logoutButton = document.getElementById("logoutButton");

    if (!logoutButton) {
        console.error("🚨 Logout button not found! Check if the ID is correct.");
        return;
    }

    logoutButton.addEventListener("click", function (event) {
        event.preventDefault();
        console.log("✅ Logout button clicked!");
        logoutUser();  
    });
});

/**
 * Centralized Logout Function
 */
async function logoutUser() {
    console.log("🚨 Logging out...");
    await showAlertMessage("Logout Successful.");


    // ✅ Remove token and session data
    localStorage.removeItem("token");
    sessionStorage.clear();

    // ✅ Clear browser history and prevent back navigation
    clearSessionAndHistory();

}

/**
 * Clears session and prevents back navigation
 */
function clearSessionAndHistory() {
    // ✅ Ensure session is completely cleared
    localStorage.clear();
    sessionStorage.clear();

    // ✅ Push a dummy state and replace it with the login page
    history.pushState(null, null, "/page/index.html");
    history.replaceState(null, null, "/page/index.html");

    // ✅ Prevent browser back button from working
    window.onpopstate = function () {
        history.go(1); // Always move forward
    };

    redirectToLogin();
}

/**
 * Redirects to login
 */
function redirectToLogin() {
    window.location.replace("/page/index.html"); // Redirect to login page
}
