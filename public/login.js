document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('/api/authenticate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      // Store token in session storage and redirect to WebSocket client
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('encryption_key', 'your_encryption_key'); // Use the correct encryption key
      window.location.href = 'websocket_client.html'; // Redirect to WebSocket client page
    } else {
      document.getElementById('login-error').textContent = data.message || 'Login failed';
    }
  } catch (error) {
    console.error('Error during authentication:', error);
    document.getElementById('login-error').textContent = 'An error occurred. Please try again.';
  }
});
