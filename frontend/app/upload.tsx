import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { analyzeImageDirect } from "../services/api";
import { speakKn, stopVoice } from "../utils/voice";
import { addToHistory, deleteFromHistory, loadHistory } from "../utils/historyStorage";

export default function UploadScreen() {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStage, setLoadingStage] = useState<number>(0);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [imageId, setImageId] = useState<string | null>(null);
  const [npkStatus, setNpkStatus] = useState<{
    N: "very_low" | "low" | "medium" | "high" | "very_high";
    P: "very_low" | "low" | "medium" | "high" | "very_high";
    K: "very_low" | "low" | "medium" | "high" | "very_high";
  } | null>(null);

  // Status editing state
  const [editingNutrientIndex, setEditingNutrientIndex] = useState<number | null>(null);
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);

  // History state
  const [history, setHistory] = useState<any[]>([]);
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);

  useEffect(() => {
    console.log("[UploadScreen] Mounted");
    loadHistoryData();
    speakKn(
      "ಭೂ ಸಂಪನ್ಮೂಲ ಸಮೀಕ್ಷೆ ಕಾರ್ಡಿನ ಫೋಟೋ ತೆಗೆದು ಅಥವಾ ಗ್ಯಾಲರಿಯಿಂದ ಆಯ್ಕೆಮಾಡಿ ಮತ್ತು ನಂತರ ವಿಶ್ಲೇಷಣೆ ಬಟನ್ ಒತ್ತಿ. ಒಂದು ವೇಳೆ ನೀವು ಈಗಾಗಲೇ ವರದಿಯನ್ನು ಪಡೆದಿದ್ದರೆ, ಹಳೆಯ ವರದಿ ಬಟನ್ ಮೂಲಕ ಅದನ್ನು ಆಯ್ಕೆ ಮಾಡಬಹುದು."
    );
    return () => {
      console.log("[UploadScreen] Unmounted");
      stopVoice();
    };
  }, []);

  const loadHistoryData = async () => {
    const data = await loadHistory();
    setHistory(data);
  };

  const saveToHistory = async (result: any, npk: any) => {
    const newEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      result,
      npk,
    };
    const updated = await addToHistory(newEntry);
    setHistory(updated);
  };

  const deleteHistoryItem = async (id: string) => {
    Alert.alert(
      "ಸ್ಥಿರೀಕರಿಸಿ / Confirm Delete",
      "ಈ ವರದಿಯನ್ನು ಇತಿಹಾಸದಿಂದ ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ?\nAre you sure you want to delete this report from history?",
      [
        {
          text: "ರದ್ದು / Cancel",
          style: "cancel"
        },
        {
          text: "ಅಳಿಸಿ / Delete",
          style: "destructive",
          onPress: async () => {
            const updated = await deleteFromHistory(id);
            setHistory(updated);
          }
        }
      ]
    );
  };

  const selectFromHistory = (item: any) => {
    setAnalysisResult(item.result);
    setNpkStatus(item.npk);
    setSelectedImage(null); // Clear image as we are using historical values
    setIsHistoryModalVisible(false);
    Alert.alert("ಯಶಸ್ವಿ / Success", "ಹಳೆಯ ವರದಿಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಲೋಡ್ ಮಾಡಲಾಗಿದೆ\nPrevious report loaded successfully");
  };

  useEffect(() => {
    console.log("[UploadScreen] selectedImage changed", { selectedImage });
  }, [selectedImage]);

  useEffect(() => {
    console.log("[UploadScreen] analysisResult changed", {
      hasResult: !!analysisResult,
      nutrientCount: analysisResult?.nutrient_status?.length,
      imageId,
    });
  }, [analysisResult, imageId]);

  const pickImage = async () => {
    console.log("[UploadScreen] pickImage called - opening gallery picker");
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });
      console.log("[UploadScreen] ImagePicker result", result);

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        console.log("[UploadScreen] Gallery image selected", {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          fileSize: (asset as any).fileSize,
        });
        setSelectedImage(asset.uri);
        setAnalysisResult(null);
      } else {
        console.log("[UploadScreen] Gallery picker canceled or no asset", {
          canceled: result.canceled,
        });
      }
    } catch (error) {
      console.error("[UploadScreen] Error in pickImage:", error);
      Alert.alert(
        "ದೋಷ / Error",
        "ಗ್ಯಾಲರಿಯಿಂದ ಚಿತ್ರ ಆಯ್ಕೆ ಮಾಡುವಾಗ ದೋಷ ಉಂಟಾಯಿತು\nThere was an error selecting an image from the gallery.",
        [{ text: "ಸರಿ / OK" }]
      );
    }
  };

  const takePhoto = async () => {
    console.log("[UploadScreen] takePhoto pressed");
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log("[UploadScreen] Camera permission status:", status);

      if (status !== "granted") {
        Alert.alert(
          "ಅನುಮತಿ ಅಗತ್ಯವಿದೆ / Permission Required",
          "ಕ್ಯಾಮೆರಾ ಬಳಸಲು ಅನುಮತಿ ನೀಡಿ\nGrant permission to use camera",
          [{ text: "ಸರಿ / OK" }]
        );
        console.log("[UploadScreen] Camera permission denied");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false, // no crop UI
        quality: 0.8,
      });
      console.log("[UploadScreen] Camera result", result);

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        console.log("[UploadScreen] Camera photo selected", {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          fileSize: (asset as any).fileSize,
        });
        setSelectedImage(asset.uri);
        setAnalysisResult(null);
      } else {
        console.log("[UploadScreen] Camera canceled or no asset", {
          canceled: result.canceled,
        });
      }
    } catch (error) {
      console.error("[UploadScreen] Error in takePhoto:", error);
      Alert.alert(
        "ದೋಷ / Error",
        "ಕ್ಯಾಮೆರಾದಿಂದ ಚಿತ್ರ ಹಿಡಿಯುವಾಗ ದೋಷ ಉಂಟಾಯಿತು\nThere was an error capturing an image from the camera.",
        [{ text: "ಸರಿ / OK" }]
      );
    }
  };

  const handleUpload = async () => {
    console.log("[UploadScreen] handleUpload pressed");
    if (!selectedImage) return;

    console.log("[UploadScreen] Starting upload/analysis", { uri: selectedImage });
    setIsUploading(true);
    setIsAnalyzing(true);
    setLoadingStage(1);

    const timer1 = setTimeout(() => setLoadingStage(2), 1800);
    const timer2 = setTimeout(() => setLoadingStage(3), 3800);
    try {
      // Direct analysis - no file storage needed (works with Hugging Face Spaces)
      const analysis = await analyzeImageDirect(selectedImage);
      console.log("[UploadScreen] Analysis result received", {
        imageId: analysis?.image_id,
        nutrientCount: analysis?.nutrient_status?.length,
      });
      const filteredNutrients = (analysis.nutrient_status || []).filter((n: any) => {
        const name = (n.nutrient || "").toLowerCase();
        return (
          name.includes("oc") ||
          name.includes("organic carbon") ||
          name.includes("nitrogen") ||
          name.includes("phosphorus") ||
          name.includes("p2o5") ||
          name.includes("potassium") ||
          name.includes("k2o") ||
          name.includes("k")
        );
      });

      setAnalysisResult({ ...analysis, nutrient_status: filteredNutrients });
      setImageId(analysis.image_id);

      // Derive N, P, K fertility classes from OCR status
      const baseStatus: {
        N: "very_low" | "low" | "medium" | "high" | "very_high";
        P: "very_low" | "low" | "medium" | "high" | "very_high";
        K: "very_low" | "low" | "medium" | "high" | "very_high";
      } = { N: "medium", P: "medium", K: "medium" };

      filteredNutrients.forEach((nutrient: any) => {
        const name = (nutrient.nutrient || "").toLowerCase();
        const statusKn: string = nutrient.status_kn || "";
        const level:
          | "very_low"
          | "low"
          | "medium"
          | "high"
          | "very_high" = statusKn.includes("ಅತಿ ಕಡಿಮೆ")
            ? "very_low"
            : statusKn.includes("ಕಡಿಮೆ")
              ? "low"
              : statusKn.includes("ಮಧ್ಯಮ")
                ? "medium"
                : statusKn.includes("ಅತಿ ಹೆಚ್ಚು")
                  ? "very_high"
                  : statusKn.includes("ಹೆಚ್ಚು")
                    ? "high"
                    : "medium";

        if (name.includes("nitrogen")) baseStatus.N = level;
        if (name.includes("phosphorus")) baseStatus.P = level;
        if (name.includes("potassium")) baseStatus.K = level;
      });
      setNpkStatus(baseStatus);
      saveToHistory({ ...analysis, nutrient_status: filteredNutrients }, baseStatus);

      // Speak Kannada summary covering only the 4 specified nutrients
      if (filteredNutrients.length > 0) {
        speakKn(
          "ವಿಶ್ಲೇಷಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ. ಮಣ್ಣಿನ ಫಲವತ್ತತೆ ಸ್ಥಿತಿಯನ್ನು ಕೇಳಿ."
        );

        // Read every filtered nutrient: "<Kannada-friendly name>: <Kannada status>"
        filteredNutrients.forEach((nutrient: any) => {
          const rawNameKn: string = nutrient.nutrient_kn || "";
          const statusKn: string = nutrient.status_kn || "";

          if (!rawNameKn || !statusKn) {
            return;
          }

          const base = rawNameKn.toLowerCase();
          let speakName = rawNameKn;

          // Fix tricky abbreviations so the Kannada TTS sounds natural
          if (base.includes("ec")) {
            // EC → “ವಿದ್ಯುತ್‌ ವಾಹಕತೆ, ಇ ಸಿ”
            speakName = "ವಿದ್ಯುತ್‌ ವಾಹಕತೆ, ಇ ಸಿ";
          } else if (base.includes("oc")) {
            // OC → “ಸಾವಯವ ಇಂಗಾಲ, ಓ ಸಿ”
            speakName = "ಸಾವಯವ ಇಂಗಾಲ, ಓ ಸಿ";
          } else if (base.includes("p2o5")) {
            // P₂O₅ → “ಲಭ್ಯ ರಂಜಕ, ಪಿ ಟು ಓ ಫೈವ್”
            speakName = "ಲಭ್ಯ ರಂಜಕ, ಪಿ ಟು ಓ ಫೈವ್";
          } else if (base.includes("k2o")) {
            // K₂O → “ಲಭ್ಯ ಪೊಟ್ಯಾಶ್, ಕೆ ಟು ಓ”
            speakName = "ಲಭ್ಯ ಪೊಟ್ಯಾಶ್, ಕೆ ಟು ಓ";
          } else if (base === "fe" || base.includes("fe ")) {
            // Fe → “ಲಭ್ಯ ಕಬ್ಬಿಣ, ಎಫ್ ಇ”
            speakName = "ಲಭ್ಯ ಕಬ್ಬಿಣ, ಎಫ್ ಇ";
          }

          speakKn(`${speakName}: ${statusKn}.`);
        });
      } else {
        speakKn("ವಿಶ್ಲೇಷಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ.");
      }
    } catch (error: any) {
      console.warn("[UploadScreen] Upload/Analysis error:", error?.message || error);
      // Log detailed error info quietly (no visible error to user)
      if (error.response) {
        console.warn("Response status:", error.response.status);
      } else if (error.request) {
        console.warn("No response received - network error");
      }
      // Non-blocking: just speak a brief Kannada message instead of showing an alert
      speakKn("ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.");
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsUploading(false);
      setIsAnalyzing(false);
      setLoadingStage(0);
    }
  };

  const goToRecommendations = () => {
    // Stop any ongoing speech from analysis summary before navigating
    stopVoice();
    router.push({
      pathname: "/crops",
      params: {
        imageId: imageId || "",
        npk: npkStatus ? JSON.stringify(npkStatus) : "",
      },
    });
  };

  const handleStatusSelect = (option: { kn: string; en: string; color: string }) => {
    if (editingNutrientIndex === null || !analysisResult) return;

    const updatedNutrients = [...analysisResult.nutrient_status];
    updatedNutrients[editingNutrientIndex] = {
      ...updatedNutrients[editingNutrientIndex],
      status: option.en,
      status_kn: option.kn,
      color: option.color,
    };

    const updatedResult = { ...analysisResult, nutrient_status: updatedNutrients };
    setAnalysisResult(updatedResult);

    // Also update npkStatus if it's N, P, or K
    const nutrientName = updatedNutrients[editingNutrientIndex].nutrient.toLowerCase();
    if (nutrientName.includes("nitrogen") || nutrientName.includes("phosphorus") || nutrientName.includes("potassium")) {
      const baseStatus = { ...npkStatus } as any;
      const statusKn = option.kn;
      const level = statusKn.includes("ಅತಿ ಕಡಿಮೆ")
        ? "very_low"
        : statusKn.includes("ಕಡಿಮೆ")
          ? "low"
          : statusKn.includes("ಮಧ್ಯಮ")
            ? "medium"
            : statusKn.includes("ಅತಿ ಹೆಚ್ಚು")
              ? "very_high"
              : statusKn.includes("ಹೆಚ್ಚು")
                ? "high"
                : "medium";

      if (nutrientName.includes("nitrogen")) baseStatus.N = level;
      if (nutrientName.includes("phosphorus")) baseStatus.P = level;
      if (nutrientName.includes("potassium")) baseStatus.K = level;
      setNpkStatus(baseStatus);
    }

    setIsStatusModalVisible(false);
    setEditingNutrientIndex(null);
  };

  const getStatusOptions = (nutrientName: string) => {
    const name = nutrientName.toLowerCase();
    if (name === "ph" || name.includes("ರಸಸಾರ")) {
      return [
        { kn: "ಆಮ್ಲೀಯ", en: "Acidic", color: "#F97316" },
        { kn: "ಸ್ವಲ್ಪ ಆಮ್ಲೀಯ", en: "Slightly Acidic", color: "#F59E0B" },
        { kn: "ತಟಸ್ಥ", en: "Neutral", color: "#10B981" },
        { kn: "ಸ್ವಲ್ಪ ಕ್ಷಾರೀಯ", en: "Slightly Alkaline", color: "#F59E0B" },
        { kn: "ಕ್ಷಾರೀಯ", en: "Alkaline", color: "#F97316" },
      ];
    } else if (name.includes("ec") || name.includes("ವಿದ್ಯುತ್")) {
      return [
        { kn: "ಸಾಮಾನ್ಯ", en: "Normal", color: "#10B981" },
        { kn: "ಲವಣ ರಹಿತ", en: "Salt Free", color: "#10B981" },
        { kn: "ಲವಣಯುಕ್ತ", en: "Saline", color: "#EF4444" },
      ];
    } else if (
      name.includes("zinc") || name.includes("boron") || name.includes("iron") || 
      name.includes("manganese") || name.includes("copper") ||
      name.includes("ಸತು") || name.includes("ಬೋರಾನ್") || name.includes("ಕಬ್ಬಿಣ") ||
      name.includes("ಮ್ಯಾಂಗನೀಸ್") || name.includes("ತಾಮ್ರ") || name.includes("ಕೊರತೆ") || name.includes("ಸಾಕಷ್ಟು")
    ) {
      return [
        { kn: "ಕೊರತೆ", en: "Deficient", color: "#EF4444" },
        { kn: "ಸಾಕಷ್ಟು", en: "Sufficient", color: "#10B981" },
      ];
    } else {
      return [
        { kn: "ಅತಿ ಕಡಿಮೆ", en: "Very Low", color: "#B91C1C" },
        { kn: "ಕಡಿಮೆ", en: "Low", color: "#EF4444" },
        { kn: "ಮಧ್ಯಮ", en: "Medium", color: "#F59E0B" },
        { kn: "ಹೆಚ್ಚು", en: "High", color: "#10B981" },
        { kn: "ಅತಿ ಹೆಚ್ಚು", en: "Very High", color: "#16A34A" },
      ];
    }
  };

  const renderNutrientLabel = (name: string) => {
    if (!name) return null;
    const parts = name.split(/(P2O5|K2O)/g);
    return (
      <Text style={styles.nutrientName}>
        {parts.map((part, index) => {
          if (part === "P2O5") {
            return (
              <Text key={index}>
                P<Text style={styles.subscript}>2</Text>O<Text style={styles.subscript}>5</Text>
              </Text>
            );
          }
          if (part === "K2O") {
            return (
              <Text key={index}>
                K<Text style={styles.subscript}>2</Text>O
              </Text>
            );
          }
          return <Text key={index}>{part}</Text>;
        })}
      </Text>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Preview */}
        <View style={styles.previewContainer}>
          {selectedImage ? (
            <Image
              source={{ uri: selectedImage }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderIcon}>📄</Text>
              <Text style={styles.placeholderText}>
                ಭೂ ಸಂಪನ್ಮೂಲ ಸಮೀಕ್ಷೆ (LRI) ಕಾರ್ಡ್ ಆಯ್ಕೆಮಾಡಿ
              </Text>
              <Text style={styles.placeholderSubtext}>
                Select LRI Card
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
            <Text style={styles.actionIcon}>📷</Text>
            <View>
              <Text style={styles.actionText}>ಕ್ಯಾಮೆರಾ</Text>
              <Text style={styles.actionTextEn}>Camera</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
            <Text style={styles.actionIcon}>🖼️</Text>
            <View>
              <Text style={styles.actionText}>ಗ್ಯಾಲರಿ</Text>
              <Text style={styles.actionTextEn}>Gallery</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => setIsHistoryModalVisible(true)}
          >
            <Text style={styles.actionIcon}>📜</Text>
            <View>
              <Text style={styles.actionText}>ಹಳೆಯ ವರದಿ</Text>
              <Text style={styles.actionTextEn}>History</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Upload Button */}
        {selectedImage && !analysisResult && (
          <TouchableOpacity
            style={[
              styles.uploadButton,
              (isUploading || isAnalyzing) && styles.uploadButtonDisabled,
            ]}
            onPress={handleUpload}
            disabled={isUploading || isAnalyzing}
          >
            {isUploading || isAnalyzing ? (
              <>
                <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.uploadButtonText}>
                    {loadingStage === 1
                      ? "ಚಿತ್ರ ಅಪ್‌ಲೋಡ್ ಆಗುತ್ತಿದೆ..."
                      : loadingStage === 2
                      ? "ಪಠ್ಯವನ್ನು ಹೊರತೆಗೆಯಲಾಗುತ್ತಿದೆ..."
                      : loadingStage === 3
                      ? "ವರದಿಯನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ..."
                      : "ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ..."}
                  </Text>
                  <Text style={styles.uploadButtonTextEn}>
                    {loadingStage === 1
                      ? "Uploading image..."
                      : loadingStage === 2
                      ? "Extracting text..."
                      : loadingStage === 3
                      ? "Mapping values..."
                      : "Analyzing..."}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.uploadIcon}>🔍</Text>
                <View>
                  <Text style={styles.uploadButtonText}>ವಿಶ್ಲೇಷಿಸಿ</Text>
                  <Text style={styles.uploadButtonTextEn}>Analyze</Text>
                </View>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Analysis Results */}
        {analysisResult && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>ಮಣ್ಣು ಪರೀಕ್ಷಾ ಫಲಿತಾಂಶ</Text>
            <Text style={styles.resultsSubtitle}>Soil Test Results</Text>

            {analysisResult.nutrient_status?.map(
              (nutrient: any, index: number) => (
                <View key={index} style={styles.nutrientRow}>
                  <View style={styles.nutrientInfo}>
                    {renderNutrientLabel(nutrient.nutrient_kn)}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.statusBadge,
                      { backgroundColor: nutrient.color },
                    ]}
                    onPress={() => {
                      setEditingNutrientIndex(index);
                      setIsStatusModalVisible(true);
                    }}
                  >
                    <Text style={styles.statusText}>
                      {nutrient.status_kn}
                      {nutrient.status && nutrient.status !== "ocr" ? ` (${nutrient.status})` : ""} ▾
                    </Text>
                  </TouchableOpacity>
                </View>
              )
            )}
          </View>
        )}
      </ScrollView>

      {analysisResult && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.recommendButton}
            onPress={goToRecommendations}
          >
            <View>
              <Text style={styles.recommendButtonText}>ಮುಂದೆ →</Text>
              <Text style={styles.recommendButtonTextEn}>Next →</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Select Status Modal */}
      <Modal
        visible={isStatusModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsStatusModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setIsStatusModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ಸ್ಥಿತಿ ಆಯ್ಕೆಮಾಡಿ / Select Status</Text>
            </View>
            
            <ScrollView style={styles.optionsList}>
              {editingNutrientIndex !== null && 
                getStatusOptions(analysisResult.nutrient_status[editingNutrientIndex].nutrient).map((option, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={styles.optionItem}
                    onPress={() => handleStatusSelect(option)}
                  >
                    <View style={[styles.optionIndicator, { backgroundColor: option.color }]} />
                    <View>
                      <Text style={styles.optionKn}>{option.kn}</Text>
                      <Text style={styles.optionEn}>{option.en}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              }
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.cancelBtn}
              onPress={() => setIsStatusModalVisible(false)}
            >
              <Text style={styles.cancelBtnText}>ರದ್ದು / Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* History Modal */}
      <Modal
        visible={isHistoryModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsHistoryModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setIsHistoryModalVisible(false)}
        >
          <View style={[styles.modalContent, styles.historyModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ಹಳೆಯ ವರದಿಗಳು / Previous Reports</Text>
            </View>
            
            <ScrollView style={styles.optionsList}>
              {history.length > 0 ? (
                history.map((item, idx) => (
                  <View key={item.id} style={styles.historyItem}>
                    <TouchableOpacity 
                      style={styles.historyItemMain}
                      onPress={() => selectFromHistory(item)}
                    >
                      <View style={styles.historyItemHeader}>
                        <Text style={styles.historyDate}>{item.date}</Text>
                      </View>
                      <View style={styles.historySummary}>
                        <Text style={styles.summaryText}>
                          N: {item.npk.N.replace("_", " ")} | P: {item.npk.P.replace("_", " ")} | K: {item.npk.K.replace("_", " ")}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.deleteBtn}
                      onPress={() => deleteHistoryItem(item.id)}
                    >
                      <Text style={styles.deleteBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={styles.emptyHistory}>
                  <Text style={styles.emptyHistoryText}>ಯಾವುದೇ ಹಳೆಯ ವರದಿಗಳಿಲ್ಲ</Text>
                  <Text style={styles.emptyHistoryTextEn}>No previous reports found</Text>
                </View>
              )}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.cancelBtn}
              onPress={() => setIsHistoryModalVisible(false)}
            >
              <Text style={styles.cancelBtnText}>ಮುಚ್ಚಿ / Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  previewContainer: {
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  previewImage: {
    width: "100%",
    height: 300,
  },
  placeholder: {
    height: 240,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    margin: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#A5D6A7",
    borderStyle: "dashed",
  },
  placeholderIcon: {
    fontSize: 50,
    marginBottom: 12,
    opacity: 0.6,
  },
  placeholderText: {
    fontSize: 16,
    color: "#1B5E20",
    fontWeight: "500",
    textAlign: "center",
  },
  placeholderSubtext: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    marginHorizontal: 3,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: "#E8F5E9",
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 13,
    color: "#333",
    fontWeight: "600",
    textAlign: "center",
  },
  actionTextEn: {
    fontSize: 10,
    color: "#888",
    marginTop: 1,
    textAlign: "center",
  },
  uploadButton: {
    backgroundColor: "#1B5E20",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#1B5E20",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  uploadButtonDisabled: {
    backgroundColor: "#81C784",
    elevation: 1,
    shadowOpacity: 0.1,
  },
  uploadIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  uploadButtonText: {
    fontSize: 17,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  uploadButtonTextEn: {
    fontSize: 12,
    color: "#A5D6A7",
    marginTop: 2,
    textAlign: "center",
  },
  resultsContainer: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    marginBottom: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    backgroundColor: "#F5F5F5",
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1B5E20",
    marginBottom: 4,
    textAlign: "center",
  },
  resultsSubtitle: {
    fontSize: 13,
    color: "#666",
    marginBottom: 14,
    textAlign: "center",
  },
  nutrientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  nutrientInfo: {
    flex: 1,
  },
  nutrientName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
  },
  subscript: {
    fontSize: 10,
    lineHeight: 20,
  },
  nutrientValue: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  recommendButton: {
    backgroundColor: "#1B5E20",
    borderRadius: 12,
    padding: 14,
    marginTop: 18,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#1B5E20",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  recommendButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
    textAlign: "center",
  },
  recommendButtonTextEn: {
    color: "#A5D6A7",
    fontSize: 12,
    marginTop: 2,
    textAlign: "center",
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraGuide: {
    width: "85%",
    height: "60%",
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 10,
    justifyContent: "flex-end",
    padding: 15,
  },
  cameraGuideText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  cameraGuideTextEn: {
    color: "#fff",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    opacity: 0.9,
  },
  cameraControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#000",
    paddingVertical: 30,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#1B5E20",
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  cancelButtonTextEn: {
    color: "#fff",
    fontSize: 12,
    marginTop: 2,
    opacity: 0.9,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '85%',
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B5E20',
    textAlign: 'center',
  },
  optionsList: {
    paddingVertical: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 1,
  },
  optionIndicator: {
    width: 6,
    height: 40,
    borderRadius: 3,
    marginRight: 16,
  },
  optionKn: {
    fontSize: 17,
    fontWeight: '500',
    color: '#333',
  },
  optionEn: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  cancelBtn: {
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelBtnText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyModalContent: {
    maxHeight: "80%",
  },
  historyItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    overflow: "hidden",
  },
  historyItemMain: {
    flex: 1,
    padding: 12,
  },
  historyItemHeader: {
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: "#1B5E20",
    fontWeight: "600",
  },
  historySummary: {
    marginTop: 2,
  },
  summaryText: {
    fontSize: 11,
    color: "#666",
    textTransform: "capitalize",
  },
  deleteBtn: {
    backgroundColor: "#FFEBEE",
    width: 50,
    justifyContent: "center",
    alignItems: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#FFCDD2",
  },
  deleteBtnText: {
    fontSize: 18,
  },
  emptyHistory: {
    padding: 40,
    alignItems: "center",
  },
  emptyHistoryText: {
    fontSize: 14,
    color: "#999",
    fontWeight: "600",
  },
  emptyHistoryTextEn: {
    fontSize: 12,
    color: "#BBB",
    marginTop: 4,
  },
});

