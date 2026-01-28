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
                    await database.runAsync(
                        `INSERT INTO precios (codigo, precio, descripcion)
                         VALUES (?, ?, ?)
                         ON CONFLICT(codigo) DO UPDATE SET
                           precio = CASE
                             WHEN excluded.precio IS NULL OR excluded.precio = 0 THEN precios.precio
                             ELSE excluded.precio
                           END,
                           descripcion = CASE
                             WHEN excluded.descripcion IS NULL OR excluded.descripcion = '' THEN precios.descripcion
                             ELSE excluded.descripcion
                           END`,
                        [
                            item.CLAVE,
                            item.VALOR,
                            item.descripcion || ''
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
