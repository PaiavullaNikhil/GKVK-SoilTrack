"""Pydantic models for API requests and responses."""

from pydantic import BaseModel
from typing import Optional, List, Dict


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    message: str
    message_kn: str


class Crop(BaseModel):
    """Crop model."""

    id: str
    name: str
    name_kn: str
    icon: str


class CropListResponse(BaseModel):
    """Crop list response."""

    crops: List[Crop]


class UploadResponse(BaseModel):
    """Upload response."""

    success: bool
    image_id: str
    message: str
    message_kn: str


class AnalysisRequest(BaseModel):
    """Analysis request."""

    image_id: str


class NutrientStatus(BaseModel):
    """Nutrient status model."""

    nutrient: str
    nutrient_kn: str
    value: Optional[float]
    unit: str
    status: str  # "low", "medium", "high"
    status_kn: str
    color: str  # Hex color code


class SoilData(BaseModel):
    """Extracted soil data."""

    ph: Optional[float] = None
    nitrogen: Optional[float] = None
    phosphorus: Optional[float] = None
    potassium: Optional[float] = None
    organic_carbon: Optional[float] = None
    ec: Optional[float] = None  # Electrical conductivity


class AnalysisResponse(BaseModel):
    """Analysis response."""

    success: bool
    image_id: str
    extracted_text: str
    soil_data: SoilData
    nutrient_status: List[NutrientStatus]
    message: str
    message_kn: str


class Recommendation(BaseModel):
    """Single recommendation."""

    title: str
    title_kn: str
    description: str
    description_kn: str
    fertilizer: Optional[str] = None
    fertilizer_kn: Optional[str] = None
    dosage: Optional[str] = None
    dosage_kn: Optional[str] = None


class RecommendationResponse(BaseModel):
    """Recommendation response."""

    success: bool
    crop_id: str
    recommendations: List[Recommendation]

