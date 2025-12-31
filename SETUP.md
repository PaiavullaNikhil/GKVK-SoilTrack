# GKVK App - Complete Setup Guide

## Prerequisites

Before starting, ensure you have:

1. **Node.js 18+** (LTS version)
   - Download: https://nodejs.org/

2. **Python 3.10 or 3.11**
   - Download: https://www.python.org/downloads/

3. **Expo Account**
   - Create at: https://expo.dev/signup

4. **EAS CLI**
   ```powershell
   npm install -g eas-cli
   ```

5. **Tesseract OCR** (for backend OCR)
   - Download: https://github.com/UB-Mannheim/tesseract/wiki
   - Install to: `C:\Program Files\Tesseract-OCR`
   - Add Kannada language data if needed

---

## Step 1: Clone/Setup Project Structure

Your project should have this structure:
```
GKVK-app/
├── frontend/
├── backend/
├── README.md
└── SETUP.md
```

---

## Step 2: Backend Setup

Open PowerShell and run:

```powershell
# Navigate to backend folder
cd C:\Projects\GKVK-app\backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Create uploads directory
mkdir uploads -ErrorAction SilentlyContinue

# Start backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Test the backend:**
- Open browser: http://localhost:8000
- API docs: http://localhost:8000/docs

**Keep this terminal running!**

---

## Step 3: Frontend Setup

Open a NEW PowerShell window:

```powershell
# Navigate to frontend folder
cd C:\Projects\GKVK-app\frontend

# Install dependencies
npm install

# IMPORTANT: Use npx expo install for Expo packages
npx expo install expo-camera expo-image-picker expo-speech expo-router expo-constants expo-linking expo-status-bar react-native-safe-area-context react-native-screens react-native-gesture-handler
```

---

## Step 4: Configure Backend URL

Edit `frontend/config/api.ts`:

1. Find your computer's IP address:
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., 192.168.1.100)

2. Update the API_URL:
   ```typescript
   export const API_URL = "http://YOUR_IP_ADDRESS:8000";
   ```

---

## Step 5: Add App Icons (Required for Build)

Create placeholder images in `frontend/assets/`:

1. **icon.png** (1024x1024) - App icon
2. **adaptive-icon.png** (1024x1024) - Android adaptive icon
3. **splash-icon.png** (1284x2778) - Splash screen
4. **favicon.png** (48x48) - Web favicon

You can use any image editor or online tool to create these.
For testing, simple green squares with "GKVK" text work fine.

---

## Step 6: Login to Expo & EAS

```powershell
# Login to Expo
npx eas login

# Verify login
npx eas whoami
```

---

## Step 7: Configure EAS Project

```powershell
cd C:\Projects\GKVK-app\frontend

# Initialize EAS (first time only)
npx eas build:configure

# This will create/update eas.json
```

---

## Step 8: Create Development Build

```powershell
# Build APK for testing (development build)
npx eas build -p android --profile development
```

This will:
1. Upload your code to EAS
2. Build in the cloud (takes 10-20 minutes)
3. Provide download link for APK

**No Android Studio required!**

---

## Step 9: Install & Run

1. Download the APK from the EAS build link
2. Transfer to your Android device
3. Install the APK (enable "Install from unknown sources" if needed)
4. Make sure your phone is on the same WiFi as your computer
5. Start the dev server:
   ```powershell
   cd C:\Projects\GKVK-app\frontend
   npx expo start --dev-client
   ```
6. Open the installed app and scan the QR code

---

## Common Issues & Solutions

### Issue: "Module not found" errors
```powershell
# Delete and reinstall
rm -r node_modules
npm install
npx expo install expo-camera expo-image-picker expo-speech
```

### Issue: Backend connection failed
1. Check backend is running on port 8000
2. Verify IP address in `config/api.ts`
3. Ensure phone and computer are on same network
4. Try disabling Windows Firewall temporarily

### Issue: Camera/Gallery permission denied
- Reinstall the app
- Check Android settings for app permissions

### Issue: Build fails
```powershell
# Check for errors
npx expo doctor

# Clear cache
npx expo start -c
```

---

## Build Commands Reference

```powershell
# Development build (APK with dev client)
npx eas build -p android --profile development

# Preview build (APK for testing)
npx eas build -p android --profile preview

# Production build (AAB for Play Store)
npx eas build -p android --profile production

# Check build status
npx eas build:list

# Local development
npx expo start --dev-client
```

---

## Project Structure

```
frontend/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Root layout
│   ├── index.tsx           # Home screen
│   ├── upload.tsx          # Image upload
│   ├── crops.tsx           # Crop selection
│   └── recommendation.tsx  # Recommendations
├── config/
│   └── api.ts              # API configuration
├── services/
│   └── api.ts              # API service functions
├── types/
│   └── index.ts            # TypeScript types
├── assets/                 # App icons & images
├── app.json                # Expo config
├── eas.json                # EAS build config
└── package.json

backend/
├── main.py                 # FastAPI app
├── models.py               # Pydantic models
├── config.py               # Configuration
├── services/
│   ├── ocr_service.py      # OCR processing
│   ├── analysis_service.py # Soil analysis
│   └── recommendation_service.py  # Recommendations
├── uploads/                # Uploaded images
└── requirements.txt        # Python dependencies
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/crops` | List available crops |
| POST | `/upload` | Upload image (multipart/form-data) |
| POST | `/analyze` | Analyze image (JSON: image_id) |
| GET | `/recommendation/{crop_id}` | Get recommendations |

---

## Need Help?

1. Check Expo documentation: https://docs.expo.dev
2. FastAPI documentation: https://fastapi.tiangolo.com
3. EAS Build documentation: https://docs.expo.dev/build/introduction/

