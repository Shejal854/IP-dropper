const deviceStore = require('./deviceStore');
const logger = require('../utils/logger');

function registerHandlers(socket, io) {

  // ──Reguster device
  socket.on('register', ({ name }) => {
    const device = deviceStore.add(socket.id, name);

    socket.emit('registered', device);
    io.emit('devices', deviceStore.getAll());

    logger.event(`Registered: "${device.name}" (${socket.id.slice(0, 8)}...) — ${deviceStore.count()} device(s) online`);
  });

  // ── WebRTC Signaling (relay only)
  socket.on('offer', ({ targetId, offer }) => {
    const sender = deviceStore.get(socket.id);
    io.to(targetId).emit('offer', {
      fromId: socket.id,
      fromName: sender?.name,
      offer,
    });
  });

  socket.on('answer', ({ targetId, answer }) => {
    io.to(targetId).emit('answer', {
      fromId: socket.id,
      answer,
    });
  });

  socket.on('ice-candidate', ({ targetId, candidate }) => {
    io.to(targetId).emit('ice-candidate', {
      fromId: socket.id,
      candidate,
    });
  });

// File metadata before transfer
  socket.on('file-meta', ({ targetId, meta }) => {
    const sender = deviceStore.get(socket.id);
    io.to(targetId).emit('file-meta', {
      fromId: socket.id,
      fromName: sender?.name,
      meta,
    });
  });

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    const device = deviceStore.remove(socket.id);
    io.emit('devices', deviceStore.getAll());
    logger.event(`Disconnected: "${device?.name || socket.id.slice(0, 8)}" — ${deviceStore.count()} device(s) remaining`);
  });
}

module.exports = { registerHandlers };
