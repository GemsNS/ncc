const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "..", "data");
const configFile = path.join(dataDir, "site-config.json");
const repoRoot = path.join(__dirname, "..", "..", "..");
const siteContentPath = path.join(repoRoot, "assets", "data", "site-content.json");
const homeFeaturedPath = path.join(repoRoot, "assets", "data", "home-featured-videos.json");

/** YouTube IDs removed from livestream, archive, and featured slots. */
const EXCLUDED_YOUTUBE_VIDEO_IDS = ["8cDsePBO5RM"];
const DEFAULT_LIVESTREAM_EMBED = "https://www.youtube.com/embed/qmKZ6A8h0BE";

function youtubeIdFromUrl(url) {
  if (!url || typeof url !== "string") {
    return "";
  }
  const match = url.match(/(?:embed\/|watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : "";
}

function isExcludedYoutubeUrl(url) {
  const id = youtubeIdFromUrl(url);
  return id && EXCLUDED_YOUTUBE_VIDEO_IDS.includes(id);
}

function stripExcludedVideos(config) {
  if (!config || typeof config !== "object") {
    return { config, changed: false };
  }
  const next = { ...config };
  let changed = false;

  if (Array.isArray(next.mediaArchive)) {
    const filtered = next.mediaArchive.filter(function (item) {
      if (!item || typeof item !== "object") {
        return true;
      }
      return !isExcludedYoutubeUrl(item.url) && !isExcludedYoutubeUrl(item.thumbnail);
    });
    if (filtered.length !== next.mediaArchive.length) {
      next.mediaArchive = filtered;
      changed = true;
    }
  }

  if (next.homeFeaturedVideos && Array.isArray(next.homeFeaturedVideos.videos)) {
    const filteredVideos = next.homeFeaturedVideos.videos.filter(function (item) {
      if (!item || typeof item !== "object") {
        return true;
      }
      const id = typeof item.youtubeId === "string" ? item.youtubeId.trim() : "";
      if (id && EXCLUDED_YOUTUBE_VIDEO_IDS.includes(id)) {
        return false;
      }
      return !isExcludedYoutubeUrl(item.watchUrl);
    });
    if (filteredVideos.length !== next.homeFeaturedVideos.videos.length) {
      next.homeFeaturedVideos = { ...next.homeFeaturedVideos, videos: filteredVideos };
      changed = true;
    }
  }

  if (next.videoSlots && typeof next.videoSlots === "object") {
    const slots = { ...next.videoSlots };
    Object.keys(slots).forEach(function (slotId) {
      const slot = slots[slotId];
      if (!slot || !isExcludedYoutubeUrl(slot.embedUrl)) {
        return;
      }
      changed = true;
      if (slotId === "livestream-main") {
        slots[slotId] = { ...slot, embedUrl: DEFAULT_LIVESTREAM_EMBED };
      } else {
        delete slots[slotId];
      }
    });
    next.videoSlots = slots;
  }

  if (next.live && typeof next.live === "object" && isExcludedYoutubeUrl(next.live.youtubeEmbedUrl)) {
    next.live = { ...next.live, youtubeEmbedUrl: DEFAULT_LIVESTREAM_EMBED };
    changed = true;
  }

  return { config: next, changed };
}

function readJsonSafe(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    return fallback;
  }
}

function buildInitialConfig() {
  const sc = readJsonSafe(siteContentPath, {});
  const live = sc.live || {};
  const ph = (sc.placeholders && sc.placeholders.links) || {};
  const mainEmbed =
    (live.youtubeEmbedUrl && String(live.youtubeEmbedUrl)) || "https://www.youtube.com/embed/qmKZ6A8h0BE";

  let homeFeatured = { videos: [] };
  if (fs.existsSync(homeFeaturedPath)) {
    const parsed = readJsonSafe(homeFeaturedPath, null);
    if (parsed && Array.isArray(parsed.videos)) {
      homeFeatured = parsed;
    }
  }

  const initial = {
    version: 1,
    updatedAt: new Date().toISOString(),
    church: sc.church || {},
    placeholders: sc.placeholders || {},
    socialFeeds: sc.socialFeeds || {},
    live: {
      statusSource: "manual",
      manualStatus: live.status || "offline",
      tickerItems: Array.isArray(live.tickerItems) ? live.tickerItems : [],
      serviceTimeline: {
        live: [],
        starting_soon: [],
        offline: []
      },
      links: {
        youtubeWatch: ph.youtube || "https://www.youtube.com/@NCCSUFFOLK/streams",
        zoom: ph.zoom || "https://zoom.us/"
      }
    },
    videoSlots: {
      "livestream-main": {
        embedUrl: mainEmbed,
        title: "NCC live feed player",
        overlay: "auto",
        offlineTitle: "Offline",
        offlineMessage: "This media embed is currently unavailable."
      },
      "mens-ministry-feature": {
        embedUrl: "https://www.youtube.com/embed/KYDTq_mkKNo",
        title: "Men's Ministry teaching feature",
        overlay: "auto",
        offlineTitle: "Offline",
        offlineMessage: "This media embed is currently unavailable."
      },
      "legacy-archive-one": {
        embedUrl: "https://www.youtube.com/embed/UEz5sH39jGA",
        title: "Pastor featured video",
        overlay: "auto",
        offlineTitle: "Offline",
        offlineMessage: "This media embed is currently unavailable."
      },
      "legacy-archive-two": {
        embedUrl: "https://www.youtube.com/embed/NMytNDub_iI",
        title: "NCC YouTube featured video in legacy archive",
        overlay: "auto",
        offlineTitle: "Offline",
        offlineMessage: "This media embed is currently unavailable."
      },
      "anthony-hub-site": {
        embedUrl: "https://anthonyinspiration.com/",
        title: "Anthony Inspiration website feed",
        overlay: "auto",
        offlineTitle: "Offline",
        offlineMessage: "This media embed is currently unavailable."
      }
    },
    homeFeaturedVideos: homeFeatured,
    mediaArchive: Array.isArray(sc.mediaArchive) ? sc.mediaArchive : [],
    sermonNotes: Array.isArray(sc.sermonNotes) ? sc.sermonNotes : [],
    calendar: {
      xmlUrl: "./assets/data/events.xml"
    }
  };
  return stripExcludedVideos(initial).config;
}

function syncStaticFallbackFiles(config) {
  try {
    const sc = readJsonSafe(siteContentPath, {});
    if (config.church && typeof config.church === "object") {
      sc.church = config.church;
    }
    if (config.placeholders && typeof config.placeholders === "object") {
      sc.placeholders = config.placeholders;
    }
    if (config.socialFeeds && typeof config.socialFeeds === "object") {
      sc.socialFeeds = config.socialFeeds;
    }
    if (Array.isArray(config.mediaArchive)) {
      sc.mediaArchive = config.mediaArchive;
    }
    if (Array.isArray(config.sermonNotes)) {
      sc.sermonNotes = config.sermonNotes;
    }
    if (config.live && typeof config.live === "object") {
      sc.live = { ...(sc.live || {}), ...config.live };
      const mainSlot = config.videoSlots && config.videoSlots["livestream-main"];
      if (mainSlot && mainSlot.embedUrl) {
        sc.live.youtubeEmbedUrl = String(mainSlot.embedUrl);
      }
    }
    fs.writeFileSync(siteContentPath, JSON.stringify(sc, null, 2) + "\n", "utf8");

    if (config.homeFeaturedVideos && typeof config.homeFeaturedVideos === "object") {
      fs.writeFileSync(homeFeaturedPath, JSON.stringify(config.homeFeaturedVideos, null, 2) + "\n", "utf8");
    }
  } catch (error) {
    console.warn("[site-config] static fallback sync skipped:", error.message);
  }
}

function ensureSiteConfigFile() {
  fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(configFile)) {
    const initial = buildInitialConfig();
    fs.writeFileSync(configFile, JSON.stringify(initial, null, 2), "utf8");
    syncStaticFallbackFiles(initial);
  }
}

function mergeMissingConfigFields(config) {
  const seed = buildInitialConfig();
  let changed = false;
  const next = { ...config };

  ["church", "placeholders", "socialFeeds"].forEach(function (key) {
    if (!next[key] || typeof next[key] !== "object" || !Object.keys(next[key]).length) {
      next[key] = seed[key];
      changed = true;
    }
  });

  if (!next.live || typeof next.live !== "object") {
    next.live = seed.live;
    changed = true;
  } else {
    next.live = {
      ...seed.live,
      ...next.live,
      links: {
        ...(seed.live.links || {}),
        ...((next.live && next.live.links) || {})
      },
      serviceTimeline: {
        ...(seed.live.serviceTimeline || {}),
        ...((next.live && next.live.serviceTimeline) || {})
      }
    };
  }

  if (!next.videoSlots || typeof next.videoSlots !== "object") {
    next.videoSlots = seed.videoSlots;
    changed = true;
  } else {
    next.videoSlots = { ...seed.videoSlots, ...next.videoSlots };
  }

  if (!next.homeFeaturedVideos || !Array.isArray(next.homeFeaturedVideos.videos)) {
    next.homeFeaturedVideos = seed.homeFeaturedVideos;
    changed = true;
  }
  if (!Array.isArray(next.mediaArchive)) {
    next.mediaArchive = seed.mediaArchive;
    changed = true;
  }
  if (!Array.isArray(next.sermonNotes)) {
    next.sermonNotes = seed.sermonNotes;
    changed = true;
  }
  if (!next.calendar || !next.calendar.xmlUrl) {
    next.calendar = { ...(seed.calendar || {}), ...(next.calendar || {}) };
    changed = true;
  }

  return { config: next, changed };
}

function getSiteConfig() {
  ensureSiteConfigFile();
  const stored = readJsonSafe(configFile, null);
  if (!stored) {
    const initial = buildInitialConfig();
    saveSiteConfig(initial);
    return initial;
  }
  const merged = mergeMissingConfigFields(stored);
  const stripped = stripExcludedVideos(merged.changed ? merged.config : stored);
  if (merged.changed || stripped.changed) {
    return saveSiteConfig(stripped.config, { syncStatic: false });
  }
  return stored;
}

function saveSiteConfig(next, options) {
  fs.mkdirSync(dataDir, { recursive: true });
  const stripped = stripExcludedVideos(next);
  const merged = {
    ...stripped.config,
    updatedAt: new Date().toISOString()
  };
  const tmpPath = configFile + ".tmp";
  fs.writeFileSync(tmpPath, JSON.stringify(merged, null, 2), "utf8");
  fs.renameSync(tmpPath, configFile);
  const syncStatic = !options || options.syncStatic !== false;
  if (syncStatic) {
    syncStaticFallbackFiles(merged);
  }
  return merged;
}

module.exports = {
  getSiteConfig,
  saveSiteConfig,
  ensureSiteConfigFile,
  buildInitialConfig,
  syncStaticFallbackFiles,
  stripExcludedVideos,
  EXCLUDED_YOUTUBE_VIDEO_IDS
};
