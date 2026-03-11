import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { Crop } from "../types";
import { speakKn } from "../utils/voice";

type SoilFertilityLevel = "very_low" | "low" | "high" | "very_high";

type NutrientKey = "N" | "P" | "K";

interface RDFPerArea {
  perAcre?: Record<NutrientKey, number>;
  perHa: Record<NutrientKey, number>;
}

interface SoilClassValues {
  very_low: number;
  low: number;
  high: number;
  very_high: number;
}

interface CerealsFertilityData {
  rdf: RDFPerArea;
  soilClasses: Record<NutrientKey, SoilClassValues>;
}

export interface CategorizedCrop extends Crop {
  categoryId: string;
  cerealsFertility?: CerealsFertilityData;
  hasAgeGroups?: boolean;
}

interface CropCategory {
  id: string;
  title: string;
  title_kn: string;
}

const CROP_CATEGORIES: CropCategory[] = [
  { id: "cereals", title: "Cereals", title_kn: "ಧಾನ್ಯ ಬೆಳೆಗಳು" },
  { id: "pulses", title: "Pulses", title_kn: "ಕಾಳು ಬೆಳೆಗಳು" },
  { id: "oilseeds", title: "Oil Seeds", title_kn: "ಎಣ್ಣೆ ಬೀಜಗಳು" },
  { id: "commercial", title: "Commercial Crops", title_kn: "ವಾಣಿಜ್ಯ ಬೆಳೆಗಳು" },
  { id: "vegetables", title: "Vegetable Crops", title_kn: "ತರಕಾರಿಗಳ ಬೆಳೆಗಳು" },
  { id: "fruits", title: "Fruit Crops", title_kn: "ಹಣ್ಣು ಬೆಳೆಗಳು" },
  { id: "grapes", title: "Grapes", title_kn: "ದ್ರಾಕ್ಷಿ" },
  { id: "cashew_bp", title: "Cashew and BP", title_kn: "ಗೋಡಂಬಿ ಮತ್ತು BP" },
  { id: "mango", title: "Mango", title_kn: "ಮಾವು" },
  { id: "coconut", title: "Coconut", title_kn: "ತೆಂಗು" },
  { id: "arecanut", title: "Arecanut", title_kn: "ಅಡಿಕೆ" },
];

// NOTE: These cereals crops and their fertility data are mapped from the GKVK table
// and kept here for later use in recommendation calculations. They are NOT displayed.
const CEREALS_CROPS: CategorizedCrop[] = [
  {
    id: "paddy_kharif_hiv",
    name: "Paddy (Kharif, irrigated paddy varieties)",
    name_kn: "ಮಣ್ಣು (ಖರೀಫ್, ನೀರಾವರಿ ಅಕ್ಕಿ ಜಾತಿಗಳು)",
    icon: "🌾",
    categoryId: "cereals",
    cerealsFertility: {
      rdf: {
        perAcre: { N: 40, P: 20, K: 20 },
        perHa: { N: 100, P: 50, K: 50 },
      },
      soilClasses: {
        N: { very_low: 167, low: 133, high: 67, very_high: 33 },
        P: { very_low: 83.5, low: 66.5, high: 33.3, very_high: 16.5 },
        K: { very_low: 208.75, low: 166.25, high: 83.5, very_high: 41.25 },
      },
    },
  },
  {
    id: "paddy_kharif_hybrids",
    name: "Paddy (Kharif, Hybrids)",
    name_kn: "ಮಣ್ಣು (ಖರೀಫ್, ಸಂಕರ ಜಾತಿಗಳು)",
    icon: "🌾",
    categoryId: "cereals",
    cerealsFertility: {
      rdf: {
        perAcre: { N: 50, P: 25, K: 25 },
        perHa: { N: 125, P: 62.5, K: 62.5 },
      },
      soilClasses: {
        N: { very_low: 208.75, low: 166.25, high: 83.5, very_high: 41.25 },
        P: { very_low: 104.375, low: 83.125, high: 41.875, very_high: 20.9375 },
        K: { very_low: 261, low: 208.75, high: 104.375, very_high: 52.1875 },
      },
    },
  },
  {
    id: "ragi_rainfed",
    name: "Ragi (Rainfed)",
    name_kn: "ರಾಗಿ (ಮಳೆಆಧಾರಿತ)",
    icon: "🌾",
    categoryId: "cereals",
    cerealsFertility: {
      rdf: {
        perAcre: { N: 26, P: 16, K: 16 },
        perHa: { N: 65, P: 40, K: 40 },
      },
      soilClasses: {
        N: { very_low: 108.55, low: 86.45, high: 43.55, very_high: 21.45 },
        P: { very_low: 66.8, low: 53.2, high: 26.8, very_high: 13.2 },
        K: { very_low: 66.8, low: 53.2, high: 26.8, very_high: 13.2 },
      },
    },
  },
  {
    id: "kharif_sorghum_rainfed_hybrids",
    name: "Kharif Sorghum (Rainfed, Hybrids)",
    name_kn: "ಖರೀಫ್ ಜೋಳ (ಮಳೆಆಧಾರಿತ, ಸಂಕರ ಜಾತಿಗಳು)",
    icon: "🌾",
    categoryId: "cereals",
    cerealsFertility: {
      rdf: {
        perAcre: { N: 26, P: 16, K: 16 },
        perHa: { N: 65, P: 40, K: 40 },
      },
      soilClasses: {
        N: { very_low: 108.55, low: 86.45, high: 43.55, very_high: 21.45 },
        P: { very_low: 66.8, low: 53.2, high: 26.8, very_high: 13.2 },
        K: { very_low: 66.8, low: 53.2, high: 26.8, very_high: 13.2 },
      },
    },
  },
  {
    id: "maize_rainfed",
    name: "Maize (Rainfed)",
    name_kn: "ಮೆಕ್ಕೆಜೋಳ (ಮಳೆಆಧಾರಿತ)",
    icon: "🌽",
    categoryId: "cereals",
    cerealsFertility: {
      rdf: {
        perAcre: { N: 40, P: 20, K: 20 },
        perHa: { N: 100, P: 50, K: 50 },
      },
      soilClasses: {
        N: { very_low: 167, low: 133, high: 67, very_high: 33 },
        P: { very_low: 83.5, low: 66.5, high: 33.25, very_high: 16.75 },
        K: { very_low: 83.5, low: 66.5, high: 33.25, very_high: 16.75 },
      },
    },
  },
  {
    id: "wheat",
    name: "Wheat",
    name_kn: "ಗೋಧಿ",
    icon: "🌾",
    categoryId: "cereals",
    cerealsFertility: {
      rdf: {
        perAcre: { N: 30, P: 16, K: 10 },
        perHa: { N: 75, P: 40, K: 25 },
      },
      soilClasses: {
        N: { very_low: 125.25, low: 99.75, high: 50.25, very_high: 24.75 },
        P: { very_low: 66.8, low: 53.2, high: 26.8, very_high: 13.2 },
        K: { very_low: 41.75, low: 33.25, high: 16.75, very_high: 8.25 },
      },
    },
  },
  {
    id: "bajra_hybrid_rainfed",
    name: "Bajra / Pearl Millet (Hybrid, Rainfed)",
    name_kn: "ಸಜ್ಜೆ / ಪರ್ಳ್ ಮಿಲ್ಲೆಟ್ (ಸಂಕರ, ಮಳೆಆಧಾರಿತ)",
    icon: "🌾",
    categoryId: "cereals",
    cerealsFertility: {
      rdf: {
        perAcre: { N: 20, P: 10, K: 10 },
        perHa: { N: 50, P: 25, K: 25 },
      },
      soilClasses: {
        N: { very_low: 83.5, low: 66.5, high: 33.3, very_high: 16.5 },
        P: { very_low: 41.75, low: 33.25, high: 16.75, very_high: 8.25 },
        K: { very_low: 41.75, low: 33.25, high: 16.75, very_high: 8.25 },
      },
    },
  },
  {
    id: "foxtail_millet_rainfed",
    name: "Foxtail Millet (Rainfed)",
    name_kn: "ನವಣೆ (ಮಳೆಆಧಾರಿತ)",
    icon: "🌾",
    categoryId: "cereals",
    cerealsFertility: {
      rdf: {
        perAcre: { N: 16, P: 8, K: 8 },
        perHa: { N: 40, P: 20, K: 20 },
      },
      soilClasses: {
        N: { very_low: 66.8, low: 53.2, high: 26.8, very_high: 13.2 },
        P: { very_low: 33.4, low: 26.6, high: 13.4, very_high: 6.6 },
        K: { very_low: 33.4, low: 26.6, high: 13.4, very_high: 6.6 },
      },
    },
  },
  {
    id: "kodo_millet_rainfed",
    name: "Kodo Millet (Rainfed)",
    name_kn: "ಹಾರಕ (ಮಳೆಆಧಾರಿತ)",
    icon: "🌾",
    categoryId: "cereals",
    cerealsFertility: {
      rdf: {
        perAcre: { N: 8, P: 8, K: 8 },
        perHa: { N: 20, P: 20, K: 20 },
      },
      soilClasses: {
        N: { very_low: 33.4, low: 26.6, high: 13.4, very_high: 6.6 },
        P: { very_low: 33.4, low: 26.6, high: 13.4, very_high: 6.6 },
        K: { very_low: 33.4, low: 26.6, high: 13.4, very_high: 6.6 },
      },
    },
  },
  {
    id: "little_millet_rainfed",
    name: "Little Millet (Rainfed)",
    name_kn: "ಸಾಮೆ (ಮಳೆಆಧಾರಿತ)",
    icon: "🌾",
    categoryId: "cereals",
    cerealsFertility: {
      rdf: {
        perAcre: { N: 8, P: 8, K: 8 },
        perHa: { N: 20, P: 20, K: 20 },
      },
      soilClasses: {
        N: { very_low: 33.4, low: 26.6, high: 13.4, very_high: 6.6 },
        P: { very_low: 33.4, low: 26.6, high: 13.4, very_high: 6.6 },
        K: { very_low: 33.4, low: 26.6, high: 13.4, very_high: 6.6 },
      },
    },
  },
  {
    id: "barnyard_millet_rainfed",
    name: "Barnyard Millet (Rainfed)",
    name_kn: "ಊದಲು (ಮಳೆಆಧಾರಿತ)",
    icon: "🌾",
    categoryId: "cereals",
    cerealsFertility: {
      rdf: {
        perAcre: { N: 8, P: 8, K: 8 },
        perHa: { N: 20, P: 20, K: 20 },
      },
      soilClasses: {
        N: { very_low: 33.4, low: 26.6, high: 13.4, very_high: 6.6 },
        P: { very_low: 33.4, low: 26.6, high: 13.4, very_high: 6.6 },
        K: { very_low: 33.4, low: 26.6, high: 13.4, very_high: 6.6 },
      },
    },
  },
  {
    id: "browntop_millet_rainfed",
    name: "Browntop Millet (Rainfed)",
    name_kn: "ಕೊಂಡಕಾಡು (ಮಳೆಆಧಾರಿತ)",
    icon: "🌾",
    categoryId: "cereals",
    cerealsFertility: {
      rdf: {
        perAcre: { N: 16, P: 8, K: 8 },
        perHa: { N: 40, P: 20, K: 20 },
      },
      soilClasses: {
        N: { very_low: 66.8, low: 53.2, high: 26.8, very_high: 13.2 },
        P: { very_low: 33.4, low: 26.6, high: 13.4, very_high: 6.6 },
        K: { very_low: 33.4, low: 26.6, high: 13.4, very_high: 6.6 },
      },
    },
  },
  {
    id: "proso_millet_rainfed",
    name: "Proso Millet (Rainfed)",
    name_kn: "ಬಿಳಿ ಸಾಮೆ (ಮಳೆಆಧಾರಿತ)",
    icon: "🌾",
    categoryId: "cereals",
    cerealsFertility: {
      rdf: {
        perAcre: { N: 8, P: 8, K: 8 },
        perHa: { N: 20, P: 20, K: 20 },
      },
      soilClasses: {
        N: { very_low: 33.4, low: 26.6, high: 13.4, very_high: 6.6 },
        P: { very_low: 33.4, low: 26.6, high: 13.4, very_high: 6.6 },
        K: { very_low: 33.4, low: 26.6, high: 13.4, very_high: 6.6 },
      },
    },
  },
];

// Pulses (Rainfed) – values mapped from the table, kept for later calculations.
const PULSES_CROPS: CategorizedCrop[] = [
  {
    id: "red_gram_rainfed",
    name: "Red gram (Rainfed)",
    name_kn: "ತೊಗರಿ (ಮಳೆಆಧಾರಿತ)",
    icon: "🫘",
    categoryId: "pulses",
    cerealsFertility: {
      rdf: { perAcre: { N: 10, P: 20, K: 10 }, perHa: { N: 25, P: 50, K: 25 } },
      soilClasses: {
        N: { very_low: 41.75, low: 33.25, high: 16.75, very_high: 8.25 },
        P: { very_low: 83.5, low: 66.5, high: 33.5, very_high: 16.5 },
        K: { very_low: 41.75, low: 33.25, high: 16.75, very_high: 8.25 },
      },
    },
  },
  {
    id: "greengram_blackgram_rainfed",
    name: "Greengram and Blackgram (Rainfed)",
    name_kn: "ಹೆಸರುಕಾಳು ಮತ್ತು ಉದ್ದಿನಕಾಳು (ಮಳೆಆಧಾರಿತ)",
    icon: "🫘",
    categoryId: "pulses",
    cerealsFertility: {
      rdf: { perAcre: { N: 5, P: 10, K: 10 }, perHa: { N: 12.5, P: 25, K: 25 } },
      soilClasses: {
        N: { very_low: 20.875, low: 16.625, high: 8.375, very_high: 4.125 },
        P: { very_low: 41.75, low: 33.25, high: 16.75, very_high: 8.25 },
        K: { very_low: 41.75, low: 33.25, high: 16.75, very_high: 8.25 },
      },
    },
  },
  {
    id: "cowpea_rainfed",
    name: "Cowpea (Rainfed)",
    name_kn: "ಅಲಸಂದೆ (ಮಳೆಆಧಾರಿತ)",
    icon: "🫘",
    categoryId: "pulses",
    cerealsFertility: {
      rdf: { perAcre: { N: 10, P: 20, K: 10 }, perHa: { N: 25, P: 50, K: 25 } },
      soilClasses: {
        N: { very_low: 41.75, low: 33.25, high: 16.75, very_high: 8.25 },
        P: { very_low: 83.5, low: 66.5, high: 33.5, very_high: 16.5 },
        K: { very_low: 41.75, low: 33.25, high: 16.75, very_high: 8.25 },
      },
    },
  },
  {
    id: "field_bean_rainfed",
    name: "Field Bean (Rainfed)",
    name_kn: "ಅವರೆ (ಮಳೆಆಧಾರಿತ)",
    icon: "🫘",
    categoryId: "pulses",
    cerealsFertility: {
      rdf: { perAcre: { N: 10, P: 20, K: 10 }, perHa: { N: 25, P: 50, K: 25 } },
      soilClasses: {
        N: { very_low: 41.75, low: 33.25, high: 16.75, very_high: 8.25 },
        P: { very_low: 83.5, low: 66.5, high: 33.5, very_high: 16.5 },
        K: { very_low: 41.75, low: 33.25, high: 16.75, very_high: 8.25 },
      },
    },
  },
  {
    id: "bengal_gram_rainfed",
    name: "Bengal gram (Rainfed)",
    name_kn: "ಕಡಲೆಕಾಳು (ಮಳೆಆಧಾರಿತ)",
    icon: "🫘",
    categoryId: "pulses",
    cerealsFertility: {
      rdf: { perAcre: { N: 5, P: 10, K: 10 }, perHa: { N: 12.5, P: 25, K: 25 } },
      soilClasses: {
        N: { very_low: 20.875, low: 16.625, high: 8.375, very_high: 4.125 },
        P: { very_low: 41.75, low: 33.25, high: 16.75, very_high: 8.25 },
        K: { very_low: 41.75, low: 33.25, high: 16.75, very_high: 8.25 },
      },
    },
  },
  {
    id: "horse_gram_rainfed",
    name: "Horse gram (Rainfed)",
    name_kn: "ಹುರಳಿಕಾಳು (ಮಳೆಆಧಾರಿತ)",
    icon: "🫘",
    categoryId: "pulses",
    cerealsFertility: {
      rdf: { perAcre: { N: 10, P: 15, K: 10 }, perHa: { N: 25, P: 37.5, K: 25 } },
      soilClasses: {
        N: { very_low: 41.75, low: 33.25, high: 16.75, very_high: 8.25 },
        P: { very_low: 62.625, low: 49.875, high: 25.125, very_high: 12.375 },
        K: { very_low: 41.75, low: 33.25, high: 16.75, very_high: 8.25 },
      },
    },
  },
  {
    id: "soyabean_rainfed",
    name: "Soyabean (Rainfed)",
    name_kn: "ಸೋಯಾಬಿನ್ (ಮಳೆಆಧಾರಿತ)",
    icon: "🫘",
    categoryId: "pulses",
    cerealsFertility: {
      rdf: { perAcre: { N: 10, P: 25, K: 10 }, perHa: { N: 25, P: 62.5, K: 25 } },
      soilClasses: {
        N: { very_low: 41.75, low: 33.25, high: 16.75, very_high: 8.25 },
        P: { very_low: 104.375, low: 83.125, high: 41.875, very_high: 20.625 },
        K: { very_low: 41.75, low: 33.25, high: 16.75, very_high: 8.25 },
      },
    },
  },
];

// Commercial Crops – values mapped from the table, kept for later calculations.
const COMMERCIAL_CROPS: CategorizedCrop[] = [
  {
    id: "sugarcane",
    name: "Sugarcane",
    name_kn: "ಕಬ್ಬು",
    icon: "🎋",
    categoryId: "commercial",
    cerealsFertility: {
      rdf: { perAcre: { N: 100, P: 40, K: 50 }, perHa: { N: 250, P: 100, K: 125 } },
      soilClasses: {
        N: { very_low: 417.5, low: 332.5, high: 167.5, very_high: 82.5 },
        P: { very_low: 167, low: 133, high: 67, very_high: 33 },
        K: { very_low: 208.75, low: 166.25, high: 83.75, very_high: 41.25 },
      },
    },
  },
  {
    id: "cotton",
    name: "Cotton",
    name_kn: "ಹತ್ತಿ",
    icon: "🧵",
    categoryId: "commercial",
    cerealsFertility: {
      rdf: { perAcre: { N: 60, P: 30, K: 30 }, perHa: { N: 150, P: 75, K: 75 } },
      soilClasses: {
        N: { very_low: 250.5, low: 199.5, high: 100.5, very_high: 49.5 },
        P: { very_low: 125.25, low: 99.75, high: 50.25, very_high: 24.75 },
        K: { very_low: 125.25, low: 99.75, high: 50.25, very_high: 24.75 },
      },
    },
  },
  {
    id: "tobacco",
    name: "Tobacco",
    name_kn: "ತಂಬಾಕು",
    icon: "🍂",
    categoryId: "commercial",
    cerealsFertility: {
      rdf: { perAcre: { N: 16, P: 12, K: 32 }, perHa: { N: 40, P: 30, K: 80 } },
      soilClasses: {
        N: { very_low: 66.8, low: 53.2, high: 26.8, very_high: 13.2 },
        P: { very_low: 50.1, low: 39.9, high: 20.1, very_high: 9.9 },
        K: { very_low: 133.6, low: 106.4, high: 53.6, very_high: 26.4 },
      },
    },
  },
  {
    id: "ginger",
    name: "Ginger",
    name_kn: "ಶುಂಠಿ",
    icon: "🫚",
    categoryId: "commercial",
    cerealsFertility: {
      rdf: { perAcre: { N: 40, P: 20, K: 20 }, perHa: { N: 100, P: 50, K: 50 } },
      soilClasses: {
        N: { very_low: 167, low: 133, high: 67, very_high: 33 },
        P: { very_low: 83.5, low: 66.5, high: 33.5, very_high: 16.5 },
        K: { very_low: 83.5, low: 66.5, high: 33.5, very_high: 16.5 },
      },
    },
  },
];

// Oil Seeds (Rainfed) – values mapped from the table, kept for later calculations.
const OILSEEDS_CROPS: CategorizedCrop[] = [
  {
    id: "ground_nut_rainfed",
    name: "Ground nut (Rainfed)",
    name_kn: "ಕಡಲೆಕಾಯಿ (ಮಳೆಆಧಾರಿತ)",
    icon: "🥜",
    categoryId: "oilseeds",
    cerealsFertility: {
      rdf: { perAcre: { N: 10, P: 20, K: 10 }, perHa: { N: 25, P: 50, K: 25 } },
      soilClasses: {
        N: { very_low: 41.75, low: 33.25, high: 16.75, very_high: 8.25 },
        P: { very_low: 83.5, low: 66.5, high: 33.5, very_high: 16.5 },
        K: { very_low: 41.75, low: 33.25, high: 16.75, very_high: 8.25 },
      },
    },
  },
  {
    id: "sunflower_rainfed",
    name: "Sunflower (Rainfed)",
    name_kn: "ಸೂರ್ಯಕಾಂತಿ (ಮಳೆಆಧಾರಿತ)",
    icon: "🌻",
    categoryId: "oilseeds",
    cerealsFertility: {
      rdf: { perAcre: { N: 15, P: 20, K: 15 }, perHa: { N: 37.5, P: 50, K: 37.5 } },
      soilClasses: {
        N: { very_low: 62.63, low: 49.88, high: 25.13, very_high: 12.38 },
        P: { very_low: 83.5, low: 66.5, high: 33.5, very_high: 16.5 },
        K: { very_low: 62.63, low: 49.88, high: 25.13, very_high: 12.38 },
      },
    },
  },
  {
    id: "soyabean_rainfed",
    name: "Soyabean (Rainfed)",
    name_kn: "ಸೋಯಾಬಿನ್ (ಮಳೆಆಧಾರಿತ)",
    icon: "🫘",
    categoryId: "oilseeds",
    cerealsFertility: {
      rdf: { perAcre: { N: 10, P: 25, K: 10 }, perHa: { N: 25, P: 62.5, K: 25 } },
      soilClasses: {
        N: { very_low: 41.75, low: 33.25, high: 16.75, very_high: 8.25 },
        P: { very_low: 104.38, low: 83.13, high: 41.88, very_high: 20.63 },
        K: { very_low: 41.75, low: 33.25, high: 16.75, very_high: 8.25 },
      },
    },
  },
  {
    id: "castor_rainfed",
    name: "Castor (Rainfed)",
    name_kn: "ಎರೆಂಡೆ (ಮಳೆಆಧಾರಿತ)",
    icon: "🌱",
    categoryId: "oilseeds",
    cerealsFertility: {
      rdf: { perAcre: { N: 15, P: 15, K: 10 }, perHa: { N: 37.5, P: 37.5, K: 25 } },
      soilClasses: {
        N: { very_low: 62.63, low: 49.88, high: 25.13, very_high: 12.38 },
        P: { very_low: 62.63, low: 49.88, high: 25.13, very_high: 12.38 },
        K: { very_low: 41.75, low: 33.25, high: 16.75, very_high: 8.25 },
      },
    },
  },
  {
    id: "sesamum_rainfed",
    name: "Sesamum (Rainfed)",
    name_kn: "ಎಳ್ಳು (ಮಳೆಆಧಾರಿತ)",
    icon: "🌱",
    categoryId: "oilseeds",
    cerealsFertility: {
      rdf: { perAcre: { N: 15, P: 10, K: 10 }, perHa: { N: 37.5, P: 25, K: 25 } },
      soilClasses: {
        N: { very_low: 62.63, low: 49.88, high: 25.13, very_high: 12.38 },
        P: { very_low: 41.75, low: 33.25, high: 16.75, very_high: 8.25 },
        K: { very_low: 41.75, low: 33.25, high: 16.75, very_high: 8.25 },
      },
    },
  },
  {
    id: "niger_rainfed",
    name: "Niger (Rainfed)",
    name_kn: "ಉಗ್ಗೆ (ಮಳೆಆಧಾರಿತ)",
    icon: "🌱",
    categoryId: "oilseeds",
    cerealsFertility: {
      rdf: { perAcre: { N: 8, P: 16, K: 8 }, perHa: { N: 20, P: 40, K: 20 } },
      soilClasses: {
        N: { very_low: 33.4, low: 26.6, high: 13.4, very_high: 6.6 },
        P: { very_low: 66.8, low: 53.2, high: 26.8, very_high: 13.2 },
        K: { very_low: 33.4, low: 26.6, high: 13.4, very_high: 6.6 },
      },
    },
  },
  {
    id: "safflower_rainfed",
    name: "Safflower (Rainfed)",
    name_kn: "ಕುಸುಬೆ (ಮಳೆಆಧಾರಿತ)",
    icon: "🌼",
    categoryId: "oilseeds",
    cerealsFertility: {
      rdf: { perAcre: { N: 16, P: 16, K: 5 }, perHa: { N: 40, P: 40, K: 12.5 } },
      soilClasses: {
        N: { very_low: 66.8, low: 53.2, high: 26.8, very_high: 13.2 },
        P: { very_low: 66.8, low: 53.2, high: 26.8, very_high: 13.2 },
        K: { very_low: 20.88, low: 16.63, high: 8.38, very_high: 4.13 },
      },
    },
  },
  {
    id: "mustard_rainfed",
    name: "Mustard (Rainfed)",
    name_kn: "ಸಾಸಿವೆ (ಮಳೆಆಧಾರಿತ)",
    icon: "🌼",
    categoryId: "oilseeds",
    cerealsFertility: {
      rdf: { perAcre: { N: 28, P: 7, K: 10 }, perHa: { N: 70, P: 17.5, K: 25 } },
      soilClasses: {
        N: { very_low: 116.9, low: 93.1, high: 46.9, very_high: 23.1 },
        P: { very_low: 29.23, low: 23.28, high: 11.73, very_high: 5.78 },
        K: { very_low: 41.75, low: 33.25, high: 16.75, very_high: 8.25 },
      },
    },
  },
];

// Vegetable Crops – table provides RDF/ha only (no RDF/acre).
const VEGETABLE_CROPS: CategorizedCrop[] = [
  {
    id: "tomato",
    name: "Tomato",
    name_kn: "ಟೊಮೆಟೊ",
    icon: "🍅",
    categoryId: "vegetables",
    cerealsFertility: {
      rdf: { perHa: { N: 60, P: 50, K: 30 } },
      soilClasses: {
        N: { very_low: 100.2, low: 79.8, high: 40.2, very_high: 19.8 },
        P: { very_low: 83.5, low: 66.5, high: 33.5, very_high: 16.5 },
        K: { very_low: 50.1, low: 39.9, high: 20.1, very_high: 9.9 },
      },
    },
  },
  {
    id: "turmeric",
    name: "Turmeric",
    name_kn: "ಅರಿಶಿನ",
    icon: "🟡",
    categoryId: "vegetables",
    cerealsFertility: {
      rdf: { perHa: { N: 150, P: 125, K: 250 } },
      soilClasses: {
        N: { very_low: 250.5, low: 199.5, high: 100.5, very_high: 49.5 },
        P: { very_low: 208.75, low: 166.25, high: 83.75, very_high: 41.25 },
        K: { very_low: 417.5, low: 332.5, high: 167.5, very_high: 82.5 },
      },
    },
  },
  {
    id: "coriander",
    name: "Coriander",
    name_kn: "ಕೊತ್ತಂಬರಿ",
    icon: "🌿",
    categoryId: "vegetables",
    cerealsFertility: {
      rdf: { perHa: { N: 35, P: 35, K: 35 } },
      soilClasses: {
        N: { very_low: 58.45, low: 46.55, high: 23.45, very_high: 11.55 },
        P: { very_low: 58.45, low: 46.55, high: 23.45, very_high: 11.55 },
        K: { very_low: 58.45, low: 46.55, high: 23.45, very_high: 11.55 },
      },
    },
  },
  {
    id: "brinjal",
    name: "Brinjal",
    name_kn: "ಬದನೆಕಾಯಿ",
    icon: "🍆",
    categoryId: "vegetables",
    cerealsFertility: {
      rdf: { perHa: { N: 125, P: 100, K: 50 } },
      soilClasses: {
        N: { very_low: 208.75, low: 166.25, high: 83.75, very_high: 41.25 },
        P: { very_low: 167, low: 133, high: 67, very_high: 33 },
        K: { very_low: 83.5, low: 66.5, high: 33.5, very_high: 16.5 },
      },
    },
  },
  {
    id: "beans",
    name: "Beans",
    name_kn: "ಬೀನ್ಸ್",
    icon: "🫛",
    categoryId: "vegetables",
    cerealsFertility: {
      rdf: { perHa: { N: 75, P: 125, K: 90 } },
      soilClasses: {
        N: { very_low: 125.25, low: 99.75, high: 50.25, very_high: 24.75 },
        P: { very_low: 208.75, low: 166.25, high: 83.75, very_high: 41.25 },
        K: { very_low: 150.3, low: 119.7, high: 60.3, very_high: 29.7 },
      },
    },
  },
  {
    id: "cabbage",
    name: "Cabbage",
    name_kn: "ಎಲೆಕೋಸು",
    icon: "🥬",
    categoryId: "vegetables",
    cerealsFertility: {
      rdf: { perHa: { N: 150, P: 100, K: 125 } },
      soilClasses: {
        N: { very_low: 250.5, low: 199.5, high: 100.5, very_high: 49.5 },
        P: { very_low: 167, low: 133, high: 67, very_high: 33 },
        K: { very_low: 208.75, low: 166.25, high: 83.75, very_high: 41.25 },
      },
    },
  },
  {
    id: "potato",
    name: "Potato",
    name_kn: "ಆಲೂಗಡ್ಡೆ",
    icon: "🥔",
    categoryId: "vegetables",
    cerealsFertility: {
      rdf: { perHa: { N: 75, P: 75, K: 100 } },
      soilClasses: {
        N: { very_low: 125.25, low: 99.75, high: 50.25, very_high: 24.75 },
        P: { very_low: 125.25, low: 99.75, high: 50.25, very_high: 24.75 },
        K: { very_low: 167, low: 133, high: 67, very_high: 33 },
      },
    },
  },
  {
    id: "sweet_potato",
    name: "Sweet potato",
    name_kn: "ಸಿಹಿ ಆಲೂಗಡ್ಡೆ",
    icon: "🍠",
    categoryId: "vegetables",
    cerealsFertility: {
      rdf: { perHa: { N: 75, P: 50, K: 75 } },
      soilClasses: {
        N: { very_low: 125.25, low: 99.75, high: 50.25, very_high: 24.75 },
        P: { very_low: 83.5, low: 66.5, high: 33.5, very_high: 16.5 },
        K: { very_low: 125.25, low: 99.75, high: 50.25, very_high: 24.75 },
      },
    },
  },
  {
    id: "chillies",
    name: "Chillies",
    name_kn: "ಮೆಣಸಿನಕಾಯಿ",
    icon: "🌶️",
    categoryId: "vegetables",
    cerealsFertility: {
      rdf: { perHa: { N: 100, P: 50, K: 50 } },
      soilClasses: {
        N: { very_low: 167, low: 133, high: 67, very_high: 33 },
        P: { very_low: 83.5, low: 66.5, high: 33.5, very_high: 16.5 },
        K: { very_low: 83.5, low: 66.5, high: 33.5, very_high: 16.5 },
      },
    },
  },
  {
    id: "garlic",
    name: "Garlic",
    name_kn: "ಬೆಳ್ಳುಳ್ಳಿ",
    icon: "🧄",
    categoryId: "vegetables",
    cerealsFertility: {
      rdf: { perHa: { N: 125, P: 62.5, K: 62.5 } },
      soilClasses: {
        N: { very_low: 208.75, low: 166.25, high: 83.75, very_high: 41.25 },
        P: { very_low: 104.375, low: 83.125, high: 41.875, very_high: 20.625 },
        K: { very_low: 104.375, low: 83.125, high: 41.875, very_high: 20.625 },
      },
    },
  },
  {
    id: "onion",
    name: "Onion",
    name_kn: "ಈರುಳ್ಳಿ",
    icon: "🧅",
    categoryId: "vegetables",
    cerealsFertility: {
      rdf: { perHa: { N: 125, P: 75, K: 125 } },
      soilClasses: {
        N: { very_low: 208.75, low: 166.25, high: 83.75, very_high: 41.25 },
        P: { very_low: 125.25, low: 99.75, high: 50.25, very_high: 24.75 },
        K: { very_low: 208.75, low: 166.25, high: 83.75, very_high: 41.25 },
      },
    },
  },
];

// Mango – age-wise per-plant recommendations (g/plant/year), stored for later use.
type MangoAgeKey =
  | "year_1"
  | "year_2"
  | "year_3"
  | "year_4"
  | "year_5"
  | "year_6"
  | "year_7"
  | "year_8"
  | "year_9"
  | "year_10_plus";

interface MangoPerPlantFertility {
  rdfPerPlant: Record<NutrientKey, number>;
  soilClasses: Record<NutrientKey, SoilClassValues>;
}

export const MANGO_AGE_GROUP_FERTILITY: Record<
  MangoAgeKey,
  MangoPerPlantFertility
> = {
  year_1: {
    rdfPerPlant: { N: 75, P: 20, K: 70 },
    soilClasses: {
      N: { very_low: 125.25, low: 99.75, high: 50.25, very_high: 24.75 },
      P: { very_low: 33.4, low: 26.6, high: 13.3, very_high: 6.6 },
      K: { very_low: 116.9, low: 93.1, high: 46.9, very_high: 23.1 },
    },
  },
  year_2: {
    rdfPerPlant: { N: 146, P: 36, K: 136 },
    soilClasses: {
      N: { very_low: 243.82, low: 194.18, high: 97.82, very_high: 48.18 },
      P: { very_low: 60.12, low: 47.88, high: 24.12, very_high: 11.88 },
      K: { very_low: 227.12, low: 180.88, high: 91.12, very_high: 44.88 },
    },
  },
  year_3: {
    rdfPerPlant: { N: 219, P: 54, K: 204 },
    soilClasses: {
      N: { very_low: 365.73, low: 291.27, high: 146.73, very_high: 72.27 },
      P: { very_low: 90.18, low: 71.82, high: 36.18, very_high: 17.82 },
      K: { very_low: 340.68, low: 271.32, high: 136.68, very_high: 67.32 },
    },
  },
  year_4: {
    rdfPerPlant: { N: 292, P: 72, K: 272 },
    soilClasses: {
      N: { very_low: 487.64, low: 388.36, high: 195.64, very_high: 96.36 },
      P: { very_low: 120.24, low: 95.76, high: 48.24, very_high: 23.76 },
      K: { very_low: 454.24, low: 361.76, high: 182.24, very_high: 89.76 },
    },
  },
  year_5: {
    rdfPerPlant: { N: 365, P: 90, K: 340 },
    soilClasses: {
      N: { very_low: 609.55, low: 485.45, high: 244.55, very_high: 120.45 },
      P: { very_low: 150.3, low: 119.7, high: 60.3, very_high: 29.7 },
      K: { very_low: 567.8, low: 452.2, high: 227.8, very_high: 112.2 },
    },
  },
  year_6: {
    rdfPerPlant: { N: 438, P: 108, K: 408 },
    soilClasses: {
      N: { very_low: 731.46, low: 582.54, high: 293.46, very_high: 144.54 },
      P: { very_low: 180.36, low: 143.64, high: 72.36, very_high: 36.36 },
      K: { very_low: 681.36, low: 542.64, high: 273.36, very_high: 134.64 },
    },
  },
  year_7: {
    rdfPerPlant: { N: 511, P: 126, K: 476 },
    soilClasses: {
      N: { very_low: 853.37, low: 679.63, high: 342.37, very_high: 168.63 },
      P: { very_low: 210.42, low: 167.58, high: 84.42, very_high: 41.58 },
      K: { very_low: 794.92, low: 633.08, high: 318.92, very_high: 157.08 },
    },
  },
  year_8: {
    rdfPerPlant: { N: 584, P: 144, K: 544 },
    soilClasses: {
      N: { very_low: 975.28, low: 776.72, high: 391.28, very_high: 192.72 },
      P: { very_low: 240.48, low: 191.52, high: 96.48, very_high: 47.52 },
      K: { very_low: 908.48, low: 723.52, high: 364.48, very_high: 179.52 },
    },
  },
  year_9: {
    rdfPerPlant: { N: 657, P: 162, K: 612 },
    soilClasses: {
      N: { very_low: 1097.19, low: 873.81, high: 440.19, very_high: 216.81 },
      P: { very_low: 270.54, low: 215.46, high: 108.54, very_high: 53.46 },
      K: { very_low: 1022.04, low: 813.96, high: 409.04, very_high: 201.96 },
    },
  },
  year_10_plus: {
    rdfPerPlant: { N: 730, P: 180, K: 680 },
    soilClasses: {
      N: { very_low: 1219.1, low: 970.9, high: 489.1, very_high: 240.9 },
      P: { very_low: 300.6, low: 239.4, high: 120.6, very_high: 59.4 },
      K: { very_low: 1135.6, low: 904.4, high: 455.6, very_high: 224.4 },
    },
  },
};

// Coconut – age-wise per-plant recommendations (g/plant), stored for later use.
type CoconutAgeKey = "year_1" | "year_2" | "year_3" | "year_4";

interface CoconutPerPlantFertility {
  rdfPerPlant: Record<NutrientKey, number>;
  soilClasses: Record<NutrientKey, SoilClassValues>;
}

export const COCONUT_AGE_GROUP_FERTILITY: Record<
  CoconutAgeKey,
  CoconutPerPlantFertility
> = {
  year_1: {
    rdfPerPlant: { N: 50, P: 40, K: 135 },
    soilClasses: {
      N: { very_low: 83.5, low: 66.5, high: 33.5, very_high: 16.5 },
      P: { very_low: 66.8, low: 53.2, high: 26.8, very_high: 13.2 },
      K: { very_low: 225.45, low: 179.55, high: 90.45, very_high: 44.55 },
    },
  },
  year_2: {
    rdfPerPlant: { N: 160, P: 120, K: 405 },
    soilClasses: {
      N: { very_low: 267.2, low: 212.8, high: 107.2, very_high: 52.8 },
      P: { very_low: 200.4, low: 159.6, high: 80.4, very_high: 39.6 },
      K: { very_low: 676.35, low: 538.65, high: 271.35, very_high: 133.65 },
    },
  },
  year_3: {
    rdfPerPlant: { N: 330, P: 240, K: 810 },
    soilClasses: {
      N: { very_low: 551.1, low: 438.9, high: 221.1, very_high: 108.9 },
      P: { very_low: 400.8, low: 319.2, high: 160.8, very_high: 79.2 },
      K: { very_low: 1352.7, low: 1077.3, high: 542.7, very_high: 267.3 },
    },
  },
  year_4: {
    rdfPerPlant: { N: 500, P: 320, K: 1200 },
    soilClasses: {
      N: { very_low: 835, low: 665, high: 335, very_high: 165 },
      P: { very_low: 534.4, low: 425.6, high: 214.4, very_high: 105.6 },
      K: { very_low: 2004, low: 1596, high: 804, very_high: 396 },
    },
  },
};

// Arecanut – per-plant recommendations for local and improved varieties.
type ArecanutVarietyKey = "local" | "improved";

interface ArecanutPerPlantFertility {
  rdfPerPlant: Record<NutrientKey, number>;
  soilClasses: Record<NutrientKey, SoilClassValues>;
}

export const ARECANUT_VARIETY_FERTILITY: Record<
  ArecanutVarietyKey,
  ArecanutPerPlantFertility
> =
{
  local: {
    rdfPerPlant: { N: 100, P: 40, K: 140 },
    soilClasses: {
      N: { very_low: 167, low: 133, high: 67, very_high: 33 },
      P: { very_low: 66.8, low: 53.2, high: 26.8, very_high: 13.2 },
      K: { very_low: 233.8, low: 186.2, high: 93.8, very_high: 46.2 },
    },
  },
  improved: {
    rdfPerPlant: { N: 150, P: 60, K: 210 },
    soilClasses: {
      N: { very_low: 250.5, low: 199.5, high: 100.5, very_high: 49.5 },
      P: { very_low: 100.2, low: 79.8, high: 40.2, very_high: 19.8 },
      K: { very_low: 350.7, low: 279.3, high: 140.7, very_high: 69.3 },
    },
  },
};

export const ALL_CROPS: CategorizedCrop[] = [
  ...CEREALS_CROPS,
  ...PULSES_CROPS,
  ...OILSEEDS_CROPS,
  ...COMMERCIAL_CROPS,
  ...VEGETABLE_CROPS,
  // Fruit crops (selection is by crop; age-wise RDF will be handled later via modal)
  {
    id: "banana_g9",
    name: "Banana (G9)",
    name_kn: "ಬಾಳೆ (G9)",
    icon: "🍌",
    categoryId: "fruits",
    cerealsFertility: {
      rdf: { perHa: { N: 540, P: 325, K: 675 } },
      soilClasses: {
        N: { very_low: 901.8, low: 718.2, high: 361.8, very_high: 178.2 },
        P: { very_low: 542.75, low: 432.25, high: 217.75, very_high: 107.25 },
        K: { very_low: 1127.25, low: 897.75, high: 452.25, very_high: 222.75 },
      },
    },
  },
  {
    id: "banana_elakki",
    name: "Banana (Elakki)",
    name_kn: "ಬಾಳೆ (ಎಳಕ್ಕಿ)",
    icon: "🍌",
    categoryId: "fruits",
    cerealsFertility: {
      rdf: { perHa: { N: 400, P: 240, K: 500 } },
      soilClasses: {
        N: { very_low: 668, low: 532, high: 268, very_high: 132 },
        P: { very_low: 400.8, low: 319.2, high: 160.8, very_high: 79.2 },
        K: { very_low: 835, low: 665, high: 335, very_high: 165 },
      },
    },
  },
  {
    id: "papaya",
    name: "Papaya",
    name_kn: "ಪಪ್ಪಾಯಿ",
    icon: "🍈",
    categoryId: "fruits",
    cerealsFertility: {
      rdf: { perHa: { N: 434, P: 434, K: 868 } },
      soilClasses: {
        N: { very_low: 724.78, low: 577.22, high: 290.78, very_high: 143.22 },
        P: { very_low: 724.78, low: 577.22, high: 290.78, very_high: 143.22 },
        K: { very_low: 1449.56, low: 1154.44, high: 581.56, very_high: 286.44 },
      },
    },
  },
  {
    id: "pomegranate",
    name: "Pomegranate",
    name_kn: "ದಾಳಿಂಬೆ",
    icon: "🍎",
    categoryId: "fruits",
    cerealsFertility: {
      rdf: { perHa: { N: 197, P: 99, K: 99 } },
      soilClasses: {
        N: { very_low: 328.99, low: 262.01, high: 131.99, very_high: 65.01 },
        P: { very_low: 165.33, low: 131.67, high: 66.33, very_high: 32.67 },
        K: { very_low: 165.33, low: 131.67, high: 66.33, very_high: 32.67 },
      },
    },
  },
  {
    id: "lemon",
    name: "Lemon",
    name_kn: "ನಿಂಬೆ",
    icon: "🍋",
    categoryId: "fruits",
    hasAgeGroups: true,
  },
  {
    id: "sapota",
    name: "Sapota",
    name_kn: "ಸಪೋಟಾ",
    icon: "🥝",
    categoryId: "fruits",
    hasAgeGroups: true,
  },
  {
    id: "guava",
    name: "Guava",
    name_kn: "ಸೀಬೆಹಣ್ಣು",
    icon: "🍈",
    categoryId: "fruits",
    hasAgeGroups: true,
  },
  {
    id: "jackfruit",
    name: "Jack fruit",
    name_kn: "ಹಲಸಿನ ಹಣ್ಣು",
    icon: "🍈",
    categoryId: "fruits",
    hasAgeGroups: true,
  },
  {
    id: "cardamom",
    name: "Cardamom",
    name_kn: "ಏಲಕ್ಕಿ",
    icon: "🌿",
    categoryId: "fruits",
    hasAgeGroups: true,
  },
  {
    id: "mango",
    name: "Mango",
    name_kn: "ಮಾವು",
    icon: "🥭",
    categoryId: "mango",
    hasAgeGroups: true,
  },
  {
    id: "coconut",
    name: "Coconut",
    name_kn: "ತೆಂಗು",
    icon: "🥥",
    categoryId: "coconut",
    hasAgeGroups: true,
  },
  {
    id: "arecanut",
    name: "Arecanut",
    name_kn: "ಅಡಿಕೆ",
    icon: "🌴",
    categoryId: "arecanut",
    hasAgeGroups: true,
  },
  // Grapes, Cashew and Black Pepper – age/variety handled later via modal
  {
    id: "grapes",
    name: "Grapes",
    name_kn: "ದ್ರಾಕ್ಷಿ",
    icon: "🍇",
    categoryId: "grapes",
    hasAgeGroups: true,
  },
  {
    id: "cashew",
    name: "Cashew",
    name_kn: "ಗೋಡಂಬಿ",
    icon: "🌰",
    categoryId: "cashew_bp",
    hasAgeGroups: true,
  },
  {
    id: "black_pepper",
    name: "Black pepper",
    name_kn: "ಕರಿಮೆಣಸು",
    icon: "🌿",
    categoryId: "cashew_bp",
    hasAgeGroups: true,
  },
];

type AgeOption = { key: string; label: string };

const DEFAULT_AGE_OPTIONS: AgeOption[] = [
  { key: "below_3", label: "3 ವರ್ಷಕ್ಕಿಂತ ಕಡಿಮೆ / Below 3 years" },
  { key: "3_7", label: "3 - 7 ವರ್ಷ / 3 - 7 years" },
  { key: "above_7", label: "7 ವರ್ಷಕ್ಕಿಂತ ಹೆಚ್ಚು / Above 7 years" },
];

const AGE_OPTIONS_BY_CROP: Record<string, AgeOption[]> = {
  // Fruit crops with age groups (from table)
  lemon: [
    { key: "year_1", label: "1ನೇ ವರ್ಷ / 1st year" },
    { key: "year_2", label: "2ನೇ ವರ್ಷ / 2nd year" },
    { key: "year_3", label: "3ನೇ ವರ್ಷ / 3rd year" },
    { key: "year_4", label: "4ನೇ ವರ್ಷ / 4th year" },
    { key: "year_5_plus", label: "5 ವರ್ಷ ಮತ್ತು ಮೇಲು / 5 and above" },
  ],
  sapota: [
    { key: "year_1_3", label: "1 - 3 ವರ್ಷ / 1 - 3 years" },
    { key: "year_4_6", label: "4 - 6 ವರ್ಷ / 4 - 6 years" },
    { key: "year_7_10", label: "7 - 10 ವರ್ಷ / 7 - 10 years" },
    { key: "year_11_plus", label: ">11 ವರ್ಷ / >11 years" },
  ],
  guava: [
    { key: "year_1_3", label: "1 - 3 ವರ್ಷ / 1 - 3 years" },
    { key: "year_4_6", label: "4 - 6 ವರ್ಷ / 4 - 6 years" },
    { key: "year_7_10", label: "7 - 10 ವರ್ಷ / 7 - 10 years" },
    { key: "year_11_plus", label: ">11 ವರ್ಷ / >11 years" },
  ],
  jackfruit: [
    { key: "year_1_3", label: "1 - 3 ವರ್ಷ / 1 - 3 years" },
    { key: "year_4_6", label: "4 - 6 ವರ್ಷ / 4 - 6 years" },
    { key: "year_7_plus", label: ">7 ವರ್ಷ / >7 years" },
  ],
  cardamom: [
    { key: "year_1_2", label: "1 - 2 ವರ್ಷ / 1 - 2 years" },
    { key: "year_3_plus", label: ">3 ವರ್ಷ / >3 years" },
  ],
  // Mango – per year as in table
  mango: [
    { key: "year_1", label: "1st year" },
    { key: "year_2", label: "2nd year" },
    { key: "year_3", label: "3rd year" },
    { key: "year_4", label: "4th year" },
    { key: "year_5", label: "5th year" },
    { key: "year_6", label: "6th year" },
    { key: "year_7", label: "7th year" },
    { key: "year_8", label: "8th year" },
    { key: "year_9", label: "9th year" },
    { key: "year_10_plus", label: "10th year and above" },
  ],
  // Coconut – per year as in table
  coconut: [
    { key: "year_1", label: "1st year" },
    { key: "year_2", label: "2nd year" },
    { key: "year_3", label: "3rd year" },
    { key: "year_4", label: "4th year" },
  ],
  // Arecanut – varieties instead of age
  arecanut: [
    { key: "local", label: "ಸ್ಥಳೀಯ ಜಾತಿ / Local variety" },
    { key: "improved", label: "ಸುಧಾರಿತ ಜಾತಿ / Improved variety" },
  ],
  // Grapes varieties / age groups
  grapes: [
    {
      key: "anab_2_5",
      label: "Anab-e sahi (2-5 yrs old)",
    },
    {
      key: "anab_6_plus",
      label: "Anab-e sahi (>6 yrs old)",
    },
    {
      key: "thomson_2_plus",
      label: "Thomson seedless (>2 yrs)",
    },
    {
      key: "other_varieties",
      label: "Other varieties",
    },
  ],
  // Cashew age groups
  cashew: [
    { key: "year_1", label: "1st year" },
    { key: "year_2", label: "2nd year" },
    { key: "year_3", label: "3rd year" },
    { key: "year_4", label: "4th year" },
    { key: "year_5_plus", label: "5 and above" },
  ],
  // Black pepper age groups
  black_pepper: [
    { key: "year_1", label: "1st year" },
    { key: "year_2", label: "2nd year" },
    { key: "year_3", label: "3rd year" },
  ],
};

// Fruit crops: age-wise RDF/ha and soil-class-wise values (very_low, low, high, very_high)
// structured so that Land Area behaves exactly like cereals.
export const FRUIT_AGE_FERTILITY: Record<
  string,
  Record<string, CerealsFertilityData>
> = {
  lemon: {
    year_1: {
      rdf: { perHa: { N: 27.7, P: 16.6, K: 27.7 } },
      soilClasses: {
        N: { very_low: 46.259, low: 36.841, high: 18.559, very_high: 9.141 },
        P: { very_low: 27.722, low: 22.078, high: 11.129, very_high: 5.478 },
        K: { very_low: 46.259, low: 36.841, high: 18.559, very_high: 9.141 },
      },
    },
    year_2: {
      rdf: { perHa: { N: 55.4, P: 33.2, K: 55.4 } },
      soilClasses: {
        N: { very_low: 92.518, low: 73.682, high: 37.118, very_high: 18.282 },
        P: { very_low: 55.444, low: 44.156, high: 22.258, very_high: 10.956 },
        K: { very_low: 92.518, low: 73.682, high: 37.118, very_high: 18.282 },
      },
    },
    year_3: {
      rdf: { perHa: { N: 83.1, P: 49.8, K: 83.1 } },
      soilClasses: {
        N: { very_low: 138.777, low: 110.523, high: 55.677, very_high: 27.423 },
        P: { very_low: 83.166, low: 66.234, high: 33.567, very_high: 16.434 },
        K: { very_low: 138.777, low: 110.523, high: 55.677, very_high: 27.423 },
      },
    },
    year_4: {
      rdf: { perHa: { N: 110.8, P: 66.5, K: 110.8 } },
      soilClasses: {
        N: { very_low: 185.036, low: 147.364, high: 74.235, very_high: 36.564 },
        P: { very_low: 111.055, low: 88.445, high: 44.755, very_high: 21.945 },
        K: { very_low: 185.036, low: 147.364, high: 74.235, very_high: 36.564 },
      },
    },
    year_5_plus: {
      rdf: { perHa: { N: 138.5, P: 83.1, K: 138.5 } },
      soilClasses: {
        N: { very_low: 231.295, low: 184.205, high: 92.795, very_high: 45.705 },
        P: { very_low: 138.777, low: 110.523, high: 55.677, very_high: 27.423 },
        K: { very_low: 231.295, low: 184.205, high: 92.795, very_high: 45.705 },
      },
    },
  },
  sapota: {
    year_1_3: {
      rdf: { perHa: { N: 5, P: 2, K: 7.5 } },
      soilClasses: {
        N: { very_low: 8.35, low: 6.65, high: 3.35, very_high: 1.65 },
        P: { very_low: 3.34, low: 2.66, high: 1.34, very_high: 0.66 },
        K: { very_low: 12.525, low: 9.975, high: 5.025, very_high: 2.475 },
      },
    },
    year_4_6: {
      rdf: { perHa: { N: 10, P: 4, K: 15 } },
      soilClasses: {
        N: { very_low: 16.7, low: 13.3, high: 6.7, very_high: 3.3 },
        P: { very_low: 6.68, low: 5.32, high: 2.68, very_high: 1.32 },
        K: { very_low: 25.05, low: 19.95, high: 10.05, very_high: 4.95 },
      },
    },
    year_7_10: {
      rdf: { perHa: { N: 15, P: 6, K: 22.5 } },
      soilClasses: {
        N: { very_low: 25.05, low: 19.95, high: 10.05, very_high: 4.95 },
        P: { very_low: 10.02, low: 7.98, high: 4.02, very_high: 1.98 },
        K: { very_low: 37.575, low: 29.925, high: 15.075, very_high: 7.425 },
      },
    },
    year_11_plus: {
      rdf: { perHa: { N: 16, P: 6, K: 45 } },
      soilClasses: {
        N: { very_low: 26.72, low: 21.28, high: 10.72, very_high: 5.28 },
        P: { very_low: 10.02, low: 7.98, high: 4.02, very_high: 1.98 },
        K: { very_low: 75.15, low: 59.85, high: 30.15, very_high: 14.85 },
      },
    },
  },
  guava: {
    year_1_3: {
      rdf: { perHa: { N: 14, P: 7, K: 21 } },
      soilClasses: {
        N: { very_low: 23.38, low: 18.62, high: 9.38, very_high: 4.62 },
        P: { very_low: 11.69, low: 9.31, high: 4.69, very_high: 2.31 },
        K: { very_low: 35.07, low: 27.93, high: 14.07, very_high: 6.93 },
      },
    },
    year_4_6: {
      rdf: { perHa: { N: 28, P: 11, K: 21 } },
      soilClasses: {
        N: { very_low: 46.76, low: 37.24, high: 18.76, very_high: 9.24 },
        P: { very_low: 18.37, low: 14.63, high: 7.37, very_high: 3.63 },
        K: { very_low: 35.07, low: 27.93, high: 14.07, very_high: 6.93 },
      },
    },
    year_7_10: {
      rdf: { perHa: { N: 55, P: 22, K: 42 } },
      soilClasses: {
        N: { very_low: 91.85, low: 73.15, high: 36.85, very_high: 18.15 },
        P: { very_low: 36.74, low: 29.26, high: 14.74, very_high: 7.26 },
        K: { very_low: 70.14, low: 56.46, high: 28.16, very_high: 13.86 },
      },
    },
    year_11_plus: {
      rdf: { perHa: { N: 83, P: 33, K: 83 } },
      soilClasses: {
        N: { very_low: 138.61, low: 110.39, high: 55.61, very_high: 27.39 },
        P: { very_low: 55.11, low: 43.89, high: 22.11, very_high: 10.89 },
        K: { very_low: 138.61, low: 110.39, high: 55.61, very_high: 27.39 },
      },
    },
  },
  jackfruit: {
    year_1_3: {
      rdf: { perHa: { N: 20, P: 12, K: 6 } },
      soilClasses: {
        N: { very_low: 33.4, low: 26.6, high: 13.4, very_high: 6.6 },
        P: { very_low: 20.04, low: 15.96, high: 8.04, very_high: 3.96 },
        K: { very_low: 10.02, low: 7.98, high: 4.02, very_high: 1.98 },
      },
    },
    year_4_6: {
      rdf: { perHa: { N: 40, P: 22, K: 12 } },
      soilClasses: {
        N: { very_low: 66.8, low: 53.2, high: 26.8, very_high: 13.2 },
        P: { very_low: 40.08, low: 31.92, high: 16.08, very_high: 7.92 },
        K: { very_low: 20.04, low: 15.96, high: 8.04, very_high: 3.96 },
      },
    },
    year_7_plus: {
      rdf: { perHa: { N: 60, P: 30, K: 18 } },
      soilClasses: {
        N: { very_low: 100.2, low: 79.8, high: 40.2, very_high: 19.8 },
        P: { very_low: 50.1, low: 39.9, high: 20.1, very_high: 9.9 },
        K: { very_low: 30.06, low: 23.94, high: 12.06, very_high: 5.94 },
      },
    },
  },
  cardamom: {
    year_1_2: {
      rdf: { perHa: { N: 40, P: 40, K: 80 } },
      soilClasses: {
        N: { very_low: 66.8, low: 53.2, high: 26.8, very_high: 13.2 },
        P: { very_low: 66.8, low: 53.2, high: 26.8, very_high: 13.2 },
        K: { very_low: 133.6, low: 106.4, high: 53.6, very_high: 26.4 },
      },
    },
    year_3_plus: {
      rdf: { perHa: { N: 75, P: 75, K: 150 } },
      soilClasses: {
        N: { very_low: 125.25, low: 99.75, high: 50.25, very_high: 24.75 },
        P: { very_low: 125.25, low: 99.75, high: 50.25, very_high: 24.75 },
        K: { very_low: 250.5, low: 199.5, high: 100.5, very_high: 49.5 },
      },
    },
  },
};

// Per-plant fertility (g/plant + soil classes) for Grapes, Cashew, Black pepper.
export const PER_PLANT_SPECIAL_FERTILITY: Record<
  "grapes" | "cashew" | "black_pepper",
  Record<
    string,
    {
      rdfPerPlant: Record<NutrientKey, number>;
      soilClasses: Record<NutrientKey, SoilClassValues>;
    }
  >
> = {
  grapes: {
    anab_2_5: {
      rdfPerPlant: { N: 500, P: 200, K: 750 },
      soilClasses: {
        N: { very_low: 835, low: 665, high: 335, very_high: 165 },
        P: { very_low: 334, low: 266, high: 134, very_high: 66 },
        K: { very_low: 1252.5, low: 997.5, high: 502.5, very_high: 247.5 },
      },
    },
    anab_6_plus: {
      rdfPerPlant: { N: 1000, P: 500, K: 1000 },
      soilClasses: {
        N: { very_low: 1670, low: 1330, high: 670, very_high: 330 },
        P: { very_low: 835, low: 665, high: 335, very_high: 165 },
        K: { very_low: 1670, low: 1330, high: 670, very_high: 330 },
      },
    },
    thomson_2_plus: {
      rdfPerPlant: { N: 300, P: 500, K: 1000 },
      soilClasses: {
        N: { very_low: 501, low: 399, high: 201, very_high: 99 },
        P: { very_low: 835, low: 665, high: 335, very_high: 165 },
        K: { very_low: 1670, low: 1330, high: 670, very_high: 330 },
      },
    },
    other_varieties: {
      rdfPerPlant: { N: 1000, P: 480, K: 1500 },
      soilClasses: {
        N: { very_low: 1670, low: 1330, high: 670, very_high: 330 },
        P: { very_low: 801.6, low: 638.4, high: 321.6, very_high: 158.4 },
        K: { very_low: 2505, low: 1995, high: 1005, very_high: 495 },
      },
    },
  },
  cashew: {
    year_1: {
      rdfPerPlant: { N: 60, P: 60, K: 60 },
      soilClasses: {
        N: { very_low: 100.2, low: 79.8, high: 40.2, very_high: 19.8 },
        P: { very_low: 100.2, low: 79.8, high: 40.2, very_high: 19.8 },
        K: { very_low: 100.2, low: 79.8, high: 40.2, very_high: 19.8 },
      },
    },
    year_2: {
      rdfPerPlant: { N: 125, P: 125, K: 125 },
      soilClasses: {
        N: { very_low: 208.75, low: 166.25, high: 83.75, very_high: 41.25 },
        P: { very_low: 208.75, low: 166.25, high: 83.75, very_high: 41.25 },
        K: { very_low: 208.75, low: 166.25, high: 83.75, very_high: 41.25 },
      },
    },
    year_3: {
      rdfPerPlant: { N: 250, P: 125, K: 125 },
      soilClasses: {
        N: { very_low: 417.5, low: 332.5, high: 167.5, very_high: 82.5 },
        P: { very_low: 208.75, low: 166.25, high: 83.75, very_high: 41.25 },
        K: { very_low: 208.75, low: 166.25, high: 83.75, very_high: 41.25 },
      },
    },
    year_4: {
      rdfPerPlant: { N: 500, P: 125, K: 125 },
      soilClasses: {
        N: { very_low: 835, low: 665, high: 335, very_high: 165 },
        P: { very_low: 208.75, low: 166.25, high: 83.75, very_high: 41.25 },
        K: { very_low: 208.75, low: 166.25, high: 83.75, very_high: 41.25 },
      },
    },
    year_5_plus: {
      rdfPerPlant: { N: 500, P: 250, K: 250 },
      soilClasses: {
        N: { very_low: 835, low: 665, high: 335, very_high: 165 },
        P: { very_low: 417.5, low: 332.5, high: 167.5, very_high: 82.5 },
        K: { very_low: 417.5, low: 332.5, high: 167.5, very_high: 82.5 },
      },
    },
  },
  black_pepper: {
    year_1: {
      rdfPerPlant: { N: 33, P: 13, K: 47 },
      soilClasses: {
        N: { very_low: 55.11, low: 43.89, high: 22.11, very_high: 10.89 },
        P: { very_low: 21.71, low: 17.29, high: 8.71, very_high: 4.29 },
        K: { very_low: 78.49, low: 62.51, high: 31.49, very_high: 15.51 },
      },
    },
    year_2: {
      rdfPerPlant: { N: 67, P: 60, K: 93 },
      soilClasses: {
        N: { very_low: 111.89, low: 89.11, high: 44.89, very_high: 22.11 },
        P: { very_low: 100.2, low: 79.8, high: 40.2, very_high: 19.8 },
        K: { very_low: 155.31, low: 123.69, high: 62.31, very_high: 30.69 },
      },
    },
    year_3: {
      rdfPerPlant: { N: 100, P: 40, K: 140 },
      soilClasses: {
        N: { very_low: 167, low: 133, high: 67, very_high: 33 },
        P: { very_low: 66.8, low: 53.2, high: 26.8, very_high: 13.2 },
        K: { very_low: 233.8, low: 186.2, high: 93.8, very_high: 46.2 },
      },
    },
  },
};

export default function CropsScreen() {
  const router = useRouter();
  const { imageId, npk } = useLocalSearchParams<{ imageId?: string; npk?: string }>();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("cereals");
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [ageSelections, setAgeSelections] = useState<
    Record<string, { key: string; label: string }>
  >({});
  const [ageModalCropId, setAgeModalCropId] = useState<string | null>(null);
  const [ageModalVisible, setAgeModalVisible] = useState(false);
  const categoryListRef = useRef<FlatList<CropCategory> | null>(null);

  useEffect(() => {
    speakKn(
      "ಎಡಕ್ಕೆ ಅಥವಾ ಬಲಕ್ಕೆ ಸ್ಕ್ರೋಲ್ ಮಾಡಿ ಬೆಳೆ ವರ್ಗವನ್ನು ಆಯ್ಕೆಮಾಡಿ. ನಂತರ ನಿಮ್ಮ ಬೆಳೆ ಹೆಸರನ್ನು ಟ್ಯಾಪ್ ಮಾಡಿ."
    );
  }, []);

  const openAgeModal = (cropId: string) => {
    setAgeModalCropId(cropId);
    setAgeModalVisible(true);
  };

  const closeAgeModal = () => {
    setAgeModalVisible(false);
  };

  const handleSelectCrop = (crop: CategorizedCrop) => {
    if (crop.hasAgeGroups) {
      const existingAge = ageSelections[crop.id];
      if (existingAge) {
        setSelectedCrop(crop.id);
        speakKn(`${crop.name_kn} - ${existingAge.label}`);
      } else {
        openAgeModal(crop.id);
      }
    } else {
      setSelectedCrop(crop.id);
      speakKn(crop.name_kn);
    }
  };

  const handleAgeSelect = (option: AgeOption) => {
    if (!ageModalCropId) return;
    const crop = ALL_CROPS.find((c) => c.id === ageModalCropId);
    setAgeSelections((prev) => ({
      ...prev,
      [ageModalCropId]: { key: option.key, label: option.label },
    }));
    setSelectedCrop(ageModalCropId);
    if (crop) {
      speakKn(`${crop.name_kn} - ${option.label}`);
    }
    setAgeModalVisible(false);
  };

  const handleContinue = () => {
    if (selectedCrop) {
      const age = ageSelections[selectedCrop];
      const perPlantModeCropIds = new Set([
        "grapes",
        "cashew",
        "black_pepper",
        "mango",
        "coconut",
        "arecanut",
      ]);
      const targetPath =
        perPlantModeCropIds.has(selectedCrop) || age?.key
          ? perPlantModeCropIds.has(selectedCrop)
            ? "/plants"
            : "/area"
          : "/area";
      router.push({
        pathname: targetPath,
        params: {
          cropId: selectedCrop,
          npk: npk || "",
          ageLabel: age?.label ?? "",
          ageKey: age?.key ?? "",
        },
      });
    }
  };

  const cropsForSelectedCategory = ALL_CROPS.filter(
    (crop) => crop.categoryId === selectedCategoryId
  );

  const renderCropItem = ({ item }: { item: CategorizedCrop }) => {
    const age = ageSelections[item.id];
    return (
      <TouchableOpacity
        style={[
          styles.cropItem,
          selectedCrop === item.id && styles.cropItemSelected,
        ]}
        onPress={() => handleSelectCrop(item)}
      >
        <Text style={styles.cropIcon}>{item.icon}</Text>
        <View style={styles.cropTextContainer}>
          <Text style={styles.cropName}>{item.name_kn}</Text>
          <Text style={styles.cropNameEn}>{item.name}</Text>
          {item.hasAgeGroups && age && (
            <View style={styles.ageRow}>
              <Text style={styles.ageText}>{age.label}</Text>
              <TouchableOpacity
                style={styles.ageEditChip}
                onPress={() => openAgeModal(item.id)}
              >
                <Text style={styles.ageEditChipText}>Edit</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        {selectedCrop === item.id && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.categoryRow}>
        <View style={styles.categoryArrowContainer}>
          <Text style={styles.categoryArrow}>‹</Text>
        </View>
        <FlatList
          ref={categoryListRef}
          data={CROP_CATEGORIES}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => {
            const isSelected = item.id === selectedCategoryId;
            return (
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  isSelected && styles.categoryChipSelected,
                ]}
                onPress={() => {
                  setSelectedCategoryId(item.id);
                  setSelectedCrop(null);
                }}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && styles.categoryChipTextSelected,
                  ]}
                >
                  {item.title_kn}
                </Text>
                <Text
                  style={[
                    styles.categoryChipTextEn,
                    isSelected && styles.categoryChipTextSelected,
                  ]}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
        <View style={styles.categoryArrowContainer}>
          <Text style={styles.categoryArrow}>›</Text>
        </View>
      </View>

      <FlatList
        data={cropsForSelectedCategory}
        renderItem={renderCropItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.cropList}
      />

      {ageModalCropId && (
        <Modal
          animationType="slide"
          transparent
          visible={ageModalVisible}
          onRequestClose={closeAgeModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {(() => {
                const crop = ALL_CROPS.find((c) => c.id === ageModalCropId);
                const options =
                  (crop && AGE_OPTIONS_BY_CROP[crop.id]) || DEFAULT_AGE_OPTIONS;
                const currentAge = ageSelections[ageModalCropId];
                return (
                  <>
                    <Text style={styles.modalTitle}>
                      {crop?.name_kn} - ವಯೋ ಗುಂಪು
                    </Text>
                    <Text style={styles.modalTitleEn}>
                      {crop?.name} - Select age / variety
                    </Text>
                    <View style={styles.modalOptionsContainer}>
                      {options.map((opt) => {
                        const isSelected = currentAge?.key === opt.key;
                        return (
                          <TouchableOpacity
                            key={opt.key}
                            style={[
                              styles.modalOptionChip,
                              isSelected && styles.modalOptionChipSelected,
                            ]}
                            onPress={() => handleAgeSelect(opt)}
                          >
                            <Text
                              style={[
                                styles.modalOptionText,
                                isSelected && styles.modalOptionTextSelected,
                              ]}
                            >
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <TouchableOpacity
                      style={styles.modalCancelButton}
                      onPress={closeAgeModal}
                    >
                      <Text style={styles.modalCancelButtonText}>
                        ಮುಚ್ಚಿ / Close
                      </Text>
                    </TouchableOpacity>
                  </>
                );
              })()}
            </View>
          </View>
        </Modal>
      )}

      {selectedCrop && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <View>
              <Text style={styles.continueButtonText}>ಮುಂದುವರಿಸಿ →</Text>
              <Text style={styles.continueButtonTextEn}>Continue →</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E8",
  },
  categoryArrowContainer: {
    width: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryArrow: {
    fontSize: 14,
    color: "#2E7D32",
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    marginHorizontal: 4,
  },
  categoryChipSelected: {
    backgroundColor: "#1B5E20",
  },
  categoryChipText: {
    fontSize: 13,
    color: "#333",
    textAlign: "center",
    fontWeight: "500",
  },
  categoryChipTextEn: {
    fontSize: 10,
    color: "#888",
    textAlign: "center",
    marginTop: 1,
  },
  categoryChipTextSelected: {
    color: "#fff",
  },
  cropList: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 16,
  },
  cropItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginVertical: 4,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  cropItemSelected: {
    borderColor: "#1B5E20",
    backgroundColor: "#E8F5E9",
  },
  cropIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  cropTextContainer: {
    flex: 1,
  },
  ageRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  ageText: {
    fontSize: 11,
    color: "#1B5E20",
    marginRight: 8,
  },
  ageEditChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1B5E20",
    backgroundColor: "#E8F5E9",
  },
  ageEditChipText: {
    fontSize: 10,
    color: "#1B5E20",
    fontWeight: "500",
  },
  cropName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  cropNameEn: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#1B5E20",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  checkmarkText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1B5E20",
  },
  modalTitleEn: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
    marginBottom: 12,
  },
  modalOptionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  modalOptionChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#C8E6C9",
    backgroundColor: "#F9FFF9",
    marginRight: 6,
    marginBottom: 6,
  },
  modalOptionChipSelected: {
    borderColor: "#1B5E20",
    backgroundColor: "#E8F5E9",
  },
  modalOptionText: {
    fontSize: 12,
    color: "#333",
  },
  modalOptionTextSelected: {
    color: "#1B5E20",
    fontWeight: "600",
  },
  modalCancelButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  modalCancelButtonText: {
    fontSize: 13,
    color: "#1B5E20",
    fontWeight: "600",
  },
  footer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E8E8E8",
  },
  continueButton: {
    backgroundColor: "#1B5E20",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#1B5E20",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
    textAlign: "center",
  },
  continueButtonTextEn: {
    color: "#A5D6A7",
    fontSize: 12,
    marginTop: 2,
    textAlign: "center",
  },
});

