(function initSite() {
  const unlockKey = "ncc_site_unlocked";
  const lockRoute = "under-construction.html";
  const themeKey = "ncc_theme";
  function enforceSiteGate() {
    const currentPath = window.location.pathname || "";
    const isConstruction = currentPath.toLowerCase().endsWith("/" + lockRoute) || currentPath.toLowerCase().endsWith(lockRoute);
    const isUnlocked = localStorage.getItem(unlockKey) === "1";
    if (!isUnlocked && !isConstruction) {
      const next = window.location.pathname.split("/").pop() || "index.html";
      window.location.href = "./" + lockRoute + "?next=" + encodeURIComponent("./" + next);
    }
  }

  const navToggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-main-nav]");
  const headerContainer = document.querySelector(".site-header .container");
  const brandMarkSrc = "./assets/images/minilogo.png";
  const brandHeroSrc = "./assets/images/updated.png";

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }

  function setupThemeToggle() {
    // Light mode is intentionally disabled for now to keep a consistent,
    // presentation-ready visual baseline across all pages.
    applyTheme("dark");
    localStorage.setItem(themeKey, "dark");
  }

  function setupGlobalBrandAssets() {
    document.querySelectorAll(".brand").forEach(function (brandNode) {
      const brandImg = brandNode.querySelector("img");
      if (!brandImg) return;
      brandImg.src = brandMarkSrc;
      brandImg.alt = "New Community Church logo";
    });

    document.querySelectorAll("link[rel~='icon']").forEach(function (iconNode) {
      iconNode.setAttribute("href", brandMarkSrc);
      iconNode.setAttribute("type", "image/png");
    });

    const ogImage = document.querySelector("meta[property='og:image']");
    if (ogImage) {
      ogImage.setAttribute("content", brandHeroSrc);
    }

    document.querySelectorAll("img").forEach(function (img) {
      const src = img.getAttribute("src") || "";
      if (img.closest(".brand")) {
        return;
      }
      if (img.classList.contains("logo-panel-image")) {
        img.src = brandHeroSrc;
        return;
      }
      if (
        src.indexOf("logo-mark.svg") !== -1 ||
        src.indexOf("logo-wordmark.svg") !== -1 ||
        src.indexOf("churchlogo.svg") !== -1 ||
        src.indexOf("churchlogo.png") !== -1 ||
        src.indexOf("churchlogoblackbackground.svg") !== -1 ||
        src.indexOf("churchlogoblackbackground.png") !== -1
      ) {
        if (img.closest(".hub-section") || img.closest(".showcase-wrap")) {
          img.src = brandHeroSrc;
        } else {
          img.src = brandMarkSrc;
        }
      }
    });
  }

  function setupLockToggle() {
    if (!headerContainer) {
      return;
    }
    const currentPath = window.location.pathname || "";
    const isConstruction = currentPath.toLowerCase().endsWith("/" + lockRoute) || currentPath.toLowerCase().endsWith(lockRoute);
    if (isConstruction) {
      return;
    }

    const lockButton = document.createElement("button");
    lockButton.type = "button";
    lockButton.className = "lock-toggle";
    lockButton.setAttribute("aria-label", "Lock site again");
    lockButton.textContent = "Lock Site";
    lockButton.addEventListener("click", function onLockSite() {
      localStorage.removeItem(unlockKey);
      window.location.href = "./" + lockRoute;
    });

    headerContainer.insertBefore(lockButton, nav || navToggle || null);
  }

  function setupAdminTree() {
    if (!nav) {
      return;
    }

    const navList = nav.querySelector("ul");
    if (!navList || navList.querySelector(".nav-tree")) {
      return;
    }

    const adminAnchor = navList.querySelector('a[href$="admin.html"]');
    const colorsAnchor = navList.querySelector('a[href$="colors.html"]');

    const adminText = adminAnchor ? (adminAnchor.textContent || "Admin") : "Admin";
    const adminHref = adminAnchor ? (adminAnchor.getAttribute("href") || "./admin.html") : "./admin.html";
    const colorsText = colorsAnchor ? (colorsAnchor.textContent || "Colors") : "Colors";
    const colorsHref = colorsAnchor ? (colorsAnchor.getAttribute("href") || "./colors.html") : "./colors.html";

    const adminLi = adminAnchor ? adminAnchor.closest("li") : null;
    if (adminLi) adminLi.remove();
    const colorsLi = colorsAnchor ? colorsAnchor.closest("li") : null;
    if (colorsLi) colorsLi.remove();

    const wrapper = document.createElement("li");
    wrapper.className = "nav-tree";
    wrapper.innerHTML =
      '<details><summary>More</summary><div class="nav-tree-menu">' +
      '<a href="' + colorsHref + '">' + colorsText + "</a>" +
      '<a href="' + adminHref + '">' + adminText + "</a>" +
      "</div></details>";
    navList.appendChild(wrapper);
  }

  function setupGiveNavEnhancement() {
    if (!nav) {
      return;
    }
    const navList = nav.querySelector("ul");
    if (!navList) {
      return;
    }
    const giveAnchor = navList.querySelector('a[href$="give.html"]');
    if (!giveAnchor) {
      return;
    }

    giveAnchor.classList.add("nav-give-link");
    const giveLi = giveAnchor.closest("li");
    if (!giveLi) {
      return;
    }

    const listItems = Array.from(navList.children);
    const currentIndex = listItems.indexOf(giveLi);
    const targetIndex = 3;
    if (currentIndex !== targetIndex && targetIndex >= 0) {
      navList.removeChild(giveLi);
      const updatedItems = Array.from(navList.children);
      navList.insertBefore(giveLi, updatedItems[targetIndex] || null);
    }
  }

  function setupInspirationNavLink() {
    if (!nav) {
      return;
    }
    const navList = nav.querySelector("ul");
    if (!navList) {
      return;
    }

    function ensureLink(href, label) {
      const existing = navList.querySelector('a[href$="' + href + '"]');
      if (existing) {
        return;
      }
      const li = document.createElement("li");
      li.innerHTML = '<a href="./' + href + '">' + label + "</a>";
      const galleryLi = navList.querySelector('a[href$="gallery.html"]');
      if (galleryLi && galleryLi.closest("li")) {
        navList.insertBefore(li, galleryLi.closest("li"));
      } else {
        navList.appendChild(li);
      }
    }

    ensureLink("anthony-inspiration.html", "Inspiration");
    ensureLink("statement-of-faith.html", "Faith");
  }

  function setupInteractiveHero() {
    const card = document.querySelector("[data-interactive-hero]");
    if (!card) {
      return;
    }

    card.addEventListener("mousemove", function onMove(event) {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      const rotateY = x * 12;
      const rotateX = y * -10;
      card.style.transform = "perspective(900px) rotateX(" + rotateX + "deg) rotateY(" + rotateY + "deg)";
    });

    card.addEventListener("mouseleave", function onLeave() {
      card.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
    });
  }

  function setupCinematicHeader() {
    const panel = document.querySelector("[data-cinematic-header]");
    if (!panel) {
      return;
    }
    const glow = panel.querySelector(".inspiration-hero-glow");
    panel.addEventListener("mousemove", function onCinematicMove(event) {
      const rect = panel.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      panel.style.transform = "perspective(900px) rotateX(" + (y * -5) + "deg) rotateY(" + (x * 6) + "deg)";
      if (glow) {
        glow.style.transform = "translate(" + (x * 34) + "px," + (y * 22) + "px)";
      }
    });
    panel.addEventListener("mouseleave", function onCinematicLeave() {
      panel.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
      if (glow) {
        glow.style.transform = "translate(0px,0px)";
      }
    });
  }

  function setupAmbientBackground() {
    const currentPath = window.location.pathname || "";
    const isConstruction = currentPath.toLowerCase().endsWith("/" + lockRoute) || currentPath.toLowerCase().endsWith(lockRoute);
    if (isConstruction || document.querySelector(".site-ambient")) {
      return;
    }

    const ambient = document.createElement("div");
    ambient.className = "site-ambient";
    ambient.setAttribute("aria-hidden", "true");
    ambient.innerHTML =
      '<span class="ambient-blob a" data-ambient="a"></span>' +
      '<span class="ambient-blob b" data-ambient="b"></span>' +
      '<span class="ambient-blob c" data-ambient="c"></span>' +
      '<span class="ambient-grid"></span>' +
      '<span class="ambient-vignette"></span>';
    document.body.prepend(ambient);

    const blobA = ambient.querySelector('[data-ambient="a"]');
    const blobB = ambient.querySelector('[data-ambient="b"]');
    const blobC = ambient.querySelector('[data-ambient="c"]');

    window.addEventListener("mousemove", function onAmbientMove(event) {
      const x = event.clientX / window.innerWidth - 0.5;
      const y = event.clientY / window.innerHeight - 0.5;
      if (blobA) blobA.style.transform = "translate(" + (x * 36) + "px," + (y * 22) + "px)";
      if (blobB) blobB.style.transform = "translate(" + (x * -30) + "px," + (y * -26) + "px)";
      if (blobC) blobC.style.transform = "translate(" + (x * 18) + "px," + (y * -14) + "px)";
    });
  }

  function setupScrollProgress() {
    if (document.querySelector(".scroll-progress")) {
      return;
    }
    const bar = document.createElement("div");
    bar.className = "scroll-progress";
    document.body.appendChild(bar);

    function paintProgress() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      bar.style.width = Math.max(0, Math.min(100, pct)) + "%";
    }

    window.addEventListener("scroll", paintProgress, { passive: true });
    window.addEventListener("resize", paintProgress);
    paintProgress();
  }

  function setupRevealAnimations() {
    const revealables = document.querySelectorAll(".section, .card, .media-card, .hero-card, .story-chapter");
    if (!revealables.length) {
      return;
    }
    revealables.forEach(function (node, index) {
      node.classList.add("reveal");
      node.style.transitionDelay = Math.min(index * 40, 320) + "ms";
    });

    if (!("IntersectionObserver" in window)) {
      revealables.forEach(function (node) {
        node.classList.add("in-view");
      });
      return;
    }

    const io = new IntersectionObserver(
      function onReveal(entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.15 }
    );
    revealables.forEach(function (node) {
      io.observe(node);
    });
  }

  function setupQuickActions() {
    if (document.querySelector(".quick-actions")) {
      return;
    }

    const dock = document.createElement("aside");
    dock.className = "quick-actions";
    dock.innerHTML =
      '<button type="button" class="qa-trigger" data-qa-trigger aria-expanded="false" aria-label="Open quick actions">+</button>' +
      '<div class="qa-menu" data-qa-menu hidden>' +
      '<a class="qa-item" href="./messages.html" title="Messages">Watch</a>' +
      '<a class="qa-item" href="./give.html" title="Give">Give</a>' +
      '<button type="button" class="qa-item" data-qa-top title="Scroll to top">Top</button>' +
      '<button type="button" class="qa-item" data-qa-focus title="Focus mode">Focus</button>' +
      "</div>";
    document.body.appendChild(dock);

    const trigger = dock.querySelector("[data-qa-trigger]");
    const menu = dock.querySelector("[data-qa-menu]");
    const topBtn = dock.querySelector("[data-qa-top]");
    const focusBtn = dock.querySelector("[data-qa-focus]");

    if (trigger && menu) {
      trigger.addEventListener("click", function onToggleQa() {
        const isOpen = !menu.hidden;
        menu.hidden = isOpen;
        trigger.setAttribute("aria-expanded", String(!isOpen));
        trigger.textContent = isOpen ? "+" : "x";
      });
    }

    if (topBtn) {
      topBtn.addEventListener("click", function onTop() {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    if (focusBtn) {
      focusBtn.addEventListener("click", function onFocus() {
        document.body.classList.toggle("focus-mode");
      });
    }
  }

  function setupCommandPalette() {
    if (document.querySelector(".command-palette")) {
      return;
    }

    const navLinks = nav ? Array.from(nav.querySelectorAll("a")) : [];
    const links = navLinks.map(function (a) {
      return {
        href: a.getAttribute("href") || "./index.html",
        label: (a.textContent || "").trim() || "Page"
      };
    });
    links.push({ href: "./brand.html", label: "Brand Guide" });
    links.push({ href: "./colors.html", label: "Brand Hub" });

    const palette = document.createElement("div");
    palette.className = "command-palette";
    palette.setAttribute("hidden", "");
    palette.innerHTML =
      '<div class="command-shell">' +
      '<div class="command-head"><strong>Command Center</strong><span>Ctrl/Cmd + K</span></div>' +
      '<input class="command-input" data-command-input type="text" placeholder="Type a page name..." />' +
      '<div class="command-list" data-command-list></div>' +
      "</div>";
    document.body.appendChild(palette);

    const input = palette.querySelector("[data-command-input]");
    const list = palette.querySelector("[data-command-list]");

    function render(filterText) {
      if (!list) return;
      const query = (filterText || "").toLowerCase();
      const matching = links.filter(function (item) {
        return item.label.toLowerCase().indexOf(query) !== -1;
      });
      list.innerHTML = matching
        .map(function (item) {
          return '<a class="command-item" href="' + item.href + '">' + item.label + "</a>";
        })
        .join("");
    }

    function openPalette() {
      palette.removeAttribute("hidden");
      render("");
      if (input) {
        input.value = "";
        input.focus();
      }
    }

    function closePalette() {
      palette.setAttribute("hidden", "");
    }

    document.addEventListener("keydown", function onCommand(event) {
      const key = (event.key || "").toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === "k") {
        event.preventDefault();
        if (palette.hasAttribute("hidden")) {
          openPalette();
        } else {
          closePalette();
        }
      }
      if (key === "escape" && !palette.hasAttribute("hidden")) {
        closePalette();
      }
    });

    palette.addEventListener("click", function onBackdropClick(event) {
      if (event.target === palette) {
        closePalette();
      }
    });

    if (input) {
      input.addEventListener("input", function onSearch() {
        render(input.value);
      });
    }
  }

  function setupFaithWidget() {
    if (document.querySelector(".faith-widget")) {
      return;
    }
    const verses = [
      '"The joy of the Lord is your strength." - Nehemiah 8:10',
      '"Let all that you do be done in love." - 1 Corinthians 16:14',
      '"Be strong and courageous. Do not be afraid." - Joshua 1:9',
      '"Faith comes by hearing the word of Christ." - Romans 10:17'
    ];
    const dayIndex = new Date().getDate() % verses.length;
    const dateText = new Date().toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric"
    });

    const widget = document.createElement("aside");
    widget.className = "faith-widget";
    widget.innerHTML =
      "<strong>Today at NCC</strong>" +
      '<p class="muted">' + dateText + "</p>" +
      "<p>" + verses[dayIndex] + "</p>";
    document.body.appendChild(widget);
  }

  function setupPrayerChat() {
    if (document.querySelector(".prayer-chat-launcher")) {
      return;
    }

    const launcher = document.createElement("button");
    launcher.type = "button";
    launcher.className = "prayer-chat-launcher";
    launcher.textContent = "Prayer Chat";
    launcher.setAttribute("aria-label", "Open prayer chat");
    document.body.appendChild(launcher);

    const modal = document.createElement("div");
    modal.className = "prayer-chat-modal";
    modal.setAttribute("hidden", "");
    modal.innerHTML =
      '<div class="prayer-chat-shell">' +
      '<div class="prayer-chat-head">' +
      "<strong>Prayer Chat</strong>" +
      '<button type="button" data-prayer-close aria-label="Close prayer chat">x</button>' +
      "</div>" +
      '<p class="muted" data-prayer-status>Checking availability...</p>' +
      '<div class="prayer-chat-log" data-prayer-log></div>' +
      '<form class="prayer-chat-form" data-prayer-form>' +
      '<input data-prayer-input type="text" placeholder="Share your prayer request..." />' +
      '<button type="submit" class="button primary">Send</button>' +
      "</form>" +
      '<p class="muted" data-prayer-actions></p>' +
      "</div>";
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector("[data-prayer-close]");
    const statusNode = modal.querySelector("[data-prayer-status]");
    const logNode = modal.querySelector("[data-prayer-log]");
    const formNode = modal.querySelector("[data-prayer-form]");
    const inputNode = modal.querySelector("[data-prayer-input]");
    const actionNode = modal.querySelector("[data-prayer-actions]");

    const defaultUrl = "https://www.facebook.com/anthony.vandyke.3";
    let liveMode = false;
    let liveUrl = defaultUrl;

    function appendBubble(kind, text) {
      if (!logNode) return;
      const node = document.createElement("p");
      node.className = "prayer-bubble " + kind;
      node.textContent = text;
      logNode.appendChild(node);
      logNode.scrollTop = logNode.scrollHeight;
    }

    function helperReply(message) {
      const input = String(message || "").toLowerCase();
      if (input.indexOf("anxious") !== -1 || input.indexOf("fear") !== -1 || input.indexOf("worry") !== -1) {
        return "You are not alone. Take a deep breath. 'Cast all your anxiety on Him because He cares for you.' (1 Peter 5:7)";
      }
      if (input.indexOf("family") !== -1 || input.indexOf("marriage") !== -1 || input.indexOf("children") !== -1) {
        return "Praying for peace and unity in your home. Ask God for patience, wisdom, and healing conversations this week.";
      }
      if (input.indexOf("health") !== -1 || input.indexOf("sick") !== -1 || input.indexOf("pain") !== -1) {
        return "Praying for strength and healing over your body and mind. May you receive comfort and renewed hope today.";
      }
      if (input.indexOf("job") !== -1 || input.indexOf("money") !== -1 || input.indexOf("work") !== -1) {
        return "Praying for provision and open doors. May God guide your next step and give clarity in every decision.";
      }
      return "Thank you for sharing. I am praying with you now: Lord, bring peace, wisdom, and strength in this situation. Amen.";
    }

    function openModal() {
      modal.removeAttribute("hidden");
      if (inputNode && !liveMode) {
        inputNode.focus();
      }
    }

    function closeModal() {
      modal.setAttribute("hidden", "");
    }

    launcher.addEventListener("click", openModal);
    if (closeBtn) {
      closeBtn.addEventListener("click", closeModal);
    }
    modal.addEventListener("click", function onBackdrop(event) {
      if (event.target === modal) {
        closeModal();
      }
    });

    fetch("./assets/data/site-content.json")
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        const social = (data && data.socialFeeds) || {};
        const prayer = social.prayerChat || {};
        liveMode = String(prayer.status || "offline").toLowerCase() === "online";
        liveUrl = prayer.liveUrl || social.anthonyFacebook?.pageUrl || defaultUrl;

        if (liveMode) {
          if (statusNode) statusNode.textContent = "Pastor Anthony is online for live prayer chat.";
          if (actionNode) {
            actionNode.innerHTML = '<a class="button secondary" href="' + liveUrl + '" target="_blank" rel="noopener noreferrer">Open Live Prayer with Pastor Anthony</a>';
          }
          if (formNode) formNode.setAttribute("hidden", "");
          appendBubble("bot", "Live mode is active. Use the button below to connect directly with Pastor Anthony.");
        } else {
          if (statusNode) statusNode.textContent = "Pastor Anthony is offline. AI Prayer Helper is active.";
          if (actionNode) {
            actionNode.innerHTML = '<a class="button secondary" href="' + liveUrl + '" target="_blank" rel="noopener noreferrer">Leave a Message for Pastor Anthony</a>';
          }
          appendBubble("bot", "Pastor Anthony is offline right now. I am here to pray with you and encourage you.");
        }
      })
      .catch(function () {
        liveMode = false;
        if (statusNode) statusNode.textContent = "Live status unavailable. AI Prayer Helper is active.";
        if (actionNode) {
          actionNode.innerHTML = '<a class="button secondary" href="' + defaultUrl + '" target="_blank" rel="noopener noreferrer">Open Pastor Anthony Page</a>';
        }
        appendBubble("bot", "I can still pray with you here. Share your request any time.");
      });

    if (formNode) {
      formNode.addEventListener("submit", function onPrayerSubmit(event) {
        event.preventDefault();
        if (liveMode) {
          return;
        }
        const text = inputNode ? inputNode.value.trim() : "";
        if (!text) return;
        appendBubble("user", text);
        if (inputNode) inputNode.value = "";
        window.setTimeout(function () {
          appendBubble("bot", helperReply(text));
        }, 260);
      });
    }
  }

  function setupEmbedReliability() {
    const embeds = Array.from(document.querySelectorAll("iframe"));
    if (!embeds.length) {
      return;
    }

    embeds.forEach(function (frame) {
      if (frame.closest(".embed-shell")) {
        return;
      }

      const src = frame.getAttribute("src") || "";
      frame.setAttribute("data-embed-src-base", src);
      const wrapper = document.createElement("div");
      wrapper.className = "embed-shell";

      if (frame.classList.contains("video-frame")) {
        wrapper.classList.add("video");
      }
      if (frame.classList.contains("tall")) {
        wrapper.classList.add("tall");
      }
      if (frame.classList.contains("xl")) {
        wrapper.classList.add("xl");
      }

      const preferredMinHeight = frame.classList.contains("xl")
        ? "820px"
        : frame.classList.contains("tall")
        ? "620px"
        : frame.classList.contains("video-frame")
          ? "365px"
          : "340px";
      wrapper.style.minHeight = preferredMinHeight;

      const cover = document.createElement("div");
      cover.className = "embed-offline";
      cover.setAttribute("hidden", "");
      cover.innerHTML =
        '<div class="embed-offline-card">' +
        '<span class="embed-dot"></span>' +
        "<strong>Offline</strong>" +
        "<p>This media embed is currently unavailable.</p>" +
        '<button type="button" class="button secondary" data-embed-retry>Retry Connection</button>' +
        "</div>";

      frame.parentNode.insertBefore(wrapper, frame);
      wrapper.appendChild(frame);
      wrapper.appendChild(cover);

      const retryButton = cover.querySelector("[data-embed-retry]");
      let timeoutId = null;
      let loaded = false;

      function showOffline() {
        wrapper.classList.remove("is-online");
        wrapper.classList.add("is-offline");
        cover.removeAttribute("hidden");
      }

      function showOnline() {
        loaded = true;
        wrapper.classList.remove("is-offline");
        wrapper.classList.add("is-online");
        cover.setAttribute("hidden", "");
      }

      function startTimeout() {
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }
        timeoutId = window.setTimeout(function onEmbedTimeout() {
          if (!loaded) {
            showOffline();
          }
        }, 9000);
      }

      frame.addEventListener("load", function onFrameLoad() {
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }
        showOnline();
      });

      frame.addEventListener("error", function onFrameError() {
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }
        showOffline();
      });

      if (!src) {
        showOffline();
      } else {
        startTimeout();
      }

      if (retryButton) {
        retryButton.addEventListener("click", function onRetry() {
          loaded = false;
          showOffline();
          const originalSrc = frame.getAttribute("data-embed-src-base") || src;
          const bust = originalSrc.indexOf("?") === -1 ? "?" : "&";
          frame.setAttribute("src", originalSrc + bust + "retry=" + Date.now());
          startTimeout();
        });
      }
    });
  }

  function setupGlobalVideoHero() {
    const currentPath = window.location.pathname || "";
    const isConstruction = currentPath.toLowerCase().endsWith("/" + lockRoute) || currentPath.toLowerCase().endsWith(lockRoute);
    if (isConstruction || document.querySelector(".global-video-hero")) {
      return;
    }

    const main = document.querySelector("main");
    if (!main) {
      return;
    }

    let pageName = "";
    const currentNav = document.querySelector(".main-nav a[aria-current='page']");
    if (currentNav && currentNav.textContent) {
      pageName = currentNav.textContent.trim();
    }
    if (!pageName) {
      const firstH1 = document.querySelector("h1");
      if (firstH1 && firstH1.textContent) {
        pageName = firstH1.textContent.trim();
      }
    }
    if (!pageName) {
      pageName = (document.title || "New Community Church").split("|")[0].trim();
    }

    const hero = document.createElement("section");
    hero.className = "global-video-hero";
    hero.innerHTML =
      '<video class="global-video-hero__video" autoplay muted loop playsinline preload="metadata" poster="./assets/images/updated.png">' +
      '<source src="./assets/newhero.mp4" type="video/mp4" />' +
      '<source src="./assets/newhero.mov" type="video/quicktime" />' +
      "</video>" +
      '<div class="global-video-hero__overlay"></div>' +
      '<div class="container global-video-hero__content">' +
      '<p class="global-video-hero__kicker">New Community Church</p>' +
      '<p class="global-video-hero__title">' + pageName + "</p>" +
      '<p class="global-video-hero__sub">Suffolk, Virginia</p>' +
      "</div>";

    main.insertBefore(hero, main.firstChild);
  }

  if (navToggle && nav) {
    navToggle.addEventListener("click", function onToggle() {
      const isOpen = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  const yearNode = document.querySelector("[data-year]");
  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }

  enforceSiteGate();
  setupGlobalBrandAssets();
  setupAmbientBackground();
  setupThemeToggle();
  setupLockToggle();
  setupInspirationNavLink();
  setupGiveNavEnhancement();
  setupAdminTree();
  setupGlobalVideoHero();
  setupInteractiveHero();
  setupCinematicHeader();
  setupScrollProgress();
  setupRevealAnimations();
  setupQuickActions();
  setupCommandPalette();
  setupFaithWidget();
  setupPrayerChat();
  setupEmbedReliability();
})();
