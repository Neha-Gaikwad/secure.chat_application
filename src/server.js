import express from 'express';
import crypto from 'crypto';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const app = express();
const port = 8082;

// AES Configuration
const encryptionKey = Buffer.from('12345678901234567890123456789012', 'utf8'); // 32 bytes
const algorithm = 'aes-256-cbc';

// Multer Setup for File Uploads
const upload = multer({ dest: 'uploads/' });

// Serve static files from public directory
app.use(express.static(path.join(process.cwd(), 'public')));

// Default route to serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'websocket_client.html'));
});

// Utility Functions for File Encryption and Decryption
const encryptFile = (inputFile, outputFile) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, encryptionKey, iv);

  const input = fs.createReadStream(inputFile);
  const output = fs.createWriteStream(outputFile);

  output.write(iv); // Prepend IV
  input.pipe(cipher).pipe(output);

  return new Promise((resolve, reject) => {
    output.on('finish', () => resolve('File encrypted successfully.'));
    output.on('error', reject);
  });
};

const decryptFile = (inputFile, outputFile) => {
  return new Promise((resolve, reject) => {
    const input = fs.createReadStream(inputFile);
    const iv = Buffer.alloc(16);

    input.once('readable', () => {
      const chunk = input.read(iv.length);
      if (chunk) {
        iv.set(chunk);
        const decipher = crypto.createDecipheriv(algorithm, encryptionKey, iv);
        const output = fs.createWriteStream(outputFile);  // Define output here

        input.pipe(decipher).pipe(output);

        output.on('finish', () => resolve('File decrypted successfully.'));
        output.on('error', reject);
      }
    });

    input.on('error', reject);
  });
};

// API Endpoints
app.post('/api/encrypt-file', upload.single('file'), async (req, res) => {
  const { file } = req;
  const outputPath = `encrypted/${file.originalname}.enc`;

  try {
    if (!fs.existsSync('encrypted')) fs.mkdirSync('encrypted');
    await encryptFile(file.path, outputPath);
    res.download(outputPath, `${file.originalname}.enc`);
  } catch (error) {
    console.error('Error encrypting file:', error);
    res.status(500).send('File encryption failed');
  }
});

app.post('/api/decrypt-file', upload.single('file'), async (req, res) => {
  const { file } = req;
  const outputPath = `decrypted/${file.originalname.replace('.enc', '')}`;

  try {
    if (!fs.existsSync('decrypted')) fs.mkdirSync('decrypted');
    await decryptFile(file.path, outputPath);
    res.download(outputPath, file.originalname.replace('.enc', ''));
  } catch (error) {
    console.error('Error decrypting file:', error);
    res.status(500).send('File decryption failed');
  }
});

// Start the Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
