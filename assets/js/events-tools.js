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
  const qrFallback = document.querySelector("[data-qr-fallback]");
  if (!form) {
    return;
  }

  function setQrPreview(code, eventName) {
    if (!qrNode) {
      return;
    }
    const payloadRaw = code + "|" + eventName;
    const payload = encodeURIComponent(payloadRaw);
    const providers = [
      "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=" + payload,
      "https://quickchart.io/qr?size=180&text=" + payload,
      "https://chart.googleapis.com/chart?cht=qr&chs=180x180&chl=" + payload
    ];
    let index = 0;

    function showFallback() {
      qrNode.removeAttribute("src");
      qrNode.hidden = true;
      if (qrFallback) {
        qrFallback.textContent = "Check-in code: " + code + " (QR preview unavailable on this network)";
      }
    }

    qrNode.onerror = function onError() {
      index += 1;
      if (index < providers.length) {
        qrNode.src = providers[index];
      } else {
        showFallback();
      }
    };

    qrNode.onload = function onLoad() {
      qrNode.hidden = false;
      if (qrFallback) {
        qrFallback.textContent = "Check-in code: " + code;
      }
    };

    qrNode.alt = "Check-in QR for " + code;
    qrNode.hidden = true;
    qrNode.src = providers[index];
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
    setQrPreview(code, eventName);
  });

  renderRsvps();
}

initEventsTools();
