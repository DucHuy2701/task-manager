import { useState } from "react";

function TaskForm({ onTaskAdded }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return alert("Title is required!");
    try {
      const res = await fetch("http://localhost:5000/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "apllication/json" },
        body: JSON.stringify({ title, description, priority }),
      });

      if (!res.ok) throw new Error("Failed to add task!");

      const data = await res.json();
      console.log("Task added:", data);
      onTaskAdded();
      setTitle();
      setDescription();
      setPriority("medium");
    } catch (err) {
      console.error(err);
      alert("Error adding task!");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="mb-3">
        <label className="form-label">Title</label>
        <input
          type="text"
          className="form-control"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Description</label>
        <input
          type="text"
          className="form-control"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Priority</label>
        <select
          type="text"
          className="form-control"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          required
        >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
        </select>
      </div>
      <button type="submit" className="btn btn-success">Add Task</button>
    </form>
  );
}

export default TaskForm;
