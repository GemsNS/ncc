const crypto = require("crypto");
const express = require("express");
const { z } = require("zod");
const { requireAuth, requireRole } = require("../middleware/auth");
const { addAuditLog } = require("../lib/audit");
const { getBlogPosts, saveBlogPosts } = require("../lib/db");

const router = express.Router();

const createSchema = z.object({
  title: z.string().min(3).max(160),
  slug: z.string().min(3).max(180),
  author: z.string().min(2).max(120).optional(),
  bodyMd: z.string().min(10).max(20000),
  status: z.enum(["draft", "published", "archived"]).default("draft")
});

const patchSchema = createSchema.partial();

router.get("/", (req, res, next) => {
  const includeAll = String(req.query.includeAll || "").toLowerCase() === "true";
  const posts = getBlogPosts().slice();
  if (!includeAll) {
    return res.json(posts.filter((p) => p.status === "published"));
  }
  return requireAuth(req, res, function afterAuth(err) {
    if (err) return next(err);
    return requireRole("super_admin", "editor", "publisher")(req, res, function afterRole() {
      return res.json(posts);
    });
  });
});

router.post("/", requireAuth, requireRole("super_admin", "editor", "publisher"), (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid blog post payload" });
  }
  const posts = getBlogPosts();
  const next = {
    id: crypto.randomUUID(),
    title: parsed.data.title,
    slug: parsed.data.slug,
    author: parsed.data.author || "NCC Staff",
    bodyMd: parsed.data.bodyMd,
    status: parsed.data.status || "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: parsed.data.status === "published" ? new Date().toISOString() : "",
    createdBy: req.user.email
  };
  posts.unshift(next);
  saveBlogPosts(posts);

  addAuditLog({
    actor: req.user.email,
    action: "blog.create",
    targetId: next.id,
    payload: { title: next.title, status: next.status }
  });

  return res.status(201).json(next);
});

router.patch("/:id", requireAuth, requireRole("super_admin", "editor", "publisher"), (req, res) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid blog update payload" });
  }
  const posts = getBlogPosts();
  const idx = posts.findIndex((p) => p.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "Post not found" });
  }
  const wasPublished = posts[idx].status === "published";
  const nextStatus = parsed.data.status || posts[idx].status;
  const now = new Date().toISOString();

  posts[idx] = {
    ...posts[idx],
    ...parsed.data,
    status: nextStatus,
    publishedAt:
      nextStatus === "published"
        ? posts[idx].publishedAt || (wasPublished ? posts[idx].publishedAt : now)
        : posts[idx].publishedAt,
    updatedAt: now
  };
  saveBlogPosts(posts);

  addAuditLog({
    actor: req.user.email,
    action: "blog.update",
    targetId: req.params.id,
    payload: parsed.data
  });

  return res.json(posts[idx]);
});

module.exports = router;

