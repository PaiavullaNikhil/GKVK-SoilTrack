/**
 * API Configuration
 *
 * IP address is now auto-detected! No manual configuration needed.
 * The app will automatically find your computer's IP address on the local network.
 *
 * For production, set EXPO_PUBLIC_API_URL environment variable.
 */

import { getAPIUrlSync, initializeAPIUrl } from "../utils/getLocalIP";

// Initialize with sync version (will use fallback initially)
// Then update asynchronously when IP is detected
let API_URL = getAPIUrlSync();

// Initialize IP detection (non-blocking)
initializeAPIUrl().then((url) => {
  API_URL = url;
  console.log("✅ Auto-detected API URL:", API_URL);
}).catch((error) => {
  console.warn("⚠️ IP auto-detection failed, using fallback:", error);
});

// Export the API URL (will be updated when detection completes)
export { API_URL };

// API request timeout (in milliseconds)
// OCR can take 30+ seconds on first run
export const API_TIMEOUT = 60000;

// API endpoints
export const ENDPOINTS = {
  health: "/",
  crops: "/crops",
  upload: "/upload",
  analyze: "/analyze",
  analyzeDirect: "/analyze-direct", // New: Direct analysis without file storage
  recommendation: (cropId: string) => `/recommendation/${cropId}`,
};

