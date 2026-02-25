import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

function ChartDashboard({ tasks }) {
  if (!tasks?.length) return null;

  //priority statistical
  const priorityCount = tasks.reduce((acc, t) => {
    acc[t.priority] = (acc[t.priority] || 0) + 1;
    return acc;
  }, {});

  const priorityData = {
    labels: Object.keys(priorityCount),
    datasets: [
      {
        data: Object.values(priorityCount),
        backgroundColor: ["#dc3545", "#ffc107", "#198754"],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="card mb-4 shadow-sm">
      <div className="card-body">
        <h5 className="card-title text-center">
          Task Statistic (AI Optimized)
        </h5>
        <div style={{ maxWidth: "400px", margin: "0 auto" }}>
          <Pie
            data={priorityData}
            options={{
              responsive: true,
              plugins: { legend: { position: "bottom" } },
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default ChartDashboard;
