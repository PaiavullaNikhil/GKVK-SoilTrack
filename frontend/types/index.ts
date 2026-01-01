/**
 * Type definitions for the GKVK App
 */

export interface Crop {
  id: string;
  name: string;
  name_kn: string;
  icon: string;
}

export interface NutrientStatus {
  nutrient: string;
  nutrient_kn: string;
  value: number | null;
  value_raw: string | null;  // Original string like "5.0-5.5"
  unit: string;
  status: "low" | "medium" | "high" | "sufficient" | "unknown";
  status_kn: string;
  color: string;
}

export interface SoilData {
  ph: number | null;
  ec: number | null;
  organic_carbon: number | null;
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
  sulphur: number | null;
  zinc: number | null;
  boron: number | null;
  iron: number | null;
  manganese: number | null;
  copper: number | null;
}

export interface Recommendation {
  title: string;
  title_kn: string;
  description: string;
  description_kn: string;
  fertilizer: string | null;
  fertilizer_kn: string | null;
  dosage: string | null;
  dosage_kn: string | null;
}

export interface UploadResponse {
  success: boolean;
  image_id: string;
  message: string;
  message_kn: string;
}

export interface AnalysisResponse {
  success: boolean;
  image_id: string;
  extracted_text: string;
  soil_data: SoilData;
  nutrient_status: NutrientStatus[];
  message: string;
  message_kn: string;
}

export interface RecommendationResponse {
  success: boolean;
  crop_id: string;
  recommendations: Recommendation[];
}

export interface CropListResponse {
  crops: Crop[];
}

