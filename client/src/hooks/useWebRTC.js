import { useRef, useState, useCallback } from 'react';
import { WEBRTC_CONFIG, TRANSFER } from '../config';

/**
 * useWebRTC
 *
 * Manages all WebRTC peer connections and file transfer logic.
 *
 * Responsibilities:
 *  - Creating and tracking RTCPeerConnection instances per peer
 *  - Sending files in chunks over RTCDataChannel
 *  - Receiving and reassembling incoming file chunks
 *  - Reporting live transfer progress per peer
 *
 * @param {import('socket.io-client').Socket} socket
 * @param {(entry: object) => void} addToHistory
 */
export function useWebRTC(socket, addToHistory) {
  const peerConnections = useRef({});  // peerId → RTCPeerConnection
  const dataChannels    = useRef({});  // peerId → RTCDataChannel
  const incomingFiles   = useRef({});  // peerId → { meta, receivedChunks, receivedSize }

  const [transfers, setTransfers] = useState({}); // peerId → { status, progress }

  // ── Internal Helpers ────────────────────────────────────────────────────────

  const updateTransfer = useCallback((peerId, patch) => {
    setTransfers((prev) => ({
      ...prev,
      [peerId]: { ...prev[peerId], ...patch },
    }));
  }, []);

  const createPeerConnection = useCallback((peerId) => {
    if (peerConnections.current[peerId]) {
      return peerConnections.current[peerId];
    }

    const pc = new RTCPeerConnection(WEBRTC_CONFIG);
    peerConnections.current[peerId] = pc;

    // Relay discovered ICE candidates to the remote peer via signaling server
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socket.emit('ice-candidate', { targetId: peerId, candidate });
      }
    };

    // When the remote peer opens a data channel toward us (they are the initiator)
    pc.ondatachannel = ({ channel }) => {
      setupReceiveChannel(channel, peerId);
    };

    return pc;
  }, [socket]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Receive Side ────────────────────────────────────────────────────────────

  const finalizeReceive = useCallback((peerId) => {
    const state = incomingFiles.current[peerId];
    if (!state) return;

    // Reassemble chunks into a Blob and trigger browser download
    const blob = new Blob(state.receivedChunks, { type: state.meta.type });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = state.meta.name;
    a.click();
    URL.revokeObjectURL(url);

    addToHistory({
      direction: 'received',
      fileName:  state.meta.name,
      fileSize:  state.meta.size,
      peerName:  state.meta.fromName,
      timestamp: Date.now(),
    });

    updateTransfer(peerId, { status: 'done', progress: 100 });
    delete incomingFiles.current[peerId];
  }, [addToHistory, updateTransfer]);

  const setupReceiveChannel = useCallback((channel, peerId) => {
    dataChannels.current[peerId] = channel;
    channel.binaryType = 'arraybuffer';

    channel.onopen = () => {
      updateTransfer(peerId, { status: 'receiving', progress: 0 });
    };

    channel.onmessage = ({ data }) => {
      // String messages are control signals
      if (typeof data === 'string') {
        if (data === 'done') finalizeReceive(peerId);
        return;
      }

      // Binary data — accumulate chunk
      const state = incomingFiles.current[peerId];
      if (!state) return;

      state.receivedChunks.push(data);
      state.receivedSize += data.byteLength;

      updateTransfer(peerId, {
        status:   'receiving',
        progress: Math.round((state.receivedSize / state.meta.size) * 100),
      });
    };
  }, [finalizeReceive, updateTransfer]);

  // ── Signaling Handlers (called by App via socket events) ────────────────────

  const handleOffer = useCallback(async ({ fromId, offer }) => {
    const pc = createPeerConnection(fromId);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit('answer', { targetId: fromId, answer });
  }, [createPeerConnection, socket]);

  const handleAnswer = useCallback(async ({ fromId, answer }) => {
    const pc = peerConnections.current[fromId];
    if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
  }, []);

  const handleIceCandidate = useCallback(async ({ fromId, candidate }) => {
    const pc = peerConnections.current[fromId];
    if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }, []);

  const handleFileMeta = useCallback(({ fromId, fromName, meta }) => {
    incomingFiles.current[fromId] = {
      meta: { ...meta, fromName },
      receivedChunks: [],
      receivedSize: 0,
    };
    updateTransfer(fromId, { status: 'waiting', progress: 0 });
  }, [updateTransfer]);

  // ── Send Side ───────────────────────────────────────────────────────────────

  const sendFile = useCallback(async (file, targetId, targetName) => {
    const pc      = createPeerConnection(targetId);
    const channel = pc.createDataChannel('fileTransfer');
    channel.binaryType = 'arraybuffer';
    dataChannels.current[targetId] = channel;

    // Notify receiver of incoming file metadata via signaling server
    socket.emit('file-meta', {
      targetId,
      meta: { name: file.name, size: file.size, type: file.type },
    });

    channel.onopen = async () => {
      updateTransfer(targetId, { status: 'sending', progress: 0 });

      const buffer = await file.arrayBuffer();
      let offset = 0;

      while (offset < buffer.byteLength) {
        // Back-pressure: wait if the send buffer is too full
        if (channel.bufferedAmount > TRANSFER.BUFFER_THRESHOLD) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        const chunk = buffer.slice(offset, offset + TRANSFER.CHUNK_SIZE);
        channel.send(chunk);
        offset += chunk.byteLength;

        updateTransfer(targetId, {
          progress: Math.round((offset / buffer.byteLength) * 100),
        });
      }

      // Signal transfer completion
      channel.send('done');

      addToHistory({
        direction: 'sent',
        fileName:  file.name,
        fileSize:  file.size,
        peerName:  targetName,
        timestamp: Date.now(),
      });

      updateTransfer(targetId, { status: 'done', progress: 100 });
    };

    // Initiate WebRTC handshake
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('offer', { targetId, offer });
  }, [createPeerConnection, socket, updateTransfer, addToHistory]);

  return {
    transfers,
    sendFile,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    handleFileMeta,
  };
}
