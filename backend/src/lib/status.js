const fs = require("fs");
const path = require("path");
const os = require("os");
const { getSiteConfig } = require("./siteConfig");
const { getEvents, getBlogPosts, getPrayerInbox } = require("./db");

const SERVER_STARTED_AT = new Date().toISOString();
const pkg = require("../../package.json");

const dataDir = path.join(__dirname, "..", "..", "data");
const uploadsDir = path.join(__dirname, "..", "..", "uploads");
const staticEventsXml = path.join(__dirname, "..", "..", "..", "assets", "data", "events.xml");

function probe(name, id, fn) {
  const start = Date.now();
  try {
    const detail = fn();
    return {
      id,
      name,
      status: "operational",
      latencyMs: Date.now() - start,
      detail: detail || ""
    };
  } catch (error) {
    return {
      id,
      name,
      status: "outage",
      latencyMs: Date.now() - start,
      detail: error && error.message ? error.message : "Check failed"
    };
  }
}

function summarize(services) {
  if (services.some((item) => item.status === "outage")) {
    return "outage";
  }
  if (services.some((item) => item.status === "degraded")) {
    return "degraded";
  }
  return "operational";
}

function collectStatus() {
  const services = [
    probe("API process", "api", function () {
      return "Node " + process.version;
    }),
    probe("Site configuration", "site-config", function () {
      const config = getSiteConfig();
      if (!config || !config.church) {
        throw new Error("Invalid site configuration");
      }
      return config.church.name || "NCC";
    }),
    probe("Events calendar data", "events", function () {
      const events = getEvents();
      return String(events.length) + " events loaded";
    }),
    probe("Blog posts data", "blog", function () {
      const posts = getBlogPosts();
      return String(posts.length) + " posts in store";
    }),
    probe("Prayer inbox data", "prayer", function () {
      const inbox = getPrayerInbox();
      return String(inbox.length) + " messages in store";
    }),
    probe("Data directory", "data-store", function () {
      fs.accessSync(dataDir, fs.constants.R_OK | fs.constants.W_OK);
      return dataDir;
    }),
    probe("Uploads directory", "uploads", function () {
      fs.mkdirSync(uploadsDir, { recursive: true });
      fs.accessSync(uploadsDir, fs.constants.R_OK | fs.constants.W_OK);
      return "Writable";
    }),
    probe("Events XML fallback", "events-xml", function () {
      if (!fs.existsSync(staticEventsXml)) {
        throw new Error("events.xml missing");
      }
      const stat = fs.statSync(staticEventsXml);
      if (!stat.size) {
        throw new Error("events.xml is empty");
      }
      return Math.round(stat.size / 1024) + " KB";
    })
  ];

  return {
    status: summarize(services),
    checkedAt: new Date().toISOString(),
    startedAt: SERVER_STARTED_AT,
    uptimeSeconds: Math.floor(process.uptime()),
    hostname: os.hostname(),
    nodeVersion: process.version,
    environment: String(process.env.NODE_ENV || "production"),
    version: pkg.version || "1.0.0",
    service: pkg.name || "ncc-admin-backend",
    services
  };
}

module.exports = {
  SERVER_STARTED_AT,
  collectStatus
};
