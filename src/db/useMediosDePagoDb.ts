import { useSQLiteContext } from "expo-sqlite"
import { withDbLock } from "./dbMutex";

export type MediosDePagoDb = {
    id: number
    codigo: string
    descripcion: string
}

export function useMediosDePagoDb() {
    const database = useSQLiteContext()

    const defaultMedios = [
        { codigo: "MP", descripcion: "Mercado Pago" },
        { codigo: "EF", descripcion: "Efectivo" },
        { codigo: "CXP", descripcion: "Cuenta Corriente" },
    ]

    const getAll = async () => {
        return withDbLock(async () => {
            try {
                const query = 'SELECT * FROM mediosDePago'

                const response = await database.getAllAsync<MediosDePagoDb>(query)
                return response
            } catch (error) {
                throw error
            }
        })
    }

    const createOrUpdate = async (dataArray: any) => {
        return withDbLock(async () => {
            // Usamos ON CONFLICT para decidir qué hacer si el código ya existe
            const statement = await database.prepareAsync(
                `INSERT INTO mediosDePago (codigo, descripcion) 
         VALUES ($codigo, $descripcion)
         ON CONFLICT(codigo) DO UPDATE SET
         descripcion = excluded.descripcion
         WHERE descripcion != excluded.descripcion`
            );

            try {
                // 1. Registros por defecto
                for (const item of defaultMedios) {
                    await statement.executeAsync({
                        $codigo: item.codigo,
                        $descripcion: item.descripcion,
                    });
                }

                // 2. Registros que vienen de la API
                for (const item of dataArray) {
                    await statement.executeAsync({
                        $codigo: item.CodigoOpcional,
                        $descripcion: item.DESCRIPCION,
                    });
                }

                return { success: true, count: dataArray.length + defaultMedios.length };

            } catch (error) {
                console.error('Error al procesar registros:', error);
                throw error;
            } finally {
                await statement.finalizeAsync();
            }
        })
    }

    const ensureDefaults = async () => {
        return withDbLock(async () => {
            const statement = await database.prepareAsync(
                `INSERT INTO mediosDePago (codigo, descripcion) 
         VALUES ($codigo, $descripcion)
         ON CONFLICT(codigo) DO UPDATE SET
         descripcion = excluded.descripcion
         WHERE descripcion != excluded.descripcion`
            );

            try {
                for (const item of defaultMedios) {
                    await statement.executeAsync({
                        $codigo: item.codigo,
                        $descripcion: item.descripcion,
                    });
                }
                return { success: true, count: defaultMedios.length };
            } catch (error) {
                console.error('Error al insertar medios por defecto:', error);
                throw error;
            } finally {
                await statement.finalizeAsync();
            }
        })
    }

    const updateAll = async (data: MediosDePagoDb) => {
        return withDbLock(async () => {
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
        })
    }

    const deleteMp = async (id: string) => {
        return withDbLock(async () => {
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
        })
    }

    const deleteAll = async () => {
        return withDbLock(async () => {
            try {
                await database.execAsync('DELETE FROM mediosDePago')
            } catch (error) {
                throw error
            }
        })
    }

    const saveBackup = async (dataArray: MediosDePagoDb[]) => {
        return withDbLock(async () => {
            try {
                await database.withTransactionAsync(async () => {
                    await database.execAsync('DELETE FROM mediosDePago_backup');
                    for (const item of dataArray) {
                        await database.runAsync(
                            'INSERT INTO mediosDePago_backup (codigo, descripcion) VALUES (?, ?)',
                            [item.codigo, item.descripcion]
                        );
                    }
                });
                return { success: true };
            } catch (error) {
                console.error('Error al guardar backup de medios:', error);
                throw error;
            }
        })
    }

    const restoreFromBackup = async () => {
        return withDbLock(async () => {
            try {
                const backup = await database.getAllAsync<MediosDePagoDb>('SELECT codigo, descripcion FROM mediosDePago_backup');
                if (!backup || backup.length === 0) return false;

                await database.withTransactionAsync(async () => {
                    await database.execAsync('DELETE FROM mediosDePago');
                    for (const item of backup) {
                        await database.runAsync(
                            'INSERT INTO mediosDePago (codigo, descripcion) VALUES (?, ?)',
                            [item.codigo, item.descripcion]
                        );
                    }
                });
                return true;
            } catch (error) {
                console.error('Error al restaurar backup de medios:', error);
                throw error;
            }
        })
    }

    const getBackupAll = async () => {
        return withDbLock(async () => {
            try {
                const backup = await database.getAllAsync<MediosDePagoDb>('SELECT codigo, descripcion FROM mediosDePago_backup');
                return backup || []
            } catch (error) {
                return []
            }
        })
    }

    return { getAll, createOrUpdate, updateAll, deleteMp, deleteAll, ensureDefaults, saveBackup, restoreFromBackup, getBackupAll }
}
