import { useSQLiteContext } from "expo-sqlite"

export type ClienteDb = {
  id: number
  apellido_nombre: string
  dni: string
  nacionalidad: string
  direccion: string
  modelo_vehiculo: string
  ciudad: string
  patente: string
  telefono: string
}

export function useClienteDb () {
  const database = useSQLiteContext()
  
    const getAll = async () => {    
      try {
        const query = 'SELECT * FROM clientes'
        
        const response = await database.getAllAsync<ClienteDb>(query)
        return response
      } catch (error) {
        throw error
      }
    }
  
    const findByDni = async (dni: number) => {    
      try {
        const query = 'SELECT * FROM clientes WHERE dni = ?'
        
        const response = await database.getAllAsync<ClienteDb>(query, [dni])
        return response
      } catch (error) {
        throw error
      }
    }
    
  const findByDniLike = async (dni: number) => {    
    try {
      const query = 'SELECT dni FROM clientes WHERE dni LIKE ?'
      
      const response = await database.getAllAsync<ClienteDb>(query, [`%${dni}%`])
      return response
    } catch (error) {
      throw error
    }
  }
  
  const searchByName = async (apellido_nombre: string) => {    
    try {
      const query = 'SELECT * FROM clientes WHERE apellido_nombre LIKE ?'
      
      const response = await database.getAllAsync<ClienteDb>(query, [`%${apellido_nombre}%`])
      return response
    } catch (error) {
      throw error
    }
  }

  const create = async (data: Omit<ClienteDb, 'id'>) => {
    const statement = await database.prepareAsync(
      `INSERT INTO clientes
      (apellido_nombre, dni, nacionalidad, direccion, modelo_vehiculo, ciudad, patente, telefono)
      VALUES ($apellido_nombre, $dni, $nacionalidad, $direccion, $modelo_vehiculo, $ciudad, $patente, $telefono)`
    )

    try {
      const result = await statement.executeAsync({
        $apellido_nombre: data.apellido_nombre,
        $dni: data.dni,
        $nacionalidad: data.nacionalidad,
        $direccion: data.direccion,
        $modelo_vehiculo: data.modelo_vehiculo,
        $ciudad: data.ciudad,
        $patente: data.patente,
        $telefono: data.telefono,
      })

      const insertedRowId = result.lastInsertRowId.toLocaleString()

      return { insertedRowId }
    } catch (error) {
      throw error
    } finally {
      await statement.finalizeAsync()
    }
  }
  
  const update = async (data: ClienteDb) => {
    const statement = await database.prepareAsync(
      `UPDATE clientes SET
        apellido_nombre = $apellido_nombre,
        nacionalidad = $nacionalidad,
        direccion = $direccion,
        modelo_vehiculo = $modelo_vehiculo,
        ciudad = $ciudad,
        patente = $patente,
        telefono = $telefono
      WHERE dni = $dni`
    )

    try {
      await statement.executeAsync({
        $apellido_nombre: data.apellido_nombre,
        $nacionalidad: data.nacionalidad,
        $direccion: data.direccion,
        $modelo_vehiculo: data.modelo_vehiculo,
        $ciudad: data.ciudad,
        $patente: data.patente,
        $telefono: data.telefono,
        $dni: data.dni,
      })
    } catch (error) {
      throw error
    } finally {
      await statement.finalizeAsync()
    }
  }
  

  const deleteCliente = async (id: string) => {
    const statement = await database.prepareAsync(
      `DELETE FROM clientes WHERE id = $id`
    )

    try {
      await statement.executeAsync({
        $id: id
      })
    } catch (error) {
      throw error
    } finally {
      await statement.finalizeAsync()
    }
  }
  
  const deleteAll = async () => {
    try {
      await database.execAsync('DELETE FROM clientes')
    } catch (error) {
      throw error
    }
  }
  
  return { getAll, findByDni, findByDniLike, searchByName, create, update, deleteCliente, deleteAll }
}
