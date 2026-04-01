const crypto = require("crypto");
const { getAuditLogs, saveAuditLogs } = require("./db");

function addAuditLog(entry) {
  const logs = getAuditLogs();
  logs.unshift({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...entry
  });
  saveAuditLogs(logs.slice(0, 1000));
}

module.exports = {
  addAuditLog
};
