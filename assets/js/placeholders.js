const placeholderStateKey = "ncc_placeholder_labels_on";

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

function addFloatingLabel(el, keyPath) {
  if (el.querySelector(":scope > .ph-label")) {
    return;
  }
  const label = document.createElement("span");
  label.className = "ph-label";
  label.textContent = keyPath;
  if (getComputedStyle(el).position === "static") {
    el.style.position = "relative";
  }
  el.appendChild(label);
}

function syncLabelState(on) {
  document.body.classList.toggle("show-placeholder-labels", on);
}

function mountToggle() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ph-toggle button secondary";
  button.textContent = "Toggle Placeholder Labels";
  const initialState = localStorage.getItem(placeholderStateKey) === "1";
  syncLabelState(initialState);
  button.addEventListener("click", () => {
    const on = !document.body.classList.contains("show-placeholder-labels");
    syncLabelState(on);
    localStorage.setItem(placeholderStateKey, on ? "1" : "0");
  });
  document.body.appendChild(button);
}

async function initPlaceholders() {
  mountToggle();
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
    addFloatingLabel(el, keyPath);
  });
}

initPlaceholders();
