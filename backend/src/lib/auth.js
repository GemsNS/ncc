const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function signToken(payload) {
  const secret = process.env.JWT_SECRET || "dev-only-secret-change-me";
  return jwt.sign(payload, secret, { expiresIn: "8h" });
}

function verifyToken(token) {
  const secret = process.env.JWT_SECRET || "dev-only-secret-change-me";
  return jwt.verify(token, secret);
}

module.exports = {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken
};
