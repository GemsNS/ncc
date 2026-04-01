async function initLiveControlCenter() {
  const tickerNode = document.querySelector("[data-live-ticker]");
  const statusNode = document.querySelector("[data-live-status]");
  const overlayNode = document.querySelector("[data-runtime-overlay]");
  if (!tickerNode && !statusNode && !overlayNode) {
    return;
  }

  let liveConfig = {
    status: "offline",
    ticker: ["LiveControl: Offline"]
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
    const items = (liveConfig.ticker || []).concat([
      "ControlCenter: " + statusText
    ]);
    const row = items.map((item) => "<span>" + item + "</span>").join("");
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
