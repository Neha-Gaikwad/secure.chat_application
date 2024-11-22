import WebSocket from 'ws';
import readline from 'readline';
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

// Create a readline interface for input from the console
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'You: ' // Custom prompt to indicate the user input
});

const ws = new WebSocket('ws://localhost:8082');  // Ensure this matches the new port

ws.on('open', function open() {
  console.log('Connected to the server');
  const initialMessage = encrypt('Hello, Server!');
  console.log('Message encrypted and safe to send');  // Confirmation message
  ws.send(initialMessage);
  rl.prompt(); // Prompt the user for input
});

ws.on('message', function incoming(data) {
  console.log('Encrypted response received from server:', data.toString());  // Debug message
  const decryptedMessage = decrypt(data.toString());
  console.log('Decrypted server response:', decryptedMessage);  // Debug message
  rl.prompt(); // Prompt the user for input after receiving a message
});

ws.on('close', function close() {
  console.log('Disconnected from the server');
  rl.close(); // Close the readline interface
});

ws.on('error', function error(err) {
  console.error('WebSocket error:', err);
});

// Listen for input from the console
rl.on('line', (input) => {
  const encryptedInput = encrypt(input);
  console.log('Message encrypted and safe to send');  // Confirmation message
  ws.send(encryptedInput); // Send the input to the server
  rl.prompt(); // Prompt the user for more input
});
