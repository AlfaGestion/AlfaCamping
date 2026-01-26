import { useState, useEffect, useContext, useMemo, useCallback } from "react";
import {
  Text, View, TextInput, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Alert, StyleSheet, BackHandler
} from "react-native";
import { Picker } from '@react-native-picker/picker';
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Checkbox from "expo-checkbox";

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { IngresoContext } from "@/context/IngresoContext";
import Colors from "@/styles/Colors";
import { buildIngresoHtml } from "@/utils/ingresoPrint";

const CATEGORIES = [
  {
    key: "adultos",
    label: "ADULTOS",
    dbKey: "ING_MAYOR",
    dbKeyL: "INGL_MAYOR",
    dbKeyD: "INGD_MAYOR",
    dbKeyLD: "INGLD_MAYOR",
  },
  {
    key: "menores",
    label: "MENORES",
    dbKey: "ING_MENOR",
    dbKeyL: "INGL_MENOR",
    dbKeyD: "INGD_MENOR",
    dbKeyLD: "INGLD_MENOR",
  },
  {
    key: "jubilados",
    label: "JUBILADOS",
    dbKey: "ING_JUBILADO",
    dbKeyL: "INGL_JUBILADO",
    dbKeyD: "INGD_JUBILADO",
    dbKeyLD: "INGLD_JUBILADO",
  },
  { key: "bajada_lancha", label: "B. LANCHA", dbKey: "ING_BAJADALANCHA", dbKeyL: "INGL_BAJADALANCHA" },
];

export default function NewTaskScreen() {
  const router = useRouter();
  const {
    ingreso, setIngreso, mediosDePago,
    fetchPrecios, fetchMediosDePago, handleSaveIngreso,
    precios: preciosArr,
  } = useContext(IngresoContext);

  useEffect(() => {
    fetchPrecios();
    fetchMediosDePago();
  }, []);

  useFocusEffect(useCallback(() => {
    const onBackPress = () => {
      router.replace("/ingresos/new");
      return true;
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => subscription.remove();
  }, [router]));
  const handleBackToInfo = () => {
    router.replace("/ingresos/new");
  };

  useEffect(() => {
    setIngreso(prev => {
      const next = {
        ...prev,
        precio_adultos: Number(allPrecios.adultos) || 0,
        precio_menores: Number(allPrecios.menores) || 0,
        precio_jubilados: Number(allPrecios.jubilados) || 0,
        precio_bajada_lancha: Number(allPrecios.bajada_lancha) || 0,

        precio_adultosL: Number(allPrecios.adultosL) || 0,
        precio_menoresL: Number(allPrecios.menoresL) || 0,
        precio_jubiladosL: Number(allPrecios.jubiladosL) || 0,
        precio_bajada_lanchaL: Number(allPrecios.bajada_lanchaL) || 0,

        precio_adicional: Number(allPrecios.adicional) || 0,
        precio_adicionalL: Number(allPrecios.adicionalL) || 0,
        precio_estacionamiento: Number(allPrecios.estacionamiento) || 0,

        subtotal: subtotalGeneral,
        total: totalFinal
      };

      // Guard: si no cambió nada, devolvé el mismo objeto y no re-renderiza en loop
      const same =
        prev.precio_adultos === next.precio_adultos &&
        prev.precio_adultosL === next.precio_adultosL &&
        prev.precio_adicional === next.precio_adicional &&
        prev.precio_adicionalL === next.precio_adicionalL &&
        prev.precio_estacionamiento === next.precio_estacionamiento &&
        prev.precio_menores === next.precio_menores &&
        prev.precio_menoresL === next.precio_menoresL &&
        prev.precio_jubilados === next.precio_jubilados &&
        prev.precio_jubiladosL === next.precio_jubiladosL &&
        prev.precio_bajada_lancha === next.precio_bajada_lancha &&
        prev.precio_bajada_lanchaL === next.precio_bajada_lanchaL &&
        prev.subtotal === next.subtotal &&
        prev.total === next.total;

      return same ? prev : next;
    });
  }, [allPrecios, subtotalGeneral, totalFinal, setIngreso]);


  const isSameDay = ingreso?.ingreso && ingreso?.egreso && ingreso.ingreso === ingreso.egreso;

  const allPrecios = useMemo(() => {
    const p = {};

    // Mapeo dinámico para Adultos, Menores, Jubilados y Lanchas
    CATEGORIES.forEach(cat => {
      const useDiurno = isSameDay && cat.dbKeyD && cat.dbKeyLD;
      const key = useDiurno ? cat.dbKeyD : cat.dbKey;
      const keyL = useDiurno ? cat.dbKeyLD : cat.dbKeyL;
      p[cat.key] = preciosArr.find(item => item.codigo === key)?.precio || 0;
      p[`${cat.key}L`] = preciosArr.find(item => item.codigo === keyL)?.precio || 0;
    });

    // Mapeo explícito para Motorhome
    p.adicional = preciosArr.find(item => item.codigo === "ING_MOTORHOME")?.precio || 0;
    p.adicionalL = preciosArr.find(item => item.codigo === "INGL_MOTORHOME")?.precio || 0;
    p.estacionamiento = preciosArr.find(item => item.codigo === "ING_ESTACIONAMIENTO")?.precio || 0;

    return p;
  }, [preciosArr, isSameDay]);

  // --- LÓGICA DE CÁLCULOS ---
  const counts = useMemo(() => {
    const personasKeys = ["adultos", "menores", "jubilados"];
    return {
      visitantes: personasKeys.reduce((acc, key) => acc + (Number(ingreso[key]) || 0), 0),
      locales: personasKeys.reduce((acc, key) => acc + (Number(ingreso[`${key}L`]) || 0), 0)
    };
  }, [ingreso]);

  const subtotalGeneral = useMemo(() => {
    // 1. Base (Personas + Lancha) multiplicado por estadía
    const baseEstadia = CATEGORIES.reduce((acc, cat) => {
      const v = (Number(ingreso[cat.key]) || 0) * (Number(allPrecios[cat.key]) || 0);
      const l = (Number(ingreso[`${cat.key}L`]) || 0) * (Number(allPrecios[`${cat.key}L`]) || 0);
      return acc + v + l;
    }, 0) * (Number(ingreso.estadia) || 1);

    // 2. Motorhome por cantidad (visitantes + locales), multiplicado por estadía
    const motorhomeSubtotal =
      ((Number(ingreso.adicional) || 0) * (Number(allPrecios.adicional) || 0) +
        (Number(ingreso.adicionalL) || 0) * (Number(allPrecios.adicionalL) || 0)) *
      (Number(ingreso.estadia) || 1);
    const estacionamientoSubtotal = ingreso.estacionamiento ? Number(allPrecios.estacionamiento) || 0 : 0;
    return baseEstadia + motorhomeSubtotal + estacionamientoSubtotal;
  }, [ingreso, allPrecios]);

  const montoDescuento = (subtotalGeneral * (Number(ingreso.descuento) || 0)) / 100;
  const totalFinal = subtotalGeneral - montoDescuento;
  const estadiaUnit = isSameDay
    ? (Number(ingreso?.estadia) === 1 ? "Día" : "Días")
    : (Number(ingreso?.estadia) === 1 ? "Noche" : "Noches");
  const estadiaUnitLower = isSameDay
    ? (Number(ingreso?.estadia) === 1 ? "día" : "días")
    : (Number(ingreso?.estadia) === 1 ? "noche" : "noches");
  const estadiaLabel = isSameDay ? "DÍAS" : "NOCHES";

  const onSave = async () => {
    if (!ingreso.medio_de_pago) return Alert.alert("Atención", "Seleccione medio de pago");

    try {
      const savedId = await handleSaveIngreso();
      if (!savedId) return;

      const html = generateHTML({ id: savedId ?? ingreso?.id });
      Alert.alert("Guardado", "¿Qué desea hacer?", [
        { text: "Imprimir", onPress: async () => await Print.printAsync({ html }) },
        {
          text: "Compartir", onPress: async () => {
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri);
          }
        },
        { text: "Cerrar", onPress: () => router.replace("/") },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo grabar.");
    }
  };

  const generateHTML = (overrides = {}) => {
    const ingresoPrint = { ...ingreso, ...overrides };
    const estacionamientoPrecio = Number(ingresoPrint?.precio_estacionamiento ?? allPrecios.estacionamiento ?? 0);
    return buildIngresoHtml(ingresoPrint, {
      totalOverride: totalFinal,
      estacionamientoPrecio,
    });
  };

  const renderCounterColumn = (isLocalColumn) => (
    <View style={styles.column}>
      <Text style={styles.columnHeader}>{isLocalColumn ? "LOCALES" : "VISITANTES"}</Text>
      {CATEGORIES.map((cat) => {
        const field = isLocalColumn ? `${cat.key}L` : cat.key;
        const subtotalItem = (Number(ingreso[field]) || 0) * (Number(allPrecios[field]) || 0);

        return (
          <View key={field} style={[styles.card, !isLocalColumn && styles.cardVisitantes]}>
            <Text style={styles.cardLabel}>{cat.label}</Text>
            <Text style={styles.subtotalText}>$ {subtotalItem.toLocaleString()}</Text>
            <View style={styles.controls}>
              <TouchableOpacity onPress={() => setIngreso({ ...ingreso, [field]: Math.max(0, (Number(ingreso[field]) || 0) - 1) })}>
                <Ionicons name="remove-circle" size={34} color={Colors.DBLUE} />
              </TouchableOpacity>
              <Text style={styles.countText}>{ingreso[field] || 0}</Text>
              <TouchableOpacity onPress={() => setIngreso({ ...ingreso, [field]: (Number(ingreso[field]) || 0) + 1 })}>
                <Ionicons name="add-circle" size={34} color={Colors.DBLUE} />
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView style={styles.container}>
          <TouchableOpacity onPress={handleBackToInfo} style={styles.backButton}>
            <Ionicons name="chevron-back-circle-outline" size={22} color={Colors.DBLUE} />
            <Text style={styles.backButtonText}>ATRAS</Text>
          </TouchableOpacity>
          <View style={styles.row}>
            {renderCounterColumn(false)}
            {renderCounterColumn(true)}
          </View>

          <View style={styles.row}>
            <View style={styles.column}>
              <View style={[styles.card, styles.cardVisitantes]}>
                <Text style={styles.cardLabel}>MOTORHOME</Text>
                <Text style={styles.subtotalText}>
                  $ {((Number(ingreso.adicional) || 0) * (Number(allPrecios.adicional) || 0)).toLocaleString()}
                </Text>
                <View style={styles.controls}>
                  <TouchableOpacity onPress={() => setIngreso({ ...ingreso, adicional: Math.max(0, (Number(ingreso.adicional) || 0) - 1) })}>
                    <Ionicons name="remove-circle" size={34} color={Colors.DBLUE} />
                  </TouchableOpacity>
                  <Text style={styles.countText}>{ingreso.adicional || 0}</Text>
                  <TouchableOpacity onPress={() => setIngreso({ ...ingreso, adicional: (Number(ingreso.adicional) || 0) + 1 })}>
                    <Ionicons name="add-circle" size={34} color={Colors.DBLUE} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>MOTORHOME</Text>
                <Text style={styles.subtotalText}>
                  $ {((Number(ingreso.adicionalL) || 0) * (Number(allPrecios.adicionalL) || 0)).toLocaleString()}
                </Text>
                <View style={styles.controls}>
                  <TouchableOpacity onPress={() => setIngreso({ ...ingreso, adicionalL: Math.max(0, (Number(ingreso.adicionalL) || 0) - 1) })}>
                    <Ionicons name="remove-circle" size={34} color={Colors.DBLUE} />
                  </TouchableOpacity>
                  <Text style={styles.countText}>{ingreso.adicionalL || 0}</Text>
                  <TouchableOpacity onPress={() => setIngreso({ ...ingreso, adicionalL: (Number(ingreso.adicionalL) || 0) + 1 })}>
                    <Ionicons name="add-circle" size={34} color={Colors.DBLUE} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.estacionamientoCard}>
            <View style={styles.estacionamientoHeader}>
              <Text style={styles.estacionamientoLabel}>ESTACIONAMIENTO</Text>
              <Text style={styles.estacionamientoPrice}>$ {Number(allPrecios.estacionamiento || 0).toLocaleString()}</Text>
              <Checkbox
                style={styles.estacionamientoCheckbox}
                color={Colors.DBLUE}
                value={!!ingreso?.estacionamiento}
                onValueChange={(val) =>
                  setIngreso({
                    ...ingreso,
                    estacionamiento: val,
                    trekking: val ? ingreso.trekking : false,
                    kayak: val ? ingreso.kayak : false,
                    embarcado: val ? ingreso.embarcado : false,
                  })
                }
              />
            </View>
            <View style={styles.estacionamientoOptions}>
              <View style={styles.estacionamientoOption}>
                <Checkbox
                  style={styles.estacionamientoCheckbox}
                  color={Colors.DBLUE}
                  value={!!ingreso?.trekking}
                  onValueChange={(val) =>
                    ingreso.estacionamiento && setIngreso({ ...ingreso, trekking: val })
                  }
                  disabled={!ingreso.estacionamiento}
                />
                <Text style={styles.estacionamientoOptionLabel}>Trekking</Text>
              </View>
              <View style={styles.estacionamientoOption}>
                <Checkbox
                  style={styles.estacionamientoCheckbox}
                  color={Colors.DBLUE}
                  value={!!ingreso?.kayak}
                  onValueChange={(val) =>
                    ingreso.estacionamiento && setIngreso({ ...ingreso, kayak: val })
                  }
                  disabled={!ingreso.estacionamiento}
                />
                <Text style={styles.estacionamientoOptionLabel}>Kayak</Text>
              </View>
              <View style={styles.estacionamientoOption}>
                <Checkbox
                  style={styles.estacionamientoCheckbox}
                  color={Colors.DBLUE}
                  value={!!ingreso?.embarcado}
                  onValueChange={(val) =>
                    ingreso.estacionamiento && setIngreso({ ...ingreso, embarcado: val })
                  }
                  disabled={!ingreso.estacionamiento}
                />
                <Text style={styles.estacionamientoOptionLabel}>Embarcado</Text>
              </View>
            </View>
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryText}>Pax Vis: <Text style={styles.bold}>{counts.visitantes}</Text></Text>
            <Text style={styles.summaryText}>Pax Loc: <Text style={styles.bold}>{counts.locales}</Text></Text>
          </View>

          <View style={[styles.totalRow, { marginTop: 10, borderTopWidth: 1, borderTopColor: '#ccc', paddingTop: 30, paddingBottom: 30 }]}>
            <Text style={styles.grandTotalLabel}>ESTADÍA ({estadiaLabel})</Text>
            <Text style={styles.grandTotalValue}>{ingreso.estadia?.toString() || 1} {estadiaUnitLower}</Text>
          </View>


          <View style={styles.section}>
            <Text style={styles.label}>DESCUENTO (%)</Text>
            <TextInput
              keyboardType="numeric"
              style={styles.input}
              placeholder="0"
              value={ingreso.descuento?.toString()}
              onChangeText={(val) => setIngreso({ ...ingreso, descuento: parseFloat(val) || 0 })}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>MEDIO DE PAGO</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={ingreso.medio_de_pago}
                onValueChange={(val) => setIngreso({ ...ingreso, medio_de_pago: val })}
              >
                <Picker.Item label="Seleccione..." value={null} />
                {mediosDePago.map(m => <Picker.Item key={m.codigo} label={m.descripcion} value={m.codigo} />)}
              </Picker>
            </View>
          </View>

          <View style={styles.totalBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal General:</Text>
              <Text style={styles.totalValue}>$ {subtotalGeneral.toLocaleString()}</Text>
            </View>
            {Number(ingreso.descuento) > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Descuento ({ingreso.descuento}%):</Text>
                <Text style={[styles.totalValue, { color: 'red' }]}>- $ {montoDescuento.toLocaleString()}</Text>
              </View>
            )}
            <View style={[styles.totalRow, { marginTop: 10, borderTopWidth: 1, borderTopColor: '#ccc', paddingTop: 10 }]}>
              <Text style={styles.grandTotalLabel}>TOTAL FINAL</Text>
              <Text style={styles.grandTotalValue}>$ {totalFinal.toLocaleString()}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onSave}
            style={[styles.btnSave, { backgroundColor: (ingreso.medio_de_pago) ? Colors.DBLUE : '#ccc' }]}
          >
            <Ionicons name="print-outline" size={24} color="white" />
            <Text style={styles.btnSaveText}>GUARDAR E IMPRIMIR</Text>
          </TouchableOpacity>

          <View style={{ height: 60 }} />
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 10 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  column: { flex: 1, marginHorizontal: 4 },
  columnHeader: { textAlign: 'center', fontSize: 13, fontWeight: 'bold', color: Colors.DBLUE, marginBottom: 8 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 10, marginBottom: 12, elevation: 3 },
  cardVisitantes: { backgroundColor: '#e9f7e5', borderLeftWidth: 3, borderLeftColor: Colors.GREEN },
  cardLabel: { fontSize: 10, color: '#888', fontWeight: 'bold', textTransform: 'uppercase' },
  subtotalText: { fontSize: 14, fontWeight: 'bold', color: '#333', marginVertical: 4 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  countText: { fontSize: 18, fontWeight: 'bold', minWidth: 25, textAlign: 'center' },
  summaryBox: { flexDirection: 'row', justifyContent: 'space-around', padding: 12, backgroundColor: '#fff', borderRadius: 10, marginVertical: 8, borderWidth: 1, borderColor: '#eee' },
  summaryText: { fontSize: 14, color: '#555' },
  bold: { fontWeight: 'bold', color: Colors.DBLUE },
  section: { marginVertical: 8 },
  label: { fontSize: 13, fontWeight: 'bold', color: '#444', marginBottom: 5 },
  input: { backgroundColor: 'white', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#ddd', fontSize: 16 },
  pickerContainer: { backgroundColor: 'white', borderRadius: 10, borderWidth: 1, borderColor: '#ddd', overflow: 'hidden' },
  totalBox: { backgroundColor: '#fff', padding: 15, borderRadius: 15, marginVertical: 15, borderWidth: 1, borderColor: '#dbeafe' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  totalLabel: { fontSize: 14, color: '#666' },
  totalValue: { fontSize: 14, fontWeight: 'bold' },
  grandTotalLabel: { fontSize: 16, fontWeight: 'bold', color: Colors.DBLUE },
  grandTotalValue: { fontSize: 22, fontWeight: 'bold', color: Colors.DBLUE },
  estacionamientoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 10, marginTop: 6, borderWidth: 1, borderColor: '#eee' },
  estacionamientoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  estacionamientoLabel: { fontSize: 12, fontWeight: 'bold', color: '#444' },
  estacionamientoPrice: { fontSize: 12, fontWeight: 'bold', color: '#333' },
  estacionamientoCheckbox: { padding: 6, borderRadius: 5 },
  estacionamientoOptions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  estacionamientoOption: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  estacionamientoOptionLabel: { fontSize: 12, color: '#555' },
  btnSave: { flexDirection: 'row', height: 60, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginVertical: 10 },
  btnSaveText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  backButtonText: { color: Colors.DBLUE, fontSize: 14, fontWeight: 'bold' }
});



