/**
 * One-time helper: import assets/data/events.xml into backend/data/events.json as published.
 * Run from repo root: cd backend && npm run import-events-xml
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.join(__dirname, "..", "..");
const xmlCandidates = [
  path.join(repoRoot, "public_html", "assets", "data", "events.xml"),
  path.join(repoRoot, "assets", "data", "events.xml")
];
const xmlPath = xmlCandidates.find((p) => fs.existsSync(p)) || xmlCandidates[1];
const outPath = path.join(__dirname, "..", "data", "events.json");

function parseXmlEvents(xmlText) {
  const events = [];
  const re = /<event\b([^>]*)\/>/g;
  let match;
  while ((match = re.exec(xmlText))) {
    const attrs = match[1];
    function attr(name) {
      const m = attrs.match(new RegExp(name + '="([^"]*)"'));
      return m ? m[1] : "";
    }
    const start = attr("start");
    if (!start) continue;
    const end = attr("end");
    events.push({
      id: attr("id") || crypto.randomUUID(),
      title: attr("title") || "Church Event",
      category: attr("category") || "Church Event",
      location: attr("location") || "NCC Suffolk",
      description: attr("description") || "",
      startAt: start.length === 16 ? start + ":00" : start,
      endAt: end ? (end.length === 16 ? end + ":00" : end) : undefined,
      status: "published",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "import-events-xml"
    });
  }
  return events;
}

function main() {
  if (!fs.existsSync(xmlPath)) {
    process.stderr.write("Missing file: " + xmlPath + "\n");
    process.exit(1);
  }
  const xml = fs.readFileSync(xmlPath, "utf8");
  const imported = parseXmlEvents(xml);
  if (!imported.length) {
    process.stderr.write("No events found in XML.\n");
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  let existing = [];
  if (fs.existsSync(outPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(outPath, "utf8"));
    } catch (e) {
      existing = [];
    }
  }

  const byId = {};
  existing.forEach(function (evt) {
    if (evt && evt.id) byId[evt.id] = evt;
  });
  imported.forEach(function (evt) {
    byId[evt.id] = evt;
  });

  const merged = Object.keys(byId).map(function (id) {
    return byId[id];
  });
  const tmp = outPath + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(merged, null, 2), "utf8");
  fs.renameSync(tmp, outPath);
  process.stdout.write("Imported " + imported.length + " event(s) into " + outPath + " (total " + merged.length + ").\n");
}

main();
