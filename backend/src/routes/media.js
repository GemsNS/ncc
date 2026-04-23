const crypto = require("crypto");
const path = require("path");
const express = require("express");
const multer = require("multer");
const { z } = require("zod");
const { getMedia, saveMedia } = require("../lib/db");
const { requireAuth, requireRole } = require("../middleware/auth");
const { addAuditLog } = require("../lib/audit");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "..", "uploads");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const safeName = file.originalname.replace(/\s+/g, "-").toLowerCase();
    cb(null, Date.now() + "-" + safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }
});

const patchSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  description: z.string().max(600).optional(),
  speaker: z.string().max(120).optional(),
  status: z.enum(["draft", "pending_review", "published", "archived"]).optional(),
  platformUrl: z.string().url().optional(),
  tags: z.array(z.string().min(1).max(40)).optional()
});

router.get("/", (req, res, next) => {
  const status = req.query.status;
  const includeAll = String(req.query.includeAll || "").toLowerCase() === "true";
  const media = getMedia();

  if (!includeAll) {
    const published = media.filter((item) => item.status === "published");
    if (status && typeof status === "string") {
      return res.json(published.filter((item) => item.status === status));
    }
    return res.json(published);
  }

  return requireAuth(req, res, function afterAuth(err) {
    if (err) return next(err);
    return requireRole("super_admin", "editor", "publisher")(req, res, function afterRole() {
      if (status && typeof status === "string") {
        return res.json(media.filter((item) => item.status === status));
      }
      return res.json(media);
    });
  });
});

router.post(
  "/upload",
  requireAuth,
  requireRole("super_admin", "editor", "publisher"),
  upload.single("file"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "File is required" });
    }

    const media = getMedia();
    const nextItem = {
      id: crypto.randomUUID(),
      title: req.body.title || req.file.originalname,
      description: req.body.description || "",
      speaker: req.body.speaker || "NCC Team",
      status: "draft",
      tags: req.body.tags ? String(req.body.tags).split(",").map((item) => item.trim()).filter(Boolean) : [],
      platformUrl: req.body.platformUrl || "",
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user.email
    };

    media.unshift(nextItem);
    saveMedia(media);

    addAuditLog({
      actor: req.user.email,
      action: "media.upload",
      targetId: nextItem.id,
      payload: {
        title: nextItem.title,
        fileName: nextItem.fileName
      }
    });

    return res.status(201).json(nextItem);
  }
);

router.patch("/:id", requireAuth, requireRole("super_admin", "editor", "publisher"), (req, res) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const media = getMedia();
  const index = media.findIndex((item) => item.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Media item not found" });
  }

  media[index] = {
    ...media[index],
    ...parsed.data,
    updatedAt: new Date().toISOString()
  };
  saveMedia(media);

  addAuditLog({
    actor: req.user.email,
    action: "media.update",
    targetId: req.params.id,
    payload: parsed.data
  });

  return res.json(media[index]);
});

router.post("/:id/publish", requireAuth, requireRole("super_admin", "publisher"), (req, res) => {
  const media = getMedia();
  const item = media.find((entry) => entry.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: "Media item not found" });
  }
  item.status = "published";
  item.updatedAt = new Date().toISOString();
  saveMedia(media);

  addAuditLog({
    actor: req.user.email,
    action: "media.publish",
    targetId: req.params.id,
    payload: {}
  });

  return res.json(item);
});

router.post("/:id/archive", requireAuth, requireRole("super_admin", "publisher"), (req, res) => {
  const media = getMedia();
  const item = media.find((entry) => entry.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: "Media item not found" });
  }
  item.status = "archived";
  item.updatedAt = new Date().toISOString();
  saveMedia(media);

  addAuditLog({
    actor: req.user.email,
    action: "media.archive",
    targetId: req.params.id,
    payload: {}
  });

  return res.json(item);
});

module.exports = router;
