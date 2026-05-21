const fs = require("fs");
const https = require("https");
const path = require("path");

const inputPath = process.argv[2];
const outputPath = process.argv[3];
if (!inputPath || !outputPath) {
  console.error("Usage: node title-youtube-ids.js <input.json> <output.json>");
  process.exit(1);
}

function oembed(id) {
  return new Promise((resolve, reject) => {
    https
      .get(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`,
        (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () => {
            try {
              resolve(JSON.parse(data));
            } catch (error) {
              reject(error);
            }
          });
        }
      )
      .on("error", reject);
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
  const list = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const out = [];
  for (const item of list) {
    if (item.id === "brns_N2nDck") continue;
    try {
      const meta = await oembed(item.id);
      out.push({
        id: item.id,
        title: meta.title,
        author: meta.author_name
      });
    } catch (error) {
      out.push({ id: item.id, title: item.title || "", error: String(error.message || error) });
    }
    await sleep(150);
  }
  fs.writeFileSync(outputPath, JSON.stringify(out, null, 2), "utf8");
  console.error("wrote", out.length, "entries to", outputPath);
})();
