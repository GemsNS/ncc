(function initEventsCalendar() {
  const shell = document.querySelector("[data-event-calendar]");
  if (!shell) {
    return;
  }

  function startCalendar() {
  const apiBase = window.NCC_API_BASE || "/api";
  var xmlUrl = "./assets/data/events.xml";
  if (window.__NCC_SITE_CONFIG && window.__NCC_SITE_CONFIG.calendar && window.__NCC_SITE_CONFIG.calendar.xmlUrl) {
    xmlUrl = String(window.__NCC_SITE_CONFIG.calendar.xmlUrl);
  }

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function sameDay(a, b) {
    if (!a || !b) return false;
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  function formatIsoDateLocal(d) {
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }

  function formatTime(d) {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  function formatDateRange(startAt, endAt) {
    const start = startAt instanceof Date ? startAt : new Date(startAt);
    if (Number.isNaN(start.getTime())) {
      return "Date TBA";
    }
    const startText = start.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric"
    }) + " · " + formatTime(start);
    if (!endAt) {
      return startText;
    }
    const end = endAt instanceof Date ? endAt : new Date(endAt);
    if (Number.isNaN(end.getTime())) {
      return startText;
    }
    return startText + " – " + formatTime(end);
  }

  function safeString(value) {
    return typeof value === "string" ? value : value === null || value === undefined ? "" : String(value);
  }

  function normalizeEvent(raw) {
    const startAt = raw && raw.startAt ? new Date(raw.startAt) : raw && raw.start ? new Date(raw.start) : new Date(NaN);
    const endAt = raw && raw.endAt ? new Date(raw.endAt) : raw && raw.end ? new Date(raw.end) : null;
    const title = safeString(raw && raw.title) || "Church Event";
    const category = safeString(raw && raw.category) || "Church Event";
    const location = safeString(raw && raw.location) || "NCC Suffolk";
    const description = safeString(raw && raw.description);
    const url = safeString(raw && raw.url);
    const id = safeString(raw && (raw.id || raw.slug)) || "evt_" + Math.random().toString(16).slice(2);

    return {
      id,
      title,
      category,
      location,
      description,
      url,
      startAt,
      endAt: endAt && !Number.isNaN(endAt.getTime()) ? endAt : null
    };
  }

  function normalizeItems(items) {
    const list = Array.isArray(items) ? items : [];
    return list
      .map(normalizeEvent)
      .filter(function (evt) {
        return evt.startAt instanceof Date && !Number.isNaN(evt.startAt.getTime());
      })
      .sort(function (a, b) {
        return a.startAt.getTime() - b.startAt.getTime();
      });
  }

  function parseXmlEvents(xmlText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(String(xmlText || ""), "application/xml");
    const parseError = doc.querySelector("parsererror");
    if (parseError) {
      throw new Error("xml parse error");
    }
    const nodes = Array.from(doc.querySelectorAll("events > event"));
    return nodes.map(function (node) {
      return normalizeEvent({
        id: node.getAttribute("id"),
        title: node.getAttribute("title"),
        category: node.getAttribute("category"),
        location: node.getAttribute("location"),
        start: node.getAttribute("start"),
        end: node.getAttribute("end"),
        url: node.getAttribute("url"),
        description: node.getAttribute("description")
      });
    });
  }

  function fetchApiEvents() {
    return fetch(apiBase + "/events", { cache: "no-store" }).then(function (response) {
      if (!response.ok) {
        throw new Error("api events http");
      }
      return response.json();
    });
  }

  function fetchXmlEvents() {
    return fetch(xmlUrl, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("xml events http");
        return res.text();
      })
      .then(function (text) {
        return parseXmlEvents(text);
      });
  }

  function buildWeeklyDefaults(rangeStart, rangeEnd) {
    const items = [];
    const start = startOfDay(rangeStart);
    const end = startOfDay(rangeEnd);
    const cursor = new Date(start);

    function addWeekly(dayIndex, hour24, minute, title, category, description) {
      const d = new Date(cursor);
      d.setDate(d.getDate() + ((dayIndex - d.getDay() + 7) % 7));
      while (d.getTime() <= end.getTime()) {
        const at = new Date(d);
        at.setHours(hour24, minute, 0, 0);
        if (at.getTime() >= start.getTime() && at.getTime() <= end.getTime()) {
          items.push(
            normalizeEvent({
              id: "weekly_" + title.replace(/\s+/g, "_").toLowerCase() + "_" + formatIsoDateLocal(at),
              title: title,
              category: category,
              location: "NCC Suffolk",
              description: description,
              startAt: at.toISOString()
            })
          );
        }
        d.setDate(d.getDate() + 7);
      }
    }

    // Default weekly events per request:
    // - sundaychurch
    // - wednsdaymeeting (typo preserved only in ID, not visible label)
    addWeekly(
      0,
      11,
      0,
      "Sunday Church",
      "Weekly Gathering",
      "Sunday worship with practical Bible teaching and community prayer."
    );
    addWeekly(
      3,
      19,
      0,
      "Wednesday Meeting",
      "Midweek",
      "Midweek Bible teaching and prayer to strengthen your walk through the week."
    );

    return items;
  }

  function monthGrid(anchorDate) {
    const monthStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
    const monthEnd = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0);
    const gridStart = new Date(monthStart);
    gridStart.setDate(monthStart.getDate() - monthStart.getDay()); // Sunday-start grid
    gridStart.setHours(0, 0, 0, 0);
    const gridEnd = new Date(monthEnd);
    gridEnd.setDate(monthEnd.getDate() + (6 - monthEnd.getDay()));
    gridEnd.setHours(23, 59, 59, 999);

    const days = [];
    const cursor = new Date(gridStart);
    while (cursor.getTime() <= gridEnd.getTime()) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return { monthStart, monthEnd, gridStart, gridEnd, days };
  }

  function eventChipHtml(evt) {
    const time = evt.startAt ? formatTime(evt.startAt) : "";
    const label = time ? time + " · " + evt.title : evt.title;
    const category = evt.category || "Event";
    const safeId = escapeHtml(evt.id);
    return (
      '<button type="button" class="cal-chip" data-cal-open="' +
      safeId +
      '" title="' +
      escapeHtml(category) +
      '">' +
      escapeHtml(label) +
      "</button>"
    );
  }

  function renderCalendar(anchorDate, allEvents) {
    const grid = monthGrid(anchorDate);
    const today = new Date();

    const byDayKey = {};
    allEvents.forEach(function (evt) {
      const key = formatIsoDateLocal(evt.startAt);
      if (!byDayKey[key]) byDayKey[key] = [];
      byDayKey[key].push(evt);
    });
    Object.keys(byDayKey).forEach(function (key) {
      byDayKey[key].sort(function (a, b) {
        return a.startAt.getTime() - b.startAt.getTime();
      });
    });

    const monthName = grid.monthStart.toLocaleDateString(undefined, { month: "long", year: "numeric" });

    shell.innerHTML =
      '<section class="cal-shell" aria-label="Monthly calendar">' +
      '<div class="cal-head">' +
      '<div class="cal-head__title">' +
      '<h2 class="cal-month">' +
      escapeHtml(monthName) +
      '</h2><p class="muted cal-sub">Tap a day to see details. Weekly schedule stays visible by default.</p>' +
      "</div>" +
      '<div class="cal-head__actions">' +
      '<button type="button" class="button secondary cal-nav" data-cal-prev aria-label="Previous month">‹</button>' +
      '<button type="button" class="button secondary cal-nav" data-cal-today>Today</button>' +
      '<button type="button" class="button secondary cal-nav" data-cal-next aria-label="Next month">›</button>' +
      "</div>" +
      "</div>" +
      '<div class="cal-grid" role="grid" aria-label="Month days">' +
      '<div class="cal-dow" aria-hidden="true">' +
      "<span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>" +
      "</div>" +
      '<div class="cal-days">' +
      grid.days
        .map(function (day) {
          const inMonth = day.getMonth() === grid.monthStart.getMonth();
          const isToday = sameDay(day, today);
          const key = formatIsoDateLocal(day);
          const items = byDayKey[key] || [];
          const chips = items.slice(0, 3).map(eventChipHtml).join("");
          const more =
            items.length > 3
              ? '<span class="cal-more">+' + escapeHtml(String(items.length - 3)) + " more</span>"
              : "";
          return (
            '<button type="button" class="cal-day' +
            (inMonth ? "" : " is-out") +
            (isToday ? " is-today" : "") +
            '" data-cal-day="' +
            escapeHtml(key) +
            '">' +
            '<span class="cal-daynum">' +
            escapeHtml(String(day.getDate())) +
            "</span>" +
            '<span class="cal-chips">' +
            chips +
            more +
            "</span>" +
            "</button>"
          );
        })
        .join("") +
      "</div>" +
      "</div>" +
      '<aside class="cal-panel" aria-live="polite">' +
      '<div class="cal-panel__inner">' +
      '<p class="pill">Schedule</p>' +
      '<h3 class="cal-panel__title">This Week</h3>' +
      '<div class="cal-panel__list" data-cal-panel-list></div>' +
      "</div>" +
      "</aside>" +
      "</section>";

    const panelList = shell.querySelector("[data-cal-panel-list]");
    const dayButtons = Array.from(shell.querySelectorAll("[data-cal-day]"));
    const openButtons = Array.from(shell.querySelectorAll("[data-cal-open]"));

    function setPanelForDayKey(dayKey) {
      if (!panelList) return;
      const titleNode = shell.querySelector(".cal-panel__title");
      const dateObj = new Date(dayKey + "T00:00:00");
      const title = dateObj.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
      if (titleNode) titleNode.textContent = title;

      const items = byDayKey[dayKey] || [];
      if (!items.length) {
        panelList.innerHTML =
          '<article class="cal-detail muted">No scheduled events for this day.</article>' +
          '<article class="cal-detail"><strong>Weekly Schedule</strong><p class="muted">Sunday Church · 11:00 AM<br/>Wednesday Meeting · 7:00 PM</p></article>';
        return;
      }
      panelList.innerHTML =
        items
          .map(function (evt) {
            const when = formatDateRange(evt.startAt, evt.endAt);
            const meta = escapeHtml(evt.category || "Event");
            const title = escapeHtml(evt.title || "Church Event");
            const location = escapeHtml(evt.location || "NCC Suffolk");
            const description = escapeHtml(evt.description || "");
            const link = evt.url
              ? '<p><a class="button secondary" href="' +
                escapeHtml(evt.url) +
                '" target="_blank" rel="noopener noreferrer">Details</a></p>'
              : "";
            return (
              '<article class="cal-detail">' +
              '<p class="event-card__meta">' +
              meta +
              "</p>" +
              "<h4>" +
              title +
              "</h4>" +
              '<p><strong>' +
              escapeHtml(when) +
              "</strong></p>" +
              '<p class="muted">' +
              location +
              "</p>" +
              (description ? "<p>" + description + "</p>" : "") +
              link +
              "</article>"
            );
          })
          .join("") +
        '<article class="cal-detail"><strong>Weekly Schedule</strong><p class="muted">Sunday Church · 11:00 AM<br/>Wednesday Meeting · 7:00 PM</p></article>';
    }

    function pickDefaultDay() {
      const tKey = formatIsoDateLocal(new Date());
      if (byDayKey[tKey] && byDayKey[tKey].length) return tKey;
      // Prefer earliest event in month grid
      const keys = Object.keys(byDayKey).sort();
      const inView = keys.filter(function (k) {
        const d = new Date(k + "T00:00:00");
        return d.getTime() >= startOfDay(grid.gridStart).getTime() && d.getTime() <= startOfDay(grid.gridEnd).getTime();
      });
      return inView.length ? inView[0] : formatIsoDateLocal(new Date(grid.monthStart));
    }

    let selectedKey = pickDefaultDay();
    setPanelForDayKey(selectedKey);
    dayButtons.forEach(function (btn) {
      btn.classList.toggle("is-selected", btn.getAttribute("data-cal-day") === selectedKey);
      btn.addEventListener("click", function () {
        selectedKey = btn.getAttribute("data-cal-day") || selectedKey;
        dayButtons.forEach(function (b) {
          b.classList.toggle("is-selected", b === btn);
        });
        setPanelForDayKey(selectedKey);
      });
    });

    // Clicking a chip jumps panel to that day
    openButtons.forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const id = btn.getAttribute("data-cal-open");
        if (!id) return;
        const match = allEvents.find(function (evt) {
          return evt.id === id;
        });
        if (!match) return;
        const key = formatIsoDateLocal(match.startAt);
        const targetDayBtn = shell.querySelector('[data-cal-day="' + key + '"]');
        if (targetDayBtn) {
          targetDayBtn.click();
        } else {
          setPanelForDayKey(key);
        }
      });
    });
  }

  function loadEventsForRange(gridStart, gridEnd) {
    return fetchApiEvents()
      .then(function (items) {
        return normalizeItems(items);
      })
      .catch(function () {
        return fetchXmlEvents().then(function (xmlItems) {
          return normalizeItems(xmlItems);
        });
      })
      .then(function (items) {
        const weekly = buildWeeklyDefaults(gridStart, gridEnd);
        const combined = normalizeItems(items.concat(weekly));
        // Keep only events that intersect the visible grid range (start inside range).
        return combined.filter(function (evt) {
          return evt.startAt.getTime() >= gridStart.getTime() && evt.startAt.getTime() <= gridEnd.getTime();
        });
      });
  }

  function mount(initialDate) {
    const anchor = initialDate instanceof Date ? initialDate : new Date();
    const grid = monthGrid(anchor);
    shell.innerHTML =
      '<article class="card">' +
      "<h3>Loading calendar...</h3>" +
      '<p class="muted">Please wait while we pull upcoming events.</p>' +
      "</article>";

    loadEventsForRange(grid.gridStart, grid.gridEnd)
      .then(function (items) {
        renderCalendar(anchor, items);

        const prev = shell.querySelector("[data-cal-prev]");
        const next = shell.querySelector("[data-cal-next]");
        const today = shell.querySelector("[data-cal-today]");

        if (prev) {
          prev.addEventListener("click", function () {
            mount(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1));
          });
        }
        if (next) {
          next.addEventListener("click", function () {
            mount(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1));
          });
        }
        if (today) {
          today.addEventListener("click", function () {
            mount(new Date());
          });
        }
      })
      .catch(function () {
        shell.innerHTML =
          '<article class="card">' +
          "<h3>Calendar unavailable</h3>" +
          '<p class="muted">We could not load events from the admin service or the XML file.</p>' +
          "</article>";
      });
  }

  mount(new Date());
  }

  const waitRuntime = window.__NCC_RUNTIME_LOADED;
  if (waitRuntime && typeof waitRuntime.then === "function") {
    waitRuntime
      .catch(function () {
        return {};
      })
      .then(function () {
        if (typeof window.ensureNccSitePublicConfig === "function") {
          return window.ensureNccSitePublicConfig();
        }
        return null;
      })
      .catch(function () {
        return null;
      })
      .then(function () {
        startCalendar();
      });
  } else {
    startCalendar();
  }
})();

