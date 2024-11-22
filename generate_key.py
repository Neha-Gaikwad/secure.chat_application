import os

# Generate a 32-byte key for AES-256-CBC
aes_key = os.urandom(32)

# Save the AES key to a file
with open("encryption_key.key", "wb") as key_file:
    key_file.write(aes_key)

print(f"Key saved to 'encryption_key.key'")
