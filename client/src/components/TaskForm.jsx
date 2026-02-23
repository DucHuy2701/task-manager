import { useEffect, useState } from "react";

function TaskForm({
  onTaskAdded,
  initialTask = null,
  isEditMode = false,
  onClose,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("pending");

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title || "");
      setDescription(initialTask.description || "");
      setPriority(initialTask.priority || "medium");
      setStatus(initialTask.status || "pending");
    }
  }, [initialTask]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return alert("Title is required");

    const taskData = {
      title: title.trim(),
      description: description.trim() || null,
      priority,
      status,
    };

    try {
      const url = isEditMode
        ? `http://localhost:5000/api/tasks/${initialTask.id}`
        : "http://localhost:5000/api/tasks";

      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save task!");
      }

      onTaskAdded();
      if (isEditMode && onClose) onClose();
      if (!isEditMode) {
        setTitle("");
        setDescription("");
        setPriority("medidum");
        setStatus("pending");
      }
    } catch (err) {
      console.error("Saving task error:", err);
      alert(err.message || "Error saving task");
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
        />
      </div>
      <div className="row mb-3">
        <div className="col-md-6">
          <label className="form-label">Priority</label>
          <select
            type="text"
            className="form-control"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Status</label>
          <select
            type="text"
            className="form-control"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In-progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
      
      <div className="d-flex gap-2">
        <button className="btn btn-success flex-fill">
          {isEditMode ? 'Update Task' : 'Add Task'}
        </button>
        {isEditMode && (
          <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
        )}
      </div>
    </form>
  );
}

export default TaskForm;
