import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";

import { useConfigDb } from "@/db/useConfigDb";
import { newOrderStyles } from "@/styles/OrderStyle";
import { newTaskStyles } from "@/styles/TaskStyle";

const DEFAULT_OFFSET = String(process.env.EXPO_PUBLIC_PRINT_OFFSET_MM ?? 0);
const DEFAULT_QUEUE_DELAY = String(process.env.EXPO_PUBLIC_PRINT_QUEUE_DELAY_MS ?? 1200);
const DEFAULT_RETRIES = String(process.env.EXPO_PUBLIC_PRINT_RETRIES ?? 1);
const DEFAULT_RETRY_DELAY = String(process.env.EXPO_PUBLIC_PRINT_RETRY_DELAY_MS ?? 1500);

export default function PrintConfigScreen() {
  const configDb = useConfigDb();
  const router = useRouter();
  const [printOffsetMm, setPrintOffsetMm] = useState(DEFAULT_OFFSET);
  const [printQueueDelayMs, setPrintQueueDelayMs] = useState(DEFAULT_QUEUE_DELAY);
  const [printRetries, setPrintRetries] = useState(DEFAULT_RETRIES);
  const [printRetryDelayMs, setPrintRetryDelayMs] = useState(DEFAULT_RETRY_DELAY);

  const readOrDefault = async (key, fallback) => {
    const [row] = await configDb.getConfigValue(key);
    const value = row?.valor ?? "";
    if (value === "") {
      await configDb.setConfigValue(key, String(fallback));
      return String(fallback);
    }
    return String(value);
  };

  const loadConfig = useCallback(async () => {
    try {
      const [offset, queueDelay, retries, retryDelay] = await Promise.all([
        readOrDefault("print_offset_mm", DEFAULT_OFFSET),
        readOrDefault("print_queue_delay_ms", DEFAULT_QUEUE_DELAY),
        readOrDefault("print_retries", DEFAULT_RETRIES),
        readOrDefault("print_retry_delay_ms", DEFAULT_RETRY_DELAY),
      ]);
      setPrintOffsetMm(offset);
      setPrintQueueDelayMs(queueDelay);
      setPrintRetries(retries);
      setPrintRetryDelayMs(retryDelay);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo cargar la configuracion de impresion.");
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const ensureNumeric = (label, value, options = {}) => {
    const allowNegative = Boolean(options.allowNegative);
    if (value === "" || Number.isNaN(Number(value))) {
      Alert.alert("Error", `${label} debe ser numerico.`);
      return false;
    }
    if (!allowNegative && Number(value) < 0) {
      Alert.alert("Error", `${label} no puede ser negativo.`);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!ensureNumeric("Offset de impresion", printOffsetMm, { allowNegative: true })) return;
    if (!ensureNumeric("Demora entre trabajos", printQueueDelayMs)) return;
    if (!ensureNumeric("Reintentos", printRetries)) return;
    if (!ensureNumeric("Espera entre reintentos", printRetryDelayMs)) return;

    try {
      await configDb.setConfigValue("print_offset_mm", String(printOffsetMm));
      await configDb.setConfigValue("print_queue_delay_ms", String(printQueueDelayMs));
      await configDb.setConfigValue("print_retries", String(printRetries));
      await configDb.setConfigValue("print_retry_delay_ms", String(printRetryDelayMs));

      Toast.show({
        type: "success",
        text1: "Configuracion guardada",
        text2: "La impresion usara estos parametros.",
        visibilityTime: 1777,
        position: "bottom",
        bottomOffset: 120,
        text1Style: { fontFamily: "Poppins-Bold", fontSize: 15 },
        text2Style: { fontFamily: "Poppins-Regular", fontSize: 13 },
        swipeable: true,
      });
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo guardar la configuracion de impresion.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[newTaskStyles.element]}>
          <Text style={[newTaskStyles.label]}>Alineamiento horizontal (mm)</Text>
          <TextInput
            style={[newTaskStyles.textInput]}
            placeholder="0"
            value={printOffsetMm}
            onChangeText={setPrintOffsetMm}
            keyboardType="numeric"
            cursorColor="#C0C0C0"
          />
        </View>

        <View style={[newTaskStyles.element]}>
          <Text style={[newTaskStyles.label]}>Demora entre trabajos (ms)</Text>
          <TextInput
            style={[newTaskStyles.textInput]}
            placeholder="2000"
            value={printQueueDelayMs}
            onChangeText={setPrintQueueDelayMs}
            keyboardType="numeric"
            cursorColor="#C0C0C0"
          />
        </View>

        <View style={[newTaskStyles.element]}>
          <Text style={[newTaskStyles.label]}>Reintentos por trabajo</Text>
          <TextInput
            style={[newTaskStyles.textInput]}
            placeholder="2"
            value={printRetries}
            onChangeText={setPrintRetries}
            keyboardType="numeric"
            cursorColor="#C0C0C0"
          />
        </View>

        <View style={[newTaskStyles.element]}>
          <Text style={[newTaskStyles.label]}>Espera entre reintentos (ms)</Text>
          <TextInput
            style={[newTaskStyles.textInput]}
            placeholder="2000"
            value={printRetryDelayMs}
            onChangeText={setPrintRetryDelayMs}
            keyboardType="numeric"
            cursorColor="#C0C0C0"
          />
        </View>

        <TouchableOpacity
          onPress={handleSave}
          style={[
            { ...newOrderStyles.btnOptions, ...newOrderStyles.btnSave },
            { width: "100%", marginTop: 10 }
          ]}
        >
          <Ionicons name="save-outline" color="white" size={18} />
          <Text style={[newOrderStyles.textBtnOptions]}>Guardar configuracion</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scroll: {
    padding: 16,
    paddingBottom: 28,
  },
});
