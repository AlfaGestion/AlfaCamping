import React from 'react';
import { useRouter, Stack } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { newOrderStyles } from '@/styles/OrderStyle';
import { Ionicons } from '@expo/vector-icons';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <Text style={styles.h1}>¡Uy! Esta página no existe.</Text>
        <TouchableOpacity
          style={[newOrderStyles.btnOptions, newOrderStyles.btnData]}
          onPress={() => router.push('/')}
        >
          <Ionicons name="home-outline" size={24} color="white" />
          <Text style={styles.p}>Ir a la pantalla de inicio.</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  h1: {
    fontSize: 20,
    marginBottom: 15,
    fontFamily: 'Poppins-Bold',
    includeFontPadding: false,
  },
  p: {
    fontSize: 18,
    padding: 10,
    fontFamily: 'Poppins-Medium',
    includeFontPadding: false,
    color: 'white',
  },
});
