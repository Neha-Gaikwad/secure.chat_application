document.getElementById('encrypt-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = document.getElementById('encrypt-file').files[0];
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/encrypt-file', {
    method: 'POST',
    body: formData,
  });

  if (response.ok) {
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'encrypted-file.enc';
    link.click();
  }
});

document.getElementById('decrypt-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = document.getElementById('decrypt-file').files[0];
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/decrypt-file', {
    method: 'POST',
    body: formData,
  });

  if (response.ok) {
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'decrypted-file';
    link.click();
  }
});
