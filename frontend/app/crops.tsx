import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Speech from "expo-speech";
import { getCrops } from "../services/api";
import type { Crop } from "../types";

export default function CropsScreen() {
  const router = useRouter();
  const { imageId } = useLocalSearchParams<{ imageId?: string }>();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);

  useEffect(() => {
    loadCrops();
  }, []);

  const loadCrops = async () => {
    try {
      const response = await getCrops();
      setCrops(response.crops);
    } catch (error) {
      console.error("Failed to load crops:", error);
      // Use fallback crops if API fails
      setCrops([
        { id: "rice", name: "Rice", name_kn: "ಭತ್ತ", icon: "🌾" },
        { id: "ragi", name: "Finger Millet", name_kn: "ರಾಗಿ", icon: "🌾" },
        { id: "maize", name: "Maize", name_kn: "ಮೆಕ್ಕೆಜೋಳ", icon: "🌽" },
        { id: "tomato", name: "Tomato", name_kn: "ಟೊಮೆಟೊ", icon: "🍅" },
        { id: "onion", name: "Onion", name_kn: "ಈರುಳ್ಳಿ", icon: "🧅" },
        { id: "groundnut", name: "Groundnut", name_kn: "ಕಡಲೆಕಾಯಿ", icon: "🥜" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCrop = (crop: Crop) => {
    setSelectedCrop(crop.id);
    Speech.speak(crop.name_kn, { language: "kn-IN" });
  };

  const handleContinue = () => {
    if (selectedCrop) {
      router.push({
        pathname: "/recommendation",
        params: {
          cropId: selectedCrop,
          imageId: imageId || "",
        },
      });
    }
  };

  const renderCropItem = ({ item }: { item: Crop }) => (
    <TouchableOpacity
      style={[
        styles.cropCard,
        selectedCrop === item.id && styles.cropCardSelected,
      ]}
      onPress={() => handleSelectCrop(item)}
    >
      <Text style={styles.cropIcon}>{item.icon}</Text>
      <Text style={styles.cropName}>{item.name_kn}</Text>
      <Text style={styles.cropNameEn}>{item.name}</Text>
      {selectedCrop === item.id && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1B5E20" />
        <View>
          <Text style={styles.loadingText}>ಬೆಳೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...</Text>
          <Text style={styles.loadingTextEn}>Loading crops...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ನಿಮ್ಮ ಬೆಳೆ ಆಯ್ಕೆಮಾಡಿ</Text>
        <Text style={styles.subtitle}>Select your crop</Text>
      </View>

      <FlatList
        data={crops}
        renderItem={renderCropItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.cropGrid}
        columnWrapperStyle={styles.cropRow}
      />

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
    textAlign: "center",
  },
  loadingTextEn: {
    marginTop: 4,
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
  header: {
    padding: 20,
    alignItems: "center",
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
  cropGrid: {
    padding: 10,
  },
  cropRow: {
    justifyContent: "space-around",
  },
  cropCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    margin: 8,
    width: "44%",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    borderWidth: 2,
    borderColor: "transparent",
  },
  cropCardSelected: {
    borderColor: "#1B5E20",
    backgroundColor: "#E8F5E9",
  },
  cropIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  cropName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  cropNameEn: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  checkmark: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#1B5E20",
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  footer: {
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  continueButton: {
    backgroundColor: "#1B5E20",
    borderRadius: 15,
    padding: 18,
    alignItems: "center",
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  continueButtonTextEn: {
    color: "#A5D6A7",
    fontSize: 12,
    marginTop: 2,
  },
});

