const fs = require("fs");
const https = require("https");

const lockupPath = process.argv[2];
const url = process.argv[3] || "https://www.youtube.com/@NCCSUFFOLK/streams";

function getHtml(targetUrl) {
  return new Promise((resolve, reject) => {
    https
      .get(targetUrl, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
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
  const lockup = JSON.parse(fs.readFileSync(lockupPath, "utf8"));
  const lockupIds = new Set(lockup.map((x) => x.id));
  const html = await getHtml(url);
  const all = [...html.matchAll(/"videoId":"([A-Za-z0-9_-]{11})"/g)].map((m) => m[1]);
  const unique = [...new Set(all)].filter((id) => id !== "brns_N2nDck");
  const extra = unique.filter((id) => !lockupIds.has(id));
  console.log(JSON.stringify({ totalUnique: unique.length, lockupCount: lockup.length, extra }, null, 2));
})();
