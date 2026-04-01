const rsvpKey = "ncc_demo_rsvps";

function getRsvps() {
  return JSON.parse(localStorage.getItem(rsvpKey) || "[]");
}

function saveRsvps(items) {
  localStorage.setItem(rsvpKey, JSON.stringify(items));
}

function renderRsvps() {
  const target = document.querySelector("[data-rsvp-list]");
  if (!target) {
    return;
  }
  const items = getRsvps();
  target.innerHTML = items
    .slice(0, 10)
    .map((item) => "<li>" + item.name + " - " + item.event + " - " + item.code + "</li>")
    .join("");
}

function initEventsTools() {
  const form = document.querySelector("[data-rsvp-form]");
  const qrNode = document.querySelector("[data-qr-preview]");
  if (!form) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "");
    const email = String(data.get("email") || "");
    const eventName = String(data.get("event") || "General Service");
    const code = "NCC-" + Math.floor(Math.random() * 900000 + 100000);
    const items = getRsvps();
    items.unshift({
      name,
      email,
      event: eventName,
      code,
      createdAt: new Date().toISOString()
    });
    saveRsvps(items);
    form.reset();
    renderRsvps();
    if (qrNode) {
      const payload = encodeURIComponent(code + "|" + eventName);
      qrNode.src = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=" + payload;
      qrNode.alt = "Check-in QR for " + code;
    }
  });

  renderRsvps();
}

initEventsTools();
