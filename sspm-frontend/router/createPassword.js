import { showSuccessToast, showErrorToast, showWarningToast } from "../js/toast.js";

function togglePassword(id) {
    const input = document.getElementById(id);
    const icon = id === "password" ? document.getElementById("togglePasswordIcon") 
                                   : document.getElementById("toggleConfirmPasswordIcon");

    if (input.type === "password") {
        input.type = "text";
        icon.src = "../images/eye-open.png";  
    } else {
        input.type = "password";
        icon.src = "../images/eye-close.png"; 
    }
}

const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const passwordStrengthText = document.getElementById("password-strength-text");
const passwordMatchText = document.getElementById("password-match-text");
const strengthMeter = document.querySelector(".strength-meter div");
const passwordHints = document.getElementById("password-hints");

passwordInput.addEventListener("input", () => {
    const password = passwordInput.value;
    const result = zxcvbn(password);
    const strengthLabels = ["Weak", "Fair", "Good", "Strong", "Very Strong"];

    strengthMeter.style.width = `${(result.score + 1) * 20}%`;
    strengthMeter.style.background = ["red", "orange", "yellow", "blue", "green"][result.score];
    passwordStrengthText.textContent = `Strength: ${strengthLabels[result.score]}`;

    // Generate password hints
    const requirements = [
        { regex: /.{8,}/, text: "At least 8 characters required." },
        { regex: /[A-Z]/, text: "Include at least one uppercase letter." },
        { regex: /[a-z]/, text: "Include at least one lowercase letter." },
        { regex: /[0-9]/, text: "Include at least one number." },
        { regex: /[!@#$%^&*]/, text: "Include at least one special character (!@#$%^&*)." }
    ];

    passwordHints.innerHTML = requirements.map(req => {
        const isValid = req.regex.test(password);
        return `<li class="${isValid ? 'valid' : ''}">${req.text}</li>`;
    }).join("");
});

confirmPasswordInput.addEventListener("input", () => {
    if (passwordInput.value !== confirmPasswordInput.value) {
        passwordMatchText.textContent = "Passwords do not match!";
    } else {
        passwordMatchText.textContent = "";
    }
});

// ✅ Set Password Function
async function setPassword() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (password.length < 8) {
        ("Password must be at least 8 characters long.");
        return;
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*]/.test(password)) {
        showWarningToast("Password must include uppercase, lowercase, a number, and a special character.");
        return;
    }
    if (password !== confirmPassword) {
        showErrorToast("Passwords do not match.");
        return;
    }

    // ✅ Check if email exists in localStorage
    const email = localStorage.getItem("email");
    if (!email) {
        showErrorToast("Error: Email not found. Please verify your email again.");
        window.location.href = "/page/verify.html"; // Redirect user back to verification
        return;
    }

    try {
        const response = await fetch("http://localhost:5028/api/SSPM/create-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();
        if (response.ok) {
            showSuccessToast(result.message);
            window.location.href = "/page/signIn.html"; // Redirect to sign-in page
        } else {
            showErrorToast(result.message);
        }
    } catch (error) {
        console.error("Error setting password:", error);
        showErrorToast("Failed to set password.");
    }
}

// ✅ Attach Event Listener for "Set Password" Button
document.getElementById("setPasswordButton").addEventListener("click", setPassword);

window.togglePassword = togglePassword;