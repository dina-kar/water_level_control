import { useState, useEffect } from 'react';
import './ControlPanel.css';

const ControlPanel = ({ pidParams, onUpdateParams }) => {
  const [formParams, setFormParams] = useState({
    setpoint: 50,
    kp: 2.0,
    ki: 0.1,
    kd: 0.5
  });

  // Update form when pidParams change (from API)
  useEffect(() => {
    if (pidParams) {
      setFormParams(pidParams);
    }
  }, [pidParams]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormParams({
      ...formParams,
      [name]: parseFloat(value)
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateParams(formParams);
  };

  return (
    <div className="control-panel">
      <h2>Control Parameters</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="setpoint">Setpoint (0-100%)</label>
          <input
            type="range"
            id="setpoint"
            name="setpoint"
            min="0"
            max="100"
            step="1"
            value={formParams.setpoint}
            onChange={handleInputChange}
          />
          <input
            type="number"
            name="setpoint"
            min="0"
            max="100"
            step="1"
            value={formParams.setpoint}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="kp">Proportional Gain (Kp)</label>
          <input
            type="range"
            id="kp"
            name="kp"
            min="0"
            max="10"
            step="0.1"
            value={formParams.kp}
            onChange={handleInputChange}
          />
          <input
            type="number"
            name="kp"
            min="0"
            max="10"
            step="0.1"
            value={formParams.kp}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="ki">Integral Gain (Ki)</label>
          <input
            type="range"
            id="ki"
            name="ki"
            min="0"
            max="1"
            step="0.01"
            value={formParams.ki}
            onChange={handleInputChange}
          />
          <input
            type="number"
            name="ki"
            min="0"
            max="1"
            step="0.01"
            value={formParams.ki}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="kd">Derivative Gain (Kd)</label>
          <input
            type="range"
            id="kd"
            name="kd"
            min="0"
            max="5"
            step="0.1"
            value={formParams.kd}
            onChange={handleInputChange}
          />
          <input
            type="number"
            name="kd"
            min="0"
            max="5"
            step="0.1"
            value={formParams.kd}
            onChange={handleInputChange}
          />
        </div>

        <button type="submit" className="update-btn">Update Parameters</button>
      </form>
    </div>
  );
};

export default ControlPanel;