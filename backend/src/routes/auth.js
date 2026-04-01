const express = require("express");
const { z } = require("zod");
const { getUsers } = require("../lib/db");
const { verifyPassword, signToken } = require("../lib/auth");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

router.post("/login", (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: "Invalid request payload" });
  }

  const { email, password } = result.data;
  const users = getUsers();
  const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase());

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = signToken({
    id: user.id,
    email: user.email,
    role: user.role
  });

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    }
  });
});

router.get("/me", requireAuth, (req, res) => {
  return res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    }
  });
});

module.exports = router;
