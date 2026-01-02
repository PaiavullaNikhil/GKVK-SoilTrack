# Gooey AI FarmerCHAT Integration Setup

This guide explains how to set up Gooey AI's FarmerCHAT API for intelligent crop recommendations.

## Prerequisites

1. **Get a Gooey AI API Key**
   - Visit [https://gooey.ai](https://gooey.ai)
   - Sign up for an account
   - Navigate to your API settings
   - Generate or copy your API key

## Setup Instructions

### Option 1: Environment Variable (Recommended)

Set the `GOOEY_AI_API_KEY` environment variable:

**Windows (PowerShell):**
```powershell
$env:GOOEY_AI_API_KEY="your_api_key_here"
```

**Windows (Command Prompt):**
```cmd
set GOOEY_AI_API_KEY=your_api_key_here
```

**Linux/Mac:**
```bash
export GOOEY_AI_API_KEY="your_api_key_here"
```

### Option 2: .env File

1. Create a `.env` file in the `backend` directory:
   ```
   GOOEY_AI_API_KEY=your_api_key_here
   ```

2. The application will automatically load it (python-dotenv is already installed)

## Configuration

The Gooey AI settings are in `backend/config.py`:

```python
GOOEY_AI_API_KEY = os.getenv("GOOEY_AI_API_KEY", "")
GOOEY_AI_BASE_URL = "https://api.gooey.ai/v2"
FARMERCHAT_MODEL = "FarmerCHAT"
```

If you need to adjust the API endpoint or model name, edit these values in `config.py`.

## How It Works

1. When a user requests recommendations for a crop with soil data:
   - The system formats the soil test results and crop information
   - Sends a detailed prompt to Gooey AI's FarmerCHAT
   - FarmerCHAT analyzes the data and provides personalized recommendations
   - The response is parsed and formatted for display in the app

2. If the API call fails or no API key is configured:
   - The system falls back to the default recommendation rules
   - Users still get recommendations, just not AI-powered ones

## Testing

To test if the integration is working:

1. Make sure your API key is set
2. Upload a soil health card image
3. Select a crop
4. Request recommendations
5. Check the backend logs for any API errors

## Troubleshooting

**"Gooey AI API key not configured" error:**
- Make sure you've set the `GOOEY_AI_API_KEY` environment variable
- Or created a `.env` file with the key

**API call fails:**
- Check your internet connection
- Verify your API key is valid
- Check the backend logs for detailed error messages
- The system will automatically fall back to default recommendations

**Wrong API endpoint:**
- The service tries multiple common endpoint patterns
- If none work, you may need to update `GOOEY_AI_BASE_URL` in `config.py`
- Check Gooey AI's documentation for the correct endpoint format

