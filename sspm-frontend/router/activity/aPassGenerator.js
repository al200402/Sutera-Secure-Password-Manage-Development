let currentMode = 'random';

function setMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.toggle-btn[onclick="setMode('${mode}'); generatePassword()"]`).classList.add('active');

    document.querySelector('.random-options').style.display = mode === 'random' ? 'block' : 'none';
    document.querySelector('.memorable-options').style.display = mode === 'memorable' ? 'block' : 'none';
}

function updateSliderValue(value) {
    document.getElementById('sliderValue').textContent = value;
}

function generatePassword() {
    const minLength = parseInt(document.getElementById('minLength').value) || 15;

    let password = "";

    if (currentMode === 'random') {
        const includeSpecial = document.getElementById('includeSpecial').checked;
        const includeNumbers = document.getElementById('includeNumbers').checked;

        let charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        if (includeNumbers) charset += "0123456789";
        if (includeSpecial) charset += "!@#$%^&*()_+-=[]{}|;:'\",.<>?/";

        for (let i = 0; i < minLength; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
    }

    else if (currentMode === 'memorable') {
        const words = ["apple", "banana", "car", "dance", "energy", "forest", "garden", "happy", "ocean", "planet",
            "river", "school", "flower", "bridge", "castle", "dragon", "mirror", "window", "rise", "keyboard", "laptop", "handphone", "shirt", "blouse", "cussion", "bag", "monitor", "snacks", "fan", "balcony"];
        const capitalize = document.getElementById('capitalizeFirst').checked;
        const useFullWords = document.getElementById('useFullWords').checked;

        let wordCount = Math.min(minLength, words.length);
        for (let i = 0; i < wordCount; i++) {
            let word = words[Math.floor(Math.random() * words.length)];
            if (capitalize) word = word.charAt(0).toUpperCase() + word.slice(1);
            password += useFullWords ? word + '-' : word[0];
        }

        password = password.slice(0, -1); // Remove trailing hyphen
    }

    else if (currentMode === 'pin') {
        for (let i = 0; i < minLength; i++) {
            password += Math.floor(Math.random() * 10);
        }
    }

    document.getElementById('generatedPassword').innerText = password || 'Generated Password';
}

document.getElementById('copyBtn').addEventListener('click', function () {
    const passwordText = document.getElementById('generatedPassword').innerText;
    navigator.clipboard.writeText(passwordText);
    alert("Password copied to clipboard!");
});

window.onload = function () {
    generatePassword();
    document.getElementById('refreshBtn').addEventListener('click', generatePassword);
}; // Auto-generate password on load
