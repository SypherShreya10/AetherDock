import React, { useState } from 'react';
import LogsViewer from './LogsViewer';
import axios from 'axios';

export default function ContainerList({ containers, socket }) {
  const [selectedLogs, setSelectedLogs] = useState(null);

  const control = async (id, action) => {
    try {
      await axios.post(`/api/containers/${id}/${action}`);
      // optional: refetch or rely on socket updates
    } catch (e) {
      alert('Action failed: ' + (e?.response?.data?.error || e.message));
    }
  };

  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Name / Image</th>
            <th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {containers.map(c => (
            <tr key={c.Id}>
              <td>{c.Names?.[0]?.replace('/','') || c.Image}</td>
              <td>{c.State} {c.Status}</td>
              <td>
                <button onClick={() => control(c.Id, 'start')}>Start</button>
                <button onClick={() => control(c.Id, 'stop')}>Stop</button>
                <button onClick={() => control(c.Id, 'restart')}>Restart</button>
                <button onClick={() => setSelectedLogs(c.Id)}>View Logs</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedLogs && (
        <div style={{ marginTop: 20 }}>
          <h3>Logs for {selectedLogs}</h3>
          <LogsViewer containerId={selectedLogs} socket={socket} onClose={() => setSelectedLogs(null)} />
        </div>
      )}
    </div>
  );
}
