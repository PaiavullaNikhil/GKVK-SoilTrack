"""FastAPI backend for GKVK Soil Analysis App."""

from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
import uuid
import shutil
from pathlib import Path
import traceback
import sys
from datetime import datetime
from typing import Dict, Tuple

from config import CORS_ORIGINS

# Debug log file
DEBUG_LOG = Path(__file__).parent / "debug.log"

def log(msg):
    """Write to debug log file."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {msg}\n"
    with open(DEBUG_LOG, "a", encoding="utf-8") as f:
        f.write(line)
    print(line, flush=True)


def _to_dict(model_obj):
    """Compatibility helper for Pydantic v1/v2 models."""
    if hasattr(model_obj, "model_dump"):
        return model_obj.model_dump()
    if hasattr(model_obj, "dict"):
        return model_obj.dict()
    return model_obj


from services.ocr_service import OCRService
from services.analysis_service import AnalysisService
from models import HealthResponse, UploadResponse, AnalysisResponse

app = FastAPI(
    title="GKVK Soil Analysis API",
    description="API for soil health card analysis and crop recommendations",
    version="1.0.0",
)

# Global exception handler to catch ALL errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"\n{'='*60}", file=sys.stderr, flush=True)
    print(f"UNHANDLED EXCEPTION on {request.method} {request.url}", file=sys.stderr, flush=True)
    print(f"Error type: {type(exc).__name__}", file=sys.stderr, flush=True)
    print(f"Error message: {str(exc)}", file=sys.stderr, flush=True)
    traceback.print_exc(file=sys.stderr)
    print(f"{'='*60}\n", file=sys.stderr, flush=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )

# Middleware to log all requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    log(f">>> REQUEST: {request.method} {request.url}")
    log(f"    Headers: {dict(request.headers)}")
    try:
        response = await call_next(request)
        log(f"<<< RESPONSE: {response.status_code}")
        return response
    except Exception as e:
        log(f"!!! ERROR in middleware: {type(e).__name__}: {e}")
        traceback.print_exc()
        raise

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
ocr_service = OCRService()
analysis_service = AnalysisService()

log("=== SERVER STARTED ===")


@app.get("/", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    log("Health check called")
    return HealthResponse(
        status="healthy",
        message="GKVK Soil Analysis API is running",
        message_kn="GKVK ಮಣ್ಣು ವಿಶ್ಲೇಷಣೆ API ಚಾಲನೆಯಲ್ಲಿದೆ",
    )


@app.get("/health")
async def health():
    """Simple health check endpoint for monitoring."""
    return {"status": "ok"}


@app.post("/analyze-direct", response_model=AnalysisResponse)
async def analyze_image_direct(file: UploadFile = File(...)):
    """Analyze a soil health card image directly - no file storage, processes immediately."""
    log(f"Direct analyze request: filename={file.filename}, content_type={file.content_type}")
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "application/octet-stream"]
    file_ext = Path(file.filename).suffix.lower() if file.filename else ""
    allowed_extensions = [".jpg", ".jpeg", ".png"]
    
    if file.content_type not in allowed_types and file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Only JPEG and PNG are allowed.",
        )

    try:
        # Reset file cursor to beginning to ensure it's not already read/consumed
        await file.seek(0)
        # Read image into memory
        image_bytes = await file.read()
        log(f"Read {len(image_bytes)} bytes for direct analysis")
        
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty file received")
        
        print(f"Analyzing image directly (size: {len(image_bytes)} bytes)")
        
        # Perform OCR directly from image bytes (no file saving)
        ocr_result = ocr_service.extract_text(image_bytes)
        print(f"OCR result: {len(ocr_result)} chars extracted")
        ocr_lines = [line.strip() for line in ocr_result.split("\n") if line.strip()]
        log(f"OCR extracted lines: {len(ocr_lines)}")
        for idx, line in enumerate(ocr_lines[:25], start=1):
            log(f"OCR[{idx:02d}]: {line}")
        if len(ocr_lines) > 25:
            log(f"OCR preview truncated. Additional lines: {len(ocr_lines) - 25}")

        # Analyze soil data - extract values AND status text from OCR
        soil_data, raw_values, status_info = analysis_service.analyze_soil_card(ocr_result)
        print(f"Soil data parsed successfully")
        print(f"Raw values found: {len(raw_values)}")
        print(f"Status info (from OCR): {len(status_info)} items")
        log(f"Stored soil_data: {_to_dict(soil_data)}")
        log(f"Stored raw_values: {raw_values}")
        log(f"Stored status_info: {status_info}")

        # Get nutrient status using OCR-extracted status text
        nutrient_status = analysis_service.get_nutrient_status(soil_data, raw_values, status_info)
        print(f"Nutrient status count: {len(nutrient_status)}")
        nutrient_status_dump = [_to_dict(n) for n in nutrient_status]
        log(f"Stored nutrient_status: {nutrient_status_dump}")

        return AnalysisResponse(
            success=True,
            image_id=str(uuid.uuid4()),
            extracted_text=ocr_result,
            soil_data=soil_data,
            nutrient_status=nutrient_status,
            message="Analysis completed",
            message_kn="ವಿಶ್ಲೇಷಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ",
        )
    except HTTPException:
        # Re-raise HTTPExceptions (like 400 Bad Request) to return correct HTTP status codes
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
@app.get("/privacy", response_class=HTMLResponse)
async def privacy_policy():
    html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - LRI FERTILIZER</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #1b4332;
            --primary-light: #2d6a4f;
            --accent: #52b788;
            --bg: #f8fafc;
            --card-bg: #ffffff;
            --text: #0f172a;
            --text-muted: #475569;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: 'Outfit', sans-serif;
            background-color: var(--bg);
            color: var(--text);
            line-height: 1.6;
            padding: 40px 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: var(--card-bg);
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
        }
        header {
            text-align: center;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 30px;
            margin-bottom: 30px;
        }
        .logo-icon {
            font-size: 48px;
            margin-bottom: 10px;
            display: inline-block;
        }
        h1 {
            font-size: 2.2rem;
            color: var(--primary);
            font-weight: 700;
            margin-bottom: 10px;
        }
        .last-updated {
            font-size: 0.9rem;
            color: var(--text-muted);
        }
        h2 {
            font-size: 1.4rem;
            color: var(--primary-light);
            margin: 30px 0 15px 0;
            font-weight: 600;
            display: flex;
            align-items: center;
        }
        h2::before {
            content: "";
            display: inline-block;
            width: 6px;
            height: 20px;
            background-color: var(--accent);
            margin-right: 10px;
            border-radius: 3px;
        }
        p {
            margin-bottom: 15px;
            color: var(--text-muted);
        }
        ul {
            margin-bottom: 20px;
            padding-left: 20px;
            color: var(--text-muted);
        }
        li {
            margin-bottom: 8px;
        }
        footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #f1f5f9;
            font-size: 0.85rem;
            color: var(--text-muted);
        }
        @media (max-width: 640px) {
            body {
                padding: 20px 10px;
            }
            .container {
                padding: 25px 15px;
            }
            h1 {
                font-size: 1.8rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="logo-icon">🌱</div>
            <h1>LRI FERTILIZER</h1>
            <p>Privacy Policy</p>
            <div class="last-updated">Last Updated: June 2, 2026</div>
        </header>

        <section>
            <p>This Privacy Policy describes how the <strong>LRI FERTILIZER</strong> mobile application ("App") handles your data. The App is developed to assist in soil health card analysis and provide crop-specific fertilizer recommendations.</p>

            <h2>1. Information We Access & Process</h2>
            <p>To provide soil health card analysis, the App requires access to specific device features. We prioritize your privacy and only process the minimal data required:</p>
            <ul>
                <li><strong>Camera Access:</strong> Used exclusively to capture images of your printed Soil Health Cards for Optical Character Recognition (OCR).</li>
                <li><strong>Photo Library Access:</strong> Used only when you explicitly select a pre-saved Soil Health Card image from your gallery for analysis.</li>
                <li><strong>In-Memory Processing:</strong> Any captured or uploaded image is processed immediately on-the-fly in-memory to extract soil parameters and is <strong>never</strong> permanently stored on our servers.</li>
            </ul>

            <h2>2. Data Collection and Storage</h2>
            <p><strong>We do not collect, store, or sell any personal data.</strong></p>
            <ul>
                <li>No personal identification details (like name, email, or phone number) are required to use the App.</li>
                <li>No usage tracking or analytics libraries are integrated to build advertising profiles.</li>
            </ul>

            <h2>3. Third-Party Services</h2>
            <p>The App securely communicates with the <strong>Google Cloud Vision API</strong> to perform optical character recognition (OCR) on your Soil Health Cards. This processing is performed over an encrypted HTTPS connection, and your image data is used solely to extract the text values of your soil parameters.</p>

            <h2>4. Data Security</h2>
            <p>All communication between the mobile app and our servers is secured using industry-standard HTTPS encryption. We implement robust security measures to protect your temporary in-transit data from unauthorized access or disclosure.</p>

            <h2>5. Contact Us</h2>
            <p>If you have any questions or feedback regarding this Privacy Policy, please contact our team at the University of Agricultural Sciences, GKVK, Bengaluru.</p>
        </section>

        <footer>
            <p>&copy; 2026 GKVK - University of Agricultural Sciences, Bengaluru. All rights reserved.</p>
        </footer>
    </div>
</body>
</html>"""
    return HTMLResponse(content=html_content, status_code=200)


if __name__ == "__main__":
    import uvicorn
    import os

    # Use port from environment variable or default to 7860 for Hugging Face Spaces
    port = int(os.getenv("PORT", "7860"))
    uvicorn.run(app, host="0.0.0.0", port=port)

