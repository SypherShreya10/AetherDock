// backend/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const Docker = require('dockerode');

const app = express();
app.use(cors());
app.use(express.json());

const docker = new Docker(); // default: connect to local Docker daemon

// Basic API route to check server
app.get('/api/health', (req, res) => res.json({ ok: true, time: Date.now() }));

// List containers (basic info)
app.get('/api/containers', async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });
    res.json(containers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start / Stop / Restart routes
app.post('/api/containers/:id/start', async (req, res) => {
  try {
    const c = docker.getContainer(req.params.id);
    await c.start();
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/containers/:id/stop', async (req, res) => {
  try {
    const c = docker.getContainer(req.params.id);
    await c.stop();
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/containers/:id/restart', async (req, res) => {
  try {
    const c = docker.getContainer(req.params.id);
    await c.restart();
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Quick logs endpoint (last 200 lines)
app.get('/api/containers/:id/logs', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    container.logs({ stdout: true, stderr: true, tail: 200 }, (err, stream) => {
      if (err) return res.status(500).json({ error: err.message });
      let out = '';
      stream.on('data', (chunk) => out += chunk.toString());
      stream.on('end', () => res.type('text/plain').send(out));
      stream.on('error', (e) => res.status(500).json({ error: e.message }));
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Emit container list periodically to all clients (every 2s)
async function emitContainers() {
  try {
    const list = await docker.listContainers({ all: true });
    io.emit('containers:update', list);
  } catch (e) {
    // ignore
  }
}
setInterval(emitContainers, 2000);

// Socket: subscribe to per-container logs/stats
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // Start streaming logs for a container
  socket.on('startLogs', async ({ id }) => {
    const container = docker.getContainer(id);
    try {
      container.logs({ follow: true, stdout: true, stderr: true, tail: 100 }, (err, stream) => {
        if (err) return socket.emit('log:error', { error: err.message });
        // Forward chunks to the specific socket
        const onData = (chunk) => socket.emit('container:log', { id, chunk: chunk.toString() });
        stream.on('data', onData);
        socket.on('stopLogs', () => {
          stream.removeListener('data', onData);
          try { stream.destroy(); } catch(_) {}
        });
        socket.on('disconnect', () => {
          stream.removeListener('data', onData);
          try { stream.destroy(); } catch(_) {}
        });
      });
    } catch (e) {
      socket.emit('log:error', { error: e.message });
    }
  });

  // simple subscription for stats (polling per-socket)
  socket.on('subscribeStats', ({ id }) => {
    const timer = setInterval(async () => {
      try {
        const container = docker.getContainer(id);
        // request a one-shot stats snapshot
        container.stats({ stream: false }, (err, stream) => {
          if (err) return;
          let buff = '';
          stream.on('data', (c) => buff += c.toString());
          stream.on('end', () => {
            try {
              const json = JSON.parse(buff);
              socket.emit('container:stats', { id, stats: json });
            } catch (_) {}
          });
          stream.on('error', () => {});
        });
      } catch(_) {}
    }, 2000);
    socket.on('unsubscribeStats', () => clearInterval(timer));
    socket.on('disconnect', () => clearInterval(timer));
  });

}); // end io.on

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
