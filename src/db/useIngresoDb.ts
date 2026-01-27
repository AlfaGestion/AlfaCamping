import { useSQLiteContext } from "expo-sqlite"

export type IngresoDb = {
  id: number
  apellido_nombre: string
  ingreso: string
  egreso: string
  observaciones: string

  adultos: number
  precio_adultos: number
  menores: number
  precio_menores: number
  jubilados: number
  precio_jubilados: number
  adultosL: number
  precio_adultosL: number
  menoresL: number
  precio_menoresL: number
  jubiladosL: number
  precio_jubiladosL: number
  adicional: number
  precio_adicional: number
  adicionalL: number
  precio_adicionalL: number
  estacionamiento: number
  precio_estacionamiento: number
  bajada_lancha: number
  precio_bajada_lancha: number
  bajada_lanchaL: number
  precio_bajada_lanchaL: number

  parcela: number
  dni: string
  nacionalidad: string
  direccion: string
  telefono: string
  modelo_vehiculo: string
  ciudad: string
  patente: string
  amarre: boolean
  trekking: boolean
  kayak: boolean
  embarcado: boolean
  descuento: number
  subtotal: number
  total: number
  egreso_real: string
  egresar: boolean
  sincronizado: boolean
  local: boolean
  medio_de_pago: string
  anulado: boolean
  estadia: number
  hora_ingreso: string
}

export function useIngresoDb() {
  const database = useSQLiteContext()

  const getAll = async () => {
    try {
      const query = 'SELECT * FROM ingresos'

      const response = await database.getAllAsync<IngresoDb>(query)
      return response
    } catch (error) {
      throw error
    }
  }

  const searchByAllItemInfo = async (searchText: string) => {
    try {
      const query = `
        SELECT * FROM ingresos
        WHERE apellido_nombre LIKE ?
        or dni LIKE ?
        or ingreso LIKE ?
        or egreso LIKE ?
        or observaciones LIKE ?
        or total LIKE ?
      `

      const response = await database.getAllAsync<IngresoDb>(
        query, [`%${searchText}%`, `%${searchText}%`, `%${searchText}%`, `%${searchText}%`, `%${searchText}%`]
      )

      return response
    } catch (error) {
      throw error
    }
  }

  const findById = async (id: number) => {
    try {
      const query = 'SELECT * FROM ingresos WHERE id = ?'

      const response = await database.getAllAsync<IngresoDb>(query, [id])
      return response
    } catch (error) {
      throw error
    }
  }

  const create = async (data: Omit<IngresoDb, 'id'>) => {
    const statement = await database.prepareAsync(
      `INSERT INTO ingresos

      (apellido_nombre, ingreso, egreso, observaciones, parcela, dni, nacionalidad, direccion, telefono, modelo_vehiculo, 
      ciudad, medio_de_pago, patente, amarre, trekking, kayak, embarcado, descuento, subtotal, total, egreso_real, egresar, 
      sincronizado, local, anulado, estadia, hora_ingreso,
      bajada_lancha, precio_bajada_lancha, adultos, precio_adultos, menores, precio_menores,
      jubilados, precio_jubilados, adultosL, precio_adultosL, menoresL, precio_menoresL, jubiladosL, precio_jubiladosL, 
      adicional, precio_adicional, bajada_lanchaL, precio_bajada_lanchaL, adicionalL, precio_adicionalL,
      estacionamiento, precio_estacionamiento)

      VALUES ($apellido_nombre, $ingreso, $egreso, $observaciones, $parcela, $dni, $nacionalidad, $direccion, $telefono, $modelo_vehiculo, 
      $ciudad, $medio_de_pago, $patente, $amarre, $trekking, $kayak, $embarcado, $descuento, $subtotal, $total, $egreso_real, $egresar, 
      $sincronizado, $local, $anulado, $estadia, $hora_ingreso,  
      $bajada_lancha, $precio_bajada_lancha, $adultos, $precio_adultos, $menores, $precio_menores,
      $jubilados, $precio_jubilados, $adultosL, $precio_adultosL, $menoresL, $precio_menoresL, $jubiladosL, $precio_jubiladosL, 
      $adicional, $precio_adicional, $bajada_lanchaL, $precio_bajada_lanchaL, $adicionalL, $precio_adicionalL,
      $estacionamiento, $precio_estacionamiento)`
    )

    try {
      const result = await statement.executeAsync({
        $apellido_nombre: data.apellido_nombre,
        $ingreso: data.ingreso,
        $egreso: data.egreso,
        $observaciones: data.observaciones,

        $adultos: data.adultos,
        $precio_adultos: data.precio_adultos,
        $menores: data.menores,
        $precio_menores: data.precio_menores,
        $jubilados: data.jubilados,
        $precio_jubilados: data.precio_jubilados,
        $adultosL: data.adultosL,
        $precio_adultosL: data.precio_adultosL,
        $menoresL: data.menoresL,
        $precio_menoresL: data.precio_menoresL,
        $jubiladosL: data.jubiladosL,
        $precio_jubiladosL: data.precio_jubiladosL,
        $adicional: data.adicional,
        $precio_adicional: data.precio_adicional,
        $adicionalL: data.adicionalL,
        $precio_adicionalL: data.precio_adicionalL,
        $estacionamiento: data.estacionamiento,
        $precio_estacionamiento: data.precio_estacionamiento,
        $bajada_lancha: data.bajada_lancha,
        $precio_bajada_lancha: data.precio_bajada_lancha,
        $bajada_lanchaL: data.bajada_lanchaL,
        $precio_bajada_lanchaL: data.precio_bajada_lanchaL,

        $parcela: data.parcela,
        $dni: data.dni,
        $nacionalidad: data.nacionalidad,
        $direccion: data.direccion,
        $telefono: data.telefono,
        $modelo_vehiculo: data.modelo_vehiculo,
        $ciudad: data.ciudad,
        $patente: data.patente,
        $amarre: data.amarre,
        $trekking: data.trekking,
        $kayak: data.kayak,
        $embarcado: data.embarcado,
        $descuento: data.descuento,
        $subtotal: data.subtotal,
        $total: data.total,
        $egreso_real: data.egreso_real,
        $egresar: data.egresar,
        $sincronizado: data.sincronizado,
        $local: data.local,
        $medio_de_pago: data.medio_de_pago,
        $anulado: data.anulado,
        $estadia: data.estadia,
        $hora_ingreso: data.hora_ingreso
      })
      return result?.lastInsertRowId ?? null
    } catch (error) {
      throw error
    } finally {
      await statement.finalizeAsync()
    }
  }

  const update = async (data: IngresoDb) => {
    const statement = await database.prepareAsync(
      `UPDATE ingresos SET
        apellido_nombre = $apellido_nombre,
        ingreso = $ingreso,
        egreso = $egreso,
        observaciones = $observaciones,
        adultos = $adultos,
        precio_adultos = $precio_adultos,
        menores = $menores,
        precio_menores = $precio_menores,
        jubilados = $jubilados,
        precio_jubilados = $precio_jubilados,
        parcela = $parcela,
        dni = $dni,
        nacionalidad = $nacionalidad,
        direccion = $direccion,
        telefono = $telefono,
        modelo_vehiculo = $modelo_vehiculo,
        ciudad = $ciudad,
        patente = $patente,
        bajada_lancha = $bajada_lancha,
        precio_bajada_lancha = $precio_bajada_lancha,
        amarre = $amarre,
        trekking = $trekking,
        kayak = $kayak,
        embarcado = $embarcado,
        descuento = $descuento,
        subtotal = $subtotal,
        total = $total,
        egreso_real = $egreso_real,
        egresar = $egresar,
        sincronizado = $sincronizado,
        local = $local,
        medio_de_pago = $medio_de_pago,
        anulado = $anulado,
        estadia = $estadia,
        hora_ingreso = $hora_ingreso,
        adultosL = $adultosL,
        precio_adultosL = $precio_adultosL,
        menoresL = $menoresL,
        precio_menoresL = $precio_menoresL,
        jubiladosL = $jubiladosL,
        precio_jubiladosL = $precio_jubiladosL,
        adicional = $adicional,
        precio_adicional = $precio_adicional,
        adicionalL = $adicionalL,
        precio_adicionalL = $precio_adicionalL,
        estacionamiento = $estacionamiento,
        precio_estacionamiento = $precio_estacionamiento,
        bajada_lanchaL = $bajada_lanchaL,
        precio_bajada_lanchaL = $precio_bajada_lanchaL
      WHERE id = $id`
    )

    try {
      await statement.executeAsync({
        $id: data.id,
        $apellido_nombre: data.apellido_nombre,
        $ingreso: data.ingreso,
        $egreso: data.egreso,
        $observaciones: data.observaciones,

        $adultos: data.adultos,
        $precio_adultos: data.precio_adultos,
        $menores: data.menores,
        $precio_menores: data.precio_menores,
        $jubilados: data.jubilados,
        $precio_jubilados: data.precio_jubilados,
        $adultosL: data.adultosL,
        $precio_adultosL: data.precio_adultosL,
        $menoresL: data.menoresL,
        $precio_menoresL: data.precio_menoresL,
        $jubiladosL: data.jubiladosL,
        $precio_jubiladosL: data.precio_jubiladosL,
        $adicional: data.adicional,
        $precio_adicional: data.precio_adicional,
        $adicionalL: data.adicionalL,
        $precio_adicionalL: data.precio_adicionalL,
        $estacionamiento: data.estacionamiento,
        $precio_estacionamiento: data.precio_estacionamiento,
        $bajada_lancha: data.bajada_lancha,
        $precio_bajada_lancha: data.precio_bajada_lancha,
        $bajada_lanchaL: data.bajada_lanchaL,
        $precio_bajada_lanchaL: data.precio_bajada_lanchaL,

        $parcela: data.parcela,
        $dni: data.dni,
        $nacionalidad: data.nacionalidad,
        $direccion: data.direccion,
        $telefono: data.telefono,
        $modelo_vehiculo: data.modelo_vehiculo,
        $ciudad: data.ciudad,
        $patente: data.patente,
        $amarre: data.amarre,
        $trekking: data.trekking,
        $kayak: data.kayak,
        $embarcado: data.embarcado,
        $descuento: data.descuento,
        $subtotal: data.subtotal,
        $total: data.total,
        $egreso_real: data.egreso_real,
        $egresar: data.egresar,
        $sincronizado: data.sincronizado,
        $local: data.local,
        $medio_de_pago: data.medio_de_pago,
        $anulado: data.anulado,
        $estadia: data.estadia,
        $hora_ingreso: data.hora_ingreso
      })
    } catch (error) {
      throw error
    } finally {
      await statement.finalizeAsync()
    }
  }


  const deleteIngreso = async (id: string) => {
    const statement = await database.prepareAsync(
      `DELETE FROM ingresos WHERE id = $id`
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
      await database.execAsync('DELETE FROM ingresos')
    } catch (error) {
      throw error
    }
  }

  const deleteCompletedEntries = async () => {
    try {
      // Ejecutamos el DELETE solo donde egreso_real NO es NULL
      await database.execAsync('DELETE FROM ingresos WHERE egresar = 1');
    } catch (error) {
      // Re-lanzar el error para que pueda ser capturado por la función sendIngresos
      throw error;
    }
  }

  return { getAll, searchByAllItemInfo, findById, create, update, deleteIngreso, deleteAll, deleteCompletedEntries }
}
