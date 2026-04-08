import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Pressable,
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
  const [guntaInput, setGuntaInput] = useState<string>("40");

  useEffect(() => {
    speakKn("ನಿಮ್ಮ ಹೊಲದಲ್ಲಿ ಎಷ್ಟು ಗುಂಟೆ ಇದೆ ಎಂದು ನಮೂದಿಸಿ.");
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

  const calculateTotalsForArea = (area: number) => {
    const fruitAgeFertility =
      cropId && ageKey && FRUIT_AGE_FERTILITY[cropId]
        ? FRUIT_AGE_FERTILITY[cropId][ageKey]
        : null;

    const fert = cropMeta?.cerealsFertility ?? fruitAgeFertility;
    if (!fert) return null;

    const status = parsedNpkStatus;

    const kgForLevel = (nutrient: "N" | "P" | "K", level: NpkLevel) => {
      const perHa =
        level === "medium"
          ? fert.rdf.perHa[nutrient]
          : fert.soilClasses[nutrient][level];
      const areaHa = (area * 0.4047) / 40; // 40 guntas = 1 acre = 0.4047 ha
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
  };

  const baselineTotals = useMemo(
    () => calculateTotalsForArea(40),
    [cropMeta, cropId, ageKey, parsedNpkStatus]
  );

  const customTotals = useMemo(
    () => calculateTotalsForArea(selectedGuntas),
    [cropMeta, cropId, ageKey, parsedNpkStatus, selectedGuntas]
  );

  const renderNutrientTable = (totalsData: any) => {
    return (
      <>
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
          const row = totalsData[nutrientKey];
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
                {labelMap[row.level as NpkLevel]}
              </Text>
              <Text style={styles.cellValue}>{row.kg}</Text>
            </View>
          );
        })}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ── Area Input Card ── */}
        <View style={styles.inputCard}>
          <View style={styles.inputHeader}>
            <Text style={styles.inputHeaderIcon}>📐</Text>
            <View>
              <Text style={styles.inputHeaderKn}>ಭೂಮಿಯ ವಿಸ್ತೀರ್ಣ</Text>
              <Text style={styles.inputHeaderEn}>Land Area</Text>
            </View>
          </View>

          <View style={styles.inputBody}>
            <Text style={styles.inputHintKn}>
              ನಿಮ್ಮ ಹೊಲದ ಗುಂಟೆ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ
            </Text>
            <Text style={styles.inputHintEn}>
              Enter the number of guntas in your field
            </Text>

            <View style={styles.inputRow}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  value={guntaInput}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9.]/g, "");
                    setGuntaInput(cleaned);
                    const val = parseFloat(cleaned);
                    if (!isNaN(val) && val > 0) {
                      setSelectedGuntas(val);
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={5}
                  selectionColor="#A5D6A7"
                  underlineColorAndroid="transparent"
                  selectTextOnFocus={true}
                />
              </View>
              <View style={styles.unitBadge}>
                <Text style={styles.unitBadgeTextKn}>ಗುಂಟ</Text>
                <Text style={styles.unitBadgeTextEn}>Guntas</Text>
              </View>
            </View>

            <Text style={styles.conversionHint}>
              40 ಗುಂಟ = 1 ಎಕರೆ  •  40 Guntas = 1 Acre
            </Text>
          </View>
        </View>

        {/* ── Baseline Table (40 Guntas / 1 Acre) ── */}
        {baselineTotals && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>
              1 ಎಕರೆಗೆ (40 ಗುಂಟೆ) ಬೇಕಾಗುವ ಪೋಷಕಾಂಶಗಳು
            </Text>
            <Text style={styles.resultSubtitle}>
              Recommendation for 1 Acre (Standard 40 Guntas)
            </Text>
            {renderNutrientTable(baselineTotals)}
          </View>
        )}

        {/* ── Custom Table (entered area) ── */}
        {customTotals && selectedGuntas !== 40 && (
          <View style={[styles.resultCard, styles.customCard]}>
            <Text style={[styles.resultTitle, { color: "#2E7D32" }]}>
              ನಮೂದಿಸಿದ {selectedGuntas} ಗುಂಟೆಗಳಿಗೆ ಬೇಕಾಗುವ ಪೋಷಕಾಂಶಗಳು
            </Text>
            <Text style={styles.resultSubtitle}>
              Recommendation for entered {selectedGuntas} Guntas
            </Text>
            {renderNutrientTable(customTotals)}
          </View>
        )}

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => {
              stopVoice();
              router.push({
                pathname: "/fertilizers",
                params: {
                  cropId: cropId || "",
                  npk: npk || "",
                  guntas: String(selectedGuntas),
                  ageKey: ageKey || "",
                },
              });
            }}
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
  /* ── Input Card ── */
  inputCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 18,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    overflow: "hidden",
  },
  inputHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1B5E20",
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 12,
  },
  inputHeaderIcon: {
    fontSize: 22,
  },
  inputHeaderKn: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  inputHeaderEn: {
    fontSize: 11,
    color: "#A5D6A7",
    marginTop: 1,
  },
  inputBody: {
    padding: 20,
  },
  inputHintKn: {
    fontSize: 14,
    color: "#333",
    marginBottom: 2,
  },
  inputHintEn: {
    fontSize: 11,
    color: "#888",
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    height: 60,
    borderWidth: 2,
    borderColor: "#C8E6C9",
    borderRadius: 12,
    backgroundColor: "#F1F8E9",
    justifyContent: "center",
  },
  textInput: {
    flex: 1,
    width: "100%",
    fontSize: 24,
    color: "#1B5E20",
    fontWeight: "bold",
    textAlign: "center",
    paddingHorizontal: 0,
    paddingVertical: 0,
    includeFontPadding: false,
    backgroundColor: "transparent",
  },
  unitBadge: {
    backgroundColor: "#E8F5E9",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  unitBadgeTextKn: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  unitBadgeTextEn: {
    fontSize: 9,
    color: "#66BB6A",
    marginTop: 1,
  },
  conversionHint: {
    fontSize: 11,
    color: "#999",
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
  },
  /* ── Custom Card Highlight ── */
  customCard: {
    borderColor: "#1B5E20",
    borderWidth: 1.5,
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

