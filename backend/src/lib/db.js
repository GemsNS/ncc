const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "..", "data");

const files = {
  users: path.join(dataDir, "users.json"),
  media: path.join(dataDir, "media.json"),
  audit: path.join(dataDir, "audit.json"),
  events: path.join(dataDir, "events.json"),
  prayerInbox: path.join(dataDir, "prayer-inbox.json")
};

function ensureDir() {
  fs.mkdirSync(dataDir, { recursive: true });
}

function ensureFile(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), "utf8");
  }
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    return fallback;
  }
}

function writeJson(filePath, value) {
  const tmpPath = filePath + ".tmp";
  fs.writeFileSync(tmpPath, JSON.stringify(value, null, 2), "utf8");
  fs.renameSync(tmpPath, filePath);
}

function initDataStore(defaultAdmin) {
  ensureDir();
  ensureFile(files.users, [defaultAdmin]);
  ensureFile(files.media, []);
  ensureFile(files.audit, []);
  ensureFile(files.events, []);
  ensureFile(files.prayerInbox, []);
}

function getUsers() {
  return readJson(files.users, []);
}

function saveUsers(users) {
  writeJson(files.users, users);
}

function getMedia() {
  return readJson(files.media, []);
}

function saveMedia(media) {
  writeJson(files.media, media);
}

function getAuditLogs() {
  return readJson(files.audit, []);
}

function saveAuditLogs(logs) {
  writeJson(files.audit, logs);
}

function getEvents() {
  return readJson(files.events, []);
}

function saveEvents(events) {
  writeJson(files.events, events);
}

function getPrayerInbox() {
  return readJson(files.prayerInbox, []);
}

function savePrayerInbox(items) {
  writeJson(files.prayerInbox, items);
}

module.exports = {
  initDataStore,
  getUsers,
  saveUsers,
  getMedia,
  saveMedia,
  getAuditLogs,
  saveAuditLogs,
  getEvents,
  saveEvents,
  getPrayerInbox,
  savePrayerInbox
};
