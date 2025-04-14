
import { showSuccessToast, showErrorToast, showWarningToast} from '../../../js/toast.js';

document.addEventListener("DOMContentLoaded", function () {
  const tryNowButton = document.getElementById("tryNowButton");

  if (tryNowButton) {
      tryNowButton.addEventListener("click", () => {
          displayStoredPasswords();
      }, { once: true });  // <-- Prevent multiple triggers
  }
});

function encryptText() {
  const text = document.getElementById('textToEncrypt').value;
  if (!text) {
    document.getElementById('encryptionResult').innerHTML = '<span style="color: red;">Please enter text to encrypt.</span>';
    document.getElementById('storeButtonContainer').style.display = 'none';
    return;
  }

  const encryptedText = btoa(text); // Simple Base64 Encoding (for demonstration purposes)
  document.getElementById('encryptionResult').innerText = `Encrypted Text: ${encryptedText}`;

  // Show the Store button
  document.getElementById('storeButtonContainer').style.display = 'block';
}

function decryptText() {
  const text = document.getElementById('textToEncrypt').value;
  try {
    const decryptedText = atob(text);
    document.getElementById('encryptionResult').innerText = `Decrypted Text: ${decryptedText}`;
  } catch (error) {
    document.getElementById('encryptionResult').innerHTML = '<span style="color: red;">Invalid encrypted text format.</span>';
  }
}


// ✅ Function to open Stored Password
async function storeEncryptedText() {
  const encryptedText = document.getElementById('encryptionResult').innerText.replace('Encrypted Text: ', '').trim();
  const email = localStorage.getItem("email");
  const token = localStorage.getItem("token");
  // Validasi: Pastikan kedua-dua email dan password tidak kosong
  if (!email) {
    showWarningToast("Please enter your email before storing the password.");
    return;
  }

  if (!encryptedText) {
    showWarningToast("No encrypted text found to store.");
    return;
  }

  // Data yang akan dihantar ke API
  const requestData = {
    email: email,
    password: encryptedText
  };

  try {
    const response = await fetch("http://localhost:5028/api/SSPM/stored-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      showErrorToast(`Error: ${errorData.message}`);
      return;
    }

    const result = await response.json();
    showSuccessToast(result.message || "Password stored successfully in database!");

  } catch (error) {
    console.error("Error storing password in database:", error);
    showErrorToast("Failed to store password in database. Please try again.");
  }
}

//Display Password List
async function displayStoredPasswords() {
  const list = document.getElementById('storedPasswords');

  if (!list) {
    console.error("Error: Element #storedPasswords not found.");
    return;
  }

  list.innerHTML = '<p>Loading passwords...</p><span class="spinner"></span></p>';

  const email = localStorage.getItem("email");
  const token = localStorage.getItem("token");
  if (!email) {
    list.innerHTML = '<p style="color: red;">Please enter your email to retrieve passwords.</p>';
    return;
  }

  try {
    const response = await fetch(`http://localhost:5028/api/SSPM/list-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ email })
    });

    const result = await response.json();

    if (!response.ok || result.code !== 200) {
      list.innerHTML = `<p style="color: red;">Error: ${result.message || 'Failed to retrieve passwords.'}</p>`;
      return;
    }

    const storedData = result.data || [];

    if (storedData.length === 0) {
      list.innerHTML = '<p>No stored passwords found.</p>';
      return;
    }

    let tableHTML = `
        <div class="table-container">
          <table class="stored-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Password</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>`;

    storedData.forEach((item, index) => {
      tableHTML += `
              <tr>
                <td><strong>${index + 1}</strong></td>
                <td>${item.password}</td>
                <td>
                  <button onclick="copyText('${item.password}')" class="btn-copy">
                    <i class="fas fa-copy"></i> Copy
                  </button>
                </td>
              </tr>`;
    });

    tableHTML += `
            </tbody>
          </table>
        </div>`;

    // list.innerHTML = tableHTML;
    setTimeout(() => {
      list.innerHTML = tableHTML;
    }, 300);

  } catch (error) {
    console.error("Error fetching passwords:", error);
    list.innerHTML = '<p style="color: red;">Failed to load passwords. Please try again later.</p>';
  }
}

function copyText(text) {
  navigator.clipboard.writeText(text);
  showSuccessToast("Copied to clipboard: " + text);
}

window.encryptText = encryptText;
window.decryptText = decryptText;
window.storeEncryptedText = storeEncryptedText;
window.displayStoredPasswords = displayStoredPasswords;
window.copyText = copyText;


