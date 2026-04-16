function isSafeLocalMediaSrc(src) {
  if (typeof src !== "string") {
    return false;
  }
  const t = src.trim().replace(/\\/g, "/");
  if (t.indexOf("./assets/") !== 0) {
    return false;
  }
  if (/["'<>]/.test(t)) {
    return false;
  }
  return true;
}

function encodeMediaSrc(src) {
  return encodeURI(src.trim().replace(/\\/g, "/"));
}

function homeFeaturedVideoMime(src) {
  const lower = (src || "").toLowerCase();
  if (lower.endsWith(".webm")) {
    return "video/webm";
  }
  if (lower.endsWith(".mov") || lower.endsWith(".qt")) {
    return "video/quicktime";
  }
  return "video/mp4";
}

function isValidYoutubeFeaturedId(id) {
  if (typeof id !== "string") {
    return false;
  }
  return /^[a-zA-Z0-9_-]{11}$/.test(id.trim());
}

function isSafeYoutubeWatchUrl(url, expectedId) {
  if (typeof url !== "string") {
    return false;
  }
  const u = url.trim();
  if (u.indexOf("https://www.youtube.com/watch") !== 0 && u.indexOf("https://youtube.com/watch") !== 0) {
    return false;
  }
  if (/["'<>]/.test(u)) {
    return false;
  }
  return u.indexOf("v=" + expectedId) !== -1;
}

function escapeAttr(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function normalizeHomeFeaturedPayload(data) {
  const raw = Array.isArray(data) ? data : data && Array.isArray(data.videos) ? data.videos : [];
  const out = [];
  raw.forEach(function (entry) {
    if (!entry || typeof entry.title !== "string" || !entry.title.trim()) {
      return;
    }
    const title = entry.title.trim();
    const subtitle = typeof entry.subtitle === "string" ? entry.subtitle : "";
    if (typeof entry.youtubeId === "string" && isValidYoutubeFeaturedId(entry.youtubeId)) {
      const id = entry.youtubeId.trim();
      const watchUrl =
        typeof entry.watchUrl === "string" && isSafeYoutubeWatchUrl(entry.watchUrl, id)
          ? entry.watchUrl.trim()
          : "https://www.youtube.com/watch?v=" + id;
      out.push({ kind: "youtube", title: title, subtitle: subtitle, youtubeId: id, watchUrl: watchUrl });
      return;
    }
    if (typeof entry.src === "string" && isSafeLocalMediaSrc(entry.src)) {
      out.push({
        kind: "local",
        title: title,
        subtitle: subtitle,
        src: entry.src.trim(),
        poster: entry.poster
      });
    }
  });
  return out;
}

async function enrichYoutubeTitlesFromOembed(list) {
  const out = [];
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (!item || item.kind !== "youtube" || !item.watchUrl) {
      out.push(item);
      continue;
    }
    const clone = {
      kind: item.kind,
      title: item.title,
      subtitle: item.subtitle,
      youtubeId: item.youtubeId,
      watchUrl: item.watchUrl
    };
    try {
      const oUrl =
        "https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent(item.watchUrl);
      const res = await fetch(oUrl);
      if (res.ok) {
        const o = await res.json();
        if (o && typeof o.title === "string" && o.title.trim()) {
          clone.title = o.title.trim();
        }
        if (o && typeof o.author_name === "string" && o.author_name.trim()) {
          clone.subtitle = o.author_name.trim() + " · YouTube";
        }
      }
    } catch (e) {
      /* keep clone defaults */
    }
    out.push(clone);
  }
  return out;
}

async function readHomeFeaturedPayload() {
  let data = null;
  try {
    const res = await fetch("./assets/data/home-featured-videos.json", { cache: "no-store" });
    if (res.ok) {
      data = await res.json();
    }
  } catch (e) {
    data = null;
  }
  if (!data) {
    const inline = document.getElementById("ncc-home-featured-inline");
    if (inline && inline.textContent) {
      try {
        data = JSON.parse(inline.textContent.trim());
      } catch (e2) {
        data = null;
      }
    }
  }
  return data;
}

async function loadHomeFeaturedVideos() {
  const target = document.querySelector("[data-home-featured-carousel]");
  if (!target) {
    return;
  }

  try {
    const data = await readHomeFeaturedPayload();
    if (!data) {
      throw new Error("no home featured payload");
    }
    let list = normalizeHomeFeaturedPayload(data);
    if (!list.length) {
      target.innerHTML = '<p class="muted">Add entries to <code>assets/data/home-featured-videos.json</code> to feature clips here.</p>';
      return;
    }

    list = await enrichYoutubeTitlesFromOembed(list);

    target.innerHTML = list
      .map(function toVideoCard(item, index) {
        const badge =
          '<span class="home-featured-card__badge">Featured #' + (index + 1) + "</span>";
        const subtitleEscaped = item.subtitle ? escapeAttr(item.subtitle) : "";
        const titleEsc = escapeAttr(item.title);
        if (item.kind === "youtube") {
          const embedSrc = "https://www.youtube.com/embed/" + item.youtubeId;
          return (
            '<article class="home-featured-card">' +
            '<div class="home-featured-card__media">' +
            badge +
            '<iframe class="home-featured-card__embed" src="' +
            embedSrc +
            '" title="' +
            titleEsc +
            '" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>' +
            "</div>" +
            '<div class="home-featured-card__body">' +
            "<h3>" +
            item.title +
            "</h3>" +
            (subtitleEscaped ? '<p class="muted">' + subtitleEscaped + "</p>" : "") +
            '<p class="home-featured-card__actions">' +
            '<a class="button secondary" href="' +
            item.watchUrl +
            '" target="_blank" rel="noopener noreferrer">Open on YouTube</a>' +
            '<a class="button secondary" href="./gallery.html#feeds">Gallery feeds</a>' +
            "</p>" +
            "</div>" +
            "</article>"
          );
        }
        const srcAttr = encodeMediaSrc(item.src);
        const mime = homeFeaturedVideoMime(item.src);
        const poster =
          item.poster && isSafeLocalMediaSrc(item.poster) ? encodeMediaSrc(item.poster) : "./assets/newlogoset/001_A_logo_for_NCC_New_Community_Church_Suffolk_VA_6nZsPeAi.png";
        const subLocal = item.subtitle ? String(item.subtitle) : "Hosted on this site";
        return (
          '<article class="home-featured-card">' +
          '<div class="home-featured-card__media">' +
          badge +
          '<video class="home-featured-card__video" controls playsinline preload="metadata" poster="' +
          poster +
          '">' +
          '<source src="' +
          srcAttr +
          '" type="' +
          mime +
          '" />' +
          "</video>" +
          "</div>" +
          '<div class="home-featured-card__body">' +
          "<h3>" +
          item.title +
          "</h3>" +
          '<p class="muted">' +
          subLocal +
          "</p>" +
          '<p class="home-featured-card__actions">' +
          '<a class="button secondary" href="./gallery.html#feeds">Open gallery feeds</a>' +
          "</p>" +
          "</div>" +
          "</article>"
        );
      })
      .join("");
  } catch (err) {
    target.innerHTML =
      '<p class="muted">Featured list failed to load. Try a hard refresh. If you opened the site as a raw <code>file://</code> page, run <code>npx serve .</code> from the project folder, or keep the inline <code>#ncc-home-featured-inline</code> block in <code>index.html</code> in sync with <code>assets/data/home-featured-videos.json</code>.</p>';
  }
}

async function loadMediaCards() {
  const target = document.querySelector("[data-media-grid]");
  if (!target) {
    return;
  }

  try {
    const response = await fetch("./assets/data/site-content.json", { cache: "no-store" });
    const data = await response.json();
    const items = (data && data.mediaArchive) || [];

    const normalizedItems = items.map(function normalize(item) {
      return {
        title: item.title,
        date: item.date,
        speaker: item.speaker,
        platform: item.platform,
        url: item.url,
        thumbnail: item.thumbnail,
        tags: item.tags || [],
        series: item.series || "General",
        scripture: item.scripture || "N/A",
        duration: item.duration || "N/A",
        popularity: typeof item.popularity === "number" ? item.popularity : 0
      };
    });

    window.__NCC_MEDIA_ITEMS__ = normalizedItems;
    renderMediaCards(normalizedItems);
    initMediaFilters();
    initSermonNotes();
  } catch (error) {
    target.innerHTML = '<p class="muted">Media archive is being refreshed. Check back soon.</p>';
  }
}

function renderMediaCards(items) {
  const target = document.querySelector("[data-media-grid]");
  if (!target) {
    return;
  }

  target.innerHTML = items
    .map(function toCard(item) {
      return (
        '<article class="media-card">' +
        '<img src="' +
        item.thumbnail +
        '" alt="' +
        item.title +
        ' thumbnail" loading="lazy" onerror="this.onerror=null;this.src=\'./assets/newlogoset/crest%20no%20back.png\';">' +
        '<div class="content">' +
        '<span class="pill">' +
        item.date +
        "</span>" +
        "<h3>" +
        item.title +
        "</h3>" +
        "<p>" +
        item.speaker +
        " - " +
        item.platform +
        "</p>" +
        "<p>" +
        item.series +
        " | " +
        item.scripture +
        " | " +
        item.duration +
        "</p>" +
        "<p>Tags: " +
        (item.tags || []).join(", ") +
        "</p>" +
        '<a class="button secondary" href="' +
        item.url +
        '" target="_blank" rel="noopener noreferrer">Watch</a>' +
        "</div>" +
        "</article>"
      );
    })
    .join("");
}

function initMediaFilters() {
  const form = document.querySelector("[data-media-filter-form]");
  if (!form || !window.__NCC_MEDIA_ITEMS__) {
    return;
  }

  form.addEventListener("submit", function onFilter(event) {
    event.preventDefault();
    const data = new FormData(form);
    const tag = String(data.get("tag") || "").toLowerCase().trim();
    const speaker = String(data.get("speaker") || "").toLowerCase().trim();
    const text = String(data.get("search") || "").toLowerCase().trim();
    const filtered = window.__NCC_MEDIA_ITEMS__.filter(function matches(item) {
      const tags = (item.tags || []).map((entry) => entry.toLowerCase());
      const matchTag = !tag || tags.includes(tag);
      const matchSpeaker = !speaker || String(item.speaker || "").toLowerCase().includes(speaker);
      const matchText = !text || [item.title, item.series, item.scripture].join(" ").toLowerCase().includes(text);
      return matchTag && matchSpeaker && matchText;
    });
    renderMediaCards(filtered);
  });
}

async function initSermonNotes() {
  const notesList = document.querySelector("[data-sermon-notes]");
  if (!notesList) {
    return;
  }

  try {
    const response = await fetch("./assets/data/site-content.json");
    const data = await response.json();
    const notes = data.sermonNotes || [];
    notesList.innerHTML = notes
      .map((item) => "<li><strong>" + item.timestamp + "</strong> - " + item.point + "</li>")
      .join("");
  } catch (error) {
    notesList.innerHTML = "<li>Notes unavailable.</li>";
  }
}

loadHomeFeaturedVideos();
loadMediaCards();
