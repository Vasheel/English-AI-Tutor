# server/debug_env.py
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

print("=== Environment Debug ===")
print(f"Python version: {sys.version}")
print(f"Current working directory: {os.getcwd()}")
print(f"Script location: {__file__}")
print()

# Check if .env file exists
server_dir = Path(__file__).parent
env_file = server_dir / '.env'
print(f"Looking for .env at: {env_file.absolute()}")
print(f".env file exists: {env_file.exists()}")

if env_file.exists():
    print(f".env file size: {env_file.stat().st_size} bytes")
    
    # Read the raw content
    print("\n=== Raw .env Content (first 200 chars) ===")
    with open(env_file, 'rb') as f:
        raw_content = f.read(200)
        print(f"Raw bytes: {raw_content[:50]}")
        
    # Check for BOM
    with open(env_file, 'rb') as f:
        first_bytes = f.read(3)
        if first_bytes == b'\xef\xbb\xbf':
            print("⚠️  WARNING: File has UTF-8 BOM!")
        else:
            print("✓ No BOM detected")
    
    # Try reading as text
    try:
        with open(env_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            print(f"\nNumber of lines in .env: {len(lines)}")
            for i, line in enumerate(lines[:5]):  # Show first 5 lines
                # Mask the API key for security
                if 'OPENAI_API_KEY' in line and '=' in line:
                    key_part = line.split('=')[1].strip()
                    masked = key_part[:7] + '...' + key_part[-4:] if len(key_part) > 11 else '***'
                    print(f"Line {i+1}: OPENAI_API_KEY={masked}")
                else:
                    print(f"Line {i+1}: {line.strip()}")
    except Exception as e:
        print(f"Error reading .env as text: {e}")

print("\n=== Testing dotenv Loading ===")

# Method 1: Default load
load_dotenv()
key1 = os.getenv("OPENAI_API_KEY")
print(f"Method 1 (default): {'Found' if key1 else 'Not found'}")

# Method 2: Explicit path
load_dotenv(dotenv_path=env_file, override=True)
key2 = os.getenv("OPENAI_API_KEY")
print(f"Method 2 (explicit path): {'Found' if key2 else 'Not found'}")

# Method 3: Force reload with encoding
load_dotenv(dotenv_path=env_file, override=True, encoding='utf-8')
key3 = os.getenv("OPENAI_API_KEY")
print(f"Method 3 (utf-8 encoding): {'Found' if key3 else 'Not found'}")

print("\n=== Final Check ===")
final_key = os.getenv("OPENAI_API_KEY")
if final_key:
    print(f"✅ OPENAI_API_KEY loaded successfully!")
    print(f"   - Starts with 'sk-': {final_key.startswith('sk-')}")
    print(f"   - Length: {len(final_key)} characters")
    print(f"   - First 7 chars: {final_key[:7]}...")
else:
    print("❌ OPENAI_API_KEY still not loaded")
    print("\nAll environment variables starting with 'OPEN':")
    for key in os.environ:
        if 'OPEN' in key.upper():
            print(f"  - {key}: {os.environ[key][:20]}...")