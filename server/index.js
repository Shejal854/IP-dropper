require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const { registerHandlers } = require('./src/socket/handlers');
const logger = require('./src/utils/logger');


const app = express();
const server = http.createServer(app);

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
const PORT = process.env.PORT || 3001;


app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());


app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});


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

server.listen(PORT, () => {
  logger.info(`IP Dropper server running  →  http://localhost:${PORT}`);
  logger.info(`Health check              →  http://localhost:${PORT}/health`);
});
