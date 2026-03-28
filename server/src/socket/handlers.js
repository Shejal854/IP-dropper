const deviceStore = require('./deviceStore');
const logger = require('../utils/logger');

/**
 * Registers all Socket.io event handlers for a single connection.
 *
 * Responsibilities:
 *  - Device registration and broadcast
 *  - Relaying WebRTC signaling messages (offer / answer / ICE candidates)
 *  - Relaying file metadata before each transfer
 *  - Cleanup on disconnect
 *
 * @param {import('socket.io').Socket} socket
 * @param {import('socket.io').Server} io
 */
function registerHandlers(socket, io) {

  // ── Registration ─────────────────────────────────────────────────────────────
  socket.on('register', ({ name }) => {
    const device = deviceStore.add(socket.id, name);

    // Confirm back to the registering client
    socket.emit('registered', device);

    // Broadcast updated device list to all connected clients
    io.emit('devices', deviceStore.getAll());

    logger.event(`Registered: "${device.name}" (${socket.id.slice(0, 8)}...) — ${deviceStore.count()} device(s) online`);
  });

  // ── WebRTC Signaling ──────────────────────────────────────────────────────────
  // The server never inspects these payloads — it only relays them.
  // Once both peers have exchanged offer/answer/ICE, the P2P connection is
  // established and the server plays no further role in the file transfer.

  // Step 1: Initiator sends an SDP offer to the target
  socket.on('offer', ({ targetId, offer }) => {
    const sender = deviceStore.get(socket.id);
    io.to(targetId).emit('offer', {
      fromId: socket.id,
      fromName: sender?.name,
      offer,
    });
  });

  // Step 2: Target responds with an SDP answer
  socket.on('answer', ({ targetId, answer }) => {
    io.to(targetId).emit('answer', {
      fromId: socket.id,
      answer,
    });
  });

  // Step 3: Both peers exchange ICE candidates for NAT traversal
  socket.on('ice-candidate', ({ targetId, candidate }) => {
    io.to(targetId).emit('ice-candidate', {
      fromId: socket.id,
      candidate,
    });
  });

  // ── File Metadata ─────────────────────────────────────────────────────────────
  // Sent via the signaling channel BEFORE the file chunks arrive over WebRTC,
  // so the receiver knows the filename, size, and MIME type in advance.
  socket.on('file-meta', ({ targetId, meta }) => {
    const sender = deviceStore.get(socket.id);
    io.to(targetId).emit('file-meta', {
      fromId: socket.id,
      fromName: sender?.name,
      meta,
    });
  });

  // ── Disconnect ────────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const device = deviceStore.remove(socket.id);
    io.emit('devices', deviceStore.getAll());
    logger.event(`Disconnected: "${device?.name || socket.id.slice(0, 8)}" — ${deviceStore.count()} device(s) remaining`);
  });
}

module.exports = { registerHandlers };
