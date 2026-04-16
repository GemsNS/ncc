const crypto = require("crypto");
const express = require("express");
const { z } = require("zod");
const { getEvents, saveEvents } = require("../lib/db");
const { requireAuth, requireRole } = require("../middleware/auth");
const { addAuditLog } = require("../lib/audit");

const router = express.Router();

const eventSchema = z.object({
  title: z.string().min(3).max(140),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().optional(),
  location: z.string().min(2).max(180),
  category: z.string().min(2).max(80),
  description: z.string().min(5).max(1000),
  imageUrl: z.string().url().optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft")
});

const eventPatchSchema = eventSchema.partial();

function byStartDateAsc(a, b) {
  return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
}

router.get("/", (req, res) => {
  const includeAll = String(req.query.includeAll || "").toLowerCase() === "true";
  const now = Date.now();

  let events = getEvents().slice().sort(byStartDateAsc);
  if (!includeAll) {
    events = events.filter((item) => item.status === "published");
  }

  const upcoming = events.filter((item) => new Date(item.startAt).getTime() >= now);
  return res.json(upcoming);
});

router.post("/", requireAuth, requireRole("super_admin", "editor", "publisher"), (req, res) => {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid event payload" });
  }

  const events = getEvents();
  const nextEvent = {
    id: crypto.randomUUID(),
    ...parsed.data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: req.user.email
  };
  events.unshift(nextEvent);
  saveEvents(events);

  addAuditLog({
    actor: req.user.email,
    action: "events.create",
    targetId: nextEvent.id,
    payload: { title: nextEvent.title, status: nextEvent.status }
  });

  return res.status(201).json(nextEvent);
});

router.patch("/:id", requireAuth, requireRole("super_admin", "editor", "publisher"), (req, res) => {
  const parsed = eventPatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid event update payload" });
  }

  const events = getEvents();
  const index = events.findIndex((item) => item.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Event not found" });
  }

  events[index] = {
    ...events[index],
    ...parsed.data,
    updatedAt: new Date().toISOString()
  };
  saveEvents(events);

  addAuditLog({
    actor: req.user.email,
    action: "events.update",
    targetId: req.params.id,
    payload: parsed.data
  });

  return res.json(events[index]);
});

router.delete("/:id", requireAuth, requireRole("super_admin"), (req, res) => {
  const events = getEvents();
  const index = events.findIndex((item) => item.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Event not found" });
  }
  const removed = events[index];
  const next = events.filter((item) => item.id !== req.params.id);
  saveEvents(next);

  addAuditLog({
    actor: req.user.email,
    action: "events.delete",
    targetId: req.params.id,
    payload: { title: removed.title }
  });

  return res.json({ ok: true });
});

module.exports = router;

