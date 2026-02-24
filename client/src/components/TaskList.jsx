import { useEffect, useState } from "react";
import TaskForm from "./TaskForm";

function TaskList({ refreshTrigger, taskFromParent }) {
  const [tasks, setTasks] = useState(taskFromParent || []);
  const [loading, setLoading] = useState(true);
  const [editTask, setEditTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
    useEffect(()=>{
        setTasks(taskFromParent || []);
    }, [refreshTrigger, taskFromParent]);

  const fetchTasks = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/tasks");
      if (!res.ok) throw new Error("Failed to fetch!");
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [refreshTrigger]);

  const handleDelete = async (id) => {
    if(!window.confirm('Are you sure you want to delete this task?'))
        return;
    try {
        const res = await fetch(`http://localhost:5000/api/tasks/${id}`, {
            method: 'DELETE',
        });
        if(!res.ok)
            throw new Error('Failed to delete!');
        fetchTasks();
    } catch (err) {
        console.error('Delete error:', err);
        alert('Error deleting task!');
    }
  }
  
  const handleEdit = (task) => {
    setEditTask(task);
    setShowModal(true);
  }

  const handleCloseModal = () => {
    setShowModal(false);
    setEditTask(null);
  }

  const handleTaskUpdate = () => {
    fetchTasks();
    handleCloseModal();
  }

  return(
    <div>
        <h3 className="mb-3">Your Tasks</h3>

        {loading ? (
            <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        ) : tasks.length === 0 ? (
            <p className="text-muted text-center">No task yet. Add one!</p>
        ) : (
            <div className="row g-3">
                {tasks.map((task) => (
                    <div key={task.id} className="col-md-6 col-lg-4">
                        <div className="card h-100 shadow-sm">
                            <div className="card-body">
                                <h5 className="card-title d-flex justify-content-between align-item-center">
                                    {task.title}
                                    <span className={`badge bg-${
                                        task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'success'
                                    }`}>
                                        {task.priority}
                                    </span>
                                </h5>
                                <p className="card-text text-muted">
                                    {task.description || 'No description'}
                                </p>
                                {task.reason && (
                                    <div className="mt-2 p-2 bg-light rounded small">
                                        <strong>AI suggestion:</strong> {task.reason}
                                    </div>
                                )}
                                <div className="d-flex justify-content-between align-item-center mt-3">
                                    <span className={`badge bg-${task.status === 'pending' ? 'secondary' : task.status === 'in-progress' ? 'info' : 'success'}`}>
                                        {task.status}
                                    </span>
                                    <small className="text-muted">
                                        {new Date(task.created_at).toLocaleDateString()}
                                    </small>
                                </div>
                            </div>
                            <div className="card-footer bg-transparent border-0 d-flex gap-2">
                                <button onClick={() => handleEdit(task)} className="btn btn-sm btn-outline-primary flex-fill">
                                    Edit
                                </button>
                                <button onClick={() => handleDelete(task.id)} className="btn btn-sm btn-outline-danger flex-fill">
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/*modal*/}
        <div className={`modal fade ${showModal ? 'show' : ''}`}
        style={{display: showModal ? 'block' : 'none'}}
        tabIndex="-1">
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Edit Task</h5>
                        <button className="btn-close" type="button" onClick={handleCloseModal}></button>
                    </div>
                    <div className="modal-body">
                        {editTask && (
                            <TaskForm
                            initialTask = {editTask}
                            onTaskAdded={handleTaskUpdate}
                            isEditMode={true}
                            onClose={handleCloseModal}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
        {showModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
}

export default TaskList;
