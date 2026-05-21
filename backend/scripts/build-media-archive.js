const https = require("https");

const streamsUrl = process.argv[2] || "https://www.youtube.com/@NCCSUFFOLK/streams";

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

function parseLockupStreams(html) {
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
  return out.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return item.id !== "brns_N2nDck";
  });
}

const durationHints = {
  "Healing is Holy|ZPY8LJS_Rm8": "25 min",
  "Healing is Holy|I9U8AbRqk0w": "preview",
  "Healing is Holy|YNlPhWMYwaU": "55 min",
  "BEFORE|iuKVTKLhPdg": "25 min",
  "BEFORE|RPzK7MMYe90": "22 min",
  "BEFORE|gZm7gf6hTTk": "32 min",
  "Are You Built to Carry the Weight|kmgQi6fmHms": "33 min",
  "Are You Built to Carry the Weight|nSvEOj09cMc": "33 min",
  "Are You Built to Carry the Weight|roL1U8SHW1I": "49 min",
  "The Good News of Christmas|w1d_JOWf7ZA": "36 min",
  "The Good News of Christmas|jyoDa4dZjhQ": "full service",
  "God Moves Beyond|U3izwaARLXI": "highlight",
  "The Good News of Christmas|8-vhRu-VZdg": "38 min",
  "The Good News of Christmas|mM0Xq2Er-98": "30 min",
  "The Good News of Christmas|gBG_7UUgUK0": "preview",
  "The Choice is Final|qv1A78pXf5Q": "37 min",
  "The Choice is Final|SJUG8oFtgTI": "preview"
};

function displayTitle(item) {
  const hint = durationHints[`${item.title}|${item.id}`];
  if (!hint || hint === "preview") {
    if (hint === "preview") return `${item.title} (preview)`;
    return item.title;
  }
  return `${item.title} (${hint})`;
}

(async () => {
  const html = await getHtml(streamsUrl);
  const streams = parseLockupStreams(html);
  const archive = streams
    .filter((item) => item.id !== "8cDsePBO5RM")
    .map((item, index) => ({
      title: displayTitle(item),
      date: `Stream ${index + 1}`,
      speaker: "Pastor Anthony VanDyke",
      platform: "YouTube",
      url: `https://www.youtube.com/watch?v=${item.id}`,
      thumbnail: `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
      series: "Sunday Livestream",
      scripture: "N/A",
      tags: ["stream", "sunday", "ncc"],
      duration: "Replay",
      popularity: 100 - index
    }));

  process.stdout.write(JSON.stringify(archive, null, 2));
})();
