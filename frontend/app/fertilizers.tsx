import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ALL_CROPS, FRUIT_AGE_FERTILITY, type CategorizedCrop } from "./crops";
import { speakKn, stopVoice } from "../utils/voice";

/* ── Animated accordion wrapper ── */
function AccordionPanel({
  isExpanded,
  children,
}: {
  isExpanded: boolean;
  children: React.ReactNode;
}) {
  const animValue = useRef(new Animated.Value(0)).current;
  const [contentHeight, setContentHeight] = useState(0);
  const [shouldRender, setShouldRender] = useState(isExpanded);

  useEffect(() => {
    if (isExpanded) {
      setShouldRender(true);
      Animated.timing(animValue, {
        toValue: 1,
        duration: 350,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(animValue, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) setShouldRender(false);
      });
    }
  }, [isExpanded]);

  const animatedStyle = {
    maxHeight: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, contentHeight || 500],
    }),
    opacity: animValue.interpolate({
      inputRange: [0, 0.3, 1],
      outputRange: [0, 0.5, 1],
    }),
    overflow: "hidden" as const,
  };

  if (!shouldRender) return null;

  return (
    <Animated.View style={animatedStyle}>
      <View
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0 && h !== contentHeight) setContentHeight(h);
        }}
      >
        {children}
      </View>
    </Animated.View>
  );
}

type NpkLevel = "very_low" | "low" | "medium" | "high" | "very_high";
type NpkStatusMap = { N: NpkLevel; P: NpkLevel; K: NpkLevel };

interface ComboResultItem {
  name: string;
  fertilizers: { label: string; amountKg: number }[];
}

const FERTILIZER_LABELS: Record<
  string,
  { displayKn: string; displayEn: string; speakKn: string }
> = {
  // Straight fertilizers
  Urea: {
    displayKn: "ಯೂರಿಯಾ",
    displayEn: "Urea",
    speakKn: "ಯೂರಿಯಾ",
  },
  SSP: {
    displayKn: "ಸಿಂಗಲ್ ಸೂಪರ್ ಫಾಸ್ಫೇಟ್ / ಎಸ್ಎಸ್ಪಿ",
    displayEn: "SSP (Single Super Phosphate)",
    speakKn: "ಸಿಂಗಲ್ ಸೂಪರ್ ಫಾಸ್ಫೇಟ್",
  },
  MOP: {
    displayKn: "ಮ್ಯುರಿಯೇಟ್ ಆಫ್ ಪೋಟ್ಯಾಶ್ / ಎಂಓಪಿ",
    displayEn: "MOP (Muriate of Potash)",
    speakKn: "ಎಂಓಪಿ ಗೊಬ್ಬರ",
  },
  CAN: {
    displayKn: "ಕ್ಯಾಲ್ಸಿಯಂ ಅಮೋನಿಯಂ ನೈಟ್ರೇಟ್ / ಸಿಎಎನ್",
    displayEn: "CAN (Calcium Ammonium Nitrate)",
    speakKn: "ಸಿಎಎನ್ ಗೊಬ್ಬರ",
  },
  "Rock Phosphate": {
    displayKn: "ರಾಕ್ ಫಾಸ್ಫೇಟ್",
    displayEn: "Rock Phosphate",
    speakKn: "ರಾಕ್ ಫಾಸ್ಫೇಟ್",
  },
  "Ammonium Sulphate": {
    displayKn: "ಅಮೋನಿಯಂ ಸಲ್ಫೇಟ್",
    displayEn: "Ammonium Sulphate",
    speakKn: "ಅಮೋನಿಯಂ ಸಲ್ಫೇಟ್",
  },

  // Complex / mixed fertilizers
  DAP: {
    displayKn: "ಡಿ.ಎ.ಪಿ / ಡೈ ಅಮೋನಿಯಂ ಫಾಸ್ಫೇಟ್",
    displayEn: "DAP (Di-Ammonium Phosphate)",
    speakKn: "ಡಿ ಎ ಪಿ ಗೊಬ್ಬರ",
  },
  "17:17:17": {
    displayKn: "17 ಆಲ್",
    displayEn: "17:17:17 complex fertilizer",
    speakKn: "ಹದಿನೇಳು ಆಲ್ ಗೊಬ್ಬರ",
  },
  "20:20:20": {
    displayKn: "20 ಆಲ್",
    displayEn: "20:20:20 complex fertilizer",
    speakKn: "ಇಪ್ಪತ್ತು ಆಲ್ ಗೊಬ್ಬರ",
  },
  "19:19:19": {
    displayKn: "19 ಆಲ್",
    displayEn: "19:19:19 complex fertilizer",
    speakKn: "ಹತ್ತೊಂಬತ್ತು ಆಲ್ ಗೊಬ್ಬರ",
  },
  "10:26:26": {
    displayKn: "10-26 ಗೊಬ್ಬರ",
    displayEn: "10:26:26 complex fertilizer",
    speakKn: "ಟೆನ್ ಟ್ವೆಂಟಿ ಸಿಕ್ಸ್ ಗೊಬ್ಬರ",
  },
  "20:20:0": {
    displayKn: "20-20 ಗೊಬ್ಬರ",
    displayEn: "20:20:0 complex fertilizer",
    speakKn: "ಇಪ್ಪತ್ತು ಇಪ್ಪತ್ತು ಗೊಬ್ಬರ",
  },
  "18:18:0": {
    displayKn: "18:18:0 ಗೊಬ್ಬರ",
    displayEn: "18:18:0 complex fertilizer",
    speakKn: "ಹದಿನೆಂಟು ಹದಿನೆಂಟು ಗೊಬ್ಬರ",
  },
  "Ammonium Phosphate": {
    displayKn: "ಅಮೋನಿಯಂ ಫಾಸ್ಫೇಟ್",
    displayEn: "Ammonium Phosphate",
    speakKn: "ಅಮೋನಿಯಂ ಫಾಸ್ಫೇಟ್",
  },
};

const getFertilizerMeta = (label: string) => {
  const meta = FERTILIZER_LABELS[label];
  if (meta) return meta;
  return {
    displayKn: label,
    displayEn: label,
    speakKn: label,
  };
};

const formatNumber = (value: number, digits: number) => {
  if (Object.is(value, 0) || Object.is(value, -0)) return "0";
  return value.toFixed(digits);
};

export default function FertilizersScreen() {
  const router = useRouter();
  const {
    cropId,
    npk,
    guntas,
    mode,
    plantCount,
    N_req: N_req_param,
    P_req: P_req_param,
    K_req: K_req_param,
    ageKey,
  } = useLocalSearchParams<{
    cropId?: string;
    npk?: string;
    guntas?: string;
    mode?: string;
    plantCount?: string;
    N_req?: string;
    P_req?: string;
    K_req?: string;
    ageKey?: string;
  }>();

  const selectedGuntas = Number(guntas || "40") || 40;
  const selectedPlants = Number(plantCount || "0") || 0;

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

  const requirements = useMemo(() => {
    // Per-plant override from PlantsScreen
    if (N_req_param && P_req_param && K_req_param) {
      return {
        N_req: Number(N_req_param),
        P_req: Number(P_req_param),
        K_req: Number(K_req_param),
      };
    }

    if (!cropMeta) return null;

    const fruitAgeFertility =
      cropId && ageKey && FRUIT_AGE_FERTILITY[cropId]
        ? FRUIT_AGE_FERTILITY[cropId][ageKey]
        : null;

    const fert = cropMeta.cerealsFertility ?? fruitAgeFertility;
    if (!fert) return null;
    const status = parsedNpkStatus;

    const pickLevel = (nutrient: "N" | "P" | "K"): NpkLevel => {
      if (status) return status[nutrient] || "medium";
      return "medium";
    };

    const perHa = (nutrient: "N" | "P" | "K"): number => {
      const level = pickLevel(nutrient);
      if (level === "medium") {
        return fert.rdf.perHa[nutrient];
      }
      return fert.soilClasses[nutrient][level];
    };

    const areaHa = (selectedGuntas * 0.4047) / 40;

    const N_req = parseFloat((perHa("N") * areaHa).toFixed(2));
    const P_req = parseFloat((perHa("P") * areaHa).toFixed(2));
    const K_req = parseFloat((perHa("K") * areaHa).toFixed(2));

    return { N_req, P_req, K_req };
  }, [cropMeta, parsedNpkStatus, selectedGuntas, N_req_param, P_req_param, K_req_param]);

  const perPlantNpk = useMemo(() => {
    if (mode !== "plants" || !requirements || selectedPlants <= 0) return null;
    const { N_req, P_req, K_req } = requirements;
    const N_kg = N_req / selectedPlants;
    const P_kg = P_req / selectedPlants;
    const K_kg = K_req / selectedPlants;
    return {
      N_kg: parseFloat(N_kg.toFixed(4)),
      P_kg: parseFloat(P_kg.toFixed(4)),
      K_kg: parseFloat(K_kg.toFixed(4)),
      N_g: parseFloat((N_kg * 1000).toFixed(1)),
      P_g: parseFloat((P_kg * 1000).toFixed(1)),
      K_g: parseFloat((K_kg * 1000).toFixed(1)),
    };
  }, [mode, requirements, selectedPlants]);

  const combos: ComboResultItem[] | null = useMemo(() => {
    if (!requirements) return null;
    const { N_req, P_req, K_req } = requirements;

    const round = (x: number) => parseFloat(x.toFixed(1));
    const roundNonNeg = (x: number) => round(Math.max(0, x));

    const res: ComboResultItem[] = [];

    // 1. Urea + SSP + MOP
    res.push({
      name: "Urea + SSP + MOP",
      fertilizers: [
        { label: "Urea", amountKg: roundNonNeg(N_req / 0.46) },
        { label: "SSP", amountKg: roundNonNeg(P_req / 0.16) },
        { label: "MOP", amountKg: roundNonNeg(K_req / 0.60) },
      ],
    });

    // 2. DAP + Urea + MOP
    (() => {
      const dap = N_req === 0 && P_req === 0 ? 0 : P_req / 0.46;
      const nFromDap = dap * 0.18;
      const remainingN = N_req - nFromDap;
      res.push({
        name: "DAP + Urea + MOP",
        fertilizers: [
          { label: "DAP", amountKg: roundNonNeg(dap) },
          { label: "Urea", amountKg: roundNonNeg(remainingN / 0.46) },
          { label: "MOP", amountKg: roundNonNeg(K_req / 0.60) },
        ],
      });
    })();

    // 3. 17:17:17 + Urea + SSP
    (() => {
      const complex = K_req / 0.17;
      const nFrom = complex * 0.17;
      const pFrom = complex * 0.17;
      const remainingN = N_req - nFrom;
      const remainingP = P_req - pFrom;
      res.push({
        name: "17:17:17 + Urea + SSP",
        fertilizers: [
          { label: "17:17:17", amountKg: roundNonNeg(complex) },
          { label: "Urea", amountKg: roundNonNeg(remainingN / 0.46) },
          { label: "SSP", amountKg: roundNonNeg(remainingP / 0.16) },
        ],
      });
    })();

    // 4. 20:20:20 + Urea + SSP
    (() => {
      const complex = K_req / 0.20;
      const nFrom = complex * 0.20;
      const pFrom = complex * 0.20;
      const remainingN = N_req - nFrom;
      const remainingP = P_req - pFrom;
      res.push({
        name: "20:20:20 + Urea + SSP",
        fertilizers: [
          { label: "20:20:20", amountKg: roundNonNeg(complex) },
          { label: "Urea", amountKg: roundNonNeg(remainingN / 0.46) },
          { label: "SSP", amountKg: roundNonNeg(remainingP / 0.16) },
        ],
      });
    })();

    // 5. 19:19:19 + Urea + SSP
    (() => {
      const complex = K_req / 0.19;
      const nFrom = complex * 0.19;
      const pFrom = complex * 0.19;
      const remainingN = N_req - nFrom;
      const remainingP = P_req - pFrom;
      res.push({
        name: "19:19:19 + Urea + SSP",
        fertilizers: [
          { label: "19:19:19", amountKg: roundNonNeg(complex) },
          { label: "Urea", amountKg: roundNonNeg(remainingN / 0.46) },
          { label: "SSP", amountKg: roundNonNeg(remainingP / 0.16) },
        ],
      });
    })();

    // 6. 10:26:26 + Urea + SSP
    (() => {
      const complex = K_req / 0.26;
      const nFrom = complex * 0.10;
      const pFrom = complex * 0.26;
      const remainingN = N_req - nFrom;
      const remainingP = P_req - pFrom;
      res.push({
        name: "10:26:26 + Urea + SSP",
        fertilizers: [
          { label: "10:26:26", amountKg: roundNonNeg(complex) },
          { label: "Urea", amountKg: roundNonNeg(remainingN / 0.46) },
          { label: "SSP", amountKg: roundNonNeg(remainingP / 0.16) },
        ],
      });
    })();

    // 7. 20:20:0 + Urea + MOP
    (() => {
      const complex = P_req / 0.20;
      const nFrom = complex * 0.20;
      const remainingN = N_req - nFrom;
      res.push({
        name: "20:20:0 + Urea + MOP",
        fertilizers: [
          { label: "20:20:0", amountKg: roundNonNeg(complex) },
          { label: "Urea", amountKg: roundNonNeg(remainingN / 0.46) },
          { label: "MOP", amountKg: roundNonNeg(K_req / 0.60) },
        ],
      });
    })();

    // 8. 18:18:0 + Urea + MOP
    (() => {
      const complex = P_req / 0.18;
      const nFrom = complex * 0.18;
      const remainingN = N_req - nFrom;
      res.push({
        name: "18:18:0 + Urea + MOP",
        fertilizers: [
          { label: "18:18:0", amountKg: roundNonNeg(complex) },
          { label: "Urea", amountKg: roundNonNeg(remainingN / 0.46) },
          { label: "MOP", amountKg: roundNonNeg(K_req / 0.60) },
        ],
      });
    })();

    // 9. CAN + SSP + MOP
    res.push({
      name: "CAN + SSP + MOP",
      fertilizers: [
        { label: "CAN", amountKg: roundNonNeg(N_req / 0.26) },
        { label: "SSP", amountKg: roundNonNeg(P_req / 0.16) },
        { label: "MOP", amountKg: roundNonNeg(K_req / 0.60) },
      ],
    });

    // 10. Ammonium Phosphate + Urea + MOP (20:20:0 equivalent)
    (() => {
      const complex = P_req / 0.20;
      const nFrom = complex * 0.20;
      const remainingN = N_req - nFrom;
      res.push({
        name: "Ammonium Phosphate + Urea + MOP",
        fertilizers: [
          { label: "Ammonium Phosphate", amountKg: round(complex) },
          { label: "Urea", amountKg: round(remainingN / 0.46) },
          { label: "MOP", amountKg: round(K_req / 0.60) },
        ],
      });
    })();

    // 11. Ammonium Sulphate + SSP + MOP
    res.push({
      name: "Ammonium Sulphate + SSP + MOP",
      fertilizers: [
        { label: "Ammonium Sulphate", amountKg: roundNonNeg(N_req / 0.21) },
        { label: "SSP", amountKg: roundNonNeg(P_req / 0.16) },
        { label: "MOP", amountKg: roundNonNeg(K_req / 0.60) },
      ],
    });

    // 12. Urea + Rock Phosphate + MOP
    res.push({
      name: "Urea + Rock Phosphate + MOP",
      fertilizers: [
        { label: "Urea", amountKg: roundNonNeg(N_req / 0.46) },
        { label: "Rock Phosphate", amountKg: roundNonNeg(P_req / 0.30) },
        { label: "MOP", amountKg: roundNonNeg(K_req / 0.60) },
      ],
    });

    // 13. CAN + Rock Phosphate + MOP
    res.push({
      name: "CAN + Rock Phosphate + MOP",
      fertilizers: [
        { label: "CAN", amountKg: roundNonNeg(N_req / 0.26) },
        { label: "Rock Phosphate", amountKg: roundNonNeg(P_req / 0.30) },
        { label: "MOP", amountKg: roundNonNeg(K_req / 0.60) },
      ],
    });

    // 14. Ammonium Phosphate + Rock Phosphate + MOP
    res.push({
      name: "Ammonium Phosphate + Rock Phosphate + MOP",
      fertilizers: [
        { label: "Ammonium Phosphate", amountKg: roundNonNeg(P_req / 0.20) },
        { label: "Rock Phosphate", amountKg: roundNonNeg(P_req / 0.30) },
        { label: "MOP", amountKg: roundNonNeg(K_req / 0.60) },
      ],
    });

    return res;
  }, [requirements]);

  // Accordion: null = none expanded, number = which index is expanded
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    speakKn(
      "ಇಲ್ಲಿ ಗೊಬ್ಬರ ಸಂಯೋಜನೆಗಳಿವೆ. ನೀವು ಬಳಕೆ ಮಾಡುವ ಗೊಬ್ಬರ ತಂತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ, ನಂತರ ಅದರೊಳಗೆ ಪ್ರತಿಯೊಂದು ಗೊಬ್ಬರವನ್ನು ಎಷ್ಟು ಹಾಕಬೇಕು ಎಂಬುದು ಪಟ್ಟಿಯಲ್ಲಿ ತೋರುತ್ತದೆ."
    );
    return () => {
      stopVoice();
    };
  }, [mode]);

  const toggleExpand = useCallback(
    (index: number) => {
      setExpandedIndex((prev) => {
        const next = prev === index ? null : index;
        if (next !== null && combos && combos[next]) {
          stopVoice();
          const combo = combos[next];
          const parts = combo.fertilizers
            .map((f) => {
              const meta = getFertilizerMeta(f.label);
              return `${meta.speakKn} ${formatNumber(
                f.amountKg,
                2
              )} ಕಿಲೋ ಗ್ರಾಂ ಒಟ್ಟು`;
            })
            .join(", ");

          const comboSpeakName = combo.fertilizers.reduce((acc, f) => {
            const meta = getFertilizerMeta(f.label);
            return acc.replace(f.label, meta.speakKn);
          }, combo.name);

          if (mode === "plants" && selectedPlants > 0) {
            speakKn(
              `${comboSpeakName} ತಂತ್ರಕ್ಕಾಗಿ, ${selectedPlants} ಸಸ್ಯಗಳಿಗೆ ಈ ಪ್ರಮಾಣದ ಗೊಬ್ಬರ ಹಾಕಬೇಕು: ${parts}.`
            );
          } else {
            speakKn(
              `${comboSpeakName} ತಂತ್ರಕ್ಕಾಗಿ, ${selectedGuntas} ಗುಂಟೆಗಳಿಗಾಗಿ ಈ ಪ್ರಮಾಣದ ಗೊಬ್ಬರ ಹಾಕಬೇಕು: ${parts}.`
            );
          }

          // For cereals, also read NOTE content in a natural way.
          if (cropMeta?.categoryId === "cereals") {
            speakKn(
              "ಗಮನದಲ್ಲಿರಿಸಿಕೊಳ್ಳಿ: ಶಿಫಾರಸ್ಸಿನ ಐವತ್ತು ಶತಮಾನ ಸಾರಜನಕವನ್ನು ಭಿತ್ತನೆಯ ಸಮಯದಲ್ಲಿ ಹಾಕಿ, ಉಳಿದ ಐವತ್ತು ಶತಮಾನ ಸಾರಜನಕ ಗೊಬ್ಬರವನ್ನು ಮುವತ್ತು ದಿನಗಳ ನಂತರ ಮೇಲುಗೊಬ್ಬರವಾಗಿ ನೀಡಿ. ಜೊತೆಗೆ ರಂಜಕ ಮತ್ತು ಪೊಟ್ಯಾಷ್ ಗೊಬ್ಬರಗಳನ್ನು ಭಿತ್ತನೆಯ ಸಮಯದಲ್ಲಿ ಪೂರ್ಣ ಪ್ರಮಾಣದಲ್ಲಿ ಒದಗಿಸಿ."
            );
          }
        }
        return next;
      });
    },
    [combos, mode, selectedPlants, selectedGuntas, cropMeta]
  );

  const scopeLabel =
    mode === "plants"
      ? `${selectedPlants} plants`
      : `${selectedGuntas} guntas`;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Accordion strategy list */}
        {combos && (
          <View style={styles.listContainer}>
            {/* Hero header */}
            <View style={styles.listHeader}>
              <View style={styles.heroRow}>
                <Text style={styles.heroEmoji}>🌾</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listHeaderCode}>ಗೊಬ್ಬರ ತಂತ್ರಗಳು</Text>
                  <Text style={styles.listHeaderSub}>
                    Fertilizer Strategies · {combos.length} options
                  </Text>
                  {cropMeta && (
                    <Text style={styles.listHeaderCrop}>
                      {cropMeta.name_kn} / {cropMeta.name} · {scopeLabel}
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.promptBanner}>
                <Text style={styles.promptText}>
                  👇 ತಂತ್ರವನ್ನು ಟ್ಯಾಪ್ ಮಾಡಿ ವಿವರ ನೋಡಿ
                </Text>
                <Text style={styles.promptTextEn}>
                  Tap a strategy below to see the breakdown
                </Text>
              </View>
            </View>

            {/* Strategy rows */}
            {combos.map((combo, index) => {
              const isExpanded = expandedIndex === index;
              const totalWeight = combo.fertilizers.reduce(
                (acc, f) => acc + f.amountKg,
                0
              );

              return (
                <View key={combo.name} style={styles.itemWrapper}>
                  {/* Row header — always visible */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[
                      styles.itemRow,
                      isExpanded && styles.itemRowExpanded,
                    ]}
                    onPress={() => toggleExpand(index)}
                  >
                    {/* Left accent bar */}
                    <View
                      style={[
                        styles.accentBar,
                        isExpanded && styles.accentBarActive,
                      ]}
                    />

                    <View style={styles.itemInfo}>
                      <Text
                        style={[
                          styles.itemCode,
                          isExpanded && styles.itemCodeActive,
                        ]}
                      >
                        STR-{String(index + 1).padStart(2, "0")}
                      </Text>
                      <Text
                        style={[
                          styles.itemName,
                          isExpanded && styles.itemNameActive,
                        ]}
                        numberOfLines={isExpanded ? undefined : 1}
                      >
                        {combo.name}
                      </Text>
                    </View>

                    {/* Chevron */}
                    <Text
                      style={[
                        styles.chevron,
                        isExpanded && styles.chevronExpanded,
                      ]}
                    >
                      ▼
                    </Text>
                  </TouchableOpacity>

                  {/* Expandable detail panel */}
                  <AccordionPanel isExpanded={isExpanded}>
                    <View style={styles.detailPanel}>
                      {/* Strategy-specific tables for plant-based mode */}
                      {mode === "plants" && selectedPlants > 0 ? (
                        <>
                          {/* Per-plant fertilizer table for this strategy */}
                          <View style={styles.perPlantCard}>
                            <Text style={styles.perPlantTitle}>
                              {combo.name} per plant
                            </Text>

                            <View style={styles.resultHeaderRow}>
                              <Text
                                style={[
                                  styles.cellLabel,
                                  styles.cellHeading,
                                  styles.cellColBorder,
                                ]}
                              >
                                ರಸಗೊಬ್ಬರ {"\n"}Fertilizer
                              </Text>
                              <Text
                                style={[
                                  styles.cellValue,
                                  styles.cellHeading,
                                  styles.cellColBorder,
                                ]}
                              >
                                ಗ್ರಾಂ / ಗಿಡಕ್ಕೆ{"\n"}g / plant
                              </Text>
                              <Text
                                style={[styles.cellValue, styles.cellHeading]}
                              >
                                ಕೆ.ಜಿ / ಗಿಡಕ್ಕೆ{"\n"}kg / plant
                              </Text>
                            </View>

                            {combo.fertilizers.map((f) => {
                              const perPlantKg = f.amountKg / selectedPlants;
                              const perPlantG = perPlantKg * 1000;
                              const meta = getFertilizerMeta(f.label);
                              return (
                                <View key={f.label} style={styles.resultRow}>
                                  <Text
                                    style={[styles.cellLabel, styles.cellColBorder]}
                                  >
                                    {meta.displayKn}
                                    {"\n"}
                                    {meta.displayEn}
                                  </Text>
                                  <Text
                                    style={[styles.cellValue, styles.cellColBorder]}
                                  >
                                    {formatNumber(perPlantG, 0)}
                                  </Text>
                                  <Text style={styles.cellValue}>
                                    {formatNumber(perPlantKg, 3)}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>

                          {/* Total fertilizer table for this strategy */}
                            <View style={styles.perPlantCard}>
                            <Text style={styles.perPlantTitle}>
                              Total {combo.name} for {selectedPlants} plants
                            </Text>

                            <View style={styles.resultHeaderRow}>
                              <Text
                                style={[
                                  styles.cellLabel,
                                  styles.cellHeading,
                                  styles.cellColBorder,
                                ]}
                              >
                                ರಸಗೊಬ್ಬರ {"\n"}Fertilizer
                              </Text>
                              <Text
                                style={[
                                  styles.cellValue,
                                  styles.cellHeading,
                                  styles.cellColBorder,
                                ]}
                              >
                                ಗ್ರಾಂ | ಒಟ್ಟು{"\n"}Total (g)
                              </Text>
                              <Text
                                style={[styles.cellValue, styles.cellHeading]}
                              >
                                ಕೆ.ಜಿ | ಒಟ್ಟು{"\n"}Total (kg)
                              </Text>
                            </View>

                            {combo.fertilizers.map((f) => {
                              const totalKg = f.amountKg;
                              const totalG = totalKg * 1000;
                              const meta = getFertilizerMeta(f.label);
                              return (
                                <View key={f.label} style={styles.resultRow}>
                                  <Text
                                    style={[styles.cellLabel, styles.cellColBorder]}
                                  >
                                    {meta.displayKn}
                                    {"\n"}
                                    {meta.displayEn}
                                  </Text>
                                  <Text
                                    style={[styles.cellValue, styles.cellColBorder]}
                                  >
                                    {formatNumber(totalG, 0)}
                                  </Text>
                                  <Text style={styles.cellValue}>
                                    {formatNumber(totalKg, 2)}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                        </>
                      ) : (
                        /* Area-based mode: simple fertilizer rows as before */
                        <>
                          {combo.fertilizers.map((f) => {
                            const meta = getFertilizerMeta(f.label);
                            return (
                              <View key={f.label} style={styles.fertRow}>
                                <Text style={styles.fertLabel}>
                                  {meta.displayKn}
                                  {"\n"}
                                  {meta.displayEn}
                                </Text>
                                <Text style={styles.fertValue}>
                                  {f.amountKg} kg
                                </Text>
                              </View>
                            );
                          })}
                        </>
                      )}

                      {/* Total */}
                      <View style={styles.totalBox}>
                        <View>
                          <Text style={styles.totalTitle}>
                            ಒಟ್ಟು ಮಿಶ್ರಣ
                          </Text>
                          <Text style={styles.totalSubtitle}>
                            Total for {scopeLabel}
                          </Text>
                        </View>
                        <Text style={styles.totalValue}>
                          {formatNumber(totalWeight, 1)} kg
                        </Text>
                      </View>

                      {/* Advisory */}
                      <View style={styles.advisoryBox}>
                        <Text style={styles.advisoryTitle}>ಸೂಚನೆ / Note</Text>
                        {cropMeta?.categoryId === "cereals" ? (
                          <>
                            <Text style={styles.advisoryTextKn}>
                              {`1) ಕೆಲವು ಗೊಬ್ಬರಗಳನ್ನು ತುಂಬಾ ಮುಂಚಿತವಾಗಿ ಮಿಶ್ರಣ ಮಾಡಿದರೆ ಪೋಷಕಾಂಶಗಳ ಲಭ್ಯತೆ ಕಡಿಮೆಯಾಗಬಹುದು. ಸಾಧ್ಯವಾದರೆ ಮೊದಲು ${
                                getFertilizerMeta(
                                  combo.fertilizers[0].label
                                ).speakKn
                              } ಅನ್ನು ಹಾಕಿ ಅಥವಾ ಎಲ್ಲ ಗೊಬ್ಬರಗಳನ್ನು ಬಿತ್ತನೆಗೆ/ಅನ್ವಯಿಸುವುದಕ್ಕೆ ಮೊದಲು ಮಾತ್ರ ಮಿಶ್ರಣಿಸಿ.`}
                            </Text>
                            <Text style={styles.advisoryTextKn}>
                              2) ಶಿಫಾರಸ್ಸಿನ 50% ಸಾರಜನಕವನ್ನು ಭಿತ್ತನೆಯ ಸಮಯದಲ್ಲಿ ಹಾಕುವುದು
                              ಹಾಗು ಉಳಿದ 50% ಸಾರಜನಕ ಗೊಬ್ಬರವನ್ನು 30 ದಿನಗಳ ನಂತರ
                              ಮೇಲುಗೊಬ್ಬರವಾಗಿ ನೀಡುವುದು.
                            </Text>
                            <Text style={styles.advisoryTextKn}>
                              3) ರಂಜಕ ಮತ್ತು ಪೊಟ್ಯಾಷ್ ಗೊಬ್ಬರಗಳನ್ನು ಭಿತ್ತನೆಯ ಸಮಯದಲ್ಲಿ ಪೂರ್ಣ ಪ್ರಮಾಣದಲ್ಲಿ ಒದಗಿಸುವುದು{"\n"}
                            </Text>
                            <Text style={styles.advisoryText}>
                              1) Mixing some fertilizers too early can reduce
                              nutrient availability. Wherever possible, apply{" "}
                              {combo.fertilizers[0].label} first or mix all
                              fertilizers just before sowing.
                            </Text>

                            <Text style={styles.advisoryText}>
                              2) Apply 50% of the recommended nitrogen at the
                              time of sowing, and apply the remaining 50% nitrogen
                              fertilizer after 30 days.
                            </Text>
                            <Text style={styles.advisoryText}>
                              3) Provide full doses of phosphorus and potash
                              fertilizers during planting.
                            </Text>
                          </>
                        ) : (
                          <>
                            <Text style={styles.advisoryTextKn}>
                              {`ಕೆಲವು ಗೊಬ್ಬರಗಳನ್ನು ತುಂಬಾ ಮುಂಚಿತವಾಗಿ ಮಿಶ್ರಣ ಮಾಡಿದರೆ ಪೋಷಕಾಂಶಗಳ ಲಭ್ಯತೆ ಕಡಿಮೆಯಾಗಬಹುದು. ಸಾಧ್ಯವಾದರೆ ಮೊದಲು ${
                                getFertilizerMeta(
                                  combo.fertilizers[0].label
                                ).speakKn
                              } ಅನ್ನು ಹಾಕಿ ಅಥವಾ ಎಲ್ಲ ಗೊಬ್ಬರಗಳನ್ನು ಬಿತ್ತನೆಗೆ/ಅನ್ವಯಿಸುವುದಕ್ಕೆ ಮೊದಲು ಮಾತ್ರ ಮಿಶ್ರಣಿಸಿ.`}
                            </Text>
                            <Text style={styles.advisoryText}>
                              Mixing some fertilizers too early can reduce nutrient
                              availability. Wherever possible, apply{" "}
                              {combo.fertilizers[0].label} first or mix all
                              fertilizers just before sowing.
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                  </AccordionPanel>
                </View>
              );
            })}

            {/* Bottom hint */}
            <View style={styles.bottomHint}>
              <Text style={styles.bottomHintIcon}>☝️</Text>
              <Text style={styles.bottomHintText}>
                ಯಾವುದಾದರೂ ಒಂದು ತಂತ್ರ ಆಯ್ಕೆಮಾಡಿ · Select any strategy
              </Text>
            </View>
          </View>
        )}
        <View style={styles.backContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              stopVoice();
              router.push("/home");
            }}
          >
            <Text style={styles.backButtonText}>← ಮುಂಭಾಗಕ್ಕೆ</Text>
            <Text style={styles.backButtonTextEn}>← Back to Home</Text>
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


  /* ── List container ── */
  listContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#C8E6C9",
    backgroundColor: "#E8F5E9",
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  listHeaderCode: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1B5E20",
    letterSpacing: 0.3,
  },
  listHeaderSub: {
    fontSize: 11,
    color: "#4CAF50",
    marginTop: 1,
    fontWeight: "500",
  },
  listHeaderCrop: {
    fontSize: 11,
    color: "#2E7D32",
    marginTop: 4,
  },
  promptBanner: {
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#C8E6C9",
    borderStyle: "dashed",
    alignItems: "center",
  },
  promptText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2E7D32",
    textAlign: "center",
  },
  promptTextEn: {
    fontSize: 10,
    color: "#81C784",
    marginTop: 2,
    textAlign: "center",
  },
  bottomHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: "#FAFAFA",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  bottomHintIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  bottomHintText: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
  },

  /* ── Accordion item ── */
  itemWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingRight: 14,
    backgroundColor: "#fff",
  },
  itemRowExpanded: {
    backgroundColor: "#F0FFF4",
  },
  accentBar: {
    width: 3,
    alignSelf: "stretch",
    backgroundColor: "transparent",
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  accentBarActive: {
    backgroundColor: "#1B5E20",
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemCode: {
    fontSize: 9,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  itemCodeActive: {
    color: "#1B5E20",
  },
  itemName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: -0.2,
  },
  itemNameActive: {
    color: "#111827",
  },
  chevron: {
    fontSize: 10,
    color: "#D1D5DB",
    marginLeft: 8,
  },
  chevronExpanded: {
    color: "#1B5E20",
    transform: [{ rotate: "180deg" }],
  },

  /* ── Detail panel (expanded) ── */
  detailPanel: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  fertRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  fertLabel: {
    fontSize: 13,
    color: "#374151",
  },
  fertValue: {
    fontSize: 13,
    color: "#1F2937",
    fontWeight: "600",
  },
  fertValueCol: {
    alignItems: "flex-end",
  },
  fertValueLine: {
    fontSize: 12,
    color: "#374151",
  },
  fertValueTotal: {
    marginTop: 2,
    fontSize: 12,
    color: "#1B5E20",
    fontWeight: "600",
  },
  totalBox: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#E8F5E9",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1B5E20",
  },
  totalSubtitle: {
    fontSize: 11,
    color: "#4CAF50",
    marginTop: 1,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1B5E20",
  },
  advisoryBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#FFF8E1",
    borderLeftWidth: 3,
    borderLeftColor: "#FFC107",
  },
  advisoryTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 3,
  },
  advisoryTextKn: {
    fontSize: 11,
    color: "#374151",
    lineHeight: 16,
    marginBottom: 2,
  },
  advisoryText: {
    fontSize: 11,
    color: "#4B5563",
    lineHeight: 16,
  },
  backContainer: {
    marginTop: 16,
  },
  backButton: {
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
  backButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  backButtonTextEn: {
    fontSize: 12,
    color: "#A5D6A7",
    textAlign: "center",
    marginTop: 2,
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
    fontSize: 13.5,
    fontWeight: "600",
    color: "#555",
  },
  cellColBorder: {
    borderRightWidth: 1,
    borderRightColor: "#E0E0E0",
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
  perPlantCard: {
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
  perPlantTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1B5E20",
  },
  perPlantTitleEn: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
  },
});

