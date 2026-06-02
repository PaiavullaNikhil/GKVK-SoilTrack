import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { subscribeToConnection } from "../services/api";

// Custom header title component with Kannada and English
function HeaderTitle({ kannada, english }: { kannada: string; english: string }) {
  return (
    <View style={headerStyles.container}>
      <Text style={headerStyles.kannada}>{kannada}</Text>
      <Text style={headerStyles.english}>{english}</Text>
    </View>
  );
}

function ConnectionDot() {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToConnection((status) => {
      setOk(status);
    });
    return unsubscribe;
  }, []);

  const iconColor =
    ok === null ? "#9CA3AF" : ok ? "#3B82F6" : "#EF4444"; // gray, blue, red

  return (
    <MaterialCommunityIcons
      name="wifi"
      size={20}
      color={iconColor}
      style={{ marginRight: 12 }}
    />
  );
}

const headerStyles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  kannada: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 0.3,
  },
  english: {
    fontSize: 11,
    color: "#A5D6A7",
    marginTop: 3,
    letterSpacing: 0.5,
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
          headerShadowVisible: true,
          headerRight: () => <ConnectionDot />,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false, // Hide header for landing page
          }}
        />
        <Stack.Screen
          name="home"
          options={{
            headerTitle: "LRI Fertilizer Advisor",
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
        <Stack.Screen
          name="area"
          options={{
            headerTitle: () => (
              <HeaderTitle kannada="ಜಮೀನಿನ ವಿಸ್ತೀರ್ಣ" english="Land Area" />
            ),
            headerTitleAlign: "center",
          }}
        />
        <Stack.Screen
          name="fertilizers"
          options={{
            headerTitle: () => (
              <HeaderTitle kannada="ಗೊಬ್ಬರ ಸಂಯೋಜನೆ" english="Fertilizer Mix" />
            ),
            headerTitleAlign: "center",
          }}
        />
        <Stack.Screen
          name="plants"
          options={{
            headerTitle: () => (
              <HeaderTitle kannada="ಸಸ್ಯಗಳ ಸಂಖ್ಯೆ" english="Plant Count" />
            ),
            headerTitleAlign: "center",
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}

