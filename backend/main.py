"""FastAPI backend for GKVK Soil Analysis App."""

from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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
        # Read image into memory
        image_bytes = await file.read()
        log(f"Read {len(image_bytes)} bytes for direct analysis")
        
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty file received")
        
        print(f"Analyzing image directly (size: {len(image_bytes)} bytes)")
        
        # Perform OCR directly from image bytes (no file saving)
        ocr_result = ocr_service.extract_text(image_bytes)
        print(f"OCR result: {len(ocr_result)} chars extracted")

        # Analyze soil data - extract values AND status text from OCR
        soil_data, raw_values, status_info = analysis_service.analyze_soil_card(ocr_result)
        print(f"Soil data parsed successfully")
        print(f"Raw values found: {len(raw_values)}")
        print(f"Status info (from OCR): {len(status_info)} items")

        # Get nutrient status using OCR-extracted status text
        nutrient_status = analysis_service.get_nutrient_status(soil_data, raw_values, status_info)
        print(f"Nutrient status count: {len(nutrient_status)}")

        return AnalysisResponse(
            success=True,
            image_id=str(uuid.uuid4()),
            extracted_text=ocr_result,
            soil_data=soil_data,
            nutrient_status=nutrient_status,
            message="Analysis completed",
            message_kn="ವಿಶ್ಲೇಷಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ",
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    import os

    # Use port from environment variable or default to 7860 for Hugging Face Spaces
    port = int(os.getenv("PORT", "7860"))
    uvicorn.run(app, host="0.0.0.0", port=port)

