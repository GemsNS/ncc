(function initStatusPage() {
  const root = document.querySelector("[data-status-page]");
  if (!root) {
    return;
  }

  const overallEl = document.querySelector("[data-status-overall]");
  const updatedEl = document.querySelector("[data-status-updated]");
  const uptimeEl = document.querySelector("[data-status-uptime]");
  const metricsEl = document.querySelector("[data-status-metrics]");
  const tbodyEl = document.querySelector("[data-status-tbody]");
  const historyEl = document.querySelector("[data-status-history]");
  const refreshBtn = document.querySelector("[data-status-refresh]");

  const POLL_MS = 30000;
  const history = [];
  let pollTimer = null;

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatUptime(seconds) {
    const total = Math.max(0, Number(seconds) || 0);
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    if (days > 0) {
      return days + "d " + hours + "h " + minutes + "m";
    }
    if (hours > 0) {
      return hours + "h " + minutes + "m";
    }
    return minutes + "m " + (total % 60) + "s";
  }

  function statusLabel(status) {
    if (status === "operational") {
      return "Operational";
    }
    if (status === "degraded") {
      return "Degraded";
    }
    if (status === "outage") {
      return "Outage";
    }
    return "Unknown";
  }

  function badgeClass(status) {
    if (status === "operational") {
      return "status-badge--ok";
    }
    if (status === "degraded") {
      return "status-badge--warn";
    }
    return "status-badge--bad";
  }

  function chipClass(status) {
    if (status === "operational") {
      return "status-chip--ok";
    }
    if (status === "degraded") {
      return "status-chip--warn";
    }
    return "status-chip--bad";
  }

  function summarizeChecks(services) {
    if (services.some(function (s) { return s.status === "outage"; })) {
      return "outage";
    }
    if (services.some(function (s) { return s.status === "degraded"; })) {
      return "degraded";
    }
    return "operational";
  }

  async function timedFetch(url, options) {
    const start = performance.now();
    try {
      const response = await fetch(url, Object.assign({ cache: "no-store" }, options || {}));
      return {
        ok: response.ok,
        status: response.status,
        latencyMs: Math.round(performance.now() - start),
        response: response
      };
    } catch (error) {
      return {
        ok: false,
        status: 0,
        latencyMs: Math.round(performance.now() - start),
        error: error && error.message ? error.message : "Network error"
      };
    }
  }

  function apiBase() {
    const base = window.NCC_API_BASE || "/api";
    return String(base).replace(/\/$/, "");
  }

  async function checkClientServices() {
    const checks = [
      {
        id: "public-site",
        name: "Public website",
        run: function () {
          return timedFetch("./index.html").then(function (result) {
            if (!result.ok) {
              throw new Error("HTTP " + result.status);
            }
            return { status: "operational", latencyMs: result.latencyMs, detail: "Home page reachable" };
          });
        }
      },
      {
        id: "static-content",
        name: "Static content bundle",
        run: function () {
          return timedFetch("./assets/data/site-content.json").then(function (result) {
            if (!result.ok) {
              throw new Error("HTTP " + result.status);
            }
            return result.response.json().then(function (data) {
              if (!data || !data.church) {
                throw new Error("Invalid site-content.json");
              }
              return {
                status: "operational",
                latencyMs: result.latencyMs,
                detail: "Fallback JSON loaded"
              };
            });
          });
        }
      },
      {
        id: "events-fallback",
        name: "Calendar fallback (XML)",
        run: function () {
          return timedFetch("./assets/data/events.xml").then(function (result) {
            if (!result.ok) {
              throw new Error("HTTP " + result.status);
            }
            return {
              status: "operational",
              latencyMs: result.latencyMs,
              detail: "events.xml reachable"
            };
          });
        }
      },
      {
        id: "runtime-config",
        name: "Runtime configuration",
        run: function () {
          return timedFetch("./assets/config/runtime.json").then(function (live) {
            if (live.ok) {
              return { status: "operational", latencyMs: live.latencyMs, detail: "runtime.json present" };
            }
            return timedFetch("./assets/config/runtime.production.example.json").then(function (example) {
              if (!example.ok) {
                throw new Error("Runtime config missing");
              }
              return {
                status: "degraded",
                latencyMs: example.latencyMs,
                detail: "Using example runtime template only"
              };
            });
          });
        }
      }
    ];

    const results = [];
    for (let i = 0; i < checks.length; i += 1) {
      const item = checks[i];
      try {
        results.push(
          Object.assign({ id: item.id, name: item.name }, await item.run())
        );
      } catch (error) {
        results.push({
          id: item.id,
          name: item.name,
          status: "outage",
          latencyMs: 0,
          detail: error && error.message ? error.message : "Check failed"
        });
      }
    }
    return results;
  }

  async function fetchBackendStatus() {
    const result = await timedFetch(apiBase() + "/public/status");
    if (!result.ok) {
      throw new Error(result.error || "API status HTTP " + result.status);
    }
    return result.response.json();
  }

  async function runAllChecks() {
    const clientServices = await checkClientServices();
    let backendPayload = null;
    let apiReachable = false;

    try {
      backendPayload = await fetchBackendStatus();
      apiReachable = true;
    } catch (error) {
      backendPayload = {
        status: "outage",
        checkedAt: new Date().toISOString(),
        uptimeSeconds: 0,
        services: [
          {
            id: "api",
            name: "NCC API",
            status: "outage",
            latencyMs: 0,
            detail: error && error.message ? error.message : "Unreachable"
          }
        ]
      };
    }

    const backendServices = Array.isArray(backendPayload.services) ? backendPayload.services : [];
    const merged = clientServices.concat(backendServices);
    const overall = apiReachable ? backendPayload.status || summarizeChecks(merged) : summarizeChecks(merged);

    return {
      overall: overall,
      checkedAt: backendPayload.checkedAt || new Date().toISOString(),
      uptimeSeconds: backendPayload.uptimeSeconds,
      startedAt: backendPayload.startedAt,
      version: backendPayload.version,
      environment: backendPayload.environment,
      apiReachable: apiReachable,
      services: merged
    };
  }

  function renderMetrics(snapshot) {
    if (!metricsEl) {
      return;
    }
    const operational = snapshot.services.filter(function (s) { return s.status === "operational"; }).length;
    const total = snapshot.services.length;
    const avgLatency = Math.round(
      snapshot.services.reduce(function (sum, s) { return sum + (Number(s.latencyMs) || 0); }, 0) /
        Math.max(1, total)
    );

    metricsEl.innerHTML =
      '<article class="card metric-card">' +
      "<h3>Components</h3>" +
      "<p class='metric-value'>" + operational + "/" + total + "</p>" +
      "<p class='muted'>Operational right now</p>" +
      "</article>" +
      '<article class="card metric-card">' +
      "<h3>Avg response</h3>" +
      "<p class='metric-value'>" + avgLatency + " ms</p>" +
      "<p class='muted'>Across visible checks</p>" +
      "</article>" +
      '<article class="card metric-card'>" +
      "<h3>API</h3>" +
      "<p class='metric-value'>" + (snapshot.apiReachable ? "Online" : "Offline") + "</p>" +
      "<p class='muted'>" + escapeHtml(snapshot.environment || "—") + "</p>" +
      "</article>" +
      '<article class="card metric-card">' +
      "<h3>Version</h3>" +
      "<p class='metric-value'>" + escapeHtml(snapshot.version || "—") + "</p>" +
      "<p class='muted'>Backend release</p>" +
      "</article>";
  }

  function renderTable(snapshot) {
    if (!tbodyEl) {
      return;
    }
    if (!snapshot.services.length) {
      tbodyEl.innerHTML = '<tr><td colspan="4" class="muted">No checks available.</td></tr>';
      return;
    }
    tbodyEl.innerHTML = snapshot.services
      .map(function (service) {
        return (
          "<tr>" +
          "<td>" + escapeHtml(service.name) + "</td>" +
          "<td><span class='status-chip " + chipClass(service.status) + "'>" + escapeHtml(statusLabel(service.status)) + "</span></td>" +
          "<td>" + (service.latencyMs != null ? escapeHtml(service.latencyMs + " ms") : "—") + "</td>" +
          "<td class='muted'>" + escapeHtml(service.detail || "—") + "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function renderHistory(snapshot) {
    if (!historyEl) {
      return;
    }
    history.unshift({
      at: snapshot.checkedAt,
      overall: snapshot.overall
    });
    if (history.length > 12) {
      history.length = 12;
    }
    historyEl.innerHTML = history
      .map(function (entry) {
        const when = new Date(entry.at);
        const label = when.toLocaleString();
        return (
          "<li><span class='status-chip " + chipClass(entry.overall) + "'>" + escapeHtml(statusLabel(entry.overall)) + "</span> " +
          "<span class='muted'>" + escapeHtml(label) + "</span></li>"
        );
      })
      .join("");
  }

  function renderSnapshot(snapshot) {
    if (overallEl) {
      overallEl.textContent = statusLabel(snapshot.overall);
      overallEl.className = "status-badge " + badgeClass(snapshot.overall);
    }
    if (updatedEl) {
      updatedEl.textContent =
        "Last checked " + new Date(snapshot.checkedAt).toLocaleString() + " (your local time)";
    }
    if (uptimeEl) {
      if (snapshot.apiReachable && snapshot.uptimeSeconds != null) {
        uptimeEl.hidden = false;
        uptimeEl.textContent =
          "API uptime: " + formatUptime(snapshot.uptimeSeconds) + " (since " + new Date(snapshot.startedAt).toLocaleString() + ")";
      } else {
        uptimeEl.hidden = true;
        uptimeEl.textContent = "";
      }
    }
    renderMetrics(snapshot);
    renderTable(snapshot);
    renderHistory(snapshot);
  }

  async function refresh() {
    if (overallEl) {
      overallEl.textContent = "Checking…";
      overallEl.className = "status-badge status-badge--checking";
    }
    const snapshot = await runAllChecks();
    renderSnapshot(snapshot);
  }

  function startPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
    }
    pollTimer = setInterval(refresh, POLL_MS);
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", function () {
      refresh();
    });
  }

  (window.__NCC_RUNTIME_LOADED || Promise.resolve())
    .catch(function () {
      return {};
    })
    .then(refresh)
    .then(startPolling);
})();
