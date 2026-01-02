"""Service for integrating with Gooey AI's FarmerCHAT API."""

import httpx
import json
from typing import Optional, List
from models import SoilData, Recommendation, NutrientStatus
from config import GOOEY_AI_API_KEY, GOOEY_AI_BASE_URL, FARMERCHAT_MODEL

# Import log function from main
try:
    from main import log
except ImportError:
    # Fallback if main is not available
    def log(msg):
        print(f"[GooeyAI] {msg}")


class GooeyAIService:
    """Service for interacting with Gooey AI's FarmerCHAT."""

    def __init__(self):
        self.api_key = GOOEY_AI_API_KEY
        self.base_url = GOOEY_AI_BASE_URL
        self.model = FARMERCHAT_MODEL

    def _format_soil_data(self, soil_data: SoilData) -> str:
        """Format soil data into a readable string for the AI."""
        nutrients = []
        
        if soil_data.ph is not None:
            nutrients.append(f"pH: {soil_data.ph}")
        if soil_data.ec is not None:
            nutrients.append(f"EC (Electrical Conductivity): {soil_data.ec} dS/m")
        if soil_data.organic_carbon is not None:
            nutrients.append(f"Organic Carbon: {soil_data.organic_carbon}%")
        if soil_data.nitrogen is not None:
            nutrients.append(f"Nitrogen (N): {soil_data.nitrogen} kg/ha")
        if soil_data.phosphorus is not None:
            nutrients.append(f"Phosphorus (P2O5): {soil_data.phosphorus} kg/ha")
        if soil_data.potassium is not None:
            nutrients.append(f"Potassium (K2O): {soil_data.potassium} kg/ha")
        if soil_data.sulphur is not None:
            nutrients.append(f"Sulphur (S): {soil_data.sulphur} ppm")
        if soil_data.zinc is not None:
            nutrients.append(f"Zinc (Zn): {soil_data.zinc} ppm")
        if soil_data.boron is not None:
            nutrients.append(f"Boron (B): {soil_data.boron} ppm")
        if soil_data.iron is not None:
            nutrients.append(f"Iron (Fe): {soil_data.iron} ppm")
        if soil_data.manganese is not None:
            nutrients.append(f"Manganese (Mn): {soil_data.manganese} ppm")
        if soil_data.copper is not None:
            nutrients.append(f"Copper (Cu): {soil_data.copper} ppm")
        
        return "\n".join(nutrients) if nutrients else "No soil data available"

    def _format_nutrient_status(self, nutrient_status: Optional[List[NutrientStatus]]) -> str:
        """Format nutrient status with color indicators for the AI."""
        if not nutrient_status:
            return "No nutrient status analysis available"
        
        status_lines = []
        for nutrient in nutrient_status:
            status_indicator = ""
            if nutrient.color == "#EF4444":  # RED
                status_indicator = "⚠️ LOW/DEFICIENT - URGENT CORRECTION NEEDED"
            elif nutrient.color == "#F59E0B":  # YELLOW
                status_indicator = "⚡ MEDIUM - Consider supplementation"
            elif nutrient.color == "#10B981":  # GREEN
                status_indicator = "✅ SUFFICIENT - No action needed"
            else:
                status_indicator = "❓ NOT DETECTED"
            
            value_str = nutrient.value_raw if nutrient.value_raw else (f"{nutrient.value}" if nutrient.value is not None else "Not available")
            status_lines.append(f"{nutrient.nutrient_kn} ({nutrient.nutrient}): {value_str} {nutrient.unit} - {status_indicator} - Status: {nutrient.status_kn}")
        
        return "\n".join(status_lines)

    def _create_prompt(self, crop_name: str, crop_name_kn: str, soil_data: Optional[SoilData], nutrient_status: Optional[List[NutrientStatus]] = None) -> str:
        """Create a prompt for FarmerCHAT."""
        soil_info = self._format_soil_data(soil_data) if soil_data else "No soil test data available"
        status_info = self._format_nutrient_status(nutrient_status) if nutrient_status else "No nutrient status analysis available"
        
        prompt = f"""You are an expert agricultural advisor helping farmers in Karnataka, India. Provide specific, actionable fertilizer and management recommendations based on the soil test analysis.

Crop: {crop_name} ({crop_name_kn})

Soil Test Results (Raw Values):
{soil_info}

Nutrient Status Analysis:
{status_info}

IMPORTANT: Focus on nutrients marked as "⚠️ LOW/DEFICIENT" - these need immediate correction. For each deficient nutrient, calculate the exact amount of fertilizer needed and provide specific application methods.

Please provide detailed recommendations in the following format (respond in JSON format with an array of recommendations):
{{
  "recommendations": [
    {{
      "title": "Recommendation title in English",
      "title_kn": "Recommendation title in Kannada",
      "description": "Detailed description in English explaining what to do, when, and why",
      "description_kn": "Detailed description in Kannada",
      "fertilizer": "Specific fertilizer name (e.g., Urea, DAP, MOP)",
      "fertilizer_kn": "Fertilizer name in Kannada",
      "dosage": "Specific dosage with units (e.g., 100-120 kg/ha)",
      "dosage_kn": "Dosage in Kannada"
    }}
  ]
}}

Provide 5-8 comprehensive recommendations based on the soil test results and crop requirements. CRITICAL REQUIREMENTS:

1. **For each LOW/DEFICIENT nutrient (marked with ⚠️)**: 
   - Calculate the EXACT amount of fertilizer needed based on the deficiency
   - Specify the fertilizer name (e.g., Urea for N, DAP for P, MOP for K, Zinc Sulphate for Zn)
   - Provide exact dosage in kg/ha with calculation
   - Specify application method (basal, split application, foliar spray, etc.)
   - Specify timing (at sowing, 30 DAS, 45 DAS, etc.)

2. **For MEDIUM nutrients (marked with ⚡)**: Provide optional optimization recommendations

3. **Soil pH correction**: If pH is outside 6.5-7.5 range, provide specific lime/gypsum recommendations

4. **Application methods**: Be specific - "50% basal at sowing, 25% at 30 DAS, 25% at 60 DAS"

5. **Timing**: Specify exact crop growth stages (DAS = Days After Sowing)

6. **Best practices**: Include mixing instructions, when to spray (morning/evening), etc.

CALCULATION EXAMPLES:
- Nitrogen: If current is 120 kg/ha and target is 280 kg/ha, deficiency is 160 kg/ha. Urea contains 46% N, so need (160/0.46)*1.2 = ~417 kg/ha Urea
- Phosphorus: If current is 15 kg/ha and target is 57 kg/ha, deficiency is 42 kg/ha. DAP contains 46% P2O5, so need (42*1.3/0.46)*1.2 = ~143 kg/ha DAP
- Micronutrients: Provide specific amounts based on critical limits (e.g., Zinc < 0.6 ppm needs 25 kg/ha Zinc Sulphate)

Make recommendations practical, specific, calculation-based, and suitable for Karnataka's agricultural conditions. Include both English and Kannada translations."""
        
        return prompt

    async def get_recommendations(
        self, crop_id: str, crop_name: str, crop_name_kn: str, soil_data: Optional[SoilData] = None, nutrient_status: Optional[List[NutrientStatus]] = None
    ) -> Optional[List[Recommendation]]:
        """
        Get AI-powered recommendations from Gooey AI's FarmerCHAT.
        
        Args:
            crop_id: Crop identifier
            crop_name: Crop name in English
            crop_name_kn: Crop name in Kannada
            soil_data: Optional soil data for personalized recommendations
            
        Returns:
            List of recommendations from FarmerCHAT
        """
        if not self.api_key:
            log("Gooey AI API key not configured. Skipping AI recommendations.")
            return None  # Return None to trigger fallback to default recommendations
        
        prompt = self._create_prompt(crop_name, crop_name_kn, soil_data, nutrient_status)
        
        try:
            # Gooey AI API call
            # Based on Gooey AI dashboard, the endpoint is /v2/video-bots?example_id={example_id}
            # The model ID in config is actually the example_id
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Gooey AI uses /v2/video-bots endpoint with example_id as query parameter
                endpoint = f"{self.base_url}/video-bots?example_id={self.model}"
                
                # Gooey AI payload format - based on dashboard example
                payload = {
                    "input_prompt": prompt,
                    "messages": [],
                }
                
                log(f"Calling Gooey AI endpoint: {endpoint}")
                log(f"Payload keys: {list(payload.keys())}")
                
                response = await client.post(
                    endpoint,
                    headers={
                        "Authorization": f"bearer {self.api_key}",  # Gooey AI uses lowercase "bearer"
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                
                log(f"Gooey AI response status: {response.status_code}")
                
                if response.status_code == 200:
                    result = response.json()
                    log(f"Gooey AI success! Response keys: {list(result.keys()) if isinstance(result, dict) else 'not a dict'}")
                    
                    # Parse the response - Gooey AI returns: {"output": {"output_text": ["..."]}}
                    output = result.get("output", {})
                    output_text_array = output.get("output_text", [])
                    
                    if not output_text_array:
                        log("Gooey AI response has no output_text")
                        return self._get_fallback_recommendations()
                    
                    # Get the first output text (the AI's response)
                    ai_response = output_text_array[0] if isinstance(output_text_array, list) else str(output_text_array)
                    log(f"Gooey AI response text length: {len(ai_response)}")
                    
                    # Try to parse JSON from the response
                    try:
                        # Try to find JSON in the response text
                        json_start = ai_response.find("{")
                        json_end = ai_response.rfind("}") + 1
                        
                        if json_start >= 0 and json_end > json_start:
                            # Extract JSON portion
                            json_str = ai_response[json_start:json_end]
                            parsed = json.loads(json_str)
                        else:
                            # If no JSON found, try parsing the whole response
                            parsed = json.loads(ai_response)
                        
                        recommendations_data = parsed.get("recommendations", [])
                        
                        if not recommendations_data:
                            log("No recommendations found in parsed JSON")
                            return self._get_fallback_recommendations()
                        
                        # Convert to Recommendation objects
                        recommendations = []
                        for rec in recommendations_data:
                            recommendations.append(Recommendation(
                                title=rec.get("title", "Recommendation"),
                                title_kn=rec.get("title_kn", "ಶಿಫಾರಸು"),
                                description=rec.get("description", ""),
                                description_kn=rec.get("description_kn", ""),
                                fertilizer=rec.get("fertilizer"),
                                fertilizer_kn=rec.get("fertilizer_kn"),
                                dosage=rec.get("dosage"),
                                dosage_kn=rec.get("dosage_kn"),
                            ))
                        
                        log(f"Successfully parsed {len(recommendations)} recommendations from Gooey AI")
                        return recommendations
                        
                    except (json.JSONDecodeError, KeyError) as e:
                        log(f"Failed to parse AI response as JSON: {e}")
                        log(f"AI Response (first 500 chars): {str(ai_response)[:500]}")
                        # Fallback to default recommendations
                        return self._get_fallback_recommendations()
                else:
                    error_text = response.text[:500]
                    log(f"Gooey AI error: Status {response.status_code}: {error_text}")
                    response.raise_for_status()
                    return self._get_fallback_recommendations()
                    
        except httpx.HTTPError as e:
            log(f"Gooey AI API error: {e}")
            log(f"NOTE: If you see 404 errors, the model ID '{self.model}' might be incorrect.")
            log(f"Check your Gooey AI dashboard for the correct model ID and update FARMERCHAT_MODEL in config.py")
            # Fallback to default recommendations
            return self._get_fallback_recommendations()
        except Exception as e:
            log(f"Unexpected error calling Gooey AI: {e}")
            import traceback
            log(traceback.format_exc())
            return self._get_fallback_recommendations()

    def _get_fallback_recommendations(self) -> List[Recommendation]:
        """Return fallback recommendations if AI call fails."""
        return [
            Recommendation(
                title="Soil Testing Recommended",
                title_kn="ಮಣ್ಣು ಪರೀಕ್ಷೆ ಶಿಫಾರಸು",
                description="For accurate recommendations, ensure complete soil test data is available.",
                description_kn="ನಿಖರವಾದ ಶಿಫಾರಸುಗಳಿಗಾಗಿ, ಸಂಪೂರ್ಣ ಮಣ್ಣು ಪರೀಕ್ಷಾ ಡೇಟಾ ಲಭ್ಯವಿದೆ ಎಂದು ಖಚಿತಪಡಿಸಿ.",
                fertilizer=None,
                fertilizer_kn=None,
                dosage=None,
                dosage_kn=None,
            )
        ]

