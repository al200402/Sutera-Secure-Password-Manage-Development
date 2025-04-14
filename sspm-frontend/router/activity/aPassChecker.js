
function checkPasswordStrength() {
    const password = document.getElementById('passwordInput').value;
    const strengthDisplay = document.getElementById('passwordStrength');
    const adviceDisplay = document.getElementById('passwordAdvice');

    let strength = 0;
    let advice = [];

    if (password.length >= 8) strength += 1; else advice.push("Increase password length to at least 8 characters.");
    if (/[A-Z]/.test(password)) strength += 1; else advice.push("Add uppercase letters for improved strength.");
    if (/[a-z]/.test(password)) strength += 1; else advice.push("Include lowercase letters for balance.");
    if (/[0-9]/.test(password)) strength += 1; else advice.push("Add numbers for better security.");
    if (/[^A-Za-z0-9]/.test(password)) strength += 1; else advice.push("Incorporate special characters like @, #, or ! to boost security.");

    switch (strength) {
        case 0:
        case 1:
            strengthDisplay.innerHTML = 'Strength: <span style="color: red;">Very Weak</span>';
            break;
        case 2:
            strengthDisplay.innerHTML = 'Strength: <span style="color: orange;">Weak</span>';
            break;
        case 3:
            strengthDisplay.innerHTML = 'Strength: <span style="color: yellow;">Moderate</span>';
            break;
        case 4:
            strengthDisplay.innerHTML = 'Strength: <span style="color: lightgreen;">Strong</span>';
            break;
        case 5:
            strengthDisplay.innerHTML = 'Strength: <span style="color: green;">Very Strong</span>';
            break;
    }

    adviceDisplay.innerHTML = advice.length ? `Tips to improve strength: <ul><li>${advice.join('</li><li>')}</li></ul>` : 'Your password is strong! ✅';
}

document.getElementById('refreshBtn').addEventListener('click', generatePassword);
document.getElementById('copyBtn').addEventListener('click', function () {
    const passwordText = document.getElementById('generatedPassword').innerText;
    navigator.clipboard.writeText(passwordText);
    alert("Password copied to clipboard!");
});

window.onload = function () {
    generatePassword();
};
