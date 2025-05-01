// init-db.js
const Database = require('better-sqlite3');
const db = new Database('golf.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS shots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    club TEXT NOT NULL,
    carry_distance REAL NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log("✅ Database initialized.");
