const express = require("express");
const { getAuditLogs } = require("../lib/db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/audit", requireAuth, requireRole("super_admin", "publisher"), (req, res) => {
  return res.json(getAuditLogs());
});

module.exports = router;
