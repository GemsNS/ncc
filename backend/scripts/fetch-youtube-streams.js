const fs = require("fs");
const path = require("path");
const https = require("https");

const url = process.argv[2] || "https://www.youtube.com/@NCCSUFFOLK/streams";
const outFile = process.argv[3] || "";

function getHtml(targetUrl) {
  return new Promise((resolve, reject) => {
    https
      .get(
        targetUrl,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9"
          }
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () => resolve(data));
        }
      )
      .on("error", reject);
  });
}

function collectVideoRenderers(obj, out) {
  if (!obj || typeof obj !== "object") return;
  if (obj.videoId && obj.title && (obj.title.runs || obj.title.simpleText)) {
    const title = obj.title.runs
      ? obj.title.runs.map((r) => r.text).join("")
      : obj.title.simpleText;
    out.push({
      id: obj.videoId,
      title,
      published: obj.publishedTimeText?.simpleText || "",
      length: obj.lengthText?.simpleText || ""
    });
  }
  if (Array.isArray(obj)) {
    obj.forEach((item) => collectVideoRenderers(item, out));
    return;
  }
  Object.values(obj).forEach((value) => collectVideoRenderers(value, out));
}

(async () => {
  const html = await getHtml(url);
  const match = html.match(/var ytInitialData = (\{.+?\});<\/script>/);
  const videos = [];
  if (match) {
    const data = JSON.parse(match[1]);
    collectVideoRenderers(data, videos);
  }
  if (!videos.length) {
    const idRe = /"videoId":"([A-Za-z0-9_-]{11})"/g;
    const titleRe = /"title":\{"runs":\[\{"text":"((?:\\.|[^"\\])*)"\}\]/g;
    const ids = [];
    let m;
    while ((m = idRe.exec(html))) ids.push(m[1]);
    const titles = [];
    while ((m = titleRe.exec(html))) titles.push(m[1].replace(/\\u0026/g, "&"));
    ids.forEach((id, i) => {
      videos.push({ id, title: titles[i] || "", published: "", length: "" });
    });
  }
  const seen = new Set();
  const unique = videos.filter((v) => {
    if (seen.has(v.id)) return false;
    seen.add(v.id);
    return true;
  });
  const payload = JSON.stringify(unique, null, 2);
  if (outFile) {
    fs.writeFileSync(path.resolve(outFile), payload, "utf8");
    console.error("wrote", unique.length, "entries to", outFile);
  } else {
    console.log(payload);
    console.error("count:", unique.length);
  }
})();
