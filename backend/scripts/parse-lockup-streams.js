const fs = require("fs");
const https = require("https");

const url = process.argv[2] || "https://www.youtube.com/@NCCSUFFOLK/streams";
const outFile = process.argv[3] || "";

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

(async () => {
  const html = await getHtml(url);
  const reForward = /"content":"([^"]{4,120})"[\s\S]{0,8000}?"videoId":"([A-Za-z0-9_-]{11})"/g;
  const reReverse = /"videoId":"([A-Za-z0-9_-]{11})"[\s\S]{0,8000}?"content":"([^"]{4,120})"/g;
  const out = [];
  let match;
  while ((match = reForward.exec(html))) {
    out.push({ title: match[1], id: match[2] });
  }
  while ((match = reReverse.exec(html))) {
    out.push({ title: match[2], id: match[1] });
  }
  const seen = new Set();
  const unique = out.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return item.id !== "brns_N2nDck";
  });
  const payload = JSON.stringify(unique, null, 2);
  if (outFile) fs.writeFileSync(outFile, payload, "utf8");
  else console.log(payload);
  console.error("count", unique.length);
})();
