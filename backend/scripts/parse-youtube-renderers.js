const fs = require("fs");
const https = require("https");

const url = process.argv[2] || "https://www.youtube.com/@NCCSUFFOLK/streams";
const outFile = process.argv[3];

function getHtml(targetUrl) {
  return new Promise((resolve, reject) => {
    https
      .get(targetUrl, { headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "en-US,en;q=0.9" } }, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

function collectRenderers(obj, out) {
  if (!obj || typeof obj !== "object") return;
  if (obj.videoRenderer && obj.videoRenderer.videoId) {
    const vr = obj.videoRenderer;
    const title = vr.title?.runs?.map((r) => r.text).join("") || vr.title?.simpleText || "";
    out.push({
      id: vr.videoId,
      title,
      published: vr.publishedTimeText?.simpleText || "",
      length: vr.lengthText?.simpleText || "",
      viewCount: vr.viewCountText?.simpleText || ""
    });
  }
  if (Array.isArray(obj)) {
    obj.forEach((item) => collectRenderers(item, out));
    return;
  }
  Object.values(obj).forEach((value) => collectRenderers(value, out));
}

(async () => {
  const html = await getHtml(url);
  const match = html.match(/var ytInitialData = (\{.+?\});<\/script>/);
  const renderers = [];
  if (match) collectRenderers(JSON.parse(match[1]), renderers);
  const seen = new Set();
  const unique = renderers.filter((v) => {
    if (!v.id || seen.has(v.id)) return false;
    seen.add(v.id);
    return v.id !== "brns_N2nDck";
  });
  const payload = JSON.stringify(unique, null, 2);
  if (outFile) fs.writeFileSync(outFile, payload, "utf8");
  else console.log(payload);
  console.error("count", unique.length);
})();
