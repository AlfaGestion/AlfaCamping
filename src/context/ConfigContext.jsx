import { useState, createContext, useRef } from 'react'
import { Alert } from 'react-native'

export const ConfigContext = createContext()

const ConfigContextProvider = ({ children }) => {
  const [config, setConfig] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const [id, setId] = useState('')
  const [apiUri, setApiUri] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [databaseId, setDatabaseId] = useState('')
  const [allowsDuplicated, setAllowsDuplicated] = useState(false)
  const [printerIp, setPrinterIp] = useState('')
  const [printOffsetMm, setPrintOffsetMm] = useState('')
  const [printQueueDelayMs, setPrintQueueDelayMs] = useState('')
  const [printRetries, setPrintRetries] = useState('')
  const [printRetryDelayMs, setPrintRetryDelayMs] = useState('')
  
  const apiRef = useRef(null)
  const userRef = useRef(null)
  const passRef = useRef(null)
  const customerRef = useRef(null)
  const dbRef = useRef(null)
  const submitRef = useRef(null)
  
  const [apiRefresh, setApiRefresh] = useState(0)
  const [userRefresh, setUserRefresh] = useState(1000)
  const [passRefresh, setPassRefresh] = useState(2000)
  const [customerRefresh, setCustomerRefresh] = useState(3000)
  const [dbRefresh, setDbRefresh] = useState(4000)
  
  const handleURISubmit = () => {
    if (!apiUri) {
      Alert.alert(
        'Advertencia.',
        'Debe ingresar la URL de la API.\n¿Desea hacerlo ahora?',
        [
          {
            text: "Cancelar",
            style: "cancel"
          },
          { text: "OK", onPress: () => {
            setApiRefresh(prevKey => prevKey + 1)

            setTimeout(() => {
              apiRef?.current?.focus()
            }, 200)
          }}
        ]
      )
    } else {
      setUserRefresh(prevKey => prevKey + 1)

      setTimeout(() => {
        userRef?.current?.focus()
      }, 200)
    }
  }

  const handleUserSubmit = () => {
    if (!username) {
      Alert.alert(
        'Advertencia.',
        'Debe ingresar el nombre de usuario.\n¿Desea hacerlo ahora?',
        [
          {
            text: "Cancelar",
            style: "cancel"
          },
          { text: "OK", onPress: () => {
            setUserRefresh(prevKey => prevKey + 1)

            setTimeout(() => {
              userRef?.current?.focus()
            }, 200)
          }}
        ]
      )
    } else {
      setPassRefresh(prevKey => prevKey + 1)

      setTimeout(() => {
        passRef?.current?.focus()
      }, 200)
    }
  }

  const handlePassSubmit = () => {
    if (!password) {
      Alert.alert(
        'Advertencia.',
        'Debe ingresar la contraseña.\n¿Desea hacerlo ahora?',
        [
          {
            text: "Cancelar",
            style: "cancel"
          },
          { text: "OK", onPress: () => {
            setPassRefresh(prevKey => prevKey + 1)

            setTimeout(() => {
              passRef?.current?.focus()
            }, 200)
          }}
        ]
      )
    } else {
      setCustomerRefresh(prevKey => prevKey + 1)

      setTimeout(() => {
        customerRef?.current?.focus()
      }, 200)
    }
  }

  const handleCustomerSubmit = () => {
    if (!customerId) {
      Alert.alert(
        'Advertencia.',
        'Debe ingresar el ID de cliente.\n¿Desea hacerlo ahora?',
        [
          {
            text: "Cancelar",
            style: "cancel"
          },
          { text: "OK", onPress: () => {
            setCustomerRefresh(prevKey => prevKey + 1)

            setTimeout(() => {
              customerRef?.current?.focus()
            }, 200)
          }}
        ]
      )
    } else {
      setDbRefresh(prevKey => prevKey + 1)

      setTimeout(() => {
        dbRef?.current?.focus()
      }, 200)
    }
  }

  const handleDbSubmit = (handleSave) => {
    if (!databaseId) {
      Alert.alert(
        'Advertencia.',
        'Debe ingresar el ID de base de datos.\n¿Desea hacerlo ahora?',
        [
          {
            text: "Cancelar",
            style: "cancel"
          },
          { text: "OK", onPress: () => {
            setDbRefresh(prevKey => prevKey + 1)

            setTimeout(() => {
              dbRef?.current?.focus()
            }, 200)
          }}
        ]
      )
    } else {
      handleSave()
    }
  }

  return (
    <ConfigContext.Provider
      value={{
        config, setConfig,
        isLoading, setIsLoading,

        id, setId,
        apiUri, setApiUri,
        username, setUsername,
        password, setPassword,
        customerId, setCustomerId,
        databaseId, setDatabaseId,
        allowsDuplicated, setAllowsDuplicated,
        printerIp, setPrinterIp,
        printOffsetMm, setPrintOffsetMm,
        printQueueDelayMs, setPrintQueueDelayMs,
        printRetries, setPrintRetries,
        printRetryDelayMs, setPrintRetryDelayMs,

        apiRef, userRef, passRef, customerRef, dbRef, submitRef,

        apiRefresh, userRefresh, passRefresh, customerRefresh, dbRefresh,

        handleURISubmit, handleUserSubmit, handlePassSubmit, handleCustomerSubmit, handleDbSubmit
      }}
    >
      {children}
    </ConfigContext.Provider>
  )
}

export default ConfigContextProvider
