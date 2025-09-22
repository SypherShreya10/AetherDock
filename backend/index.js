const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Hello from backend 🚀" });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});

const Docker = require('dockerode');
const docker = new Docker(); // connects to local Docker
app.get("/containers", async (req,res)=>{
  const list = await docker.listContainers({ all: true });
  res.json(list);
});