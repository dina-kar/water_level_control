import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = {
  // Get current water level
  getCurrentLevel: async () => {
    try {
      const response = await axios.get(`${API_URL}/waterLevel/current`);
      return response.data;
    } catch (error) {
      console.error('Error fetching current water level:', error);
      throw error;
    }
  },

  // Get historical water level data
  getHistoricalData: async (limit = 100) => {
    try {
      const response = await axios.get(`${API_URL}/waterLevel?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }
  },

  // Get PID parameters
  getPidParams: async () => {
    try {
      const response = await axios.get(`${API_URL}/params`);
      return response.data;
    } catch (error) {
      console.error('Error fetching PID parameters:', error);
      throw error;
    }
  },

  // Update PID parameters
  updatePidParams: async (params) => {
    try {
      const response = await axios.post(`${API_URL}/params`, params);
      return response.data;
    } catch (error) {
      console.error('Error updating PID parameters:', error);
      throw error;
    }
  },

  // For testing: Simulate sending water level data (ESP32 equivalent)
  simulateWaterLevelData: async (waterLevel) => {
    try {
      const response = await axios.post(`${API_URL}/waterLevel`, { waterLevel });
      return response.data;
    } catch (error) {
      console.error('Error sending simulated water level data:', error);
      throw error;
    }
  }
};

export default api;