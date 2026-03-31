import { useEffect } from "react"
import { SQLiteProvider } from "expo-sqlite"
import { StatusBar } from "expo-status-bar"
import { useFonts } from "expo-font"
import * as SplashScreen from 'expo-splash-screen'
import { Stack } from "expo-router/stack"
import { initDb } from "@/db/initDb"

import IngresoContextProvider from "@/context/IngresoContext"
import ConfigContextProvider from "@/context/ConfigContext"
import Toast from "react-native-toast-message"

SplashScreen.preventAutoHideAsync()

export default function Layout() {
  const [loaded, error] = useFonts({
    'Poppins-Black': require('../../assets/fonts/Poppins-Black.ttf'),
    'Poppins-BlackItalic': require('../../assets/fonts/Poppins-BlackItalic.ttf'),
    'Poppins-Bold': require('../../assets/fonts/Poppins-Bold.ttf'),
    'Poppins-BoldItalic': require('../../assets/fonts/Poppins-BoldItalic.ttf'),
    'Poppins-ExtraBold': require('../../assets/fonts/Poppins-ExtraBold.ttf'),
    'Poppins-ExtraBoldItalic': require('../../assets/fonts/Poppins-ExtraBoldItalic.ttf'),
    'Poppins-ExtraLight': require('../../assets/fonts/Poppins-ExtraLight.ttf'),
    'Poppins-ExtraLightItalic': require('../../assets/fonts/Poppins-ExtraLightItalic.ttf'),
    'Poppins-Italic': require('../../assets/fonts/Poppins-Italic.ttf'),
    'Poppins-Light': require('../../assets/fonts/Poppins-Light.ttf'),
    'Poppins-LightItalic': require('../../assets/fonts/Poppins-LightItalic.ttf'),
    'Poppins-Medium': require('../../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-MediumItalic': require('../../assets/fonts/Poppins-MediumItalic.ttf'),
    'Poppins-Regular': require('../../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-SemiBold': require('../../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-SemiBoldItalic': require('../../assets/fonts/Poppins-SemiBoldItalic.ttf'),
    'Poppins-Thin': require('../../assets/fonts/Poppins-Thin.ttf'),
    'Poppins-ThinItalic': require('../../assets/fonts/Poppins-ThinItalic.ttf'),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <SQLiteProvider databaseName="ingresos17.db" onInit={initDb}>
      <IngresoContextProvider>
        <ConfigContextProvider>
          <Stack
            screenOptions={{
              animation: "fade",
              headerStyle: { backgroundColor: "#284473" },
              headerTintColor: "#fff",
              headerTitleStyle: { fontFamily: "Poppins-Bold" },
              headerTitleAlign: "center",

              statusBarStyle: "dark",
              statusBarTranslucent: true,
              statusBarBackgroundColor: "transparent",
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="ingresos" options={{ headerShown: false }} />
            <Stack.Screen name="printConfig" options={{ title: "Configuracion de impresion" }} />
          </Stack>
        </ConfigContextProvider>
      </IngresoContextProvider>
      <Toast />
    </SQLiteProvider>
  )
}
