const http = require('http');
const express = require('express');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));

wss.on('connection', (ws) => {
  console.log("Nouvelle connexion WebSocket établie.");

  ws.on('message', (message) => {
    console.log("Message reçu du client:", message.toString()); // Affiche le message en tant que chaîne pour le débogage

    // Assurez-vous que le message est une chaîne de caractères avant de le relayer
    // Le message (Buffer) doit être converti en string avant d'être renvoyé.
    const messageString = message.toString();

    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        console.log("Relais du message au client.");
        client.send(messageString); // <-- Envoyer la version chaîne du message
      }
    });
  });

  ws.on('close', () => {
    console.log("Connexion WebSocket fermée.");
  });

  ws.on('error', (error) => {
    console.error("Erreur WebSocket:", error);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
