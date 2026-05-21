(function initAdminSiteConfig() {
  const tokenKey = "ncc_admin_token";
  const modeKey = "ncc_admin_mode";
  const textarea = document.querySelector("[data-admin-site-config-text]");
  const statusEl = document.querySelector("[data-admin-site-config-status]");
  const loadBtn = document.querySelector("[data-admin-site-config-load]");
  const seedBtn = document.querySelector("[data-admin-site-config-seed]");
  const saveBtn = document.querySelector("[data-admin-site-config-save]");
  var authListenerAttached = false;
  const demoSiteKey = "ncc_demo_site_config";

  function apiRoot() {
    return String(window.NCC_API_BASE || "/api").replace(/\/$/, "");
  }

  function isAllowedUrl(value) {
    const v = String(value || "").trim();
    if (!v) {
      return true;
    }
    if (v.startsWith("./") && !/[\s<>]/.test(v)) {
      return true;
    }
    return v.startsWith("https://") || v.startsWith("http://");
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
        if (slot.embedUrl && !isAllowedUrl(slot.embedUrl)) {
          errors.push("videoSlots." + key + ".embedUrl must be http(s):// or ./ relative");
        }
      });
    }
    if (cfg.live && cfg.live.links && typeof cfg.live.links === "object") {
      Object.keys(cfg.live.links).forEach(function (key) {
        if (!isAllowedUrl(cfg.live.links[key])) {
          errors.push("live.links." + key + " must be a valid URL");
        }
      });
    }
    if (cfg.calendar && cfg.calendar.xmlUrl && !isAllowedUrl(cfg.calendar.xmlUrl)) {
      errors.push("calendar.xmlUrl must be a valid URL");
    }
    if (cfg.placeholders && cfg.placeholders.links) {
      Object.keys(cfg.placeholders.links).forEach(function (key) {
        if (!isAllowedUrl(cfg.placeholders.links[key])) {
          errors.push("placeholders.links." + key + " must be a valid URL");
        }
      });
    }
    if (Array.isArray(cfg.mediaArchive)) {
      cfg.mediaArchive.forEach(function (item, index) {
        if (item && item.url && !isAllowedUrl(item.url)) {
          errors.push("mediaArchive[" + index + "].url must be a valid URL");
        }
      });
    }
    if (cfg.homeFeaturedVideos && Array.isArray(cfg.homeFeaturedVideos.videos)) {
      cfg.homeFeaturedVideos.videos.forEach(function (item, index) {
        if (item && item.watchUrl && !isAllowedUrl(item.watchUrl)) {
          errors.push("homeFeaturedVideos.videos[" + index + "].watchUrl must be a valid URL");
        }
        if (item && item.src && !isAllowedUrl(item.src)) {
          errors.push("homeFeaturedVideos.videos[" + index + "].src must start with ./assets/");
        }
      });
    }
    return errors;
  }

  function getToken() {
    return localStorage.getItem(tokenKey);
  }

  function getMode() {
    return sessionStorage.getItem(modeKey) || "backend";
  }

  function demoGetConfig() {
    try {
      const raw = localStorage.getItem(demoSiteKey);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (err) {
      /* ignore */
    }
    return null;
  }

  function demoSaveConfig(value) {
    localStorage.setItem(demoSiteKey, JSON.stringify(value, null, 2));
  }

  async function buildDemoSeedFromRepoFiles() {
    const sc = await fetch("./assets/data/site-content.json", { cache: "no-store" }).then(function (r) {
      return r.ok ? r.json() : {};
    });
    const homeFeatured = await fetch("./assets/data/home-featured-videos.json", { cache: "no-store" })
      .then(function (r) {
        return r.ok ? r.json() : { videos: [] };
      })
      .catch(function () {
        return { videos: [] };
      });
    const live = sc.live || {};
    const ph = (sc.placeholders && sc.placeholders.links) || {};
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      church: sc.church || {},
      placeholders: sc.placeholders || {},
      socialFeeds: sc.socialFeeds || {},
      live: {
        statusSource: "manual",
        manualStatus: live.status || "offline",
        tickerItems: Array.isArray(live.tickerItems) ? live.tickerItems : [],
        serviceTimeline: { live: [], starting_soon: [], offline: [] },
        links: {
          youtubeWatch: ph.youtube || "https://www.youtube.com/@NCCSUFFOLK/streams",
          zoom: ph.zoom || "https://zoom.us/"
        }
      },
      videoSlots: {
        "livestream-main": {
          embedUrl: live.youtubeEmbedUrl || "https://www.youtube.com/embed/qmKZ6A8h0BE",
          title: "NCC live feed player",
          overlay: "auto"
        }
      },
      homeFeaturedVideos: homeFeatured,
      mediaArchive: Array.isArray(sc.mediaArchive) ? sc.mediaArchive : [],
      sermonNotes: Array.isArray(sc.sermonNotes) ? sc.sermonNotes : [],
      calendar: { xmlUrl: "./assets/data/events.xml" }
    };
  }

  async function request(path, options) {
    if (getMode() === "demo") {
      if (path === "/admin/site-config/seed") {
        return buildDemoSeedFromRepoFiles();
      }
      if (path === "/admin/site-config" && (!options || !options.method || options.method === "GET")) {
        const existing = demoGetConfig();
        if (existing) {
          return existing;
        }
        return buildDemoSeedFromRepoFiles();
      }
      if (path === "/admin/site-config" && options && String(options.method || "").toUpperCase() === "PUT") {
        const body = options.body ? JSON.parse(String(options.body)) : {};
        demoSaveConfig(body);
        return body;
      }
      throw new Error("Demo mode: unsupported action");
    }

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

  async function loadSeed() {
    if (!textarea) {
      return;
    }
    const data = await request("/admin/site-config/seed", { method: "GET" });
    textarea.value = JSON.stringify(data, null, 2);
    if (statusEl) {
      statusEl.textContent = "Loaded seed from repo files into the editor (not saved yet).";
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
      statusEl.textContent = "Saved. Public pages load this on refresh; static JSON fallbacks were synced.";
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
    if (seedBtn) {
      seedBtn.addEventListener("click", function () {
        if (!window.confirm("Replace the editor with seed data from repo files? Click Save to apply.")) {
          return;
        }
        loadSeed().catch(function (err) {
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
    if (getToken() || getMode() === "demo") {
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
