import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { checkHealth } from "../services/api";
import { getVoiceEnabled, setVoiceEnabled, speakKn, stopVoice } from "../utils/voice";

export default function HomeScreen() {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [voiceEnabled, setVoiceEnabledState] = useState<boolean>(getVoiceEnabled());

  useEffect(() => {
    refreshConnection();
  }, []);

  const refreshConnection = async () => {
    try {
      setChecking(true);
      const healthy = await checkHealth();
      setIsConnected(healthy);
    } finally {
      setChecking(false);
    }
  };

  const onToggleVoice = (value: boolean) => {
    setVoiceEnabledState(value);
    setVoiceEnabled(value);
    if (!value) {
      stopVoice();
    } else {
      speakKn(
        "ಧ್ವನಿ ಮಾರ್ಗದರ್ಶನವನ್ನು ಆನ್ ಮಾಡಲಾಗಿದೆ. ನೀವು ಯಾವಾಗ ಬೇಕಾದರೂ ಈ ಬಟನ್ ಮೂಲಕ ಇದನ್ನು ಆಫ್ ಮಾಡಬಹುದು."
      );
    }
  };

  const speakWelcome = () => {
    speakKn(
      "ಹೇಗೆ ಬಳಸುವುದು. ಒಂದು, ಭೂ ಸಂಪನ್ಮೂಲ ಸಮೀಕ್ಷೆ ಕಾರ್ಡ್ ಫೋಟೋ ತೆಗೆಯಿರಿ ಅಥವಾ ಗ್ಯಾಲರಿಯಿಂದ ಆಯ್ಕೆಮಾಡಿ. ಎರಡು, ಮಣ್ಣಿನ ಫಲವತ್ತತೆಯ ಆಧಾರದ ಮೇಲೆ ಬೆಳೆಗಳನ್ನು ಆರಿಸಿಕೊಳ್ಳಿ. ಮೂರು, ಭೂ ಪ್ರದೇಶ ಅಥವಾ ಸಸ್ಯ ಸಂಖ್ಯೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ ಮತ್ತು ರಸಗೊಬ್ಬರ ವಿವರಗಳನ್ನು ಪಡೆಯಿರಿ."
    );
  };

  const steps = [
    {
      id: 1,
      titleEn: "Take or choose LRI card photo",
      titleKn: "ಫೋಟೋ ತೆಗೆಯಿರಿ / ಅಥವಾ ಆಯ್ಕೆಮಾಡಿ",
      descKn:
        "ಭೂ ಸಂಪನ್ಮೂಲ ಸಮೀಕ್ಷೆ (LRI) ಕಾರ್ಡ್ ಫೋಟೋ ತೆಗೆಯಿರಿ ಅಥವಾ ಗ್ಯಾಲರಿಯಿಂದ ಆಯ್ಕೆಮಾಡಿ",
    },
    {
      id: 2,
      titleEn: "Select crops based on soil fertility",
      titleKn: "ಬೆಳೆಗಳನ್ನು ಆರಿಸಿಕೊಳ್ಳಿ",
      descKn:
        "ಮಣ್ಣಿನ ಫಲವತ್ತತೆಯ ಆಧಾರದ ಮೇಲೆ ಬೆಳೆಗಳನ್ನು ಆರಿಸಿಕೊಳ್ಳಿ",
    },
    {
      id: 3,
      titleEn: "Get fertilizer details",
      titleKn: "ವಿವರಗಳನ್ನು ಪಡೆಯಿರಿ",
      descKn:
        "ಭೂ ಪ್ರದೇಶ (ಗುಂಟೆ) ಅಥವಾ ಸಸ್ಯ ಸಂಖ್ಯೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ ಮತ್ತು ರಸಗೊಬ್ಬರ ವಿವರಗಳನ್ನು ಪಡೆಯಿರಿ.",
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banner Section */}
        <View style={styles.heroBannerContainer}>
          <Image
            source={require("../assets/soil_track_hero_banner.png")}
            style={styles.heroBannerImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay}>
            <View style={styles.greetingBlock}>
              <Text style={styles.greetingKn}>ನಮಸ್ಕಾರ!</Text>
              <Text style={styles.greetingSubKn}>ಮಣ್ಣಿನ ಆರೋಗ್ಯವೇ ದೇಶದ ಭಾಗ್ಯ</Text>
              <Text style={styles.greetingEn}>Welcome! Healthy Soil, Happy Farmer</Text>
            </View>
          </View>
        </View>

        <View style={styles.contentBody}>
          {/* Primary CTA: camera scan */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.scanCard}
            onPress={() => {
              stopVoice();
              router.push("/upload");
            }}
          >
            <View style={styles.scanCardLeft}>
              <View style={styles.scanIconBox}>
                <Text style={styles.scanIconEmoji}>📸</Text>
              </View>
              <View style={styles.scanCardTextCol}>
                <Text style={styles.scanTitleKn}>ಕ್ಯಾಮೆರಾ ಸ್ಕ್ಯಾನ್ ಪ್ರಾರಂಭಿಸಿ</Text>
                <Text style={styles.scanTitleEn}>Start Camera Scan</Text>
              </View>
            </View>
            <View style={styles.scanCardRight}>
              <Text style={styles.howToArrowEmoji}>➡️</Text>
            </View>
          </TouchableOpacity>

          {/* Voice guidance toggle card */}
          <View style={styles.voiceToggleCard}>
            <View style={styles.voiceToggleLeft}>
              <View
                style={[
                  styles.voiceToggleIconBox,
                  voiceEnabled ? styles.voiceToggleIconOn : styles.voiceToggleIconOff,
                ]}
              >
                <Text style={styles.voiceToggleEmoji}>
                  {voiceEnabled ? "🔊" : "🔇"}
                </Text>
              </View>
              <View>
                <Text style={styles.voiceToggleLabelKn}>ಧ್ವನಿ ಮಾರ್ಗದರ್ಶನ</Text>
                <Text style={styles.voiceToggleLabelEn}>Voice guidance</Text>
              </View>
            </View>
            <Switch
              value={voiceEnabled}
              onValueChange={onToggleVoice}
              thumbColor={voiceEnabled ? "#FFFFFF" : "#f4f3f4"}
              trackColor={{ false: "#D1D5DB", true: "#1B5E20" }}
            />
          </View>

          {/* How to use (voice) */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.howToCard}
            onPress={speakWelcome}
          >
            <View style={styles.howToLeft}>
              <View style={styles.howToIconCircle}>
                <Text style={styles.howToEmoji}>▶️</Text>
              </View>
              <View>
                <Text style={styles.howToTitleKn}>ಬಳಸುವುದು ಹೇಗೆ?</Text>
                <Text style={styles.howToTitleEn}>How to use (Audio guide)</Text>
              </View>
            </View>
            <View style={styles.howToRight}>
              <Text style={styles.howToListen}>LISTEN</Text>
              <Text style={styles.howToArrowEmoji}>➡️</Text>
            </View>
          </TouchableOpacity>

        {/* Steps / Instructions - Restored UI */}
        <View style={styles.stepsSection}>
          <View style={styles.stepsDividerRow}>
            <View style={styles.stepsDividerLine} />
            <Text style={styles.stepsDividerLabel}>Instructions</Text>
            <View style={styles.stepsDividerLine} />
          </View>

          {steps.map((step) => (
            <View key={step.id} style={styles.stepCard}>
              <View style={styles.stepNumberCol}>
                <View style={styles.stepNumberCircle}>
                  <Text style={styles.stepNumberText}>{step.id}</Text>
                </View>
                <View style={styles.stepConnector} />
              </View>
              <View style={styles.stepContentCol}>
                <Text style={styles.stepTitleEn}>{step.titleEn}</Text>
                <Text style={styles.stepTitleKn}>{step.titleKn}</Text>
                <Text style={styles.stepDescKn}>{step.descKn}</Text>
              </View>
            </View>
          ))}
        </View>

            {/* Quick Tip / Info section to fill space */}
            <View style={styles.tipCard}>
              <View style={styles.tipHeader}>
                <Text style={styles.tipEmoji}>💡</Text>
                <Text style={styles.tipTitle}>ಮಣ್ಣಿನ ಸಲಹೆ / Quick Tip</Text>
              </View>
              <Text style={styles.tipText}>
                ಮಣ್ಣಿನ ಸಾರವನ್ನು ಕಾಪಾಡಿಕೊಳ್ಳಲು ಸರಿಯಾದ ಪ್ರಮಾಣದಲ್ಲಿ ರಸಗೊಬ್ಬರ ಬಳಸುವುದು ಅತ್ಯಂತ ಅವಶ್ಯಕ.
              </Text>
              <Text style={styles.tipTextEn}>
                Using the right amount of fertilizer is essential to maintain soil fertility.
              </Text>
            </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  contentBody: {
    padding: 16,
  },
  heroBannerContainer: {
    width: "100%",
    height: 180,
    backgroundColor: "#E8F5E9",
    position: "relative",
    overflow: "hidden",
  },
  heroBannerImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
  },

  /* Header */
  appHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  appHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  appIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  appIconText: {
    fontSize: 22,
  },
  appTitleKn: {
    fontSize: 18,
    fontWeight: "700",
    color: "#052e16",
  },
  appTitleEn: {
    fontSize: 11,
    color: "#16A34A",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusPillPending: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FACC15",
  },
  statusPillOk: {
    backgroundColor: "#DBEAFE",
    borderColor: "#3B82F6",
  },
  statusPillError: {
    backgroundColor: "#FEE2E2",
    borderColor: "#F97373",
  },
  statusPillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "600",
  },

  /* Greeting */
  greetingBlock: {
    marginBottom: 0,
  },
  greetingKn: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  greetingSubKn: {
    fontSize: 15,
    color: "#E8F5E9",
    marginTop: 2,
    fontWeight: "500",
  },
  greetingEn: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
    fontStyle: "italic",
  },

  /* Scan Card */
  scanCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  scanCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  scanCardTextCol: {
    flex: 1,
  },
  scanTitleKn: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  scanTitleEn: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  scanIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  scanCardRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  scanIcon: {
    fontSize: 30,
    color: "#FFFFFF",
  },

  /* Voice toggle card */
  voiceToggleCard: {
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  voiceToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  voiceToggleIconBox: {
    padding: 6,
    borderRadius: 12,
    marginRight: 10,
  },
  voiceToggleIconOn: {
    backgroundColor: "#E8F5E9",
  },
  voiceToggleIconOff: {
    backgroundColor: "#F3F4F6",
  },
  voiceToggleIcon: {
    fontSize: 18,
  },
  voiceToggleLabelKn: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  voiceToggleLabelEn: {
    fontSize: 11,
    color: "#6B7280",
  },

  /* How to card */
  howToCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#E8F5E9",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#C8E6C9",
    marginBottom: 24,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  howToLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  howToIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    elevation: 1,
  },
  howToIcon: {
    fontSize: 20,
  },
  howToTitleKn: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  howToTitleEn: {
    fontSize: 11,
    color: "#6B7280",
  },
  howToRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  howToListen: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1B5E20",
    marginRight: 6,
  },
  scanIconEmoji: {
    fontSize: 24,
    textAlign: "center",
  },
  voiceToggleEmoji: {
    fontSize: 20,
  },
  howToEmoji: {
    fontSize: 20,
  },
  howToArrowEmoji: {
    fontSize: 14,
    color: "#1B5E20",
  },

  /* Steps section styles - Restored */
  stepsSection: {
    paddingTop: 8,
  },
  stepsDividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  stepsDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  stepsDividerLabel: {
    paddingHorizontal: 8,
    fontSize: 10,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  stepCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  stepNumberCol: {
    alignItems: "center",
    marginRight: 10,
  },
  stepNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#C8E6C9",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1B5E20",
  },
  stepConnector: {
    width: 2,
    height: 40,
    backgroundColor: "#E8F5E9",
    marginTop: 4,
  },
  stepContentCol: {
    flex: 1,
  },
  stepTitleKn: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  stepTitleEn: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  stepDescKn: {
    fontSize: 12,
    color: "#4B5563",
    lineHeight: 18,
  },
  tipCard: {
    backgroundColor: "#F0F9FF",
    borderRadius: 14,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  tipEmoji: {
    fontSize: 18,
    marginRight: 10,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0369A1",
  },
  tipText: {
    fontSize: 12,
    color: "#0C4A6E",
    lineHeight: 18,
  },
  tipTextEn: {
    fontSize: 11,
    color: "#0369A1",
    marginTop: 2,
    opacity: 0.8,
  },
});