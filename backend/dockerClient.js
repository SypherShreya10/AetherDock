const Docker = require("dockerode");

// Connect to Docker via socket
const docker = new Docker({ socketPath: "/var/run/docker.sock" });

// List containers
async function listContainers(all = true) {
  return await docker.listContainers({ all });
}

// Start a container
async function startContainer(id) {
  const container = docker.getContainer(id);
  return await container.start();
}

// Stop a container
async function stopContainer(id) {
  const container = docker.getContainer(id);
  return await container.stop();
}

// Restart a container
async function restartContainer(id) {
  const container = docker.getContainer(id);
  return await container.restart();
}

module.exports = {
  listContainers,
  startContainer,
  stopContainer,
  restartContainer,
};
