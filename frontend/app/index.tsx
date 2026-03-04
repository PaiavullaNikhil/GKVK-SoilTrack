import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, SafeAreaView, Image } from "react-native";
import { useRouter } from "expo-router";

export default function LandingScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/home");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={require("../assets/farm-photo.jpg")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Overlay with reduced opacity */}
        <View style={styles.overlay} />
        
        {/* Content */}
        <View style={styles.content}>
          {/* Logo/Icon */}
          <View style={styles.logoContainer}>
            <Image source={require("../assets/app-icon.png")} style={styles.logoImage} />
          </View>

          {/* Title Section */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>LRI Fertilizer Advisor</Text>
            <Text style={styles.subtitle}>Healthy Soil, Happy Harvest! 🌾</Text>
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಕಾರ್ಡ್ ಅನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಮತ್ತು ನಿಮ್ಮ ಬೆಳೆಗೆ ಸೂಕ್ತವಾದ ಗೊಬ್ಬರ ಶಿಫಾರಸುಗಳನ್ನು ಪಡೆಯಿರಿ
            </Text>
            <Text style={styles.descriptionEn}>
              Scan your soil health card and get personalized fertilizer recommendations for your crops
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
    backgroundColor: "rgba(0, 0, 0, 0.4)", // Dark overlay with reduced opacity
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  logoImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    resizeMode: "contain",
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: "#E8F5E9",
    textAlign: "center",
    fontWeight: "500",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  descriptionContainer: {
    marginBottom: 50,
    paddingHorizontal: 20,
  },
  description: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 12,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  descriptionEn: {
    fontSize: 14,
    color: "#E8F5E9",
    textAlign: "center",
    lineHeight: 20,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  getStartedButton: {
    backgroundColor: "#1B5E20",
    borderRadius: 30,
    paddingVertical: 18,
    paddingHorizontal: 50,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    minWidth: 200,
  },
  buttonText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  buttonTextEn: {
    fontSize: 14,
    color: "#A5D6A7",
    fontWeight: "500",
  },
});
