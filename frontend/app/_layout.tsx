import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Text, View, StyleSheet } from "react-native";

// Custom header title component with Kannada and English
function HeaderTitle({ kannada, english }: { kannada: string; english: string }) {
  return (
    <View style={headerStyles.container}>
      <Text style={headerStyles.kannada}>{kannada}</Text>
      <Text style={headerStyles.english}>{english}</Text>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  kannada: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  english: {
    fontSize: 11,
    color: "#A5D6A7",
    marginTop: 2,
  },
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#1B5E20",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          contentStyle: {
            backgroundColor: "#F5F5F5",
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerTitle: () => (
              <HeaderTitle kannada="GKVK ಮಣ್ಣು ವಿಶ್ಲೇಷಣೆ" english="Soil Health Card Analyzer" />
            ),
            headerTitleAlign: "center",
          }}
        />
        <Stack.Screen
          name="upload"
          options={{
            headerTitle: () => (
              <HeaderTitle kannada="ಚಿತ್ರ ಅಪ್‌ಲೋಡ್" english="Upload Image" />
            ),
            headerTitleAlign: "center",
          }}
        />
        <Stack.Screen
          name="crops"
          options={{
            headerTitle: () => (
              <HeaderTitle kannada="ಬೆಳೆ ಆಯ್ಕೆ" english="Select Crop" />
            ),
            headerTitleAlign: "center",
          }}
        />
        <Stack.Screen
          name="recommendation"
          options={{
            headerTitle: () => (
              <HeaderTitle kannada="ಶಿಫಾರಸುಗಳು" english="Recommendations" />
            ),
            headerTitleAlign: "center",
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}

