# IP Dropper

> Browser-based peer-to-peer file transfer — no cloud, no accounts, just direct device-to-device transfer over your local network.

![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![WebRTC](https://img.shields.io/badge/WebRTC-native-orange)
![License](https://img.shields.io/badge/license-MIT-blue)

## How It Works

1. A device connects to the server and registers with a name.
2. The server maintains a list of active devices.
3. Devices can discover peers connected to the same server.
4. When a file transfer is initiated, WebRTC establishes a direct connection between peers.
5. The file is transferred directly without passing through the server.



## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite |
| Backend | Node.js, Express, Socket.io |
| P2P Transfer | WebRTC DataChannel (browser-native) |
| Device Discovery | Socket.io rooms |

## Project Structure

```bash
ip-dropper/
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── context/            # React context providers
│   │   ├── utils/              # Pure helper functions
│   │   ├── styles/             # CSS modules / global styles
│   │   └── config/             # App-wide constants
│   ├── index.html
│   └── vite.config.js
└── server/
    ├── src/
    │   ├── socket/             # Socket.io event handlers
    │   └── utils/              # Server utilities
    └── index.js                # Entry point

```

## Getting Started

### Prerequisites
- Node.js v18+
- npm v9+

### Installation

```bash
# 1. Clone or download the project
cd ip-dropper

# 2. Start the signaling server
cd server
npm install
npm run dev

# 3. In a new terminal, start the client
cd client
npm install
npm run dev
```

Open `http://localhost:3000` in two browser tabs, give each a name, select the other device, and drop a file.

### Testing Across Devices (Same WiFi)

Find your machine's local IP:
- **Windows:** `ipconfig` → look for IPv4 Address
- **Mac/Linux:** `ifconfig` → look for `inet`

Then open `http://YOUR_IP:3000` on any other device on the same network.

## License

This project is open-source and available for educational and personal use.

## Author

Shejal Yadav
