import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

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
            title: "GKVK ಮಣ್ಣು ವಿಶ್ಲೇಷಣೆ",
            headerTitleAlign: "center",
          }}
        />
        <Stack.Screen
          name="upload"
          options={{
            title: "ಚಿತ್ರ ಅಪ್‌ಲೋಡ್",
            headerTitleAlign: "center",
          }}
        />
        <Stack.Screen
          name="crops"
          options={{
            title: "ಬೆಳೆ ಆಯ್ಕೆ",
            headerTitleAlign: "center",
          }}
        />
        <Stack.Screen
          name="recommendation"
          options={{
            title: "ಶಿಫಾರಸುಗಳು",
            headerTitleAlign: "center",
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}

