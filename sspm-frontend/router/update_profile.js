// Populate email and role from localStorage
window.onload = function () {
    document.getElementById('email').value = localStorage.getItem('email');
    document.getElementById('role').value = localStorage.getItem('role');
    document.getElementById('username').value = localStorage.getItem('username');
};
import { showSuccessToast, showErrorToast } from "../js/toast.js";
// Handle form submission
document.getElementById('profileForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const username = document.getElementById('username').value;

    const token = localStorage.getItem("token");
    console.log(token)

    const data = {
        email: email,
        username: username
    };

    try {

        const response = await fetch('http://localhost:5028/api/SSPM/profile-update', {
            method: 'POST',  // ✅ Correct method
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ email, username })
        });

        if (response.ok) {
            localStorage.setItem("username", username);
        
            // ✅ Pastikan `role` disimpan ke dalam localStorage
            const currentRole = document.getElementById('role').value;
            console.log("🔍 Current Role in Input Field:", currentRole);

            if (currentRole) {
                localStorage.setItem("role", currentRole);  
                console.log("✅ Role updated in localStorage:", currentRole);
            } else {
                console.error("❌ Role is missing from profile page.");
            }
        
            localStorage.setItem("refreshRequired", "true");
            showSuccessToast('Profile updated successfully!');
        }
        
    } catch (error) {
        showErrorToast(`Network Error: ${error.message}`);
    }
});