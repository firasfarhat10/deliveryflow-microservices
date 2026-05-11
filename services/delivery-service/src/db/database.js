const path = require("path");
const Database = require("better-sqlite3");
require("dotenv").config();

const dbPath =
  process.env.DELIVERY_DB_PATH || path.join(__dirname, "deliveries.db");

const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS deliveries (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    courier_id TEXT,
    status TEXT NOT NULL,
    assigned_at TEXT,
    picked_up_at TEXT,
    delivered_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

module.exports = db;