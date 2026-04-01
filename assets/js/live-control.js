async function initLiveControlCenter() {
  const tickerNode = document.querySelector("[data-live-ticker]");
  const statusNode = document.querySelector("[data-live-status]");
  const overlayNode = document.querySelector("[data-runtime-overlay]");
  if (!tickerNode && !statusNode && !overlayNode) {
    return;
  }

  let liveConfig = {
    status: "offline",
    tickerItems: [
      { type: "status", label: "Service", value: "Offline" }
    ]
  };

  try {
    const response = await fetch("./assets/data/site-content.json");
    const data = await response.json();
    liveConfig = data.live || liveConfig;
  } catch (error) {
    // Keep fallback if fetch fails.
  }

  const hour = new Date().getHours();
  let dynamicStatus = liveConfig.status || "starting_soon";
  if (hour === 11 || hour === 19) {
    dynamicStatus = "live";
  } else if (hour === 10 || hour === 18) {
    dynamicStatus = "starting_soon";
  } else {
    dynamicStatus = "offline";
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
    const statusText = statusNode ? statusNode.textContent : dynamicStatus.toUpperCase();
    const configItems = Array.isArray(liveConfig.tickerItems) && liveConfig.tickerItems.length
      ? liveConfig.tickerItems
      : (liveConfig.ticker || []).map(function legacyToItem(entry) {
          const parts = String(entry).split(":");
          return {
            type: "announcement",
            label: parts[0] || "Update",
            value: parts.slice(1).join(":").trim() || "N/A"
          };
        });

    const items = configItems.concat([
      { type: "status", label: "Control Center", value: statusText }
    ]);

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
    const segments =
      dynamicStatus === "live"
        ? [
            "Now: Worship + Opening Prayer",
            "Next: Teaching Segment",
            "Then: Community Prayer + Invitation"
          ]
        : dynamicStatus === "starting_soon"
          ? [
              "Now: Countdown + Welcome Loop",
              "Next: Host Greeting",
              "Then: Worship Start"
            ]
          : [
              "Now: Off-Air Replay Loop",
              "Next: Next Service Countdown",
              "Then: Community Announcements"
            ];
    overlayNode.innerHTML = segments.map((segment) => "<li>" + segment + "</li>").join("");
  }
}

initLiveControlCenter();
