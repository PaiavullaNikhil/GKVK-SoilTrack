"""FastAPI backend for GKVK Soil Analysis App."""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uuid
import shutil
from pathlib import Path

from config import CORS_ORIGINS, UPLOAD_DIR
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
recommendation_service = RecommendationService()


@app.get("/", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        message="GKVK Soil Analysis API is running",
        message_kn="GKVK ಮಣ್ಣು ವಿಶ್ಲೇಷಣೆ API ಚಾಲನೆಯಲ್ಲಿದೆ",
    )


@app.get("/crops", response_model=CropListResponse)
async def get_crops():
    """Get list of available crops."""
    crops = recommendation_service.get_available_crops()
    return CropListResponse(crops=crops)


@app.post("/upload", response_model=UploadResponse)
async def upload_image(file: UploadFile = File(...)):
    """Upload a soil health card image."""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only JPEG and PNG are allowed.",
        )

    # Generate unique filename
    file_ext = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / unique_filename

    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
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
        print(f"OCR result: {ocr_result[:100]}...")

        # Analyze soil data
        soil_data = analysis_service.analyze_soil_card(ocr_result)
        print(f"Soil data: {soil_data}")

        # Get nutrient status
        nutrient_status = analysis_service.get_nutrient_status(soil_data)
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
        # Get soil data if image_id provided
        soil_data = None
        if image_id:
            image_path = UPLOAD_DIR / image_id
            if image_path.exists():
                ocr_result = ocr_service.extract_text(str(image_path))
                soil_data = analysis_service.analyze_soil_card(ocr_result)

        # Get recommendations
        recommendations = recommendation_service.get_recommendations(crop_id, soil_data)

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

