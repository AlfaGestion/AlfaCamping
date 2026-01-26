import { useSQLiteContext } from "expo-sqlite"

export type MediosDePagoDb = {
    id: number
    codigo: string
    descripcion: string
}

export function useMediosDePagoDb() {
    const database = useSQLiteContext()

    const getAll = async () => {
        try {
            const query = 'SELECT * FROM mediosDePago'

            const response = await database.getAllAsync<MediosDePagoDb>(query)
            return response
        } catch (error) {
            throw error
        }
    }


    const createOrUpdate = async (dataArray: any) => {
        // Usamos ON CONFLICT para decidir qué hacer si el código ya existe
        const statement = await database.prepareAsync(
            `INSERT INTO mediosDePago (codigo, descripcion) 
         VALUES ($codigo, $descripcion)
         ON CONFLICT(codigo) DO UPDATE SET
         descripcion = excluded.descripcion
         WHERE descripcion != excluded.descripcion`
            // El WHERE opcional evita escribir si el dato es idéntico
        );

        try {
            // 1. Registro manual de Cuenta Corriente
            await statement.executeAsync({
                $codigo: 'CXP',
                $descripcion: 'Cuenta Corriente'
            });

            // 2. Registros que vienen de la API
            for (const item of dataArray) {
                await statement.executeAsync({
                    $codigo: item.CodigoOpcional,
                    $descripcion: item.DESCRIPCION,
                });
            }

            return { success: true, count: dataArray.length + 1 };

        } catch (error) {
            console.error('Error al procesar registros:', error);
            throw error;
        } finally {
            await statement.finalizeAsync();
        }
    }

    const updateAll = async (data: MediosDePagoDb) => {
        const statement = await database.prepareAsync(
            `UPDATE clientes SET
        codigo = $codigo,
        descripcion = $descripcion,
      WHERE id = $id`
        )

        try {
            await statement.executeAsync({
                $codigo: data.codigo,
                $descripcion: data.descripcion,
                $id: data.id,
            })
        } catch (error) {
            throw error
        } finally {
            await statement.finalizeAsync()
        }
    }



    const deleteMp = async (id: string) => {
        const statement = await database.prepareAsync(
            `DELETE FROM mediosDePago WHERE id = $id`
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
            await database.execAsync('DELETE FROM mediosDePago')
        } catch (error) {
            throw error
        }
    }

    return { getAll, createOrUpdate, updateAll, deleteMp, deleteAll }
}
