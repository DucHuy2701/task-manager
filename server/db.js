import sqlite3 from "sqlite3";

const sqlite = sqlite3.verbose();
const db = new sqlite.Database("./tasks.db", (err) => {
  if (err) console.log("Error opening database!");
  else console.log("DB connected!");
});

db.serialize(() => {
  db.run(
    `
        CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'pending',
        category TEXT DEFAULT 'general',
        reason TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        `,
    (err) => {
      if (err) console.log("Error creating DB!", err.message);
      else console.log("DB generating successful!");
    },
  );
});

export default db;
