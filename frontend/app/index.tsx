import { useRouter } from "expo-router";
import { Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LandingScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/home");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={require("../assets/main-photo.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Overlay with reduced opacity */}
        <View style={styles.overlay} />

        {/* Content */}
        <View style={styles.content}>
          {/* Logo/Icon */}
          <View style={styles.logoContainer}>
            <Image 
              source={require("../assets/app-icon.png")} 
              style={styles.logoImage} 
              resizeMode="contain"
            />
          </View>

          {/* Title Section */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>LRI Fertilizer Advisor</Text>
            <View style={styles.subtitleRow}>
              <Text style={styles.subtitle}>Healthy Soil, Happy Farmer!</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              ಭೂ ಸಂಪನ್ಮೂಲ ಸಮೀಕ್ಷೆ (LRI) ಕಾರ್ಡ್ ಅನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಮತ್ತು ನಿಮ್ಮ ಬೆಳೆಗೆ ಸೂಕ್ತವಾದ ಗೊಬ್ಬರ ಶಿಫಾರಸುಗಳನ್ನು ಪಡೆಯಿರಿ
            </Text>
            <Text style={styles.descriptionEn}>
              Scan your LRI card and get personalized fertilizer recommendations for your crops
            </Text>
          </View>

          {/* Get Started Button */}
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>ಪ್ರಾರಂಭಿಸಿ</Text>
            <Text style={styles.buttonTextEn}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingVertical: 50,
  },
  logoContainer: {
    width: 120,
    height: 120,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  logoImage: {
    width: 85,
    height: 85,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 19,
    color: "#E8F5E9",
    textAlign: "center",
    fontWeight: "500",
    letterSpacing: 0.3,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  subtitleIcon: {
    width: 26,
    height: 26,
    resizeMode: "contain",
  },
  descriptionContainer: {
    marginBottom: 50,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
    borderRadius: 16,
    paddingVertical: 20,
  },
  description: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  descriptionEn: {
    fontSize: 14,
    color: "#E8F5E9",
    textAlign: "center",
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  getStartedButton: {
    backgroundColor: "#1B5E20",
    borderRadius: 30,
    paddingVertical: 18,
    paddingHorizontal: 54,
    alignItems: "center",
    minWidth: 220,
    elevation: 8,
    shadowColor: "#1B5E20",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(165, 214, 167, 0.3)",
  },
  buttonText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  buttonTextEn: {
    fontSize: 14,
    color: "#A5D6A7",
    fontWeight: "500",
    letterSpacing: 0.3,
  },
});
