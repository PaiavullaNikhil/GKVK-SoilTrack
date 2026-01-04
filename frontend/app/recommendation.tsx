import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Speech from "expo-speech";
import { getRecommendations } from "../services/api";
import type { Recommendation } from "../types";

export default function RecommendationScreen() {
  const router = useRouter();
  const { cropId, imageId } = useLocalSearchParams<{
    cropId: string;
    imageId?: string;
  }>();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, [cropId, imageId]);

  const loadRecommendations = async () => {
    try {
      const response = await getRecommendations(cropId, imageId);
      setRecommendations(response.recommendations);
    } catch (error) {
      console.error("Failed to load recommendations:", error);
      // Use fallback recommendations
      setRecommendations([
        {
          title: "Soil Testing",
          title_kn: "ಮಣ್ಣು ಪರೀಕ್ಷೆ",
          description:
            "Get your soil tested every 2-3 years for accurate fertilizer recommendations",
          description_kn:
            "ನಿಖರವಾದ ಗೊಬ್ಬರ ಶಿಫಾರಸುಗಳಿಗಾಗಿ ಪ್ರತಿ 2-3 ವರ್ಷಗಳಿಗೊಮ್ಮೆ ನಿಮ್ಮ ಮಣ್ಣನ್ನು ಪರೀಕ್ಷಿಸಿ",
          fertilizer: null,
          fertilizer_kn: null,
          dosage: null,
          dosage_kn: null,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const speakRecommendation = (rec: Recommendation) => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    const text = `${rec.title_kn}. ${rec.description_kn}. ${
      rec.fertilizer_kn ? `ಗೊಬ್ಬರ: ${rec.fertilizer_kn}.` : ""
    } ${rec.dosage_kn ? `ಪ್ರಮಾಣ: ${rec.dosage_kn}` : ""}`;

    setIsSpeaking(true);
    Speech.speak(text, {
      language: "kn-IN",
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
    });
  };

  const speakAll = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    const allText = recommendations
      .map(
        (rec, index) =>
          `ಶಿಫಾರಸು ${index + 1}: ${rec.title_kn}. ${rec.description_kn}`
      )
      .join(". ");

    setIsSpeaking(true);
    Speech.speak(allText, {
      language: "kn-IN",
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1B5E20" />
        <Text style={styles.loadingText}>ಶಿಫಾರಸುಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>ಗೊಬ್ಬರ ಶಿಫಾರಸುಗಳು</Text>
          <Text style={styles.subtitle}>Fertilizer Recommendations</Text>

          <TouchableOpacity style={styles.speakAllButton} onPress={speakAll}>
            <Text style={styles.speakIcon}>{isSpeaking ? "⏹️" : "🔊"}</Text>
            <Text style={styles.speakAllText}>
              {isSpeaking ? "ನಿಲ್ಲಿಸಿ" : "ಎಲ್ಲವನ್ನೂ ಕೇಳಿ"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recommendations */}
        {recommendations.map((rec, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.numberBadge}>
                <Text style={styles.numberText}>{index + 1}</Text>
              </View>
              <View style={styles.cardTitles}>
                <Text style={styles.cardTitle}>{rec.title_kn}</Text>
                <Text style={styles.cardTitleEn}>{rec.title}</Text>
              </View>
              <TouchableOpacity
                style={styles.speakButton}
                onPress={() => speakRecommendation(rec)}
              >
                <Text style={styles.speakButtonIcon}>🔊</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.description}>{rec.description_kn}</Text>
            <Text style={styles.descriptionEn}>{rec.description}</Text>

            {(rec.fertilizer || rec.dosage) && (
              <View style={styles.detailsContainer}>
                {rec.fertilizer && (
                  <View style={styles.detailRow}>
                    <View style={styles.detailLabelContainer}>
                      <Text style={styles.detailLabel}>ಗೊಬ್ಬರ:</Text>
                      <Text style={styles.detailLabelEn}>Fertilizer:</Text>
                    </View>
                    <View style={styles.detailValueContainer}>
                      <Text style={styles.detailValue} numberOfLines={0}>{rec.fertilizer_kn}</Text>
                      {rec.fertilizer && rec.fertilizer !== rec.fertilizer_kn && (
                        <Text style={styles.detailValueEn} numberOfLines={0}>{rec.fertilizer}</Text>
                      )}
                    </View>
                  </View>
                )}
                {rec.dosage && (
                  <View style={styles.detailRow}>
                    <View style={styles.detailLabelContainer}>
                      <Text style={styles.detailLabel}>ಪ್ರಮಾಣ:</Text>
                      <Text style={styles.detailLabelEn}>Dosage:</Text>
                    </View>
                    <View style={styles.detailValueContainer}>
                      <Text style={styles.detailValue} numberOfLines={0}>{rec.dosage_kn}</Text>
                      {rec.dosage && rec.dosage !== rec.dosage_kn && (
                        <Text style={styles.detailValueEn} numberOfLines={0}>{rec.dosage}</Text>
                      )}
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        ))}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.newScanButton}
            onPress={() => router.push("/upload")}
          >
            <Text style={styles.newScanIcon}>📸</Text>
            <Text style={styles.newScanText}>ಹೊಸ ಸ್ಕ್ಯಾನ್</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => router.push("/home")}
          >
            <Text style={styles.homeIcon}>🏠</Text>
            <Text style={styles.homeText}>ಮುಖಪುಟ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1B5E20",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  speakAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 15,
  },
  speakIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  speakAllText: {
    fontSize: 16,
    color: "#1B5E20",
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1B5E20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  numberText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cardTitles: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  cardTitleEn: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  speakButton: {
    padding: 8,
  },
  speakButtonIcon: {
    fontSize: 24,
  },
  description: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
    marginBottom: 8,
  },
  descriptionEn: {
    fontSize: 13,
    color: "#666",
    lineHeight: 20,
  },
  detailsContainer: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 15,
    marginTop: 15,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  detailLabelContainer: {
    width: 80,
    flexShrink: 0,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
  },
  detailLabelEn: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
    textAlign: "left",
  },
  detailValueContainer: {
    flex: 1,
    flexShrink: 1,
    paddingLeft: 10,
  },
  detailValue: {
    fontSize: 14,
    color: "#1B5E20",
    fontWeight: "500",
    flexWrap: "wrap",
  },
  detailValueEn: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
    flexWrap: "wrap",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  newScanButton: {
    flex: 1,
    backgroundColor: "#1B5E20",
    borderRadius: 15,
    padding: 15,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  newScanIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  newScanText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  homeButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#1B5E20",
    marginLeft: 10,
  },
  homeIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  homeText: {
    color: "#1B5E20",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});

