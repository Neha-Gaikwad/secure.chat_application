import express from 'express';
import { WebSocketServer } from 'ws';
import crypto from 'crypto';
import fs from 'fs';

// Load the encryption key
const key = fs.readFileSync('encryption_key.key');  // Ensure this is 32 bytes long
const algorithm = 'aes-256-cbc';

const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

const decrypt = (text) => {
  const [ivHex, encryptedHex] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encryptedText = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const app = express();
const port = 8082;  // Changed port to avoid conflict

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (data) => {
    console.log('Encrypted data received from client:', data.toString());
    const decryptedMessage = decrypt(data.toString());
    console.log('Decrypted data from client:', decryptedMessage);

    const responseMessage = 'Message received successfully!';
    const encryptedResponse = encrypt(responseMessage);
    console.log('Sending encrypted response to client:', encryptedResponse);
    ws.send(encryptedResponse);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error: ', error);
  });
});
