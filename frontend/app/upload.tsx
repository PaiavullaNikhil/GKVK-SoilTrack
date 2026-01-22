import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Speech from "expo-speech";
import { analyzeImageDirect } from "../services/api";

export default function UploadScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [imageId, setImageId] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setAnalysisResult(null);
    }
  };

  const takePhoto = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          "ಅನುಮತಿ ಅಗತ್ಯವಿದೆ / Permission Required",
          "ಕ್ಯಾಮೆರಾ ಬಳಸಲು ಅನುಮತಿ ನೀಡಿ\nGrant permission to use camera",
          [{ text: "ಸರಿ / OK" }]
        );
        return;
      }
    }
    setShowCamera(true);
  };

  const handleCapture = async (camera: any) => {
    if (camera) {
      const photo = await camera.takePictureAsync();
      setSelectedImage(photo.uri);
      setShowCamera(false);
      setAnalysisResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) return;

    setIsUploading(true);
    setIsAnalyzing(true);
    try {
      // Direct analysis - no file storage needed (works with Hugging Face Spaces)
      const analysis = await analyzeImageDirect(selectedImage);
      setAnalysisResult(analysis);
      setImageId(analysis.image_id);

      // Speak result
      Speech.speak("ವಿಶ್ಲೇಷಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ", { language: "kn-IN" });
    } catch (error: any) {
      console.error("Upload/Analysis error:", error);
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
    router.push({
      pathname: "/crops",
      params: { imageId: imageId || "" },
    });
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing="back">
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraGuide}>
              <View>
                <Text style={styles.cameraGuideText}>
                  ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಕಾರ್ಡ್ ಇಲ್ಲಿ ಹಿಡಿಯಿರಿ
                </Text>
                <Text style={styles.cameraGuideTextEn}>
                  Position soil health card here
                </Text>
              </View>
            </View>
          </View>
        </CameraView>
        <View style={styles.cameraControls}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowCamera(false)}
          >
            <View>
              <Text style={styles.cancelButtonText}>ರದ್ದುಮಾಡಿ</Text>
              <Text style={styles.cancelButtonTextEn}>Cancel</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={() => {
              // For simplicity, close camera and pick from gallery
              // In production, use camera ref for takePictureAsync
              setShowCamera(false);
              pickImage();
            }}
          >
            <View style={styles.captureInner} />
          </TouchableOpacity>
          <View style={{ width: 70 }} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Image Preview */}
        <View style={styles.previewContainer}>
          {selectedImage ? (
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderIcon}>📄</Text>
              <Text style={styles.placeholderText}>
                ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಕಾರ್ಡ್ ಆಯ್ಕೆಮಾಡಿ
              </Text>
              <Text style={styles.placeholderSubtext}>
                Select Soil Health Card
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

            <TouchableOpacity
              style={styles.recommendButton}
              onPress={goToRecommendations}
            >
              <View>
              <Text style={styles.recommendButtonText}>
                ಶಿಫಾರಸು ಪಡೆಯಿರಿ →
              </Text>
              <Text style={styles.recommendButtonTextEn}>
                Get Recommendations →
              </Text>
            </View>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  content: {
    padding: 20,
  },
  previewContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  previewImage: {
    width: "100%",
    height: 300,
    resizeMode: "contain",
  },
  placeholder: {
    height: 250,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
  },
  placeholderIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  placeholderText: {
    fontSize: 18,
    color: "#1B5E20",
    fontWeight: "500",
  },
  placeholderSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    width: "45%",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  actionTextEn: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  uploadButton: {
    backgroundColor: "#1B5E20",
    borderRadius: 15,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  uploadButtonDisabled: {
    backgroundColor: "#81C784",
  },
  uploadIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  uploadButtonText: {
    fontSize: 18,
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
    borderRadius: 15,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1B5E20",
    marginBottom: 4,
    textAlign: "center",
  },
  resultsSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
    textAlign: "center",
  },
  nutrientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  nutrientInfo: {
    flex: 1,
  },
  nutrientName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  nutrientValue: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  recommendButton: {
    backgroundColor: "#1B5E20",
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
    alignItems: "center",
  },
  recommendButtonText: {
    color: "#fff",
    fontSize: 18,
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

