const timestamp = () => new Date().toISOString().slice(11, 19);

const logger = {
  info:  (msg) => console.log(`[${timestamp()}] INFO  ${msg}`),
  event: (msg) => console.log(`[${timestamp()}] EVENT ${msg}`),
  warn:  (msg) => console.warn(`[${timestamp()}] WARN  ${msg}`),
  error: (msg) => console.error(`[${timestamp()}] ERROR ${msg}`),
};

module.exports = logger;
