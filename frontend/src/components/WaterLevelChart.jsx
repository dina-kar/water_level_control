import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
  } from 'chart.js';
  import { Line } from 'react-chartjs-2';
  import 'chartjs-adapter-date-fns';
  import './WaterLevelChart.css';
  
  // Register Chart.js components
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
  );
  
  const WaterLevelChart = ({ historicalData }) => {
    // Prepare chart data
    const chartData = {
      datasets: [
        {
          label: 'Water Level',
          data: historicalData.map(item => ({
            x: new Date(item.timestamp),
            y: item.waterLevel
          })),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4
        },
        {
          label: 'Setpoint',
          data: historicalData.map(item => ({
            x: new Date(item.timestamp),
            y: item.setpoint
          })),
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderDash: [5, 5],
          tension: 0
        }
      ]
    };
  
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'minute',
            tooltipFormat: 'HH:mm:ss',
            displayFormats: {
              minute: 'HH:mm'
            }
          },
          title: {
            display: true,
            text: 'Time'
          }
        },
        y: {
          min: 0,
          max: 100,
          title: {
            display: true,
            text: 'Water Level (%)'
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Water Level vs. Setpoint'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
            }
          }
        }
      },
      interaction: {
        mode: 'index',
        intersect: false,
      }
    };
  
    return (
      <div className="chart-container">
        <h2>Water Level History</h2>
        <div className="chart">
          {historicalData.length > 0 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div className="no-data">No historical data available</div>
          )}
        </div>
      </div>
    );
  };
  
  export default WaterLevelChart;