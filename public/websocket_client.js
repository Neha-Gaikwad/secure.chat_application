document.addEventListener('DOMContentLoaded', () => {
  const token = sessionStorage.getItem('token');

  if (!token) {
    alert('Not authenticated. Redirecting to login page.');
    window.location.href = 'index.html'; // Redirect to login page if not authenticated
    return;
  }

  const ws = new WebSocket(`ws://localhost:8082?token=${token}`);

  ws.onopen = () => {
    console.log('Connected to the server');
    document.getElementById('messages').innerHTML += `<p>Connected to the server</p>`;
  };

  ws.onmessage = async (event) => {
    try {
      const encryptedMessage = event.data;
      const decryptedMessage = await decryptMessage(encryptedMessage);
      console.log('Decrypted server response:', decryptedMessage);
      document.getElementById('messages').innerHTML += `<p>Server: ${decryptedMessage}</p>`;
    } catch (error) {
      console.error('Error decrypting server message:', error);
    }
  };

  ws.onclose = () => {
    console.log('Disconnected from the server');
    document.getElementById('messages').innerHTML += `<p>Disconnected from the server</p>`;
  };

  ws.onerror = (err) => {
    console.error('WebSocket error:', err);
  };

  document.getElementById('message-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('message');
    const message = input.value;
    try {
      const encryptedMessage = await encryptMessage(message);
      ws.send(encryptedMessage);
      document.getElementById('messages').innerHTML += `<p>You: ${message}</p>`;
      input.value = '';
    } catch (error) {
      console.error('Error encrypting message:', error);
    }
  });

  const encryptMessage = async (message) => {
    const keyString = '12345678901234567890123456789012'; // Ensure this matches the server key

    const key = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(keyString),
      'AES-CBC',
      false,
      ['encrypt']
    );

    const iv = window.crypto.getRandomValues(new Uint8Array(16));

    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-CBC', iv: iv },
      key,
      new TextEncoder().encode(message)
    );

    const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
    const encryptedHex = Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join('');
    return ivHex + ':' + encryptedHex;
  };

  const decryptMessage = async (message) => {
    const [ivHex, encryptedHex] = message.split(':');
    const iv = new Uint8Array(ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const keyString = '12345678901234567890123456789012'; // Ensure this matches the server key

    const key = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(keyString),
      'AES-CBC',
      false,
      ['decrypt']
    );

    const encryptedText = new Uint8Array(encryptedHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-CBC', iv: iv },
      key,
      encryptedText
    );

    return new TextDecoder().decode(decrypted);
  };
});
