import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  ALL_CROPS,
  ARECANUT_VARIETY_FERTILITY,
  COCONUT_AGE_GROUP_FERTILITY,
  MANGO_AGE_GROUP_FERTILITY,
  PER_PLANT_SPECIAL_FERTILITY,
  type CategorizedCrop,
} from "./crops";
import { speakKn } from "../utils/voice";

type NpkLevel = "very_low" | "low" | "medium" | "high" | "very_high";
type NpkStatusMap = { N: NpkLevel; P: NpkLevel; K: NpkLevel };

const PER_PLANT_CROPS = new Set([
  "grapes",
  "cashew",
  "black_pepper",
  "mango",
  "coconut",
  "arecanut",
]);

export default function PlantsScreen() {
  const router = useRouter();
  const { cropId, npk, ageKey, ageLabel } = useLocalSearchParams<{
    cropId?: string;
    npk?: string;
    ageKey?: string;
    ageLabel?: string;
  }>();

  const [plantCount, setPlantCount] = useState<number>(10);

  useEffect(() => {
    speakKn(
      "ಈ ವಯಸ್ಸಿನ ಅಥವಾ ಜಾತಿಯ ಸಸ್ಯಗಳ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ."
    );
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

  const perPlantRequirements = useMemo(() => {
    if (!cropId || !ageKey || !parsedNpkStatus) return null;
    if (!PER_PLANT_CROPS.has(cropId)) return null;

    const pickLevel = (nutrient: "N" | "P" | "K"): NpkLevel =>
      parsedNpkStatus[nutrient] || "medium";

    const computeFromTable = (
      rdfPerPlant: Record<"N" | "P" | "K", number>,
      soilClasses: {
        [key in "N" | "P" | "K"]: {
          very_low: number;
          low: number;
          high: number;
          very_high: number;
        };
      }
    ) => {
      const gramsFor = (nutrient: "N" | "P" | "K") => {
        const level = pickLevel(nutrient);
        if (level === "medium") return rdfPerPlant[nutrient];
        return soilClasses[nutrient][level];
      };
      const N_g = gramsFor("N");
      const P_g = gramsFor("P");
      const K_g = gramsFor("K");
      return {
        N_g,
        P_g,
        K_g,
        N_kg: parseFloat((N_g / 1000).toFixed(4)),
        P_kg: parseFloat((P_g / 1000).toFixed(4)),
        K_kg: parseFloat((K_g / 1000).toFixed(4)),
      };
    };

    // Mango
    if (cropId === "mango") {
      const entry = MANGO_AGE_GROUP_FERTILITY[ageKey as keyof typeof MANGO_AGE_GROUP_FERTILITY];
      if (!entry) return null;
      return computeFromTable(entry.rdfPerPlant, entry.soilClasses);
    }

    // Coconut
    if (cropId === "coconut") {
      const entry =
        COCONUT_AGE_GROUP_FERTILITY[ageKey as keyof typeof COCONUT_AGE_GROUP_FERTILITY];
      if (!entry) return null;
      return computeFromTable(entry.rdfPerPlant, entry.soilClasses);
    }

    // Arecanut
    if (cropId === "arecanut") {
      const entry =
        ARECANUT_VARIETY_FERTILITY[ageKey as keyof typeof ARECANUT_VARIETY_FERTILITY];
      if (!entry) return null;
      return computeFromTable(entry.rdfPerPlant, entry.soilClasses);
    }

    // Grapes, Cashew, Black pepper – dedicated per-plant table
    const specialTable = PER_PLANT_SPECIAL_FERTILITY[
      cropId as "grapes" | "cashew" | "black_pepper"
    ];
    const fert = specialTable?.[ageKey];
    if (!fert) return null;
    return computeFromTable(fert.rdfPerPlant, fert.soilClasses);
  }, [cropId, ageKey, parsedNpkStatus]);

  const totals = useMemo(() => {
    if (!perPlantRequirements) return null;
    const { N_kg, P_kg, K_kg } = perPlantRequirements;
    const count = plantCount > 0 ? plantCount : 0;
    return {
      N_req: parseFloat((N_kg * count).toFixed(2)),
      P_req: parseFloat((P_kg * count).toFixed(2)),
      K_req: parseFloat((K_kg * count).toFixed(2)),
    };
  }, [perPlantRequirements, plantCount]);

  const handleChangeCount = (value: string) => {
    const num = Number(value.replace(/[^0-9]/g, ""));
    if (!Number.isNaN(num)) {
      setPlantCount(num);
    }
  };

  const adjustCount = (delta: number) => {
    setPlantCount((prev) => {
      const next = prev + delta;
      return next < 0 ? 0 : next;
    });
  };

  const handleNext = () => {
    if (!cropId || !totals) return;
    router.push({
      pathname: "/fertilizers",
      params: {
        cropId,
        npk: npk || "",
        mode: "plants",
        plantCount: String(plantCount),
        N_req: String(totals.N_req),
        P_req: String(totals.P_req),
        K_req: String(totals.K_req),
      },
    });
  };

  if (!cropMeta || !PER_PLANT_CROPS.has(cropMeta.id)) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            ಈ ಬೆಳೆಗಾಗಿ ಸಸ್ಯ ಆಧಾರಿತ ಪರಿಗಣನೆ ಲಭ್ಯವಿಲ್ಲ.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Number of plants */}
        <View style={styles.plantCard}>
          <Text style={styles.sectionTitle}>ಸಸ್ಯಗಳ ಸಂಖ್ಯೆ</Text>
          <Text style={styles.sectionTitleEn}>Number of plants</Text>

          <View style={styles.counterRow}>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => adjustCount(-10)}
            >
              <Text style={styles.counterButtonText}>-10</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => adjustCount(-1)}
            >
              <Text style={styles.counterButtonText}>-</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.countInput}
              keyboardType="number-pad"
              value={String(plantCount)}
              onChangeText={handleChangeCount}
            />

            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => adjustCount(1)}
            >
              <Text style={styles.counterButtonText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => adjustCount(10)}
            >
              <Text style={styles.counterButtonText}>+10</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.helperText}>
            ಒಂದೇ ವಯಸ್ಸು/ಜಾತಿಯ ಸಸ್ಯಗಳ ಒಟ್ಟು ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ.
          </Text>
          <Text style={styles.helperTextEn}>
            Enter total number of plants of this age/variety.
          </Text>
          {ageLabel && (
            <Text style={styles.ageChip}>
              {ageLabel}
            </Text>
          )}
        </View>

        {/* Per-plant and total nutrient cards */}
        {perPlantRequirements && totals && (
          <>
            <View style={styles.resultCard}>
              <Text style={styles.sectionTitle}>ಒಂದು ಸಸ್ಯಕ್ಕೆ ಬೇಕಾಗುವ ಗೊಬ್ಬರ</Text>
              <Text style={styles.sectionTitleEn}>NPK per plant</Text>

              <View style={styles.resultHeaderRow}>
                <Text style={[styles.cellLabel, styles.cellHeading]}>
                  Nutrient
                </Text>
                <Text style={[styles.cellValue, styles.cellHeading]}>
                  g / plant
                </Text>
                <Text style={[styles.cellValue, styles.cellHeading]}>
                  kg / plant
                </Text>
              </View>

              {(["N", "P", "K"] as const).map((nutrient) => {
                const gKey = `${nutrient}_g` as "N_g" | "P_g" | "K_g";
                const kgKey = `${nutrient}_kg` as "N_kg" | "P_kg" | "K_kg";
                const gVal = perPlantRequirements[gKey];
                const kgVal = perPlantRequirements[kgKey];
                return (
                  <View key={nutrient} style={styles.resultRow}>
                    <Text style={styles.cellLabel}>{nutrient}</Text>
                    <Text style={styles.cellValue}>{gVal}</Text>
                    <Text style={styles.cellValue}>{kgVal}</Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.resultCard}>
              <Text style={styles.sectionTitle}>
                ಆಯ್ದ ಸಸ್ಯಗಳ ಒಟ್ಟು ಗೊಬ್ಬರ (NPK)
              </Text>
              <Text style={styles.sectionTitleEn}>
                Total NPK for {plantCount} plants
              </Text>

              <View style={styles.resultHeaderRow}>
                <Text style={[styles.cellLabel, styles.cellHeading]}>
                  Nutrient
                </Text>
                <Text style={[styles.cellValue, styles.cellHeading]}>
                  Total (g)
                </Text>
                <Text style={[styles.cellValue, styles.cellHeading]}>
                  Total (kg)
                </Text>
              </View>

              {(["N", "P", "K"] as const).map((nutrient) => {
                const key = `${nutrient}_req` as "N_req" | "P_req" | "K_req";
                const value = totals[key];
                const grams = Math.round(value * 1000);
                return (
                  <View key={nutrient} style={styles.resultRow}>
                    <Text style={styles.cellLabel}>{nutrient}</Text>
                    <Text style={styles.cellValue}>{grams}</Text>
                    <Text style={styles.cellValue}>{value}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              (!totals || plantCount <= 0) && styles.nextButtonDisabled,
            ]}
            disabled={!totals || plantCount <= 0}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>ಮುಂದೆ → ಗೊಬ್ಬರ ಸಂಯೋಜನೆ</Text>
            <Text style={styles.nextButtonTextEn}>
              Next → Fertilizer combinations (per plant)
            </Text>
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    fontSize: 14,
    color: "#d32f2f",
    textAlign: "center",
  },
  plantCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1B5E20",
  },
  sectionTitleEn: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  counterButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  counterButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1B5E20",
  },
  countInput: {
    flex: 1,
    marginHorizontal: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C8E6C9",
    backgroundColor: "#FAFAFA",
    fontSize: 14,
    textAlign: "center",
  },
  helperText: {
    fontSize: 11,
    color: "#666",
    marginTop: 8,
  },
  helperTextEn: {
    fontSize: 10,
    color: "#888",
  },
  ageChip: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#C8E6C9",
    fontSize: 11,
    color: "#1B5E20",
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
    marginBottom: 12,
  },
  resultHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingBottom: 6,
    marginTop: 8,
    marginBottom: 4,
  },
  resultRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  cellHeading: {
    fontWeight: "600",
    color: "#555",
  },
  cellLabel: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  cellValue: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    textAlign: "right",
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
  nextButtonDisabled: {
    opacity: 0.6,
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

