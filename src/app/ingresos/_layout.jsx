import { Stack } from "expo-router";

export default function IngresosLayout() {
  return (
    <Stack
      initialRouteName="new"
      screenOptions={{
        animation: "fade",

        headerStyle: { backgroundColor: "#284473" },
        headerTintColor: "#fff",
        // headerTintColor: "#284473",

        headerTitleStyle: { fontFamily: "Poppins-Bold" },
        headerTitleAlign: "center",

        statusBarStyle: "light",
        statusBarTranslucent: true,
        statusBarBackgroundColor: "#284473",
      }}
    >
      <Stack.Screen
        name="new"
        options={{
          title: "Información Inicial",
          headerBackVisible: false,
          headerLeft: () => null
        }}
      />
      <Stack.Screen
        name="next"
        // options={{ title: "Estacionamiento y conteo" }} 
        options={{
          title: "Conteo",
          headerBackVisible: false,
          headerLeft: () => null
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: "Detalle de Ingreso" }}
      />
      <Stack.Screen
        name="priceSettings"
        // options={{ title: "Estacionamiento y conteo" }} 
        options={{ title: "Configurar precios" }}
      />
    </Stack>
  )
}



