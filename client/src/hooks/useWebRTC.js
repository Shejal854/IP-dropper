import { useRef, useState, useCallback } from 'react';
import { WEBRTC_CONFIG, TRANSFER } from '../config';

export function useWebRTC(socket, addToHistory) {
  const peerConnections = useRef({});
  const dataChannels    = useRef({});
  const incomingFiles   = useRef({});

  const [transfers, setTransfers] = useState({});

  const updateTransfer = useCallback((peerId, patch) => {
    setTransfers((prev) => ({
      ...prev,
      [peerId]: { ...prev[peerId], ...patch },
    }));
  }, []);

  const readSlice = (file, offset, chunkSize) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();           
      reader.onload  = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file.slice(offset, offset + chunkSize));
    });

  const createPeerConnection = useCallback((peerId) => {
    if (peerConnections.current[peerId]) {
      return peerConnections.current[peerId];
    }

    const pc = new RTCPeerConnection(WEBRTC_CONFIG);
    peerConnections.current[peerId] = pc;

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socket.emit('ice-candidate', { targetId: peerId, candidate });
      }
    };

    pc.oniceconnectionstatechange = () => {
      const s = pc.iceConnectionState;
      if (s === 'failed' || s === 'disconnected') {
        console.error(`[WebRTC] ICE ${s} for peer ${peerId}. ` +
          'Check STUN config or router AP-isolation settings.');
        updateTransfer(peerId, { status: 'error', progress: 0 });
      }
    };

    pc.ondatachannel = ({ channel }) => {
      setupReceiveChannel(channel, peerId);
    };

    return pc;
  }, [socket, updateTransfer]);   

  const finalizeReceive = useCallback((peerId) => {
    const state = incomingFiles.current[peerId];
    if (!state) return;

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
      if (typeof data === 'string') {
        if (data === 'done') finalizeReceive(peerId);
        return;
      }

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

  const sendFile = useCallback(async (file, targetId, targetName) => {
    const pc      = createPeerConnection(targetId);
    const channel = pc.createDataChannel('fileTransfer');
    channel.binaryType = 'arraybuffer';
    dataChannels.current[targetId] = channel;

    channel.onopen = async () => {
      socket.emit('file-meta', {
        targetId,
        meta: { name: file.name, size: file.size, type: file.type },
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      updateTransfer(targetId, { status: 'sending', progress: 0 });
      const CHUNK_SIZE = TRANSFER.CHUNK_SIZE ?? 16 * 1024;
      let offset = 0;

      while (offset < file.size) {
        while (channel.bufferedAmount > (TRANSFER.BUFFER_THRESHOLD ?? 65536)) {
          await new Promise((r) => setTimeout(r, 50));
        }

        const chunk = await readSlice(file, offset, CHUNK_SIZE);
        channel.send(chunk);
        offset += chunk.byteLength;

        updateTransfer(targetId, {
          status:   'sending',
          progress: Math.round((offset / file.size) * 100),
        });
      }

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