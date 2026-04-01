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

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }

  function setupThemeToggle() {
    if (!headerContainer) {
      return;
    }

    const savedTheme = localStorage.getItem(themeKey) || "dark";
    applyTheme(savedTheme);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "theme-toggle";
    button.setAttribute("aria-label", "Toggle light and dark mode");
    button.textContent = savedTheme === "light" ? "Dark Mode" : "Light Mode";

    button.addEventListener("click", function onToggleTheme() {
      const current = document.documentElement.getAttribute("data-theme") || "dark";
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      localStorage.setItem(themeKey, next);
      button.textContent = next === "light" ? "Dark Mode" : "Light Mode";
    });

    headerContainer.insertBefore(button, nav || navToggle || null);
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
    if (!adminAnchor) {
      return;
    }

    const adminText = adminAnchor.textContent || "Admin";
    const adminHref = adminAnchor.getAttribute("href") || "./admin.html";
    const adminLi = adminAnchor.closest("li");
    if (adminLi) {
      adminLi.remove();
    }

    const wrapper = document.createElement("li");
    wrapper.className = "nav-tree";
    wrapper.innerHTML =
      '<details><summary>More</summary><div class="nav-tree-menu">' +
      '<a href="' + adminHref + '">' + adminText + "</a>" +
      "</div></details>";
    navList.appendChild(wrapper);
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
  setupThemeToggle();
  setupLockToggle();
  setupAdminTree();
  setupInteractiveHero();
})();
