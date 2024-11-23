import express from 'express';
import { WebSocketServer } from 'ws';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import path from 'path';

// Fixed encryption key (32 bytes for AES-256)
const encryptionKey = Buffer.from('12345678901234567890123456789012', 'utf8'); 
const algorithm = 'aes-256-cbc';
const secretKey = 'your_secret_key'; // Replace with your own secret key

const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, encryptionKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

const decrypt = (text) => {
  const [ivHex, encryptedHex] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encryptedText = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, encryptionKey, iv);
  decipher.setAutoPadding(true);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

const app = express();
const port = 8082;
app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

// Simulated user database
const users = {
  'user1': 'password1',
  'user2': 'password2',
  'user3': 'password3'
};

app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

app.post('/api/authenticate', (req, res) => {
  const { username, password } = req.body;
  console.log(`Authentication attempt: username=${username}, password=${password}`);

  if (users[username] && users[username] === password) {
    const token = jwt.sign({ id: username }, secretKey, {
      expiresIn: 86400 // Expires in 24 hours
    });
    console.log('Authentication successful');
    res.status(200).send({ auth: true, token: token });
  } else {
    console.log('Authentication failed: Invalid credentials');
    res.status(401).send('Invalid credentials');
  }
});

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  console.log('Attempting to authenticate client...');
  const token = new URL(req.url, `http://${req.headers.host}`).searchParams.get('token');
  if (!token) {
    console.log('Token missing');
    ws.close(1008, 'Token missing');
    return;
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      console.log('Invalid token', err);
      ws.close(1008, 'Invalid token');
      return;
    }
    console.log('New client connected, user ID:', decoded.id);

    ws.on('message', (data) => {
      try {
        const decryptedMessage = decrypt(data.toString());
        console.log(`Received message: ${data.toString()}`);
        console.log(`Decrypted message from client: ${decryptedMessage}`);

        let responseMessage;
        if (decryptedMessage.toLowerCase().includes('hello')) {
          responseMessage = 'Hi there! How can I help you today?';
        } else if (decryptedMessage.toLowerCase().includes('bye')) {
          responseMessage = 'Goodbye! Have a great day!';
        } else {
          responseMessage = `You said: ${decryptedMessage}`;
        }

        const encryptedResponse = encrypt(responseMessage);
        console.log(`Sending encrypted response: ${encryptedResponse}`);
        ws.send(encryptedResponse);
      } catch (error) {
        console.error('Error during decryption or encryption:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error: ', error);
    });
  });
});
