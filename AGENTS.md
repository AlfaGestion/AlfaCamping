# AGENTS.md — AlfaCamping (AlfaIngresos)

Guia rapida del proyecto para agentes.

## Resumen
- App mobile en Expo/React Native para gestionar ingresos de camping.
- Datos locales en SQLite y sincronizacion con API.
- Impresion de comprobantes y estadisticas en PDF/termica.

## Stack y tooling
- Expo 52 + React Native 0.76 + expo-router.
- SQLite: `expo-sqlite` con helpers en `src/db`.
- Impresion/compartir: `expo-print`, `expo-sharing`.
- Red: `fetch` via `src/services/api.js` y `src/hooks/useApi.js`.
- UI: componentes propios + `@expo/vector-icons`, `react-native-toast-message`.

## Scripts (package.json)
- `expo start` (dev)
- `expo run:android`, `expo run:ios`
- `expo start --web`

## Rutas (expo-router)
Archivos en `src/app`:
- `src/app/_layout.tsx`: providers + SQLite init.
- `src/app/(tabs)/_layout.jsx`: tabs.
- `src/app/(tabs)/index.jsx`: listado/estadisticas.
- `src/app/(tabs)/settings.jsx`: configuracion, sync, backups.
- `src/app/(tabs)/sendPending.jsx`: envio de pendientes.
- `src/app/ingresos/new.jsx`: datos del ingreso (paso 1).
- `src/app/ingresos/next.jsx`: precios/cantidades (paso 2) + imprimir/guardar.
- `src/app/ingresos/priceSettings.jsx`: editar precios locales.
- `src/app/ingresos/[id].jsx`: detalle (si aplica).
- `src/app/+not-found.tsx`: fallback.

## Contextos principales
- `src/context/IngresoContext.jsx`
  - Estado central de ingresos.
  - Calculo de precios/totales.
  - CRUD en SQLite y sync con API.
  - Auto-sync/auto-restore de precios y medios si estan vacios.
- `src/context/ConfigContext.jsx`
  - Estado de configuracion editable en Settings.

## Base de datos (SQLite)
Definicion en `src/db/initDb.ts`:
- `configuracion`: claves/valores de config.
  - claves: `api_uri`, `username`, `password`, `customer_id`, `database_id`,
    `cfg_impresora_barrera_1`, `print_offset_mm`, `ING_CLAVEVACIARBASE`, `TOKEN`.
- `ingresos`: toda la ficha del ingreso (persona, vehiculo, precios, totales).
- `clientes`: cache local de clientes.
- `mediosDePago` + `mediosDePago_backup`.
- `precios` + `precios_backup`.

Helpers DB:
- `src/db/useIngresoDb.ts`
- `src/db/useClienteDb.ts`
- `src/db/usePreciosDb.ts`
- `src/db/useMediosDePagoDb.ts`
- `src/db/useConfigDb.ts`

## Configuracion y .env
Archivo: `.env` (solo claves `EXPO_PUBLIC_`).
Fallback automatico si falta config en DB (se persiste en `configuracion`):
- `EXPO_PUBLIC_API_URI` -> `api_uri`
- `EXPO_PUBLIC_USERNAME` -> `username`
- `EXPO_PUBLIC_PASSWORD` -> `password`
- `EXPO_PUBLIC_CUSTOMER_ID` -> `customer_id`
- `EXPO_PUBLIC_DATABASE_ID` -> `database_id`
- `EXPO_PUBLIC_PRINT_OFFSET_MM` -> `print_offset_mm`
- `EXPO_PUBLIC_APP_LABEL_VERSION` -> version mostrada en UI

## Sincronizacion (API)
Endpoints usados (ver `src/services/api.js` y screens):
- `ingresos/precios`
- `ingresos/medios_de_pago`
- `ingresos/clientes` (o fallback `ObtenerClientes`)
- `ingresos/ingresospendientes` (listado remoto)
- `ingresos/estadisticas` + `ingresos/MediosDePagosEstadisticas`
- `login` (token)
- `ingresos/` (POST de ingresos locales)

## Reglas de precios y estadia
- Diurno si `ingreso === egreso` (misma fecha).
- Noches si fecha distinta.
- Precio local usa codigos `INGL_*` y diurno local `INGLD_*`.
- Motorhome: `ING_MOTORHOME` / `INGL_MOTORHOME`.
- Estacionamiento: `ING_ESTACIONAMIENTO`.
- Calculos en `src/context/IngresoContext.jsx` y `src/app/ingresos/next.jsx`.

## Impresion
- HTML ticket en `src/utils/ingresoPrint.js`.
- Se hidratan precios antes de imprimir para evitar $0.
- `print_offset_mm` ajusta alineacion (config o `.env`).
- Se imprime/comparten comprobantes desde:
  - `src/app/ingresos/next.jsx` (al guardar)
  - `src/components/IngresoItem.jsx` (long press)

## Backups y auto-recovery
- `precios_backup` y `mediosDePago_backup` en SQLite.
- Auto-ensure en `src/context/IngresoContext.jsx`:
  - Si precios en 0 -> sync si hay red, o restore si offline.
  - Si medios vacios -> sync si hay red, o restore si offline.

## Pantalla Settings (operaciones)
- Sync completo: config + precios + medios + clientes.
- Restaurar backup manual.
- Reset local con clave `ING_CLAVEVACIARBASE` (fallback "Alfa@").

## Reglas de trabajo para agentes
- Cambios pequeños y enfocados.
- Nunca imprimir ni guardar importes en 0 si hay datos validos.
- Si falta config, usar `.env` y persistir.
- Mantener estilo del archivo editado.
- Preferir `rg` para busquedas.
- Usar `apply_patch` para cambios puntuales.

