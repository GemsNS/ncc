(function initAdminEvents() {
  const apiBase = window.NCC_API_BASE || "http://localhost:4000/api";
  const tokenKey = "ncc_admin_token";

  const loginForm = document.querySelector("[data-admin-login-form]");
  const authStatus = document.querySelector("[data-admin-auth-status]");
  const eventForm = document.querySelector("[data-admin-event-form]");
  const eventRows = document.querySelector("[data-admin-event-rows]");
  const eventCount = document.querySelector("[data-admin-event-count]");
  const adminShells = Array.from(document.querySelectorAll("[data-admin-events-shell]"));

  function getToken() {
    return localStorage.getItem(tokenKey);
  }

  function setToken(token) {
    localStorage.setItem(tokenKey, token);
  }

  function clearToken() {
    localStorage.removeItem(tokenKey);
  }

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function toIsoFromLocal(value) {
    if (!value) {
      return "";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return date.toISOString();
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "Date TBA";
    }
    return date.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function setShellVisibility(isVisible) {
    adminShells.forEach(function (node) {
      node.hidden = !isVisible;
    });
  }

  async function request(path, options) {
    const token = getToken();
    const headers = {
      ...(options && options.headers ? options.headers : {})
    };
    if (token) {
      headers.Authorization = "Bearer " + token;
    }
    const response = await fetch(apiBase + path, {
      ...(options || {}),
      headers
    });
    if (!response.ok) {
      let errorText = "Request failed";
      try {
        const payload = await response.json();
        errorText = payload.error || errorText;
      } catch (error) {
        errorText = response.statusText || errorText;
      }
      throw new Error(errorText);
    }
    return response.json();
  }

  function renderRows(items) {
    if (!eventRows || !eventCount) {
      return;
    }
    eventCount.textContent = String(items.length) + " records";
    if (!items.length) {
      eventRows.innerHTML =
        '<tr><td colspan="4" class="muted">No events created yet.</td></tr>';
      return;
    }
    eventRows.innerHTML = items
      .map(function (item) {
        return (
          "<tr>" +
          "<td>" + escapeHtml(item.title) + "</td>" +
          "<td>" + escapeHtml(formatDate(item.startAt)) + "</td>" +
          "<td><span class='status-chip'>" + escapeHtml(item.status) + "</span></td>" +
          "<td>" +
          "<button class='button secondary' type='button' data-event-edit='" + item.id + "'>Edit</button> " +
          "<button class='button secondary' type='button' data-event-publish='" + item.id + "'>Publish</button> " +
          "<button class='button secondary' type='button' data-event-archive='" + item.id + "'>Archive</button> " +
          "<button class='button secondary' type='button' data-event-delete='" + item.id + "'>Delete</button>" +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  async function refreshEvents() {
    const items = await request("/events?includeAll=true");
    renderRows(items);
    return items;
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async function onLogin(event) {
      event.preventDefault();
      const data = new FormData(loginForm);
      try {
        const payload = await request("/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: String(data.get("email") || ""),
            password: String(data.get("password") || "")
          })
        });
        setToken(payload.token);
        if (authStatus) {
          authStatus.textContent = "Authenticated as " + payload.user.email;
        }
        setShellVisibility(true);
        await refreshEvents();
      } catch (error) {
        if (authStatus) {
          authStatus.textContent = error.message;
        }
      }
    });
  }

  if (eventForm) {
    eventForm.addEventListener("submit", async function onCreateEvent(event) {
      event.preventDefault();
      const data = new FormData(eventForm);
      const payload = {
        title: String(data.get("title") || "").trim(),
        category: String(data.get("category") || "").trim(),
        location: String(data.get("location") || "").trim(),
        startAt: toIsoFromLocal(String(data.get("startAtLocal") || "")),
        description: String(data.get("description") || "").trim(),
        status: String(data.get("status") || "draft")
      };
      const endAtIso = toIsoFromLocal(String(data.get("endAtLocal") || ""));
      if (endAtIso) {
        payload.endAt = endAtIso;
      }
      try {
        await request("/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        eventForm.reset();
        await refreshEvents();
      } catch (error) {
        if (authStatus) {
          authStatus.textContent = error.message;
        }
      }
    });
  }

  if (eventRows) {
    eventRows.addEventListener("click", async function onRowActions(event) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const editId = target.getAttribute("data-event-edit");
      const publishId = target.getAttribute("data-event-publish");
      const archiveId = target.getAttribute("data-event-archive");
      const deleteId = target.getAttribute("data-event-delete");

      try {
        if (publishId) {
          await request("/events/" + publishId, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "published" })
          });
        }
        if (archiveId) {
          await request("/events/" + archiveId, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "archived" })
          });
        }
        if (deleteId) {
          const confirmDelete = window.confirm("Delete this event permanently?");
          if (confirmDelete) {
            await request("/events/" + deleteId, { method: "DELETE" });
          }
        }
        if (editId) {
          const nextTitle = window.prompt("Update event title:");
          if (nextTitle && nextTitle.trim()) {
            await request("/events/" + editId, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title: nextTitle.trim() })
            });
          }
        }
        await refreshEvents();
      } catch (error) {
        if (authStatus) {
          authStatus.textContent = error.message;
        }
      }
    });
  }

  if (getToken()) {
    request("/auth/me")
      .then(function (payload) {
        if (authStatus) {
          authStatus.textContent = "Authenticated as " + payload.user.email;
        }
        setShellVisibility(true);
        return refreshEvents();
      })
      .catch(function () {
        clearToken();
        setShellVisibility(false);
      });
  } else {
    setShellVisibility(false);
  }
})();

