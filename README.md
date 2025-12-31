# GKVK Soil Analysis App

A full-stack mobile application for farmers to analyze soil health cards and receive crop recommendations.

## Project Structure

```
root/
├── frontend/     # Expo React Native app
├── backend/      # FastAPI Python server
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+ (LTS)
- Python 3.10 or 3.11
- Expo account (for EAS builds)
- EAS CLI (`npm install -g eas-cli`)

---

## Backend Setup

```powershell
cd backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: `http://localhost:8000`
API docs at: `http://localhost:8000/docs`

---

## Frontend Setup

```powershell
cd frontend

# Install dependencies
npm install

# Install Expo packages (MUST use npx expo install)
npx expo install expo-camera expo-image-picker expo-speech expo-router expo-constants expo-linking expo-status-bar react-native-safe-area-context react-native-screens react-native-gesture-handler

# Login to Expo
npx eas login

# Build for Android (development)
npx eas build -p android --profile development

# Run with dev client (after installing build on device)
npx expo start --dev-client
```

---

## EAS Build Commands

```powershell
# Development build (for testing)
npx eas build -p android --profile development

# Preview build (APK for internal testing)
npx eas build -p android --profile preview

# Production build (AAB for Play Store)
npx eas build -p android --profile production
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/crops` | List available crops |
| POST | `/upload` | Upload soil card image |
| POST | `/analyze` | Analyze uploaded image |
| GET | `/recommendation/{crop_id}` | Get recommendations |

---

## Environment Variables

### Frontend (`frontend/.env`)
```
EXPO_PUBLIC_API_URL=http://YOUR_BACKEND_IP:8000
```

### Backend
Configure in `backend/config.py`

---

## Notes

- Frontend uses Expo Router (file-based routing)
- Backend uses pytesseract for OCR (Tesseract must be installed)
- All text supports Kannada language
- No paid APIs required

