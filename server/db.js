import sqlite3 from 'sqlite3';

const sqlite = sqlite3.verbose();
const db = new sqlite.Database('./tasks.db');

db.serialize(() => {
    db.run(`
        CREATE DATABASE IF NOT EXIST tasks(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            priority TEXT default 'medium',
            status TEXT default 'pending'
        )
        `)
});

export default db;