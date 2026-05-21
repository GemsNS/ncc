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
      const idx = html.indexOf(titleNeedle);
      const slice = html.slice(idx, idx + 20000);
      const vi = [...slice.matchAll(/vi\/([A-Za-z0-9_-]{11})/g)].map((m) => m[1]);
      const contentId = [...slice.matchAll(/contentId":"([A-Za-z0-9_-]{11})"/g)].map((m) => m[1]);
      const id = [...slice.matchAll(/"id":"([A-Za-z0-9_-]{11})"/g)].map((m) => m[1]);
      console.log({ vi: [...new Set(vi)], contentId: [...new Set(contentId)], id: [...new Set(id)] });
    });
  });
