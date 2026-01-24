/**
 * API Service for communicating with the backend
 */

import axios from "axios";
import { API_URL, API_TIMEOUT, ENDPOINTS } from "../config/api";
import type {
  UploadResponse,
  AnalysisResponse,
  RecommendationResponse,
  CropListResponse,
} from "../types";

// Create axios instance with default config
// baseURL comes from API_URL (see config/api.ts)
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Log the initial API URL for debugging
console.log("[API] Initial API URL:", API_URL);

// Global request/response logging for debugging (including production)
apiClient.interceptors.request.use(
  (config) => {
    const method = config.method?.toUpperCase();
    console.log("[API][Request]", {
      method,
      url: `${config.baseURL || ""}${config.url || ""}`,
      timeout: config.timeout,
      headers: config.headers,
      isFormData: config.data instanceof FormData,
    });
    return config;
  },
  (error) => {
    console.error("[API][Request][Error]", error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    console.log("[API][Response]", {
      url: response.config?.url,
      status: response.status,
      dataType: typeof response.data,
    });
    return response;
  },
  (error) => {
    if (error.response) {
      console.error("[API][Response][Error]", {
        url: error.response.config?.url,
        status: error.response.status,
        data:
          typeof error.response.data === "string"
            ? error.response.data
            : JSON.stringify(error.response.data),
      });
    } else if (error.request) {
      console.error("[API][Response][NoResponse]", {
        url: error.config?.url,
      });
    } else {
      console.error("[API][Response][SetupError]", error.message);
    }
    return Promise.reject(error);
  }
);

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
  console.log("[API] uploadImage called", { imageUri });
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

  try {
    const response = await apiClient.post<UploadResponse>(
      ENDPOINTS.upload,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    console.log("[API] uploadImage success", {
      status: response.status,
      dataKeys: Object.keys(response.data || {}),
    });
    return response.data;
  } catch (error) {
    console.error("[API] uploadImage failed", error);
    throw error;
  }
}

/**
 * Analyze an uploaded image (legacy - requires imageId from upload)
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
 * Analyze image directly - no file storage, processes immediately
 * This is the preferred method for Hugging Face Spaces and cloud deployments
 */
export async function analyzeImageDirect(imageUri: string): Promise<AnalysisResponse> {
  console.log("[API] analyzeImageDirect called", { imageUri });
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

  try {
    const response = await apiClient.post<AnalysisResponse>(
      ENDPOINTS.analyzeDirect,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 120000, // 2 minutes for OCR processing
      }
    );
    console.log("[API] analyzeImageDirect success", {
      status: response.status,
      dataKeys: Object.keys(response.data || {}),
    });
    return response.data;
  } catch (error) {
    console.error("[API] analyzeImageDirect failed", error);
    throw error;
  }
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

