import { useState, useEffect, useContext, useCallback } from "react";
import { Alert, Text, TouchableOpacity, View, TextInput, ScrollView, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, StyleSheet, BackHandler } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/styles/Colors";

import { newOrderStyles } from "@/styles/OrderStyle";
import { newTaskStyles } from "@/styles/TaskStyle";

import InputDate from "@/components/InputDate";
import SelectItem from "@/components/SelectItem";

import { formatDate } from "@/utils/Utils";
import { IngresoContext } from "@/context/IngresoContext";
import { router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useConfigDb } from "@/db/useConfigDb";
import { useClienteDb } from "@/db/useClienteDb";
import { useFocusEffect } from "@react-navigation/native";
import { useNetInfo } from "@react-native-community/netinfo";

export default function New() {
  const configDb = useConfigDb();
  const clienteDb = useClienteDb();
  const netInfo = useNetInfo();

  const {
    ingreso, setIngreso,
    ingresoDate, setIngresoDate,
    ingresoString, setIngresoString,
    showIngreso, setShowIngreso,
    egresoDate, setEgresoDate,
    egresoString, setEgresoString,
    showEgreso, setShowEgreso,
    dniRef, nombreRef, parcelaRef, nacionalidadRef, direccionRef, ciudadRef, telefonoRef, patenteRef, modeloRef, observacionesRef,
    dniRefresh, nombreRefresh, parcelaRefresh, nacionalidadRefresh, direccionRefresh, ciudadRefresh, telefonoRefresh, patenteRefresh, modeloRefresh, observacionesRefresh,
    refreshDniInput,
    handleDniSubmit, handleNombreSubmit, handleParcelaSubmit, handleNacionalidadSubmit, handleDireccionSubmit, handleCiudadSubmit, handleTelefonoSubmit, handlePatenteSubmit, handleModeloSubmit, handleObservacionesSubmit,
    isEditIngreso, markOut, anulled, handleDeleteIngreso
  } = useContext(IngresoContext);

  const [clientes, setClientes] = useState([]);
  const [clientesLoading, setClientesLoading] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState("");
  const [dniInput, setDniInput] = useState("");
  const CLIENTE_LOOKUP_ENDPOINT = "ingresos/clientes";

  const searchCliente = (dni) => {
    setDniInput(dni);
    setIngreso({ ...ingreso, dni });
  };

  const handleDniBlur = async () => {
    const dniValue = dniInput || ingreso?.dni;
    if (!dniValue) return;
    await fetchClienteData(dniValue);
  };

  const handleDniSearchPress = async () => {
    const dniValue = dniInput || ingreso?.dni;
    if (!dniValue) {
      Alert.alert("Atención", "Debe ingresar el DNI del cliente.");
      refreshDniInput();
      setTimeout(() => {
        dniRef?.current?.focus();
      }, 300);
      return;
    }

    // Reset local lookup state to avoid stale input/suggestions
    setClientes([]);
    setSelectedCliente("");
    refreshDniInput();
    await fetchClienteData(dniValue);
  };

  const readField = (obj, ...keys) => {
    for (const key of keys) {
      const value = obj?.[key];
      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }
    return undefined;
  };

  const fetchClienteData = async (dniSeleccionado) => {
    setClientesLoading(true);

    try {
      const [localCliente] = await clienteDb.findByDni(dniSeleccionado);

      if (localCliente) {
        const updates = {
          apellido_nombre: localCliente.apellido_nombre,
          dni: localCliente.dni?.toString(),
          nacionalidad: localCliente.nacionalidad,
          direccion: localCliente.direccion,
          ciudad: localCliente.ciudad,
          patente: localCliente.patente,
          modelo_vehiculo: localCliente.modelo_vehiculo,
          telefono: localCliente.telefono,
        };

        setIngreso((prev) => ({ ...prev, ...updates }));
        setClientes([]);
        Keyboard.dismiss();
        return;
      }

      if (!netInfo.isConnected) {
        Alert.alert("Sin conexión", "No hay internet para buscar el cliente en el servidor.");
        return;
      }

      const [apiRow] = await configDb.getConfigValue("api_uri");
      const [tokenRow] = await configDb.getConfigValue("TOKEN");
      const envApiUri = process.env.EXPO_PUBLIC_API_URI;
      const apiUri = (apiRow?.valor?.trim() || envApiUri?.trim());
      const token = tokenRow?.valor?.trim();

      if (!apiUri || !token) return;
      if (!apiRow?.valor && envApiUri) {
        await configDb.setConfigValue("api_uri", envApiUri);
      }

      const baseUrl = apiUri.endsWith("/") ? apiUri : `${apiUri}/`;
      const endpoint = `${CLIENTE_LOOKUP_ENDPOINT}?dni=${encodeURIComponent(dniSeleccionado)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (!response.ok) return;

      const payload = await response.json();
      const data = payload?.data ?? payload;
      const cliente = Array.isArray(data) ? data[0] : data;

      if (!cliente || cliente.error) return;

      const updates = {};
      const dniValue = readField(cliente, "dni", "Dni");
      const apellidoNombre = readField(cliente, "apellido_nombre", "ApellidoNombre");
      const nacionalidad = readField(cliente, "nacionalidad", "Nacionalidad");
      const direccion = readField(cliente, "direccion", "Direccion");
      const ciudad = readField(cliente, "ciudad", "Ciudad");
      const patente = readField(cliente, "patente", "Patente");
      const modeloVehiculo = readField(cliente, "modelo_vehiculo", "ModeloVehiculo");
      const telefono = readField(cliente, "telefono", "Telefono");
      const parcela = readField(cliente, "parcela", "Parcela");

      if (dniValue !== undefined) updates.dni = dniValue.toString();
      if (apellidoNombre !== undefined) updates.apellido_nombre = apellidoNombre;
      if (nacionalidad !== undefined) updates.nacionalidad = nacionalidad;
      if (direccion !== undefined) updates.direccion = direccion;
      if (ciudad !== undefined) updates.ciudad = ciudad;
      if (patente !== undefined) updates.patente = patente;
      if (modeloVehiculo !== undefined) updates.modelo_vehiculo = modeloVehiculo;
      if (telefono !== undefined) updates.telefono = telefono;
      if (parcela !== undefined) updates.parcela = parcela;

      if (Object.keys(updates).length > 0) {
        setIngreso((prev) => ({ ...prev, ...updates }));
        setClientes([]);
        Keyboard.dismiss();
        try {
          const dniString = (dniValue ?? dniSeleccionado ?? "").toString();
          const dbPayload = {
            id: 0,
            apellido_nombre: apellidoNombre ?? "",
            dni: dniString,
            nacionalidad: nacionalidad ?? "",
            direccion: direccion ?? "",
            modelo_vehiculo: modeloVehiculo ?? "",
            ciudad: ciudad ?? "",
            patente: patente ?? "",
            telefono: telefono ?? "",
          };
          const existing = await clienteDb.findByDni(dniString);
          if (existing?.length) {
            await clienteDb.update({ ...dbPayload, id: existing[0].id });
          } else if (dniString) {
            await clienteDb.create(dbPayload);
          }
        } catch (e) {
          // Best-effort cache to avoid repeated remote lookup alerts.
        }
        Alert.alert("Encontrado en servidor", "Se encontró el cliente en la API. Recordá sincronizar los últimos datos.");
      }
    } catch (error) {
      if (error?.name === "AbortError") {
        Alert.alert("Conexión lenta", "La búsqueda en el servidor tardó demasiado. Intente nuevamente.");
      } else {
        Alert.alert("Error", "No se pudo buscar el cliente en el servidor.");
      }
    } finally {
      setClientesLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCliente) {
      fetchClienteData(selectedCliente);
    }
  }, [selectedCliente]);

  const handleChangeIngreso = (event, selectedDate) => {
    setShowIngreso(false);
    if (!selectedDate) return;
    setIngresoDate(selectedDate);
    setIngresoString(formatDate(selectedDate, true));
    if (selectedDate > egresoDate) {
      setEgresoDate(selectedDate);
      setEgresoString(formatDate(selectedDate, true));
    }
  };

  const handleChangeEgreso = (event, selectedDate) => {
    if (event.type === "dismissed") {
      setShowEgreso(false);
      return;
    }
    const currentDate = selectedDate || egresoDate;
    setShowEgreso(false);
    const inicio = new Date(ingresoDate);
    const finSinHora = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const inicioSinHora = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
    const dias = Math.round((finSinHora.getTime() - inicioSinHora.getTime()) / (1000 * 60 * 60 * 24));
    const estadiaFinal = dias <= 0 ? 1 : dias;
    setEgresoDate(currentDate);
    setEgresoString(formatDate(currentDate, true));
    setIngreso({
      ...ingreso,
      egreso: formatDate(currentDate, true),
      ingreso: ingresoString,
      estadia: estadiaFinal
    });
  };

  const handleNextStep = () => {
    if (!egresoString) {
      Alert.alert("Atención", "Debe completar la fecha de Egreso.");
      return;
    }
    router.replace("/ingresos/next");
  };

  const handleBackToMenu = () => {
    router.replace("/(tabs)");
  };
  useFocusEffect(useCallback(() => {
    const onBackPress = () => {
      router.replace("/(tabs)");
      return true;
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => subscription.remove();
  }, []));

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="height" keyboardVerticalOffset={100}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={handleBackToMenu} style={styles.backButton}>
            <Ionicons name="chevron-back-circle-outline" color={Colors.DBLUE} size={22} />
            <Text style={styles.backButtonText}>ATRAS</Text>
          </TouchableOpacity>
          
          {isEditIngreso && ingreso.egresar === 0 &&
            <TouchableOpacity onPress={markOut} style={[newOrderStyles.btnOptions, newOrderStyles.btnOut, { width: '100%', marginBottom: 15 }]}>
              <Ionicons name="log-out-outline" color="white" size={18} />
              <Text style={newOrderStyles.textBtnOptions}>Marcar egreso</Text>
            </TouchableOpacity>
          }

          <View style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 5 }}>
                <InputDate fullWidth={true} title="Ingreso" value={ingresoString} callback={() => setShowIngreso(true)} />
              </View>
              <View style={{ flex: 1, marginLeft: 5 }}>
                <InputDate fullWidth={true} title="Egreso" value={egresoString} callback={() => setShowEgreso(true)} />
              </View>
            </View>

          </View>

          {showIngreso && <DateTimePicker value={ingresoDate} mode="date" display="default" minimumDate={new Date()} onChange={handleChangeIngreso} />}
          {showEgreso && <DateTimePicker value={egresoDate} mode="date" display="default" minimumDate={ingresoDate} onChange={handleChangeEgreso} />}

          <View style={styles.card}>
            <SelectItem
              title="DNI"
              placeholder="Buscar DNI..."
              data={[]}
              defaultValue={ingreso?.dni}
              saveState={setSelectedCliente}
              valueState={selectedCliente}
              resetDataFn={setClientes}
              fieldCode="dni"
              fieldName="dni"
              changeTextFn={searchCliente}
              keyboardType="numeric"
              inputKey={dniRefresh}
              inputRef={dniRef}
              onSubmitEditingFn={handleDniSubmit}
              isLoading={clientesLoading}
              onBlurFn={handleDniBlur}
              hideSuggestions={true}
            />
            <TouchableOpacity
              onPress={handleDniSearchPress}
              disabled={clientesLoading}
              style={[
                newOrderStyles.btnOptions,
                styles.dniSearchButton,
                { backgroundColor: clientesLoading ? "#ccc" : Colors.DBLUE }
              ]}
            >
              <Ionicons name="search-outline" color="white" size={18} />
              <Text style={newOrderStyles.textBtnOptions}>BUSCAR DNI</Text>
            </TouchableOpacity>

            <View style={styles.inputGroup}>
              <Text style={newTaskStyles.label}>Nombre y Apellido</Text>
              <TextInput
                value={ingreso?.apellido_nombre}
                onChangeText={(t) => setIngreso({ ...ingreso, apellido_nombre: t })}
                style={newTaskStyles.textInput}
                placeholder="Nombre completo"
                ref={nombreRef}
                onSubmitEditing={handleNombreSubmit}
                key={nombreRefresh}
              />
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 5 }}>
                <Text style={newTaskStyles.label}>Nacionalidad</Text>
                <TextInput
                  value={ingreso?.nacionalidad}
                  onChangeText={(t) => setIngreso({ ...ingreso, nacionalidad: t })}
                  style={newTaskStyles.textInput}
                  ref={nacionalidadRef}
                  onSubmitEditing={handleNacionalidadSubmit}
                  key={nacionalidadRefresh}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 5 }}>
                <Text style={newTaskStyles.label}>Parcela N°</Text>
                <TextInput
                  value={ingreso?.parcela}
                  onChangeText={(t) => setIngreso({ ...ingreso, parcela: t })}
                  style={newTaskStyles.textInput}
                  keyboardType="numeric"
                  ref={parcelaRef}
                  onSubmitEditing={handleParcelaSubmit}
                  key={parcelaRefresh}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={newTaskStyles.label}>Dirección</Text>
              <TextInput
                value={ingreso?.direccion}
                onChangeText={(t) => setIngreso({ ...ingreso, direccion: t })}
                style={newTaskStyles.textInput}
                ref={direccionRef}
                onSubmitEditing={handleDireccionSubmit}
                key={direccionRefresh}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={newTaskStyles.label}>Ciudad</Text>
              <TextInput
                value={ingreso?.ciudad}
                onChangeText={(t) => setIngreso({ ...ingreso, ciudad: t })}
                style={newTaskStyles.textInput}
                ref={ciudadRef}
                onSubmitEditing={handleCiudadSubmit}
                key={ciudadRefresh}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={newTaskStyles.label}>Telefono</Text>
              <TextInput
                value={ingreso?.telefono}
                onChangeText={(t) => setIngreso({ ...ingreso, telefono: t })}
                style={newTaskStyles.textInput}
                keyboardType="phone-pad"
                ref={telefonoRef}
                onSubmitEditing={handleTelefonoSubmit}
                key={telefonoRefresh}
                returnKeyType="next"
              />
            </View>

          </View>

          <View style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 5 }}>
                <Text style={newTaskStyles.label}>Patente</Text>
                <TextInput
                  value={ingreso?.patente}
                  onChangeText={(t) => setIngreso({ ...ingreso, patente: t })}
                  style={newTaskStyles.textInput}
                  ref={patenteRef}
                  onSubmitEditing={handlePatenteSubmit}
                  key={patenteRefresh}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 5 }}>
                <Text style={newTaskStyles.label}>Modelo Vehículo</Text>
                <TextInput
                  value={ingreso?.modelo_vehiculo}
                  onChangeText={(t) => setIngreso({ ...ingreso, modelo_vehiculo: t })}
                  style={newTaskStyles.textInput}
                  ref={modeloRef}
                  onSubmitEditing={handleModeloSubmit}
                  key={modeloRefresh}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={newTaskStyles.label}>Observaciones</Text>
              <TextInput
                value={ingreso?.observaciones}
                onChangeText={(t) => setIngreso({ ...ingreso, observaciones: t })}
                style={[newTaskStyles.textInput, { height: 60 }]}
                multiline
                ref={observacionesRef}
                key={observacionesRefresh}
              />
            </View>
          </View>

          <TouchableOpacity onPress={handleNextStep} style={[newOrderStyles.btnOptions, newOrderStyles.btnSave, styles.nextButton]}>
            <Ionicons name="chevron-forward-circle-outline" color="white" size={20} />
            <Text style={newOrderStyles.textBtnOptions}>SIGUIENTE</Text>
          </TouchableOpacity>

          {isEditIngreso && (
            <View style={styles.actionContainer}>
              <TouchableOpacity onPress={anulled} style={newTaskStyles.btnAnnulled}>
                <Ionicons name="ban-outline" size={18} color="white" />
                <Text style={newOrderStyles.textBtnOptions}>Anular</Text>
              </TouchableOpacity>
              {!ingreso.sincronizado && (
                <TouchableOpacity onPress={handleDeleteIngreso} style={newTaskStyles.btnDelete}>
                  <Ionicons name="trash-outline" size={18} color="white" />
                  <Text style={newOrderStyles.textBtnOptions}>Eliminar</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 12 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  inputGroup: { marginTop: 12 },
  dniSearchButton: { width: "100%", marginTop: 8, borderRadius: 8 },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  backButtonText: { color: Colors.DBLUE, fontSize: 14, fontWeight: "bold" },
  nextButton: {
    width: '100%', 
    height: 60, 
    borderRadius: 12, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: Colors.DBLUE,
    marginTop: 5
  },
  actionContainer: { flexDirection: 'row', gap: 10, marginTop: 15 }
});









