import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from "react-native";
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      {/* Logo/Header Section */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>🌱</Text>
        </View>
        <Text style={styles.title}>GKVK ಮಣ್ಣು ವಿಶ್ಲೇಷಣೆ</Text>
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
          onPress={() => router.push("/upload")}
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
              ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಕಾರ್ಡ್ ಫೋಟೋ ತೆಗೆಯಿರಿ
            </Text>
            <Text style={styles.stepTextEn}>Take photo of soil health card</Text>
          </View>
        </View>
        <View style={styles.infoStep}>
          <Text style={styles.stepNumber}>2</Text>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepText}>ಮಣ್ಣು ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ಬೆಳೆ ಆಯ್ಕೆಮಾಡಿ</Text>
            <Text style={styles.stepTextEn}>Analyze soil and select crop</Text>
          </View>
        </View>
        <View style={styles.infoStep}>
          <Text style={styles.stepNumber}>3</Text>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepText}>ಗೊಬ್ಬರ ಶಿಫಾರಸು ಪಡೆಯಿರಿ</Text>
            <Text style={styles.stepTextEn}>Get fertilizer recommendations</Text>
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
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 15,
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
  logoText: {
    fontSize: 35,
  },
  title: {
    fontSize: 24,
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
    marginBottom: 15,
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
    textAlign: "center",
  },
  statusTextEn: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 2,
  },
  actionsContainer: {
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: "#1B5E20",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
  infoContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
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
    marginBottom: 12,
    textAlign: "center",
  },
  infoStep: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  stepNumber: {
    width: 24,
    height: 24,
    backgroundColor: "#1B5E20",
    borderRadius: 12,
    color: "#fff",
    textAlign: "center",
    lineHeight: 24,
    fontSize: 12,
    fontWeight: "bold",
    marginRight: 10,
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
    color: "#666",
    marginTop: 2,
  },
});

