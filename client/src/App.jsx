import { useEffect } from 'react';
import { useSocket } from './context/SocketContext';
import { useDevices, useTransferHistory } from './hooks/useDevices';
import { useWebRTC } from './hooks/useWebRTC';
import DeviceList from './components/DeviceList';
import FileDropZone from './components/FileDropZone';
import TransferHistory from './components/TransferHistory';
import { useState } from 'react';
import './styles/global.css';
import './styles/components.css';

/**
 * App
 *
 * Root component. Wires together:
 *  - SocketContext (connection status)
 *  - useDevices (registration + peer list)
 *  - useWebRTC (signaling + file transfer)
 *  - useTransferHistory (session log)
 *
 * Renders either the onboarding screen or the main transfer UI.
 */
export default function App() {
  const { socket, connected } = useSocket();
  const { myDevice, peers, register, isRegistered } = useDevices();
  const { history, addToHistory } = useTransferHistory();

  const [nameInput,    setNameInput]    = useState('');
  const [selectedPeer, setSelectedPeer] = useState(null);

  const {
    transfers,
    sendFile,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    handleFileMeta,
  } = useWebRTC(socket, addToHistory);

  // Attach WebRTC signaling listeners
  useEffect(() => {
    socket.on('offer',         handleOffer);
    socket.on('answer',        handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('file-meta',     handleFileMeta);

    return () => {
      socket.off('offer',         handleOffer);
      socket.off('answer',        handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('file-meta',     handleFileMeta);
    };
  }, [socket, handleOffer, handleAnswer, handleIceCandidate, handleFileMeta]);

  const handleRegister = () => register(nameInput);

  const handleFileDrop = (file) => {
    if (!selectedPeer) return;
    sendFile(file, selectedPeer.id, selectedPeer.name);
  };

  // ── Onboarding ──────────────────────────────────────────────────────────────
  if (!isRegistered) {
    return (
      <div className="app">
        <div className="onboard-wrapper">
          <div className="onboard-card">
            <div className="onboard-logo">
              <span className="logo-arrow">&#8593;</span>
              <h1>IP Dropper</h1>
            </div>
            <p className="onboard-subtitle">
              Direct file transfer — no cloud, no accounts
            </p>

            <div className="onboard-input-row">
              <input
                className="text-input"
                placeholder="Your device name..."
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                autoFocus
              />
              <button
                className="btn btn--primary"
                onClick={handleRegister}
                disabled={!connected || !nameInput.trim()}
              >
                {connected ? 'Join' : 'Connecting...'}
              </button>
            </div>

            <div className="onboard-status">
              <span className={`status-dot status-dot--${connected ? 'online' : 'offline'}`} />
              <span>{connected ? 'Server reachable' : 'Cannot reach server — is it running?'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main UI ─────────────────────────────────────────────────────────────────
  return (
    <div className="app">
      <header className="header">
        <div className="header-logo">
          <span className="logo-arrow">&#8593;</span>
          <span>IP Dropper</span>
        </div>
        <div className="header-device">
          <span className="status-dot status-dot--online" />
          <span>{myDevice?.name}</span>
        </div>
      </header>

      <main className="main-grid">
        <section className="panel">
          <h2 className="panel-title">Devices on network</h2>
          <DeviceList
            devices={peers}
            selectedPeer={selectedPeer}
            onSelect={setSelectedPeer}
            transfers={transfers}
          />
        </section>

        <section className="panel">
          <h2 className="panel-title">
            {selectedPeer ? `Send to ${selectedPeer.name}` : 'Select a device first'}
          </h2>
          <FileDropZone
            disabled={!selectedPeer}
            onFileDrop={handleFileDrop}
          />
        </section>

        <section className="panel">
          <h2 className="panel-title">Transfer history</h2>
          <TransferHistory history={history} />
        </section>
      </main>
    </div>
  );
}
