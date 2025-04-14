document.addEventListener("DOMContentLoaded", function () {
    loadUsers();
    const addForm = document.getElementById("EditForm");
});

const token = localStorage.getItem("token");

async function loadUsers() {
    try {
        const response = await fetch("http://localhost:5028/api/SSPM/user-list", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
            body: JSON.stringify({ role: "User" }) 
        });

        const data = await response.json();
        const table = document.getElementById("userList");
        table.innerHTML = "";

        if (data.code === 200 && Array.isArray(data.Users)) {
            if (data.Users.length === 0) {
                table.innerHTML = `<tr><td colspan="5" style="text-align: center;">No users found</td></tr>`;
                return;
            }

            data.Users.forEach((user, index) => {
                const row = table.insertRow();
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${user.email}</td>
                    <td>${user.role}</td>
                    <td>${user.status}</td>
                    <td>
                      <button class='edit-btn' onclick='openEditPopup("${user.email}", "${user.role}")'>Edit</button>
                      <button class='btn-gradient' onclick='deleteUser("${user.email}")'>Delete</button>
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

function openEditPopup(email, role) {
  document.getElementById("editUserEmail").value = email;
  document.getElementById("editUserRole").value = role;
  document.getElementById("editPopup").style.display = "block";
}

function closeEditPopup() {
  document.getElementById("editPopup").style.display = "none";
}

async function updateUserRole() {
  const email = document.getElementById("editUserEmail").value;
  const newRole = document.getElementById("editUserRole").value;

  try {
    const response = await fetch("http://localhost:5028/api/SSPM/update-role", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ email, role: newRole })
    });

    const result = await response.json();
    if (response.ok) {
      alert("User role updated successfully!");
      closeEditPopup();
      loadUsers(); // Refresh user list
    } else {
      alert(`Error: ${result.message}`);
    }
  } catch (error) {
    console.error("Error updating user role:", error);
  }
}

loadUsers();