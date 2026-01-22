"""Configuration settings for the backend."""

import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory
BASE_DIR = Path(__file__).resolve().parent

# Load environment variables from .env file
# Explicitly load from backend/.env file
# load_dotenv() reads the .env file and loads variables into the system environment
env_path = BASE_DIR / ".env"
load_dotenv(dotenv_path=env_path)

# Upload directory
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Detect if running in production (cloud platforms)
IS_PRODUCTION = bool(
    os.getenv("RAILWAY_ENVIRONMENT") 
    or os.getenv("RENDER") 
    or os.getenv("DYNO")  # Heroku
    or os.getenv("FLY_APP_NAME")  # Fly.io
    or os.getenv("VERCEL")  # Vercel
    or os.getenv("SPACE_ID")  # Hugging Face Spaces
)

# Tesseract path - only for local development
# In production, use EasyOCR (no Tesseract needed)
if IS_PRODUCTION:
    TESSERACT_PATH = None  # EasyOCR will be used automatically
else:
    # Local development - Windows path
    TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# CORS origins
# Get production URL from environment variable
PRODUCTION_URL = os.getenv("PRODUCTION_URL", "")
IS_HUGGINGFACE = bool(os.getenv("SPACE_ID"))  # Hugging Face Spaces

CORS_ORIGINS = [
    "http://localhost:8081",
    "http://localhost:19000",
    "http://localhost:19006",
    "exp://localhost:8081",
]

# Add production URL if set
if PRODUCTION_URL:
    CORS_ORIGINS.extend([
        PRODUCTION_URL,
        PRODUCTION_URL.replace("https://", "exp://"),
    ])

# For Hugging Face Spaces or development, allow all origins
# This is required for Expo mobile app to connect
if IS_HUGGINGFACE or not IS_PRODUCTION:
    CORS_ORIGINS.append("*")

# Supported languages for OCR
OCR_LANGUAGES = ["en", "kan"]  # English and Kannada

# Gooey AI Configuration
# Get your API key from https://gooey.ai
# os.getenv() reads from:
#   1. Variables loaded from .env file (by load_dotenv() above)
#   2. System environment variables (set in console/terminal)
#   3. System-wide environment variables
# This is equivalent to process.env in Node.js
GOOEY_AI_API_KEY = os.getenv("GOOEY_AI_API_KEY", "")
GOOEY_AI_BASE_URL = "https://api.gooey.ai/v2"
# This should be the example_id from your Gooey AI dashboard
# Find it in the API endpoint URL: /v2/video-bots?example_id=YOUR_ID_HERE
FARMERCHAT_MODEL = "ktdv7wi1h578"  # Update this with your example_id from the dashboard

# Verify API key is loaded from .env file (for debugging)
# Note: In Python, os.getenv() is equivalent to process.env in Node.js
if not GOOEY_AI_API_KEY:
    import warnings
    warnings.warn(
        f"GOOEY_AI_API_KEY not found. Check .env file at: {env_path}",
        UserWarning
    )

