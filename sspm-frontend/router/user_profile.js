const token = localStorage.getItem("token");

async function fetchUserProfile() {
    try {
        const response = await fetch("http://localhost:5028/api/SSPM/profile", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
        });

        if (!response.ok) throw new Error("Failed to fetch user data");

        const data = await response.json();
        document.getElementById("email").value = data.email;
        document.getElementById("status").value = data.status;
    } catch (error) {
        console.error("Error fetching profile:", error);
    }
}

async function updateUserProfile(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const status = document.getElementById("status").value;

    try {
        const response = await fetch("http://localhost:5028/api/SSPM/update-profile", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ email, password, status })
        });

        const result = await response.json();
        if (response.ok) {
            alert("Profile updated successfully!");
        } else {
            alert(`Error: ${result.message}`);
        }
    } catch (error) {
        console.error("Error updating profile:", error);
    }
}

document.getElementById("profileForm").addEventListener("submit", updateUserProfile);
fetchUserProfile();