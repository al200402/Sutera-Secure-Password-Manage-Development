// Success Toast
export function showSuccessToast(message) {
    Toastify({
        text: message || "Success!",
        duration: 3000,
        gravity: "top",
        position: "center",
        backgroundColor: "#4CAF50",
        close: true
    }).showToast();
}

// Error Toast
export function showErrorToast(message) {
    Toastify({
        text: message || "An error occurred!",
        duration: 3000,
        gravity: "top",
        position: "center",
        backgroundColor: "#F44336",
        close: true
    }).showToast();
}

// Warning Toast
export function showWarningToast(message) {
    Toastify({
        text: message || "Warning!",
        duration: 3000,
        gravity: "top",
        position: "center",
        backgroundColor: "#F4DB36",
        close: true
    }).showToast();
}

// Blocking Alert (Mimics Native `alert()`)
export async function showAlertMessage(message, type = "success") {
    return new Promise((resolve) => {
        const alertBox = document.createElement("div");
        alertBox.className = "custom-alert";

        let bgColor, headerText;

        switch (type) {
            case "success":
                bgColor = "#4CAF50"; // Green
                headerText = "✅ Success";
                break;
            case "error":
                bgColor = "#F44336"; // Red
                headerText = "❌ Error";
                break;
            case "warning":
                bgColor = "#FFA500"; // Orange
                headerText = "⚠️ Warning";
                break;
            default:
                bgColor = "#216F3"; // Blue (Info)
                headerText = "ℹ️ Info";
        }

        alertBox.innerHTML = `
            <div class="header" style="font-weight: bold; font-size: 20px; margin-bottom: 10px;">${headerText}</div>
            <div class="message">${message}</div>
            <button class="button" id="alertOkBtn" style="
                background-color: #333;
                color: white;
                border: none;
                padding: 8px 20px;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 10px;
            ">OK</button>
        `;

        alertBox.style.cssText = `
            display: block;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: ${bgColor};
            color: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            z-index: 9999;
            text-align: center;
        `;

        document.body.appendChild(alertBox);

        document.getElementById("alertOkBtn").addEventListener("click", function () {
            alertBox.remove();
            resolve();  // Resolves the promise when "OK" is clicked
        });
    });
}

// Toast Confirmation Function (Mimics `confirm()`)
export async function showConfirmToast(message) {
    return new Promise((resolve) => {
        const confirmBox = document.createElement("div");
        confirmBox.className = "custom-confirm-toast";

        confirmBox.innerHTML = `
            <div class="header" style="font-weight: bold; font-size: 20px; margin-bottom: 10px;">⚠️ Confirmation</div>
            <div class="message">${message}</div>
            <div class="buttons" style="margin-top: 15px;">
                <button class="confirm-btn" style="
                    background-color: #4CAF50; 
                    color: white; 
                    border: none; 
                    padding: 8px 20px; 
                    border-radius: 5px; 
                    cursor: pointer; 
                    margin-right: 10px;
                ">Yes</button>

                <button class="cancel-btn" style="
                    background-color: #F44336; 
                    color: white; 
                    border: none; 
                    padding: 8px 20px; 
                    border-radius: 5px; 
                    cursor: pointer;
                ">No</button>
            </div>
        `;

        confirmBox.style.cssText = `
            display: block;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: #fff;
            color: #333;
            padding: 20px;
            border: 2px solid #4CAF50;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            z-index: 9999;
            text-align: center;
        `;

        document.body.appendChild(confirmBox);

        confirmBox.querySelector(".confirm-btn").addEventListener("click", () => {
            confirmBox.remove();
            resolve(true);  // ✅ User confirmed
        });

        confirmBox.querySelector(".cancel-btn").addEventListener("click", () => {
            confirmBox.remove();
            resolve(false);  // ❌ User canceled
        });
    });
}