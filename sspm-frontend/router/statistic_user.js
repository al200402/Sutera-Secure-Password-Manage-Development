document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("token");

    // ✅ Ambil data terkini melalui API untuk memastikan data sentiasa up-to-date
    try {
        const response = await fetch("http://localhost:5028/api/SSPM/user-statistic", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ role: "All" })
        });

        const data = await response.json();
        console.log("📊 Statistik Pengguna Diterima dari API:", data);

        if (data.Code === 200) {

            // Superuser statistic
            document.getElementById('activeSuperusersData').textContent = data.data.activeSuperUsers ||0;
            document.getElementById('totalSupersersData').textContent = data.data.superUsers || 0;
            document.getElementById('inactiveSuperusersData').textContent = data.data.inactiveSuperUsers || 0;

            // regular user statistic

            document.getElementById('activeUsersData').textContent = data.data.activeRegularUsers || 0;
            document.getElementById('totalUsersData').textContent = data.data.regularUsers || 0;
            document.getElementById('inactiveRegularUsers').textContent = data.data.inactiveRegularUsers || 0;

            // ✅ Kemas kini `localStorage` dengan data terbaru
            localStorage.setItem("userData", JSON.stringify(data.data));
        }

        const userData = JSON.parse(localStorage.getItem("userData"));

    // ✅ Paparkan data dari `localStorage` dahulu jika ada
    if (userData) {
        // Superuser statistic
        document.getElementById('activeSuperusersData').textContent = userData.activeSuperUsers || 0;
        document.getElementById('totalSupersersData').textContent = userData.superUsers || 0;
        document.getElementById('inactiveSuperusersData').textContent = userData.inactiveSuperUsers || 0;

        // regular user statistic

        document.getElementById('activeUsersData').textContent = userData.activeRegularUsers || 0;
        document.getElementById('totalUsersData').textContent = userData.regularUsers || 0;
        document.getElementById('inactiveRegularUsers').textContent = userData.inactiveRegularUsers || 0;
    }

    } catch (error) {
        console.error("❌ Ralat semasa mendapatkan data pengguna:", error);
    }
});

// Ensure anchor links work as expected
document.querySelectorAll("a[href^='#']").forEach(link => {
    link.addEventListener("click", function (event) {
        event.preventDefault();
        const targetId = this.getAttribute("href").substring(1);
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: "smooth" });
        }
    });
});

// Prevent back navigation after logout
window.onpopstate = function () {
    window.location.replace("/page/signIn.html");
};


