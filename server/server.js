import express from "express";
import cors from "cors";
import db from "./db.js";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get("/api/test", (req, res) => {
  res.json({ message: "Server alive!", time: new Date().toISOString() });
});

app.get("/api/tasks", (req, res) => {
  db.all("SELECT * FROM tasks ORDER BY created_at DESC", [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "DB error!" });
    }
    res.json(rows);
  });
});

app.post("/api/tasks", (req, res) => {
  const {
    title,
    description,
    priority = "medium",
    status = "pending",
  } = req.body;

  if (!title) {
    return res.status(400).json({ message: "Title is required!" });
  }

  const sql = `
        INSERT INTO tasks (title, description, priority, status)
        VALUES (?, ?, ?, ?)
    `;

  const params = [title, description || null, priority, status];

  db.run(sql, params, function (err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Failed to create task!" });
    }
    return res.status(201).json({
        id: this.lastID,
        message: 'Task created successfully!'
    })
  });
});

app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`),
);
