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

## Finding Your Model ID and Endpoint

**IMPORTANT**: You need to find the correct Model ID and endpoint format from your Gooey AI dashboard:

1. **Log into Gooey AI Dashboard**: https://gooey.ai
2. **Navigate to your Models/Recipes**: Look for your FarmerCHAT model or recipe
3. **Find the Model/Recipe ID**: 
   - It's usually displayed in the URL or in the model/recipe details
   - It might look like: `ktdv7wi1h578`, `model_abc123`, or similar
   - **Copy this exact ID**
4. **Check the API Documentation**: 
   - In your Gooey AI dashboard, look for "API" or "Integration" section
   - Check what endpoint format is shown (e.g., `/v2/run/{model_id}`, `/v2/recipes/{recipe_id}`, etc.)
   - Note the required payload format (e.g., `input_prompt`, `input`, `prompt`, etc.)

## Configuration

The Gooey AI settings are in `backend/config.py`:

```python
GOOEY_AI_API_KEY = os.getenv("GOOEY_AI_API_KEY", "")
GOOEY_AI_BASE_URL = "https://api.gooey.ai/v2"
FARMERCHAT_MODEL = "your-model-id-here"  # Replace with your actual model ID from dashboard
```

**Update `FARMERCHAT_MODEL`** in `config.py` with the model ID you found in your dashboard.

## Testing the API Connection

Run the test script to verify your API key and model ID:

```bash
cd backend
python test_gooey_ai.py
```

This will test different endpoint formats and show you which one works (if any).

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

**404 Not Found Error:**
- This usually means the **Model ID is incorrect** or the **endpoint format is wrong**
- **Solution**: 
  1. Check your Gooey AI dashboard for the correct Model/Recipe ID
  2. Verify the endpoint format in Gooey AI's API documentation
  3. Update `FARMERCHAT_MODEL` in `config.py` with the correct ID
  4. If the endpoint format is different, you may need to update `gooey_ai_service.py`
  5. Run `python test_gooey_ai.py` to test different endpoint formats

**Wrong API endpoint:**
- The service tries multiple common endpoint patterns automatically
- If none work, check your Gooey AI dashboard for the exact endpoint format
- You may need to update the endpoint patterns in `backend/services/gooey_ai_service.py`

