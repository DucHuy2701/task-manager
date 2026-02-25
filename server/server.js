import express from "express";
import cors from "cors";
import db from "./db.js";
import { enrichTaskWithOllama } from "./ollamaAgent.js";
import ollama from "ollama";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

//ollama
app.post("/api/ai-suggest", async (req, res) => {
  const { query } = req.body;

  if (!query.trim()) {
    return res.status(400).json({ error: "Query is required!" });
  }

  try {
    const response = await ollama.chat({
      model: "qwen2.5:7b",
      messages: [
        {
          role: "system",
          content:
            "Bạn là trợ lý gợi ý task sáng tạo, thực tế. Trả về **CHỈ JSON** chỉ chứa title và description ngắn gọn, phù hợp với yêu cầu người dùng. Không thêm text thừa.",
        },
        {
          role: "user",
          content: `Gợi ý một task hay dựa trên "${query}". Trả về JSON bằng:
          {
            "title": "Tiêu đề text ngắn gọn",
            "description": "Mô tả chi tiết hơn bằng tiếng Anh (1-2 câu)
          }`,
        },
      ],
      format: "json",
      options: {
        temperature: 0.3,
        num_ctx: 2048,
        keep_alive: -1,
      },
    });

    const raw = response.message.content.trim();
    let suggestion;

    try {
      suggestion = JSON.parse(raw);
    } catch (parseErr) {
      console.error("Ollama suggest parse error:", parseErr);
      return res.status(500).json({ error: "Invalid response from AI!" });
    }

    res.json({
      title: suggestion.title || "Suggest task",
      description: suggestion.description || "No description",
    });
  } catch (err) {
    console.error("Ollama suggest error:", err);
    return res.status(500).json({ error: "Error asking AI!" });
  }
});

//optimized all task with ollama
app.get("/api/optimize", async (req, res) => {
  try {
    const rows = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM tasks", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const optimized = [];
    for (const task of rows) {
      const enriched = await enrichTaskWithOllama({
        titile: task.title,
        description: task.description,
      });
      enriched.id = task.id;

      await new Promise((resolve, reject) => {
        db.run(
          `
            UPDATE tasks SET priority = ?, status = ?, category = ?, reason = ?
            WHERE id = ?
          `,
          [
            enriched.priority,
            enriched.status,
            enriched.category,
            enriched.reason,
            enriched.id,
          ],
          function (err) {
            if (err) reject(err);
            else resolve();
          },
        );
      });
      optimized.push(enriched);
    }

    res.json({ message: "All tasks optimized by AI", count: optimized.length });
  } catch (err) {
    console.error("Optimize all error:", err);
    res.status(500).json({ error: "Failed to optimize tasks" });
  }
});

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
    reason || null,
  ];

  db.run(sql, params, function (err) {
    if (err) {
      console.error("POST error:", err);
      return res.status(500).json({ error: "Failed to create task!" });
    }
    res.status(200).json({
      id: this.lastID,
      message: "Task created with Ollama AI enrichment!",
      task: { ...task, id: this.lastID },
    });
  });
});

//update
app.put("/api/tasks/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, priority, status } = req.body;

  if (!title?.trim()) {
    return res.status(400).json({ error: "Title is required!" });
  }

  const updates = [];
  const params = [];

  if (title !== undefined) {
    updates.push("title = ?");
    params.push(title.trim());
  }
  if (description !== undefined) {
    updates.push("description = ?");
    params.push(description.trim() || null);
  }
  if (priority !== undefined) {
    updates.push("priority = ?");
    params.push(priority);
  }
  if (status !== undefined) {
    updates.push("status = ?");
    params.push(status);
  }

  const sql = `UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`;
  params.push(id);

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
