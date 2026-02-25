import { useActionState, useOptimistic, useState } from "react";
import { enrichTaskWithOllama } from "../../../server/ollamaAgent";
import { Spinner } from "react-bootstrap";

function TaskForm({
  onTaskAdded,
  initialTask = null,
  isEditMode = false,
  onClose,
}) {
  const isNew = !isEditMode;
  const actionType = isEditMode ? "update" : "create";
  const [isEnriching, setIsEnriching] = useState(false);

  //optimistic state
  const [optimisticTasks, addOptimisticTasks] = useOptimistic(
    [],
    (current, newTask) => [...current, newTask],
  );

  //action function
  const taskAction = async (prevState, formData) => {
    const title = (formData.get("title") ?? "").trim();
    const description = (formData.get("description") ?? "").trim() || null;
    const priority = (formData.get("priority") ?? "medium").trim();
    const status = (formData.get("status") ?? "pending").trim();

    if (!title) return { error: "Title is required!", pending: false };

    setIsEnriching(true);

    let taskData = { title, description, priority, status };

    let enrichedTask = taskData;
    if (!isEditMode) {
      try {
        enrichedTask = await enrichTaskWithOllama(taskData);
      } catch (enrichErr) {
        console.error("Enrich error (fallback to original):", enrichErr);
        enrichedTask = taskData;
      }
    }

    try {
      let url = "http://localhost:5000/api/tasks";
      let method = "POST";

      if (isEditMode) {
        url += `/${initialTask.id}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enrichedTask),
      });

      if (!res.ok) {
        const err = await res.json();
        return { error: err.error || "Failed to save task!", pending: false };
      }

      const result = await res.json();
      onTaskAdded();
      if (isEditMode && onClose) onClose();

      addOptimisticTasks({
        ...enrichedTask,
        id: result.id || initialTask?.id,
        created_at: new Date().toISOString(),
      });

      return { success: true, error: null, pending: false };
    } catch (err) {
      console.error(err);
      return { error: "Network error or server issues!", pending: false };
    } finally {
      setIsEnriching(false);
    }
  };

  //useActionState
  const [state, formAction, isPending] = useActionState(taskAction, {
    error: null,
    success: false,
    pending: false,
  });

  return (
    <form action={formAction} className="mb-4">
      <input type="hidden" name="id" value={initialTask?.id || ""} />

      <div className="mb-3">
        <label className="form-label">Title (require)</label>
        <input
          type="text"
          name="title"
          className="form-control"
          defaultValue={initialTask?.title || ""}
          required
          placeholder="Enter or keep existing title"
          disabled={isPending}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Description (optional)</label>
        <textarea
          type="text"
          name="description"
          className="form-control"
          defaultValue={initialTask?.description || ""}
          rows="3"
          placeholder="Edit if needed, or leave as is"
          disabled={isPending}
        />
      </div>

      <div className="row mb-3">
        <div className="col-md-6">
          <label className="form-label">Priority</label>
          <select
            name="priority"
            className="form-select"
            defaultValue={initialTask?.priority || "medium"}
            disabled={isPending}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Status</label>
          <select
            name="status"
            className="form-select"
            defaultValue={initialTask?.status || "pending"}
            disabled={isPending}
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In-progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
      {isEnriching ||
        (isPending && (
          <div className="alert alert-info mt-3 d-flex align-items-center gap-3 p-3">
            <Spinner animation="border" variant="primary" />
            <span>Thinking and optimizing task... 🚀</span>
          </div>
        ))}
      {state.error && (
        <div className="alert alert-danger mb-3">{state.error}</div>
      )}
      {state.success && (
        <div className="alert alert-success mb-3">Task save successfulyl!</div>
      )}

      <div className="d-flex gap-2">
        <button
          type="submit"
          className="btn btn-success flex-fill"
          disabled={isPending}
        >
          {isEditMode ? "Update Task" : "Add Task"}
        </button>

        {isEditMode && (
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={isPending}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default TaskForm;
