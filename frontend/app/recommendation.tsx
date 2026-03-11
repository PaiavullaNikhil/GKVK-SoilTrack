import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ALL_CROPS, type CategorizedCrop } from "./crops";

export default function RecommendationScreen() {
  const router = useRouter();
  const { cropId, imageId, npk } = useLocalSearchParams<{
    cropId: string;
    imageId?: string;
    npk?: string;
  }>();
  const [unit, setUnit] = useState<"acre" | "hectare">("acre");

  type NpkLevel = "very_low" | "low" | "medium" | "high" | "very_high";
  type NpkStatusMap = { N: NpkLevel; P: NpkLevel; K: NpkLevel };

  const parsedNpkStatus: NpkStatusMap | null = useMemo(() => {
    if (!npk) return null;
    try {
      const obj = JSON.parse(npk);
      if (obj && typeof obj === "object" && obj.N && obj.P && obj.K) {
        return obj as NpkStatusMap;
      }
    } catch {
      // ignore parse errors
    }
    return null;
  }, [npk]);

  const cropMeta: CategorizedCrop | undefined = useMemo(
    () => ALL_CROPS.find((c) => c.id === cropId),
    [cropId]
  );

  const adjustedRdf = useMemo(() => {
    if (!cropMeta || !cropMeta.cerealsFertility) return null;

    const fert = cropMeta.cerealsFertility;
    const levels: NpkLevel[] = ["very_low", "low", "medium", "high", "very_high"];

    const scale = (valuePerHa: number) =>
      unit === "hectare" ? valuePerHa : parseFloat((valuePerHa * 0.4047).toFixed(2));

    const perNutrient = (nutrient: "N" | "P" | "K") => {
      const base = {
        very_low: fert.soilClasses[nutrient].very_low,
        low: fert.soilClasses[nutrient].low,
        medium: fert.rdf.perHa[nutrient],
        high: fert.soilClasses[nutrient].high,
        very_high: fert.soilClasses[nutrient].very_high,
      };
      const scaled: Record<NpkLevel, number> = {} as Record<NpkLevel, number>;
      levels.forEach((lvl) => {
        scaled[lvl] = scale(base[lvl]);
      });
      return scaled;
    };

    return {
      N: perNutrient("N"),
      P: perNutrient("P"),
      K: perNutrient("K"),
      selected: parsedNpkStatus || null,
    };
  }, [parsedNpkStatus, cropMeta, unit]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Adjusted RDF summary for N, P, K */}
        {adjustedRdf && (
          <View style={styles.rdfCard}>
            <View style={styles.rdfHeaderRow}>
              <View>
                <Text style={styles.rdfTitle}>ಹೊಂದಿಕೊಳ್ಳಲಾದ ಗೊಬ್ಬರ ಪ್ರಮಾಣ (NPK)</Text>
                <Text style={styles.rdfSubtitle}>
                  Adjusted RDF for 40 guntas (1 acre)
                </Text>
              </View>
            </View>

            {/* Show only the selected value for each nutrient */}
            {(["N", "P", "K"] as const).map((nutrientKey) => {
              const row = adjustedRdf[nutrientKey];
              const selectedLevel = adjustedRdf.selected?.[nutrientKey] || "medium";
              const labels: Record<NpkLevel, string> = {
                very_low: "Very low",
                low: "Low",
                medium: "Medium",
                high: "High",
                very_high: "Very high",
              };

              return (
                <View key={nutrientKey} style={styles.rdfRow}>
                  <Text style={styles.rdfCellLabel}>{nutrientKey}</Text>
                  <Text style={styles.rdfCellValue}>
                    {labels[selectedLevel]} – {row[selectedLevel]} kg
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Action Button */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() =>
              router.push({
                pathname: "/area",
                params: {
                  cropId,
                  npk: npk || "",
                },
              })
            }
          >
            <Text style={styles.homeIcon}>📏</Text>
            <Text style={styles.homeText}>ವಿಸ್ತೀರ್ಣಕ್ಕೆ ಲೆಕ್ಕಿಸಿ</Text>
            <Text style={styles.homeTextEn}>Calculate for land area</Text>
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
  rdfCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#1B5E20",
  },
  rdfHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  rdfTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1B5E20",
    letterSpacing: 0.2,
  },
  rdfSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 3,
  },
  unitToggle: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#C8E6C9",
    overflow: "hidden",
  },
  unitButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#fff",
  },
  unitButtonActive: {
    backgroundColor: "#1B5E20",
  },
  unitButtonText: {
    fontSize: 12,
    color: "#1B5E20",
  },
  unitButtonTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  rdfTableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    borderBottomColor: "#E0E0E0",
    paddingBottom: 6,
    marginBottom: 6,
  },
  rdfRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  rdfCellHeading: {
    fontWeight: "600",
    color: "#555",
  },
  rdfCellLabel: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    fontWeight: "600",
  },
  rdfCellValue: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    textAlign: "right",
  },
  rdfCellValueSelected: {
    fontWeight: "700",
    color: "#1B5E20",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1B5E20",
    letterSpacing: 0.3,
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
    borderRadius: 18,
    padding: 20,
    marginBottom: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
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
    borderRadius: 12,
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
    justifyContent: "center",
    marginTop: 12,
  },
  homeButton: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#1B5E20",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    minWidth: 200,
  },
  homeIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  homeText: {
    color: "#1B5E20",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  homeTextEn: {
    color: "#1B5E20",
    fontSize: 12,
    marginTop: 3,
    textAlign: "center",
  },
});

