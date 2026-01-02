"""Service for generating crop recommendations."""

from typing import List, Optional
from models import Crop, Recommendation, SoilData, NutrientStatus
from services.gooey_ai_service import GooeyAIService


class RecommendationService:
    """Service for crop recommendations."""

    def __init__(self):
        """Initialize the recommendation service with Gooey AI integration."""
        self.gooey_ai = GooeyAIService()

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

    async def get_recommendations(
        self, crop_id: str, soil_data: Optional[SoilData] = None, nutrient_status: Optional[List[NutrientStatus]] = None
    ) -> List[Recommendation]:
        """
        Get recommendations for a specific crop using Gooey AI's FarmerCHAT.

        Args:
            crop_id: Crop identifier
            soil_data: Optional soil data for customized recommendations

        Returns:
            List of recommendations from Gooey AI FarmerCHAT
        """
        if crop_id not in self.CROPS:
            raise ValueError(f"Unknown crop: {crop_id}")

        crop = self.CROPS[crop_id]
        
        # Try to get AI-powered recommendations from Gooey AI
        try:
            ai_recommendations = await self.gooey_ai.get_recommendations(
                crop_id=crop_id,
                crop_name=crop.name,
                crop_name_kn=crop.name_kn,
                soil_data=soil_data,
                nutrient_status=nutrient_status
            )
            
            # If we got valid recommendations from AI, return them
            # (None means API key not configured, empty list means API failed)
            if ai_recommendations and len(ai_recommendations) > 0:
                # Check if it's the fallback recommendation (only 1 item with specific title)
                if len(ai_recommendations) == 1 and ai_recommendations[0].title == "Soil Testing Recommended":
                    # This is a fallback from API failure, use default instead
                    pass
                else:
                    return ai_recommendations
        except Exception as e:
            print(f"Gooey AI recommendation failed: {e}")
            import traceback
            traceback.print_exc()
            # Fall through to default recommendations
        
        # Fallback to base recommendations if AI fails
        recommendations = self.BASE_RECOMMENDATIONS.get(
            crop_id, self.DEFAULT_RECOMMENDATIONS
        )

        # If soil data is available, add soil-specific recommendations based on ALL nutrients
        if soil_data and nutrient_status:
            recommendations = self._customize_recommendations(
                recommendations, soil_data, nutrient_status
            )
        elif soil_data:
            # Fallback if nutrient_status not provided
            recommendations = self._customize_recommendations_basic(
                recommendations, soil_data
            )

        return recommendations

    def _customize_recommendations(
        self, base_recommendations: List[Recommendation], soil_data: SoilData, nutrient_status: List[NutrientStatus]
    ) -> List[Recommendation]:
        """Add comprehensive soil-specific recommendations based on ALL nutrient statuses."""
        recommendations = list(base_recommendations)
        
        # Map nutrient names (as they appear in NutrientStatus) to parameter names
        # NutrientStatus uses param.replace("_", " ").title(), so we need to reverse that
        nutrient_map = {
            "Ph": "ph",
            "Ec": "ec", 
            "Organic Carbon": "organic_carbon",
            "Nitrogen": "nitrogen",
            "Phosphorus": "phosphorus",
            "Potassium": "potassium",
            "Sulphur": "sulphur",
            "Zinc": "zinc",
            "Boron": "boron",
            "Iron": "iron",
            "Manganese": "manganese",
            "Copper": "copper",
        }

        # Check each nutrient status and add recommendations for deficiencies
        for nutrient in nutrient_status:
            # Map nutrient name to parameter (handle different formats)
            nutrient_name = nutrient.nutrient
            param = None
            
            # Try exact match first
            if nutrient_name in nutrient_map:
                param = nutrient_map[nutrient_name]
            else:
                # Try case-insensitive and with spaces/underscores
                for key, val in nutrient_map.items():
                    if key.lower() == nutrient_name.lower() or key.replace(" ", "_").lower() == nutrient_name.replace(" ", "_").lower():
                        param = val
                        break
                
                # If still not found, try to derive from nutrient name
                if not param:
                    param = nutrient_name.lower().replace(" ", "_")
            
            if not param or param not in ["ph", "ec", "organic_carbon", "nitrogen", "phosphorus", "potassium", 
                                          "sulphur", "zinc", "boron", "iron", "manganese", "copper"]:
                continue
                
            # RED color means low/deficient - needs correction
            if nutrient.color == "#EF4444":  # RED - Low/Deficient
                rec = self._get_deficiency_recommendation(param, nutrient, soil_data)
                if rec:
                    recommendations.append(rec)
            
            # YELLOW means medium - might need supplementation
            elif nutrient.color == "#F59E0B":  # YELLOW - Medium
                rec = self._get_medium_recommendation(param, nutrient, soil_data)
                if rec:
                    recommendations.append(rec)

        # Add pH correction if needed (regardless of color)
        if soil_data.ph is not None:
            if soil_data.ph < 6.0:
                recommendations.append(
                    Recommendation(
                        title="Soil pH Correction (Acidic)",
                        title_kn="ಮಣ್ಣಿನ pH ತಿದ್ದುಪಡಿ (ಆಮ್ಲೀಯ)",
                        description=f"Your soil pH is {soil_data.ph:.1f}, which is acidic. Apply lime to improve nutrient availability.",
                        description_kn=f"ನಿಮ್ಮ ಮಣ್ಣಿನ pH {soil_data.ph:.1f} ಆಗಿದೆ, ಇದು ಆಮ್ಲೀಯವಾಗಿದೆ. ಪೋಷಕಾಂಶಗಳ ಲಭ್ಯತೆಯನ್ನು ಸುಧಾರಿಸಲು ಸುಣ್ಣ ಹಾಕಿ.",
                        fertilizer="Agricultural Lime",
                        fertilizer_kn="ಕೃಷಿ ಸುಣ್ಣ",
                        dosage="2-4 quintals/ha based on pH level",
                        dosage_kn="pH ಮಟ್ಟದ ಆಧಾರದ ಮೇಲೆ 2-4 ಕ್ವಿಂಟಾಲ್/ಹೆಕ್ಟೇರ್",
                    )
                )
            elif soil_data.ph > 8.5:
                recommendations.append(
                    Recommendation(
                        title="Soil pH Correction (Alkaline)",
                        title_kn="ಮಣ್ಣಿನ pH ತಿದ್ದುಪಡಿ (ಕ್ಷಾರೀಯ)",
                        description=f"Your soil pH is {soil_data.ph:.1f}, which is alkaline. Apply gypsum to improve soil structure.",
                        description_kn=f"ನಿಮ್ಮ ಮಣ್ಣಿನ pH {soil_data.ph:.1f} ಆಗಿದೆ, ಇದು ಕ್ಷಾರೀಯವಾಗಿದೆ. ಮಣ್ಣಿನ ರಚನೆಯನ್ನು ಸುಧಾರಿಸಲು ಜಿಪ್ಸಮ್ ಹಾಕಿ.",
                        fertilizer="Gypsum",
                        fertilizer_kn="ಜಿಪ್ಸಮ್",
                        dosage="2-5 quintals/ha based on pH level",
                        dosage_kn="pH ಮಟ್ಟದ ಆಧಾರದ ಮೇಲೆ 2-5 ಕ್ವಿಂಟಾಲ್/ಹೆಕ್ಟೇರ್",
                    )
                )

        return recommendations

    def _calculate_fertilizer_amount(self, param: str, current_value: float, target_value: float) -> tuple:
        """
        Calculate fertilizer amount needed based on deficiency.
        Returns: (fertilizer_name, amount_kg_per_ha, method, timing)
        """
        deficiency = target_value - current_value
        
        if param == "nitrogen":
            # Urea contains 46% N, so to get 1 kg N, need 1/0.46 = 2.17 kg Urea
            # Add 20% extra for efficiency loss
            urea_needed = (deficiency / 0.46) * 1.2
            return ("Urea", round(urea_needed), "Split application: 50% basal, 25% at 30 DAS, 25% at 60 DAS", "At sowing and during crop growth")
        
        elif param == "phosphorus":
            # DAP contains 18% N and 46% P2O5
            # SSP contains 16% P2O5
            # Target: reach 57 kg/ha P2O5
            p2o5_needed = deficiency * 1.3  # Conversion factor
            dap_needed = (p2o5_needed / 0.46) * 1.2
            return ("DAP", round(dap_needed), "Basal application before sowing/transplanting", "At land preparation")
        
        elif param == "potassium":
            # MOP contains 60% K2O
            k2o_needed = deficiency * 1.2  # Conversion factor
            mop_needed = (k2o_needed / 0.60) * 1.2
            return ("MOP (Muriate of Potash)", round(mop_needed), "Split: 50% basal, 50% at 30-45 DAS", "At sowing and during early growth")
        
        elif param == "sulphur":
            # Gypsum contains 18.6% S, Ammonium Sulphate contains 24% S
            s_needed = deficiency * 1.2
            gypsum_needed = (s_needed / 0.186) * 1.2
            return ("Gypsum", round(gypsum_needed), "Basal application mixed with soil", "At land preparation")
        
        elif param == "zinc":
            # Zinc Sulphate (ZnSO4.7H2O) contains 21% Zn
            zn_needed = 0.6 - current_value  # Target is 0.6 ppm
            if zn_needed > 0:
                znso4_needed = (zn_needed * 25) * 1.2  # Rough conversion for soil application
                return ("Zinc Sulphate (ZnSO4)", round(znso4_needed), "Soil: 25 kg/ha basal OR Foliar: 0.5% spray at 30 and 45 DAS", "Basal at sowing OR foliar during crop growth")
            return ("Zinc Sulphate (ZnSO4)", 25, "Soil: 25 kg/ha basal OR Foliar: 0.5% spray", "At sowing or during growth")
        
        elif param == "boron":
            # Borax contains 11% B
            b_needed = 0.5 - current_value  # Target is 0.5 ppm
            if b_needed > 0:
                borax_needed = (b_needed * 15) * 1.2
                return ("Borax", round(borax_needed), "Soil application mixed with other fertilizers", "At land preparation")
            return ("Borax", 10, "Soil application: 10-15 kg/ha", "At land preparation")
        
        elif param == "iron":
            # Ferrous Sulphate contains 19% Fe
            fe_needed = 4.5 - current_value  # Target is 4.5 ppm
            if fe_needed > 0:
                feso4_needed = (fe_needed * 8) * 1.2
                return ("Ferrous Sulphate", round(feso4_needed), "Soil: 5-10 kg/ha OR Foliar: 0.5% spray", "At sowing or foliar during growth")
            return ("Ferrous Sulphate / Iron Chelate", 8, "Soil: 8 kg/ha OR Foliar: 0.5% spray", "At sowing or during growth")
        
        elif param == "manganese":
            # Manganese Sulphate contains 28% Mn
            mn_needed = 1.0 - current_value  # Target is 1.0 ppm
            if mn_needed > 0:
                mnso4_needed = (mn_needed * 12) * 1.2
                return ("Manganese Sulphate", round(mnso4_needed), "Soil: 10-15 kg/ha OR Foliar: 0.5% spray", "At sowing or during growth")
            return ("Manganese Sulphate", 12, "Soil: 12 kg/ha OR Foliar: 0.5% spray", "At sowing or during growth")
        
        elif param == "copper":
            # Copper Sulphate contains 25% Cu
            cu_needed = 0.2 - current_value  # Target is 0.2 ppm
            if cu_needed > 0:
                cuso4_needed = (cu_needed * 8) * 1.2
                return ("Copper Sulphate", round(cuso4_needed), "Soil: 5-10 kg/ha OR Foliar: 0.2% spray", "At sowing or during growth")
            return ("Copper Sulphate", 8, "Soil: 8 kg/ha OR Foliar: 0.2% spray", "At sowing or during growth")
        
        return (None, 0, "", "")

    def _create_nitrogen_rec(self, value: float, fertilizer_name: str, amount: int, method: str, timing: str) -> Recommendation:
        """Create nitrogen recommendation with calculated amounts."""
        deficiency = 280 - value
        return Recommendation(
            title="Nitrogen Deficiency Correction",
            title_kn="ಸಾರಜನಕ ಕೊರತೆ ನಿವಾರಣೆ",
            description=f"Available nitrogen is {value:.0f} kg/ha (target: 280+ kg/ha). Deficiency: {deficiency:.0f} kg/ha. Apply {amount} kg/ha {fertilizer_name}. Method: {method}. Timing: {timing}. Mix well with soil and ensure adequate moisture for best results.",
            description_kn=f"ಲಭ್ಯವಿರುವ ಸಾರಜನಕ {value:.0f} ಕೆಜಿ/ಹೆಕ್ಟೇರ್ (ಗುರಿ: 280+ ಕೆಜಿ/ಹೆಕ್ಟೇರ್). ಕೊರತೆ: {deficiency:.0f} ಕೆಜಿ/ಹೆಕ್ಟೇರ್. {amount} ಕೆಜಿ/ಹೆಕ್ಟೇರ್ {fertilizer_name} ಹಾಕಿ. ವಿಧಾನ: {method}. ಸಮಯ: {timing}. ಮಣ್ಣಿನೊಂದಿಗೆ ಚೆನ್ನಾಗಿ ಮಿಶ್ರಣ ಮಾಡಿ ಮತ್ತು ಉತ್ತಮ ಫಲಿತಾಂಶಗಳಿಗಾಗಿ ಸಾಕಷ್ಟು ತೇವಾಂಶವನ್ನು ಖಚಿತಪಡಿಸಿ.",
            fertilizer=fertilizer_name,
            fertilizer_kn="ಯೂರಿಯಾ",
            dosage=f"{amount} kg/ha",
            dosage_kn=f"{amount} ಕೆಜಿ/ಹೆಕ್ಟೇರ್",
        )

    def _create_phosphorus_rec(self, value: float, fertilizer_name: str, amount: int, method: str, timing: str) -> Recommendation:
        """Create phosphorus recommendation with calculated amounts."""
        deficiency = 57 - value
        return Recommendation(
            title="Phosphorus Deficiency Correction",
            title_kn="ರಂಜಕ ಕೊರತೆ ನಿವಾರಣೆ",
            description=f"Available phosphorus is {value:.0f} kg/ha (target: 57+ kg/ha). Deficiency: {deficiency:.0f} kg/ha. Apply {amount} kg/ha {fertilizer_name}. Method: {method}. Timing: {timing}. Mix thoroughly with soil during land preparation and ensure good soil contact.",
            description_kn=f"ಲಭ್ಯವಿರುವ ರಂಜಕ {value:.0f} ಕೆಜಿ/ಹೆಕ್ಟೇರ್ (ಗುರಿ: 57+ ಕೆಜಿ/ಹೆಕ್ಟೇರ್). ಕೊರತೆ: {deficiency:.0f} ಕೆಜಿ/ಹೆಕ್ಟೇರ್. {amount} ಕೆಜಿ/ಹೆಕ್ಟೇರ್ {fertilizer_name} ಹಾಕಿ. ವಿಧಾನ: {method}. ಸಮಯ: {timing}. ಭೂಮಿ ಸಿದ್ಧತೆಯ ಸಮಯದಲ್ಲಿ ಮಣ್ಣಿನೊಂದಿಗೆ ಚೆನ್ನಾಗಿ ಮಿಶ್ರಣ ಮಾಡಿ ಮತ್ತು ಉತ್ತಮ ಮಣ್ಣಿನ ಸಂಪರ್ಕವನ್ನು ಖಚಿತಪಡಿಸಿ.",
            fertilizer=fertilizer_name,
            fertilizer_kn="ಡಿಎಪಿ",
            dosage=f"{amount} kg/ha",
            dosage_kn=f"{amount} ಕೆಜಿ/ಹೆಕ್ಟೇರ್",
        )

    def _create_potassium_rec(self, value: float, fertilizer_name: str, amount: int, method: str, timing: str) -> Recommendation:
        """Create potassium recommendation with calculated amounts."""
        deficiency = 337 - value
        return Recommendation(
            title="Potassium Deficiency Correction",
            title_kn="ಪೊಟ್ಯಾಸಿಯಂ ಕೊರತೆ ನಿವಾರಣೆ",
            description=f"Available potassium is {value:.0f} kg/ha (target: 337+ kg/ha). Deficiency: {deficiency:.0f} kg/ha. Apply {amount} kg/ha {fertilizer_name}. Method: {method}. Timing: {timing}. Apply in furrows or broadcast and mix with soil.",
            description_kn=f"ಲಭ್ಯವಿರುವ ಪೊಟ್ಯಾಸಿಯಂ {value:.0f} ಕೆಜಿ/ಹೆಕ್ಟೇರ್ (ಗುರಿ: 337+ ಕೆಜಿ/ಹೆಕ್ಟೇರ್). ಕೊರತೆ: {deficiency:.0f} ಕೆಜಿ/ಹೆಕ್ಟೇರ್. {amount} ಕೆಜಿ/ಹೆಕ್ಟೇರ್ {fertilizer_name} ಹಾಕಿ. ವಿಧಾನ: {method}. ಸಮಯ: {timing}. ಕಂದರಗಳಲ್ಲಿ ಅಥವಾ ವ್ಯಾಪಕವಾಗಿ ಹಾಕಿ ಮತ್ತು ಮಣ್ಣಿನೊಂದಿಗೆ ಮಿಶ್ರಣ ಮಾಡಿ.",
            fertilizer=fertilizer_name,
            fertilizer_kn="ಎಂಒಪಿ",
            dosage=f"{amount} kg/ha",
            dosage_kn=f"{amount} ಕೆಜಿ/ಹೆಕ್ಟೇರ್",
        )

    def _get_deficiency_recommendation(self, param: str, nutrient: NutrientStatus, soil_data: SoilData) -> Optional[Recommendation]:
        """Get recommendation for a deficient nutrient with calculated amounts and application methods."""
        value = getattr(soil_data, param, None)
        if value is None:
            return None
        
        # Get target values based on thresholds
        target_values = {
            "nitrogen": 280,
            "phosphorus": 57,
            "potassium": 337,
            "sulphur": 20,
            "zinc": 0.6,
            "boron": 0.5,
            "iron": 4.5,
            "manganese": 1.0,
            "copper": 0.2,
        }
        
        target = target_values.get(param, None)
        
        # Calculate fertilizer amount if we have a target
        fertilizer_name = None
        amount = None
        method = None
        timing = None
        
        if target and value < target:
            fertilizer_name, amount, method, timing = self._calculate_fertilizer_amount(param, value, target)
        
        # Create recommendations with calculated values
        recommendations_map = {
            "ph": None,  # Handled separately
            "ec": Recommendation(
                title="Electrical Conductivity Management",
                title_kn="ವಿದ್ಯುತ್ ವಾಹಕತೆ ನಿರ್ವಹಣೆ",
                description=f"EC is {value:.2f} dS/m. For saline soils, use gypsum and ensure proper drainage.",
                description_kn=f"EC {value:.2f} dS/m ಆಗಿದೆ. ಲವಣ ಮಣ್ಣಿಗೆ, ಜಿಪ್ಸಮ್ ಬಳಸಿ ಮತ್ತು ಸರಿಯಾದ ಜಲನಿಕಾಸವನ್ನು ಖಚಿತಪಡಿಸಿ.",
                fertilizer="Gypsum + Organic Matter",
                fertilizer_kn="ಜಿಪ್ಸಮ್ + ಸಾವಯವ ವಸ್ತು",
                dosage="As per soil test",
                dosage_kn="ಮಣ್ಣು ಪರೀಕ್ಷೆ ಪ್ರಕಾರ",
            ),
            "organic_carbon": Recommendation(
                title="Organic Carbon Improvement",
                title_kn="ಸಾವಯವ ಇಂಗಾಲ ಸುಧಾರಣೆ",
                description=f"Organic carbon is {value:.2f}%, which is low. Add FYM, compost, or green manure.",
                description_kn=f"ಸಾವಯವ ಇಂಗಾಲ {value:.2f}% ಆಗಿದೆ, ಇದು ಕಡಿಮೆಯಾಗಿದೆ. ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ, ಕಾಂಪೋಸ್ಟ್ ಅಥವಾ ಹಸಿರು ಗೊಬ್ಬರ ಸೇರಿಸಿ.",
                fertilizer="FYM / Compost / Green Manure",
                fertilizer_kn="ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ / ಕಾಂಪೋಸ್ಟ್ / ಹಸಿರು ಗೊಬ್ಬರ",
                dosage="5-10 tons/ha annually",
                dosage_kn="ವಾರ್ಷಿಕವಾಗಿ 5-10 ಟನ್/ಹೆಕ್ಟೇರ್",
            ),
            "nitrogen": self._create_nitrogen_rec(value, fertilizer_name, amount, method, timing) if fertilizer_name and amount else Recommendation(
                title="Nitrogen Deficiency Correction",
                title_kn="ಸಾರಜನಕ ಕೊರತೆ ನಿವಾರಣೆ",
                description=f"Available nitrogen is {value:.0f} kg/ha (target: 280+ kg/ha). Apply nitrogen fertilizers in split doses: 50% basal at sowing, 25% at 30 days after sowing (DAS), and 25% at 60 DAS. Mix well with soil and ensure adequate moisture.",
                description_kn=f"ಲಭ್ಯವಿರುವ ಸಾರಜನಕ {value:.0f} ಕೆಜಿ/ಹೆಕ್ಟೇರ್ (ಗುರಿ: 280+ ಕೆಜಿ/ಹೆಕ್ಟೇರ್). ಸಾರಜನಕ ಗೊಬ್ಬರಗಳನ್ನು ವಿಭಾಗಗಳಲ್ಲಿ ಹಾಕಿ: 50% ಬಿತ್ತನೆ ಸಮಯದಲ್ಲಿ ಮೂಲ, 25% 30 ದಿನಗಳ ನಂತರ, 25% 60 ದಿನಗಳ ನಂತರ. ಮಣ್ಣಿನೊಂದಿಗೆ ಚೆನ್ನಾಗಿ ಮಿಶ್ರಣ ಮಾಡಿ ಮತ್ತು ಸಾಕಷ್ಟು ತೇವಾಂಶವನ್ನು ಖಚಿತಪಡಿಸಿ.",
                fertilizer="Urea / Ammonium Sulphate",
                fertilizer_kn="ಯೂರಿಯಾ / ಅಮೋನಿಯಂ ಸಲ್ಫೇಟ್",
                dosage="Calculate based on deficiency (target: 280+ kg/ha)",
                dosage_kn="ಕೊರತೆಯ ಆಧಾರದ ಮೇಲೆ ಲೆಕ್ಕಾಚಾರ (ಗುರಿ: 280+ ಕೆಜಿ/ಹೆಕ್ಟೇರ್)",
            ),
            "phosphorus": self._create_phosphorus_rec(value, fertilizer_name, amount, method, timing) if fertilizer_name and amount else Recommendation(
                title="Phosphorus Deficiency Correction",
                title_kn="ರಂಜಕ ಕೊರತೆ ನಿವಾರಣೆ",
                description=f"Available phosphorus is {value:.0f} kg/ha (target: 57+ kg/ha). Apply DAP or SSP as basal dose before sowing/transplanting. Mix thoroughly with soil during land preparation.",
                description_kn=f"ಲಭ್ಯವಿರುವ ರಂಜಕ {value:.0f} ಕೆಜಿ/ಹೆಕ್ಟೇರ್ (ಗುರಿ: 57+ ಕೆಜಿ/ಹೆಕ್ಟೇರ್). ಬಿತ್ತನೆ/ನಾಟಿಗೆ ಮೊದಲು ಡಿಎಪಿ ಅಥವಾ ಎಸ್ಎಸ್ಪಿ ಅನ್ನು ಮೂಲ ಗೊಬ್ಬರವಾಗಿ ಹಾಕಿ. ಭೂಮಿ ಸಿದ್ಧತೆಯ ಸಮಯದಲ್ಲಿ ಮಣ್ಣಿನೊಂದಿಗೆ ಚೆನ್ನಾಗಿ ಮಿಶ್ರಣ ಮಾಡಿ.",
                fertilizer="DAP / SSP / Rock Phosphate",
                fertilizer_kn="ಡಿಎಪಿ / ಎಸ್ಎಸ್ಪಿ / ರಾಕ್ ಫಾಸ್ಫೇಟ್",
                dosage="Calculate based on deficiency (target: 57+ kg/ha)",
                dosage_kn="ಕೊರತೆಯ ಆಧಾರದ ಮೇಲೆ ಲೆಕ್ಕಾಚಾರ (ಗುರಿ: 57+ ಕೆಜಿ/ಹೆಕ್ಟೇರ್)",
            ),
            "potassium": self._create_potassium_rec(value, fertilizer_name, amount, method, timing) if fertilizer_name and amount else Recommendation(
                title="Potassium Deficiency Correction",
                title_kn="ಪೊಟ್ಯಾಸಿಯಂ ಕೊರತೆ ನಿವಾರಣೆ",
                description=f"Available potassium is {value:.0f} kg/ha (target: 337+ kg/ha). Apply MOP in splits: 50% basal, 50% at 30-45 days after sowing.",
                description_kn=f"ಲಭ್ಯವಿರುವ ಪೊಟ್ಯಾಸಿಯಂ {value:.0f} ಕೆಜಿ/ಹೆಕ್ಟೇರ್ (ಗುರಿ: 337+ ಕೆಜಿ/ಹೆಕ್ಟೇರ್). ಎಂಒಪಿ ಅನ್ನು ವಿಭಾಗಗಳಲ್ಲಿ ಹಾಕಿ: 50% ಮೂಲ, 50% 30-45 ದಿನಗಳ ನಂತರ.",
                fertilizer="MOP (Muriate of Potash)",
                fertilizer_kn="ಎಂಒಪಿ (ಪೊಟ್ಯಾಸಿಯಂ ಮ್ಯೂರಿಯೇಟ್)",
                dosage="Calculate based on deficiency (target: 337+ kg/ha)",
                dosage_kn="ಕೊರತೆಯ ಆಧಾರದ ಮೇಲೆ ಲೆಕ್ಕಾಚಾರ (ಗುರಿ: 337+ ಕೆಜಿ/ಹೆಕ್ಟೇರ್)",
            ),
            "sulphur": Recommendation(
                title="Sulphur Deficiency Correction",
                title_kn="ಗಂಧಕ ಕೊರತೆ ನಿವಾರಣೆ",
                description=f"Available sulphur is {value:.0f} ppm (target: 20+ ppm). Deficiency: {20 - value:.0f} ppm. Apply {amount} kg/ha {fertilizer_name} if calculated, otherwise 200-300 kg/ha gypsum. Method: {method}. Timing: {timing}. Mix with soil during land preparation.",
                description_kn=f"ಲಭ್ಯವಿರುವ ಗಂಧಕ {value:.0f} ppm (ಗುರಿ: 20+ ppm). ಕೊರತೆ: {20 - value:.0f} ppm. {amount} ಕೆಜಿ/ಹೆಕ್ಟೇರ್ {fertilizer_name} ಹಾಕಿ (ಲೆಕ್ಕಾಚಾರ ಮಾಡಿದರೆ), ಇಲ್ಲದಿದ್ದರೆ 200-300 ಕೆಜಿ/ಹೆಕ್ಟೇರ್ ಜಿಪ್ಸಮ್. ವಿಧಾನ: {method}. ಸಮಯ: {timing}. ಭೂಮಿ ಸಿದ್ಧತೆಯ ಸಮಯದಲ್ಲಿ ಮಣ್ಣಿನೊಂದಿಗೆ ಮಿಶ್ರಣ ಮಾಡಿ.",
                fertilizer=fertilizer_name or "Gypsum / Ammonium Sulphate",
                fertilizer_kn=fertilizer_name or "ಜಿಪ್ಸಮ್ / ಅಮೋನಿಯಂ ಸಲ್ಫೇಟ್",
                dosage=f"{amount} kg/ha" if amount else "200-300 kg/ha gypsum",
                dosage_kn=f"{amount} ಕೆಜಿ/ಹೆಕ್ಟೇರ್" if amount else "200-300 ಕೆಜಿ/ಹೆಕ್ಟೇರ್ ಜಿಪ್ಸಮ್",
            ),
            "zinc": Recommendation(
                title="Zinc Deficiency Correction",
                title_kn="ಸತು ಕೊರತೆ ನಿವಾರಣೆ",
                description=f"Zinc is {value:.2f} ppm (target: 0.6+ ppm). Apply {amount} kg/ha {fertilizer_name}. Method: {method}. Timing: {timing}. For soil application, mix with other fertilizers. For foliar spray, apply in early morning or evening.",
                description_kn=f"ಸತು {value:.2f} ppm (ಗುರಿ: 0.6+ ppm). {amount} ಕೆಜಿ/ಹೆಕ್ಟೇರ್ {fertilizer_name} ಹಾಕಿ. ವಿಧಾನ: {method}. ಸಮಯ: {timing}. ಮಣ್ಣಿನ ಅನ್ವಯಕ್ಕೆ, ಇತರ ಗೊಬ್ಬರಗಳೊಂದಿಗೆ ಮಿಶ್ರಣ ಮಾಡಿ. ಎಲೆ ಸಿಂಪರಣೆಗೆ, ಬೆಳಿಗ್ಗೆ ಅಥವಾ ಸಂಜೆ ಹಾಕಿ.",
                fertilizer=fertilizer_name or "Zinc Sulphate (ZnSO4)",
                fertilizer_kn=fertilizer_name or "ಸತು ಸಲ್ಫೇಟ್ (ZnSO4)",
                dosage=f"{amount} kg/ha (soil) or 0.5% foliar spray" if amount else "25 kg/ha (soil) or 0.5% foliar spray",
                dosage_kn=f"{amount} ಕೆಜಿ/ಹೆಕ್ಟೇರ್ (ಮಣ್ಣು) ಅಥವಾ 0.5% ಎಲೆ ಸಿಂಪರಣೆ" if amount else "25 ಕೆಜಿ/ಹೆಕ್ಟೇರ್ (ಮಣ್ಣು) ಅಥವಾ 0.5% ಎಲೆ ಸಿಂಪರಣೆ",
            ),
            "boron": Recommendation(
                title="Boron Deficiency Correction",
                title_kn="ಬೋರಾನ್ ಕೊರತೆ ನಿವಾರಣೆ",
                description=f"Boron is {value:.2f} ppm (target: 0.5+ ppm). Apply {amount} kg/ha {fertilizer_name}. Method: {method}. Timing: {timing}. Mix with other fertilizers during land preparation. Avoid direct contact with seeds.",
                description_kn=f"ಬೋರಾನ್ {value:.2f} ppm (ಗುರಿ: 0.5+ ppm). {amount} ಕೆಜಿ/ಹೆಕ್ಟೇರ್ {fertilizer_name} ಹಾಕಿ. ವಿಧಾನ: {method}. ಸಮಯ: {timing}. ಭೂಮಿ ಸಿದ್ಧತೆಯ ಸಮಯದಲ್ಲಿ ಇತರ ಗೊಬ್ಬರಗಳೊಂದಿಗೆ ಮಿಶ್ರಣ ಮಾಡಿ. ಬೀಜಗಳೊಂದಿಗೆ ನೇರ ಸಂಪರ್ಕವನ್ನು ತಪ್ಪಿಸಿ.",
                fertilizer=fertilizer_name or "Borax (Sodium Tetraborate)",
                fertilizer_kn=fertilizer_name or "ಬೋರಾಕ್ಸ್ (ಸೋಡಿಯಂ ಟೆಟ್ರಾಬೋರೇಟ್)",
                dosage=f"{amount} kg/ha" if amount else "10-15 kg/ha",
                dosage_kn=f"{amount} ಕೆಜಿ/ಹೆಕ್ಟೇರ್" if amount else "10-15 ಕೆಜಿ/ಹೆಕ್ಟೇರ್",
            ),
            "iron": Recommendation(
                title="Iron Deficiency Correction",
                title_kn="ಕಬ್ಬಿಣ ಕೊರತೆ ನಿವಾರಣೆ",
                description=f"Iron is {value:.2f} ppm (target: 4.5+ ppm). Apply {amount} kg/ha {fertilizer_name}. Method: {method}. Timing: {timing}. For foliar spray, use 0.5% solution in early morning. Avoid mixing with alkaline fertilizers.",
                description_kn=f"ಕಬ್ಬಿಣ {value:.2f} ppm (ಗುರಿ: 4.5+ ppm). {amount} ಕೆಜಿ/ಹೆಕ್ಟೇರ್ {fertilizer_name} ಹಾಕಿ. ವಿಧಾನ: {method}. ಸಮಯ: {timing}. ಎಲೆ ಸಿಂಪರಣೆಗೆ, ಬೆಳಿಗ್ಗೆ 0.5% ದ್ರಾವಣ ಬಳಸಿ. ಕ್ಷಾರೀಯ ಗೊಬ್ಬರಗಳೊಂದಿಗೆ ಮಿಶ್ರಣ ಮಾಡಬೇಡಿ.",
                fertilizer=fertilizer_name or "Ferrous Sulphate / Iron Chelate",
                fertilizer_kn=fertilizer_name or "ಫೆರಸ್ ಸಲ್ಫೇಟ್ / ಕಬ್ಬಿಣ ಕೀಲೇಟ್",
                dosage=f"{amount} kg/ha (soil) or 0.5% foliar spray" if amount else "8 kg/ha (soil) or 0.5% foliar spray",
                dosage_kn=f"{amount} ಕೆಜಿ/ಹೆಕ್ಟೇರ್ (ಮಣ್ಣು) ಅಥವಾ 0.5% ಎಲೆ ಸಿಂಪರಣೆ" if amount else "8 ಕೆಜಿ/ಹೆಕ್ಟೇರ್ (ಮಣ್ಣು) ಅಥವಾ 0.5% ಎಲೆ ಸಿಂಪರಣೆ",
            ),
            "manganese": Recommendation(
                title="Manganese Deficiency Correction",
                title_kn="ಮ್ಯಾಂಗನೀಸ್ ಕೊರತೆ ನಿವಾರಣೆ",
                description=f"Manganese is {value:.2f} ppm (target: 1.0+ ppm). Apply {amount} kg/ha {fertilizer_name}. Method: {method}. Timing: {timing}. For foliar spray, use 0.5% solution. Best applied during active growth stage.",
                description_kn=f"ಮ್ಯಾಂಗನೀಸ್ {value:.2f} ppm (ಗುರಿ: 1.0+ ppm). {amount} ಕೆಜಿ/ಹೆಕ್ಟೇರ್ {fertilizer_name} ಹಾಕಿ. ವಿಧಾನ: {method}. ಸಮಯ: {timing}. ಎಲೆ ಸಿಂಪರಣೆಗೆ, 0.5% ದ್ರಾವಣ ಬಳಸಿ. ಸಕ್ರಿಯ ಬೆಳವಣಿಗೆಯ ಹಂತದಲ್ಲಿ ಅತ್ಯುತ್ತಮವಾಗಿ ಅನ್ವಯಿಸಲಾಗುತ್ತದೆ.",
                fertilizer=fertilizer_name or "Manganese Sulphate (MnSO4)",
                fertilizer_kn=fertilizer_name or "ಮ್ಯಾಂಗನೀಸ್ ಸಲ್ಫೇಟ್ (MnSO4)",
                dosage=f"{amount} kg/ha (soil) or 0.5% foliar spray" if amount else "12 kg/ha (soil) or 0.5% foliar spray",
                dosage_kn=f"{amount} ಕೆಜಿ/ಹೆಕ್ಟೇರ್ (ಮಣ್ಣು) ಅಥವಾ 0.5% ಎಲೆ ಸಿಂಪರಣೆ" if amount else "12 ಕೆಜಿ/ಹೆಕ್ಟೇರ್ (ಮಣ್ಣು) ಅಥವಾ 0.5% ಎಲೆ ಸಿಂಪರಣೆ",
            ),
            "copper": Recommendation(
                title="Copper Deficiency Correction",
                title_kn="ತಾಮ್ರ ಕೊರತೆ ನಿವಾರಣೆ",
                description=f"Copper is {value:.2f} ppm (target: 0.2+ ppm). Apply {amount} kg/ha {fertilizer_name}. Method: {method}. Timing: {timing}. For foliar spray, use 0.2% solution. Apply during early growth stages for best results.",
                description_kn=f"ತಾಮ್ರ {value:.2f} ppm (ಗುರಿ: 0.2+ ppm). {amount} ಕೆಜಿ/ಹೆಕ್ಟೇರ್ {fertilizer_name} ಹಾಕಿ. ವಿಧಾನ: {method}. ಸಮಯ: {timing}. ಎಲೆ ಸಿಂಪರಣೆಗೆ, 0.2% ದ್ರಾವಣ ಬಳಸಿ. ಉತ್ತಮ ಫಲಿತಾಂಶಗಳಿಗಾಗಿ ಆರಂಭಿಕ ಬೆಳವಣಿಗೆಯ ಹಂತದಲ್ಲಿ ಅನ್ವಯಿಸಿ.",
                fertilizer=fertilizer_name or "Copper Sulphate (CuSO4)",
                fertilizer_kn=fertilizer_name or "ತಾಮ್ರ ಸಲ್ಫೇಟ್ (CuSO4)",
                dosage=f"{amount} kg/ha (soil) or 0.2% foliar spray" if amount else "8 kg/ha (soil) or 0.2% foliar spray",
                dosage_kn=f"{amount} ಕೆಜಿ/ಹೆಕ್ಟೇರ್ (ಮಣ್ಣು) ಅಥವಾ 0.2% ಎಲೆ ಸಿಂಪರಣೆ" if amount else "8 ಕೆಜಿ/ಹೆಕ್ಟೇರ್ (ಮಣ್ಣು) ಅಥವಾ 0.2% ಎಲೆ ಸಿಂಪರಣೆ",
            ),
        }
        
        return recommendations_map.get(param)

    def _get_medium_recommendation(self, param: str, nutrient: NutrientStatus, soil_data: SoilData) -> Optional[Recommendation]:
        """Get recommendation for a medium-level nutrient (optional supplementation)."""
        value = getattr(soil_data, param, None)
        if value is None:
            return None
            
        # Only add medium recommendations for critical nutrients
        if param in ["nitrogen", "phosphorus", "potassium"]:
            return Recommendation(
                title=f"{nutrient.nutrient} Optimization",
                title_kn=f"{nutrient.nutrient_kn} ಅನುಕೂಲೀಕರಣ",
                description=f"{nutrient.nutrient} is at medium level ({value:.0f} {nutrient.unit}). Consider moderate supplementation for optimal yield.",
                description_kn=f"{nutrient.nutrient_kn} ಮಧ್ಯಮ ಮಟ್ಟದಲ್ಲಿದೆ ({value:.0f} {nutrient.unit}). ಸೂಕ್ತ ಇಳುವರಿಗಾಗಿ ಮಧ್ಯಮ ಪೂರಕವನ್ನು ಪರಿಗಣಿಸಿ.",
                fertilizer="As per crop requirement",
                fertilizer_kn="ಬೆಳೆಯ ಅವಶ್ಯಕತೆ ಪ್ರಕಾರ",
                dosage="Moderate application recommended",
                dosage_kn="ಮಧ್ಯಮ ಅನ್ವಯ ಶಿಫಾರಸು",
            )
        return None

    def _customize_recommendations_basic(
        self, base_recommendations: List[Recommendation], soil_data: SoilData
    ) -> List[Recommendation]:
        """Basic customization when nutrient_status is not available (fallback)."""
        recommendations = list(base_recommendations)
        
        # Basic pH and nitrogen checks (old method as fallback)
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

