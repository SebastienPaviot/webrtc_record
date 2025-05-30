const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const ws = new WebSocket(`ws://${location.host}`);
const peerConnection = new RTCPeerConnection();
let localStream;
let mediaRecorder;
let recordedChunks = [];

navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
  localStream = stream;
  localVideo.srcObject = stream;
  stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
});

peerConnection.ontrack = event => {
  remoteVideo.srcObject = event.streams[0];
};

peerConnection.onicecandidate = event => {
  if (event.candidate) ws.send(JSON.stringify({ candidate: event.candidate }));
};

ws.onmessage = async (message) => {
  const data = JSON.parse(message.data);
  if (data.offer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    ws.send(JSON.stringify({ answer }));
  } else if (data.answer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
  } else if (data.candidate) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
  }
};

peerConnection.createOffer().then(offer => {
  return peerConnection.setLocalDescription(offer);
}).then(() => {
  ws.send(JSON.stringify({ offer: peerConnection.localDescription }));
});

document.getElementById('startRecord').onclick = () => {
  mediaRecorder = new MediaRecorder(localStream);
  recordedChunks = [];
  mediaRecorder.ondataavailable = e => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };
  mediaRecorder.start();
};

document.getElementById('stopRecord').onclick = () => {
  mediaRecorder.stop();
  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recording.webm';
    a.click();
  };
};
