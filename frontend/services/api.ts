/**
 * API Service for communicating with the backend
 */

import axios from "axios";
import { API_URL, API_TIMEOUT, ENDPOINTS } from "../config/api";
import { initializeAPIUrl } from "../utils/getLocalIP";
import type {
  UploadResponse,
  AnalysisResponse,
  RecommendationResponse,
  CropListResponse,
} from "../types";

// Create axios instance with default config
// baseURL will be updated when IP is detected
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Update baseURL when IP is detected
initializeAPIUrl().then((url) => {
  apiClient.defaults.baseURL = url;
  console.log("✅ API Client updated with auto-detected URL:", url);
}).catch((error) => {
  console.warn("⚠️ Failed to update API URL:", error);
});

// Log the initial API URL for debugging
console.log("API URL (initial):", API_URL);

/**
 * Check if the API is healthy
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await apiClient.get(ENDPOINTS.health, {
      timeout: 5000, // Faster timeout for health check
    });
    return response.data.status === "healthy";
  } catch (error: any) {
    console.error("Health check failed:", error?.message || error);
    return false;
  }
}

/**
 * Get list of available crops
 */
export async function getCrops(): Promise<CropListResponse> {
  const response = await apiClient.get<CropListResponse>(ENDPOINTS.crops);
  return response.data;
}

/**
 * Upload an image to the server
 */
export async function uploadImage(imageUri: string): Promise<UploadResponse> {
  const formData = new FormData();

  // Get file name and type from URI
  const fileName = imageUri.split("/").pop() || "image.jpg";
  const fileType = fileName.endsWith(".png") ? "image/png" : "image/jpeg";

  // Append image to form data
  formData.append("file", {
    uri: imageUri,
    name: fileName,
    type: fileType,
  } as unknown as Blob);

  const response = await apiClient.post<UploadResponse>(
    ENDPOINTS.upload,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
}

/**
 * Analyze an uploaded image
 */
export async function analyzeImage(imageId: string): Promise<AnalysisResponse> {
  const response = await apiClient.post<AnalysisResponse>(
    ENDPOINTS.analyze,
    { image_id: imageId },
    { timeout: 120000 } // 2 minutes for OCR processing
  );

  return response.data;
}

/**
 * Get recommendations for a crop
 */
export async function getRecommendations(
  cropId: string,
  imageId?: string
): Promise<RecommendationResponse> {
  const url = imageId
    ? `${ENDPOINTS.recommendation(cropId)}?image_id=${imageId}`
    : ENDPOINTS.recommendation(cropId);

  const response = await apiClient.get<RecommendationResponse>(url);
  return response.data;
}

