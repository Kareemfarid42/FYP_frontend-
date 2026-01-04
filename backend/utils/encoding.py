import base64
import hashlib
from typing import Optional

# Secret key for XOR encryption (should be in .env in production)
# This adds an extra layer of obfuscation beyond base64
SECRET_KEY = "your-secret-encoding-key-12345"  # TODO: Move to config.py


def encode_id(id: int) -> str:
    """
    Encode an integer ID to a URL-safe obfuscated string
    
    Process:
    1. Convert ID to bytes
    2. XOR with secret key for obfuscation
    3. Base64 encode
    4. Make URL-safe (replace +/= with -_~)
    
    Example: 1 -> "a8f3n9x2"
    """
    try:
        # Step 1: Convert ID to bytes (8 bytes for consistent length)
        id_bytes = id.to_bytes(8, byteorder='big')
        
        # Step 2: XOR with secret key for obfuscation
        key_hash = hashlib.sha256(SECRET_KEY.encode()).digest()
        xor_bytes = bytes(a ^ b for a, b in zip(id_bytes, key_hash[:8]))
        
        # Step 3: Base64 encode
        b64_encoded = base64.b64encode(xor_bytes).decode('utf-8')
        
        # Step 4: Make URL-safe (replace characters)
        url_safe = b64_encoded.replace('+', '-').replace('/', '_').replace('=', '~')
        
        return url_safe
        
    except Exception as e:
        raise ValueError(f"Failed to encode ID: {str(e)}")


def decode_id(encoded_id: str) -> int:
    """
    Decode an obfuscated string back to integer ID
    
    Reverses the encoding process
    
    Returns:
        int: Original ID
    
    Raises:
        ValueError: If decoding fails (invalid format, tampered data)
    """
    try:
        # Step 1: Reverse URL-safe conversion
        b64_encoded = encoded_id.replace('-', '+').replace('_', '/').replace('~', '=')
        
        # Step 2: Base64 decode
        xor_bytes = base64.b64decode(b64_encoded)
        
        # Step 3: Reverse XOR with secret key
        key_hash = hashlib.sha256(SECRET_KEY.encode()).digest()
        id_bytes = bytes(a ^ b for a, b in zip(xor_bytes, key_hash[:8]))
        
        # Step 4: Convert bytes back to integer
        decoded_id = int.from_bytes(id_bytes, byteorder='big')
        
        # Sanity check: ID should be positive and reasonable
        if decoded_id < 0 or decoded_id > 2**31:
            raise ValueError("Decoded ID out of valid range")
        
        return decoded_id
        
    except Exception as e:
        raise ValueError(f"Invalid or tampered ID: {str(e)}")


def validate_encoded_id(encoded_id: Optional[str]) -> bool:
    """
    Check if an encoded ID is valid without decoding
    
    Returns:
        bool: True if valid format, False otherwise
    """
    if not encoded_id or not isinstance(encoded_id, str):
        return False
    
    # Check length (base64 of 8 bytes = ~11-12 chars)
    if len(encoded_id) < 8 or len(encoded_id) > 20:
        return False
    
    # Check allowed characters (alphanumeric + - _ ~)
    allowed_chars = set('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_~')
    if not all(c in allowed_chars for c in encoded_id):
        return False
    
    # Try to decode (will raise error if invalid)
    try:
        decode_id(encoded_id)
        return True
    except ValueError:
        return False


# Test the encoding (can remove in production)
if __name__ == "__main__":
    # Test encoding/decoding
    test_ids = [1, 2, 10, 100, 999, 12345]
    
    print("Testing ID Encoding/Decoding:")
    print("-" * 50)
    
    for id in test_ids:
        encoded = encode_id(id)
        decoded = decode_id(encoded)
        
        print(f"ID: {id:6d} -> Encoded: {encoded:12s} -> Decoded: {decoded:6d} ✓" if id == decoded else f"❌ FAILED")
    
    print("-" * 50)
    
    # Test invalid decoding
    try:
        decode_id("invalid_id_123")
        print("❌ Should have raised error for invalid ID")
    except ValueError:
        print("✓ Invalid ID correctly rejected")