const https = require("https");

const titleNeedle = process.argv[2] || "Can I Get a Witness";
const url = process.argv[3] || "https://www.youtube.com/@NCCSUFFOLK/streams";

https
  .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
    let html = "";
    res.on("data", (chunk) => {
      html += chunk;
    });
    res.on("end", () => {
      let pos = 0;
      const hits = [];
      while (true) {
        const idx = html.indexOf(titleNeedle, pos);
        if (idx < 0) break;
        const after = html.slice(idx, idx + 60000);
        const before = html.slice(Math.max(0, idx - 60000), idx);
        const afterId =
          [...after.matchAll(/"videoId":"([A-Za-z0-9_-]{11})"/g)]
            .map((m) => m[1])
            .find((id) => id !== "brns_N2nDck") || null;
        const beforeIds = [...before.matchAll(/"videoId":"([A-Za-z0-9_-]{11})"/g)]
          .map((m) => m[1])
          .filter((id) => id !== "brns_N2nDck");
        hits.push({
          index: idx,
          firstVideoIdAfter: afterId,
          lastVideoIdBefore: beforeIds[beforeIds.length - 1] || null
        });
        pos = idx + titleNeedle.length;
      }
      console.log(JSON.stringify({ title: titleNeedle, hits }, null, 2));
    });
  })
  .on("error", (error) => {
    console.error(error);
    process.exit(1);
  });
