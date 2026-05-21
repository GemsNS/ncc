const https = require("https");

const ids = process.argv.slice(2);
const authorNeedle = process.argv.includes("--author") ? process.argv[process.argv.indexOf("--author") + 1] : "NCCSUFFOLK";

function oembed(id) {
  return new Promise((resolve) => {
    https
      .get(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            resolve(null);
          }
        });
      })
      .on("error", () => resolve(null));
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
  for (const id of ids) {
    const meta = await oembed(id);
    if (meta && String(meta.author_name || "").includes(authorNeedle)) {
      console.log(`${id}|${meta.title}|${meta.author_name}`);
    }
    await sleep(400);
  }
})();
