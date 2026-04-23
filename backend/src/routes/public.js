const express = require("express");
const { getSiteConfig } = require("../lib/siteConfig");

const router = express.Router();

router.get("/site-config", (req, res) => {
  try {
    return res.json(getSiteConfig());
  } catch (error) {
    return res.status(500).json({ error: "Site configuration unavailable" });
  }
});

module.exports = router;
