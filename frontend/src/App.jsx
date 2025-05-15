import { useState, useEffect } from 'react';
import WaterTank from './components/WaterTank';
import ControlPanel from './components/ControlPanel';
import WaterLevelChart from './components/WaterLevelChart';
import ConnectionStatus from './components/ConnectionStatus';
import api from './services/api';
import './App.css';

function App() {
  // State variables
  const [currentLevel, setCurrentLevel] = useState(0);
  const [historicalData, setHistoricalData] = useState([]);
  const [pidParams, setPidParams] = useState({
    setpoint: 50,
    kp: 2.0,
    ki: 0.1,
    kd: 0.5
  });
  const [lastUpdated, setLastUpdated] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  
  // Function to fetch current water level
  const fetchCurrentLevel = async () => {
    try {
      const response = await api.getCurrentLevel();
      if (response && response.waterLevel !== null) {
        setCurrentLevel(response.waterLevel);
        setLastUpdated(new Date(response.timestamp).toLocaleTimeString());
        setConnectionStatus('Connected');
      }
    } catch (error) {
      console.error('Error fetching current water level:', error);
      setConnectionStatus('Connection Error');
    }
  };

  // Function to fetch historical data for the chart
  const fetchHistoricalData = async () => {
    try {
      const data = await api.getHistoricalData(100);
      setHistoricalData(data);
    } catch (error) {
      console.error('Error fetching historical data:', error);
    }
  };

  // Function to fetch PID parameters
  const fetchPidParams = async () => {
    try {
      const params = await api.getPidParams();
      setPidParams(params);
    } catch (error) {
      console.error('Error fetching PID parameters:', error);
    }
  };

  // Function to update PID parameters
  const updatePidParams = async (params) => {
    try {
      const response = await api.updatePidParams(params);
      setPidParams(response);
      alert('PID parameters updated successfully!');
    } catch (error) {
      console.error('Error updating PID parameters:', error);
      alert('Failed to update PID parameters');
    }
  };

  // Function to simulate water level data (for testing without ESP32)
  const simulateWaterLevel = async () => {
    try {
      // Generate a random water level close to setpoint but with some variation
      const randomOffset = (Math.random() - 0.5) * 10; // ±5% variation
      const simulatedLevel = Math.max(0, Math.min(100, pidParams.setpoint + randomOffset));
      
      await api.simulateWaterLevelData(simulatedLevel);
      console.log(`Simulated water level: ${simulatedLevel.toFixed(1)}%`);
      
      // Refresh data after simulation
      fetchCurrentLevel();
      fetchHistoricalData();
    } catch (error) {
      console.error('Error simulating water level:', error);
    }
  };

  // Set up polling intervals to fetch data
  useEffect(() => {
    // Initial fetch
    fetchCurrentLevel();
    fetchHistoricalData();
    fetchPidParams();

    // Set up intervals for periodic fetching
    const levelInterval = setInterval(fetchCurrentLevel, 2000);
    const historyInterval = setInterval(fetchHistoricalData, 5000);
    
    // Clean up intervals on component unmount
    return () => {
      clearInterval(levelInterval);
      clearInterval(historyInterval);
    };
  }, []);

  return (
    <div className="App">
      <header>
        <h1>Water Level Control System</h1>
        <ConnectionStatus status={connectionStatus} lastUpdated={lastUpdated} />
      </header>

      <div className="dashboard">
        <div className="tank-control-container">
          <WaterTank currentLevel={currentLevel} setpoint={pidParams.setpoint} />
          <ControlPanel pidParams={pidParams} onUpdateParams={updatePidParams} />
        </div>

        <WaterLevelChart historicalData={historicalData} />
        
        {/* For testing only - this button would not be in production */}
        <div className="test-controls">
          <button onClick={simulateWaterLevel} className="simulate-btn">
            Simulate ESP32 Data
          </button>
          <span className="test-note">
            (For testing without physical ESP32)
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;