/**
 * API Configuration
 *
 * For local development, update API_URL to your machine's IP address.
 * Find your IP with: ipconfig (Windows) or ifconfig (Mac/Linux)
 *
 * For production, update this to your deployed backend URL.
 */

// UPDATE THIS TO YOUR COMPUTER'S IP ADDRESS
// Your phone and computer must be on the same WiFi network
export const API_URL = "http://192.168.29.51:8000";

// API request timeout (in milliseconds)
// OCR can take 30+ seconds on first run
export const API_TIMEOUT = 60000;

// API endpoints
export const ENDPOINTS = {
  health: "/",
  crops: "/crops",
  upload: "/upload",
  analyze: "/analyze",
  recommendation: (cropId: string) => `/recommendation/${cropId}`,
};

