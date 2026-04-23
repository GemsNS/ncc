const express = require("express");
const { z } = require("zod");
const { getSiteConfig, saveSiteConfig } = require("../lib/siteConfig");
const { requireAuth, requireRole } = require("../middleware/auth");
const { addAuditLog } = require("../lib/audit");

const router = express.Router();

function isAllowedUrl(value) {
  const v = String(value || "").trim();
  if (!v || v.length > 2048) {
    return false;
  }
  if (v.startsWith("./") && !/[\s<>]/.test(v)) {
    return true;
  }
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch (error) {
    return false;
  }
}

const siteConfigBodySchema = z.record(z.string(), z.any());

function validateSiteUrls(body) {
  const errors = [];
  if (body.videoSlots && typeof body.videoSlots === "object") {
    Object.keys(body.videoSlots).forEach(function (key) {
      const slot = body.videoSlots[key];
      if (!slot || typeof slot !== "object") {
        return;
      }
      if (slot.embedUrl && !isAllowedUrl(slot.embedUrl)) {
        errors.push("Invalid videoSlots." + key + ".embedUrl");
      }
    });
  }
  if (body.live && body.live.links && typeof body.live.links === "object") {
    Object.keys(body.live.links).forEach(function (key) {
      if (!isAllowedUrl(body.live.links[key])) {
        errors.push("Invalid live.links." + key);
      }
    });
  }
  if (body.calendar && body.calendar.xmlUrl && !isAllowedUrl(body.calendar.xmlUrl)) {
    errors.push("Invalid calendar.xmlUrl");
  }
  return errors;
}

router.get("/", requireAuth, requireRole("super_admin", "editor", "publisher"), (req, res) => {
  return res.json(getSiteConfig());
});

function mergeSiteConfig(current, patch) {
  const next = {
    ...current,
    ...patch,
    live: {
      ...(current.live || {}),
      ...(patch.live || {}),
      links: {
        ...((current.live && current.live.links) || {}),
        ...((patch.live && patch.live.links) || {})
      },
      serviceTimeline: {
        ...((current.live && current.live.serviceTimeline) || {}),
        ...((patch.live && patch.live.serviceTimeline) || {})
      }
    },
    videoSlots: { ...(current.videoSlots || {}), ...(patch.videoSlots || {}) },
    calendar: { ...(current.calendar || {}), ...(patch.calendar || {}) }
  };
  if (patch.homeFeaturedVideos !== undefined) {
    next.homeFeaturedVideos = patch.homeFeaturedVideos;
  }
  if (patch.mediaArchive !== undefined) {
    next.mediaArchive = patch.mediaArchive;
  }
  if (patch.sermonNotes !== undefined) {
    next.sermonNotes = patch.sermonNotes;
  }
  return next;
}

router.put("/", requireAuth, requireRole("super_admin", "editor", "publisher"), (req, res) => {
  const current = getSiteConfig();
  const merged = mergeSiteConfig(current, req.body && typeof req.body === "object" ? req.body : {});
  const parsed = siteConfigBodySchema.safeParse(merged);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid site configuration JSON" });
  }

  const urlErrors = validateSiteUrls(parsed.data);
  if (urlErrors.length) {
    return res.status(400).json({ error: urlErrors.join("; ") });
  }

  const saved = saveSiteConfig(parsed.data);

  addAuditLog({
    actor: req.user.email,
    action: "site_config.replace",
    targetId: "site-config",
    payload: { version: saved.version }
  });

  return res.json(saved);
});

module.exports = router;
