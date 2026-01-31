import React, { useEffect, useState, useCallback, useContext } from "react";
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { usePreciosDb } from "@/db/usePreciosDb";
import { IngresoContext } from "@/context/IngresoContext";
import { newOrderStyles } from "@/styles/OrderStyle";
import Colors from "@/styles/Colors";
import Toast from "react-native-toast-message";

const PriceInput = ({ label, id, value, onChange }) => (
  <View style={styles.inputWrapper}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={styles.smallInput}
      keyboardType="numeric"
      value={value || "0"}
      onChangeText={(val) => onChange(id, val)}
      autoCorrect={false}
      spellCheck={false}
    />
  </View>
);

export default function PriceSettings() {
  const router = useRouter();
  const { getAll, updatePrecioByCodigo } = usePreciosDb();
  const [precios, setPrecios] = useState({});
  const [loading, setLoading] = useState(true);
  const [hasBackup, setHasBackup] = useState(false);
  const {
    restorePreciosFromBackup,
    restoreMediosDePagoFromBackup,
    hasPreciosBackup,
    hasMediosBackup,
  } = useContext(IngresoContext);

  const cargarPrecios = async () => {
    try {
      setLoading(true);
      const data = await getAll();

      if (data && data.length > 0) {
        const preciosObj = {};
        data.forEach(item => {
          const key = item.codigo || item.id;
          preciosObj[key] = String(item.precio ?? "0");
        });
        setPrecios(preciosObj);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPrecios();
  }, []);

  useEffect(() => {
    let mounted = true;
    const checkBackup = async () => {
      const [hasP, hasM] = await Promise.all([hasPreciosBackup(), hasMediosBackup()]);
      if (mounted) setHasBackup(Boolean(hasP || hasM));
    };
    checkBackup();
    return () => { mounted = false; };
  }, [hasPreciosBackup, hasMediosBackup]);

  const handleChange = useCallback((id, valor) => {
    const numerico = valor.replace(/[^0-9]/g, '');
    setPrecios(prev => ({ ...prev, [id]: numerico }));
  }, []);

  const handleSaveAll = async () => {
    if (Object.keys(precios).length === 0) {
      Alert.alert("Atención", "No hay cambios para guardar.");
      return;
    }

    try {
      setLoading(true);
      const promesas = Object.entries(precios).map(([codigo, valor]) => {
        return updatePrecioByCodigo(codigo, Number(valor));
      });

      await Promise.all(promesas);

      Toast.show({
        type: 'success',
        text1: 'Precios guardados',
        text2: 'Todos los precios han sido actualizados',
        visibilityTime: 1777,
        position: "bottom",
        bottomOffset: 120,
      });

      router.back();
    } catch (error) {
      console.error("Error al guardar:", error);
      Alert.alert("Error", "No se pudieron persistir los datos.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    const restoredPrices = await restorePreciosFromBackup();
    await restoreMediosDePagoFromBackup();

    if (!restoredPrices) {
      return Alert.alert("Atención", "No hay backup para restaurar.");
    }

    await cargarPrecios();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.DBLUE} />
        <Text style={{ marginTop: 10, fontFamily: 'Poppins-Regular' }}>Cargando precios...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Configuración de Precios</Text>
        </View>

        <ScrollView style={{ padding: 15 }} keyboardShouldPersistTaps="handled">

          {/* SECCIÓN VISITANTES */}
          <View style={[styles.card, styles.cardVisitantes]}>
            <Text style={styles.cardTitle}>VISITANTES - ACAMPE</Text>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <PriceInput label="ADULTOS:" id="ING_MAYOR" value={precios["ING_MAYOR"]} onChange={handleChange} />
                <PriceInput label="MENORES:" id="ING_MENOR" value={precios["ING_MENOR"]} onChange={handleChange} />
                <PriceInput label="JUBILADOS:" id="ING_JUBILADO" value={precios["ING_JUBILADO"]} onChange={handleChange} />
                <PriceInput label="B. LANCHA:" id="ING_BAJADALANCHA" value={precios["ING_BAJADALANCHA"]} onChange={handleChange} />
                <PriceInput label="ADICIONAL:" id="ING_ADICIONAL" value={precios["ING_ADICIONAL"]} onChange={handleChange} />
                <PriceInput label="MOTOR HOME:" id="ING_MOTORHOME" value={precios["ING_MOTORHOME"]} onChange={handleChange} />
              </View>
              <View style={styles.subSection}>
                <Text style={styles.subTitle}>Diurno</Text>
                <PriceInput label="ADULTOS:" id="INGD_MAYOR" value={precios["INGD_MAYOR"]} onChange={handleChange} />
                <PriceInput label="MENORES:" id="INGD_MENOR" value={precios["INGD_MENOR"]} onChange={handleChange} />
                <PriceInput label="JUBILADOS:" id="INGD_JUBILADO" value={precios["INGD_JUBILADO"]} onChange={handleChange} />
              </View>
            </View>
          </View>

          {/* SECCIÓN LOCALES */}
          <View style={[styles.card, styles.cardLocales]}>
            <Text style={styles.cardTitle}>LOCALES - ACAMPE</Text>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <PriceInput label="ADULTOS:" id="INGL_MAYOR" value={precios["INGL_MAYOR"]} onChange={handleChange} />
                <PriceInput label="MENORES:" id="INGL_MENOR" value={precios["INGL_MENOR"]} onChange={handleChange} />
                <PriceInput label="JUBILADOS:" id="INGL_JUBILADO" value={precios["INGL_JUBILADO"]} onChange={handleChange} />
                <PriceInput label="B. LANCHA:" id="INGL_BAJADALANCHA" value={precios["INGL_BAJADALANCHA"]} onChange={handleChange} />
                <PriceInput label="ADICIONAL:" id="INGL_ADICIONAL" value={precios["INGL_ADICIONAL"]} onChange={handleChange} />
                <PriceInput label="MOTOR HOME:" id="INGL_MOTORHOME" value={precios["INGL_MOTORHOME"]} onChange={handleChange} />
              </View>
              <View style={styles.subSection}>
                <Text style={styles.subTitle}>Diurno</Text>
                <PriceInput label="ADULTOS:" id="INGLD_MAYOR" value={precios["INGLD_MAYOR"]} onChange={handleChange} />
                <PriceInput label="MENORES:" id="INGLD_MENOR" value={precios["INGLD_MENOR"]} onChange={handleChange} />
                <PriceInput label="JUBILADOS:" id="INGLD_JUBILADO" value={precios["INGLD_JUBILADO"]} onChange={handleChange} />
              </View>
            </View>
          </View>
          <View style={[styles.card, styles.cardOtros]}>
            <Text style={styles.cardTitle}>OTROS</Text>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <PriceInput label="ESTACIONAMIENTO:" id="ING_ESTACIONAMIENTO" value={precios["ING_ESTACIONAMIENTO"]} onChange={handleChange} />
              </View>
            </View>
          </View>



          {/* <TouchableOpacity onPress={handleSaveAll} style={[newOrderStyles.btnOptions, newOrderStyles.btnSave, { marginVertical: 20 }]}>
            <Ionicons name="save-outline" color="white" size={18} />
            <Text style={newOrderStyles.textBtnOptions}>Guardar Cambios</Text>
          </TouchableOpacity> */}

          {hasBackup && (
            <TouchableOpacity onPress={handleRestoreBackup} style={[newOrderStyles.btnOptions, styles.restoreBottomBtn]}>
              <Ionicons name="refresh" size={18} color="white" />
              <Text style={newOrderStyles.textBtnOptions}>Restaurar backup</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  headerTitle: { fontSize: 18, fontFamily: 'Poppins-Bold', marginLeft: 15 },
  restoreBottomBtn: { marginTop: 10, marginBottom: 20, backgroundColor: '#4A90E2' },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 15, marginBottom: 15, borderLeftWidth: 4, elevation: 2 },
  cardVisitantes: { backgroundColor: '#e9f7e5', borderLeftColor: Colors.GREEN },
  cardLocales: { backgroundColor: '#e6eff9', borderLeftColor: Colors.LBLUE },
  cardOtros: { backgroundColor: '#f0f0f0', borderLeftColor: Colors.GREY },
  cardTitle: { fontSize: 13, fontFamily: 'Poppins-Bold', color: '#333', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#EEE', paddingBottom: 5 },
  row: { flexDirection: 'row' },
  subSection: { flex: 1, marginLeft: 15, paddingLeft: 15, borderLeftWidth: 1, borderLeftColor: '#EEE' },
  subTitle: { fontSize: 11, fontFamily: 'Poppins-Bold', color: Colors.DBLUE, marginBottom: 8, textTransform: 'uppercase' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  inputLabel: { fontSize: 10, fontFamily: 'Poppins-Medium', color: '#666', flex: 1.5 },
  smallInput: { borderWidth: 1, borderColor: '#DDD', borderRadius: 5, width: 70, height: 40, paddingHorizontal: 8, fontSize: 13, textAlign: 'right', backgroundColor: '#FFF' }
});
