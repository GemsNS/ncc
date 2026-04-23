(function initAdminSiteConfig() {
  const tokenKey = "ncc_admin_token";
  const textarea = document.querySelector("[data-admin-site-config-text]");
  const statusEl = document.querySelector("[data-admin-site-config-status]");
  const loadBtn = document.querySelector("[data-admin-site-config-load]");
  const saveBtn = document.querySelector("[data-admin-site-config-save]");
  var authListenerAttached = false;

  function apiRoot() {
    return String(window.NCC_API_BASE || "/api").replace(/\/$/, "");
  }

  function validateBasicConfigShape(cfg) {
    const errors = [];
    if (!cfg || typeof cfg !== "object") {
      return ["Config must be a JSON object."];
    }
    if (cfg.videoSlots && typeof cfg.videoSlots === "object") {
      Object.keys(cfg.videoSlots).forEach(function (key) {
        const slot = cfg.videoSlots[key];
        if (!slot || typeof slot !== "object") {
          return;
        }
        const overlay = slot.overlay;
        if (overlay && ["auto", "force-online", "force-offline"].indexOf(String(overlay)) === -1) {
          errors.push("videoSlots." + key + ".overlay must be auto|force-online|force-offline");
        }
        const url = slot.embedUrl;
        if (url && typeof url === "string") {
          const v = url.trim();
          const ok = v.startsWith("./") || v.startsWith("https://") || v.startsWith("http://");
          if (!ok) {
            errors.push("videoSlots." + key + ".embedUrl must be http(s):// or ./ relative");
          }
        }
      });
    }
    return errors;
  }

  function getToken() {
    return localStorage.getItem(tokenKey);
  }

  async function request(path, options) {
    const token = getToken();
    const headers = {
      "Content-Type": "application/json",
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
      let msg = "Request failed";
      try {
        const body = await response.json();
        msg = body.error || msg;
      } catch (error) {
        msg = response.statusText || msg;
      }
      throw new Error(msg);
    }
    return response.json();
  }

  async function loadConfig() {
    if (!textarea) {
      return;
    }
    const data = await request("/admin/site-config", { method: "GET" });
    textarea.value = JSON.stringify(data, null, 2);
    if (statusEl) {
      statusEl.textContent = "Loaded site configuration.";
    }
  }

  async function saveConfig() {
    if (!textarea) {
      return;
    }
    let parsed;
    try {
      parsed = JSON.parse(textarea.value);
    } catch (error) {
      if (statusEl) {
        statusEl.textContent = "Invalid JSON: " + error.message;
      }
      return;
    }

    const errs = validateBasicConfigShape(parsed);
    if (errs.length) {
      if (statusEl) {
        statusEl.textContent = "Config validation: " + errs[0];
      }
      return;
    }
    await request("/admin/site-config", {
      method: "PUT",
      body: JSON.stringify(parsed)
    });
    if (statusEl) {
      statusEl.textContent = "Saved. Public pages load this on refresh.";
    }
    const data = await request("/admin/site-config", { method: "GET" });
    textarea.value = JSON.stringify(data, null, 2);
  }

  function wire() {
    if (!authListenerAttached) {
      authListenerAttached = true;
      window.addEventListener("ncc:admin-auth", function onAuth() {
        loadConfig().catch(function (err) {
          if (statusEl) {
            statusEl.textContent = err.message;
          }
        });
      });
    }

    if (loadBtn) {
      loadBtn.addEventListener("click", function () {
        loadConfig().catch(function (err) {
          if (statusEl) {
            statusEl.textContent = err.message;
          }
        });
      });
    }
    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        saveConfig().catch(function (err) {
          if (statusEl) {
            statusEl.textContent = err.message;
          }
        });
      });
    }
  }

  function main() {
    if (!textarea) {
      return;
    }
    wire();
    if (getToken()) {
      loadConfig().catch(function (err) {
        if (statusEl) {
          statusEl.textContent = err.message;
        }
      });
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
