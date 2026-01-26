import { useSQLiteContext } from "expo-sqlite"

export type ConfigDb = {
  id: number
  clave: string
  valor: string
}

export function useConfigDb () {
  const database = useSQLiteContext()
  
  const fetchConfig = async () => {    
    try {
      const query = 'SELECT * FROM configuracion'
      
      const response = await database.getAllAsync<ConfigDb>(query)
      return response
    } catch (error) {
      throw error
    }
  }
  
  const getConfigValue = async (clave: string) => {    
    try {
      const query = 'SELECT valor FROM configuracion WHERE clave = ?'
      
      const response = await database.getAllAsync<ConfigDb>(query, [clave])
      return response
    } catch (error) {
      throw error
    }
  }
  
  const setConfigValue = async (clave: string, valor: string) => {
    const exists = await getConfigValue(clave)
    // console.log(exists)

    let sql

    if (exists.length === 0) {
      sql = `INSERT INTO configuracion (clave, valor) VALUES ($clave, $valor)`
      // console.log('insert')
    } else {
      sql = `UPDATE configuracion SET valor = $valor WHERE clave = $clave`
      // console.log('update')
    }

    const statement = await database.prepareAsync(sql)

    try {
      await statement.executeAsync({
        $clave: clave,
        $valor: valor,
      })
    } catch (error) {
      throw error
    } finally {
      await statement.finalizeAsync()
    }
  }
  
  const createOrUpdate = async (data: ConfigDb) => {
    const [exists] = await getConfigValue(data.clave)
    // console.log(exists)

    let sql

    if (!exists) {
      // console.log('no existia', exists)
      sql = `INSERT INTO configuracion (clave, valor) VALUES ($clave, $valor)`
    } else {
      // console.log('existia', exists)
      sql = `UPDATE configuracion SET valor = $valor WHERE clave = $clave`
    }

    const statement = await database.prepareAsync(sql)

    try {
      await statement.executeAsync({
        $clave: data.clave,
        $valor: data.valor,
      })
    } catch (error) {
      throw error
    } finally {
      await statement.finalizeAsync()
    }
  }

  const deleteAllConfig = async () => {
    try {
      await database.execAsync('DELETE FROM configuracion')
    } catch (error) {
      throw error
    }
  }
  
  return { fetchConfig, getConfigValue, setConfigValue, createOrUpdate, deleteAllConfig }
}
