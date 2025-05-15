import './ConnectionStatus.css';

const ConnectionStatus = ({ status, lastUpdated }) => {
  return (
    <div className="connection-status">
      <span>Status: </span>
      <span className={status === 'Connected' ? 'connected' : 'disconnected'}>
        {status}
      </span>
      {lastUpdated && (
        <span className="last-updated">Last updated: {lastUpdated}</span>
      )}
    </div>
  );
};

export default ConnectionStatus;