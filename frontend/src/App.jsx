import React, { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import AetherDock from "./components/AetherDock";

const socket = io("http://localhost:5000"); // backend

function App() {
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initial fetch
    axios.get("/api/containers")
      .then(res => {
        setContainers(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch containers:", err);
        setError("Failed to connect to backend");
        setLoading(false);
      });

    // Listen for container updates
    socket.on("containers:update", (list) => {
      console.log("Received container updates:", list);
      setContainers(list);
    });

    // Listen for individual container updates
    socket.on("container:status", (update) => {
      console.log("Container status update:", update);
      setContainers(prev => prev.map(container => 
        container.id === update.id ? { ...container, ...update } : container
      ));
    });

    // Listen for real-time metrics
    socket.on("container:metrics", (metrics) => {
      setContainers(prev => prev.map(container => 
        container.id === metrics.id 
          ? { ...container, cpu: metrics.cpu, memory: metrics.memory, network: metrics.network }
          : container
      ));
    });

    // Connection status
    socket.on("connect", () => {
      console.log("Connected to backend");
      setError(null);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from backend");
      setError("Connection lost");
    });

    socket.on("connect_error", (err) => {
      console.error("Connection error:", err);
      setError("Failed to connect to backend");
    });

    return () => {
      socket.off("containers:update");
      socket.off("container:status");
      socket.off("container:metrics");
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.disconnect();
    };
  }, []);

  // Container action handler
  const handleContainerAction = async (containerId, action) => {
    try {
      const response = await axios.post(`/api/containers/${containerId}/${action}`);
      
      if (response.data.success) {
        console.log(`${action} action successful for container ${containerId}`);
        // Emit socket event to request updated container list
        socket.emit("containers:refresh");
      }
      
      return response.data;
    } catch (error) {
      console.error(`Failed to ${action} container ${containerId}:`, error);
      setError(`Failed to ${action} container`);
      throw error;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold">Loading AetherDock...</h2>
          <p className="text-gray-400">Connecting to container runtime</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && containers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center bg-red-900/20 border border-red-500/30 rounded-xl p-8 max-w-md">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-red-400 mb-2">Connection Error</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <AetherDock 
      containers={containers}
      socket={socket}
      onContainerAction={handleContainerAction}
      connectionError={error}
    />
  );
}

export default App;