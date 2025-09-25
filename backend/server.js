import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { listContainers, startContainer, stopContainer, restartContainer } from "./dockerClient.js"; 

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// HTTP + WebSocket setup
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Broadcast container list to all clients
async function broadcastContainers() {
  const containers = await listContainers(true);
  io.emit("containers:update", containers);
}

// --- ROUTES ---

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// Get all containers
app.get("/api/containers", async (req, res) => {
  try {
    const containers = await listContainers(true);
    res.json(containers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start a container
app.post("/api/containers/:id/start", async (req, res) => {
  try {
    await startContainer(req.params.id);
    await broadcastContainers();
    res.json({ message: "Container started" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stop a container
app.post("/api/containers/:id/stop", async (req, res) => {
  try {
    await stopContainer(req.params.id);
    await broadcastContainers();
    res.json({ message: "Container stopped" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restart a container
app.post("/api/containers/:id/restart", async (req, res) => {
  try {
    await restartContainer(req.params.id);
    await broadcastContainers();
    res.json({ message: "Container restarted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Start server ---
server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
