/**
 * In-memory store for currently connected devices.
 * Keyed by socket.id → { id, name, joinedAt }
 *
 * Intentionally not persisted — device presence is ephemeral.
 * When a device disconnects, it is immediately removed.
 */
const devices = new Map();

const deviceStore = {
  add(socketId, name) {
    const device = {
      id: socketId,
      name: name || `Device-${socketId.slice(0, 5)}`,
      joinedAt: Date.now(),
    };
    devices.set(socketId, device);
    return device;
  },

  remove(socketId) {
    const device = devices.get(socketId);
    devices.delete(socketId);
    return device;
  },

  get(socketId) {
    return devices.get(socketId);
  },

  getAll() {
    return Array.from(devices.values());
  },

  count() {
    return devices.size;
  },
};

module.exports = deviceStore;
