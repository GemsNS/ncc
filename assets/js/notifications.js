function initNotifications() {
  const notifyButton = document.querySelector("[data-notify-enable]");
  const notifyStatus = document.querySelector("[data-notify-status]");
  if (!notifyButton || !notifyStatus) {
    return;
  }

  if (!("Notification" in window)) {
    notifyStatus.textContent = "Browser does not support notifications.";
    notifyButton.disabled = true;
    return;
  }

  notifyStatus.textContent = "Current permission: " + Notification.permission;

  notifyButton.addEventListener("click", async () => {
    try {
      const permission = await Notification.requestPermission();
      notifyStatus.textContent = "Current permission: " + permission;
      if (permission === "granted") {
        new Notification("NCC Alerts Enabled", {
          body: "You will receive important demo updates for live services."
        });
      }
    } catch (error) {
      notifyStatus.textContent = "Notification request failed.";
    }
  });
}

initNotifications();
