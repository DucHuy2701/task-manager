import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect, useState } from "react";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";

function App() {
  const [tasks, setTasks] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const STORAGE_KEY = 'task-manager-tasks';

  //load from local
  useEffect(()=>{
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    if(savedTasks){
      try {
        const parsed = JSON.parse(savedTasks);
        setTasks(parsed);
      } catch (err) {
        console.err('Error parsing local tasks:', err);
      }
    }
  }, []);

  //save to local when tasks change
  useEffect(()=>{
    if(tasks.length > 0 || localStorage.getItem(STORAGE_KEY)){
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [tasks]);

  const handleTaskAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  }

  //sync local to server when online
  const syncLocalToServer = async () => {
    if(!navigator.onLine)
      return;
    for (const task of tasks){
      try {
        const res = await fetch('http://localhost:5000/api/tasks', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(task),
        })

        if(res.ok){
          const result = await res.json();
          if(result.id && !res.id){
            setTasks(prev => prev.map(t => t === task ? {...t, id: result.id, synced: true} : t ))
          }
        }
      } catch (err) {
        console.error('Sync error for task:', err);
      }
    }
  }

  //listen online event to sync
  useEffect(()=>{
    const handleOnline = () => {
      console.log('Back online - syncing task ...');
      syncLocalToServer();
    }

    window.addEventListener('online', handleOnline);

    //first sync if online
    if(navigator.onLine){
      syncLocalToServer();
    }

    return () => window.removeEventListener('online', handleOnline);
  }, [tasks]);

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-5">Local AI-Agent Task Manager</h1>

      <div className="mb-3">
        {navigator.onLine ? (
          <span className="badge bg-success">Online</span>
        ) : (
          <span className="badge bg-warning">Offline - using local data</span>
        )}
      </div>

      <TaskForm onTaskAdded={handleTaskAdded}/>
      <TaskList refreshTrigger={refreshTrigger}/>
    </div>
  );
}

export default App;
