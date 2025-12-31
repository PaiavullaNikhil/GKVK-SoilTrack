import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import * as Speech from "expo-speech";
import { checkHealth } from "../services/api";

export default function HomeScreen() {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    checkApiConnection();
  }, []);

  const checkApiConnection = async () => {
    const healthy = await checkHealth();
    setIsConnected(healthy);
  };

  const speakWelcome = () => {
    Speech.speak(
      "ಜಿಕೆವಿಕೆ ಮಣ್ಣು ವಿಶ್ಲೇಷಣೆ ಆಪ್‌ಗೆ ಸುಸ್ವಾಗತ. ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಕಾರ್ಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಲು ಪ್ರಾರಂಭಿಸಿ ಒತ್ತಿರಿ.",
      { language: "kn-IN" }
    );
  };

  return (
    <View style={styles.container}>
      {/* Logo/Header Section */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>🌱</Text>
        </View>
        <Text style={styles.title}>GKVK ಮಣ್ಣು ವಿಶ್ಲೇಷಣೆ</Text>
        <Text style={styles.subtitle}>Soil Health Card Analyzer</Text>
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
        <Text style={styles.statusText}>
          {isConnected === null
            ? "ಸಂಪರ್ಕಿಸಲಾಗುತ್ತಿದೆ..."
            : isConnected
            ? "ಸರ್ವರ್ ಸಂಪರ್ಕಗೊಂಡಿದೆ"
            : "ಸರ್ವರ್ ಸಂಪರ್ಕವಿಲ್ಲ"}
        </Text>
      </View>

      {/* Main Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/upload")}
        >
          <Text style={styles.buttonIcon}>📸</Text>
          <Text style={styles.buttonText}>ಪ್ರಾರಂಭಿಸಿ</Text>
          <Text style={styles.buttonSubtext}>Start Scanning</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push("/crops")}
        >
          <Text style={styles.buttonIcon}>🌾</Text>
          <Text style={styles.buttonTextSecondary}>ಬೆಳೆ ಆಯ್ಕೆ</Text>
          <Text style={styles.buttonSubtextSecondary}>Select Crop</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.voiceButton} onPress={speakWelcome}>
          <Text style={styles.voiceIcon}>🔊</Text>
          <Text style={styles.voiceText}>ಕನ್ನಡದಲ್ಲಿ ಕೇಳಿ</Text>
        </TouchableOpacity>
      </View>

      {/* Info Section */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>ಹೇಗೆ ಬಳಸುವುದು?</Text>
        <View style={styles.infoStep}>
          <Text style={styles.stepNumber}>1</Text>
          <Text style={styles.stepText}>
            ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಕಾರ್ಡ್ ಫೋಟೋ ತೆಗೆಯಿರಿ
          </Text>
        </View>
        <View style={styles.infoStep}>
          <Text style={styles.stepNumber}>2</Text>
          <Text style={styles.stepText}>ನಿಮ್ಮ ಬೆಳೆ ಆಯ್ಕೆಮಾಡಿ</Text>
        </View>
        <View style={styles.infoStep}>
          <Text style={styles.stepNumber}>3</Text>
          <Text style={styles.stepText}>ಗೊಬ್ಬರ ಶಿಫಾರಸು ಪಡೆಯಿರಿ</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: "#E8F5E9",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  logoText: {
    fontSize: 40,
  },
  title: {
    fontSize: 26,
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
    marginBottom: 25,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: "#666",
  },
  actionsContainer: {
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: "#1B5E20",
    borderRadius: 15,
    padding: 25,
    alignItems: "center",
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 2,
    borderColor: "#1B5E20",
  },
  buttonIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  buttonSubtext: {
    fontSize: 14,
    color: "#A5D6A7",
    marginTop: 4,
  },
  buttonTextSecondary: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1B5E20",
  },
  buttonSubtextSecondary: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
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
  infoContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  infoStep: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    backgroundColor: "#1B5E20",
    borderRadius: 14,
    color: "#fff",
    textAlign: "center",
    lineHeight: 28,
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 12,
  },
  stepText: {
    fontSize: 15,
    color: "#333",
    flex: 1,
  },
});

