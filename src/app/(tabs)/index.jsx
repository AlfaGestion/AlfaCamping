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
    const [statsLoading, setStatsLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [paymentStats, setPaymentStats] = useState([]);

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
    const buildStatsHtml = (data, desde, hasta, mediosPago) => {
        const statsData = data || {};
        const toNumber = (value) => {
            const num = Number(value);
            return Number.isNaN(num) ? 0 : num;
        };
        const formatAmount = (value) => {
            const fixed = toNumber(value).toFixed(2);
            const [intPart, decPart] = fixed.split(".");
            const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            return `${withThousands},${decPart}`;
        };
        const statsMap = Object.fromEntries(
            Object.entries(statsData || {}).map(([key, value]) => [String(key).toLowerCase(), value])
        );
        const getStat = (primary, fallback) => {
            const primaryKey = String(primary).toLowerCase();
            const fallbackKey = String(fallback).toLowerCase();
            if (statsMap[primaryKey] !== undefined && statsMap[primaryKey] !== null) return toNumber(statsMap[primaryKey]);
            return toNumber(statsMap[fallbackKey]);
        };
        const totalMov = getStat("ingresaron", "ingresaron")
            + getStat("egresaron", "egresaron")
            + getStat("en_predio", "en_predio");
        const totalPersVisit = getStat("adultos", "adultos") + getStat("menores", "menores") + getStat("jubilados", "jubilados");
        const totalPersLocal = getStat("adultos_l", "adultos_l") + getStat("menores_l", "menores_l") + getStat("jubilados_l", "jubilados_l");
        const totalServVisit = getStat("estacionamientos", "estacionamientos")
            + getStat("motorhome", "motorhome")
            + getStat("bajada_lancha", "bajada_lancha");
        const chartItems = [
            { label: "Ingresaron", value: getStat("ingresaron", "ingresaron") },
            { label: "En el predio", value: getStat("en_predio", "en_predio") },
            { label: "Egresaron", value: getStat("egresaron", "egresaron") },
            { label: "Adultos", value: getStat("adultos", "adultos") },
            { label: "Menores", value: getStat("menores", "menores") },
            { label: "Jubilados", value: getStat("jubilados", "jubilados") },
        ];
        const maxVal = Math.max(1, ...chartItems.map((i) => toNumber(i.value)));
        const chartRows = chartItems
            .map((i) => {
                const pct = Math.round(toNumber(i.value) * 100 / maxVal);
                return `<div class="chart-row">
  <div class="chart-label">${i.label}</div>
  <div class="chart-bar">
    <div class="chart-fill" style="width:${pct}%"></div>
  </div>
  <div class="chart-value">${i.value ?? 0}</div>
</div>`;
            })
            .join("");
        const mediosList = Array.isArray(mediosPago) ? mediosPago : [];
        const getRowValue = (row, key) => {
            const lowerKey = String(key).toLowerCase();
            const map = Object.fromEntries(
                Object.entries(row || {}).map(([k, v]) => [String(k).toLowerCase(), v])
            );
            return map[lowerKey];
        };
        const normalizeDescripcion = (value) => String(value ?? "").trim().toUpperCase();
        const mergedMedios = Object.values(
            mediosList.reduce((acc, row) => {
                const descripcionRaw = getRowValue(row, "Descripcion") ?? getRowValue(row, "descripcion") ?? "SIN DESCRIPCION";
                const descripcionNorm = normalizeDescripcion(descripcionRaw);
                const isCuentaCorriente = descripcionNorm === "CUENTA CORRIENTE";
                const key = isCuentaCorriente ? "CUENTA CORRIENTE" : descripcionRaw;
                const cantidad = toNumber(getRowValue(row, "cantidad"));
                const total = toNumber(getRowValue(row, "total"));
                if (!acc[key]) {
                    acc[key] = { descripcion: key, cantidad: 0, total: 0 };
                }
                acc[key].cantidad += cantidad;
                acc[key].total += total;
                return acc;
            }, {})
        );
        const mediosTotales = mergedMedios.reduce(
            (acc, row) => {
                acc.cantidad += row.cantidad;
                acc.total += row.total;
                return acc;
            },
            { cantidad: 0, total: 0 }
        );
        const mediosRows = mergedMedios
            .map((row) => {
                const total = formatAmount(row.total);
                return `<div class="mp-grid">
  <span class="mp-desc">${row.descripcion}</span>
  <span class="mp-num">${row.cantidad}</span>
  <span class="mp-num">${total}</span>
</div>`;
            })
            .join("");
        const mediosSection = mediosRows
            ? `<div class="section-title">Medios de pago</div>
  <div class="card">
    <div class="mp-grid mp-head">
      <span class="mp-desc">Descripcion</span>
      <span class="mp-num">Cant.</span>
      <span class="mp-num">Total</span>
    </div>
    ${mediosRows}
    <div class="mp-grid mp-total">
      <span class="mp-desc">Total</span>
      <span class="mp-num">${mediosTotales.cantidad}</span>
      <span class="mp-num">${formatAmount(mediosTotales.total)}</span>
    </div>
  </div>`
            : "";
        return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  @page { size: 80mm auto; margin: 4mm; }
  body { font-family: Arial, sans-serif; padding: 0; color: #1f2a44; width: 72mm; margin: 0 auto; font-size: 13px; }
  .header { text-align: center; margin-bottom: 10px; }
  .logo { width: 110px; height: 110px; object-fit: contain; margin-bottom: 6px; }
  .title { font-size: 18px; font-weight: 700; margin: 0; text-transform: uppercase; }
  .subtitle { font-size: 12px; color: #284473; margin: 4px 0 0; letter-spacing: 0.5px; }
  .range { font-size: 11px; color: #666; margin: 4px 0 12px; }

  .section-title { font-size: 12px; font-weight: 700; color: #284473; margin: 10px 0 6px; text-transform: uppercase; letter-spacing: 0.3px; }
  .card { border: 1px solid #e1e1e1; border-radius: 8px; padding: 10px 12px; margin-bottom: 8px; background: #fff; }
  .card-title { font-size: 13px; font-weight: 700; color: #284473; margin-bottom: 6px; }
  .card-hero { border: 1px solid #d7e3f3; border-radius: 10px; padding: 12px; margin-bottom: 10px; background: #f5f9ff; }
  .section-sep { height: 1px; background: #e6e6e6; margin: 8px 0 10px; }

  .hero-top { display: flex; justify-content: space-between; align-items: baseline; }
  .hero-title { font-size: 12px; color: #284473; margin: 0; text-transform: uppercase; letter-spacing: 0.4px; }
  .hero-value { font-size: 28px; font-weight: 800; color: #1f2a44; }
  .hero-subline { border-top: 1px solid #dde6f2; margin-top: 8px; padding-top: 8px; }

  .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #eef0f4; font-size: 12.5px; }
  .row:last-child { border-bottom: none; }
  .total { font-weight: 700; padding-top: 6px; margin-top: 6px; border-top: 1px solid #e6e6e6; }
  .label-strong { font-weight: 700; color: #1f2a44; }

  .mini-sep { height: 1px; background: #e6e6e6; margin: 6px 0; }
  .chart { border: 1px solid #e1e1e1; border-radius: 8px; padding: 14px 14px; margin-bottom: 10px; }
  .chart-row { display: grid; grid-template-columns: 100px 1fr 40px; gap: 8px; align-items: center; margin-bottom: 6px; font-size: 13.5px; }
  .chart-label { color: #333; }
  .chart-bar { height: 10px; background: #eef3fb; border-radius: 6px; overflow: hidden; }
  .chart-fill { height: 100%; background: #f5a623; }
  .chart-value { text-align: right; color: #284473; font-weight: 700; }
  .mp-grid { display: grid; grid-template-columns: 1fr 56px 84px; gap: 10px; align-items: center; padding: 8px 0; border-bottom: 1px dashed #eef0f4; font-size: 13px; }
  .mp-grid:last-child { border-bottom: none; }
  .mp-head { font-weight: 700; color: #284473; border-bottom: 1px solid #e6e6e6; padding-bottom: 8px; }
  .mp-total { font-weight: 700; border-top: 1px solid #e6e6e6; margin-top: 6px; padding-top: 8px; }
  .mp-desc { padding-right: 6px; }
  .mp-num { text-align: right; font-variant-numeric: tabular-nums; }
</style>
</head>
<body>
  <div class="header">
    <img src="${DEFAULT_LOGO_URL}" class="logo" alt="logo" />
    <p class="title">${COMPANY_NAME}</p>
    <p class="subtitle">ESTADISTICAS</p>
    <div class="range">Desde ${desde} - Hasta ${hasta}</div>
  </div>

  <div class="card-hero">
    <div class="hero-top">
      <p class="hero-title">Ingresaron</p>
      <div class="hero-value">${getStat("ingresaron", "ingresaron")}</div>
    </div>
    <div class="hero-subline">
      <div class="row"><span>En el predio</span><span>${getStat("en_predio", "en_predio")}</span></div>
      <div class="row"><span>Egresaron</span><span>${getStat("egresaron", "egresaron")}</span></div>
    </div>
  </div>

  <div class="section-title">Resumen</div>
  <div class="chart">
    ${chartRows}
  </div>

  <div class="section-title">Movimientos</div>
  <div class="card">
    <div class="row"><span class="label-strong">Ingresaron</span><span>${getStat("ingresaron", "ingresaron")}</span></div>
    <div class="row"><span class="label-strong">Egresaron</span><span>${getStat("egresaron", "egresaron")}</span></div>
    <div class="row"><span class="label-strong">En el predio</span><span>${getStat("en_predio", "en_predio")}</span></div>
    <div class="row total"><span>Total</span><span>${totalMov}</span></div>

    <div class="mini-sep"></div>

    <div class="card-title">Informe de ingreso grupal</div>
    <div class="row"><span>Ingresaron</span><span>${getStat("ingresos_registros", "ingresos_registros")}</span></div>
    <div class="row"><span>Egresaron</span><span>${getStat("egresos_registros", "egresos_registros")}</span></div>
    <div class="row"><span>En el predio</span><span>${getStat("en_predio_registros", "en_predio_registros")}</span></div>
  </div>

  <div class="section-title">Personas</div>
  <div class="card">
    <div class="card-title">Visitantes</div>
    <div class="row"><span>Adultos</span><span>${getStat("adultos", "adultos")}</span></div>
    <div class="row"><span>Menores</span><span>${getStat("menores", "menores")}</span></div>
    <div class="row"><span>Jubilados</span><span>${getStat("jubilados", "jubilados")}</span></div>
    <div class="row total"><span>Total</span><span>${totalPersVisit}</span></div>

    <div class="section-sep"></div>

    <div class="card-title">Locales</div>
    <div class="row"><span>Adultos L</span><span>${getStat("adultos_l", "adultos_l")}</span></div>
    <div class="row"><span>Menores L</span><span>${getStat("menores_l", "menores_l")}</span></div>
    <div class="row"><span>Jubilados L</span><span>${getStat("jubilados_l", "jubilados_l")}</span></div>
    <div class="row total"><span>Total</span><span>${totalPersLocal}</span></div>
  </div>

  <div class="section-title">Visitantes</div>
  <div class="card">
    <div class="card-title">Servicios</div>
    <div class="row"><span>Motorhome</span><span>${getStat("motorhome", "motorhome")}</span></div>
    <div class="row"><span>Bajada lancha</span><span>${getStat("bajada_lancha", "bajada_lancha")}</span></div>
    <div class="row total"><span>Total</span><span>${totalServVisit}</span></div>
  </div>

  <div class="section-title">Estacionamiento</div>
  <div class="card">
    <div class="row"><span>Estacionamientos</span><span>${getStat("estacionamientos", "estacionamientos")}</span></div>
  </div>

  ${mediosSection}

</body>
</html>`;
    };

    const handleShareStats = async () => {
        if (!stats) return;
        const desde = formatDate(statsFromDate, true);
        const hasta = formatDate(statsToDate, true);
        const html = buildStatsHtml(stats, desde, hasta, paymentStats);
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
                const mediosParams = new URLSearchParams({ desde, hasta }).toString();
                const mediosEndpoint = `ingresos/MediosDePagosEstadisticas?${mediosParams}`;
                console.info("mediosEndpoint:", mediosEndpoint);
                const [response, mediosResponse] = await Promise.all([
                    fetchDataFromApi(endpoint),
                    fetchDataFromApi(mediosEndpoint),
                ]);
                const payload = response?.data?.data ?? response?.data ?? response;
                const statsData = Array.isArray(payload) ? payload[0] : payload;
                const mediosPayload = mediosResponse?.data?.data ?? mediosResponse?.data ?? mediosResponse;
                const mediosList = Array.isArray(mediosPayload)
                    ? mediosPayload
                    : Array.isArray(mediosPayload?.data)
                        ? mediosPayload.data
                        : [];
                if (isActive) {
                    setStats(statsData || null);
                    setPaymentStats(mediosList);
                }
            } catch (e) {
                if (isActive) {
                    setStats(null);
                    setPaymentStats([]);
                }
            } finally {
                if (isActive) setStatsLoading(false);
            }
        };

        loadStats();

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
                                    source={{ html: buildStatsHtml(stats, formatDate(statsFromDate, true), formatDate(statsToDate, true), paymentStats) }}
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

