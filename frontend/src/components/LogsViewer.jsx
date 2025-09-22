import React, { useEffect, useState } from 'react';

export default function LogsViewer({ containerId, socket, onClose }) {
  const [logs, setLogs] = useState('');

  useEffect(() => {
    // Listen to incoming log chunks
    const onLog = ({ id, chunk }) => {
      if (id === containerId) setLogs(prev => prev + chunk);
    };
    socket.on('container:log', onLog);

    // Tell server to start sending logs for this container
    socket.emit('startLogs', { id: containerId });

    return () => {
      socket.emit('stopLogs', { id: containerId });
      socket.off('container:log', onLog);
    };
  }, [containerId]);

  return (
    <div style={{ background: '#111', color: '#eee', padding: 10, height: 300, overflow: 'auto', fontFamily: 'monospace' }}>
      <button onClick={onClose}>Close</button>
      <pre>{logs || 'No logs yet...'}</pre>
    </div>
  );
}
