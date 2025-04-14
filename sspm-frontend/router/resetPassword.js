import { showSuccessToast, showErrorToast, showWarningToast } from "../js/toast.js";
document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ JavaScript Loaded!");

    const emailInput = document.getElementById("email");
    const checkEmailButton = document.getElementById("checkEmailButton");
    const passwordSection = document.getElementById("passwordSection");
    const verifySection = document.getElementById("verifySection");
    const verifyButton = document.getElementById("verifyButton");

    // Function to handle email validation
    async function checkEmail() {
        const email = emailInput.value.trim();
        if (!email) {
            showWarningToast("Please enter an email.");
            return;
        }

        console.log("Checking Email:", email);

        try {
            const response = await fetch("http://localhost:5028/api/SSPM/check-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            const result = await response.json();
            console.log("🔍 Full API Response (Email Check):", result);

            if (response.ok) {
                showSuccessToast(result.message);

                 // ✅ Hide Next button
                 checkEmailButton.style.display = "none";


                 // ✅ Disable email input (freeze it)
                 emailInput.readOnly = true;

                 // ✅ Show verify button
                 verifySection.style.display = "block";

            } else {
                showErrorToast(result.message);
               
            }
        } catch (error) {
            console.error("Email Check Error:", error);
            showErrorToast("An error occurred while checking email.");
        }
    }

    // ✅ Allow "Next" button click
    checkEmailButton.addEventListener("click", checkEmail);




    // ✅ Allow pressing "Enter" key inside email input
    emailInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            event.preventDefault(); // Prevent form submission
            checkEmail();
        }
    });


    // ✅ Function to open Google Sign-In
    async function requestVerificationCode() {
        const email = emailInput.value.trim();
        if (!email) {
            showWarningToast("Please enter an email.");
            return;
        }
    
        try {
            const response = await fetch("http://localhost:5028/api/SSPM/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });
    
            const result = await response.json();
            if (response.ok) {
                showSuccessToast("Verification code sent to your email.");
                document.getElementById("verifySection").style.display = "block";
            } else {
                showErrorToast(result.message);
            }
        } catch (error) {
            console.error("Error requesting verification code:", error);
            showErrorToast("Failed to send verification code.");
        }
    }

    // ✅ Attach Click Event to Verify Button
    verifyButton.addEventListener("click", requestVerificationCode);





    async function verifyCode() {
        const email = emailInput.value.trim();
        const code = document.getElementById("verificationCode").value.trim();
    
        if (!email || !code) {
            showWarningToast("Please enter your email and verification code.");
            return;
        }
    
        try {
            const response = await fetch("http://localhost:5028/api/SSPM/verify-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code: code })
            });
    
            const result = await response.json();
            if (response.ok) {
                showSuccessToast(result.message);
                localStorage.setItem("email", email);
                window.location.href = "/page/createPassword.html"; 
            } else {
                showErrorToast(result.message);
            }
        } catch (error) {
            console.error("Error verifying code:", error);
            showErrorToast("Verification failed.");
        }
    }
    
    // ✅ Attach to Confirm Button
    document.getElementById("confirmVerifyButton").addEventListener("click", verifyCode);


        
});
