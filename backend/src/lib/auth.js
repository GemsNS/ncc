const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function signToken(payload) {
  const nodeEnv = String(process.env.NODE_ENV || "production").toLowerCase();
  const secret =
    process.env.JWT_SECRET || (nodeEnv === "development" ? "dev-only-secret-change-me" : "");
  if (!secret) {
    throw new Error("JWT_SECRET is required");
  }
  return jwt.sign(payload, secret, { expiresIn: "8h" });
}

function verifyToken(token) {
  const nodeEnv = String(process.env.NODE_ENV || "production").toLowerCase();
  const secret =
    process.env.JWT_SECRET || (nodeEnv === "development" ? "dev-only-secret-change-me" : "");
  if (!secret) {
    throw new Error("JWT_SECRET is required");
  }
  return jwt.verify(token, secret);
}

module.exports = {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken
};
