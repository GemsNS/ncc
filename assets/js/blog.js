(function initBlog() {
  const mount = document.querySelector("[data-blog-posts]");
  if (!mount) return;

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function safeHref(url) {
    const v = String(url || "").trim();
    if (!v) return null;
    if (v.startsWith("https://") || v.startsWith("http://")) return v;
    if (v.startsWith("./") || v.startsWith("/")) return v;
    return null;
  }

  function markdownToHtml(md) {
    const src = String(md || "");
    const escaped = escapeHtml(src).replace(/\r\n/g, "\n");
    const lines = escaped.split("\n");
    let out = [];
    let inList = false;

    function closeList() {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
    }

    function inline(text) {
      let t = text;
      // links [text](url)
      t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (_, label, url) {
        const href = safeHref(url);
        if (!href) return label;
        return '<a href="' + href + '" target="_blank" rel="noopener noreferrer">' + label + "</a>";
      });
      // bold **text**
      t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      // italics *text*
      t = t.replace(/\*([^*]+)\*/g, "<em>$1</em>");
      // inline code `x`
      t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
      return t;
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (!trimmed) {
        closeList();
        continue;
      }
      if (trimmed.startsWith("### ")) {
        closeList();
        out.push("<h3>" + inline(trimmed.slice(4)) + "</h3>");
        continue;
      }
      if (trimmed.startsWith("## ")) {
        closeList();
        out.push("<h2>" + inline(trimmed.slice(3)) + "</h2>");
        continue;
      }
      if (trimmed.startsWith("# ")) {
        closeList();
        out.push("<h2>" + inline(trimmed.slice(2)) + "</h2>");
        continue;
      }
      if (trimmed.startsWith("- ")) {
        if (!inList) {
          out.push("<ul>");
          inList = true;
        }
        out.push("<li>" + inline(trimmed.slice(2)) + "</li>");
        continue;
      }
      closeList();
      out.push("<p>" + inline(trimmed) + "</p>");
    }
    closeList();
    return out.join("\n");
  }

  function formatDate(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  async function loadPosts() {
    await (window.__NCC_RUNTIME_LOADED || Promise.resolve()).catch(function () {
      return {};
    });

    const apiRoot = String(window.NCC_API_BASE || "").replace(/\/$/, "");
    if (apiRoot) {
      try {
        const res = await fetch(apiRoot + "/blog", { cache: "no-store" });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        /* fall through */
      }
    }

    // Demo fallback (GitHub Pages): localStorage
    try {
      const raw = localStorage.getItem("ncc_demo_blog_posts");
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          return list.filter((p) => p && p.status === "published");
        }
      }
    } catch (err) {
      /* ignore */
    }

    // Built-in demo post
    return [
      {
        id: "demo-word-of-god",
        title: "The Word of God: Stronger Than Our Feelings",
        slug: "word-of-god-stronger-than-our-feelings",
        author: "NCC Staff",
        status: "published",
        publishedAt: new Date().toISOString(),
        bodyMd:
          "## A steady anchor\\n\\nWhen life is loud, God's Word stays clear. Scripture doesn’t just *inform* us—it **forms** us.\\n\\n- Read it daily\\n- Pray it honestly\\n- Live it patiently\\n\\n> “Your word is a lamp to my feet and a light to my path.” (Psalm 119:105)\\n\\nAsk God today: *What is one verse You want me to carry into this week?*"
      }
    ];
  }

  function render(posts) {
    const list = Array.isArray(posts) ? posts : [];
    if (!list.length) {
      mount.innerHTML =
        '<article class="card"><h3>No posts yet</h3><p class="muted">Create a post in the staff admin.</p></article>';
      return;
    }
    mount.innerHTML = list
      .map(function (post) {
        const title = escapeHtml(post.title || "Untitled");
        const by = escapeHtml(post.author || "NCC Staff");
        const when = formatDate(post.publishedAt || post.createdAt);
        const body = markdownToHtml(post.bodyMd || post.body || "");
        return (
          '<article class="card blog-post">' +
          '<div class="blog-post__meta">' +
          '<span class="pill">' +
          (when || "Draft") +
          "</span>" +
          '<span class="pill">' +
          by +
          "</span>" +
          "</div>" +
          '<h2 class="blog-post__title">' +
          title +
          "</h2>" +
          '<div class="blog-post__body">' +
          body +
          "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  loadPosts()
    .then(render)
    .catch(function () {
      mount.innerHTML =
        '<article class="card"><h3>Blog unavailable</h3><p class="muted">Unable to load posts.</p></article>';
    });
})();

