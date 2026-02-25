import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect, useState } from "react";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import ChartDashboard from "./components/ChartDashboard";

function App() {
  const [tasks, setTasks] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestQuery, setSuggestQuery] = useState("");
  const [isSuggestLoading, setIsSuggestLoading] = useState(false);

  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [isOptimizing, setIsOptimizing] = useState(false);

  //optimize all
  const handleOptimizeAll = async () => {
    if (!confirm("Optimize all tasks with AI? This may take time.")) return;

    setIsOptimizing(true);

    try {
      const res = await fetch("http://localhost:5000/api/optimize");
      if (!res.ok) throw new Error("Optimize failed!");
      handleTaskAdded();
      alert("All tasks optimized by AI!");
    } catch (err) {
      alert("Error optimizing tasks: ", err.message);
    } finally {
      setIsOptimizing(false);
    }
  };

  //handle add suggestion
  const handleAddSuggestion = async () => {
    if (!aiSuggestion) return alert("No suggestion to add!");

    setIsSuggestLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: aiSuggestion.title,
          description: aiSuggestion.description,
        }),
      });

      if (!res.ok) throw new Error("Failed to add suggestion!");

      const data = await res.json();

      handleTaskAdded();

      setShowSuggestModal(false);
      setAiSuggestion(null);
      setSuggestQuery("");

      alert("Task form suggestion has been added and optimized!\n", data);
    } catch (err) {
      console.log("Add suggestion error:", err);
      setErrorMessage("Error adding task:", err.message);
    } finally {
      setIsSuggestLoading(false);
    }
  };

  // ask ollama
  const handleAskOllama = async () => {
    if (!suggestQuery.trim()) return alert("Must be a question!");

    setIsSuggestLoading(true);
    setAiSuggestion(null);
    setErrorMessage("");

    try {
      const res = await fetch("http://localhost:5000/api/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: suggestQuery }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to get suggestion!");
      }

      const data = await res.json();

      setAiSuggestion({
        title: data.title,
        description: data.description,
      });
    } catch (err) {
      console.error(err);
      alert("Error asking AI:" + err.message);
    } finally {
      setIsSuggestLoading(false);
    }
  };

  //load from server
  useEffect(() => {
    const fetchTasksFromServer = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/tasks");
        if (!res.ok) throw new Error("Failed to fetch!");
        const data = await res.json();
        setTasks(data);
      } catch (err) {
        console.error("Fetch tasks error:", err);
      }
    };

    fetchTasksFromServer();
  }, [refreshTrigger]);

  const handleTaskAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-5">Local AI-Agent Task Manager</h1>

      {/* ollama button */}
      <div className="text-center mb-4">
        <button
          className="btn btn-outline-primary btn-lg"
          onClick={() => setShowSuggestModal(true)}
        >
          🧠 Ask AI for smarter task
        </button>

        <button
          className="btn btn-outline-info btn-lg"
          onClick={handleOptimizeAll}
          disabled={isOptimizing}
        >
          {isOptimizing ? "Optimizing... Please wait!" : "Optimize all tasks"}
        </button>
      </div>

      {/* modal ask ollama */}
      <Modal show={showSuggestModal} onHide={() => setShowSuggestModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Ask AI for task</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Example: "Start to learn code"</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={suggestQuery}
              onChange={(e) => setSuggestQuery(e.target.value)}
              placeholder="Type idea or request..."
              disabled={isSuggestLoading}
            />
          </Form.Group>

          {/* ollama result */}
          {aiSuggestion && (
            <div className="mt-4">
              <div className="alert alert-success">
                <h5 className="alert-heading">AI suggestion</h5>
                <p>
                  <strong>Title:</strong> {aiSuggestion.title}
                </p>
                <p>
                  <strong>Description:</strong> {aiSuggestion.description}
                </p>
              </div>

              <div className="d-flex gap-2 mt-2">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(aiSuggestion.title);
                    alert("Title copied to clipboard!");
                  }}
                >
                  Copy Title
                </Button>

                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(aiSuggestion.description);
                    alert("Description copied to clipboard!");
                  }}
                >
                  Copy Description
                </Button>

                <Button
                  variant="success"
                  size="sm"
                  onClick={handleAddSuggestion}
                  disabled={isSuggestLoading}
                >
                  {isSuggestLoading ? "Adding..." : "Add this to your tasks"}
                </Button>
              </div>
            </div>
          )}

          {isSuggestLoading && (
            <div className="mt-3 text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">AI is thinking...</p>
            </div>
          )}

          {errorMessage && (
            <div className="alert alert-danger mt-3">{errorMessage}</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowSuggestModal(false)}
          >
            Close
          </Button>
          <Button
            variant="primary"
            onClick={handleAskOllama}
            disabled={isSuggestLoading}
          >
            {isSuggestLoading ? "Thinking..." : "Ask"}
          </Button>
        </Modal.Footer>
      </Modal>

      <ChartDashboard tasks={tasks} />

      <TaskForm onTaskAdded={handleTaskAdded} />
      <TaskList refreshTrigger={refreshTrigger} />
    </div>
  );
}

export default App;
