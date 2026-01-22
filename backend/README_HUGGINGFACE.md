# Hugging Face Spaces Deployment Guide

This guide explains how to deploy the GKVK SoilTrack backend to Hugging Face Spaces.

## Prerequisites

1. **Hugging Face Account**: Sign up at [huggingface.co](https://huggingface.co)
2. **Repository**: Create a new Space on Hugging Face
3. **Environment Variables**: Set `GOOEY_AI_API_KEY` in Space settings

## Deployment Steps

### 1. Create a Hugging Face Space

1. Go to [huggingface.co/spaces](https://huggingface.co/spaces)
2. Click "Create new Space"
3. Choose:
   - **SDK**: Docker
   - **Visibility**: Public or Private
   - **Hardware**: CPU Basic (free) or upgrade if needed

### 2. Upload Your Code

Upload these files to your Space:
- `Dockerfile` (in root of Space)
- `requirements.txt` (in root of Space)
- `main.py` (in root of Space)
- `config.py` (in root of Space)
- `models.py` (in root of Space)
- `services/` directory (with all service files)
- `.env` file (optional, or use Space secrets)

### 3. Set Environment Variables

In your Space settings, add:
- `GOOEY_AI_API_KEY`: Your Gooey AI API key
- `SPACE_ID`: Automatically set by Hugging Face

### 4. Deploy

Hugging Face will automatically:
1. Build the Docker image
2. Install dependencies
3. Start the FastAPI server on port 7860

## File Structure in Space

```
your-space/
├── Dockerfile
├── requirements.txt
├── main.py
├── config.py
├── models.py
├── services/
│   ├── __init__.py
│   ├── ocr_service.py
│   ├── analysis_service.py
│   ├── recommendation_service.py
│   └── gooey_ai_service.py
└── uploads/  (created automatically)
```

## Important Notes

### Port Configuration
- **Must use port 7860** (Hugging Face requirement)
- The Dockerfile and main.py are configured for this

### CORS Configuration
- CORS is set to allow all origins (`*`) for Hugging Face Spaces
- This allows your Expo mobile app to connect

### CPU-Only PyTorch
- Uses CPU-only versions of torch/torchvision for faster builds
- Installed separately in Dockerfile for optimization

### Health Endpoints
- `GET /` - Full health check with status
- `GET /health` - Simple health check returning `{"status": "ok"}`

## Testing Your Deployment

Once deployed, test your endpoints:

1. **Health Check**:
   ```
   https://your-username-gkvk-soiltrack.hf.space/health
   ```

2. **API Documentation**:
   ```
   https://your-username-gkvk-soiltrack.hf.space/docs
   ```

3. **Root Endpoint**:
   ```
   https://your-username-gkvk-soiltrack.hf.space/
   ```

## Troubleshooting

### Build Fails
- Check Dockerfile syntax
- Verify all dependencies in requirements.txt
- Check Space logs for errors

### App Won't Start
- Verify port is 7860
- Check environment variables are set
- Review Space logs

### CORS Errors
- Verify CORS_ORIGINS includes `*` in config.py
- Check that IS_HUGGINGFACE detection works

### OCR Not Working
- EasyOCR downloads models on first run (may take time)
- Check Space logs for EasyOCR initialization

## Updating Your Space

1. Push changes to your Space repository
2. Hugging Face automatically rebuilds and redeploys
3. Check build logs in Space settings

## API Endpoints

Once deployed, your API will be available at:
- Base URL: `https://your-username-gkvk-soiltrack.hf.space`
- Health: `GET /health`
- Crops: `GET /crops`
- Upload: `POST /upload`
- Analyze: `POST /analyze`
- Recommendations: `GET /recommendation/{crop_id}`

## Frontend Configuration

Update your frontend to use the Hugging Face Space URL:

```typescript
// In frontend/utils/getLocalIP.ts or frontend/config/api.ts
const PRODUCTION_API_URL = "https://your-username-gkvk-soiltrack.hf.space";
```

Or set environment variable:
```
EXPO_PUBLIC_API_URL=https://your-username-gkvk-soiltrack.hf.space
```
