import * as Speech from "expo-speech";

// Hard‑coded strict male voices from your device
const KN_MALE_VOICE_ID = "kn-in-x-knd-local";
const EN_MALE_VOICE_ID = "en-in-x-enc-local";

let voiceEnabled = true;

async function ensureVoices() {
  // Voices are fixed; nothing dynamic to load any more.
  return;
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
  await ensureVoices();

  Speech.speak(text, {
    language: "kn-IN",
    voice: KN_MALE_VOICE_ID,
    rate: 0.9,
    pitch: 1.0,
  });
}

export async function speakEn(text: string) {
  if (!voiceEnabled) return;
  await ensureVoices();

  Speech.speak(text, {
    language: "en-IN",
    voice: EN_MALE_VOICE_ID,
    rate: 0.95,
    pitch: 1.0,
  });
}