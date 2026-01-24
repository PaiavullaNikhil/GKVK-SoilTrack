/**
 * API Configuration
 *
 * IP address is now auto-detected! No manual configuration needed.
 * The app will automatically find your computer's IP address on the local network.
 *
 * For production, set EXPO_PUBLIC_API_URL environment variable.
 */

import { getAPIUrlSync } from "../utils/getLocalIP";

// Single source of truth for API base URL
// Prefers EXPO_PUBLIC_API_URL when set (dev + prod), otherwise falls back to local IP
export const API_URL = getAPIUrlSync();

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

