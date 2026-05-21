const https = require("https");

https
  .get("https://www.youtube.com/@NCCSUFFOLK", { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
    let html = "";
    res.on("data", (c) => {
      html += c;
    });
    res.on("end", () => {
      const external = html.match(/"externalId":"(UC[A-Za-z0-9_-]+)"/);
      const browse = html.match(/"browseId":"(UC[A-Za-z0-9_-]+)"/);
      console.log({ externalId: external && external[1], browseId: browse && browse[1] });
    });
  });
