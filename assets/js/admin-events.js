(function initAdminEvents() {
  function main() {
  const tokenKey = "ncc_admin_token";

  const loginForm = document.querySelector("[data-admin-login-form]");
  const authStatus = document.querySelector("[data-admin-auth-status]");
  const eventForm = document.querySelector("[data-admin-event-form]");
  const eventRows = document.querySelector("[data-admin-event-rows]");
  const eventCount = document.querySelector("[data-admin-event-count]");
  const adminShells = Array.from(
    document.querySelectorAll(
      "[data-admin-events-shell], [data-admin-prayer-shell], [data-admin-toolbar], [data-admin-site-shell]"
    )
  );
  const prayerRows = document.querySelector("[data-admin-prayer-rows]");
  const prayerCount = document.querySelector("[data-admin-prayer-count]");
  const logoutBtn = document.querySelector("[data-admin-logout]");

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

  function apiRoot() {
    return String(window.NCC_API_BASE || "/api").replace(/\/$/, "");
    }

  async function request(path, options) {
    const token = getToken();
    const headers = {
      ...(options && options.headers ? options.headers : {})
    };
    if (token) {
      headers.Authorization = "Bearer " + token;
    }
    const response = await fetch(apiRoot() + path, {
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

  function renderPrayerRows(items) {
    if (!prayerRows || !prayerCount) {
      return;
    }
    prayerCount.textContent = String(items.length) + " messages";
    if (!items.length) {
      prayerRows.innerHTML =
        '<tr><td colspan="4" class="muted">No prayer chat messages yet.</td></tr>';
      return;
    }
    prayerRows.innerHTML = items
      .map(function (item) {
        var preview = String(item.userMessage || "").slice(0, 72);
        if (String(item.userMessage || "").length > 72) {
          preview += "…";
        }
        return (
          "<tr>" +
          "<td>" +
          escapeHtml(formatDate(item.createdAt)) +
          "</td>" +
          "<td>" +
          escapeHtml(preview) +
          "</td>" +
          "<td><span class='status-chip'>" +
          escapeHtml(item.status || "new") +
          "</span></td>" +
          "<td>" +
          "<button class='button secondary' type='button' data-prayer-view='" +
          item.id +
          "'>View</button> " +
          "<button class='button secondary' type='button' data-prayer-read='" +
          item.id +
          "'>Mark read</button> " +
          "<button class='button secondary' type='button' data-prayer-archive='" +
          item.id +
          "'>Archive</button> " +
          "<button class='button secondary' type='button' data-prayer-note='" +
          item.id +
          "'>Staff note</button>" +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  async function refreshPrayerInbox() {
    if (!prayerRows) {
      return;
    }
    try {
      const items = await request("/prayer/admin/inbox");
      renderPrayerRows(items);
    } catch (error) {
      if (authStatus) {
        authStatus.textContent = error.message;
      }
    }
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
        await refreshPrayerInbox();
        window.dispatchEvent(new CustomEvent("ncc:admin-auth"));
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
          const items = await request("/events?includeAll=true");
          const item = items.find(function (row) {
            return row.id === editId;
          });
          if (item) {
            const nextTitle = window.prompt("Title:", item.title || "");
            if (nextTitle === null) {
              /* cancelled */
            } else {
              const nextCategory = window.prompt("Category:", item.category || "");
              if (nextCategory === null) {
                /* cancelled */
              } else {
                const nextLocation = window.prompt("Location:", item.location || "");
                if (nextLocation === null) {
                  /* cancelled */
                } else {
                  const nextDesc = window.prompt("Description:", item.description || "");
                  if (nextDesc === null) {
                    /* cancelled */
                  } else {
                    await request("/events/" + editId, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        title: String(nextTitle || "").trim() || item.title,
                        category: String(nextCategory || "").trim() || item.category,
                        location: String(nextLocation || "").trim() || item.location,
                        description: String(nextDesc || "").trim() || item.description
                      })
                    });
                  }
                }
              }
            }
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

  if (prayerRows) {
    prayerRows.addEventListener("click", async function onPrayerActions(event) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const viewId = target.getAttribute("data-prayer-view");
      const noteId = target.getAttribute("data-prayer-note");
      const readId = target.getAttribute("data-prayer-read");
      const archiveId = target.getAttribute("data-prayer-archive");
      try {
        if (viewId) {
          const items = await request("/prayer/admin/inbox");
          const row = items.find(function (item) {
            return item.id === viewId;
          });
          if (row) {
            window.alert(
              "Request:\n\n" +
                String(row.userMessage || "") +
                "\n\n—\n\nReply:\n\n" +
                String(row.aiReply || "")
            );
          }
        }
        if (noteId) {
          const items = await request("/prayer/admin/inbox");
          const row = items.find(function (item) {
            return item.id === noteId;
          });
          if (row) {
            var noteText = window.prompt("Staff note (saved on this thread):", row.staffNote || "");
            if (noteText !== null) {
              await request("/prayer/admin/inbox/" + noteId, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ staffNote: noteText })
              });
            }
          }
        }
        if (readId) {
          await request("/prayer/admin/inbox/" + readId, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "read" })
          });
        }
        if (archiveId) {
          await request("/prayer/admin/inbox/" + archiveId, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "archived" })
          });
        }
        await refreshPrayerInbox();
      } catch (error) {
        if (authStatus) {
          authStatus.textContent = error.message;
        }
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", function onLogout() {
      clearToken();
      setShellVisibility(false);
      if (authStatus) {
        authStatus.textContent = "Signed out.";
      }
      if (loginForm) {
        loginForm.reset();
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
        window.dispatchEvent(new CustomEvent("ncc:admin-auth"));
        return refreshEvents().then(function () {
          return refreshPrayerInbox();
        });
      })
      .catch(function () {
        clearToken();
        setShellVisibility(false);
      });
  } else {
    setShellVisibility(false);
  }
  }

  const waitRuntime = window.__NCC_RUNTIME_LOADED;
  if (waitRuntime && typeof waitRuntime.then === "function") {
    waitRuntime
      .catch(function () {
        return {};
      })
      .then(function () {
        main();
      });
  } else {
    main();
  }
})();

