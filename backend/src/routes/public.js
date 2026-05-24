const express = require("express");
const { getSiteConfig } = require("../lib/siteConfig");
const { collectStatus } = require("../lib/status");

const router = express.Router();

router.get("/site-config", (req, res) => {
  try {
    return res.json(getSiteConfig());
  } catch (error) {
    return res.status(500).json({ error: "Site configuration unavailable" });
  }
});

router.get("/status", (req, res) => {
  try {
    return res.json(collectStatus());
  } catch (error) {
    return res.status(500).json({
      status: "outage",
      checkedAt: new Date().toISOString(),
      error: "Status check failed",
      services: []
    });
  }
});

module.exports = router;
