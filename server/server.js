const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Store for water level data and parameters
let waterLevelData = [];
let pidParams = {
  setpoint: 50.0,  // Default target water level (50%)
  kp: 2.0,         // Default proportional gain
  ki: 0.1,         // Default integral gain
  kd: 0.5          // Default derivative gain
};

// Max data points to store (last 24 hours at 5-second intervals)
const MAX_DATA_POINTS = 17280; // 24 hours * 60 minutes * 12 readings per minute

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// API Endpoint: Receive water level data from ESP32
app.post('/api/waterLevel', (req, res) => {
  const { waterLevel } = req.body;
  
  if (waterLevel === undefined) {
    return res.status(400).json({ error: 'Water level data missing' });
  }
  
  const timestamp = new Date().toISOString();
  
  // Add data to array
  waterLevelData.push({
    timestamp,
    waterLevel: parseFloat(waterLevel),
    setpoint: pidParams.setpoint
  });
  
  // Keep array at max size by removing oldest data
  if (waterLevelData.length > MAX_DATA_POINTS) {
    waterLevelData.shift();
  }
  
  console.log(`Received water level: ${waterLevel}%`);
  res.status(200).json({ status: 'success' });
});

// API Endpoint: Send PID parameters and setpoint to ESP32
app.get('/api/params', (req, res) => {
  res.status(200).json(pidParams);
});

// API Endpoint: Update PID parameters and setpoint from web UI
app.post('/api/params', (req, res) => {
  const { setpoint, kp, ki, kd } = req.body;
  
  // Update only provided parameters
  if (setpoint !== undefined) pidParams.setpoint = parseFloat(setpoint);
  if (kp !== undefined) pidParams.kp = parseFloat(kp);
  if (ki !== undefined) pidParams.ki = parseFloat(ki);
  if (kd !== undefined) pidParams.kd = parseFloat(kd);
  
  console.log('Updated PID parameters:', pidParams);
  res.status(200).json(pidParams);
});

// API Endpoint: Get water level history
app.get('/api/waterLevel', (req, res) => {
  // Get optional query parameter for limiting data points
  const limit = req.query.limit ? parseInt(req.query.limit) : waterLevelData.length;
  
  // Return the most recent data points up to the limit
  const limitedData = waterLevelData.slice(-limit);
  
  res.status(200).json(limitedData);
});

// API Endpoint: Get current water level (most recent reading)
app.get('/api/waterLevel/current', (req, res) => {
  if (waterLevelData.length === 0) {
    return res.status(200).json({ waterLevel: null, timestamp: null });
  }
  
  const currentData = waterLevelData[waterLevelData.length - 1];
  res.status(200).json(currentData);
});

// For any other route, render the React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});