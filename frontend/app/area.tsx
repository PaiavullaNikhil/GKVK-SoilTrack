import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { ALL_CROPS, FRUIT_AGE_FERTILITY, type CategorizedCrop } from "./crops";
import { speakKn, stopVoice } from "../utils/voice";

type NpkLevel = "very_low" | "low" | "medium" | "high" | "very_high";
type NpkStatusMap = { N: NpkLevel; P: NpkLevel; K: NpkLevel };

export default function AreaScreen() {
  const router = useRouter();
  const { cropId, npk, ageKey } = useLocalSearchParams<{
    cropId?: string;
    npk?: string;
    ageKey?: string;
  }>();

  const [selectedGuntas, setSelectedGuntas] = useState<number>(40);

  useEffect(() => {
    speakKn(
      "ನಿಮ್ಮ ಹೊಲದಲ್ಲಿ ಎಷ್ಟು ಗೂಂಟೆ ಇದೆ ಆಯ್ಕೆಮಾಡಿ."
    );
    return () => {
      stopVoice();
    };
  }, []);

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

  const totals = useMemo(() => {
    const fruitAgeFertility =
      cropId && ageKey && FRUIT_AGE_FERTILITY[cropId]
        ? FRUIT_AGE_FERTILITY[cropId][ageKey]
        : null;

    const fert = cropMeta?.cerealsFertility ?? fruitAgeFertility;
    if (!fert) return null;

    const status = parsedNpkStatus;
    const levels: NpkLevel[] = ["very_low", "low", "medium", "high", "very_high"];

    const kgForLevel = (nutrient: "N" | "P" | "K", level: NpkLevel) => {
      const perHa =
        level === "medium"
          ? fert.rdf.perHa[nutrient]
          : fert.soilClasses[nutrient][level];
      const areaHa = (selectedGuntas * 0.4047) / 40; // 40 guntas = 1 acre = 0.4047 ha
      return parseFloat((perHa * areaHa).toFixed(2));
    };

    const pickedLevel = (nutrient: "N" | "P" | "K"): NpkLevel => {
      if (status) {
        return status[nutrient] || "medium";
      }
      return "medium";
    };

    const Nlevel = pickedLevel("N");
    const Plevel = pickedLevel("P");
    const Klevel = pickedLevel("K");

    return {
      N: { level: Nlevel, kg: kgForLevel("N", Nlevel) },
      P: { level: Plevel, kg: kgForLevel("P", Plevel) },
      K: { level: Klevel, kg: kgForLevel("K", Klevel) },
    };
  }, [cropMeta, cropId, ageKey, parsedNpkStatus, selectedGuntas]);

  const guntasOptions = Array.from({ length: 8 }, (_, i) => (i + 1) * 10);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.chipGrid}>
          {guntasOptions.map((g) => (
            <TouchableOpacity
              key={g}
              style={[
                styles.chip,
                selectedGuntas === g && styles.chipSelected,
              ]}
              onPress={() => setSelectedGuntas(g)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedGuntas === g && styles.chipTextSelected,
                ]}
              >
                {g} ಗುಂಟ
              </Text>
              <Text
                style={[
                  styles.chipTextEn,
                  selectedGuntas === g && styles.chipTextSelected,
                ]}
              >
                {g} guntas
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {totals && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>
              ಆಯ್ದ ವಿಸ್ತೀರ್ಣಕ್ಕೆ ಒಟ್ಟು ಪೋಷಕಾಂಶಗಳು (NPK)
            </Text>
            <Text style={styles.resultSubtitle}>
              Total fertilizer for {selectedGuntas} guntas
            </Text>

            <View style={styles.resultHeaderRow}>
              <Text
                style={[styles.cellLabel, styles.cellHeading, styles.cellColBorder]}
              >
                ಪೋಷಕಾಂಶಗಳು {"\n"}Nutrient
              </Text>
              <Text
                style={[styles.cellValue, styles.cellHeading, styles.cellColBorder]}
              >
                ಸ್ಥಿತಿ {"\n"}Status
              </Text>
              <Text style={[styles.cellValue, styles.cellHeading]}>
                ಪ್ರಮಾಣ (ಕೆ.ಜಿ) {"\n"}Amount (kg)
              </Text>
            </View>

            {(["N", "P", "K"] as const).map((nutrientKey) => {
              const row = totals[nutrientKey];
              const labelMap: Record<NpkLevel, string> = {
                very_low: "ಅತ್ಯಂತ ಕಡಿಮೆ (V.L)",
                low: "ಕಡಿಮೆ (L)",
                medium: "ಮಧ್ಯಮ (M)",
                high: "ಹೆಚ್ಚು (H)",
                very_high: "ಅತ್ಯಂತ ಹೆಚ್ಚು (V.H)",
              };
              return (
                <View key={nutrientKey} style={styles.resultRow}>
                  <Text style={[styles.cellLabel, styles.cellColBorder]}>
                    {nutrientKey === "N"
                      ? "ನೈಟ್ರೋಜನ್ (N)"
                      : nutrientKey === "P"
                        ? "ಫಾಸ್ಫರಸ್ (P)"
                        : "ಪೊಟಾಶಿಯಂ (K)"}
                  </Text>
                  <Text style={[styles.cellValue, styles.cellColBorder]}>
                    {labelMap[row.level]}
                  </Text>
                  <Text style={styles.cellValue}>{row.kg}</Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={() =>
              router.push({
                pathname: "/fertilizers",
                params: {
                  cropId: cropId || "",
                  npk: npk || "",
                  guntas: String(selectedGuntas),
                  ageKey: ageKey || "",
                },
              })
            }
          >
            <Text style={styles.nextButtonText}>ಮುಂದೆ → ಗೊಬ್ಬರ ಸಂಯೋಜನೆ</Text>
            <Text style={styles.nextButtonTextEn}>Next → Fertilizer combinations</Text>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  chip: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#C8E6C9",
    alignItems: "center",
  },
  chipSelected: {
    backgroundColor: "#1B5E20",
    borderColor: "#1B5E20",
  },
  chipText: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  chipTextEn: {
    fontSize: 11,
    color: "#888",
    marginTop: 2,
  },
  chipTextSelected: {
    color: "#fff",
  },
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1B5E20",
  },
  resultSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
    marginBottom: 10,
  },
  resultHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingBottom: 6,
    marginBottom: 4,
  },
  resultRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  cellColBorder: {
    borderRightWidth: 1,
    borderRightColor: "#E0E0E0",
  },
  cellHeading: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#555",
  },
  cellLabel: {
    flex: 1,
    fontSize: 13,
    color: "#333",
  },
  cellValue: {
    flex: 1,
    fontSize: 13,
    color: "#333",
    textAlign: "center",
  },
  actionsContainer: {
    marginTop: 8,
  },
  nextButton: {
    backgroundColor: "#1B5E20",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#1B5E20",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  nextButtonTextEn: {
    color: "#A5D6A7",
    fontSize: 12,
    marginTop: 2,
  },
});

