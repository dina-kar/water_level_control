import { useState, useEffect } from 'react';
import './WaterTank.css';

const WaterTank = ({ currentLevel, setpoint }) => {
  return (
    <div className="tank-container">
      <h2>Water Tank Level</h2>
      <div className="tank">
        <div 
          className="water" 
          style={{ height: `${currentLevel}%` }}
        >
          <div className="water-text">{currentLevel.toFixed(1)}%</div>
        </div>
        <div 
          className="setpoint-marker" 
          style={{ bottom: `${setpoint}%` }}
        />
      </div>
      <div className="tank-info">
        <p>Current Level: {currentLevel.toFixed(1)}%</p>
        <p>Setpoint: {setpoint.toFixed(1)}%</p>
      </div>
    </div>
  );
};

export default WaterTank;