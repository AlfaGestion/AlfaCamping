import { useState, useContext, useMemo, useEffect } from "react" // <-- Importar useMemo
import { ActivityIndicator, FlatList, Text, TextInput, TouchableOpacity, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";

import { useRouter } from "expo-router"
import { LocalOrdersStyles, IngresosStyles } from "@/styles/OrderStyle";
import { newTaskStyles } from "@/styles/TaskStyle";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/styles/Colors";
import { useNetInfo } from "@react-native-community/netinfo";

import { IngresoContext } from "@/context/IngresoContext";
import { formatDate } from "@/utils/Utils";
import IngresoItem from "@/components/IngresoItem";
// import { useApi } from "@/hooks/useApi";


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

    const {
        ingresos, isLoading,
        searchText, setSearchText,
        setIngreso, setIsEditIngreso,
        setIngresoDate, setIngresoString,
        setEgresoDate, setEgresoString,
    } = useContext(IngresoContext);


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
                (item.patente && item.patente.toLowerCase().includes(lowerSearchText))
            );
        }

        return filtered;

    }, [ingresos, selectedFilter, searchText]); // Dependencias: re-ejecutar si ingresos, filtro o texto cambian


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
                        Todos
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

            {selectedFilter !== FILTERS.COMPLETOS && (
                <>
            <View style={{ paddingHorizontal: 30, marginTop: 10 }}>
                {/* ------------------- INPUT DE BÚSQUEDA ------------------- */}
                <TextInput
                    value={searchText}
                    onChangeText={setSearchText}
                    style={[newTaskStyles.textInput]}
                    placeholder="Buscar por nombre o DNI..."
                    returnKeyType="done"
                    cursorColor="#C0C0C0"
                />
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
            {isLoading ? (
                <View style={styles.loaderCentered}>
                    <ActivityIndicator size="large" className="scale-150" color="#286A73" />
                </View>
            ) :
                filteredIngresos?.length > 0 ? ( // <-- Usar filteredIngresos aquí
                    <FlatList
                        ListFooterComponent={
                            <View>
                                <Text style={[LocalOrdersStyles.textDelOrder]}>Toque un ingreso para editarlo</Text>
                            </View>
                        }
                        ListFooterComponentStyle={{ height: 200 }}
                        scrollEnabled={true}
                        style={[LocalOrdersStyles.flatList]}
                        data={filteredIngresos} // <-- Usar filteredIngresos aquí
                        keyExtractor={(item) => item?.id + ""}
                        renderItem={({ item }) => {
                            return (
                                <IngresoItem
                                    id={item?.id}
                                    apellido_nombre={item?.apellido_nombre}
                                    dni={item?.dni}
                                    ingreso={item?.ingreso}
                                    egreso={item?.egreso}
                                    observaciones={item?.observaciones}
                                    egresoReal={item?.egreso_real}
                                    egresar={item?.egresar}
                                    sincronizado={item?.sincronizado}
                                    parcela={item?.parcela}
                                    remote={false}
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
});

