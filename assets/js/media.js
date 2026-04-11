async function loadMediaCards() {
  const target = document.querySelector("[data-media-grid]");
  if (!target) {
    return;
  }

  try {
    let items = [];
    const apiBase = window.NCC_API_BASE || "http://localhost:4000/api";

    try {
      const apiResponse = await fetch(apiBase + "/media?status=published");
      if (apiResponse.ok) {
        const apiItems = await apiResponse.json();
        items = apiItems.map(function normalize(item) {
          return {
            title: item.title,
            date: new Date(item.updatedAt || item.createdAt).toLocaleDateString(),
            speaker: item.speaker || "NCC Team",
            platform: item.platformUrl ? "External" : "Local Upload",
            url: item.platformUrl || (apiBase.replace("/api", "") + "/uploads/" + item.fileName),
            thumbnail: "https://images.unsplash.com/photo-1519491050282-cf00c82424b4?auto=format&fit=crop&w=960&q=80",
            popularity: typeof item.popularity === "number" ? item.popularity : 0
          };
        });
      }
    } catch (error) {
      items = [];
    }

    if (!items.length) {
      const response = await fetch("./assets/data/site-content.json");
      const data = await response.json();
      items = data.mediaArchive || [];
    }

    const isDemoMode =
      window.location.search.indexOf("demo=1") !== -1 ||
      localStorage.getItem("ncc_demo_mode") === "1";

    if (isDemoMode) {
      const demoMedia = JSON.parse(localStorage.getItem("ncc_demo_media") || "[]")
        .filter(function onlyPublished(item) {
          return item.status === "published";
        })
        .map(function mapDemo(item) {
          return {
            title: item.title,
            date: new Date(item.updatedAt || item.createdAt).toLocaleDateString(),
            speaker: item.speaker || "NCC Team",
            platform: item.platformUrl ? "External" : "Demo",
            url: item.platformUrl || "https://www.youtube.com/",
            thumbnail: "https://images.unsplash.com/photo-1519491050282-cf00c82424b4?auto=format&fit=crop&w=960&q=80",
            popularity: typeof item.popularity === "number" ? item.popularity : 0
          };
        });

      if (demoMedia.length) {
        items = demoMedia.concat(items);
      }
    }

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
    renderHomeFeaturedCarousel(normalizedItems);
    renderMediaCards(normalizedItems);
    initMediaFilters();
    initSermonNotes();
  } catch (error) {
    target.innerHTML = '<p class="muted">Media archive is being refreshed. Check back soon.</p>';
  }
}

function renderHomeFeaturedCarousel(items) {
  const target = document.querySelector("[data-home-featured-carousel]");
  if (!target) {
    return;
  }
  const sorted = items.slice().sort(function sortByPopularity(a, b) {
    return (b.popularity || 0) - (a.popularity || 0);
  });
  const top = sorted.slice(0, 3);
  if (!top.length) {
    target.innerHTML = '<p class="muted">Featured messages will appear here soon.</p>';
    return;
  }
  target.innerHTML = top
    .map(function toFeaturedCard(item, index) {
      return (
        '<article class="home-featured-card">' +
        '<a class="home-featured-card__media" href="' +
        item.url +
        '" target="_blank" rel="noopener noreferrer">' +
        '<img src="' +
        item.thumbnail +
        '" alt="" loading="lazy" onerror="this.onerror=null;this.src=\'./assets/images/updated-removebg.png\';">' +
        '<span class="home-featured-card__badge">Popular #' +
        (index + 1) +
        "</span>" +
        "</a>" +
        '<div class="home-featured-card__body">' +
        "<h3>" +
        item.title +
        "</h3>" +
        "<p class=\"muted\">" +
        item.speaker +
        " · " +
        item.date +
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

function renderMediaCards(items) {
  const target = document.querySelector("[data-media-grid]");
  if (!target) {
    return;
  }

  target.innerHTML = items
      .map(function toCard(item) {
        return (
          '<article class="media-card">' +
          '<img src="' + item.thumbnail + '" alt="' + item.title + ' thumbnail" loading="lazy" onerror="this.onerror=null;this.src=\'./assets/images/updated-removebg.png\';">' +
          '<div class="content">' +
          '<span class="pill">' + item.date + "</span>" +
          "<h3>" + item.title + "</h3>" +
          "<p>" + item.speaker + " - " + item.platform + "</p>" +
          "<p>" + item.series + " | " + item.scripture + " | " + item.duration + "</p>" +
          "<p>Tags: " + (item.tags || []).join(", ") + "</p>" +
          '<a class="button secondary" href="' + item.url + '" target="_blank" rel="noopener noreferrer">Watch</a>' +
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

loadMediaCards();
