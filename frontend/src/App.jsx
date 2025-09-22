import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import ContainerList from './components/ContainerList';

const socket = io('http://localhost:5000'); // direct; proxy also supports

function App() {
  const [containers, setContainers] = useState([]);

  useEffect(() => {
    // initial fetch
    axios.get('/api/containers').then(res => setContainers(res.data)).catch(() => {});
    // listen for live updates
    socket.on('containers:update', (list) => setContainers(list));
    return () => { socket.disconnect(); };
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>AetherDock — Containers</h1>
      <ContainerList containers={containers} socket={socket} />
    </div>
  );
}

export default App;
