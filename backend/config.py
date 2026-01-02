"""Configuration settings for the backend."""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Base directory
BASE_DIR = Path(__file__).resolve().parent

# Upload directory
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Tesseract path (Windows)
# Update this path if Tesseract is installed elsewhere
TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# CORS origins
CORS_ORIGINS = [
    "http://localhost:8081",
    "http://localhost:19000",
    "http://localhost:19006",
    "exp://localhost:8081",
    "*",  # Allow all for development
]

# Supported languages for OCR
OCR_LANGUAGES = ["en", "kan"]  # English and Kannada

# Gooey AI Configuration
# Get your API key from https://gooey.ai
GOOEY_AI_API_KEY = os.getenv("GOOEY_AI_API_KEY", "")
GOOEY_AI_BASE_URL = "https://api.gooey.ai/v2"
FARMERCHAT_MODEL = "FarmerCHAT"  # Or the specific model ID for FarmerCHAT

