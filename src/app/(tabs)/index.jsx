import { useState, useContext, useMemo, useEffect } from "react" // <-- Importar useMemo
import { ActivityIndicator, FlatList, Text, TextInput, TouchableOpacity, View, StyleSheet, ScrollView } from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";

import { useRouter } from "expo-router"
import { LocalOrdersStyles, IngresosStyles } from "@/styles/OrderStyle";
import { newTaskStyles } from "@/styles/TaskStyle";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/styles/Colors";
import { useNetInfo } from "@react-native-community/netinfo";
import DateTimePicker from "@react-native-community/datetimepicker";

import { IngresoContext } from "@/context/IngresoContext";
import { formatDate } from "@/utils/Utils";
import IngresoItem from "@/components/IngresoItem";
import InputDate from "@/components/InputDate";
import { useApi } from "@/hooks/useApi";
import { useIngresoDb } from "@/db/useIngresoDb";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";


// --- 1. DEFINICIÓN DE FILTROS ---
const FILTERS = {
    TODOS: 'TODOS',
    PENDIENTES_EGRESO: 'PENDIENTES_EGRESO', // egresar: 0
    PENDIENTES_SYNC: 'PENDIENTES_SYNC',     // sincronizado: 0
    COMPLETOS: 'COMPLETOS',                 // egresar: 1 Y sincronizado: 1
};


export default function Index() {
    const router = useRouter();
    const appVersion = Constants.expoConfig?.version ?? Constants.manifest?.version ?? "dev";

    const [isEmpty, setIsEmpty] = useState(true);
    const [selectedFilter, setSelectedFilter] = useState(FILTERS.PENDIENTES_EGRESO); // <-- Estado para el filtro
    const netInfo = useNetInfo();

    const { fetchDataFromApi } = useApi();
    const ingresoDb = useIngresoDb();
    const [statsLoading, setStatsLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [localPendingCount, setLocalPendingCount] = useState(0);

    const [statsFromDate, setStatsFromDate] = useState(new Date());
    const [statsToDate, setStatsToDate] = useState(new Date());
    const [showStatsFrom, setShowStatsFrom] = useState(false);
    const [showStatsTo, setShowStatsTo] = useState(false);
    const [remoteIngresos, setRemoteIngresos] = useState([]);
    const [remoteLoading, setRemoteLoading] = useState(false);
    const [statsWebHeight, setStatsWebHeight] = useState(700);

    const {
        ingresos, isLoading,
        searchText, setSearchText,
        setIngreso, setIsEditIngreso,
        setIngresoDate, setIngresoString,
        setEgresoDate, setEgresoString,
    } = useContext(IngresoContext);



    useEffect(() => {
        let isActive = true;

        const fetchRemoteIngresos = async () => {
            if (selectedFilter !== FILTERS.TODOS) return;
            if (!netInfo.isConnected) {
                if (isActive) setRemoteIngresos([]);
                return;
            }

            setRemoteLoading(true);
            try {
                const trimmedSearch = searchText?.trim() ?? "";
                const endpoint = trimmedSearch
                    ? `ingresos/ingresospendientes/search?search=${encodeURIComponent(trimmedSearch)}`
                    : "ingresos/ingresospendientes";
                const response = await fetchDataFromApi(endpoint);
                const raw = response?.data ?? response;
                const data = Array.isArray(raw)
                    ? raw
                    : Array.isArray(raw?.data)
                        ? raw.data
                        : Array.isArray(raw?.data?.data)
                            ? raw.data.data
                            : [];
                const limitedData = trimmedSearch ? data : data.slice(0, 50);
                const mapped = limitedData.map((row, index) => ({
                    id: row?.Id ?? row?.ID ?? row?.id ?? `${row?.Dni ?? row?.dni ?? 'sin-dni'}-${row?.Ingreso ?? row?.ingreso ?? index}`,
                    ingreso: formatIsoDate(row?.Ingreso ?? row?.ingreso),
                    egreso: formatIsoDate(row?.Egreso ?? row?.egreso),
                    apellido_nombre: row?.ApellidoNombre ?? row?.apellido_nombre ?? '',
                    parcela: row?.Parcela ?? row?.parcela ?? '',
                    dni: row?.Dni ?? row?.dni ?? '',
                    remote: true,
                }));

                if (isActive) setRemoteIngresos(mapped);
            } catch (e) {
                if (isActive) setRemoteIngresos([]);
            } finally {
                if (isActive) setRemoteLoading(false);
            }
        };

        fetchRemoteIngresos();

        return () => {
            isActive = false;
        };
    }, [selectedFilter, netInfo.isConnected, searchText]);

    const formatIsoDate = (value) => {
        if (!value) return "";
        try {
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return String(value);
            const dd = String(date.getDate()).padStart(2, "0");
            const mm = String(date.getMonth() + 1).padStart(2, "0");
            const yyyy = date.getFullYear();
            return `${dd}/${mm}/${yyyy}`;
        } catch {
            return String(value);
        }
    };

    const filteredRemoteIngresos = useMemo(() => {
        if (!remoteIngresos || remoteIngresos.length === 0) return [];
        if (!searchText) return remoteIngresos;
        const lowerSearchText = searchText.toLowerCase();
        return remoteIngresos.filter(item =>
            (item.apellido_nombre && item.apellido_nombre.toLowerCase().includes(lowerSearchText)) ||
            (item.dni && item.dni.toString().includes(lowerSearchText)) ||
            (item.patente && item.patente.toLowerCase().includes(lowerSearchText)) ||
            (item.parcela !== undefined && item.parcela !== null && item.parcela.toString().includes(lowerSearchText))
        );
    }, [remoteIngresos, searchText]);

    const DEFAULT_LOGO_URL = "https://alfagestion.com.ar/alfagestion/logo_desemboque.png";
    const COMPANY_NAME = "CAMPING EL DESEMBOQUE";
    const buildStatsHtml = (data, desde, hasta, localPending) => {
        const statsData = data || {};
        const totalMov = (statsData.ingresaron ?? 0) + (statsData.egresaron ?? 0) + (statsData.en_predio ?? 0);
        const totalPers = (statsData.adultos ?? 0) + (statsData.menores ?? 0) + (statsData.jubilados ?? 0);
        const totalServ = (statsData.estacionamientos ?? 0) + (statsData.motorhome ?? 0) + (statsData.bajada_lancha ?? 0);
        const chartItems = [
            { label: "Ingresaron", value: statsData.ingresaron ?? 0 },
            { label: "En el predio", value: statsData.en_predio ?? 0 },
            { label: "Egresaron", value: statsData.egresaron ?? 0 },
            { label: "Adultos", value: statsData.adultos ?? 0 },
            { label: "Menores", value: statsData.menores ?? 0 },
            { label: "Jubilados", value: statsData.jubilados ?? 0 },
        ];
        const maxVal = Math.max(1, ...chartItems.map((i) => Number(i.value) || 0));
        const chartRows = chartItems
            .map((i) => {
                const pct = Math.round((Number(i.value) || 0) * 100 / maxVal);
                return `<div class="chart-row">
  <div class="chart-label">${i.label}</div>
  <div class="chart-bar">
    <div class="chart-fill" style="width:${pct}%"></div>
  </div>
  <div class="chart-value">${i.value ?? 0}</div>
</div>`;
            })
            .join("");
        return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  @page { size: 80mm auto; margin: 4mm; }
  body { font-family: Arial, sans-serif; padding: 0; color: #1f2a44; width: 72mm; margin: 0 auto; font-size: 14px; }
  .header { text-align: center; margin-bottom: 10px; }
  .logo { width: 120px; height: 120px; object-fit: contain; margin-bottom: 6px; }
  .title { font-size: 20px; font-weight: 700; margin: 0; text-transform: uppercase; }
  .subtitle { font-size: 14px; color: #284473; margin: 4px 0 0; }
  .range { font-size: 12px; color: #666; margin: 4px 0 12px; }
  .card { border: 1px solid #e1e1e1; border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; }
  .title { font-size: 14px; font-weight: 700; color: #284473; margin-bottom: 8px; }
  .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
  .row:last-child { border-bottom: none; }
  .total { font-weight: 700; padding-top: 6px; margin-top: 6px; border-top: 1px solid #e6e6e6; }
  .chart { border: 1px solid #e1e1e1; border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; }
  .chart-title { font-size: 15px; font-weight: 700; color: #284473; margin-bottom: 8px; }
  .chart-row { display: grid; grid-template-columns: 90px 1fr 36px; gap: 6px; align-items: center; margin-bottom: 6px; font-size: 13px; }
  .chart-label { color: #333; }
  .chart-bar { height: 8px; background: #eef3fb; border-radius: 6px; overflow: hidden; }
  .chart-fill { height: 100%; background: #f5a623; }
  .chart-value { text-align: right; color: #284473; font-weight: 700; }
</style>
</head>
<body>
  <div class="header">
    <img src="${DEFAULT_LOGO_URL}" class="logo" alt="logo" />
    <p class="title">${COMPANY_NAME}</p>
    <p class="subtitle">ESTADISTICAS</p>
    <div class="range">Desde ${desde} - Hasta ${hasta}</div>
  </div>

  <div class="chart">
    <div class="chart-title">Resumen</div>
    ${chartRows}
  </div>

  <div class="card">
    <div class="title">Movimientos</div>
    <div class="row"><span>Ingresaron</span><span>${statsData.ingresaron ?? 0}</span></div>
    <div class="row"><span>Egresaron</span><span>${statsData.egresaron ?? 0}</span></div>
    <div class="row"><span>En el predio</span><span>${statsData.en_predio ?? 0}</span></div>
    <div class="row total"><span>Total</span><span>${totalMov}</span></div>
  </div>

  <div class="card">
    <div class="title">Personas</div>
    <div class="row"><span>Adultos</span><span>${statsData.adultos ?? 0}</span></div>
    <div class="row"><span>Menores</span><span>${statsData.menores ?? 0}</span></div>
    <div class="row"><span>Jubilados</span><span>${statsData.jubilados ?? 0}</span></div>
    <div class="row total"><span>Total</span><span>${totalPers}</span></div>
  </div>

  <div class="card">
    <div class="title">Servicios</div>
    <div class="row"><span>Estacionamientos</span><span>${statsData.estacionamientos ?? 0}</span></div>
    <div class="row"><span>Motorhome</span><span>${statsData.motorhome ?? 0}</span></div>
    <div class="row"><span>Bajada lancha</span><span>${statsData.bajada_lancha ?? 0}</span></div>
    <div class="row total"><span>Total</span><span>${totalServ}</span></div>
  </div>

  <div class="card">
    <div class="title">Local</div>
    <div class="row"><span>Ingresos locales</span><span>${localPending ?? 0}</span></div>
  </div>
</body>
</html>`;
    };

    const handleShareStats = async () => {
        if (!stats) return;
        const desde = formatDate(statsFromDate, true);
        const hasta = formatDate(statsToDate, true);
        const html = buildStatsHtml(stats, desde, hasta, localPendingCount);
        try {
            const { uri } = await Print.printToFileAsync({ html, base64: false });
            const canShare = await Sharing.isAvailableAsync();
            if (!canShare) return;
            await Sharing.shareAsync(uri, {
                mimeType: 'application/pdf',
                dialogTitle: 'Compartir estadisticas'
            });
        } catch (e) {
            // noop
        }
    };

    const parseDMY = (value) => {
        if (!value) return null;
        const parts = String(value).split("/");
        if (parts.length !== 3) return null;
        const [dd, mm, yyyy] = parts;
        const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
        return Number.isNaN(d.getTime()) ? null : d;
    };

    const formatYMD = (date) => {
        if (!date) return "";
        const d = new Date(date);
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();
        return `${yyyy}-${mm}-${dd}`;
    };

    useEffect(() => {
        if (selectedFilter !== FILTERS.COMPLETOS) return;
        let isActive = true;

        const loadStats = async () => {
            if (!netInfo.isConnected) {
                if (isActive) setStats(null);
                return;
            }
            setStatsLoading(true);
            try {
                const desde = formatYMD(statsFromDate);
                const hasta = formatYMD(statsToDate);
                const endpoint = `ingresos/estadisticas?desde=${desde}&hasta=${hasta}`;
                const response = await fetchDataFromApi(endpoint);
                const payload = response?.data?.data ?? response?.data ?? response;
                const statsData = Array.isArray(payload) ? payload[0] : payload;
                if (isActive) setStats(statsData || null);
            } catch (e) {
                if (isActive) setStats(null);
            } finally {
                if (isActive) setStatsLoading(false);
            }
        };

        const loadLocalPending = async () => {
            try {
                const all = await ingresoDb.getAll();
                const desde = new Date(statsFromDate);
                const hasta = new Date(statsToDate);
                const count = all.filter(item => {
                    const d = parseDMY(item?.ingreso);
                    if (!d) return false;
                    return d >= new Date(desde.getFullYear(), desde.getMonth(), desde.getDate()) &&
                        d <= new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate());
                }).length;
                if (isActive) setLocalPendingCount(count);
            } catch {
                if (isActive) setLocalPendingCount(0);
            }
        };

        loadStats();
        loadLocalPending();

        return () => { isActive = false; };
    }, [selectedFilter, statsFromDate, statsToDate, netInfo.isConnected]);

    const filteredIngresos = useMemo(() => {
        if (!ingresos || ingresos.length === 0) {
            return [];
        }

        let filtered = ingresos;

        // 2a. Aplicar Filtros de Estado
        switch (selectedFilter) {
            case FILTERS.PENDIENTES_EGRESO:
                // Egresos Pendientes: (0, false o null) Y (No anulado)
                filtered = filtered.filter(item => {
                    const esPendiente = item.egresar === 0 ||
                        item.egresar === false ||
                        item.egresar === null ||
                        item.egresar === undefined;

                    const noEstaAnulado = item.anulado === 0 ||
                        item.anulado === false ||
                        item.anulado === null ||
                        item.anulado === undefined;

                    return esPendiente && noEstaAnulado;
                });
                break;

            case FILTERS.PENDIENTES_SYNC:
                // Sincronizados Pendientes: 0, false o null
                filtered = filtered.filter(item =>
                    item.sincronizado === 0 ||
                    item.sincronizado === false ||
                    item.sincronizado === null
                );
                break;

            case FILTERS.COMPLETOS:
                // Completo: egresar es 1 Y sincronizado es 1
                filtered = filtered.filter(item =>
                    (item.egresar === 1 || item.egresar === true) &&
                    (item.sincronizado === 1 || item.sincronizado === true)
                );
                break;

            case FILTERS.TODOS:
            default:
                break;
        }

        // 2b. Aplicar Búsqueda de Texto (si existe)
        if (searchText) {
            const lowerSearchText = searchText.toLowerCase();
            filtered = filtered.filter(item =>
                (item.apellido_nombre && item.apellido_nombre.toLowerCase().includes(lowerSearchText)) ||
                (item.dni && item.dni.toString().includes(lowerSearchText)) ||
                (item.patente && item.patente.toLowerCase().includes(lowerSearchText)) ||
                (item.parcela !== undefined && item.parcela !== null && item.parcela.toString().includes(lowerSearchText))
            );
        }

        return filtered;

    }, [ingresos, selectedFilter, searchText]); // Dependencias: re-ejecutar si ingresos, filtro o texto cambian


    const isTodos = selectedFilter === FILTERS.TODOS;
    const listData = isTodos ? filteredRemoteIngresos : filteredIngresos;
    const listLoading = isTodos ? remoteLoading : isLoading;

    return (
        <SafeAreaView style={{ height: "100%" }}>
            {/* ------------------- FILTROS DE ESTADO ------------------- */}
            <View style={styles.containerFilters}>

                {/* Bot??n: PENDIENTES_EGRESO (egresar: 0) */}
                <TouchableOpacity
                    onPress={() => setSelectedFilter(FILTERS.PENDIENTES_EGRESO)}
                    style={[
                        styles.filterButton,
                        selectedFilter === FILTERS.PENDIENTES_EGRESO && styles.filterButtonActive
                    ]}
                >
                    <Text style={selectedFilter === FILTERS.PENDIENTES_EGRESO ? styles.filterTextActive : styles.filterText}>
                        Pend. Egreso
                    </Text>
                </TouchableOpacity>

                {/* Bot??n: PENDIENTES_SYNC (sincronizado: 0) */}
                <TouchableOpacity
                    onPress={() => setSelectedFilter(FILTERS.PENDIENTES_SYNC)}
                    style={[
                        styles.filterButton,
                        selectedFilter === FILTERS.PENDIENTES_SYNC && styles.filterButtonActive
                    ]}
                >
                    <Text style={selectedFilter === FILTERS.PENDIENTES_SYNC ? styles.filterTextActive : styles.filterText}>
                        Pend. Sync
                    </Text>
                </TouchableOpacity>

                {/* Bot??n: TODOS */}
                <TouchableOpacity
                    onPress={() => setSelectedFilter(FILTERS.TODOS)}
                    style={[
                        styles.filterButton,
                        selectedFilter === FILTERS.TODOS && styles.filterButtonActive
                    ]}
                >
                    <Text style={selectedFilter === FILTERS.TODOS ? styles.filterTextActive : styles.filterText}>
                        En el predio
                    </Text>
                </TouchableOpacity>

                {/* Bot??n: COMPLETOS (egresar: 1 Y sincronizado: 1) */}
                <TouchableOpacity
                    onPress={() => setSelectedFilter(FILTERS.COMPLETOS)}
                    style={[
                        styles.filterButton,
                        selectedFilter === FILTERS.COMPLETOS && styles.filterButtonActive
                    ]}
                >
                    <Text style={selectedFilter === FILTERS.COMPLETOS ? styles.filterTextActive : styles.filterText}>
                        Estadisticas
                    </Text>
                </TouchableOpacity>
            </View>

            {selectedFilter === FILTERS.COMPLETOS && (
                <ScrollView contentContainerStyle={styles.statsContainer} nestedScrollEnabled>
                    <View style={styles.dateRow}>
                        <View style={styles.dateCol}>
                            <InputDate
                                title="Desde"
                                value={formatDate(statsFromDate, true)}
                                callback={() => setShowStatsFrom(true)}
                            />
                        </View>
                        <View style={styles.dateCol}>
                            <InputDate
                                title="Hasta"
                                value={formatDate(statsToDate, true)}
                                callback={() => setShowStatsTo(true)}
                            />
                        </View>
                    </View>

                    {showStatsFrom && (
                        <DateTimePicker
                            value={statsFromDate}
                            mode="date"
                            onChange={(event, selectedDate) => {
                                if (event.type === "dismissed") { setShowStatsFrom(false); return; }
                                const current = selectedDate || statsFromDate;
                                setShowStatsFrom(false);
                                setStatsFromDate(current);
                                if (current > statsToDate) setStatsToDate(current);
                            }}
                        />
                    )}

                    {showStatsTo && (
                        <DateTimePicker
                            value={statsToDate}
                            mode="date"
                            onChange={(event, selectedDate) => {
                                if (event.type === "dismissed") { setShowStatsTo(false); return; }
                                const current = selectedDate || statsToDate;
                                setShowStatsTo(false);
                                setStatsToDate(current);
                            }}
                        />
                    )}

                    {statsLoading ? (
                        <View style={styles.statsLoading}>
                            <ActivityIndicator size="large" color="#286A73" />
                            <Text style={styles.searchingText}>Cargando estadisticas...</Text>
                        </View>
                    ) : stats ? (
                        <>
                            <Text style={styles.previewTitle}>Vista previa</Text>
                            <View style={styles.statsWebViewWrapper}>
                                <WebView
                                    originWhitelist={["*"]}
                                    source={{ html: buildStatsHtml(stats, formatDate(statsFromDate, true), formatDate(statsToDate, true), localPendingCount) }}
                                    style={[styles.statsWebView, { height: statsWebHeight }]}
                                    scrollEnabled={false}
                                    injectedJavaScript={"setTimeout(function(){window.ReactNativeWebView.postMessage(String(document.body.scrollHeight));}, 100); true;"}
                                    onMessage={(event) => {
                                        const h = Number(event.nativeEvent.data);
                                        if (!Number.isNaN(h) && h > 0) {
                                            setStatsWebHeight(h);
                                        }
                                    }}
                                />
                            </View>
                            <TouchableOpacity style={styles.statsShareButton} onPress={handleShareStats}>
                                <Text style={styles.statsShareText}>Enviar</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <Text style={styles.emptyStatsText}>Sin datos para el rango seleccionado.</Text>
                    )}
                </ScrollView>
            )}

            {selectedFilter !== FILTERS.COMPLETOS && (
                <>
            <View style={{ paddingHorizontal: 30, marginTop: 10 }}>
                {/* ------------------- INPUT DE BÚSQUEDA ------------------- */}
                <View style={styles.searchInputWrapper}>
                    <TextInput
                        value={searchText}
                        onChangeText={setSearchText}
                        style={[newTaskStyles.textInput, styles.searchInput]}
                        placeholder="Buscar por nombre o DNI..."
                        returnKeyType="done"
                        cursorColor="#C0C0C0"
                    />
                    {searchText ? (
                        <TouchableOpacity
                            style={styles.clearButton}
                            onPress={() => setSearchText("")}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Ionicons name="close-circle" size={22} color="#284473" />
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>

            {/* ------------------- BOTÓN NUEVO INGRESO ------------------- */}
            <View style={[IngresosStyles.containerBtnNewIngreso]}>
                <TouchableOpacity
                    style={[IngresosStyles.btnNewIngreso]}
                    onPress={() => {
                        router.replace("/ingresos/new");
                        setIngreso({});
                        setIsEditIngreso(false);

                        const completeDate = formatDate(new Date());
                        const simplifiedDate = formatDate(new Date(), true);

                        setIngresoDate(completeDate);
                        setIngresoString(simplifiedDate);

                        setEgresoDate(new Date());
                        setEgresoString('');
                    }}
                >
                    <Text style={[IngresosStyles.textNewIngresoBtn]}>Nuevo Ingreso +</Text>
                </TouchableOpacity>
            </View>

                </>
            )}

            {selectedFilter !== FILTERS.COMPLETOS && (
                <>
            {/* ------------------- LISTA / LOADER ------------------- */}
            {listLoading ? (
                <View style={styles.loaderCentered}>
                    <ActivityIndicator size="large" className="scale-150" color="#286A73" />
                    {isTodos && searchText?.trim() ? (
                        <Text style={styles.searchingText}>Buscando en el servidor...</Text>
                    ) : null}
                </View>
            ) :
                listData?.length > 0 ? (
                    <FlatList
                        ListFooterComponent={
                            <View>
                                <Text style={[LocalOrdersStyles.textDelOrder]}>
                                  {isTodos ? "Listado desde API (solo lectura)" : "Toque un ingreso para editarlo"}
                                </Text>
                            </View>
                        }
                        ListFooterComponentStyle={{ height: 200 }}
                        scrollEnabled={true}
                        style={[LocalOrdersStyles.flatList]}
                        data={listData}
                        keyExtractor={(item, index) => (isTodos ? `${item?.id ?? item?.dni ?? 'row'}-${index}` : item?.id + "")}
                        renderItem={({ item }) => {
                            return (
                                <IngresoItem
                                    id={item?.id}
                                    remote={isTodos || item?.remote}
                                    apellido_nombre={item?.apellido_nombre}
                                    dni={item?.dni}
                                    ingreso={item?.ingreso}
                                    egreso={item?.egreso}
                                    observaciones={item?.observaciones}
                                    egresoReal={item?.egreso_real}
                                    egresar={item?.egresar}
                                    sincronizado={item?.sincronizado}
                                    parcela={item?.parcela}
                                    anulado={item?.anulado}
                                    modelo_vehiculo={item?.modelo_vehiculo}
                                    patente={item?.patente}
                                    adultos={item?.adultos}
                                    menores={item?.menores}
                                    jubilados={item?.jubilados}
                                    adultosL={item?.adultosL}
                                    menoresL={item?.menoresL}
                                    jubiladosL={item?.jubiladosL}
                                    adultos_mayores={item?.adultos_mayores}
                                    adultos_menores={item?.adultos_menores}
                                    embarcado={item?.embarcado}
                                    kayak={item?.kayak}
                                    trekking={item?.trekking}
                                    amarre={item?.amarre}
                                    bajada_lancha={item?.bajada_lancha}
                                    bajada_lanchaL={item?.bajada_lanchaL}
                                    precio_bajada_lancha={item?.precio_bajada_lancha}
                                    precio_bajada_lanchaL={item?.precio_bajada_lanchaL}
                                    precio_adultos={item?.precio_adultos}
                                    precio_menores={item?.precio_menores}
                                    precio_jubilados={item?.precio_jubilados}
                                    precio_adultosL={item?.precio_adultosL}
                                    precio_menoresL={item?.precio_menoresL}
                                    precio_jubiladosL={item?.precio_jubiladosL}
                                    adicional={item?.adicional}
                                    precio_adicional={item?.precio_adicional}
                                    adicionalL={item?.adicionalL}
                                    precio_adicionalL={item?.precio_adicionalL}
                                    estacionamiento={item?.estacionamiento}
                                    precio_estacionamiento={item?.precio_estacionamiento}
                                    estadia={item?.estadia}
                                    descuento={item?.descuento}
                                    subtotal={item?.subtotal}
                                    total={item?.total}
                                />
                            );
                        }}
                    />
                ) : isEmpty && (
                    <Text style={[LocalOrdersStyles.emptyText]}>No hay ingresos cargados.</Text>
                )}
                </>
            )}

            <View style={styles.versionContainer}>
                <Text style={styles.versionText}>v{appVersion}</Text>
            </View>
        </SafeAreaView>
    );
}


// --- 3. ESTILOS DE COMPONENTE (Incluye los estilos para los filtros) ---
const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
    },
    loaderCentered: {
        padding: 30,
        width: '100%',
        height: '70%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchingText: {
        marginTop: 10,
        fontSize: 12,
        color: '#555',
        fontFamily: "Poppins-Regular",
    },
    versionContainer: {
        paddingVertical: 6,
        alignItems: 'center',
    },
    versionText: {
        fontSize: 11,
        color: '#777',
    },

    // --- Estilos de Filtro ---
    containerFilters: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 10,
        marginVertical: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        padding: 5,
    },
    filterButton: {
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 6,
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 2,
    },
    filterButtonActive: {
        backgroundColor: '#284473', // Color activo
    },
    filterText: {
        color: '#333',
        fontSize: 11,
        fontWeight: '500',
        textAlign: 'center',
    },
    filterTextActive: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
        textAlign: 'center',
    },
    searchInputWrapper: {
        position: 'relative',
        justifyContent: 'center',
    },
    searchInput: {
        paddingRight: 34,
    },
    clearButton: {
        position: 'absolute',
        right: 10,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },

    statsContainer: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    dateCol: {
        flex: 1,
    },
    statsLoading: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    emptyStatsText: {
        marginTop: 10,
        fontSize: 12,
        color: '#777',
        textAlign: 'center',
        fontFamily: "Poppins-Regular",
    },
    previewTitle: {
        marginTop: 10,
        fontSize: 12,
        color: '#284473',
        fontFamily: "Poppins-Bold",
    },
    statsWebViewWrapper: {
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#e1e1e1',
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: '#f7f7f7',
        minHeight: 100,
    },
    statsWebView: {
        flex: 1,
        backgroundColor: '#fff',
    },
    statsShareButton: {
        marginTop: 10,
        backgroundColor: '#284473',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
    },
    statsShareText: {
        color: '#fff',
        fontFamily: "Poppins-Bold",
        fontSize: 14,
    },
});

