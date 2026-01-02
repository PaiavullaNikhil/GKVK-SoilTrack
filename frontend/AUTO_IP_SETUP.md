# Automatic IP Detection

The app now **automatically detects your local IP address** - no manual configuration needed! 🎉

## How It Works

1. **Automatic Detection**: When you run `npm start`, a script automatically detects your computer's local IP address
2. **Auto-Update**: The detected IP is automatically set in the app configuration
3. **Fallback**: If detection fails, it uses the last detected IP as a fallback

## Usage

Just start the app as usual:

```bash
npm start
# or
npm run android
# or
npm run ios
```

The IP detection runs automatically before Expo starts!

## Manual Override (if needed)

If you need to manually set the IP:

1. Edit `frontend/utils/getLocalIP.ts`
2. Update the `FALLBACK_IP` constant:
   ```typescript
   const FALLBACK_IP = "192.168.1.100"; // Your IP here
   ```

## How Detection Works

The script (`scripts/detect-ip.js`) looks for:
1. **WiFi/Ethernet adapters first** (Wi-Fi, WiFi, Ethernet, en0, eth0)
2. **Any non-internal IPv4 address** as fallback
3. **Skips localhost/loopback** addresses (127.0.0.1, ::1)

## Troubleshooting

**IP not detected correctly?**
- Make sure you're connected to WiFi/Ethernet
- Check your network adapter name matches common patterns
- Manually update `FALLBACK_IP` in `utils/getLocalIP.ts`

**Still using old IP?**
- The script updates the file automatically
- If it's not updating, check file permissions
- You can manually run: `npm run detect-ip`

## Production

For production builds, set the `EXPO_PUBLIC_API_URL` environment variable:
```bash
EXPO_PUBLIC_API_URL=https://your-api.com expo build
```

