const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const siteContentPath = path.join(__dirname, "..", "..", "assets", "data", "site-content.json");
const buildScript = path.join(__dirname, "build-media-archive.js");

const site = JSON.parse(fs.readFileSync(siteContentPath, "utf8"));
const archiveJson = execFileSync(process.execPath, [buildScript], { encoding: "utf8" });
site.mediaArchive = JSON.parse(archiveJson);
site.live.youtubeEmbedUrl = "https://www.youtube.com/embed/qmKZ6A8h0BE";
site.placeholders.links.youtube = "https://www.youtube.com/@NCCSUFFOLK/streams";

fs.writeFileSync(siteContentPath, JSON.stringify(site, null, 2) + "\n", "utf8");
console.error("updated mediaArchive", site.mediaArchive.length, "items");
