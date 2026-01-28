const DEFAULT_LOGO_URL = "https://alfagestion.com.ar/alfagestion/logo_desemboque.png";

const normalizeText = (value) => {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text || text.toLowerCase() === "undefined" || text.toLowerCase() === "null") {
    return "-";
  }
  return text;
};

export const getIngresoNombre = (ingreso) =>
  normalizeText(ingreso?.apellido_nombre ?? ingreso?.name);

const calcIngresoTotals = (ingreso, options = {}) => {
  const estadiaNumber = Number(ingreso?.estadia) || 1;
  const descuento = Number(ingreso?.descuento) || 0;
  const estacionamientoPrecio = Number(
    ingreso?.precio_estacionamiento ?? options.estacionamientoPrecio ?? 0
  ) || 0;

  const baseEstadia =
    (Number(ingreso?.adultos) || 0) * (Number(ingreso?.precio_adultos) || 0) +
    (Number(ingreso?.menores) || 0) * (Number(ingreso?.precio_menores) || 0) +
    (Number(ingreso?.jubilados) || 0) * (Number(ingreso?.precio_jubilados) || 0) +
    (Number(ingreso?.adultosL) || 0) * (Number(ingreso?.precio_adultosL) || 0) +
    (Number(ingreso?.menoresL) || 0) * (Number(ingreso?.precio_menoresL) || 0) +
    (Number(ingreso?.jubiladosL) || 0) * (Number(ingreso?.precio_jubiladosL) || 0) +
    (Number(ingreso?.bajada_lancha) || 0) * (Number(ingreso?.precio_bajada_lancha) || 0) +
    (Number(ingreso?.bajada_lanchaL) || 0) * (Number(ingreso?.precio_bajada_lanchaL) || 0);

  const motorhomeSubtotal =
    ((Number(ingreso?.adicional) || 0) * (Number(ingreso?.precio_adicional) || 0) +
      (Number(ingreso?.adicionalL) || 0) * (Number(ingreso?.precio_adicionalL) || 0)) *
    estadiaNumber;

  const estacionamientoSubtotal = ingreso?.estacionamiento ? estacionamientoPrecio : 0;
  const subtotalImpresion = baseEstadia * estadiaNumber + motorhomeSubtotal + estacionamientoSubtotal;
  const totalCalculado = subtotalImpresion - (subtotalImpresion * descuento) / 100;
  const detalleTotal = baseEstadia + motorhomeSubtotal + estacionamientoSubtotal;

  return {
    estacionamientoPrecio,
    subtotalImpresion,
    totalCalculado,
    detalleTotal,
  };
};

export const buildIngresoHtml = (ingreso, options = {}) => {
  const logoUrl = options.logoUrl || DEFAULT_LOGO_URL;
  const idLabel = ingreso?.id ?? "S/N";
  const visitante = getIngresoNombre(ingreso);
  const isSameDay = ingreso?.ingreso && ingreso?.egreso && ingreso.ingreso === ingreso.egreso;
  const estadiaUnit = isSameDay
    ? (Number(ingreso?.estadia) === 1 ? "Día" : "Días")
    : (Number(ingreso?.estadia) === 1 ? "Noche" : "Noches");

  const totals = calcIngresoTotals(ingreso, options);
  const totalGuardado = Number(ingreso?.total) || 0;
  const totalOverride = Number(options.totalOverride) || 0;
  const totalImpresion =
    totalOverride > 0 ? totalOverride :
      totalGuardado > 0 ? totalGuardado :
        totals.totalCalculado > 0 ? totals.totalCalculado :
          totals.detalleTotal > 0 ? totals.detalleTotal : 0;

  return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          @page { size: 80mm auto; margin: 4mm; }
          body { 
            font-family: 'Courier New', Courier, monospace; 
            padding: 0; 
            color: #000; 
            width: 72mm;
            margin: 0 auto;
            font-size: 14px;
          }
          .header { text-align: center; margin-bottom: 5px; }
          .logo { 
            width: 100px; 
            height: 100px; 
            object-fit: contain;
            filter: grayscale(100%); /* Asegura que sea B&N para la térmica */
            margin-bottom: 5px;
          }
          .title { font-size: 20px; font-weight: bold; margin: 0; text-transform: uppercase; }
          .subtitle { font-size: 15px; margin: 4px 0; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 3px 0; }
          
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          
          .section-title { font-weight: bold; margin-bottom: 5px; font-size: 13px; }
          
          .row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px; }
          .label { font-weight: bold; }
          
          .table { width: 100%; margin-top: 5px; border-collapse: collapse; }
          .table th { border-bottom: 1px solid #000; text-align: left; font-size: 12px; }
          .table td { font-size: 12px; padding: 5px 0; }
          .text-right { text-align: right; }
          
          .total-container { margin-top: 10px; border-top: 2px solid #000; padding-top: 5px; }
          .total-row { display: flex; justify-content: space-between; font-size: 19px; font-weight: bold; }
          
          .footer { margin-top: 15px; text-align: center; font-size: 12px; line-height: 1.3; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${logoUrl}" class="logo" alt="logo" />
          <p class="title">CAMPING EL DESEMBOQUE</p>
          <p class="subtitle">COMPROBANTE DE INGRESO</p>
          <p style="font-size: 9px; margin-top: 4px;">ID: #${idLabel}</p>
        </div>

        <div class="content">
          <div class="row"><span class="label">VISITANTE:</span> <span>${visitante}</span></div>
          <div class="row"><span class="label">DNI:</span> <span>${ingreso?.dni || '-'}</span></div>
          <div class="row"><span class="label">VEHICULO:</span> <span>${ingreso?.modelo_vehiculo || '-'}</span></div>
          <div class="row"><span class="label">PATENTE:</span> <span>${ingreso?.patente || '-'}</span></div>
          <div class="row"><span class="label">PARCELA:</span> <span>${ingreso?.parcela || 'S/N'}</span></div>
          
          <div class="divider"></div>
          
          <div class="row"><span class="label">INGRESO:</span> <span>${ingreso?.ingreso}</span></div>
          <div class="row"><span class="label">EGRESO:</span> <span>${ingreso?.egreso}</span></div>
          <div class="row"><span class="label">ESTADÍA:</span> <span>${ingreso?.estadia} ${estadiaUnit}</span></div>

          <div class="divider"></div>

          <p class="section-title">DETALLE DE ESTADIA</p>
          <table class="table">
            <thead>
              <tr>
                <th>DETALLE</th>
                <th class="text-right">CANT</th>
                <th class="text-right">SUBT.</th>
              </tr>
            </thead>
            <tbody>
              ${ingreso?.adultos > 0 ? `
                <tr>
                  <td>Adultos V ($${ingreso?.precio_adultos})</td>
                  <td class="text-right">${ingreso?.adultos}</td>
                  <td class="text-right">$${ingreso?.adultos * ingreso?.precio_adultos}</td>
                </tr>` : ''}
              ${ingreso?.adultosL > 0 ? `
                <tr>
                  <td>Adultos L ($${ingreso?.precio_adultosL})</td>
                  <td class="text-right">${ingreso?.adultosL}</td>
                  <td class="text-right">$${ingreso?.adultosL * ingreso?.precio_adultosL}</td>
                </tr>` : ''}
              ${ingreso?.menores > 0 ? `
                <tr>
                  <td>Menores V ($${ingreso?.precio_menores})</td>
                  <td class="text-right">${ingreso?.menores}</td>
                  <td class="text-right">$${ingreso?.menores * ingreso?.precio_menores}</td>
                </tr>` : ''}
              ${ingreso?.menoresL > 0 ? `
                <tr>
                  <td>Menores L ($${ingreso?.precio_menoresL})</td>
                  <td class="text-right">${ingreso?.menoresL}</td>
                  <td class="text-right">$${ingreso?.menoresL * ingreso?.precio_menoresL}</td>
                </tr>` : ''}
              ${ingreso?.jubilados > 0 ? `
                <tr>
                  <td>Jubilados V ($${ingreso?.precio_jubilados})</td>
                  <td class="text-right">${ingreso?.jubilados}</td>
                  <td class="text-right">$${ingreso?.jubilados * ingreso?.precio_jubilados}</td>
                </tr>` : ''}
              ${ingreso?.jubiladosL > 0 ? `
                <tr>
                  <td>Jubilados L ($${ingreso?.precio_jubiladosL})</td>
                  <td class="text-right">${ingreso?.jubiladosL}</td>
                  <td class="text-right">$${ingreso?.jubiladosL * ingreso?.precio_jubiladosL}</td>
                </tr>` : ''}
              ${ingreso?.bajada_lancha > 0 ? `
                <tr>
                  <td>B. Lancha ($${ingreso?.precio_bajada_lancha})</td>
                  <td class="text-right">${ingreso?.bajada_lancha}</td>
                  <td class="text-right">$${ingreso?.bajada_lancha * ingreso?.precio_bajada_lancha}</td>
                </tr>` : ''}
              ${Number(ingreso?.adicional) > 0 ? `
                <tr>
                  <td>Motorhome V ($${ingreso?.precio_adicional})</td>
                  <td class="text-right">${ingreso?.adicional}</td>
                  <td class="text-right">$${(ingreso?.adicional || 0) * (ingreso?.precio_adicional || 0)}</td>
                </tr>` : ''}
              ${Number(ingreso?.adicionalL) > 0 ? `
                <tr>
                  <td>Motorhome L ($${ingreso?.precio_adicionalL})</td>
                  <td class="text-right">${ingreso?.adicionalL}</td>
                  <td class="text-right">$${(ingreso?.adicionalL || 0) * (ingreso?.precio_adicionalL || 0)}</td>
                </tr>` : ''}
              ${ingreso?.estacionamiento ? `
                <tr>
                  <td>Estacionamiento ($${totals.estacionamientoPrecio})</td>
                  <td class="text-right">1</td>
                  <td class="text-right">$${totals.estacionamientoPrecio}</td>
                </tr>` : ''}
            </tbody>
          </table>

          <div class="divider"></div>

          ${ingreso?.estacionamiento ? `
          <p class="section-title">SERVICIOS INCLUIDOS</p>
          <div class="row">
            <span>KAYAKS: ${ingreso?.kayak ? 'SI' : 'NO'}</span>
            <span>TREKKING: ${ingreso?.trekking ? 'SI' : 'NO'}</span>
          </div>
          <div class="row">
            <span>AMARRE: ${ingreso?.amarre ? 'SI' : 'NO'}</span>
            <span>EMBARCADO: ${ingreso?.embarcado ? 'SI' : 'NO'}</span>
          </div>
          ` : ''}

          ${ingreso?.observaciones ? `
            <div class="divider"></div>
            <p class="label" style="font-size: 10px;">OBSERVACIONES:</p>
            <p style="font-size: 10px; margin-top: 2px;">${ingreso?.observaciones}</p>
          ` : ''}

          <div class="total-container">
            <div class="total-row">
              <span>TOTAL A PAGAR</span>
              <span>$${totalImpresion}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>¡GRACIAS POR SU VISITA!</p>
          <p>Conserve este ticket para egresar.</p>
          ${ingreso?.anulado ? `<p style="color: red; font-weight: bold; border: 1px solid red; padding: 4px;">-- ANULADO --</p>` : ''}
        </div>
      </body>
    </html>
    `;
};
