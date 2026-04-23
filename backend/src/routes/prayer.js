const crypto = require("crypto");
const express = require("express");
const { z } = require("zod");
const { getPrayerInbox, savePrayerInbox } = require("../lib/db");
const { requireAuth, requireRole } = require("../middleware/auth");
const { keywordPrayerReply, openAiPrayerReply } = require("../lib/prayer-ai");

const router = express.Router();

const chatSchema = z.object({
  message: z.string().min(1).max(4000),
  sessionId: z.string().min(8).max(120).optional()
});

const inboxPatchSchema = z.object({
  status: z.enum(["new", "read", "archived"]).optional(),
  staffNote: z.string().max(2000).optional()
});

const rateState = new Map();
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 48;

function clientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.trim()) {
    return xf.split(",")[0].trim();
  }
  return req.socket && req.socket.remoteAddress ? String(req.socket.remoteAddress) : "unknown";
}

function allowRate(ip) {
  const now = Date.now();
  const row = rateState.get(ip);
  if (!row || now > row.resetAt) {
    rateState.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (row.count >= RATE_MAX) {
    return false;
  }
  row.count += 1;
  return true;
}

router.post("/chat", async (req, res) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid message" });
  }

  const ip = clientIp(req);
  if (!allowRate(ip)) {
    return res.status(429).json({ error: "Too many messages. Please try again later." });
  }

  const sessionId = parsed.data.sessionId || crypto.randomUUID();
  const userMessage = parsed.data.message.trim();

  let reply = null;
  try {
    reply = await openAiPrayerReply(userMessage);
  } catch (error) {
    reply = null;
  }
  if (!reply) {
    reply = keywordPrayerReply(userMessage);
  }

  const inbox = getPrayerInbox();
  const entry = {
    id: crypto.randomUUID(),
    sessionId,
    userMessage,
    aiReply: reply,
    createdAt: new Date().toISOString(),
    status: "new",
    staffNote: "",
    source: "prayer-chat"
  };
  inbox.unshift(entry);
  savePrayerInbox(inbox.slice(0, 8000));

  return res.json({ reply, sessionId });
});

router.get("/admin/inbox", requireAuth, requireRole("super_admin", "editor", "publisher"), (req, res) => {
  const items = getPrayerInbox();
  return res.json(items);
});

router.patch(
  "/admin/inbox/:id",
  requireAuth,
  requireRole("super_admin", "editor", "publisher"),
  (req, res) => {
    const parsed = inboxPatchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid update" });
    }

    const inbox = getPrayerInbox();
    const index = inbox.findIndex((item) => item.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Entry not found" });
    }

    const next = { ...inbox[index] };
    if (parsed.data.status) {
      next.status = parsed.data.status;
    }
    if (typeof parsed.data.staffNote === "string") {
      next.staffNote = parsed.data.staffNote;
    }
    next.updatedAt = new Date().toISOString();
    inbox[index] = next;
    savePrayerInbox(inbox);

    return res.json(next);
  }
);

module.exports = router;
