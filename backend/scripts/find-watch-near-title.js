const https = require("https");

const titleNeedle = process.argv[2] || "Can I Get a Witness";
const url = process.argv[3] || "https://www.youtube.com/@NCCSUFFOLK/streams";

https
  .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
    let html = "";
    res.on("data", (c) => {
      html += c;
    });
    res.on("end", () => {
      const idx = html.indexOf(titleNeedle);
      const slice = html.slice(Math.max(0, idx - 30000), idx + 30000);
      const watch = [...slice.matchAll(/watch\?v=([A-Za-z0-9_-]{11})/g)].map((m) => m[1]);
      const urls = [...slice.matchAll(/https:\/\/www\.youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})/g)].map((m) => m[1]);
      console.log({ watch: [...new Set(watch)], urls: [...new Set(urls)] });
    });
  });
