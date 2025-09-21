# Vercel Python API entry point
import sys
import os
from pathlib import Path

# Add the server directory to Python path
server_path = Path(__file__).parent.parent / "server"
sys.path.insert(0, str(server_path))

# Import the FastAPI app
from app import app

# Export the app for Vercel
handler = app
