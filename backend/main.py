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

from config import CORS_ORIGINS, UPLOAD_DIR

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
from services.recommendation_service import RecommendationService
from models import (
    HealthResponse,
    CropListResponse,
    UploadResponse,
    AnalysisRequest,
    AnalysisResponse,
    RecommendationResponse,
)

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
recommendation_service = RecommendationService()  # Now has __init__ but it's optional

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


@app.get("/crops", response_model=CropListResponse)
async def get_crops():
    """Get list of available crops."""
    crops = recommendation_service.get_available_crops()
    return CropListResponse(crops=crops)


@app.post("/upload", response_model=UploadResponse)
async def upload_image(file: UploadFile = File(...)):
    """Upload a soil health card image."""
    log(f"Upload request received: filename={file.filename}, content_type={file.content_type}")
    
    # Validate file type - be lenient with content types from mobile apps
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "application/octet-stream"]
    file_ext = Path(file.filename).suffix.lower() if file.filename else ""
    allowed_extensions = [".jpg", ".jpeg", ".png"]
    
    # Accept if content type matches OR if extension matches
    if file.content_type not in allowed_types and file_ext not in allowed_extensions:
        log(f"Rejected file: content_type={file.content_type}, ext={file_ext}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Got content_type={file.content_type}, ext={file_ext}. Only JPEG and PNG are allowed.",
        )

    # Generate unique filename - use extension from filename or default to .jpg
    file_ext = Path(file.filename).suffix if file.filename else ".jpg"
    if not file_ext:
        file_ext = ".jpg"
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / unique_filename

    log(f"Saving to: {file_path}")

    # Save file
    try:
        contents = await file.read()
        log(f"Read {len(contents)} bytes from upload")
        with open(file_path, "wb") as buffer:
            buffer.write(contents)
        log(f"File saved successfully: {file_path}")
    except Exception as e:
        log(f"Failed to save file: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    return UploadResponse(
        success=True,
        image_id=unique_filename,
        message="Image uploaded successfully",
        message_kn="ಚಿತ್ರವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಲಾಗಿದೆ",
    )


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_image(request: AnalysisRequest):
    """Analyze an uploaded soil health card image."""
    image_path = UPLOAD_DIR / request.image_id

    if not image_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")

    try:
        print(f"Analyzing image: {image_path}")
        
        # Perform OCR
        ocr_result = ocr_service.extract_text(str(image_path))
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
            image_id=request.image_id,
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


@app.get("/recommendation/{crop_id}", response_model=RecommendationResponse)
async def get_recommendation(crop_id: str, image_id: str = None):
    """Get recommendations for a specific crop based on soil analysis."""
    try:
        # Get soil data and nutrient status if image_id provided
        soil_data = None
        nutrient_status = None
        if image_id:
            image_path = UPLOAD_DIR / image_id
            if image_path.exists():
                ocr_result = ocr_service.extract_text(str(image_path))
                # analyze_soil_card returns (soil_data, raw_values, status_info)
                soil_data, raw_values, status_info = analysis_service.analyze_soil_card(ocr_result)
                # Get nutrient status with color/status information
                nutrient_status = analysis_service.get_nutrient_status(soil_data, raw_values, status_info)

        # Get recommendations (now async with Gooey AI)
        recommendations = await recommendation_service.get_recommendations(crop_id, soil_data, nutrient_status)

        return RecommendationResponse(
            success=True,
            crop_id=crop_id,
            recommendations=recommendations,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get recommendations: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

