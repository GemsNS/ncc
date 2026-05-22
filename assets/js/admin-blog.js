(function initAdminBlog() {
  const tokenKey = "ncc_admin_token";

  const shell = document.querySelector("[data-admin-blog-shell]");
  if (!shell) {
    return;
  }

  const form = document.querySelector("[data-admin-blog-form]");
  const rows = document.querySelector("[data-admin-blog-rows]");
  const count = document.querySelector("[data-admin-blog-count]");
  const statusEl = document.querySelector("[data-admin-blog-status]");

  function apiRoot() {
    return String(window.NCC_API_BASE || "/api").replace(/\/$/, "");
  }

  function getToken() {
    return localStorage.getItem(tokenKey);
  }

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function slugify(input) {
    return String(input || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 180);
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
    const res = await fetch(apiRoot() + path, { ...(options || {}), headers });
    if (!res.ok) {
      let msg = "Request failed";
      try {
        const body = await res.json();
        msg = body.error || msg;
      } catch (e) {
        msg = res.statusText || msg;
      }
      throw new Error(msg);
    }
    return res.json();
  }

  function formatDate(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function render(posts) {
    const list = Array.isArray(posts) ? posts : [];
    if (count) count.textContent = String(list.length) + " posts";
    if (!rows) return;
    if (!list.length) {
      rows.innerHTML = '<tr><td colspan="5" class="muted">No posts yet.</td></tr>';
      return;
    }
    rows.innerHTML = list
      .map(function (p) {
        return (
          "<tr>" +
          "<td>" +
          escapeHtml(p.title) +
          "</td>" +
          "<td>" +
          escapeHtml(p.slug) +
          "</td>" +
          "<td>" +
          escapeHtml(p.status || "draft") +
          "</td>" +
          "<td>" +
          escapeHtml(formatDate(p.publishedAt || p.createdAt)) +
          "</td>" +
          "<td>" +
          "<button class='button secondary' type='button' data-blog-edit='" +
          p.id +
          "'>Edit</button> " +
          "<button class='button secondary' type='button' data-blog-publish='" +
          p.id +
          "'>Publish</button> " +
          "<button class='button secondary' type='button' data-blog-archive='" +
          p.id +
          "'>Archive</button>" +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  async function refresh() {
    const posts = await request("/blog?includeAll=true", { method: "GET" });
    render(posts);
  }

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const data = new FormData(form);
      const title = String(data.get("title") || "").trim();
      const author = String(data.get("author") || "NCC Staff").trim();
      const bodyMd = String(data.get("bodyMd") || "").trim();
      const status = String(data.get("status") || "draft");
      const slug = slugify(title);
      if (!title || !bodyMd) {
        if (statusEl) statusEl.textContent = "Title and body are required.";
        return;
      }
      request("/blog", {
        method: "POST",
        body: JSON.stringify({ title, slug, author, bodyMd, status })
      })
        .then(function () {
          if (statusEl) statusEl.textContent = "Saved blog post.";
          form.reset();
          return refresh();
        })
        .catch(function (err) {
          if (statusEl) statusEl.textContent = err.message;
        });
    });
  }

  if (rows) {
    rows.addEventListener("click", function (event) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const editId = target.getAttribute("data-blog-edit");
      const publishId = target.getAttribute("data-blog-publish");
      const archiveId = target.getAttribute("data-blog-archive");
      (async function () {
        if (publishId) {
          await request("/blog/" + publishId, {
            method: "PATCH",
            body: JSON.stringify({ status: "published" })
          });
        }
        if (archiveId) {
          await request("/blog/" + archiveId, {
            method: "PATCH",
            body: JSON.stringify({ status: "archived" })
          });
        }
        if (editId) {
          const posts = await request("/blog?includeAll=true", { method: "GET" });
          const row = posts.find(function (p) {
            return p.id === editId;
          });
          if (!row) return;
          const nextTitle = window.prompt("Title:", row.title || "");
          if (nextTitle === null) return;
          const nextBody = window.prompt("Body (markdown):", row.bodyMd || "");
          if (nextBody === null) return;
          await request("/blog/" + editId, {
            method: "PATCH",
            body: JSON.stringify({ title: String(nextTitle).trim(), bodyMd: String(nextBody).trim() })
          });
        }
        await refresh();
      })().catch(function (err) {
        if (statusEl) statusEl.textContent = err.message;
      });
    });
  }

  window.addEventListener("ncc:admin-auth", function () {
    refresh().catch(function (err) {
      if (statusEl) statusEl.textContent = err.message;
    });
  });

  if (getToken()) {
    refresh().catch(function () {
      /* ignore */
    });
  }
})();
