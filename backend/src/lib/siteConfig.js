const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "..", "data");
const configFile = path.join(dataDir, "site-config.json");
const repoRoot = path.join(__dirname, "..", "..", "..");
const siteContentPath = path.join(repoRoot, "assets", "data", "site-content.json");
const homeFeaturedPath = path.join(repoRoot, "assets", "data", "home-featured-videos.json");

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

  let homeFeatured = { videos: [] };
  if (fs.existsSync(homeFeaturedPath)) {
    const parsed = readJsonSafe(homeFeaturedPath, null);
    if (parsed && Array.isArray(parsed.videos)) {
      homeFeatured = parsed;
    }
  }

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
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
        youtubeWatch: ph.youtube || "https://www.youtube.com/@NCCSUFFOLK",
        zoom: ph.zoom || "https://zoom.us/"
      }
    },
    videoSlots: {
      "livestream-main": {
        embedUrl: "https://www.youtube.com/embed/8cDsePBO5RM",
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
}

function ensureSiteConfigFile() {
  fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(configFile)) {
    fs.writeFileSync(configFile, JSON.stringify(buildInitialConfig(), null, 2), "utf8");
  }
}

function getSiteConfig() {
  ensureSiteConfigFile();
  return readJsonSafe(configFile, buildInitialConfig());
}

function saveSiteConfig(next) {
  fs.mkdirSync(dataDir, { recursive: true });
  const merged = {
    ...next,
    updatedAt: new Date().toISOString()
  };
  const tmpPath = configFile + ".tmp";
  fs.writeFileSync(tmpPath, JSON.stringify(merged, null, 2), "utf8");
  fs.renameSync(tmpPath, configFile);
  return merged;
}

module.exports = {
  getSiteConfig,
  saveSiteConfig,
  ensureSiteConfigFile: ensureSiteConfigFile,
  buildInitialConfig
};
