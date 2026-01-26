import { useSQLiteContext } from "expo-sqlite";

export function usePreciosDb() {
    const database = useSQLiteContext();

    const getAll = async () => {
        try {
            const response = await database.getAllAsync<any>('SELECT * FROM precios ORDER BY id ASC');
            return response || [];
        } catch (error) {
            return [];
        }
    };

    // Nueva función para actualizar solo si hay cambios o insertar si no existe
    const upsertPrecios = async (precios: any[]) => {
        try {
            // Usamos una transacción para que sea mucho más rápido
            await database.withTransactionAsync(async () => {
                for (const item of precios) {
                    // "INSERT OR REPLACE" reemplaza el registro completo si el 'codigo' ya existe
                    await database.runAsync(
                        `INSERT OR REPLACE INTO precios (codigo, precio, descripcion) 
                         VALUES (?, ?, COALESCE((SELECT descripcion FROM precios WHERE codigo = ?), ?))`,
                        [
                            item.CLAVE,
                            item.VALOR,
                            item.CLAVE,
                            item.descripcion || '' // Mantiene la descripci??n local si existe
                        ]
                    );
                }
            });
            return { success: true };
        } catch (error) {
            console.error("Error en upsertPrecios:", error);
            throw error;
        }
    };

    const deleteAll = async () => {
        try {
            await database.execAsync('DELETE FROM precios');
        } catch (error) {
            throw error;
        }
    };

    return { getAll, upsertPrecios, deleteAll };
}
