"""Service for integrating with Gooey AI's FarmerCHAT API."""

import httpx
import json
from typing import Optional, List
from models import SoilData, Recommendation
from config import GOOEY_AI_API_KEY, GOOEY_AI_BASE_URL, FARMERCHAT_MODEL


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

    def _create_prompt(self, crop_name: str, crop_name_kn: str, soil_data: Optional[SoilData]) -> str:
        """Create a prompt for FarmerCHAT."""
        soil_info = self._format_soil_data(soil_data) if soil_data else "No soil test data available"
        
        prompt = f"""You are an expert agricultural advisor helping farmers in Karnataka, India. Provide specific, actionable fertilizer and management recommendations.

Crop: {crop_name} ({crop_name_kn})

Soil Test Results:
{soil_info}

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

Provide 3-5 specific recommendations based on the soil test results and crop requirements. Focus on:
1. Nutrient deficiencies that need correction
2. Optimal fertilizer application timing and methods
3. Soil pH correction if needed
4. Micronutrient supplementation if required
5. Best practices for the specific crop

Make recommendations practical, specific, and suitable for Karnataka's agricultural conditions."""
        
        return prompt

    async def get_recommendations(
        self, crop_id: str, crop_name: str, crop_name_kn: str, soil_data: Optional[SoilData] = None
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
            print("Gooey AI API key not configured. Skipping AI recommendations.")
            return None  # Return None to trigger fallback to default recommendations
        
        prompt = self._create_prompt(crop_name, crop_name_kn, soil_data)
        
        try:
            # Gooey AI API call
            # Try multiple common API endpoint patterns
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Try different endpoint patterns
                endpoints_to_try = [
                    f"{self.base_url}/run/{self.model}",
                    f"{self.base_url}/v2/run/{self.model}",
                    f"{self.base_url}/chat",
                    f"{self.base_url}/completions",
                ]
                
                payloads_to_try = [
                    {"input": prompt, "model": self.model},
                    {"prompt": prompt, "model": self.model},
                    {"message": prompt, "model": self.model},
                    {"text": prompt},
                ]
                
                response = None
                result = None
                last_error = None
                
                # Try different combinations
                for endpoint in endpoints_to_try:
                    for payload in payloads_to_try:
                        try:
                            response = await client.post(
                                endpoint,
                                headers={
                                    "Authorization": f"Bearer {self.api_key}",
                                    "Content-Type": "application/json",
                                },
                                json=payload,
                            )
                            if response.status_code == 200:
                                result = response.json()
                                break
                            else:
                                last_error = f"Status {response.status_code}: {response.text}"
                        except Exception as e:
                            last_error = str(e)
                            continue
                    if result:
                        break
                
                if not result:
                    if response:
                        response.raise_for_status()
                    else:
                        raise httpx.HTTPError(f"Failed to connect to Gooey AI: {last_error}")
                
                # Parse the response - try multiple common response formats
                ai_response = (
                    result.get("output") or 
                    result.get("text") or 
                    result.get("response") or 
                    result.get("message") or
                    result.get("content") or
                    str(result)
                )
                
                # Try to parse JSON from the response
                try:
                    # If response is a string, try to extract JSON
                    if isinstance(ai_response, str):
                        # Try to find JSON in the response
                        json_start = ai_response.find("{")
                        json_end = ai_response.rfind("}") + 1
                        if json_start >= 0 and json_end > json_start:
                            ai_response = ai_response[json_start:json_end]
                    
                    parsed = json.loads(ai_response) if isinstance(ai_response, str) else ai_response
                    recommendations_data = parsed.get("recommendations", [])
                    
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
                    
                    return recommendations if recommendations else self._get_fallback_recommendations()
                    
                except (json.JSONDecodeError, KeyError) as e:
                    print(f"Failed to parse AI response: {e}")
                    print(f"AI Response: {ai_response}")
                    # Fallback to default recommendations
                    return self._get_fallback_recommendations()
                    
        except httpx.HTTPError as e:
            print(f"Gooey AI API error: {e}")
            # Fallback to default recommendations
            return self._get_fallback_recommendations()
        except Exception as e:
            print(f"Unexpected error calling Gooey AI: {e}")
            import traceback
            traceback.print_exc()
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

