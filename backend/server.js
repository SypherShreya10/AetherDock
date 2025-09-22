const express = require("express");
const cors = require("cors");
const {
  listContainers,
  startContainer,
  stopContainer,
  restartContainer,
} = require("./dockerClient");

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

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
    res.json({ message: "Container started" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stop a container
app.post("/api/containers/:id/stop", async (req, res) => {
  try {
    await stopContainer(req.params.id);
    res.json({ message: "Container stopped" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restart a container
app.post("/api/containers/:id/restart", async (req, res) => {
  try {
    await restartContainer(req.params.id);
    res.json({ message: "Container restarted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});
