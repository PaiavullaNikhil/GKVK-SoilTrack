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
import { checkHealth } from "../services/api";
import { getVoiceEnabled, setVoiceEnabled, speakKn, stopVoice } from "../utils/voice";

export default function HomeScreen() {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [voiceEnabled, setVoiceEnabledState] = useState<boolean>(getVoiceEnabled());

  useEffect(() => {
    checkApiConnection();
  }, []);

  const checkApiConnection = async () => {
    const healthy = await checkHealth();
    setIsConnected(healthy);
  };

  const onToggleVoice = (value: boolean) => {
    setVoiceEnabledState(value);
    setVoiceEnabled(value);
    if (value) {
      speakKn(
        "ಧ್ವನಿ ಮಾರ್ಗದರ್ಶನವನ್ನು ಆನ್ ಮಾಡಲಾಗಿದೆ. ನೀವು ಯಾವಾಗ ಬೇಕಾದರೂ ಹೋಮ್ ಪುಟದಲ್ಲಿ ಇದನ್ನು ಆಫ್ ಮಾಡಬಹುದು."
      );
    }
  };

  const speakWelcome = () => {
    speakKn(
      "ಹೇಗೆ ಬಳಸುವುದು. ಒಂದು, ಭೂ ಸಂಪನ್ಮೂಲ ಸಮೀಕ್ಷೆ (LRI) ಕಾರ್ಡ್ ಫೋಟೋ ತೆಗೆಯಿರಿ ಅಥವಾ ಗ್ಯಾಲರಿಯಿಂದ ಆಯ್ಕೆಮಾಡಿ. ಎರಡು, ಮಣ್ಣಿನ ಫಲವತ್ತತೆಯ ಆಧಾರದ ಮೇಲೆ ಬೆಳೆಗಳನ್ನು ಆರಿಸಿಕೊಳ್ಳಿ. ಮೂರು, ಭೂ ಪ್ರದೇಶ (ಗುಂಟೆ) ಅಥವಾ ಸಸ್ಯ ಸಂಖ್ಯೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ ಮತ್ತು ರಸಗೊಬ್ಬರ ವಿವರಗಳನ್ನು ಪಡೆಯಿರಿ."
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo/Header Section */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image source={require("../assets/app-icon.png")} style={styles.logoImage} />
          </View>
        </View>

        {/* Connection Status */}
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  isConnected === null
                    ? "#FFC107"
                    : isConnected
                      ? "#4CAF50"
                      : "#F44336",
              },
            ]}
          />
          <View>
            <Text style={styles.statusText}>
              {isConnected === null
                ? "ಸಂಪರ್ಕಿಸಲಾಗುತ್ತಿದೆ..."
                : isConnected
                  ? "ಸರ್ವರ್ ಸಂಪರ್ಕಗೊಂಡಿದೆ"
                  : "ಸರ್ವರ್ ಸಂಪರ್ಕವಿಲ್ಲ"}
            </Text>
            <Text style={styles.statusTextEn}>
              {isConnected === null
                ? "Connecting..."
                : isConnected
                  ? "Server Connected"
                  : "Server Disconnected"}
            </Text>
          </View>
        </View>

        {/* Main Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              stopVoice();
              router.push("/upload");
            }}
          >
            <Text style={styles.buttonIcon}>📸</Text>
            <Text style={styles.buttonText}>ಪ್ರಾರಂಭಿಸಿ</Text>
            <Text style={styles.buttonSubtext}>Start Scanning</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.voiceButton} onPress={speakWelcome}>
            <Text style={styles.voiceIcon}>🔊</Text>
            <View>
              <Text style={styles.voiceText}>ಕನ್ನಡದಲ್ಲಿ ಕೇಳಿ</Text>
              <Text style={styles.voiceTextEn}>Listen in Kannada</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.voiceToggleRow}>
            <View>
              <Text style={styles.voiceToggleLabelKn}>ಧ್ವನಿ ಮಾರ್ಗದರ್ಶನ</Text>
              <Text style={styles.voiceToggleLabelEn}>Voice guidance</Text>
            </View>
            <Switch
              value={voiceEnabled}
              onValueChange={onToggleVoice}
              thumbColor={voiceEnabled ? "#1B5E20" : "#f4f3f4"}
              trackColor={{ false: "#d4d4d4", true: "#A5D6A7" }}
            />
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoContainer}>
          <View>
            <Text style={styles.infoTitle}>ಹೇಗೆ ಬಳಸುವುದು?</Text>
            <Text style={styles.infoTitleEn}>How to Use?</Text>
          </View>
          <View style={styles.infoStep}>
            <Text style={styles.stepNumber}>1</Text>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepText}>
                ಭೂ ಸಂಪನ್ಮೂಲ ಸಮೀಕ್ಷೆ (LRI) ಕಾರ್ಡ್ ಫೋಟೋ ತೆಗೆಯಿರಿ ಅಥವಾ ಗ್ಯಾಲರಿಯಿಂದ ಆಯ್ಕೆಮಾಡಿ
              </Text>
              <Text style={styles.stepTextEn}>Take or choose LRI card photo</Text>
            </View>
          </View>
          <View style={styles.infoStep}>
            <Text style={styles.stepNumber}>2</Text>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepText}>
                ಮಣ್ಣಿನ ಫಲವತ್ತತೆಯ ಆಧಾರದ ಮೇಲೆ ಬೆಳೆಗಳನ್ನು ಆರಿಸಿಕೊಳ್ಳಿ
              </Text>
              <Text style={styles.stepTextEn}>
                Select crops based on soil fertility
              </Text>
            </View>
          </View>
          <View style={styles.infoStep}>
            <Text style={styles.stepNumber}>3</Text>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepText}>
              ಭೂ ಪ್ರದೇಶ (ಗುಂಟೆ) ಅಥವಾ ಸಸ್ಯ ಸಂಖ್ಯೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ ಮತ್ತು ರಸಗೊಬ್ಬರ ವಿವರಗಳನ್ನು ಪಡೆಯಿರಿ.
              </Text>
              <Text style={styles.stepTextEn}>
                Select land area (guntas) or plant count and get fertilizer details
              </Text>
            </View>
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
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 14,
  },
  logoContainer: {
    width: 70,
    height: 70,
    backgroundColor: "#E8F5E9",
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  logoImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1B5E20",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  statusText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  statusTextEn: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 2,
  },
  actionsContainer: {
    marginBottom: 18,
  },
  primaryButton: {
    backgroundColor: "#1B5E20",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#1B5E20",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#1B5E20",
  },
  buttonIcon: {
    fontSize: 30,
    marginBottom: 6,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  buttonSubtext: {
    fontSize: 13,
    color: "#A5D6A7",
    marginTop: 3,
  },
  buttonTextSecondary: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1B5E20",
  },
  buttonSubtextSecondary: {
    fontSize: 12,
    color: "#666",
    marginTop: 3,
  },
  voiceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F5E9",
    borderRadius: 10,
    padding: 12,
  },
  voiceIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  voiceText: {
    fontSize: 16,
    color: "#1B5E20",
    fontWeight: "500",
  },
  voiceTextEn: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  voiceToggleRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  voiceToggleLabelKn: {
    fontSize: 13,
    color: "#1B5E20",
    fontWeight: "500",
  },
  voiceToggleLabelEn: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
  },
  infoContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
    textAlign: "center",
  },
  infoTitleEn: {
    fontSize: 12,
    color: "#666",
    marginBottom: 14,
    textAlign: "center",
  },
  infoStep: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  stepNumber: {
    width: 26,
    height: 26,
    backgroundColor: "#1B5E20",
    borderRadius: 13,
    color: "#fff",
    textAlign: "center",
    lineHeight: 26,
    fontSize: 12,
    fontWeight: "bold",
    marginRight: 12,
    overflow: "hidden",
  },
  stepTextContainer: {
    flex: 1,
  },
  stepText: {
    fontSize: 14,
    color: "#333",
  },
  stepTextEn: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
});

