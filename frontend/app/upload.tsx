import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { analyzeImageDirect } from "../services/api";
import { speakKn, stopVoice } from "../utils/voice";

export default function UploadScreen() {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [imageId, setImageId] = useState<string | null>(null);
  const [npkStatus, setNpkStatus] = useState<{
    N: "very_low" | "low" | "medium" | "high" | "very_high";
    P: "very_low" | "low" | "medium" | "high" | "very_high";
    K: "very_low" | "low" | "medium" | "high" | "very_high";
  } | null>(null);

  useEffect(() => {
    console.log("[UploadScreen] Mounted");
    speakKn(
      "ಭೂ ಸಂಪನ್ಮೂಲ ಸಮೀಕ್ಷೆ ಕಾರ್ಡಿನ ಫೋಟೋ ತೆಗೆದು ಅಥವಾ ಗ್ಯಾಲರಿಯಿಂದ ಆಯ್ಕೆಮಾಡಿ ಮತ್ತು ನಂತರ ವಿಶ್ಲೇಷಣೆ ಬಟನ್ ಒತ್ತಿ."
    );
    return () => {
      console.log("[UploadScreen] Unmounted");
      stopVoice();
    };
  }, []);

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
      // Ensure we have permission to read photos / media
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log("[UploadScreen] Media library permission status:", status);

      if (status !== "granted") {
        Alert.alert(
          "ಅನುಮತಿ ಅಗತ್ಯವಿದೆ / Permission Required",
          "ಗ್ಯಾಲರಿ ಬಳಕೆಗಾಗಿ ಫೋಟೋಗಳಿಗೆ ಪ್ರವೇಶ ಅನುಮತಿಸಿ\nAllow access to photos to use gallery",
          [{ text: "ಸರಿ / OK" }]
        );
        console.log("[UploadScreen] Media library permission denied");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
    try {
      // Direct analysis - no file storage needed (works with Hugging Face Spaces)
      const analysis = await analyzeImageDirect(selectedImage);
      console.log("[UploadScreen] Analysis result received", {
        imageId: analysis?.image_id,
        nutrientCount: analysis?.nutrient_status?.length,
      });
      setAnalysisResult(analysis);
      setImageId(analysis.image_id);

      // Derive N, P, K fertility classes from OCR status
      const baseStatus: {
        N: "very_low" | "low" | "medium" | "high" | "very_high";
        P: "very_low" | "low" | "medium" | "high" | "very_high";
        K: "very_low" | "low" | "medium" | "high" | "very_high";
      } = { N: "medium", P: "medium", K: "medium" };
      (analysis.nutrient_status || []).forEach((nutrient: any) => {
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

      // Speak Kannada summary covering ALL analysed nutrients (pH, EC, OC, N, P2O5, K2O, S, Zn, B, Fe, Mn, Cu...)
      const list: any[] = analysis.nutrient_status || [];
      if (list.length > 0) {
        speakKn(
          "ವಿಶ್ಲೇಷಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ. ಈಗ pH ರಿಂದ ಕಾಪರ್ ವರೆಗೆ ಎಲ್ಲಾ ಅಂಶಗಳ ಸ್ಥಿತಿಯನ್ನು ಕೇಳಿ."
        );

        // Read every analysed nutrient once: "<Kannada-friendly name>: <Kannada status>"
        list.forEach((nutrient: any) => {
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
      console.error("[UploadScreen] Upload/Analysis error:", error);
      // Log detailed error info
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", JSON.stringify(error.response.data));
      } else if (error.request) {
        console.error("No response received - network error");
      }
      Alert.alert(
        "ದೋಷ / Error",
        `ಚಿತ್ರವನ್ನು ವಿಶ್ಲೇಷಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ\nFailed to analyze image\n\n${error.response?.data?.detail || error.message || "Network error. Please check if backend is running."}`,
        [{ text: "ಸರಿ / OK" }]
      );
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
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
                    {isUploading ? "ಅಪ್‌ಲೋಡ್ ಆಗುತ್ತಿದೆ..." : "ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ..."}
                  </Text>
                  <Text style={styles.uploadButtonTextEn}>
                    {isUploading ? "Uploading..." : "Analyzing..."}
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
                    <Text style={styles.nutrientName}>{nutrient.nutrient_kn}</Text>
                    <Text style={styles.nutrientValue}>
                      {nutrient.value_raw
                        ? `${nutrient.value_raw} ${nutrient.unit}`
                        : nutrient.value !== null
                          ? `${nutrient.value} ${nutrient.unit}`
                          : "—"}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: nutrient.color },
                    ]}
                  >
                    <Text style={styles.statusText}>{nutrient.status_kn}</Text>
                  </View>
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
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    width: "47%",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  actionTextEn: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
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
  nutrientValue: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
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
});

