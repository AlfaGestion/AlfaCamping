import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs 
      screenOptions={{
        tabBarActiveTintColor: '#284473',
        // tabBarStyle: { marginVertical: 10, marginHorizontal: 20, borderRadius: 15, height: 65 },
        tabBarStyle: { height: 75 },
        tabBarLabelStyle: { fontSize: 12, marginTop: 5, fontFamily: 'Poppins-Regular' },
        tabBarIconStyle: { marginTop: 5 },
        animation: 'fade',
        headerShown: false,
        tabBarActiveBackgroundColor: '#28447310',
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ingresos',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="list-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Configuración',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="settings-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="sendPending"
        options={{
          title: 'Enviar',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="send-outline" color={color} />,
        }}
      />
    </Tabs>
  );
}
