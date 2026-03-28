const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const { registerHandlers } = require('./src/socket/handlers');
const logger = require('./src/utils/logger');

// ── App Setup ─────────────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ── Socket.io ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  logger.info(`New connection: ${socket.id.slice(0, 8)}...`);
  registerHandlers(socket, io);
});

// ── Start Server ──────────────────────────────────────────────────────────────
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use.`);
    logger.error('Windows: for /f "tokens=5" %a in (\'netstat -ano ^| findstr :' + PORT + '\') do taskkill /PID %a /F');
    logger.error(`Mac/Linux: lsof -ti:${PORT} | xargs kill -9`);
    process.exit(1);
  }
});

server.listen(PORT, () => {
  logger.info(`IP Dropper server running  →  http://localhost:${PORT}`);
  logger.info(`Health check              →  http://localhost:${PORT}/health`);
});
