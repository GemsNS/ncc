function getValueByPath(obj, path) {
  return path.split(".").reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
}

function applyPlaceholderValue(el, value) {
  const prop = el.dataset.phProp || "text";
  if (value === undefined || value === null) {
    return;
  }
  if (prop === "text") {
    el.textContent = String(value);
  } else if (prop === "html") {
    el.innerHTML = String(value);
  } else if (prop === "href") {
    el.setAttribute("href", String(value));
  } else if (prop === "src") {
    el.setAttribute("src", String(value));
  } else if (prop === "value") {
    el.setAttribute("value", String(value));
  }
}

async function initPlaceholders() {
  await (window.__NCC_RUNTIME_LOADED || Promise.resolve()).catch(function () {
    return {};
  });
  if (typeof window.ensureNccSitePublicConfig === "function") {
    await window.ensureNccSitePublicConfig().catch(function () {
      return null;
    });
  }

  let data = {};
  try {
    const response = await fetch("./assets/data/site-content.json");
    data = await response.json();
  } catch (error) {
    return;
  }

  document.querySelectorAll("[data-ph]").forEach((el) => {
    const keyPath = el.dataset.ph;
    const value = getValueByPath(data.placeholders || {}, keyPath);
    applyPlaceholderValue(el, value);
  });

  if (typeof window.__NCC_APPLY_MANAGED_EMBEDS === "function") {
    window.__NCC_APPLY_MANAGED_EMBEDS();
  }
}

initPlaceholders();
