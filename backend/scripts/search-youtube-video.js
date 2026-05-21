const https = require("https");

const query = process.argv[2];
if (!query) {
  console.error("Usage: node search-youtube-video.js <query>");
  process.exit(1);
}

const url =
  "https://www.youtube.com/results?search_query=" + encodeURIComponent(query);

https
  .get(url, { headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "en-US,en;q=0.9" } }, (res) => {
    let html = "";
    res.on("data", (chunk) => {
      html += chunk;
    });
    res.on("end", () => {
      const ids = [...html.matchAll(/"videoId":"([A-Za-z0-9_-]{11})"/g)].map((m) => m[1]);
      const unique = [...new Set(ids)].filter((id) => id !== "brns_N2nDck");
      console.log(JSON.stringify({ query, ids: unique.slice(0, 8) }, null, 2));
    });
  })
  .on("error", (error) => {
    console.error(error);
    process.exit(1);
  });
