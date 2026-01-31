import { useSQLiteContext } from "expo-sqlite";
import { withDbLock } from "./dbMutex";

export function usePreciosDb() {
    const database = useSQLiteContext();

    const getAll = async () => {
        return withDbLock(async () => {
            try {
                const response = await database.getAllAsync<any>('SELECT * FROM precios ORDER BY id ASC');
                return response || [];
            } catch (error) {
                return [];
            }
        });
    };

    // Nueva funciÃ³n para actualizar solo si hay cambios o insertar si no existe
    const upsertPrecios = async (precios: any[]) => {
        return withDbLock(async () => {
            try {
                // Usamos una transacciÃ³n para que sea mucho mÃ¡s rÃ¡pido
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
        });
    };

    const saveBackup = async (precios: any[]) => {
        return withDbLock(async () => {
            try {
                await database.withTransactionAsync(async () => {
                    await database.execAsync('DELETE FROM precios_backup');
                    for (const item of precios) {
                        await database.runAsync(
                            'INSERT INTO precios_backup (codigo, precio, descripcion) VALUES (?, ?, ?)',
                            [item.codigo, item.precio, item.descripcion || '']
                        );
                    }
                });
                return { success: true };
            } catch (error) {
                console.error("Error en saveBackup precios:", error);
                throw error;
            }
        });
    };

    const restoreFromBackup = async () => {
        return withDbLock(async () => {
            try {
                const backup = await database.getAllAsync<any>('SELECT codigo, precio, descripcion FROM precios_backup');
                if (!backup || backup.length === 0) return false;

                await database.withTransactionAsync(async () => {
                    await database.execAsync('DELETE FROM precios');
                    for (const item of backup) {
                        await database.runAsync(
                            'INSERT INTO precios (codigo, precio, descripcion) VALUES (?, ?, ?)',
                            [item.codigo, item.precio, item.descripcion || '']
                        );
                    }
                });
                return true;
            } catch (error) {
                console.error("Error en restoreFromBackup precios:", error);
                throw error;
            }
        });
    };

    const getBackupAll = async () => {
        return withDbLock(async () => {
            try {
                const backup = await database.getAllAsync<any>('SELECT * FROM precios_backup ORDER BY id ASC');
                return backup || [];
            } catch (error) {
                return [];
            }
        });
    };

    const deleteAll = async () => {
        return withDbLock(async () => {
            try {
                await database.execAsync('DELETE FROM precios');
            } catch (error) {
                throw error;
            }
        });
    };

    return { getAll, upsertPrecios, saveBackup, restoreFromBackup, getBackupAll, deleteAll };
}
