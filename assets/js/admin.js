const API_BASE = window.NCC_API_BASE || "/api";
const storageKey = "ncc_admin_token";
const modeKey = "ncc_admin_mode";
const demoMediaKey = "ncc_demo_media";
const demoAuditKey = "ncc_demo_audit";
const crmKey = "ncc_demo_crm";

const loginForm = document.querySelector("[data-login-form]");
const uploadForm = document.querySelector("[data-upload-form]");
const authStatus = document.querySelector("[data-auth-status]");
const mediaTableBody = document.querySelector("[data-media-body]");
const auditList = document.querySelector("[data-audit-list]");
const dashboard = document.querySelector("[data-dashboard]");
const demoLoginButton = document.querySelector("[data-demo-login]");
const demoResetButton = document.querySelector("[data-demo-reset]");
const modeBadge = document.querySelector("[data-mode-badge]");
const metricHealth = document.querySelector("[data-metric-health]");
const metricMedia = document.querySelector("[data-metric-media]");
const metricAudit = document.querySelector("[data-metric-audit]");
const crmForm = document.querySelector("[data-crm-form]");
const crmList = document.querySelector("[data-crm-list]");

function getToken() {
  return localStorage.getItem(storageKey);
}

function setToken(token) {
  localStorage.setItem(storageKey, token);
}

function clearToken() {
  localStorage.removeItem(storageKey);
}

function getMode() {
  return sessionStorage.getItem(modeKey) || "backend";
}

function setMode(mode) {
  sessionStorage.setItem(modeKey, mode);
  if (modeBadge) {
    modeBadge.textContent = mode === "demo" ? "Demo Mode (Browser Only)" : "Backend Mode";
  }
}

function ensureDemoData() {
  if (!localStorage.getItem(demoMediaKey)) {
    localStorage.setItem(
      demoMediaKey,
      JSON.stringify([
        {
          id: crypto.randomUUID(),
          title: "Demo Welcome Message",
          description: "Sample published message for demo mode.",
          speaker: "NCC Team",
          status: "published",
          platformUrl: "https://www.youtube.com/",
          fileName: "",
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }
      ])
    );
  }
  if (!localStorage.getItem(demoAuditKey)) {
    localStorage.setItem(demoAuditKey, JSON.stringify([]));
  }
}

function getDemoMedia() {
  ensureDemoData();
  return JSON.parse(localStorage.getItem(demoMediaKey) || "[]");
}

function saveDemoMedia(items) {
  localStorage.setItem(demoMediaKey, JSON.stringify(items));
}

function addDemoAudit(action, payload) {
  const logs = JSON.parse(localStorage.getItem(demoAuditKey) || "[]");
  logs.unshift({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    actor: "demo@ncc.local",
    action,
    payload
  });
  localStorage.setItem(demoAuditKey, JSON.stringify(logs.slice(0, 200)));
}

function getDemoAudit() {
  return JSON.parse(localStorage.getItem(demoAuditKey) || "[]");
}

function getCrm() {
  return JSON.parse(localStorage.getItem(crmKey) || "[]");
}

function saveCrm(items) {
  localStorage.setItem(crmKey, JSON.stringify(items));
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.headers || {})
  };
  if (token) {
    headers.Authorization = "Bearer " + token;
  }
  const response = await fetch(API_BASE + path, {
    ...options,
    headers
  });
  if (!response.ok) {
    let msg = "Request failed";
    try {
      const payload = await response.json();
      msg = payload.error || msg;
    } catch (error) {
      msg = response.statusText || msg;
    }
    throw new Error(msg);
  }
  return response.json();
}

function renderMedia(items) {
  metricMedia.textContent = String(items.length);
  mediaTableBody.innerHTML = items
    .map((item) => {
      const reviewButton =
        item.status === "draft"
          ? "<button class='button secondary' data-review-id='" + item.id + "'>Submit Review</button> "
          : "";
      const publishButton =
        item.status === "pending_review" || item.status === "draft"
          ? "<button class='button secondary' data-publish-id='" + item.id + "'>Approve Publish</button> "
          : "";
      return (
        "<tr>" +
        "<td>" + item.title + "</td>" +
        "<td><span class='status-chip'>" + item.status + "</span></td>" +
        "<td>" + (item.speaker || "NCC Team") + "</td>" +
        "<td>" +
        reviewButton +
        publishButton +
        "<button class='button secondary' data-archive-id='" + item.id + "'>Archive</button>" +
        "</td>" +
        "</tr>"
      );
    })
    .join("");
}

function renderAudit(logs) {
  metricAudit.textContent = String(logs.length);
  auditList.innerHTML = logs
    .slice(0, 10)
    .map((log) => "<li>" + log.createdAt + " - " + log.actor + " - " + log.action + "</li>")
    .join("");
}

function renderCrm() {
  if (!crmList) {
    return;
  }
  const items = getCrm();
  crmList.innerHTML = items
    .slice(0, 12)
    .map((item) => "<li>" + item.name + " - " + item.interest + " - " + item.status + "</li>")
    .join("");
}

async function refreshHealth() {
  if (!metricHealth) {
    return;
  }
  if (getMode() === "demo") {
    metricHealth.textContent = "Demo";
    return;
  }
  try {
    const response = await fetch(API_BASE + "/health");
    metricHealth.textContent = response.ok ? "Healthy" : "Issue";
  } catch (error) {
    metricHealth.textContent = "Offline";
  }
}

async function refreshDashboard() {
  try {
    if (getMode() === "demo") {
      renderMedia(getDemoMedia());
      renderAudit(getDemoAudit());
      renderCrm();
      refreshHealth();
      return;
    }

    const [media, audit] = await Promise.all([request("/media"), request("/admin/audit")]);
    renderMedia(media);
    renderAudit(audit);
    renderCrm();
    refreshHealth();
  } catch (error) {
    authStatus.textContent = error.message;
  }
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    try {
      if (getMode() === "demo") {
        const email = String(formData.get("email") || "demo@ncc.local");
        setToken("demo-token");
        authStatus.textContent = "Authenticated as " + email + " (demo)";
        dashboard.hidden = false;
        await refreshDashboard();
      } else {
        const payload = await request("/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: String(formData.get("email") || ""),
            password: String(formData.get("password") || "")
          })
        });
        setToken(payload.token);
        authStatus.textContent = "Authenticated as " + payload.user.email;
        dashboard.hidden = false;
        await refreshDashboard();
      }
    } catch (error) {
      authStatus.textContent = error.message;
    }
  });
}

if (uploadForm) {
  uploadForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(uploadForm);
    try {
      if (getMode() === "demo") {
        const media = getDemoMedia();
        const title = String(formData.get("title") || "Untitled");
        const speaker = String(formData.get("speaker") || "NCC Team");
        const description = String(formData.get("description") || "");
        const platformUrl = String(formData.get("platformUrl") || "https://www.youtube.com/");
        media.unshift({
          id: crypto.randomUUID(),
          title,
          description,
          speaker,
          status: "draft",
          platformUrl,
          fileName: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        saveDemoMedia(media);
        addDemoAudit("media.upload", { title, speaker });
      } else {
        await request("/media/upload", {
          method: "POST",
          body: formData
        });
      }
      uploadForm.reset();
      await refreshDashboard();
    } catch (error) {
      authStatus.textContent = error.message;
    }
  });
}

if (mediaTableBody) {
  mediaTableBody.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const publishId = target.getAttribute("data-publish-id");
    const reviewId = target.getAttribute("data-review-id");
    const archiveId = target.getAttribute("data-archive-id");

    try {
      if (reviewId) {
        if (getMode() === "demo") {
          const media = getDemoMedia();
          const item = media.find((entry) => entry.id === reviewId);
          if (item) {
            item.status = "pending_review";
            item.updatedAt = new Date().toISOString();
            saveDemoMedia(media);
            addDemoAudit("media.review_submit", { id: reviewId });
          }
        } else {
          await request("/media/" + reviewId, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "pending_review" })
          });
        }
      }
      if (publishId) {
        if (getMode() === "demo") {
          const media = getDemoMedia();
          const item = media.find((entry) => entry.id === publishId);
          if (item) {
            item.status = "published";
            item.updatedAt = new Date().toISOString();
            saveDemoMedia(media);
            addDemoAudit("media.publish", { id: publishId });
          }
        } else {
          await request("/media/" + publishId + "/publish", { method: "POST" });
        }
      }
      if (archiveId) {
        if (getMode() === "demo") {
          const media = getDemoMedia();
          const item = media.find((entry) => entry.id === archiveId);
          if (item) {
            item.status = "archived";
            item.updatedAt = new Date().toISOString();
            saveDemoMedia(media);
            addDemoAudit("media.archive", { id: archiveId });
          }
        } else {
          await request("/media/" + archiveId + "/archive", { method: "POST" });
        }
      }
      await refreshDashboard();
    } catch (error) {
      authStatus.textContent = error.message;
    }
  });
}

if (demoLoginButton) {
  demoLoginButton.addEventListener("click", async () => {
    setMode("demo");
    setToken("demo-token");
    ensureDemoData();
    authStatus.textContent = "Authenticated as demo@ncc.local (demo)";
    dashboard.hidden = false;
    await refreshDashboard();
  });
}

if (demoResetButton) {
  demoResetButton.addEventListener("click", async () => {
    localStorage.removeItem(demoMediaKey);
    localStorage.removeItem(demoAuditKey);
    localStorage.removeItem(crmKey);
    ensureDemoData();
    setMode("demo");
    setToken("demo-token");
    authStatus.textContent = "Demo data reset complete.";
    dashboard.hidden = false;
    await refreshDashboard();
  });
}

if (crmForm) {
  crmForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(crmForm);
    const items = getCrm();
    items.unshift({
      id: crypto.randomUUID(),
      name: String(data.get("name") || ""),
      email: String(data.get("email") || ""),
      interest: String(data.get("interest") || "First-Time Visitor"),
      status: "Pending Follow-Up",
      createdAt: new Date().toISOString()
    });
    saveCrm(items);
    crmForm.reset();
    renderCrm();
  });
}

const token = getToken();
if (token && dashboard) {
  dashboard.hidden = false;
  if (getMode() === "demo") {
    setMode("demo");
    authStatus.textContent = "Authenticated as demo@ncc.local (demo)";
    refreshDashboard();
  } else {
    setMode("backend");
    request("/auth/me")
      .then((payload) => {
        authStatus.textContent = "Authenticated as " + payload.user.email;
        return refreshDashboard();
      })
      .catch(() => {
        clearToken();
        dashboard.hidden = true;
        authStatus.textContent = "Please login.";
      });
  }
} else {
  setMode("backend");
}
