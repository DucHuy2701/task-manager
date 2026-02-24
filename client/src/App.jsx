import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect, useState } from "react";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import { Modal, Button, Form, Spinner } from "react-bootstrap";

function App() {
  const [tasks, setTasks] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const STORAGE_KEY = "task-manager-tasks";

  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestQuery, setSuggestQuery] = useState("");
  const [isSuggestLoading, setIsSuggestLoading] = useState(false);

  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

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

      if (!res.ok){
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

  //load from local
  useEffect(() => {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    if (savedTasks) {
      try {
        const parsed = JSON.parse(savedTasks);
        setTasks(parsed);
      } catch (err) {
        console.err("Error parsing local tasks:", err);
      }
    }
  }, []);

  //save to local when tasks change
  useEffect(() => {
    if (tasks.length > 0 || localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [tasks]);

  const handleTaskAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  //sync local to server when online
  const syncLocalToServer = async () => {
    if (!navigator.onLine) return;
    for (const task of tasks) {
      try {
        const res = await fetch("http://localhost:5000/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(task),
        });

        if (res.ok) {
          const result = await res.json();
          if (result.id && !res.id) {
            setTasks((prev) =>
              prev.map((t) =>
                t === task ? { ...t, id: result.id, synced: true } : t,
              ),
            );
          }
        }
      } catch (err) {
        console.error("Sync error for task:", err);
      }
    }
  };

  //listen online event to sync
  useEffect(() => {
    const handleOnline = () => {
      console.log("Back online - syncing task ...");
      syncLocalToServer();
    };

    window.addEventListener("online", handleOnline);

    //first sync if online
    if (navigator.onLine) {
      syncLocalToServer();
    }

    return () => window.removeEventListener("online", handleOnline);
  }, [tasks]);

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

      <div className="mb-3">
        {navigator.onLine ? (
          <span className="badge bg-success">Online</span>
        ) : (
          <span className="badge bg-warning">Offline - using local data</span>
        )}
      </div>

      <TaskForm onTaskAdded={handleTaskAdded} />
      <TaskList refreshTrigger={refreshTrigger} />
    </div>
  );
}

export default App;
