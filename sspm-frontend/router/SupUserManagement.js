import { showSuccessToast, showErrorToast, showWarningToast, showConfirmToast } from "../js/toast.js";

document.addEventListener("DOMContentLoaded", function () {
    loadUsers();
    const addForm = document.getElementById("AddForm");
});

const token = localStorage.getItem("token");

async function loadUsers() {
    try {
        const role = "User"
        const response = await fetch("http://localhost:5028/api/SSPM/user-list", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ role }) // Change role as needed
        });

        const data = await response.json();
        
        if (data.code === 200) {
            const table = document.getElementById("userList");
            table.innerHTML = ""; // Clear previous data

            data.users.forEach((user, index) => {
                const statusColor = user.status === "active" 
                    ? `<span class="status-active">${user.status}</span>` 
                    : `<span class="status-inactive">${user.status}</span>`;
                    
                const row = table.insertRow();
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${user.email}</td>
                    <td>${user.role}</td>
                    <td>${statusColor}</td>
                    <td>
                        <button class='btn-delete' onclick='deleteUser("${user.email}")'>Delete</button>
                    </td>
                `;
            });
        } else {
            console.error("Error fetching users:", data);
        }
    } catch (error) {
        console.error("Error fetching user list:", error);
    }
}

async function saveUser() {
    const emailInput = document.getElementById("newUserEmail");
    const roleInput = document.getElementById("newUserRole");

    const email = emailInput.value.trim();
    const role = roleInput.value;

    // Email format validation
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email)) {
        showErrorToast("Please enter a valid email address (e.g., user@example.com)");
        emailInput.focus();
        return;
    }

    if (!email || !role ) {
        showWarningToast("Please fill in all fields.");
        return;
    }

    // Disable the button to prevent multiple submissions
    const saveButton = document.querySelector(".btn-save");
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {
        const response = await fetch("http://localhost:5028/api/SSPM/add-user", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ Email: email, Role: role, Status: status })
        });

        const result = await response.json();

        if (response.ok) {
            showSuccessToast(result.Message || "User added successfully.");
            closePopup();
            loadUsers(); // Refresh user list
        } else {
            showWarningToast(`${result.Message || "User already exist."}`);
        }
    } catch (error) {
        console.error("Error adding user:", error);
        showErrorToast("An error occurred while adding the user. Please try again.");
    } finally {
        // Re-enable button
        saveButton.disabled = false;
        saveButton.textContent = "Add User";
    }
}

async function deleteUser(email) {
    //if (!confirm("Are you sure you want to delete this user?")) return;

    const confirmed = await showConfirmToast("Are you sure you want to delete this user?");
    if (!confirmed) return;

    try {
        const response = await fetch(`http://localhost:5028/api/SSPM/delete-user`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ email })
        });

        if (response.ok) {
            showSuccessToast("User deleted successfully!");
            loadUsers(); // Reload user list
        } else {
            console.error("Error deleting user");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

function openPopup() {
    document.getElementById("popup").style.display = "block";
    document.getElementById("popupOverlay").style.display = "block";
}

function closePopup() {
    document.getElementById("popup").style.display = "none";
    document.getElementById("popupOverlay").style.display = "none";
}

async function editUserRole(userEmail) {
    try {
        const currentRole = await getUserRole(userEmail); // Fetch current role from backend
        document.getElementById("editUserEmail").value = userEmail;
        document.getElementById("editUserRole").value = currentRole;
        document.getElementById("editPopup").style.display = "block";
        document.getElementById("popupOverlay").style.display = "block"; 
    } catch (error) {
        console.error("Error fetching user role:", error);
    }
}

async function getUserRole(userEmail) {
    try {
        const response = await fetch(`http://localhost:5028/api/SSPM/get-user-role?email=${userEmail}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
        });

        if (response.ok) {
            const data = await response.json();
            return data.role; // Return the fetched role
        } else {
            console.error("Error fetching user role");
            return "User"; // Default role if there's an issue
        }
    } catch (error) {
        console.error("Error:", error);
        return "User"; // Default role
    }
}

// async function updateUserRole() {
//     const email = document.getElementById("editUserEmail").value;
//     const newRole = document.getElementById("editUserRole").value;

//     try {
//         const response = await fetch("http://localhost:5028/api/SSPM/update-role", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//                 "Authorization": `Bearer ${token}`
//             },
//             body: JSON.stringify({ email, role: newRole })
//         });

//         const result = await response.json();
//         if (response.ok) {
//             showSuccessToast("User role updated successfully!");
//             closeEditPopup();
//             loadUsers(); // Refresh user list
//         } else {
//             showErrorToast(`Error: ${result.message}`);
//         }
//     } catch (error) {
//         console.error("Error updating user role:", error);
//     }
// }

// function closeEditPopup() {
//     document.getElementById("editPopup").style.display = "none";
//     document.getElementById("popupOverlay").style.display = "none"; // <-- Tambah baris ini
// }


window.saveUser = saveUser;
window.deleteUser = deleteUser;
window.editUserRole = editUserRole;
// window.updateUserRole = updateUserRole;
window.openPopup = openPopup;
window.closePopup = closePopup;
// window.closeEditPopup = closeEditPopup;

