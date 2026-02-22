import "bootstrap/dist/css/bootstrap.min.css";
import { useState } from "react";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";

function App() {
  const [refresh, setRefresh] = useState(0);

  const handleTaskAdded = () => setRefresh(prev => prev + 1);

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-5">Local AI-Agent Task Manager</h1>
      <TaskForm onTaskAdded={handleTaskAdded}/>
      <TaskList refreshTrigger={refresh}/>
    </div>
  );
}

export default App;
