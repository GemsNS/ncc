(function initSite() {
  const navToggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-main-nav]");

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
})();
