import * as Speech from "expo-speech";

// Preferred male voice identifiers (may not exist on all devices)
const KN_MALE_VOICE_ID = "kn-in-x-knd-local";
const EN_MALE_VOICE_ID = "en-in-x-enc-local";

let voiceEnabled = true;

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

export function setVoiceEnabled(enabled: boolean) {
  voiceEnabled = enabled;
  if (!enabled) {
    Speech.stop();
  }
}

export function getVoiceEnabled() {
  return voiceEnabled;
}

export function stopVoice() {
  Speech.stop();
}

export async function speakKn(text: string) {
  if (!voiceEnabled) return;

  const voiceId = await getSafeVoiceId(KN_MALE_VOICE_ID);

  Speech.speak(text, {
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