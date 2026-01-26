import { useContext } from "react";
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

import imgTask from "@/icons/orders.png";
import { IngresoContext } from "@/context/IngresoContext";
import { useIngresoDb } from "@/db/useIngresoDb";
import { useClienteDb } from "@/db/useClienteDb";
import { buildIngresoHtml, getIngresoNombre } from "@/utils/ingresoPrint";

export default function IngresoItem(props) {
  const { setIngreso, setIsEditIngreso, setIngresoString, setEgresoString, list } = useContext(IngresoContext);
  const ingresoDb = useIngresoDb();
  const clienteDb = useClienteDb();
  const router = useRouter();
  const id = props.id;

  const isNombreValido = (value) => {
    const text = typeof value === "string" ? value.trim() : "";
    return !!text && text.toLowerCase() !== "undefined" && text.toLowerCase() !== "null";
  };


  const nombreVisitante = getIngresoNombre(props);

  const generateHTML = (data = props) =>
    buildIngresoHtml(data, { estacionamientoPrecio: data?.precio_estacionamiento });

  const getPrintableData = async () => {
    try {
      const [dbIngreso] = await ingresoDb.findById(id);
      if (!dbIngreso) return props;
      let nombre = dbIngreso.apellido_nombre;
      if (!isNombreValido(nombre) && dbIngreso.dni) {
        const [cliente] = await clienteDb.findByDni(dbIngreso.dni);
        nombre = cliente?.apellido_nombre ?? nombre;
      }
      return { ...props, ...dbIngreso, apellido_nombre: nombre };
    } catch (error) {
      return props;
    }
  };

  // --- FUNCIÓN PARA COMPARTIR POR WHATSAPP/SISTEMA ---
  const handleSharePDF = async () => {
    try {
      // 1. Generamos el PDF en una ubicación temporal
      const printable = await getPrintableData();
      const { uri } = await Print.printToFileAsync({
        html: generateHTML(printable),
        base64: false
      });

      const ingresoFmt = props.ingreso ? props.ingreso.replace(/\//g, '-') : 'sin-fecha';
      const egresoFmt = props.egreso ? props.egreso.replace(/\//g, '-') : 'sin-fecha';
      const nombreCliente = (nombreVisitante || 'camping').replace(/\s+/g, '_');

      // 2. Definimos el nuevo nombre (limpiamos el nombre de espacios para evitar errores)
      const fileName = `Ingreso_${nombreCliente}_desde_${ingresoFmt}_hasta_${egresoFmt}.pdf`;
      const newUri = FileSystem.cacheDirectory + fileName;

      // 3. Movemos/Renombramos el archivo
      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      });

      // 4. Compartimos el nuevo archivo con el nombre correcto
      await Sharing.shareAsync(newUri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: 'Compartir Comprobante' // Título opcional para el menú
      });

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo generar el archivo con nombre personalizado.");
    }
  };

  // --- FUNCIÓN PARA IMPRESIÓN DIRECTA ---
  const handlePrint = async () => {
    try {
      const printable = await getPrintableData();
      await Print.printAsync({
        html: generateHTML(printable),
      });
    } catch (error) {
      Alert.alert("Error", "Hubo un problema al intentar imprimir.");
    }
  };

  // --- MENÚ AL MANTENER PRESIONADO ---
  const handleLongPress = () => {
    Alert.alert(
      "Opciones de Comprobante",
      `Seleccione una acción para la reserva de ${nombreVisitante || 'visitante'}`,
      [
        { text: "Compartir PDF", onPress: handleSharePDF },
        { text: "Imprimir Ticket", onPress: handlePrint },
        { text: "Cancelar", style: "cancel" }
      ]
    );
  };

  const handleClick = async () => {
    const [response] = await ingresoDb.findById(id);

    if (response) {
      setIsEditIngreso(true);

      setIngreso({
        ...response,
        parcela: response?.parcela?.toString(),
        bajada_lancha: response?.bajada_lancha?.toString(),
        adultos: response?.adultos?.toString(),
        menores: response?.menores?.toString(),
        jubilados: response?.jubilados?.toString(),
      });

      setIngresoString(response?.ingreso);
      setEgresoString(response?.egreso);
      router.replace(`/ingresos/new/`);
    } else {
      return Alert.alert("Ingreso inexistente", "Su ingreso fue eliminado pero no se recargó la pantalla.", [
        { text: "Recargar", onPress: () => list() },
        { text: "Volver" },
      ]);
    }
  };

  return (
    <TouchableOpacity
      onPress={() => { !props?.anulado && handleClick() }}
      onLongPress={handleLongPress} // Se dispara al mantener presionado
      delayLongPress={600}          // Tiempo necesario de presión (ms)
    >
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <Image style={styles.image} source={imgTask}></Image>
        </View>

        <View style={styles.highContainer}>
          <View>
            <Text style={{ fontFamily: "Poppins-Bold", includeFontPadding: false }}>
              {nombreVisitante || "-"} {props.dni ? `- ${props.dni}` : ""}
            </Text>
          </View>

          <View style={styles.lowContainer}>
            <Text style={{ fontSize: 14, fontFamily: "Poppins-Medium", includeFontPadding: false }}>
              {props.ingreso} - {props.egreso}
            </Text>
          </View>

          <View>
            {props?.observaciones && (
              <Text style={{ fontSize: 14, fontFamily: "Poppins-Light", includeFontPadding: false }}>
                {props.observaciones}
              </Text>
            )}
          </View>

          <View>
            <Text style={{ fontSize: 14, fontFamily: "Poppins-Light", includeFontPadding: false }}>
              Parcela: {props.parcela}
            </Text>
          </View>

          {/* Estados: Egreso pendiente, Anulado, Estadía completa, Sincronización */}
          {props?.egresoReal === null && props?.egresar === 0 && (props?.anulado === 0 || props?.anulado === null) && (
            <View>
              <Text style={[styles.badge, styles.badgePending]}>Egreso pendiente</Text>
            </View>
          )}

          {props?.anulado === 1 && (
            <View>
              <Text style={[styles.badge, styles.badgeAnulado]}>Anulado</Text>
            </View>
          )}

          {props?.egresoReal !== null && props?.egresar === 1 && (
            <View>
              <Text style={[styles.badge, styles.badgeSuccess]}>Estadía completa</Text>
            </View>
          )}

          {props?.sincronizado === 0 && (
            <View>
              <Text style={[styles.badge, styles.badgeSync]}>Falta sincronizar</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "row",
    borderBottomColor: "#e1e1e1",
    borderBottomWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 30,
    marginVertical: 2,
  },
  imageContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },
  image: {
    width: 40,
    height: 40,
  },
  highContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    width: "85%",
  },
  lowContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignContent: "space-between",
    alignItems: "center",
  },
  // Estilos simplificados para los Badges (Estados)
  badge: {
    fontSize: 14,
    fontFamily: "Poppins-Light",
    includeFontPadding: false,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 5,
    borderWidth: 1,
    borderRadius: 5,
    textAlign: 'start'
  },
  badgePending: { width: '48%', backgroundColor: 'rgba(230, 247, 255, 0.6)', borderColor: '#91d5ff', color: '#1890ff' },
  badgeAnulado: { width: '30%', backgroundColor: 'rgba(255, 186, 169, 0.6)', borderColor: '#ff5858ff', color: '#ff1818ff' },
  badgeSuccess: { width: '48%', backgroundColor: '#ecfbecff', borderColor: '#5db05dff', color: '#12c712ff' },
  badgeSync: { width: '48%', backgroundColor: 'rgba(255, 218, 169, 0.6)', borderColor: '#ff9058ff', color: '#ff6518ff' }
});


