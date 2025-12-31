"""Service for generating crop recommendations."""

from typing import List, Optional
from models import Crop, Recommendation, SoilData


class RecommendationService:
    """Service for crop recommendations."""

    # Available crops with Kannada names
    CROPS = {
        "rice": Crop(id="rice", name="Rice", name_kn="ಭತ್ತ", icon="🌾"),
        "wheat": Crop(id="wheat", name="Wheat", name_kn="ಗೋಧಿ", icon="🌾"),
        "maize": Crop(id="maize", name="Maize", name_kn="ಮೆಕ್ಕೆಜೋಳ", icon="🌽"),
        "ragi": Crop(id="ragi", name="Finger Millet (Ragi)", name_kn="ರಾಗಿ", icon="🌾"),
        "jowar": Crop(id="jowar", name="Sorghum (Jowar)", name_kn="ಜೋಳ", icon="🌾"),
        "groundnut": Crop(id="groundnut", name="Groundnut", name_kn="ಕಡಲೆಕಾಯಿ", icon="🥜"),
        "cotton": Crop(id="cotton", name="Cotton", name_kn="ಹತ್ತಿ", icon="🌿"),
        "sugarcane": Crop(id="sugarcane", name="Sugarcane", name_kn="ಕಬ್ಬು", icon="🎋"),
        "tomato": Crop(id="tomato", name="Tomato", name_kn="ಟೊಮೆಟೊ", icon="🍅"),
        "onion": Crop(id="onion", name="Onion", name_kn="ಈರುಳ್ಳಿ", icon="🧅"),
        "potato": Crop(id="potato", name="Potato", name_kn="ಆಲೂಗಡ್ಡೆ", icon="🥔"),
        "chilli": Crop(id="chilli", name="Chilli", name_kn="ಮೆಣಸಿನಕಾಯಿ", icon="🌶️"),
    }

    # Base recommendations for each crop
    BASE_RECOMMENDATIONS = {
        "rice": [
            Recommendation(
                title="Nitrogen Application",
                title_kn="ಸಾರಜನಕ ಅನ್ವಯ",
                description="Apply nitrogen in 3 split doses: 50% at transplanting, 25% at tillering, 25% at panicle initiation",
                description_kn="ಸಾರಜನಕವನ್ನು 3 ಭಾಗಗಳಲ್ಲಿ ಹಾಕಿ: 50% ನಾಟಿ ಮಾಡುವಾಗ, 25% ಟಿಲ್ಲರಿಂಗ್ ಸಮಯದಲ್ಲಿ, 25% ತೆನೆ ಬರುವಾಗ",
                fertilizer="Urea",
                fertilizer_kn="ಯೂರಿಯಾ",
                dosage="100-120 kg/ha",
                dosage_kn="100-120 ಕೆಜಿ/ಹೆಕ್ಟೇರ್",
            ),
            Recommendation(
                title="Phosphorus Application",
                title_kn="ರಂಜಕ ಅನ್ವಯ",
                description="Apply full dose of phosphorus as basal application",
                description_kn="ಪೂರ್ಣ ರಂಜಕವನ್ನು ಮೂಲ ಗೊಬ್ಬರವಾಗಿ ಹಾಕಿ",
                fertilizer="DAP / SSP",
                fertilizer_kn="ಡಿಎಪಿ / ಎಸ್ಎಸ್ಪಿ",
                dosage="40-60 kg/ha P2O5",
                dosage_kn="40-60 ಕೆಜಿ/ಹೆಕ್ಟೇರ್ P2O5",
            ),
            Recommendation(
                title="Potassium Application",
                title_kn="ಪೊಟ್ಯಾಸಿಯಂ ಅನ್ವಯ",
                description="Apply potassium in 2 splits: 50% basal, 50% at panicle initiation",
                description_kn="ಪೊಟ್ಯಾಸಿಯಂ ಅನ್ನು 2 ಭಾಗಗಳಲ್ಲಿ ಹಾಕಿ: 50% ಮೂಲ, 50% ತೆನೆ ಬರುವಾಗ",
                fertilizer="MOP",
                fertilizer_kn="ಎಂಒಪಿ",
                dosage="40 kg/ha K2O",
                dosage_kn="40 ಕೆಜಿ/ಹೆಕ್ಟೇರ್ K2O",
            ),
        ],
        "ragi": [
            Recommendation(
                title="Nitrogen Management",
                title_kn="ಸಾರಜನಕ ನಿರ್ವಹಣೆ",
                description="Apply nitrogen in 2 splits: 50% at sowing, 50% at 30 days after sowing",
                description_kn="ಸಾರಜನಕವನ್ನು 2 ಭಾಗಗಳಲ್ಲಿ ಹಾಕಿ: 50% ಬಿತ್ತನೆ ಸಮಯದಲ್ಲಿ, 50% 30 ದಿನಗಳ ನಂತರ",
                fertilizer="Urea",
                fertilizer_kn="ಯೂರಿಯಾ",
                dosage="50-60 kg/ha",
                dosage_kn="50-60 ಕೆಜಿ/ಹೆಕ್ಟೇರ್",
            ),
            Recommendation(
                title="Phosphorus & Potassium",
                title_kn="ರಂಜಕ ಮತ್ತು ಪೊಟ್ಯಾಸಿಯಂ",
                description="Apply as basal dose before sowing",
                description_kn="ಬಿತ್ತನೆಗೆ ಮೊದಲು ಮೂಲ ಗೊಬ್ಬರವಾಗಿ ಹಾಕಿ",
                fertilizer="DAP + MOP",
                fertilizer_kn="ಡಿಎಪಿ + ಎಂಒಪಿ",
                dosage="40 kg P2O5 + 20 kg K2O per ha",
                dosage_kn="40 ಕೆಜಿ P2O5 + 20 ಕೆಜಿ K2O ಪ್ರತಿ ಹೆಕ್ಟೇರ್",
            ),
        ],
        "tomato": [
            Recommendation(
                title="Balanced Fertilization",
                title_kn="ಸಮತೋಲಿತ ಗೊಬ್ಬರ",
                description="Apply NPK in recommended ratio for high yield",
                description_kn="ಹೆಚ್ಚಿನ ಇಳುವರಿಗಾಗಿ ಶಿಫಾರಸು ಮಾಡಿದ ಅನುಪಾತದಲ್ಲಿ NPK ಹಾಕಿ",
                fertilizer="NPK Complex (19:19:19)",
                fertilizer_kn="NPK ಕಾಂಪ್ಲೆಕ್ಸ್ (19:19:19)",
                dosage="120:60:60 kg/ha",
                dosage_kn="120:60:60 ಕೆಜಿ/ಹೆಕ್ಟೇರ್",
            ),
            Recommendation(
                title="Micronutrients",
                title_kn="ಸೂಕ್ಷ್ಮ ಪೋಷಕಾಂಶಗಳು",
                description="Spray micronutrients for better fruit quality",
                description_kn="ಉತ್ತಮ ಹಣ್ಣಿನ ಗುಣಮಟ್ಟಕ್ಕಾಗಿ ಸೂಕ್ಷ್ಮ ಪೋಷಕಾಂಶಗಳನ್ನು ಸಿಂಪಡಿಸಿ",
                fertilizer="Boron + Zinc",
                fertilizer_kn="ಬೋರಾನ್ + ಸತು",
                dosage="2-3 sprays during flowering",
                dosage_kn="ಹೂಬಿಡುವ ಸಮಯದಲ್ಲಿ 2-3 ಸಿಂಪರಣೆ",
            ),
        ],
    }

    # Default recommendation for crops without specific guidelines
    DEFAULT_RECOMMENDATIONS = [
        Recommendation(
            title="Soil Testing",
            title_kn="ಮಣ್ಣು ಪರೀಕ್ಷೆ",
            description="Get your soil tested every 2-3 years for accurate fertilizer recommendations",
            description_kn="ನಿಖರವಾದ ಗೊಬ್ಬರ ಶಿಫಾರಸುಗಳಿಗಾಗಿ ಪ್ರತಿ 2-3 ವರ್ಷಗಳಿಗೊಮ್ಮೆ ನಿಮ್ಮ ಮಣ್ಣನ್ನು ಪರೀಕ್ಷಿಸಿ",
            fertilizer=None,
            fertilizer_kn=None,
            dosage=None,
            dosage_kn=None,
        ),
        Recommendation(
            title="Organic Matter",
            title_kn="ಸಾವಯವ ವಸ್ತು",
            description="Add FYM or compost to improve soil health",
            description_kn="ಮಣ್ಣಿನ ಆರೋಗ್ಯವನ್ನು ಸುಧಾರಿಸಲು ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ ಅಥವಾ ಕಾಂಪೋಸ್ಟ್ ಸೇರಿಸಿ",
            fertilizer="FYM/Compost",
            fertilizer_kn="ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ/ಕಾಂಪೋಸ್ಟ್",
            dosage="5-10 tons/ha",
            dosage_kn="5-10 ಟನ್/ಹೆಕ್ಟೇರ್",
        ),
        Recommendation(
            title="Balanced NPK",
            title_kn="ಸಮತೋಲಿತ NPK",
            description="Apply balanced NPK fertilizers based on soil test results",
            description_kn="ಮಣ್ಣಿನ ಪರೀಕ್ಷಾ ಫಲಿತಾಂಶಗಳ ಆಧಾರದ ಮೇಲೆ ಸಮತೋಲಿತ NPK ಗೊಬ್ಬರಗಳನ್ನು ಹಾಕಿ",
            fertilizer="NPK Complex",
            fertilizer_kn="NPK ಕಾಂಪ್ಲೆಕ್ಸ್",
            dosage="As per soil test",
            dosage_kn="ಮಣ್ಣು ಪರೀಕ್ಷೆ ಪ್ರಕಾರ",
        ),
    ]

    def get_available_crops(self) -> List[Crop]:
        """Get list of available crops."""
        return list(self.CROPS.values())

    def get_recommendations(
        self, crop_id: str, soil_data: Optional[SoilData] = None
    ) -> List[Recommendation]:
        """
        Get recommendations for a specific crop.

        Args:
            crop_id: Crop identifier
            soil_data: Optional soil data for customized recommendations

        Returns:
            List of recommendations
        """
        if crop_id not in self.CROPS:
            raise ValueError(f"Unknown crop: {crop_id}")

        # Get base recommendations for the crop
        recommendations = self.BASE_RECOMMENDATIONS.get(
            crop_id, self.DEFAULT_RECOMMENDATIONS
        )

        # If soil data is available, add soil-specific recommendations
        if soil_data:
            recommendations = self._customize_recommendations(
                recommendations, soil_data
            )

        return recommendations

    def _customize_recommendations(
        self, base_recommendations: List[Recommendation], soil_data: SoilData
    ) -> List[Recommendation]:
        """Add soil-specific recommendations based on soil data."""
        recommendations = list(base_recommendations)

        # Add pH correction recommendation if needed
        if soil_data.ph is not None:
            if soil_data.ph < 6.0:
                recommendations.append(
                    Recommendation(
                        title="Soil pH Correction (Acidic)",
                        title_kn="ಮಣ್ಣಿನ pH ತಿದ್ದುಪಡಿ (ಆಮ್ಲೀಯ)",
                        description="Apply lime to correct acidic soil",
                        description_kn="ಆಮ್ಲೀಯ ಮಣ್ಣನ್ನು ಸರಿಪಡಿಸಲು ಸುಣ್ಣ ಹಾಕಿ",
                        fertilizer="Agricultural Lime",
                        fertilizer_kn="ಕೃಷಿ ಸುಣ್ಣ",
                        dosage="2-4 quintals/ha",
                        dosage_kn="2-4 ಕ್ವಿಂಟಾಲ್/ಹೆಕ್ಟೇರ್",
                    )
                )
            elif soil_data.ph > 8.5:
                recommendations.append(
                    Recommendation(
                        title="Soil pH Correction (Alkaline)",
                        title_kn="ಮಣ್ಣಿನ pH ತಿದ್ದುಪಡಿ (ಕ್ಷಾರೀಯ)",
                        description="Apply gypsum to correct alkaline soil",
                        description_kn="ಕ್ಷಾರೀಯ ಮಣ್ಣನ್ನು ಸರಿಪಡಿಸಲು ಜಿಪ್ಸಮ್ ಹಾಕಿ",
                        fertilizer="Gypsum",
                        fertilizer_kn="ಜಿಪ್ಸಮ್",
                        dosage="2-5 quintals/ha",
                        dosage_kn="2-5 ಕ್ವಿಂಟಾಲ್/ಹೆಕ್ಟೇರ್",
                    )
                )

        # Add nitrogen recommendation if low
        if soil_data.nitrogen is not None and soil_data.nitrogen < 280:
            recommendations.append(
                Recommendation(
                    title="Nitrogen Deficiency Correction",
                    title_kn="ಸಾರಜನಕ ಕೊರತೆ ನಿವಾರಣೆ",
                    description="Soil is low in nitrogen. Increase nitrogen application.",
                    description_kn="ಮಣ್ಣಿನಲ್ಲಿ ಸಾರಜನಕ ಕಡಿಮೆ ಇದೆ. ಸಾರಜನಕ ಅನ್ವಯವನ್ನು ಹೆಚ್ಚಿಸಿ.",
                    fertilizer="Urea / Ammonium Sulphate",
                    fertilizer_kn="ಯೂರಿಯಾ / ಅಮೋನಿಯಂ ಸಲ್ಫೇಟ್",
                    dosage="Increase by 20-25%",
                    dosage_kn="20-25% ಹೆಚ್ಚಿಸಿ",
                )
            )

        return recommendations

