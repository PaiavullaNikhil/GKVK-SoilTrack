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
  // Intentionally no default Content-Type:
  // - JSON requests will be handled by Axios/React Native automatically
  // - Multipart requests must use multipart/form-data so FastAPI can parse `UploadFile`
  headers: {},
});

// Log the initial API URL for debugging
console.log("[API] Initial API URL:", API_URL);

// Keep track of active API requests (excluding the health check itself) to know if backend is busy/running
let activeRequestsCount = 0;

// Connection state observers/listeners
type ConnectionListener = (status: boolean | null) => void;
const listeners = new Set<ConnectionListener>();
let lastKnownStatus: boolean | null = null;
let isPolling = false;
let pollIntervalId: any = null;

// Resilience: require multiple consecutive failures before marking disconnected
const FAILURE_THRESHOLD = 5;
let consecutiveFailures = 0;

export function subscribeToConnection(listener: ConnectionListener) {
  listeners.add(listener);
  // Send the current status immediately
  listener(lastKnownStatus);
  
  // Start polling if not already started
  startConnectionPolling();

  return () => {
    listeners.delete(listener);
    // Stop polling if no more active observers
    if (listeners.size === 0 && pollIntervalId) {
      clearInterval(pollIntervalId);
      pollIntervalId = null;
      isPolling = false;
    }
  };
}

export function getLastKnownConnectionStatus(): boolean | null {
  return lastKnownStatus;
}

// Force a manual refresh of the health status
export async function refreshConnectionStatus(): Promise<boolean> {
  const healthy = await checkHealth();
  if (healthy) {
    // Success: immediately mark as connected, reset failure counter
    consecutiveFailures = 0;
    broadcastStatus(true);
  } else {
    // Failure: only mark as disconnected after FAILURE_THRESHOLD consecutive failures
    consecutiveFailures++;
    if (consecutiveFailures >= FAILURE_THRESHOLD) {
      broadcastStatus(false);
    }
    // Otherwise keep the last known good status (stay blue)
  }
  return healthy;
}

function broadcastStatus(status: boolean | null) {
  lastKnownStatus = status;
  listeners.forEach((listener) => listener(status));
}

// Keep updateConnectionStatus as a direct setter (used by active-request shortcut)
function updateConnectionStatus(status: boolean | null) {
  if (status === true) {
    consecutiveFailures = 0;
  }
  broadcastStatus(status);
}

function startConnectionPolling() {
  if (isPolling) return;
  isPolling = true;

  // Run initial check immediately if we don't have a status yet
  if (lastKnownStatus === null) {
    refreshConnectionStatus();
  }

  // Poll every 30 seconds (reduced frequency to avoid stressing HF Spaces)
  pollIntervalId = setInterval(async () => {
    // If there are active API requests in progress, we know the backend is communicating and running.
    // We can assume healthy status and skip the health check to avoid blocking or timeout errors.
    if (activeRequestsCount > 0) {
      updateConnectionStatus(true);
      return;
    }
    await refreshConnectionStatus();
  }, 30000);
}

// Global request/response logging for debugging (including production)
apiClient.interceptors.request.use(
  (config) => {
    const isHealthCheck = config.url === ENDPOINTS.health;
    if (!isHealthCheck) {
      activeRequestsCount++;
    }
    const method = config.method?.toUpperCase();
    console.log("[API][Request]", {
      method,
      url: `${config.baseURL || ""}${config.url || ""}`,
      timeout: config.timeout,
      headers: config.headers,
      isFormData: config.data instanceof FormData,
      activeRequests: activeRequestsCount,
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
    const isHealthCheck = response.config?.url === ENDPOINTS.health;
    if (!isHealthCheck) {
      activeRequestsCount = Math.max(0, activeRequestsCount - 1);
      // Any successful API response proves the backend is alive
      updateConnectionStatus(true);
    }
    console.log("[API][Response]", {
      url: response.config?.url,
      status: response.status,
      dataType: typeof response.data,
      activeRequests: activeRequestsCount,
    });
    return response;
  },
  (error) => {
    const isHealthCheck = error.config?.url === ENDPOINTS.health;
    if (!isHealthCheck) {
      activeRequestsCount = Math.max(0, activeRequestsCount - 1);
    }

    // Silently swallow health check errors - they are handled by the polling logic
    if (isHealthCheck) {
      return Promise.reject(error);
    }

    // Use console.warn (not console.error) to avoid triggering React Native RedBox
    if (error.response) {
      console.warn("[API][Response][Error]", {
        url: error.response.config?.url,
        status: error.response.status,
        data:
          typeof error.response.data === "string"
            ? error.response.data
            : JSON.stringify(error.response.data),
        activeRequests: activeRequestsCount,
      });
    } else if (error.request) {
      console.warn("[API][Response][NoResponse]", {
        url: error.config?.url,
        activeRequests: activeRequestsCount,
      });
    } else {
      console.warn("[API][Response][SetupError]", error.message);
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
      timeout: 10000, // Generous timeout for HF Spaces cold starts
    });
    return response.data.status === "healthy" || response.data.status === "ok";
  } catch {
    // Silently fail - polling logic handles the retry/threshold
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
  } as any);

  try {
    const response = await apiClient.post<UploadResponse>(
      ENDPOINTS.upload,
      formData,
      {
        headers: {
          // Ensure FastAPI treats this as multipart; RN/axios will add boundary as needed
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

  // Helper to build a fresh FormData for each attempt
  const buildFormData = () => {
    const fd = new FormData();
    const fileName = imageUri.split("/").pop() || "image.jpg";
    const fileType = fileName.endsWith(".png") ? "image/png" : "image/jpeg";
    fd.append("file", {
      uri: imageUri,
      name: fileName,
      type: fileType,
    } as any);
    return fd;
  };

  const MAX_RETRIES = 2; // total attempts = 2 (initial + 1 retry)

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[API] analyzeImageDirect attempt ${attempt}/${MAX_RETRIES}`);
      const response = await apiClient.post<AnalysisResponse>(
        ENDPOINTS.analyzeDirect,
        buildFormData(),
        {
          headers: {
            // Ensure FastAPI treats this as multipart; RN/axios will add boundary as needed
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
    } catch (error: any) {
      const isNetworkError = !error.response && !!error.request;
      console.error(
        `[API] analyzeImageDirect attempt ${attempt} failed`,
        isNetworkError ? "(network error — no response)" : "(server error)"
      );

      // Only retry on network errors (no response received), not on server errors
      if (isNetworkError && attempt < MAX_RETRIES) {
        console.log("[API] Retrying in 1 second...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      throw error;
    }
  }

  // Should never reach here, but TypeScript needs it
  throw new Error("analyzeImageDirect: unexpected end of retry loop");
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

