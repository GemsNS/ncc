(function initEventsCalendar() {
  const shell = document.querySelector("[data-event-calendar]");
  if (!shell) {
    return;
  }

  const apiBase = window.NCC_API_BASE || "http://localhost:4000/api";

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDateRange(startAt, endAt) {
    const start = new Date(startAt);
    if (Number.isNaN(start.getTime())) {
      return "Date TBA";
    }
    const startText = start.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
    if (!endAt) {
      return startText;
    }
    const end = new Date(endAt);
    if (Number.isNaN(end.getTime())) {
      return startText;
    }
    const endText = end.toLocaleString(undefined, {
      hour: "numeric",
      minute: "2-digit"
    });
    return startText + " - " + endText;
  }

  function renderEvents(items) {
    if (!Array.isArray(items) || !items.length) {
      shell.innerHTML =
        '<article class="card">' +
        "<h3>No upcoming events published yet</h3>" +
        '<p class="muted">Staff can publish events from the admin panel once details are finalized.</p>' +
        "</article>";
      return;
    }

    shell.innerHTML = items
      .map(function (item) {
        return (
          '<article class="card event-card">' +
          '<p class="event-card__meta">' +
          escapeHtml(item.category || "Church Event") +
          "</p>" +
          "<h3>" +
          escapeHtml(item.title || "Untitled event") +
          "</h3>" +
          '<p><strong>' +
          escapeHtml(formatDateRange(item.startAt, item.endAt)) +
          "</strong></p>" +
          '<p class="muted">' +
          escapeHtml(item.location || "Location TBA") +
          "</p>" +
          "<p>" +
          escapeHtml(item.description || "") +
          "</p>" +
          "</article>"
        );
      })
      .join("");
  }

  function fallbackEvents() {
    const now = new Date();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() + ((7 - now.getDay()) % 7));
    sunday.setHours(11, 0, 0, 0);
    const wednesday = new Date(now);
    const delta = (3 - now.getDay() + 7) % 7;
    wednesday.setDate(now.getDate() + delta);
    wednesday.setHours(19, 0, 0, 0);

    return [
      {
        title: "Sunday Worship",
        category: "Weekly Gathering",
        location: "NCC Suffolk + Zoom",
        description: "Primary worship gathering with biblical teaching and community prayer.",
        startAt: sunday.toISOString()
      },
      {
        title: "Wednesday Midweek",
        category: "Bible Teaching",
        location: "NCC Suffolk + Zoom",
        description: "Midweek teaching and prayer focused on spiritual growth.",
        startAt: wednesday.toISOString()
      }
    ];
  }

  fetch(apiBase + "/events")
    .then(function (response) {
      if (!response.ok) {
        throw new Error("events fetch failed");
      }
      return response.json();
    })
    .then(function (items) {
      renderEvents(items);
    })
    .catch(function () {
      renderEvents(fallbackEvents());
    });
})();

