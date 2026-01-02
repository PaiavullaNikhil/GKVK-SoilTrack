"""Test script to verify Gooey AI API endpoint format."""

import os
import httpx
import asyncio
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GOOEY_AI_API_KEY", "")
BASE_URL = "https://api.gooey.ai/v2"
MODEL_ID = "ktdv7wi1h578"

async def test_endpoints():
    """Test different Gooey AI endpoint formats."""
    if not API_KEY:
        print("ERROR: GOOEY_AI_API_KEY not found in .env file")
        return
    
    print(f"Testing with Model ID: {MODEL_ID}")
    print(f"API Key: {API_KEY[:10]}...{API_KEY[-4:] if len(API_KEY) > 14 else '***'}\n")
    
    test_prompt = "Hello, this is a test."
    
    endpoints_to_test = [
        (f"{BASE_URL}/run/{MODEL_ID}", {"input_prompt": test_prompt}),
        (f"{BASE_URL}/run/{MODEL_ID}", {"input": test_prompt}),
        (f"{BASE_URL}/run/{MODEL_ID}", {"prompt": test_prompt}),
        (f"{BASE_URL}/recipes/{MODEL_ID}", {"input_prompt": test_prompt}),
        (f"{BASE_URL}/recipes/{MODEL_ID}", {"input": test_prompt}),
        (f"{BASE_URL}/models/{MODEL_ID}/run", {"input_prompt": test_prompt}),
        (f"{BASE_URL}/chat/completions", {"model": MODEL_ID, "messages": [{"role": "user", "content": test_prompt}]}),
        (f"https://api.gooey.ai/v1/run/{MODEL_ID}", {"input_prompt": test_prompt}),  # Try v1
    ]
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        for endpoint, payload in endpoints_to_test:
            try:
                print(f"Testing: {endpoint}")
                print(f"  Payload keys: {list(payload.keys())}")
                
                response = await client.post(
                    endpoint,
                    headers={
                        "Authorization": f"Bearer {API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                
                print(f"  Status: {response.status_code}")
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"  [SUCCESS] Response keys: {list(result.keys()) if isinstance(result, dict) else 'not a dict'}")
                    print(f"  Response preview: {str(result)[:200]}...")
                    return endpoint, payload  # Found working format!
                else:
                    error_text = response.text[:500]
                    print(f"  [ERROR {response.status_code}] {error_text}")
                    
            except Exception as e:
                print(f"  [EXCEPTION] {e}")
            
            print()
    
    print("[FAILED] None of the endpoint formats worked.")
    print("Please check your Gooey AI dashboard for the correct endpoint format.")
    print("The model ID might need to be accessed via a different endpoint (e.g., /v2/recipes/ or /v2/models/)")

if __name__ == "__main__":
    asyncio.run(test_endpoints())

