async function initLiveControlCenter() {
  const tickerNode = document.querySelector("[data-live-ticker]");
  const statusNode = document.querySelector("[data-live-status]");
  const overlayNode = document.querySelector("[data-runtime-overlay]");
  if (!tickerNode && !statusNode && !overlayNode) {
    return;
  }

  await (window.__NCC_RUNTIME_LOADED || Promise.resolve()).catch(function () {
    return {};
  });
  if (typeof window.ensureNccSitePublicConfig === "function") {
    await window.ensureNccSitePublicConfig().catch(function () {
      return null;
    });
  }

  let liveConfig = {
    status: "offline",
    statusSource: "schedule",
    manualStatus: "offline",
    tickerItems: [{ type: "status", label: "Service", value: "Offline" }],
    serviceTimeline: null
  };

  if (window.__NCC_SITE_CONFIG && window.__NCC_SITE_CONFIG.live) {
    liveConfig = { ...liveConfig, ...window.__NCC_SITE_CONFIG.live };
  } else {
    try {
      const response = await fetch("./assets/data/site-content.json");
      const data = await response.json();
      liveConfig = { ...liveConfig, ...(data.live || {}) };
    } catch (error) {
      /* keep fallback */
    }
  }

  let dynamicStatus = liveConfig.manualStatus || liveConfig.status || "offline";
  if (liveConfig.statusSource !== "manual") {
    const hour = new Date().getHours();
    if (hour === 11 || hour === 19) {
      dynamicStatus = "live";
    } else if (hour === 10 || hour === 18) {
      dynamicStatus = "starting_soon";
    } else {
      dynamicStatus = "offline";
    }
  }

  if (statusNode) {
    statusNode.textContent =
      dynamicStatus === "live"
        ? "LIVE NOW"
        : dynamicStatus === "starting_soon"
          ? "STARTING SOON"
          : "OFFLINE";
    statusNode.dataset.state = dynamicStatus;
  }

  if (tickerNode) {
    const statusText = statusNode ? statusNode.textContent : String(dynamicStatus || "").toUpperCase();
    const configItems =
      Array.isArray(liveConfig.tickerItems) && liveConfig.tickerItems.length
        ? liveConfig.tickerItems
        : (Array.isArray(liveConfig.ticker) ? liveConfig.ticker : []).map(function legacyToItem(entry) {
            const parts = String(entry).split(":");
            return {
              type: "announcement",
              label: parts[0] || "Update",
              value: parts.slice(1).join(":").trim() || "N/A"
            };
          });

    const items = configItems.concat([{ type: "status", label: "Control Center", value: statusText }]);

    const row = items
      .map(function renderItem(item) {
        return (
          '<span data-kind="' + (item.type || "announcement") + '">' +
          '<i class="k">' + (item.label || "Update") + "</i>" +
          '<i class="v">' + (item.value || "") + "</i>" +
          "</span>"
        );
      })
      .join("");
    tickerNode.innerHTML = row + row;
  }

  if (overlayNode) {
    const timelineCard = overlayNode.closest("[data-live-timeline]");
    const tl = liveConfig.serviceTimeline || {};
    const key =
      dynamicStatus === "live"
        ? "live"
        : dynamicStatus === "starting_soon"
          ? "starting_soon"
          : "offline";
    const segments = Array.isArray(tl[key]) ? tl[key].filter(Boolean) : [];

    if (!segments.length) {
      if (timelineCard) {
        timelineCard.hidden = true;
      }
      overlayNode.innerHTML = "";
      return;
    }

    if (timelineCard) {
      timelineCard.hidden = false;
    }
    overlayNode.innerHTML = segments
      .map(function (segment) {
        return "<li>" + segment + "</li>";
      })
      .join("");
  }
}

initLiveControlCenter();
