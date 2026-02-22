import { useEffect, useState } from "react";

function TaskList({ refreshTrigger }) {
  const [tasks, setTasks] = useState([]);

  const fetchTasks = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/tasks");
      if (!res.ok) throw new Error("Failed to fetch!");
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [refreshTrigger]);

  return(
    <div>
        <h3 className="mb-3">Your Tasks</h3>
        {tasks.length === 0 ? (
            <p className="text-muted">No tasks yet. Add one!</p>
        ):(
            <div className="row">
                {tasks.map((task) => (
                    <div className="col-md-6 mb-3" key={task.id}>
                        <div className="card">
                            <div className="card-body">
                                <h5 className="card-title">{task.title}</h5>
                                <p className="card-text">{task.description}</p>
                                <p>
                                    <strong>Priority:</strong>{' '}
                                    <span className={`badge bg-${task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'success'}`}>
                                        {task.priority}
                                    </span>
                                </p>
                                <p>
                                    <small>Created: {new Date(task.created_at).toLocaleString()}</small>
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
}

export default TaskList;
