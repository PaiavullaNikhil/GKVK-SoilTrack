/**
 * Script to automatically detect and set local IP address
 * This runs automatically before Expo starts (via npm scripts)
 */

const os = require("os");
const fs = require("fs");
const path = require("path");

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  // Look for the first non-internal IPv4 address
  // Prefer WiFi/Ethernet adapters
  const preferredNames = ["Wi-Fi", "WiFi", "Ethernet", "en0", "eth0"];
  
  // First, try preferred adapters
  for (const preferredName of preferredNames) {
    if (interfaces[preferredName]) {
      for (const iface of interfaces[preferredName]) {
        if (iface.family === "IPv4" && !iface.internal) {
          return iface.address;
        }
      }
    }
  }
  
  // Fallback: any non-internal IPv4 address
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return null;
}

const ip = getLocalIP();

if (ip) {
  console.log(`\n🌐 Auto-detected local IP: ${ip}`);
  
  // Update the fallback IP in getLocalIP.ts
  const utilsPath = path.join(__dirname, "../utils/getLocalIP.ts");
  let utilsContent = fs.readFileSync(utilsPath, "utf8");
  
  // Update fallback IP
  const updated = utilsContent.replace(
    /const FALLBACK_IP = "[^"]+";/,
    `const FALLBACK_IP = "${ip}";`
  );
  
  if (updated !== utilsContent) {
    fs.writeFileSync(utilsPath, updated, "utf8");
    console.log(`✅ Updated API config to use: ${ip}\n`);
  }
} else {
  console.warn("\n⚠️  Could not auto-detect local IP.");
  console.warn("   Update FALLBACK_IP in utils/getLocalIP.ts manually if needed.\n");
}

