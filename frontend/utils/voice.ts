import * as Speech from "expo-speech";

let knVoiceId: string | undefined;
let enVoiceId: string | undefined;
let voicesLoaded = false;

async function ensureVoices() {
  if (voicesLoaded) return;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    knVoiceId =
      voices.find((v) => v.language?.startsWith("kn"))?.identifier ||
      undefined;
    enVoiceId =
      voices.find((v) => v.language?.startsWith("en-IN"))?.identifier ||
      voices.find((v) => v.language?.startsWith("en"))?.identifier ||
      undefined;
  } catch {
    // ignore voice loading errors, Speech will fall back to defaults
  } finally {
    voicesLoaded = true;
  }
}

export async function speakKn(text: string) {
  await ensureVoices();
  Speech.speak(text, {
    language: "kn-IN",
    voice: knVoiceId,
    rate: 0.9,
    pitch: 1.0,
  });
}

export async function speakEn(text: string) {
  await ensureVoices();
  Speech.speak(text, {
    // Prefer Indian English if available
    language: "en-IN",
    voice: enVoiceId,
    rate: 0.95,
    pitch: 1.0,
  });
}

