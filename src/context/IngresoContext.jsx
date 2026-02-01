import { useState, useEffect, useRef, createContext } from 'react'
import { Alert } from 'react-native'
import { useIngresoDb } from '@/db/useIngresoDb'
import { useClienteDb } from '@/db/useClienteDb'
import { usePreciosDb } from '@/db/usePreciosDb'
import { useMediosDePagoDb } from '@/db/useMediosDePagoDb'
import { useConfigDb } from '@/db/useConfigDb'
import { useApi } from '@/hooks/useApi'
import { useRouter } from 'expo-router'
import Toast from 'react-native-toast-message'
import { useNetInfo } from "@react-native-community/netinfo";

export const IngresoContext = createContext()

const IngresoContextProvider = ({ children }) => {
  const router = useRouter()
  const ingresoDb = useIngresoDb()
  const clienteDb = useClienteDb()
  const preciosDb = usePreciosDb()
  const mediosDePagoDb = useMediosDePagoDb()
  const configDb = useConfigDb()
  const netInfo = useNetInfo();

  const [isLoading, setIsLoading] = useState(false)
  const [searchText, setSearchText] = useState("")
  const [ingresos, setIngresos] = useState("")
  const [ingreso, setIngreso] = useState({
    ingreso: "",
    egreso: "",
    parcela: 0,
    apellido_nombre: "",
    dni: "",
    nacionalidad: "",
    direccion: "",
    telefono: "",
    modelo_vehiculo: "",
    ciudad: "",
    patente: "",

    trekking: false,
    kayak: false,
    embarcado: false,
    amarre: false,

    bajada_lancha: 0,
    precio_bajada_lancha: 0,
    adultos: 0,
    precio_adultos: 0,
    menores: 0,
    precio_menores: 0,
    jubilados: 0,
    precio_jubilados: 0,

    adultosL: 0,
    precio_adultosL: 0,
    menoresL: 0,
    precio_menoresL: 0,
    jubiladosL: 0,
    precio_jubiladosL: 0,
    bajada_lanchaL: 0,
    precio_bajada_lanchaL: 0,

    adicional: 0,
    precio_adicional: 0,
    adicionalL: 0,
    precio_adicionalL: 0,

    observaciones: "",

    estacionamiento: false,
    precio_estacionamiento: 0,

    descuento: 0,
    subtotal: 0,
    total: 0,

    medio_de_pago: "",
    local: false,
  });

  const [ingresoDate, setIngresoDate] = useState(new Date());
  const [ingresoString, setIngresoString] = useState("");
  const [showIngreso, setShowIngreso] = useState(false);

  const [egresoDate, setEgresoDate] = useState(new Date());
  const [egresoString, setEgresoString] = useState("");
  const [showEgreso, setShowEgreso] = useState(false);



  const dniRef = useRef(null)
  const nombreRef = useRef(null)
  const parcelaRef = useRef(null)
  const nacionalidadRef = useRef(null)
  const direccionRef = useRef(null)
  const ciudadRef = useRef(null)
  const telefonoRef = useRef(null)
  const patenteRef = useRef(null)
  const modeloRef = useRef(null)

  const bajadaRef = useRef(null)
  const amarreRef = useRef(null)
  const mayoresRef = useRef(null)
  const menoresRef = useRef(null)
  const jubiladosRef = useRef(null)
  const observacionesRef = useRef(null)
  const isFetchingPrecios = useRef(false)
  const isFetchingMedios = useRef(false)
  const autoPricesAttempted = useRef({ onlineFetched: false, offlineRestored: false })
  const autoMediosAttempted = useRef({ onlineFetched: false, offlineRestored: false })


  const [dniRefresh, setDniRefresh] = useState(0)
  const [nombreRefresh, setNombreRefresh] = useState(1000)
  const [parcelaRefresh, setParcelaRefresh] = useState(2000)
  const [nacionalidadRefresh, setNacionalidadRefresh] = useState(3000)
  const [direccionRefresh, setDireccionRefresh] = useState(4000)
  const [ciudadRefresh, setCiudadRefresh] = useState(5000)
  const [telefonoRefresh, setTelefonoRefresh] = useState(5500)
  const [patenteRefresh, setPatenteRefresh] = useState(6000)
  const [modeloRefresh, setModeloRefresh] = useState(7000)

  const [bajadaRefresh, setBajadaRefresh] = useState(8000)
  const [amarreRefresh, setAmarreRefresh] = useState(9000)
  const [mayoresRefresh, setMayoresRefresh] = useState(10000)
  const [menoresRefresh, setMenoresRefresh] = useState(11000)
  const [jubiladosRefresh, setJubiladosRefresh] = useState(12000)
  const [observacionesRefresh, setObservacionesRefresh] = useState(13000)

  const [isEditIngreso, setIsEditIngreso] = useState(false)

  const { fetchDataFromApi, sendDataToApi } = useApi()
  const [precios, setPrecios] = useState([])
  const [mediosDePago, setMediosDePago] = useState([])
  const [warnedEmptyPrices, setWarnedEmptyPrices] = useState(false)

  const notifyEmptyPrices = () => {
    Alert.alert(
      "Precios sin sincronizar",
      "La base local está vacía. ¿Desea sincronizar los precios ahora?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sincronizar", onPress: () => fetchPrecios() }
      ]
    )
  }

  const fetchPrecios = async () => {
    if (isFetchingPrecios.current) return false;
    isFetchingPrecios.current = true;
    if (!netInfo.isConnected) {
      if (!warnedEmptyPrices) {
        const allPrices = await preciosDb.getAll();
        if (!allPrices || allPrices.length === 0) {
          setWarnedEmptyPrices(true);
          notifyEmptyPrices();
        }
      }
      isFetchingPrecios.current = false;
      return false;
    }
    try {
      const data = await fetchDataFromApi('ingresos/precios');
      //console.log(data.data)  //25-01-2026
      if (!data || data?.error) return false;
      
      if (data?.data) {
        const passwordItem = data.data.find(item => item?.CLAVE === "ING_CLAVEVACIARBASE");
        if (passwordItem?.VALOR !== undefined && passwordItem?.VALOR !== null && passwordItem?.VALOR !== "") {
          await configDb.setConfigValue("ING_CLAVEVACIARBASE", String(passwordItem.VALOR));
        }

        const preciosItems = data.data.filter(item => item?.CLAVE !== "ING_CLAVEVACIARBASE");
        // 1. Enviamos los datos para que SQLite decida qué actualizar
        await preciosDb.upsertPrecios(preciosItems);

        // 2. Traemos la lista actualizada de la DB local
        const allPrices = await preciosDb.getAll();
        setPrecios(allPrices);
        if (allPrices && allPrices.length > 0) {
          await preciosDb.saveBackup(allPrices);
        }
        if ((!allPrices || allPrices.length === 0) && !warnedEmptyPrices) {
          setWarnedEmptyPrices(true);
          notifyEmptyPrices();
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error fetching precios:", error);
      return false;
    } finally {
      isFetchingPrecios.current = false;
    }
  };

  const fetchMediosDePago = async () => {
    if (isFetchingMedios.current) return false;
    isFetchingMedios.current = true;
    try {
      let okRemote = false;
      let attemptedRemote = false;
      if (netInfo.isConnected) {
        attemptedRemote = true;
        const data = await fetchDataFromApi('ingresos/medios_de_pago')

        if (!data || data?.error) {
          okRemote = false;
        } else if (data?.data) {
          await mediosDePagoDb.deleteAll()
          await mediosDePagoDb.createOrUpdate(data.data)
          okRemote = true;

          if (data.status_code == 200) {
            // Toast.show({
            //   type: "success",
            //   text1: "Medios de pago actualizados.",
            //   text2: "",
            //   visibilityTime: 1777,
            //   position: "bottom",
            //   autoHide: true,
            //   bottomOffset: 120,
            //   text1Style: { fontFamily: "Poppins-Bold", fontSize: 15 },
            //   text2Style: { fontFamily: "Poppins-Regular", fontSize: 13 },
            //   swipeable: true,
            // })
            null
          } else {
            Toast.show({
              type: "error",
              text1: "Error al actualizar los medios de pago.",
              text2: "",
              visibilityTime: 1777,
              position: "bottom",
              autoHide: true,
              bottomOffset: 120,
              text1Style: { fontFamily: "Poppins-Bold", fontSize: 15 },
              text2Style: { fontFamily: "Poppins-Regular", fontSize: 13 },
              swipeable: true,
            })
            okRemote = false;
          }
        }
      }

      let allMP = await mediosDePagoDb.getAll()
      if (!allMP || allMP.length === 0) {
        await mediosDePagoDb.ensureDefaults()
        allMP = await mediosDePagoDb.getAll()
      }
      setMediosDePago(allMP)
      if (okRemote && allMP && allMP.length > 0) {
        await mediosDePagoDb.saveBackup(allMP)
      }
      return attemptedRemote ? okRemote : false;
    } finally {
      isFetchingMedios.current = false;
    }
  }

  const hasPreciosBackup = async () => {
    try {
      const backup = await preciosDb.getBackupAll()
      return Array.isArray(backup) && backup.length > 0
    } catch (error) {
      console.error(error)
      return false
    }
  }

  const hasMediosBackup = async () => {
    try {
      const backup = await mediosDePagoDb.getBackupAll()
      return Array.isArray(backup) && backup.length > 0
    } catch (error) {
      console.error(error)
      return false
    }
  }

  const restorePreciosFromBackup = async () => {
    try {
      const restored = await preciosDb.restoreFromBackup()
      if (!restored) return false

      const allPrices = await preciosDb.getAll()
      setPrecios(allPrices)
      return true
    } catch (error) {
      console.error(error)
      Toast.show({
        type: "error",
        text1: "Error al recuperar precios",
        text2: "No se pudieron restaurar los precios.",
        position: "bottom",
        bottomOffset: 120,
        autoHide: true,
        text1Style: { fontFamily: "Poppins-Bold", fontSize: 15 },
        text2Style: { fontFamily: "Poppins-Regular", fontSize: 13 },
      })
      return false
    }
  }

  const restoreMediosDePagoFromBackup = async () => {
    try {
      const restored = await mediosDePagoDb.restoreFromBackup()
      if (!restored) return false

      const allMP = await mediosDePagoDb.getAll()
      setMediosDePago(allMP)
      return true
    } catch (error) {
      console.error(error)
      Toast.show({
        type: "error",
        text1: "Error al recuperar medios de pago",
        text2: "No se pudieron restaurar los medios de pago.",
        position: "bottom",
        bottomOffset: 120,
        autoHide: true,
        text1Style: { fontFamily: "Poppins-Bold", fontSize: 15 },
        text2Style: { fontFamily: "Poppins-Regular", fontSize: 13 },
      })
      return false
    }
  }

  const sendIngresos = async () => {
    let ingresos = await ingresoDb.getAll();

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
        telefono: item?.telefono ? item?.telefono : '',
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
        // console.log("ENVIANDO INGRESO", ingresosSend);
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
  };

  useEffect(() => {
    fetchPrecios()
    fetchMediosDePago()
  }, [])

  useEffect(() => {
    let mounted = true
    const pricesAreZero = (list) => {
      if (!Array.isArray(list) || list.length === 0) return true
      return list.every(item => !Number(item?.precio ?? item?.VALOR))
    }
    const autoEnsurePrecios = async () => {
      try {
        const allPrices = await preciosDb.getAll()
        if (!mounted || !pricesAreZero(allPrices)) return
        if (netInfo.isConnected) {
          if (autoPricesAttempted.current.onlineFetched) return
          autoPricesAttempted.current.onlineFetched = true
          await fetchPrecios()
        } else {
          if (autoPricesAttempted.current.offlineRestored) return
          autoPricesAttempted.current.offlineRestored = true
          await restorePreciosFromBackup()
        }
      } catch (error) {
        // ignore
      }
    }
    autoEnsurePrecios()
    return () => { mounted = false }
  }, [netInfo.isConnected, fetchPrecios, restorePreciosFromBackup, preciosDb])

  useEffect(() => {
    let mounted = true
    const mediosVacios = (list) => !Array.isArray(list) || list.length === 0
    const autoEnsureMedios = async () => {
      try {
        const allMedios = await mediosDePagoDb.getAll()
        if (!mounted || !mediosVacios(allMedios)) return
        if (netInfo.isConnected) {
          if (autoMediosAttempted.current.onlineFetched) return
          autoMediosAttempted.current.onlineFetched = true
          await fetchMediosDePago()
        } else {
          if (autoMediosAttempted.current.offlineRestored) return
          autoMediosAttempted.current.offlineRestored = true
          await restoreMediosDePagoFromBackup()
        }
      } catch (error) {
        // ignore
      }
    }
    autoEnsureMedios()
    return () => { mounted = false }
  }, [netInfo.isConnected, fetchMediosDePago, restoreMediosDePagoFromBackup, mediosDePagoDb])

  const handleDniSubmit = () => {
    if (!ingreso?.dni) {
      Alert.alert(
        'Advertencia.',
        'Debe ingresar el DNI del cliente.\n¿Desea hacerlo ahora?',
        [
          {
            text: "Cancelar",
            style: "cancel"
          },
          {
            text: "OK", onPress: () => {
              setDniRefresh(prevKey => prevKey + 1)

              setTimeout(() => {
                dniRef?.current?.focus()
              }, 500)
            }
          }
        ]
      )
    } else {
      setNombreRefresh(prevKey => prevKey + 1)

      setTimeout(() => {
        nombreRef?.current?.focus()
      }, 500)
    }
  }

  const refreshDniInput = () => {
    setDniRefresh(prevKey => prevKey + 1)
  }

  const handleNombreSubmit = () => {
    if (!ingreso?.apellido_nombre) {
      Alert.alert(
        'Advertencia.',
        'Debe ingresar el nombre y apellido del cliente.\n¿Desea hacerlo ahora?',
        [
          {
            text: "Cancelar",
            style: "cancel"
          },
          {
            text: "OK", onPress: () => {
              setNombreRefresh(prevKey => prevKey + 1)

              setTimeout(() => {
                nombreRef?.current?.focus()
              }, 500)
            }
          }
        ]
      )
    } else {
      setNacionalidadRefresh(prevKey => prevKey + 1)

      setTimeout(() => {
        nacionalidadRef?.current?.focus()
      }, 500)
    }
  }

  const handleParcelaSubmit = () => {
    setNacionalidadRefresh(prevKey => prevKey + 1)

    setTimeout(() => {
      nacionalidadRef?.current?.focus()
    }, 500)
  }

  const handleNacionalidadSubmit = () => {
    if (!ingreso?.nacionalidad) {
      Alert.alert(
        'Advertencia.',
        'Debe ingresar la nacionalidad de la persona.\n¿Desea hacerlo ahora?',
        [
          {
            text: "Cancelar",
            style: "cancel"
          },
          {
            text: "OK", onPress: () => {
              setNacionalidadRefresh(prevKey => prevKey + 1)

              setTimeout(() => {
                nacionalidadRef?.current?.focus()
              }, 500)
            }
          }
        ]
      )
    } else {
      setDireccionRefresh(prevKey => prevKey + 1)

      setTimeout(() => {
        direccionRef?.current?.focus()
      }, 500)
    }
  }

  const handleDireccionSubmit = (handleSave) => {
    if (!ingreso?.direccion) {
      Alert.alert(
        'Advertencia.',
        'Debe ingresar la dirección de la persona.\n¿Desea hacerlo ahora?',
        [
          {
            text: "Cancelar",
            style: "cancel"
          },
          {
            text: "OK", onPress: () => {
              setDireccionRefresh(prevKey => prevKey + 1)

              setTimeout(() => {
                direccionRef?.current?.focus()
              }, 500)
            }
          }
        ]
      )
    } else {
      setCiudadRefresh(prevKey => prevKey + 1)

      setTimeout(() => {
        ciudadRef?.current?.focus()
      }, 500)
    }
  }

  const handleCiudadSubmit = () => {
    if (!ingreso?.ciudad) {
      Alert.alert(
        'Advertencia.',
        'Debe ingresar la ciudad de la persona.\n¿Desea hacerlo ahora?',
        [
          {
            text: "Cancelar",
            style: "cancel"
          },
          {
            text: "OK", onPress: () => {
              setCiudadRefresh(prevKey => prevKey + 1)

              setTimeout(() => {
                ciudadRef?.current?.focus()
              }, 500)
            }
          }
        ]
      )
    } else {
      setTelefonoRefresh(prevKey => prevKey + 1)

      setTimeout(() => {
        telefonoRef?.current?.focus()
      }, 500)
    }
  }

  const handleTelefonoSubmit = () => {
    setPatenteRefresh(prevKey => prevKey + 1)

    setTimeout(() => {
      patenteRef?.current?.focus()
    }, 500)
  }

  const handlePatenteSubmit = () => {
    if (!ingreso?.patente) {
      Alert.alert(
        'Advertencia.',
        'Debe ingresar la patente.\n¿Desea hacerlo ahora?',
        [
          {
            text: "Cancelar",
            style: "cancel"
          },
          {
            text: "OK", onPress: () => {
              setPatenteRefresh(prevKey => prevKey + 1)

              setTimeout(() => {
                patenteRef?.current?.focus()
              }, 500)
            }
          }
        ]
      )
    } else {
      setModeloRefresh(prevKey => prevKey + 1)

      setTimeout(() => {
        modeloRef?.current?.focus()
      }, 500)
    }
  }

  const handleModeloSubmit = () => {
    if (!ingreso?.modelo_vehiculo) {
      Alert.alert(
        'Advertencia.',
        'Debe ingresar el modelo del vehículo.\n¿Desea hacerlo ahora?',
        [
          {
            text: "Cancelar",
            style: "cancel"
          },
          {
            text: "OK", onPress: () => {
              setModeloRefresh(prevKey => prevKey + 1)

              setTimeout(() => {
                modeloRef?.current?.focus()
              }, 500)
            }
          }
        ]
      )
    }
    else {
      setObservacionesRefresh(prevKey => prevKey + 1)

      setTimeout(() => {
        observacionesRef?.current?.focus()
      }, 500)
    }
  }

  const handleObservacionesSubmit = () => {
    router.replace('/ingresos/next')
  }

  const handleBajadaSubmit = () => {
    // setAmarreRefresh(prevKey => prevKey + 1)

    // setTimeout(() => {
    //   amarreRef?.current?.focus()
    // }, 500)

    setMayoresRefresh(prevKey => prevKey + 1)

    setTimeout(() => {
      mayoresRef?.current?.focus()
    }, 500)
  }

  const handleAmarreSubmit = () => {
    setMayoresRefresh(prevKey => prevKey + 1)

    setTimeout(() => {
      mayoresRef?.current?.focus()
    }, 500)
  }

  const handleMayoresSubmit = () => {
    setMenoresRefresh(prevKey => prevKey + 1)

    setTimeout(() => {
      menoresRef?.current?.focus()
    }, 500)
  }

  const handleMenoresSubmit = () => {
    setJubiladosRefresh(prevKey => prevKey + 1)

    setTimeout(() => {
      jubiladosRef?.current?.focus()
    }, 500)
  }

  const handleJubiladosSubmit = () => {
    setObservacionesRefresh(prevKey => prevKey + 1)

    setTimeout(() => {
      observacionesRef?.current?.focus()
    }, 500)
  }

  const list = async () => {
    setIsLoading(true)

    try {
      const response = await ingresoDb.searchByAllItemInfo(searchText)
      setIngresos(response)
      // console.log('INGRESOS DATA:', response)
    } catch (error) {
      // Alert.alert("Error", "No se han podido obtener los ingresos.")
      console.error(error)

      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se han podido obtener los ingresos.",
        position: "bottom",
        bottomOffset: 130,
        autoHide: false,
        text1Style: { fontFamily: "Poppins-Bold", fontSize: 15 },
        text2Style: { fontFamily: "Poppins-Medium", fontSize: 13 },
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getPrecioFromList = (codigo) => {
    const item = precios.find(p => p?.codigo === codigo || p?.CLAVE === codigo);
    const value = item?.precio ?? item?.VALOR;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  };

  const isSameDay = ingresoString && egresoString && ingresoString === egresoString;

  const priceCodes = {
    adultos: {
      normal: "ING_MAYOR",
      diurno: "INGD_MAYOR",
      local: "INGL_MAYOR",
      localDiurno: "INGLD_MAYOR",
    },
    menores: {
      normal: "ING_MENOR",
      diurno: "INGD_MENOR",
      local: "INGL_MENOR",
      localDiurno: "INGLD_MENOR",
    },
    jubilados: {
      normal: "ING_JUBILADO",
      diurno: "INGD_JUBILADO",
      local: "INGL_JUBILADO",
      localDiurno: "INGLD_JUBILADO",
    },
    bajada_lancha: {
      normal: "ING_BAJADALANCHA",
      local: "INGL_BAJADALANCHA",
    },
  };

  const getUnitPrice = (key, local) => {
    const codes = priceCodes[key];
    if (!codes) return 0;
    if (key === "bajada_lancha") {
      return getPrecioFromList(local ? codes.local : codes.normal);
    }
    const code = local
      ? (isSameDay ? codes.localDiurno : codes.local)
      : (isSameDay ? codes.diurno : codes.normal);
    return getPrecioFromList(code);
  };

  const getHydratedPrice = (value, fallback) => {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
    const next = Number(fallback);
    return Number.isFinite(next) ? next : 0;
  };

  const calcularSubTotal = () => {
    const estadiaNumber = Number(ingreso?.estadia) || 1;
    const baseEstadia = ["adultos", "menores", "jubilados", "bajada_lancha"].reduce((acc, key) => {
      const v = (Number(ingreso?.[key]) || 0) * getUnitPrice(key, false);
      const l = (Number(ingreso?.[`${key}L`]) || 0) * getUnitPrice(key, true);
      return acc + v + l;
    }, 0) * estadiaNumber;

    const motorhomeSubtotal =
      ((Number(ingreso?.adicional) || 0) * getPrecioFromList("ING_MOTORHOME") +
        (Number(ingreso?.adicionalL) || 0) * getPrecioFromList("INGL_MOTORHOME")) *
      estadiaNumber;

    const estacionamientoSubtotal = ingreso?.estacionamiento
      ? getPrecioFromList("ING_ESTACIONAMIENTO")
      : 0;

    return baseEstadia + motorhomeSubtotal + estacionamientoSubtotal;
  };

  const calcularTotal = () => {
    const subtotal = calcularSubTotal();
    const descuento = Number(ingreso?.descuento) || 0;
    return subtotal - (subtotal * descuento) / 100;
  };

  const buildPrecioPayload = () => ({
    precio_adultos: getHydratedPrice(ingreso?.precio_adultos, getUnitPrice("adultos", false)),
    precio_menores: getHydratedPrice(ingreso?.precio_menores, getUnitPrice("menores", false)),
    precio_jubilados: getHydratedPrice(ingreso?.precio_jubilados, getUnitPrice("jubilados", false)),
    precio_bajada_lancha: getHydratedPrice(ingreso?.precio_bajada_lancha, getUnitPrice("bajada_lancha", false)),
    precio_adultosL: getHydratedPrice(ingreso?.precio_adultosL, getUnitPrice("adultos", true)),
    precio_menoresL: getHydratedPrice(ingreso?.precio_menoresL, getUnitPrice("menores", true)),
    precio_jubiladosL: getHydratedPrice(ingreso?.precio_jubiladosL, getUnitPrice("jubilados", true)),
    precio_bajada_lanchaL: getHydratedPrice(ingreso?.precio_bajada_lanchaL, getUnitPrice("bajada_lancha", true)),
    precio_adicional: getHydratedPrice(ingreso?.precio_adicional, getPrecioFromList("ING_MOTORHOME")),
    precio_adicionalL: getHydratedPrice(ingreso?.precio_adicionalL, getPrecioFromList("INGL_MOTORHOME")),
    precio_estacionamiento: getHydratedPrice(ingreso?.precio_estacionamiento, getPrecioFromList("ING_ESTACIONAMIENTO")),
  });


  const create = async () => {

    try {
      const totalCalculado = calcularTotal();
      const subtotalCalculado = calcularSubTotal()
      const preciosPayload = buildPrecioPayload();

      // console.log("CREANDO: ", {
      //   subtotal: ingreso?.subtotal || 0,
      //   total: ingreso?.total || 0,
      // })

      const newId = await ingresoDb.create({
        apellido_nombre: ingreso?.apellido_nombre,
        ingreso: ingresoString,
        egreso: egresoString,
        observaciones: ingreso?.observaciones,

        adultos: ingreso?.adultos,
        menores: ingreso?.menores,
        jubilados: ingreso?.jubilados,
        bajada_lancha: ingreso?.bajada_lancha,
        adultosL: ingreso?.adultosL,
        menoresL: ingreso?.menoresL,
        jubiladosL: ingreso?.jubiladosL,
        bajada_lanchaL: ingreso?.bajada_lanchaL,
        adicional: ingreso?.adicional,
        adicionalL: ingreso?.adicionalL,
        estacionamiento: ingreso?.estacionamiento,
        ...preciosPayload,

        parcela: ingreso?.parcela,
        dni: ingreso?.dni,
        nacionalidad: ingreso?.nacionalidad,
        direccion: ingreso?.direccion,
        telefono: ingreso?.telefono,
        modelo_vehiculo: ingreso?.modelo_vehiculo,
        ciudad: ingreso?.ciudad,
        patente: ingreso?.patente,
        amarre: !!ingreso?.amarre,
        trekking: !!ingreso?.trekking,
        kayak: !!ingreso?.kayak,
        embarcado: !!ingreso?.embarcado,
        descuento: ingreso?.descuento || 0,
        subtotal: subtotalCalculado || 0,
        total: totalCalculado || 0,
        sincronizado: false,
        // egreso_real: null,
        egresar: false,
        local: ingreso?.local,
        medio_de_pago: ingreso?.medio_de_pago,
        anulado: false,
        estadia: ingreso?.estadia
      })

      if (netInfo.isConnected) {
        sendIngresos();
      }

      if (newId) {
        setIngreso(prev => ({ ...prev, id: newId }))
      }

      list()
      router.replace("/")

      Toast.show({
        type: "success",
        text1: "Ingreso creado con éxito.",
        text2: "",
        visibilityTime: 1777,
        position: "bottom",
        autoHide: true,
        bottomOffset: 120,
        text1Style: { fontFamily: "Poppins-Bold", fontSize: 15 },
        text2Style: { fontFamily: "Poppins-Regular", fontSize: 13 },
        swipeable: true,
      })

      return newId

    } catch (error) {
      // Alert.alert("Error", "No se ha podido crear el ingreso.")
      console.error(error)

      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se ha podido crear el ingreso.",
        position: "bottom",
        bottomOffset: 130,
        autoHide: false,
        text1Style: { fontFamily: "Poppins-Bold", fontSize: 15 },
        text2Style: { fontFamily: "Poppins-Medium", fontSize: 13 },
      })
    }
  }

  const update = async () => {

    try {
      const totalCalculado = calcularTotal();
      const subtotalCalculado = calcularSubTotal()
      const preciosPayload = buildPrecioPayload();

      await ingresoDb.update({
        id: ingreso?.id,
        apellido_nombre: ingreso?.apellido_nombre,
        ingreso: ingresoString,
        egreso: egresoString,
        observaciones: ingreso?.observaciones,

        adultos: ingreso?.adultos,
        menores: ingreso?.menores,
        jubilados: ingreso?.jubilados,
        bajada_lancha: ingreso?.bajada_lancha,
        adultosL: ingreso?.adultosL,
        menoresL: ingreso?.menoresL,
        jubiladosL: ingreso?.jubiladosL,
        bajada_lanchaL: ingreso?.bajada_lanchaL,
        adicional: ingreso?.adicional,
        adicionalL: ingreso?.adicionalL,
        estacionamiento: ingreso?.estacionamiento,
        ...preciosPayload,

        parcela: ingreso?.parcela,
        dni: ingreso?.dni,
        nacionalidad: ingreso?.nacionalidad,
        direccion: ingreso?.direccion,
        telefono: ingreso?.telefono,
        modelo_vehiculo: ingreso?.modelo_vehiculo,
        ciudad: ingreso?.ciudad,
        patente: ingreso?.patente,

        amarre: !!ingreso?.amarre,
        trekking: !!ingreso?.trekking,
        kayak: !!ingreso?.kayak,
        embarcado: !!ingreso?.embarcado,
        descuento: ingreso?.descuento || 0,
        subtotal: subtotalCalculado || 0,
        total: totalCalculado || 0,
        sincronizado: false,
        local: ingreso?.local,
        medio_de_pago: ingreso?.medio_de_pago,
        egresar: ingreso?.egresar,
        estadia: ingreso?.estadia
      })

      if (netInfo.isConnected) {
        sendIngresos();
      }

      list()
      router.replace("/")

      Toast.show({
        type: "success",
        text1: "Actualizado exitosamente",
        text2: "El ingreso fue actualizado correctamente.",
        visibilityTime: 1777,
        position: "bottom",
        bottomOffset: 120,
        text1Style: { fontFamily: "Poppins-Bold", fontSize: 15 },
        text2Style: { fontFamily: "Poppins-Regular", fontSize: 13 },
        swipeable: true,
      })

    } catch (error) {
      // Alert.alert("Error", "No se ha podido actualizar el ingreso.")
      console.error(error)

      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se ha podido actualizar el ingreso.",
        position: "bottom",
        bottomOffset: 130,
        autoHide: false,
        text1Style: { fontFamily: "Poppins-Bold", fontSize: 15 },
        text2Style: { fontFamily: "Poppins-Medium", fontSize: 13 },
      })
    }
  }

  const markOut = async () => {

    try {
      const totalCalculado = calcularTotal();
      const subtotalCalculado = calcularSubTotal()
      const preciosPayload = buildPrecioPayload();

      // console.log('ENVIOO: ',
      //   {
      //     id: ingreso?.id,
      //     apellido_nombre: ingreso?.apellido_nombre,
      //     ingreso: ingresoString,
      //     egreso: egresoString,
      //     observaciones: ingreso?.observaciones,
      //     adultos: ingreso?.adultos,
      //     precio_adultos: ingreso?.precio_adultos,
      //     menores: ingreso?.menores,
      //     precio_menores: ingreso?.precio_menores,
      //     jubilados: ingreso?.jubilados,
      //     precio_jubilados: ingreso?.precio_jubilados,
      //     parcela: ingreso?.parcela,
      //     dni: ingreso?.dni,
      //     nacionalidad: ingreso?.nacionalidad,
      //     direccion: ingreso?.direccion,
      //     modelo_vehiculo: ingreso?.modelo_vehiculo,
      //     ciudad: ingreso?.ciudad,
      //     patente: ingreso?.patente,
      //     bajada_lancha: ingreso?.precio_bajada_lancha > 0 ? 1 : 0,
      //     precio_bajada_lancha: ingreso?.precio_bajada_lancha,

      //     amarre: !!ingreso?.amarre,
      //     trekking: !!ingreso?.trekking,
      //     kayak: !!ingreso?.kayak,
      //     embarcado: !!ingreso?.embarcado,
      //     descuento: ingreso?.descuento || 0,
      //     subtotal: subtotalCalculado || 0,
      //     total: totalCalculado || 0,
      //     egreso_real: new Date().toISOString(),
      //     egresar: true,
      //     local: ingreso?.local,
      //     medio_de_pago: ingreso?.medio_de_pago,
      //     anulado: false,
      //     // sincronizado: false,
      //   }
      // )

      await ingresoDb.update({
        id: ingreso?.id,
        apellido_nombre: ingreso?.apellido_nombre,
        ingreso: ingresoString,
        egreso: egresoString,
        observaciones: ingreso?.observaciones,

        adultos: ingreso?.adultos,
        menores: ingreso?.menores,
        jubilados: ingreso?.jubilados,
        bajada_lancha: ingreso?.bajada_lancha,
        adultosL: ingreso?.adultosL,
        menoresL: ingreso?.menoresL,
        jubiladosL: ingreso?.jubiladosL,
        bajada_lanchaL: ingreso?.bajada_lanchaL,
        adicional: ingreso?.adicional,
        adicionalL: ingreso?.adicionalL,
        estacionamiento: ingreso?.estacionamiento,
        ...preciosPayload,

        parcela: ingreso?.parcela,
        dni: ingreso?.dni,
        nacionalidad: ingreso?.nacionalidad,
        direccion: ingreso?.direccion,
        telefono: ingreso?.telefono,
        modelo_vehiculo: ingreso?.modelo_vehiculo,
        ciudad: ingreso?.ciudad,
        patente: ingreso?.patente,

        amarre: !!ingreso?.amarre,
        trekking: !!ingreso?.trekking,
        kayak: !!ingreso?.kayak,
        embarcado: !!ingreso?.embarcado,
        descuento: ingreso?.descuento || 0,
        subtotal: subtotalCalculado || 0,
        total: totalCalculado || 0,
        egreso_real: new Date().toISOString(),
        egresar: true,
        local: ingreso?.local,
        medio_de_pago: ingreso?.medio_de_pago,
        anulado: false,
        estadia: ingreso?.estadia,
        // sincronizado: false,
      })

      if (netInfo.isConnected) {
        sendIngresos();
      }

      list()
      router.replace("/")

      Toast.show({
        type: "success",
        text1: "Actualizado exitosamente",
        text2: "El ingreso fue actualizado correctamente.",
        visibilityTime: 1777,
        position: "bottom",
        bottomOffset: 120,
        text1Style: { fontFamily: "Poppins-Bold", fontSize: 15 },
        text2Style: { fontFamily: "Poppins-Regular", fontSize: 13 },
        swipeable: true,
      })

    } catch (error) {
      // Alert.alert("Error", "No se ha podido actualizar el ingreso.")
      console.error(error)

      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se ha podido actualizar el ingreso.",
        position: "bottom",
        bottomOffset: 130,
        autoHide: false,
        text1Style: { fontFamily: "Poppins-Bold", fontSize: 15 },
        text2Style: { fontFamily: "Poppins-Medium", fontSize: 13 },
      })
    }
  }

  const anulled = async () => {

    try {
      const totalCalculado = calcularTotal();
      const subtotalCalculado = calcularSubTotal()
      const preciosPayload = buildPrecioPayload();

      await ingresoDb.update({
        id: ingreso?.id,
        apellido_nombre: ingreso?.apellido_nombre,
        ingreso: ingresoString,
        egreso: egresoString,
        observaciones: ingreso?.observaciones,

        adultos: ingreso?.adultos,
        menores: ingreso?.menores,
        jubilados: ingreso?.jubilados,
        bajada_lancha: ingreso?.bajada_lancha,
        adultosL: ingreso?.adultosL,
        menoresL: ingreso?.menoresL,
        jubiladosL: ingreso?.jubiladosL,
        bajada_lanchaL: ingreso?.bajada_lanchaL,
        adicional: ingreso?.adicional,
        adicionalL: ingreso?.adicionalL,
        estacionamiento: ingreso?.estacionamiento,
        ...preciosPayload,

        parcela: ingreso?.parcela,
        dni: ingreso?.dni,
        nacionalidad: ingreso?.nacionalidad,
        direccion: ingreso?.direccion,
        telefono: ingreso?.telefono,
        modelo_vehiculo: ingreso?.modelo_vehiculo,
        ciudad: ingreso?.ciudad,
        patente: ingreso?.patente,

        amarre: !!ingreso?.amarre,
        trekking: !!ingreso?.trekking,
        kayak: !!ingreso?.kayak,
        embarcado: !!ingreso?.embarcado,
        descuento: ingreso?.descuento || 0,
        subtotal: subtotalCalculado || 0,
        total: totalCalculado || 0,
        sincronizado: false,
        local: ingreso?.local,
        medio_de_pago: ingreso?.medio_de_pago,
        egresar: ingreso?.egresar,
        anulado: true,
        estadia: ingreso?.estadia
      })

      if (netInfo.isConnected) {
        sendIngresos();
      }

      list()
      router.replace("/")

      Toast.show({
        type: "success",
        text1: "Anulado exitosamente",
        text2: "El ingreso fue actualizado correctamente.",
        visibilityTime: 1777,
        position: "bottom",
        bottomOffset: 120,
        text1Style: { fontFamily: "Poppins-Bold", fontSize: 15 },
        text2Style: { fontFamily: "Poppins-Regular", fontSize: 13 },
        swipeable: true,
      })

    } catch (error) {
      // Alert.alert("Error", "No se ha podido actualizar el ingreso.")
      console.error(error)

      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se ha podido anular el ingreso.",
        position: "bottom",
        bottomOffset: 130,
        autoHide: false,
        text1Style: { fontFamily: "Poppins-Bold", fontSize: 15 },
        text2Style: { fontFamily: "Poppins-Medium", fontSize: 13 },
      })
    }
  }

  useEffect(() => {
    list()
  }, [searchText])

  const deleteIngreso = async () => {
    try {
      await ingresoDb.deleteIngreso(ingreso?.id)

      Toast.show({
        type: "success",
        text1: "Eliminado exitosamente",
        text2: "El ingreso fue eliminado con éxito.",
        visibilityTime: 1777,
        position: "bottom",
        bottomOffset: 120,
        text1Style: { fontFamily: "Poppins-Bold", fontSize: 15 },
        text2Style: { fontFamily: "Poppins-Regular", fontSize: 13 },
        swipeable: true,
      })

      router.replace("/")
      list();
    } catch (error) {
      // Alert.alert("Error", "No se ha podido eliminar el ingreso.")
      console.error(error)

      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se ha podido eliminar el ingreso.",
        position: "bottom",
        bottomOffset: 130,
        autoHide: false,
        text1Style: { fontFamily: "Poppins-Bold", fontSize: 15 },
        text2Style: { fontFamily: "Poppins-Medium", fontSize: 13 },
      })
    }
  }

  const handleDeleteIngreso = () => {
    return Alert.alert("¿Eliminar?", "¿Está seguro que desea eliminar el ingreso? No podrá recuperarlo.", [
      {
        text: "Si",
        onPress: () => {
          deleteIngreso();
        },
      },
      {
        text: "No",
      },
    ]);
  };

  const handleSaveIngreso = async () => {

    if (!ingresoString) {                            // FALTAAAAAAAAAAAAAAAAAAA
      // return Alert.alert("Advertencia", "Debe ingresar la fecha de ingreso.");

      return Toast.show({
        type: "error",
        text1: "Advertencia",
        text2: "Debe ingresar la fecha de ingreso.",
        visibilityTime: 2323,
        position: "bottom",
        bottomOffset: 120,
        text1Style: { fontFamily: "Poppins-Bold", fontSize: 15 },
        text2Style: { fontFamily: "Poppins-Regular", fontSize: 13 },
        swipeable: true,
      })
    }

    if (!egresoString) {
      // return Alert.alert("Advertencia", "Debe ingresar la fecha de egreso.");

      return Toast.show({
        type: "error",
        text1: "Advertencia",
        text2: "Debe ingresar la fecha de egreso.",
        visibilityTime: 2323,
        position: "bottom",
        bottomOffset: 120,
        text1Style: { fontFamily: "Poppins-Bold", fontSize: 15 },
        text2Style: { fontFamily: "Poppins-Regular", fontSize: 13 },
        swipeable: true,
      })
    }

    if (!ingreso?.dni) {
      // return Alert.alert("Advertencia", "Debe ingresar el DNI.");

      return Toast.show({
        type: "error",
        text1: "Advertencia",
        text2: "Debe ingresar el DNI.",
        visibilityTime: 2323,
        position: "bottom",
        bottomOffset: 120,
        text1Style: { fontFamily: "Poppins-Bold", fontSize: 15 },
        text2Style: { fontFamily: "Poppins-Regular", fontSize: 13 },
        swipeable: true,
      })
    }

    if (!ingreso?.apellido_nombre) {
      // return Alert.alert("Advertencia", "Debe ingresar el nombre del cliente.");

      return Toast.show({
        type: "error",
        text1: "Advertencia",
        text2: "Debe ingresar el nombre del cliente.",
        visibilityTime: 2323,
        position: "bottom",
        bottomOffset: 120,
        text1Style: { fontFamily: "Poppins-Bold", fontSize: 15 },
        text2Style: { fontFamily: "Poppins-Regular", fontSize: 13 },
        swipeable: true,
      })
    }

    try {
      let savedId = ingreso?.id ?? null

      if (isEditIngreso) {
        await update()
      } else {
        savedId = await create()
      }

      handleCliente();
      return savedId
    } catch (err) {
      console.error(err);
    }
  };

  const handleCliente = async () => {
    try {
      const cliente = await clienteDb.findByDni(ingreso?.dni)
      // console.log(cliente)

      const existeCliente = cliente.length > 0

      if (!existeCliente) {
        // console.log('no existe cliente')

        await clienteDb.create({
          apellido_nombre: ingreso?.apellido_nombre,
          dni: ingreso?.dni,
          nacionalidad: ingreso?.nacionalidad,
          direccion: ingreso?.direccion,
          modelo_vehiculo: ingreso?.modelo_vehiculo,
          ciudad: ingreso?.ciudad,
          patente: ingreso?.patente,
        })
      } else {
        // console.log('existe cliente')

        await clienteDb.update({
          apellido_nombre: ingreso?.apellido_nombre,
          dni: ingreso?.dni,
          nacionalidad: ingreso?.nacionalidad,
          direccion: ingreso?.direccion,
          modelo_vehiculo: ingreso?.modelo_vehiculo,
          ciudad: ingreso?.ciudad,
          patente: ingreso?.patente,
        })
      }
    } catch (error) {
      console.error(error)
      Alert.alert('Error', 'No se ha podido crear el cliente.')
    }
  }

  return (
    <IngresoContext.Provider
      value={{
        dniRef, nombreRef, parcelaRef, nacionalidadRef, direccionRef, ciudadRef, telefonoRef, patenteRef, modeloRef,
        bajadaRef, amarreRef, mayoresRef, menoresRef, jubiladosRef, observacionesRef,

        dniRefresh, nombreRefresh, parcelaRefresh, nacionalidadRefresh, direccionRefresh, ciudadRefresh, telefonoRefresh, patenteRefresh, modeloRefresh,
        bajadaRefresh, amarreRefresh, mayoresRefresh, menoresRefresh, jubiladosRefresh, observacionesRefresh,

        refreshDniInput,
        handleDniSubmit, handleNombreSubmit, handleParcelaSubmit, handleNacionalidadSubmit, handleDireccionSubmit, handleCiudadSubmit, handleTelefonoSubmit, handlePatenteSubmit, handleModeloSubmit,
        handleBajadaSubmit, handleAmarreSubmit, handleMayoresSubmit, handleMenoresSubmit, handleJubiladosSubmit, handleObservacionesSubmit,

        ingreso, setIngreso,
        ingresoDate, setIngresoDate,
        ingresoString, setIngresoString,
        showIngreso, setShowIngreso,

        egresoDate, setEgresoDate,
        egresoString, setEgresoString,
        showEgreso, setShowEgreso,

        isEditIngreso, setIsEditIngreso,

        ingresos, setIngresos,
        searchText, setSearchText,

        list, create, update,
        handleSaveIngreso, handleDeleteIngreso, markOut,

        isLoading, setIsLoading,
        precios, setPrecios,
        mediosDePago, setMediosDePago,
        anulled,

        fetchPrecios, fetchMediosDePago,
        restorePreciosFromBackup, restoreMediosDePagoFromBackup,
        hasPreciosBackup, hasMediosBackup
      }}
    >
      {children}
    </IngresoContext.Provider>
  )
}

export default IngresoContextProvider
