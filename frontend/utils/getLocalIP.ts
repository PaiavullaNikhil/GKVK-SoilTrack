/**
 * Utility to automatically detect local IP address
 * Falls back to manual config if detection fails
 */

import { Platform } from "react-native";

// Fallback IP - automatically updated by detect-ip.js script
// If auto-detection fails, this will be your current IP
const FALLBACK_IP = "192.168.68.63";
const API_PORT = 8000;

/**
 * Get the local IP address automatically
 * Tries multiple methods to detect the IP
 */
export async function getLocalIP(): Promise<string> {
  try {
    // Method 1: Check environment variable first (highest priority)
    const envIP = process.env.EXPO_PUBLIC_API_IP;
    if (envIP) {
      console.log("✅ Using IP from environment:", envIP);
      return envIP;
    }

    // Method 2: Try to get IP from Metro bundler (Expo development)
    // When running on device, Metro bundler knows the dev machine's IP
    if (Platform.OS !== "web" && __DEV__) {
      try {
        const Constants = require("expo-constants");
        const manifest = Constants.expoConfig || Constants.manifest;
        
        // Check if we can get IP from Metro bundler URL
        if (manifest?.extra?.serverUrl) {
          const url = new URL(manifest.extra.serverUrl);
          const hostname = url.hostname;
          if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
            console.log("✅ Auto-detected IP from Metro:", hostname);
            return hostname;
          }
        }
      } catch (e) {
        // Silently fail - this is expected in many cases
      }
    }

    // Method 3: For web/development, try localhost
    if (__DEV__ && Platform.OS === "web") {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 500);
        
        const response = await fetch("http://localhost:8000/", {
          method: "GET",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        
        // If localhost works, we're on the same machine
        if (response.ok) {
          console.log("✅ Using localhost for web development");
          return "localhost";
        }
      } catch (e) {
        // localhost doesn't work, continue
      }
    }

    // Method 4: Use fallback (automatically updated by detect-ip.js script)
    // This is the most reliable method since the script runs before app starts
    // Only log if we're in dev mode and the IP seems wrong
    if (__DEV__ && FALLBACK_IP === "192.168.68.63") {
      // This is the default, might need updating
      console.log(`ℹ️  Using fallback IP: ${FALLBACK_IP} (auto-updated by detect-ip.js)`);
    }
    return FALLBACK_IP;
  } catch (error) {
    // Silently return fallback - the script-based detection is the primary method
    return FALLBACK_IP;
  }
}

/**
 * Get the full API URL with auto-detected IP
 */
export async function getAPIUrl(): Promise<string> {
  const ip = await getLocalIP();
  return `http://${ip}:${API_PORT}`;
}

/**
 * Synchronous version that uses cached IP or fallback
 * Use this for initial config, then update with async version
 */
let cachedIP: string | null = null;

export function getAPIUrlSync(): string {
  if (cachedIP) {
    return `http://${cachedIP}:${API_PORT}`;
  }
  // Try environment variable first
  const envIP = process.env.EXPO_PUBLIC_API_IP || FALLBACK_IP;
  return `http://${envIP}:${API_PORT}`;
}

/**
 * Initialize and cache the IP address
 * Call this early in the app lifecycle
 */
export async function initializeAPIUrl(): Promise<string> {
  const ip = await getLocalIP();
  cachedIP = ip;
  return `http://${ip}:${API_PORT}`;
}

