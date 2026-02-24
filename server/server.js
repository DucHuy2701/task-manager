import express from "express";
import cors from "cors";
import db from "./db.js";
import { enrichTaskWithOllama } from "./ollamaAgent.js";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

//get all
app.get("/api/tasks", (req, res) => {
  db.all("SELECT * FROM tasks ORDER BY created_at DESC", [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "DB error!" });
    }
    res.json(rows);
  });
});

//get single
app.get("/api/tasks/:id", (req, res) => {
  const { id } = req.params;
  db.get(
    `
        SELECT * FROM tasks WHERE id = ?
        `,
    [id],
    (err, row) => {
      if (err) {
        console.error("GET /tasks/:id error:", err.message);
        return res.status(500).json({ error: "DB error!" });
      }
      if (!row) {
        return res.status(400).json({ error: "Task not found" });
      }
      res.json(row);
    },
  );
});

//insert
app.post("/api/tasks", async (req, res) => {
  let task = req.body;
  if (!task.title.trim()) {
    return res.status(400).json({ error: "Title is required!" });
  }

  task = await enrichTaskWithOllama(task);

  const { title, description, priority, status, category, reason } = task;

  const sql = `
    INSERT INTO tasks (title, description, priority, status, category, reason)
    VALUES (?,?,?,?,?,?)
  `;

  const params = [
    title.trim(),
    description?.trim() || null,
    priority,
    status,
    category,
    reason || null
  ]

  db.run(sql, params, function (err){
    if(err){
      console.error('POST error:', err);
      return res.status(500).json({error: 'Failed to create task!'});
    }
    res.status(200).json({
      id: this.lastID,
      message: 'Task created with Ollama AI enrichment!',
      task: {...task, id: this.lastID}
    })
  })
});

//update
app.put("/api/tasks/:id", (req, res) => {
  const { id } = req.params;
  const { title, description, priority, status } = req.body;

  if (!title?.trim()) {
    return res.status(400).json({ error: "Title is required!" });
  }

  const sql = `
        UPDATE tasks
        SET title = ?, description = ?, priority = ?, status = ?
        WHERE id = ?
    `;

  const params = [
    title.trim(),
    description?.trim() || null,
    priority || "medium",
    status || "pending",
    id,
  ];

  db.run(sql, params, function (err) {
    if (err) {
      console.error("PUT /tasks error:", err.message);
      return res.status(500).json({ error: "Failed to update task!" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Task not found!" });
    }
    res.json({ message: "Task updated!", changes: this.changes });
  });
});

//delete
app.delete("/api/tasks/:id", (req, res) => {
  const { id } = req.params;

  db.run(`DELETE FROM tasks WHERE id = ?`, [id], function (err) {
    if (err) {
      console.log("DELETE /task error:", err.message);
      return res.status(500).json({ error: "Failed to delete task!" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Task not found!" });
    }
    res.json({ message: "Task deleted!" });
  });
});

//test
app.get("/api/test", (req, res) => {
  res.json({ message: "Server alive!", time: new Date().toISOString() });
});

app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`),
);
