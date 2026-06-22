import * as FileSystem from "expo-file-system/legacy";
import * as Speech from "expo-speech";

// Preferred male voice identifiers (may not exist on all devices)
const KN_MALE_VOICE_ID = "kn-in-x-knd-local";
const EN_MALE_VOICE_ID = "en-in-x-enc-local";

const SETTINGS_FILE = FileSystem.documentDirectory + "voice_settings.json";

let voiceEnabled = true;
let isInitialized = false;

async function getSafeVoiceId(preferredId: string | null) {
  if (!preferredId) return null;

  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const match = voices.find((v) => v.identifier === preferredId);
    return match ? preferredId : null;
  } catch {
    // If we can't query voices, just fall back to default
    return null;
  }
}

export async function initializeVoiceSettings() {
  if (isInitialized) return voiceEnabled;
  try {
    const fileInfo = await FileSystem.getInfoAsync(SETTINGS_FILE);
    if (fileInfo.exists) {
      const content = await FileSystem.readAsStringAsync(SETTINGS_FILE);
      const settings = JSON.parse(content);
      if (settings && typeof settings.voiceEnabled === "boolean") {
        voiceEnabled = settings.voiceEnabled;
      }
    }
  } catch (error) {
    console.error("[VoiceSettings] Error loading voice settings:", error);
  } finally {
    isInitialized = true;
  }
  return voiceEnabled;
}

export async function setVoiceEnabled(enabled: boolean) {
  voiceEnabled = enabled;
  if (!enabled) {
    Speech.stop();
  }
  try {
    const settings = { voiceEnabled: enabled };
    await FileSystem.writeAsStringAsync(SETTINGS_FILE, JSON.stringify(settings));
  } catch (error) {
    console.error("[VoiceSettings] Error saving voice settings:", error);
  }
}

export function getVoiceEnabled() {
  return voiceEnabled;
}

export function stopVoice() {
  Speech.stop();
}

const PRONUNCIATION_FIXES: Record<string, string> = {
  "ತೊಗರಿ": "ತೊಗರಿ",
};

export async function speakKn(text: string) {
  if (!voiceEnabled) return;

  // Apply pronunciation fixes
  let processedText = text;
  Object.keys(PRONUNCIATION_FIXES).forEach((word) => {
    processedText = processedText.replace(new RegExp(word, "g"), PRONUNCIATION_FIXES[word]);
  });

  const voiceId = await getSafeVoiceId(KN_MALE_VOICE_ID);

  Speech.speak(processedText, {
    language: "kn-IN",
    // If preferred voice is missing, let system choose a suitable Kannada voice
    voice: voiceId ?? undefined,
    rate: 0.9,
    pitch: 1.0,
  });
}

export async function speakEn(text: string) {
  if (!voiceEnabled) return;

  const voiceId = await getSafeVoiceId(EN_MALE_VOICE_ID);

  Speech.speak(text, {
    language: "en-IN",
    // If preferred voice is missing, let system choose a suitable English voice
    voice: voiceId ?? undefined,
    rate: 0.95,
    pitch: 1.0,
  });
}