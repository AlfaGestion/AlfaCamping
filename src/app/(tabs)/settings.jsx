
import { useEffect, useContext, useState } from "react"
import { View, StyleSheet, Text, TextInput, ActivityIndicator, ScrollView, TouchableOpacity, Alert, Modal } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Constants from "expo-constants"
import { Ionicons } from "@expo/vector-icons"
import { ConfigContext } from "@/context/ConfigContext"
import { IngresoContext } from "@/context/IngresoContext";

import { useRouter } from "expo-router"
import { useConfigDb } from "@/db/useConfigDb"
import { usePreciosDb } from "@/db/usePreciosDb"
import { useMediosDePagoDb } from "@/db/useMediosDePagoDb"
import { useIngresoDb } from "@/db/useIngresoDb"
import { useClienteDb } from "@/db/useClienteDb"
import { useNetInfo } from "@react-native-community/netinfo";
import { useApi } from "@/hooks/useApi"

import { newTaskStyles } from "@/styles/TaskStyle"
import { newOrderStyles } from "@/styles/OrderStyle"
import Toast from "react-native-toast-message"

export default function Settings() {
  const router = useRouter()
  const netInfo = useNetInfo();
  const appVersion =
    process.env.EXPO_PUBLIC_APP_LABEL_VERSION
    ?? Constants.expoConfig?.version
    ?? Constants.manifest?.version
    ?? "dev";
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetPassword, setResetPassword] = useState("")
  const [resetError, setResetError] = useState("")
  const [showSyncModal, setShowSyncModal] = useState(false)
  const [syncDone, setSyncDone] = useState(false)
  const [syncSteps, setSyncSteps] = useState({
    config: "pending",
    precios: "pending",
    medios: "pending",
    clientes: "pending",
  })
  const [preciosEnCero, setPreciosEnCero] = useState(false)
  const [hasBackup, setHasBackup] = useState(false)

  const {
    isLoading: isLoadingIngresos,
    fetchPrecios, fetchMediosDePago, list: listIngresos, setPrecios, setMediosDePago,
    restorePreciosFromBackup, restoreMediosDePagoFromBackup, hasPreciosBackup, hasMediosBackup,
  } = useContext(IngresoContext);

  const {
    config, setConfig,
    isLoading, setIsLoading,

    id, setId,
    apiUri, setApiUri,
    username, setUsername,
    password, setPassword,
    customerId, setCustomerId,
    databaseId, setDatabaseId,
    printerIp, setPrinterIp,
    printOffsetMm, setPrintOffsetMm,

    apiRef, userRef, passRef, customerRef, dbRef,
    apiRefresh, userRefresh, passRefresh, customerRefresh, dbRefresh,
    handleURISubmit, handleUserSubmit, handlePassSubmit, handleCustomerSubmit, handleDbSubmit
  } = useContext(ConfigContext)

  const configDb = useConfigDb()
  const preciosDb = usePreciosDb()
  const mediosDb = useMediosDePagoDb()
  const ingresoDb = useIngresoDb()
  const clienteDb = useClienteDb()
  const { fetchDataFromApi } = useApi()

  const readField = (obj, ...keys) => {
    for (const key of keys) {
      const value = obj?.[key]
      if (value !== undefined && value !== null && value !== "") {
        return value
      }
    }
    return undefined
  }

  const syncClientesIngresos = async () => {
    const endpoints = ["ingresos/clientes", "ObtenerClientes"]
    let response = null

    for (const endpoint of endpoints) {
      response = await fetchDataFromApi(endpoint)
      if (response && !response?.error) break
    }

    if (!response || response?.error) {
      throw new Error(response?.message ?? "Respuesta invÃ¡lida")
    }

    const payload = response?.data ?? response
    const clientes = Array.isArray(payload) ? payload : (payload?.data ?? [])

    if (!Array.isArray(clientes) || clientes.length === 0) {
      return
    }

    await clienteDb.deleteAll()

    for (const item of clientes) {
      const dni = readField(item, "dni", "Dni")
      if (!dni) continue

      await clienteDb.create({
        apellido_nombre: readField(item, "apellido_nombre", "ApellidoNombre") || "",
        dni: dni.toString(),
        nacionalidad: readField(item, "nacionalidad", "Nacionalidad") || "",
        direccion: readField(item, "direccion", "Direccion") || "",
        modelo_vehiculo: readField(item, "modelo_vehiculo", "ModeloVehiculo") || "",
        ciudad: readField(item, "ciudad", "Ciudad") || "",
        patente: readField(item, "patente", "Patente") || "",
        telefono: readField(item, "telefono", "Telefono") || "",
      })
    }
  }

  const list = async ({ showSync = false } = {}) => {
    if (showSync) {
      setSyncSteps({ config: "pending", precios: "pending", medios: "pending", clientes: "pending" })
      setSyncDone(false)
      setShowSyncModal(true)
    } else {
      setIsLoading(true)
    }

    try {
      if (showSync) setSyncSteps(prev => ({ ...prev, config: "loading" }))
      const response = await configDb.fetchConfig()
      setConfig(response)
      console.info("CONFIG_KEYS:", (response || []).map(r => r.clave))
      if (showSync) setSyncSteps(prev => ({ ...prev, config: "done" }))

      if (showSync) {
        await configDb.setConfigValue("TOKEN", "")

        setSyncSteps(prev => ({ ...prev, precios: "loading" }))
        try {
          const preciosOk = await fetchPrecios()
          if (!preciosOk) {
            setSyncSteps(prev => ({ ...prev, precios: "error", medios: "error", clientes: "error" }))
            setSyncDone(true)
            return
          }
          setSyncSteps(prev => ({ ...prev, precios: "done" }))
        } catch (e) {
          console.error(e)
          setSyncSteps(prev => ({ ...prev, precios: "error", medios: "error", clientes: "error" }))
          setSyncDone(true)
          return
        }

        setSyncSteps(prev => ({ ...prev, medios: "loading" }))
        try {
          const mediosOk = await fetchMediosDePago()
          if (!mediosOk) {
            setSyncSteps(prev => ({ ...prev, medios: "error", clientes: "error" }))
            setSyncDone(true)
            return
          }
          setSyncSteps(prev => ({ ...prev, medios: "done" }))
        } catch (e) {
          console.error(e)
          setSyncSteps(prev => ({ ...prev, medios: "error", clientes: "error" }))
          setSyncDone(true)
          return
        }

        setSyncSteps(prev => ({ ...prev, clientes: "loading" }))
        try {
          await syncClientesIngresos()
          setSyncSteps(prev => ({ ...prev, clientes: "done" }))
        } catch (e) {
          console.error(e)
          setSyncSteps(prev => ({ ...prev, clientes: "error" }))
        }
      }
      // console.log(response)
    } catch (error) {
      console.error(error)
      Alert.alert('Error', 'No se ha podido obtener la configuraciÃ³n.')
      if (showSync) {
        setSyncSteps(prev => ({
          ...prev,
          config: prev.config === "loading" ? "error" : prev.config,
          precios: prev.precios === "loading" ? "error" : prev.precios,
          medios: prev.medios === "loading" ? "error" : prev.medios,
          clientes: prev.clientes === "loading" ? "error" : prev.clientes,
        }))
      }
    } finally {
      if (showSync) {
        setSyncDone(true)
      } else {
        setIsLoading(false)
      }
    }
  }

  const handleRestoreBackup = async () => {
    const [hasP, hasM] = await Promise.all([hasPreciosBackup(), hasMediosBackup()]);
    if (!hasP && !hasM) {
      return Alert.alert("Atención", "No hay backup para restaurar.");
    }

    const restoredPrices = await restorePreciosFromBackup();
    const restoredMedios = await restoreMediosDePagoFromBackup();
    if (restoredPrices || restoredMedios) {
      Toast.show({
        type: "success",
        text1: "Backup restaurado",
        text2: "Se recuperaron precios y medios de pago.",
        visibilityTime: 1777,
        position: "bottom",
        bottomOffset: 120,
        text1Style: { fontFamily: "Poppins-Bold", fontSize: 15 },
        text2Style: { fontFamily: "Poppins-Regular", fontSize: 13 },
        swipeable: true,
      })
    }
  }

  const createOrUpdate = async () => {
    setIsLoading(true)

    try {
      if (isNaN(Number(customerId))) {
        return Alert.alert('Error', 'El ID de cliente debe ser un número.')
      } else if (isNaN(Number(databaseId))) {
        return Alert.alert('Error', 'El ID de la base de datos debe ser un número.')
      }

      await configDb.createOrUpdate({ clave: 'api_uri', valor: apiUri })
      await configDb.createOrUpdate({ clave: 'username', valor: username })
      await configDb.createOrUpdate({ clave: 'password', valor: password })
      await configDb.createOrUpdate({ clave: 'customer_id', valor: customerId })
      await configDb.createOrUpdate({ clave: 'database_id', valor: databaseId })
      await configDb.createOrUpdate({ clave: 'cfg_impresora_barrera_1', valor: printerIp })
      await configDb.createOrUpdate({ clave: 'print_offset_mm', valor: printOffsetMm })
      await configDb.setConfigValue("TOKEN", "")

      list()

      Toast.show({
        type: 'success',
        text1: 'Grabado exitoso',
        text2: 'Su configuración fue grabada con éxito.',
        visibilityTime: 1777,
        position: 'bottom',
        bottomOffset: 120,
        text1Style: { fontFamily: "Poppins-Bold", fontSize: 15 },
        text2Style: { fontFamily: "Poppins-Regular", fontSize: 13 },
        swipeable: true,
      });

    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetDb = () => {
    Alert.alert(
      "Confirmación",
      "Esto borrará todos los datos locales y dejará la base vacía. ¿Desea continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, borrar todo",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true)
            try {
              await ingresoDb.deleteAll()
              await clienteDb.deleteAll()
              await mediosDb.deleteAll()
              await preciosDb.deleteAll()
              setPrecios([])
              setMediosDePago([])

              if (netInfo.isConnected) {
                await configDb.setConfigValue("TOKEN", "")
                await fetchPrecios()
                await fetchMediosDePago()
              }
              await listIngresos()

              Toast.show({
                type: "success",
                text1: "Base vacía creada",
                text2: netInfo.isConnected
                  ? "Se eliminaron todos los datos y se actualizaron los precios."
                  : "Se eliminaron los datos. Conéctese y use 'Traer últimos datos'.",
                visibilityTime: 1777,
                position: "bottom",
                bottomOffset: 120,
                text1Style: { fontFamily: "Poppins-Bold", fontSize: 15 },
                text2Style: { fontFamily: "Poppins-Regular", fontSize: 13 },
                swipeable: true,
              })
            } catch (error) {
              console.error(error)
              Alert.alert("Error", "No se pudo borrar la base de datos.")
            } finally {
              setIsLoading(false)
            }
          }
        }
      ]
    )
  }

  const handleResetRequest = () => {
    setResetPassword("")
    setResetError("")
    setShowResetModal(true)
  }

  const handleResetConfirm = async () => {
    try {
      const [row] = await configDb.getConfigValue("ING_CLAVEVACIARBASE")
      const expected = (row?.valor ?? "Alfa@").toString().trim()
      console.info("ING_CLAVEVACIARBASE:", expected ? "<set>" : "<empty>", expected)
      if (resetPassword !== expected) {
        setResetError("Contraseña incorrecta.")
        return
      }
      setShowResetModal(false)
      handleResetDb()
    } catch (error) {
      console.error(error)
      setResetError("No se pudo validar la contraseña.")
    }
  }

  const fillConfig = () => {
    // console.log('FILLING CONFIG WITH', config)

    const apiUri = config.find(item => item.clave === "api_uri")?.valor
    const username = config.find(item => item.clave === "username")?.valor
    const password = config.find(item => item.clave === "password")?.valor
    const customerId = config.find(item => item.clave === "customer_id")?.valor
    const databaseId = config.find(item => item.clave === "database_id")?.valor
    const printerIp = config.find(item => item.clave === "cfg_impresora_barrera_1")?.valor
    const printOffsetMm = config.find(item => item.clave === "print_offset_mm")?.valor

    setApiUri(apiUri)
    setUsername(username)
    setPassword(password)
    setCustomerId(customerId)
    setDatabaseId(databaseId)
    setPrinterIp(printerIp)
    setPrintOffsetMm(printOffsetMm ?? String(process.env.EXPO_PUBLIC_PRINT_OFFSET_MM ?? 0))
  }

  useEffect(() => {
    fillConfig()
  }, [config])

  useEffect(() => {
    list()
  }, [])

  useEffect(() => {
    let mounted = true
    const checkPrecios = async () => {
      const all = await preciosDb.getAll()
      const enCero = !all || all.length === 0 || all.every(item => !Number(item.precio))
      if (mounted) setPreciosEnCero(enCero)
    }
    checkPrecios()
    return () => { mounted = false }
  }, [preciosDb])

  useEffect(() => {
    let mounted = true
    const checkBackup = async () => {
      const [hasP, hasM] = await Promise.all([hasPreciosBackup(), hasMediosBackup()])
      if (mounted) setHasBackup(Boolean(hasP || hasM))
    }
    checkBackup()
    return () => { mounted = false }
  }, [hasPreciosBackup, hasMediosBackup])

  const hasSyncError = Object.values(syncSteps).some((status) => status === "error")

  return (
    <>
      {/* <View className="absolute top-0 bottom-0 left-0 right-0 bg-black opacity-40" /> */}

      {isLoading
        ?
        <View style={styles.loaderCentered}>
          <ActivityIndicator size="large" className="scale-150" color="#286A73" />
        </View>
        :
        <SafeAreaView styles={[newOrderStyles.mainContainer]}>
          <View style={[newTaskStyles.container]}>
            <ScrollView style={[newTaskStyles.containerScroll]}>

              {/* <Text style={[newTaskStyles.configTitle]}>
                  Configuración
                </Text> */}

              <View style={[newTaskStyles.element]}>
                <Text style={[newTaskStyles.label]}>URL de la API</Text>
                <TextInput
                  key={apiRefresh}
                  style={[newTaskStyles.textInput]}
                  placeholder="URL de la API"
                  value={apiUri}
                  defaultValue={apiUri}
                  onChangeText={setApiUri}
                  clearButtonMode='while-editing'
                  ref={apiRef}
                  // maxLength={25}
                  onSubmitEditing={handleURISubmit}
                  returnKeyType='next'
                  cursorColor="#C0C0C0"
                />
              </View>

              <View style={[newTaskStyles.element]}>
                <Text style={[newTaskStyles.label]}>Usuario</Text>
                <TextInput
                  key={userRefresh}
                  style={[newTaskStyles.textInput]}
                  placeholder="Usuario"
                  value={username}
                  defaultValue={username}
                  onChangeText={setUsername}
                  ref={userRef}
                  // maxLength={25}
                  onSubmitEditing={handleUserSubmit}
                  returnKeyType='next'
                  cursorColor="#C0C0C0"
                />
              </View>

              <View style={[newTaskStyles.element]}>
                <Text style={[newTaskStyles.label]}>Contraseña</Text>
                <TextInput
                  key={passRefresh}
                  style={[newTaskStyles.textInput]}
                  placeholder="Contraseña"
                  value={password}
                  defaultValue={password}
                  onChangeText={setPassword}
                  ref={passRef}
                  // maxLength={25}
                  onSubmitEditing={handlePassSubmit}
                  returnKeyType='next'
                  cursorColor="#C0C0C0"
                />
              </View>

              <View style={[newTaskStyles.element]}>
                <Text style={[newTaskStyles.label]}>ID del Cliente</Text>
                <TextInput
                  key={customerRefresh}
                  style={[newTaskStyles.textInput]}
                  placeholder="ID del Cliente"
                  value={customerId}
                  defaultValue={customerId}
                  onChangeText={setCustomerId}
                  ref={customerRef}
                  // maxLength={25}
                  onSubmitEditing={handleCustomerSubmit}
                  returnKeyType='next'
                  keyboardType='numeric'
                  cursorColor="#C0C0C0"
                />
              </View>

              <View style={[newTaskStyles.element]}>
                <Text style={[newTaskStyles.label]}>ID de la Base de datos</Text>
                <TextInput
                  key={dbRefresh}
                  style={[newTaskStyles.textInput]}
                  placeholder="ID de la Base de datos"
                  value={databaseId}
                  defaultValue={databaseId}
                  onChangeText={setDatabaseId}
                  ref={dbRef}
                  // maxLength={25}
                  onSubmitEditing={() => { handleDbSubmit(createOrUpdate) }}
                  returnKeyType='done'
                  keyboardType='numeric'
                  cursorColor="#C0C0C0"
                />
              </View>

              {/* <View style={[newTaskStyles.element]}>
                <Text style={[newTaskStyles.label]}>IP impresora de la barrera</Text>
                <TextInput
                  key={dbRefresh}
                  style={[newTaskStyles.textInput]}
                  placeholder="IP impresora de la barrera"
                  value={printerIp}
                  defaultValue={printerIp}
                  onChangeText={setPrinterIp}
                  ref={dbRef}
                  // maxLength={25}
                  onSubmitEditing={() => { handleDbSubmit(createOrUpdate) }}
                  returnKeyType='done'
                  keyboardType='numeric'
                  cursorColor="#C0C0C0"
                />
              </View> */}

              <TouchableOpacity
                onPress={() => { createOrUpdate() }}
                style={[
                  { ...newOrderStyles.btnOptions, ...newOrderStyles.btnSave },
                  { width: "100%", marginTop: 10, marginBottom: 10 }
                ]}
              >
                <Ionicons name="save-outline" color="white" size={18} />
                <Text style={[newOrderStyles.textBtnOptions]}>Grabar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => { list({ showSync: true }) }}
                style={[
                  { ...newOrderStyles.btnOptions, ...newOrderStyles.btnSave, ...newOrderStyles.btnData },
                  { width: "100%", marginBottom: 10 }
                ]}
              >
                <Ionicons name="download-outline" color="white" size={18} />
                <Text style={[newOrderStyles.textBtnOptions]}>Traer últimos datos</Text>
              </TouchableOpacity>

              {preciosEnCero && (
                <Text style={[newTaskStyles.label, { marginBottom: 6 }]}>
                  {hasBackup
                    ? "Se encontraron precios en 0. Podés restaurar un backup."
                    : "Se encontraron precios en 0. Debe sincronizar."}
                </Text>
              )}
              {preciosEnCero && hasBackup && (
                <TouchableOpacity
                  onPress={handleRestoreBackup}
                  style={[
                    { ...newOrderStyles.btnOptions, backgroundColor: "#4A90E2" },
                    { width: "100%", marginBottom: 10 }
                  ]}
                >
                  <Ionicons name="refresh" color="white" size={18} />
                  <Text style={[newOrderStyles.textBtnOptions]}>Restaurar backup</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => router.push("/printConfig")}
                style={[
                  { ...newOrderStyles.btnOptions, backgroundColor: '#6B7280' },
                  { width: "100%", marginBottom: 10 }
                ]}
              >
                <Ionicons name="print-outline" color="white" size={18} />
                <Text style={[newOrderStyles.textBtnOptions]}>Configuracion de impresion</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("ingresos/priceSettings")} // O la ruta que definas en expo-router
                style={[
                  { ...newOrderStyles.btnOptions, backgroundColor: '#4A90E2' },
                  { width: "100%", marginBottom: 30 }
                ]}
              >
                <Ionicons name="pricetags-outline" color="white" size={18} />
                <Text style={[newOrderStyles.textBtnOptions]}>Ver precios</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleResetRequest}
                style={[
                  { ...newOrderStyles.btnOptions, ...newOrderStyles.btnCancel },
                  { width: "100%", marginBottom: 30 }
                ]}
              >
                <Ionicons name="trash-outline" color="white" size={18} />
                <Text style={[newOrderStyles.textBtnOptions]}>Crear base de datos vacía</Text>
              </TouchableOpacity>

              <View style={styles.versionContainer}>
                <Text style={styles.versionText}>Version: {appVersion}</Text>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      }

      <Modal
        transparent
        visible={showSyncModal}
        animationType="fade"
        onRequestClose={() => {
          if (syncDone) setShowSyncModal(false)
        }}
      >
        <View style={styles.syncBackdrop}>
          <View style={styles.syncCard}>
            <Text style={styles.syncTitle}>Sincronizando datos</Text>
            <Text style={styles.syncSubtitle}>Este proceso puede tardar unos segundos.</Text>

            <View style={styles.syncRow}>
              <View style={styles.syncIcon}>
                {syncSteps.config === "loading" ? (
                  <ActivityIndicator size="small" color="#286A73" />
                ) : syncSteps.config === "done" ? (
                  <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />
                ) : syncSteps.config === "error" ? (
                  <Ionicons name="close-circle" size={18} color="#D64545" />
                ) : (
                  <Ionicons name="ellipse-outline" size={16} color="#999" />
                )}
              </View>
              <Text style={styles.syncText}>Configuración</Text>
              <Text style={styles.syncStatus}>
                {syncSteps.config === "loading" ? "Sincronizando..." : syncSteps.config === "done" ? "Listo" : syncSteps.config === "error" ? "Error" : "Pendiente"}
              </Text>
            </View>

            <View style={styles.syncRow}>
              <View style={styles.syncIcon}>
                {syncSteps.precios === "loading" ? (
                  <ActivityIndicator size="small" color="#286A73" />
                ) : syncSteps.precios === "done" ? (
                  <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />
                ) : syncSteps.precios === "error" ? (
                  <Ionicons name="close-circle" size={18} color="#D64545" />
                ) : (
                  <Ionicons name="ellipse-outline" size={16} color="#999" />
                )}
              </View>
              <Text style={styles.syncText}>Precios</Text>
              <Text style={styles.syncStatus}>
                {syncSteps.precios === "loading" ? "Sincronizando..." : syncSteps.precios === "done" ? "Listo" : syncSteps.precios === "error" ? "Error" : "Pendiente"}
              </Text>
            </View>

            <View style={styles.syncRow}>
              <View style={styles.syncIcon}>
                {syncSteps.medios === "loading" ? (
                  <ActivityIndicator size="small" color="#286A73" />
                ) : syncSteps.medios === "done" ? (
                  <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />
                ) : syncSteps.medios === "error" ? (
                  <Ionicons name="close-circle" size={18} color="#D64545" />
                ) : (
                  <Ionicons name="ellipse-outline" size={16} color="#999" />
                )}
              </View>
              <Text style={styles.syncText}>Medios de pago</Text>
              <Text style={styles.syncStatus}>
                {syncSteps.medios === "loading" ? "Sincronizando..." : syncSteps.medios === "done" ? "Listo" : syncSteps.medios === "error" ? "Error" : "Pendiente"}
              </Text>
            </View>

            <View style={styles.syncRow}>
              <View style={styles.syncIcon}>
                {syncSteps.clientes === "loading" ? (
                  <ActivityIndicator size="small" color="#286A73" />
                ) : syncSteps.clientes === "done" ? (
                  <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />
                ) : syncSteps.clientes === "error" ? (
                  <Ionicons name="close-circle" size={18} color="#D64545" />
                ) : (
                  <Ionicons name="ellipse-outline" size={16} color="#999" />
                )}
              </View>
              <Text style={styles.syncText}>Clientes</Text>
              <Text style={styles.syncStatus}>
                {syncSteps.clientes === "loading" ? "Sincronizando..." : syncSteps.clientes === "done" ? "Listo" : syncSteps.clientes === "error" ? "Error" : "Pendiente"}
              </Text>
            </View>

            {(syncDone || hasSyncError) && (
              <TouchableOpacity
                style={styles.syncCloseButton}
                onPress={() => setShowSyncModal(false)}
              >
                <Text style={styles.syncCloseText}>Cerrar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={showResetModal}
        animationType="fade"
        onRequestClose={() => setShowResetModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirmar eliminación</Text>
            <Text style={styles.modalText}>Ingrese la contraseña para vaciar la base local.</Text>
            <TextInput
              value={resetPassword}
              onChangeText={setResetPassword}
              placeholder="Contraseña"
              secureTextEntry
              style={styles.modalInput}
              autoFocus
            />
            {resetError ? <Text style={styles.modalError}>{resetError}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowResetModal(false)}
                style={[newOrderStyles.btnOptions, styles.modalBtnCancel]}
              >
                <Text style={newOrderStyles.textBtnOptions}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleResetConfirm}
                style={[newOrderStyles.btnOptions, styles.modalBtnConfirm]}
              >
                <Text style={newOrderStyles.textBtnOptions}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
  },
  loaderCentered: {
    padding: 30,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  syncCard: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
  },
  syncTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    marginBottom: 4,
  },
  syncSubtitle: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: "#666",
    marginBottom: 12,
  },
  syncRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  syncIcon: {
    width: 26,
    alignItems: "center",
    marginRight: 8,
  },
  syncText: {
    flex: 1,
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: "#222",
  },
  syncStatus: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: "#666",
  },
  syncCloseButton: {
    marginTop: 14,
    backgroundColor: "#284473",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  syncCloseText: {
    color: "#fff",
    fontFamily: "Poppins-Bold",
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    marginBottom: 8,
  },
  modalText: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    marginBottom: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontFamily: "Poppins-Regular",
  },
  modalError: {
    color: "red",
    marginTop: 8,
    fontFamily: "Poppins-Regular",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  modalBtnCancel: {
    flex: 1,
    marginRight: 8,
    backgroundColor: "#999",
  },
  modalBtnConfirm: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: "#D64545",
  },
})
