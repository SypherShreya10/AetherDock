const express = require("express");
const cors = require("cors");
const Docker = require("dockerode");   // <-- add this line

const app = express();
const docker = new Docker();           // <-- create Docker client
const PORT = 5000;

app.use(cors());
app.use(express.json());

// ---- Existing test route ----
app.get("/", (req, res) => {
  res.json({ message: "Backend is running 🚀" });
});

// ---- Add the Docker route HERE ----
app.get("/containers", async (req, res) => {
  try {
    const list = await docker.listContainers({ all: true });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to list containers" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
