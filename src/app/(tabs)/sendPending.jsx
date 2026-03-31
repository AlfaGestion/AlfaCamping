import { useState, useContext } from "react";
import { View, Text, Image, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNetInfo } from "@react-native-community/netinfo";
import { useIngresoDb } from "@/db/useIngresoDb";
import { useClienteDb } from "@/db/useClienteDb";
import { useApi } from "@/hooks/useApi";
import { IngresoContext } from "@/context/IngresoContext";

import { Ionicons } from "@expo/vector-icons";
import { sendPending } from "@/styles/SyncStyle";
import iconSendPending from "@/icons/send-orders.png";

import SyncItem from "@/components/SyncItem";
import Toast from "react-native-toast-message";

export default function SendPending() {
  const { ingresos, list, update } = useContext(IngresoContext);

  const ingresoDb = useIngresoDb();
  const clienteDb = useClienteDb();
  const netInfo = useNetInfo();
  const { sendDataToApi, fetchDataFromApi } = useApi();

  const [showLoaders, setShowLoaders] = useState(false);
  const [showLoaderIngresos, setShowLoaderIngresos] = useState(true);
  const [showLoaderClientesIngresos, setShowLoaderClientesIngresos] = useState(true);

  const readField = (obj, ...keys) => {
    for (const key of keys) {
      const value = obj?.[key];
      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }
    return undefined;
  };

  const sendIngresos = async () => {
    let ingresos = await ingresoDb.getAll();

    setShowLoaderIngresos(true);

    for (let item of ingresos) {

      let ingresosSend = {
        id: item?.id,
        ingreso: item?.ingreso,
        egreso: item?.egreso,
        dni: item?.dni ? item?.dni : '',
        apellido_nombre: item?.apellido_nombre ? item?.apellido_nombre : '',
        parcela: item?.parcela ? item?.parcela : 0,
        nacionalidad: item?.nacionalidad ? item?.nacionalidad : '',
        direccion: item?.direccion ? item?.direccion : '',
        ciudad: item?.ciudad ? item?.ciudad : '',
        patente: item?.patente ? item?.patente : '',
        modelo_vehiculo: item?.modelo_vehiculo ? item?.modelo_vehiculo : '',

        trekking: item?.trekking ? item?.trekking : false,
        kayak: item?.kayak ? item?.kayak : false,
        embarcado: item?.embarcado ? item?.embarcado : false,
        amarre: item?.amarre ? item?.amarre : false,

        bajada_lancha: item?.bajada_lancha ? item?.bajada_lancha : 0,
        precio_bajada_lancha: item?.precio_bajada_lancha ? item?.precio_bajada_lancha : 0,
        adultos: item?.adultos ? item?.adultos : 0,
        precio_adultos: item?.precio_adultos ? item?.precio_adultos : 0,
        menores: item?.menores ? item?.menores : 0,
        precio_menores: item?.precio_menores ? item?.precio_menores : 0,
        jubilados: item?.jubilados ? item?.jubilados : 0,
        precio_jubilados: item?.precio_jubilados ? item?.precio_jubilados : 0,

        bajada_lanchaL: item?.bajada_lanchaL ? item?.bajada_lanchaL : 0,
        precio_bajada_lanchaL: item?.precio_bajada_lanchaL ? item?.precio_bajada_lanchaL : 0,
        adultosL: item?.adultosL ? item?.adultosL : 0,
        precio_adultosL: item?.precio_adultosL ? item?.precio_adultosL : 0,
        menoresL: item?.menoresL ? item?.menoresL : 0,
        precio_menoresL: item?.precio_menoresL ? item?.precio_menoresL : 0,
        jubiladosL: item?.jubiladosL ? item?.jubiladosL : 0,
        precio_jubiladosL: item?.precio_jubiladosL ? item?.precio_jubiladosL : 0,

        adicional: item?.adicional ? item?.adicional : 0,
        precio_adicional: item?.precio_adicional ? item?.precio_adicional : 0,
        adicionalL: item?.adicionalL ? item?.adicionalL : 0,
        precio_adicionalL: item?.precio_adicionalL ? item?.precio_adicionalL : 0,
        estacionamiento: item?.estacionamiento ? item?.estacionamiento : false,
        precio_estacionamiento: item?.precio_estacionamiento ? item?.precio_estacionamiento : 0,

        observaciones: item?.observaciones ? item?.observaciones : '',

        descuento: item?.descuento ? item?.descuento : 0,
        subtotal: item?.subtotal ? item?.subtotal : 0,
        total: item?.total ? item?.total : 0,
        egresar: item?.egresar ? item?.egresar : false,
        sincronizado: true,
        medio_de_pago: item?.medio_de_pago ? item?.medio_de_pago : '',
        anulado: item?.anulado ? item?.anulado : false
      };


      if (ingresosSend) {
        // console.log("ENVIANDO INGRESO: ", ingresosSend)
        try {
          ingresoDb.update({ ...item, sincronizado: true });
          const response = await sendDataToApi("ingresos/", ingresosSend);

          if (!response?.error) {
            Toast.show({
              type: "success",
              text1: "Pendientes enviados",
              text2: "Los ingresos fueron grabados con éxito.",
              autoHide: true,
              visibilityTime: 2777,
              position: "bottom",
              bottomOffset: 120,
              text1Style: { fontFamily: "Poppins-Bold", fontSize: 15 },
              text2Style: { fontFamily: "Poppins-Regular", fontSize: 13 },
              swipeable: true,
            });
            try {
              // await ingresoDb.deleteAll();
              // await ingresoDb.deleteCompletedEntries();
              // await clienteDb.deleteAll();
            } catch (e) {
              Toast.show({
                type: "error",
                text1: "Error al eliminar los ingresos enviados",
                text2: `No envie nuevamente por que se duplicarían: ${e}`,
                position: "bottom",
                bottomOffset: 130,
                autoHide: false,
                text1Style: { fontFamily: "Poppins-Bold", fontSize: 15 },
                text2Style: { fontFamily: "Poppins-Medium", fontSize: 13 },
              })
            }
          } else {
            Toast.show({
              type: "error",
              text1: "Error al enviar los ingresos",
              text2: `${response.message}`,
              position: "bottom",
              bottomOffset: 130,
              autoHide: false,
              props: { style: { fontFamily: "Poppins-Bold", fontSize: 15 } },
              text1Style: { fontFamily: "Poppins-Bold", fontSize: 15 },
              text2Style: { fontFamily: "Poppins-Medium", fontSize: 13 },
            })
          }
        } catch (error) {
          Toast.show({
            type: "error",
            text1: "Error al enviar los ingresos",
            text2: `${error}`,
            position: "bottom",
            bottomOffset: 130,
            autoHide: false,
            text1Style: { fontFamily: "Poppins-Bold", fontSize: 15 },
            text2Style: { fontFamily: "Poppins-Medium", fontSize: 13 },
          })
        }
      }
    }

    list();
    setShowLoaderIngresos(false);
  };

  const syncClientesIngresos = async () => {
    setShowLoaderClientesIngresos(true);

    try {
      const endpoints = ["ingresos/clientes", "ObtenerClientes"];
      let response = null;

      for (const endpoint of endpoints) {
        response = await fetchDataFromApi(endpoint);
        if (response && !response?.error) break;
      }

      if (!response || response?.error) {
        Toast.show({
          type: "error",
          text1: "Error al sincronizar clientes",
          text2: `${response?.message ?? "Respuesta inválida"}`,
          position: "bottom",
          bottomOffset: 130,
          autoHide: false,
          text1Style: { fontFamily: "Poppins-Bold", fontSize: 15 },
          text2Style: { fontFamily: "Poppins-Medium", fontSize: 13 },
        });
        return;
      }

      const payload = response?.data ?? response;
      const clientes = Array.isArray(payload) ? payload : (payload?.data ?? []);

      if (!Array.isArray(clientes) || clientes.length === 0) {
        setShowLoaderClientesIngresos(false);
        return;
      }

      await clienteDb.deleteAll();

      for (const item of clientes) {
        const dni = readField(item, "dni", "Dni");
        if (!dni) continue;

        await clienteDb.create({
          apellido_nombre: readField(item, "apellido_nombre", "ApellidoNombre") || "",
          dni: dni.toString(),
          nacionalidad: readField(item, "nacionalidad", "Nacionalidad") || "",
          direccion: readField(item, "direccion", "Direccion") || "",
          modelo_vehiculo: readField(item, "modelo_vehiculo", "ModeloVehiculo") || "",
          ciudad: readField(item, "ciudad", "Ciudad") || "",
          patente: readField(item, "patente", "Patente") || "",
          telefono: readField(item, "telefono", "Telefono") || "",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error al sincronizar clientes",
        text2: `${error}`,
        position: "bottom",
        bottomOffset: 130,
        autoHide: false,
        text1Style: { fontFamily: "Poppins-Bold", fontSize: 15 },
        text2Style: { fontFamily: "Poppins-Medium", fontSize: 13 },
      });
    } finally {
      setShowLoaderClientesIngresos(false);
    }
  };

  const handleSendPending = async () => {
    setShowLoaders(true);

    try {
      await syncClientesIngresos();
      await sendIngresos();
    } catch (e) {
      console.error(e);
    } finally {
      setShowLoaders(false);
    }

    // setTimeout(() => {
    //   Toast.show({
    //     type: 'success',
    //     text1: 'Simulación de envío',
    //     text2: 'endpoint y tablas de la DB en desarrollo 💻',
    //     autoHide: true,
    //     visibilityTime: 2222,
    //     position: 'bottom',
    //     bottomOffset: 120,
    //     text1Style: { fontFamily: "Poppins-Bold", fontSize: 15 },
    //     text2Style: { fontFamily: "Poppins-Regular", fontSize: 13 },
    //     swipeable: true,
    //   });

    //   setShowLoaders(false);
    // }, 2000);
  };

  return (
    <SafeAreaView style={[sendPending.mainContainer, { justifyContent: "center" }]}>
      <View style={[sendPending.container]}>
        <Text style={[sendPending.textHeader]}>
          Este proceso enviará todos los movimientos pendientes de sincronización, y una vez confirmada la recepción del servidor, los eliminará de la base local.
        </Text>

        <Image style={[sendPending.imageHeader]} source={iconSendPending} />

        {!netInfo.isConnected && <Text style={{ marginBottom: 10, color: "red", fontFamily: "Poppins-Bold" }}>No dispone de conexión a internet</Text>}

        <View>
          <TouchableOpacity
            onPress={() => handleSendPending()}
            activeOpacity={.7}
            disabled={!netInfo.isConnected || ingresos?.length === 0}
            style={[showLoaders ? [sendPending.btnSendPendingDisabled] : [sendPending.btnSendPending], { opacity: !netInfo.isConnected || ingresos?.length === 0 ? 0.5 : 1 }]}
          >
            <Ionicons name="send-outline" size={24} color="white" />
            <Text style={[sendPending.textBtnSendPending]}>Enviar pendientes</Text>
          </TouchableOpacity>

          {showLoaders && (
            <View>
              <SyncItem showLoader={showLoaderIngresos} text="Ingresos" />
              <SyncItem showLoader={showLoaderClientesIngresos} text="Clientes de Ingresos" />
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
