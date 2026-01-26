import { type SQLiteDatabase } from "expo-sqlite";

const API_URI = process.env.EXPO_PUBLIC_API_URI;
const USERNAME = process.env.EXPO_PUBLIC_USERNAME;
const PASSWORD = process.env.EXPO_PUBLIC_PASSWORD;
const CUSTOMER_ID = process.env.EXPO_PUBLIC_CUSTOMER_ID;
const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_ID;
const PRINTER_IP = process.env.EXPO_PUBLIC_IP_IMP_BARRERA;

export async function initDb(db: SQLiteDatabase) {
  // 1. Tabla de Configuración
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS configuracion (id INTEGER PRIMARY KEY AUTOINCREMENT, clave TEXT, valor TEXT);
  `);

  const resConfig: any = await db.getAllAsync("SELECT COUNT(*) as count FROM configuracion;");
  if (resConfig[0].count === 0) {
    await db.execAsync(`
      INSERT INTO configuracion (clave, valor) VALUES ('api_uri', '${API_URI}');
      INSERT INTO configuracion (clave, valor) VALUES ('username', '${USERNAME}');
      INSERT INTO configuracion (clave, valor) VALUES ('password', '${PASSWORD}');
      INSERT INTO configuracion (clave, valor) VALUES ('customer_id', '${CUSTOMER_ID}');
      INSERT INTO configuracion (clave, valor) VALUES ('database_id', '${DATABASE_ID}');
      INSERT INTO configuracion (clave, valor) VALUES ('cfg_impresora_barrera_1', '${PRINTER_IP}');
    `);
  }

  // 2. Tabla de Ingresos
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ingresos (id INTEGER PRIMARY KEY, apellido_nombre TEXT, ingreso TEXT, egreso TEXT, observaciones TEXT, 
    parcela INTEGER, dni TEXT, nacionalidad TEXT, direccion TEXT, modelo_vehiculo TEXT, ciudad TEXT, patente TEXT, 
    amarre BOOLEAN, trekking BOOLEAN, kayak BOOLEAN, embarcado BOOLEAN, descuento INTEGER, 
    total INTEGER, subtotal INTEGER, egreso_real TEXT, egresar BOOLEAN, sincronizado BOOLEAN, 
    adultos INTEGER, menores INTEGER, jubilados INTEGER, adultosL INTEGER, menoresL INTEGER, jubiladosL INTEGER,
    precio_adultos INTEGER, precio_menores INTEGER, precio_jubilados INTEGER, precio_bajada_lancha INTEGER, 
    precio_adultosL INTEGER, precio_menoresL INTEGER, precio_jubiladosL INTEGER, precio_bajada_lanchaL INTEGER, 
    adicional INTEGER, adicionalL INTEGER, precio_adicional INTEGER, 
    precio_adicionalL INTEGER, estacionamiento INTEGER, precio_estacionamiento INTEGER,
    bajada_lancha INTEGER, bajada_lanchaL INTEGER, 
    medio_de_pago TEXT, local BOOLEAN, anulado BOOLEAN, estadia INTEGER, hora_ingreso TEXT
    );`
  );
  const ingresosColumns: any = await db.getAllAsync("PRAGMA table_info(ingresos);");
  const ingresosColumnNames = new Set(
    ingresosColumns.map((col: any) => String(col?.name))
  );
  const addIngresoColumnIfMissing = async (column: string, type: string) => {
    if (ingresosColumnNames.has(column)) return;
    try {
      await db.execAsync(`ALTER TABLE ingresos ADD COLUMN ${column} ${type};`);
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (!/duplicate column name/i.test(msg)) {
        throw e;
      }
    }
  };
  await addIngresoColumnIfMissing("estacionamiento", "INTEGER");
  await addIngresoColumnIfMissing("precio_estacionamiento", "INTEGER");
  await addIngresoColumnIfMissing("hora_ingreso", "TEXT");

  // 3. Tabla de Clientes
  await db.execAsync(
    "CREATE TABLE IF NOT EXISTS clientes (id INTEGER PRIMARY KEY, apellido_nombre TEXT, dni TEXT, nacionalidad TEXT, direccion TEXT, modelo_vehiculo TEXT, ciudad TEXT, patente TEXT, telefono TEXT)"
  );
  const clientesColumns: any = await db.getAllAsync("PRAGMA table_info(clientes);");
  const clientesColumnNames = new Set(clientesColumns.map((col: any) => col.name));
  if (!clientesColumnNames.has("telefono")) {
    await db.execAsync("ALTER TABLE clientes ADD COLUMN telefono TEXT;");
  }
  await db.execAsync(
    "CREATE INDEX IF NOT EXISTS idx_clientes_dni ON clientes (dni)"
  );

  // 4. Tabla de Medios de Pago
  await db.execAsync(
    "CREATE TABLE IF NOT EXISTS mediosDePago (codigo TEXT PRIMARY KEY, descripcion TEXT)"
  );

  // 5. Tabla de Precios (Aseguramos que se cree correctamente)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS precios (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      codigo TEXT UNIQUE NOT NULL, 
      precio REAL DEFAULT 0, 
      descripcion TEXT
    );
  `);

  // Verificamos si ya hay datos para no re-insertar innecesariamente
  const resPrecios: any = await db.getAllAsync("SELECT COUNT(*) as count FROM precios;");

  if (resPrecios[0].count === 0) {

    // Es mucho más seguro insertar los valores uno por uno o en un bloque limpio
    // para evitar errores de parseo en el string multidireccional
    const iniciales = [
      ['ING_JUBILADO', 0, 'Ingreso Jubilado'],
      ['ING_MENOR', 0, 'Ingreso Menor'],
      ['ING_MAYOR', 0, 'Ingreso Mayor'],
      ['ING_BAJADALANCHA', 0, 'Bajada Lancha'],
      ['INGD_JUBILADO', 0, 'Ingreso Diurno Jubilado'],
      ['INGD_MENOR', 0, 'Ingreso Diurno Menor'],
      ['INGD_MAYOR', 0, 'Ingreso Diurno Mayor'],
      ['INGL_BAJADALANCHA', 0, 'Bajada Lancha Local'],
      ['INGL_MENOR', 0, 'Ingreso Menor Local'],
      ['INGL_MAYOR', 0, 'Ingreso Mayor Local'],
      ['INGL_JUBILADO', 0, 'Ingreso Jubilado Local'],
      ['INGLD_MAYOR', 0, 'Ingreso Diurno Mayor Local'],
      ['INGLD_MENOR', 0, 'Ingreso Diurno Menor Local'],
      ['INGLD_JUBILADO', 0, 'Ingreso Diurno Jubilado Local'],
      ['ING_ADICIONAL', 0, 'Ingreso Adicional'],
      ['INGL_ADICIONAL', 0, 'Ingreso Adicional Local'],
      ['ING_MOTORHOME', 0, 'Ingreso motorhome'],
      ['INGL_MOTORHOME', 0, 'Ingreso motorhome Local'],
      ['ING_ESTACIONAMIENTO', 0, 'Ingreso estacionamiento'],
    ];

    for (const [codigo, precio, desc] of iniciales) {
      try {
        await db.runAsync(
          'INSERT OR IGNORE INTO precios (codigo, precio, descripcion) VALUES (?, ?, ?)',
          [codigo, precio, desc]
        );
      } catch (e) {
        console.error(`Error insertando código ${codigo}:`, e);
      }
    }
  }
}
