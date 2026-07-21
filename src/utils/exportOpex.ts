import * as XLSX from 'xlsx-js-style';
import { ActividadAmbiental } from '../types';

const parseOpex = (raw?: string) => {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

// ── Estructura de la plantilla PXQ (Exceles de Referencia/PXQ (3) - copia.xlsx) ──
// Réplica exacta de la hoja "PXQ ": columnas A–AY, encabezados en la fila 6,
// caja IPC/TRM en M3:N4, notas en la fila 5 y estilos/formatos originales.

const FMT_CONTABLE = '_-* #,##0_-;\\-* #,##0_-;_-* "-"??_-;_-@_-';

// Solo en la plantilla OPEX las zonas "Occidente Norte" / "Occidente Sur"
// se reportan unificadas como "Occidente" (la app conserva la zona real).
const zonaPlantilla = (zona: string) => /^Occidente\b/i.test(zona.trim()) ? 'Occidente' : zona;

const BORDER_THIN_AUTO_TOP = {
  left: { style: 'thin', color: { auto: 1 } },
  right: { style: 'thin', color: { auto: 1 } },
  top: { style: 'thin', color: { auto: 1 } },
};
const BORDER_THIN_BLACK_TOP = {
  left: { style: 'thin', color: { rgb: 'FF000000' } },
  right: { style: 'thin', color: { rgb: 'FF000000' } },
  top: { style: 'thin', color: { rgb: 'FF000000' } },
};
const BORDER_DATA = {
  left: { style: 'thin', color: { rgb: 'AEAEAE' } },
  right: { style: 'thin', color: { rgb: 'AEAEAE' } },
  top: { style: 'thin', color: { rgb: 'AEAEAE' } },
  bottom: { style: 'thin', color: { rgb: 'AEAEAE' } },
};

const FONT_HEADER_APTOS = { bold: true, sz: 11, color: { rgb: 'FFFFFF' }, name: 'Aptos Narrow' };
const FONT_HEADER_ARIAL_BLANCA = { bold: true, sz: 10, color: { rgb: 'FFFFFF' }, name: 'Arial' };
const FONT_HEADER_ARIAL_NEGRA = { bold: true, sz: 10, color: { rgb: '000000' }, name: 'Arial' };
const FONT_DATA = { sz: 11, color: { rgb: '000000' }, name: 'Aptos Narrow' };

const CENTER = { horizontal: 'center', vertical: 'center' } as const;
const CENTER_WRAP = { horizontal: 'center', vertical: 'center', wrapText: true } as const;

// Estilo de encabezado (fila 6) por columna, según el grupo de la plantilla.
const headerStyleFor = (col: number) => {
  if (col <= 4) // A–E: azul oscuro, sin borde
    return { font: FONT_HEADER_APTOS, fill: { patternType: 'solid', fgColor: { rgb: '0E2841' } }, alignment: CENTER };
  if (col === 5) // F: azul medio, borde negro
    return { font: FONT_HEADER_APTOS, fill: { patternType: 'solid', fgColor: { rgb: '0B77A0' } }, border: BORDER_THIN_BLACK_TOP, alignment: CENTER };
  if (col <= 12) // G–M: azul medio, borde negro, con ajuste de texto
    return { font: FONT_HEADER_APTOS, fill: { patternType: 'solid', fgColor: { rgb: '0B77A0' } }, border: BORDER_THIN_BLACK_TOP, alignment: CENTER_WRAP };
  if (col <= 24) // N–Y (precios): celeste
    return { font: FONT_HEADER_ARIAL_BLANCA, fill: { patternType: 'solid', fgColor: { rgb: '46B1E1' } }, border: BORDER_THIN_AUTO_TOP, alignment: CENTER_WRAP };
  if (col <= 36) // Z–AK (cantidades): celeste claro, letra negra
    return { font: FONT_HEADER_ARIAL_NEGRA, fill: { patternType: 'solid', fgColor: { rgb: 'CAEEFB' } }, border: BORDER_THIN_AUTO_TOP, alignment: CENTER_WRAP };
  if (col <= 49) // AL–AX (totales): gris
    return { font: FONT_HEADER_ARIAL_BLANCA, fill: { patternType: 'solid', fgColor: { rgb: 'AEAEAE' } }, border: BORDER_THIN_AUTO_TOP, alignment: CENTER_WRAP };
  // AY: azul oscuro
  return { font: FONT_HEADER_ARIAL_BLANCA, fill: { patternType: 'solid', fgColor: { rgb: '0E2841' } }, border: BORDER_THIN_AUTO_TOP, alignment: CENTER_WRAP };
};

// Estilo de celda de datos (filas 7+) por columna.
const dataStyleFor = (col: number) => {
  if (col === 7 || col === 8) // H, I (Orden Interna / Cuenta Contable): durazno
    return { font: FONT_DATA, fill: { patternType: 'solid', fgColor: { rgb: 'F6C6AD' } }, border: BORDER_DATA };
  if (col >= 13 && col <= 24) // N–Y precios: formato contable
    return { font: FONT_DATA, border: BORDER_DATA, numFmt: FMT_CONTABLE };
  if (col >= 37 && col <= 49) // AL–AX totales: gris claro + contable
    return { font: FONT_DATA, fill: { patternType: 'solid', fgColor: { rgb: 'D9D9D9' } }, border: BORDER_DATA, numFmt: FMT_CONTABLE };
  if (col === 12) // M Tarifas: contable
    return { font: FONT_DATA, border: BORDER_DATA, numFmt: FMT_CONTABLE };
  return { font: FONT_DATA, border: BORDER_DATA };
};

const HEADERS_PXQ = [
  'Contrato ', 'Contratista', 'Necesidad', 'Subnecesidad', 'Item', 'Zona ', 'Estación / Línea',
  'Orden Interna', 'Cuenta Contable', 'Aplica Ajuste Tarifario\r\nSI / NO', 'Fecha del Ajuste Tarifario',
  'Aplica Reajuste de tarifas por tablas salariales\r\nSI / NO', 'Tarifas 2026',
  ' Precio enero año 1 ', ' Precio febrero año 1 ', ' Precio marzo año 1 ', ' Precio abril año 1 ',
  ' Precio mayo año 1 ', ' Precio junio año 1 ', ' Precio julio año 1 ', ' Precio agosto año 1 ',
  ' Precio septiembre año 1 ', ' Precio octubre año 1 ', ' Precio noviembre año 1 ', ' Precio diciembre año 1 ',
  'Cantidad enero año 1', 'Cantidad febrero año 1', 'Cantidad marzo año 1', 'Cantidad abril año 1',
  'Cantidad mayo año 1', 'Cantidad junio año 1', 'Cantidad julio año 1', 'Cantidad agosto año 1',
  'Cantidad septiembre año 1', 'Cantidad octubre año 1', 'Cantidad noviembre año 1', 'Cantidad diciembre año 1',
  'Total enero año 1', 'Total febrero año 1', 'Total marzo año 1', 'Total abril año 1', 'Total mayo año 1',
  'Total junio año 1', 'Total julio año 1', 'Total agosto año 1', 'Total septiembre año 1',
  'Total octubre año 1', 'Total noviembre año 1', 'Total diciembre año 1', 'Total año 1', 'Observaciones',
];

const COL_WIDTHS_PXQ: (number | undefined)[] = [
  29.71, 24.14, 29.43, 53.86, 17.57, 21.86, 14, 16.29, 11.43, 16.57, 24.14, 24.14, 19.14,
  14.71, 17.57, 19.43, 13.57, 13.57, 13.57, 13.14, 13.14, 13.14, 13.14, 13.14, 18,
  // Z–AK Cantidades: ancho visible (antes quedaban sin ancho asignado).
  12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12,
  17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 37.86,
];

export const exportOpexToExcel = (actividades: ActividadAmbiental[]) => {
  // Filter only activities that have OPEX data
  const opexActivities = actividades.filter(a => !!a.opexDataRaw && parseOpex(a.opexDataRaw) !== null);

  if (opexActivities.length === 0) {
    alert("No hay actividades con planeación presupuestal OPEX registrada para exportar.");
    return;
  }

  // Una fila (arreglo de 51 columnas, A–AY) por actividad, según la plantilla PXQ.
  // Servicios E e ICAs se desglosan: una fila por cada ítem de la planeación.
  const excelRows = opexActivities.flatMap(item => {
    const opx = parseOpex(item.opexDataRaw);

    // Factores IVA (por ítem) e IPC (por mes) guardados en la planeación.
    const ivaFactorFor = (p: any) => {
      const aplicaIva = typeof p?.aplicaIva === 'boolean'
        ? p.aplicaIva
        : !((opx.ivaItemsExcluidos ?? []).includes(p?.key));
      return (opx.ivaGlobalActivo && aplicaIva && (opx.ivaGlobalPorcentaje ?? 0) > 0)
        ? 1 + (opx.ivaGlobalPorcentaje / 100)
        : 1;
    };
    const ipcFactorFor = (mesIndex: number) =>
      (opx.ipcGlobalActivo && (Array.isArray(opx.ipcMeses) ? opx.ipcMeses : []).includes(mesIndex) && (opx.ipcGlobalPorcentaje ?? 0) > 0)
        ? 1 + (opx.ipcGlobalPorcentaje / 100)
        : 1;

    // Datos del mes reconstruidos desde el desglose por ítem (preciosIndividuales).
    // El total del mes se recalcula como Σ precio×cantidad×frecuencia×IVA×IPC para
    // que en la plantilla siempre cuadre Precio × Cantidad = Total, incluso si el
    // total guardado quedó desactualizado tras editar cantidades. Los pagos
    // diferidos (cantidad=0 con total) conservan su total guardado.
    const getMonthData = (mesNombre: string) => {
      const match = opx.meses?.find((m: any) => m.mes.toLowerCase() === mesNombre.toLowerCase());
      if (!match) return { precio: 0, cantidad: 0, total: 0 };
      // Índice calendario del mes (0=Enero) para el factor IPC.
      const mesIndex = MESES_LABEL.findIndex(m => m.toLowerCase() === mesNombre.toLowerCase());

      const items: any[] = Array.isArray(match.preciosIndividuales) ? match.preciosIndividuales : [];

      let total = 0;
      let cantidad = 0;

      if (items.length > 0) {
        const ipcFactor = ipcFactorFor(mesIndex);
        for (const p of items) {
          const cant = Number(p?.cantidad) || 0;
          const frec = Number(p?.frecuencia) || 1;
          const precioBase = Number(p?.precio) || 0;
          const totalGuardado = Number(p?.total) || 0;
          if (cant > 0 && precioBase > 0) {
            total += precioBase * cant * frec * ivaFactorFor(p) * ipcFactor;
          } else {
            // Diferidos (cantidad 0) o ítems sin precio digitado: usar el total guardado.
            total += totalGuardado;
          }
          cantidad += cant;
        }
      } else {
        // Legacy sin desglose por ítem: usar los valores a nivel de mes.
        total = match.total || 0;
        cantidad = match.cantidad || 0;
      }

      // Pagos diferidos: cantidad=0 pero hay total → cantidad=1 para que P×Q=Total.
      if (cantidad === 0 && total > 0) {
        cantidad = 1;
      }

      // Precio unitario efectivo (incluye IVA, IPC y diferidos): total / cantidad.
      const precio = cantidad > 0 ? total / cantidad : 0;

      return { precio, cantidad, total };
    };

    // Datos mensuales de UN solo ítem (para el desglose de Servicios E / ICAs).
    const getMonthDataForItem = (mesNombre: string, itemKey: string) => {
      const match = opx.meses?.find((m: any) => m.mes.toLowerCase() === mesNombre.toLowerCase());
      const mesIndex = MESES_LABEL.findIndex(m => m.toLowerCase() === mesNombre.toLowerCase());
      const entry = (Array.isArray(match?.preciosIndividuales) ? match.preciosIndividuales : [])
        .find((p: any) => p.key === itemKey);
      if (!entry) return { precio: 0, cantidad: 0, total: 0 };

      const cant = Number(entry.cantidad) || 0;
      const frec = Number(entry.frecuencia) || 1;
      const precioBase = Number(entry.precio) || 0;
      const totalGuardado = Number(entry.total) || 0;

      let total: number;
      let cantidad = cant;
      if (cant > 0 && precioBase > 0) {
        total = precioBase * cant * frec * ivaFactorFor(entry) * ipcFactorFor(mesIndex);
      } else {
        // Diferidos (cantidad 0) o sin precio digitado: usar el total guardado.
        total = totalGuardado;
      }
      if (cantidad === 0 && total > 0) cantidad = 1;
      const precio = cantidad > 0 ? total / cantidad : 0;
      return { precio, cantidad, total };
    };

    const anioPlaneacion = Number((item as any).anioPlaneacion || opx.anioPlaneacion) || 0;

    // Ajuste tarifario (cols J/K): IPC configurado en la planeación.
    const ipcActivo = !!opx.ipcGlobalActivo && (opx.ipcGlobalPorcentaje ?? 0) > 0
      && Array.isArray(opx.ipcMeses) && opx.ipcMeses.length > 0;
    let fechaAjuste: Date | '' = '';
    if (ipcActivo) {
      const anio = anioPlaneacion || new Date().getFullYear();
      // Mediodía para que la conversión a serial de Excel no corra el día por zona horaria.
      fechaAjuste = new Date(anio, Math.min(...(opx.ipcMeses as number[])), 1, 12);
    }

    // Contrato/Contratista. Para ICAs se asignan por año de planeación:
    // 2026 → ESTUDIOS TECNICOS SAS (cto. 8000008649); 2027+ → Nuevo contrato (cto. 000).
    const esIcas = item.lineaOperativa === 'ICAs';
    const contrato = esIcas
      ? (anioPlaneacion === 2026 ? '8000008649' : '000')
      : (opx.contrato || item.contrato || '');
    const contratista = esIcas
      ? (anioPlaneacion === 2026 ? 'ESTUDIOS TECNICOS SAS' : 'Nuevo contrato')
      : (opx.proveedor || '');

    // Contratista/contrato de un ítem ICAs: primero lo etiquetado en el JSON
    // (campos contratista/contrato del ítem), luego la vigencia en el key/nombre
    // (ICA 2026 → ESTUDIOS TECNICOS SAS; ICA 2027 → Nuevo contrato) y por último
    // el proveedor/contrato propio de la planeación (ítems custom, p. ej. SGS).
    const contratoPorItem = (key: string, nombre: string, entry: any): { contrato: string; contratista: string } => {
      if (entry?.contratista || entry?.contrato) {
        return { contratista: entry.contratista || contratista, contrato: entry.contrato || contrato };
      }
      const texto = `${key} ${nombre}`;
      if (/ICA[ -]?2026/i.test(texto)) return { contratista: 'ESTUDIOS TECNICOS SAS', contrato: '8000008649' };
      if (/ICA[ -]?2027/i.test(texto)) return { contratista: 'Nuevo contrato', contrato: '000' };
      return { contratista: opx.proveedor || contratista, contrato: opx.contrato || item.contrato || contrato };
    };

    const buildRow = (
      nombreItem: string,
      mesesData: { precio: number; cantidad: number; total: number }[],
      contratoRow = contrato,
      contratistaRow = contratista,
    ) => {
      const totalAnio1 = mesesData.reduce((s, d) => s + d.total, 0);
      // Tarifa base (col M): precio unitario del primer mes con datos.
      const primerMesConDatos = mesesData.find(d => d.total > 0);
      const tarifaBase = primerMesConDatos ? primerMesConDatos.precio : 0;
      // Sin contrato firmado ("Nuevo contrato"): el número va vacío, no 000.
      const contratoFinal = /^nuevo contrato$/i.test(String(contratistaRow).trim()) ? '' : contratoRow;
      return [
        contratoFinal,                                            // A  Contrato
        contratistaRow,                                           // B  Contratista
        opx.necesidad || '',                                      // C  Necesidad
        opx.subnecesidad || '',                                   // D  Subnecesidad
        nombreItem,                                               // E  Item
        zonaPlantilla(opx.zona || item.zona || ''),               // F  Zona
        // Estación / Línea: estación o PK; para Compensaciones (sin estación)
        // se usa el sector (p. ej. "Estación Mariquita") o el sistema.
        item.estacion || opx.pk || opx.sector || opx.sistema || '', // G  Estación / Línea
        '',                                                       // H  Orden Interna
        '',                                                       // I  Cuenta Contable
        ipcActivo ? 'SI' : 'NO',                                  // J  Aplica Ajuste Tarifario
        fechaAjuste,                                              // K  Fecha del Ajuste Tarifario
        'NO',                                                     // L  Reajuste tablas salariales
        tarifaBase,                                               // M  Tarifas 2026
        ...mesesData.map(d => d.precio),                          // N–Y  Precios
        ...mesesData.map(d => d.cantidad),                        // Z–AK Cantidades
        ...mesesData.map(d => d.total),                           // AL–AW Totales
        totalAnio1,                                               // AX Total año 1
        opx.descripcionNecesidad || '',                           // AY Observaciones
      ];
    };

    // Servicios E e ICAs: una fila por ítem, con su cantidad/precio/total mensual.
    const conDesglose = item.lineaOperativa === 'Servicios E' || esIcas;
    if (conDesglose) {
      // Unión de todos los ítems presentes en cualquier mes (primer registro encontrado).
      const itemsUnicos = new Map<string, { nombre: string; entry: any }>();
      for (const mes of (opx.meses ?? []) as any[]) {
        for (const p of (Array.isArray(mes?.preciosIndividuales) ? mes.preciosIndividuales : [])) {
          if (p?.key && !itemsUnicos.has(p.key)) itemsUnicos.set(p.key, { nombre: String(p.nombre ?? p.key), entry: p });
        }
      }
      if (itemsUnicos.size > 0) {
        return [...itemsUnicos.entries()].map(([key, { nombre, entry }]) => {
          const asignacion = esIcas
            ? contratoPorItem(key, nombre, entry)
            : { contrato, contratista };
          return buildRow(nombre, MESES_LABEL.map(m => getMonthDataForItem(m, key)), asignacion.contrato, asignacion.contratista);
        });
      }
      // Sin desglose guardado: cae a la fila única por actividad.
    }

    const mesesData = MESES_LABEL.map(m => getMonthData(m));
    const fila = buildRow(item.lineaOperativa || '', mesesData);
    // Respaldo del total anual con el presupuesto guardado (solo fila única).
    if (!fila[49]) fila[49] = item.presupuestoPlan || 0;
    return [fila];
  });

  // ── Construcción de la hoja "PXQ " (estructura fija de la plantilla) ──
  // Filas 1–5: caja IPC/TRM y notas. Fila 6: encabezados. Fila 7+: datos.
  const aoa: any[][] = [[], [], [], [], [], HEADERS_PXQ, ...excelRows];
  const worksheet = XLSX.utils.aoa_to_sheet(aoa);

  const setCell = (addr: string, v: any, t: 'n' | 's', s: any, z?: string) => {
    worksheet[addr] = { v, t, s, ...(z ? { z } : {}) };
  };

  // Caja IPC / TRM (M3:N4): naranja con borde medio alrededor.
  const FILL_NARANJA = { patternType: 'solid', fgColor: { rgb: 'FFC000' } };
  const medium = { style: 'medium', color: { auto: 1 } } as const;
  setCell('M3', 'IPC', 's', { font: FONT_DATA, fill: FILL_NARANJA, border: { left: medium, top: medium } });
  setCell('N3', 1.038, 'n', { font: FONT_DATA, fill: FILL_NARANJA, border: { right: medium, top: medium } });
  setCell('M4', 'TRM', 's', { font: FONT_DATA, fill: FILL_NARANJA, border: { left: medium, bottom: medium } });
  setCell('N4', 4150, 'n', { font: FONT_DATA, fill: FILL_NARANJA, border: { right: medium, bottom: medium } });

  // Notas de la fila 5 (celdas combinadas N5:Y5 y AL5:AX5).
  const FILL_BLANCO = { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } };
  const bordeInferior = { bottom: { style: 'thin', color: { auto: 1 } } };
  const notaPreciosStyle = {
    font: { italic: true, sz: 11, color: { rgb: '0070C0' }, name: 'Aptos Narrow' },
    fill: FILL_BLANCO, border: bordeInferior, alignment: { horizontal: 'center' },
  };
  const notaTotalesStyle = {
    font: { bold: true, sz: 11, color: { rgb: 'FF0000' }, name: 'Aptos Narrow' },
    fill: FILL_BLANCO, border: bordeInferior, alignment: { horizontal: 'center' },
  };
  setCell('N5', 'Los precios deben incluir IVA, así mismo proyectar los reajustes de IPC y tarifas de acuerdo con la fecha que aplique a cada contrato', 's', notaPreciosStyle);
  for (let c = 14; c <= 24; c++) setCell(XLSX.utils.encode_cell({ r: 4, c }), '', 's', { fill: FILL_BLANCO, border: bordeInferior });
  setCell('AL5', 'Casillas formuladas (Precio x Cantidad)', 's', notaTotalesStyle);
  for (let c = 38; c <= 49; c++) setCell(XLSX.utils.encode_cell({ r: 4, c }), '', 's', { fill: FILL_BLANCO, border: bordeInferior });
  worksheet['!merges'] = [
    { s: { r: 4, c: 13 }, e: { r: 4, c: 24 } },   // N5:Y5
    { s: { r: 4, c: 37 }, e: { r: 4, c: 49 } },   // AL5:AX5
  ];

  // Índices de columna de cada grupo mensual (0-based): la plantilla intercala
  // 12 precios (N–Y), 12 cantidades (Z–AK) y 12 totales (AL–AW), un mes por
  // posición. El total del mes i sale de Precio(i) × Cantidad(i).
  const COL_PRECIO_INI = 13;   // N
  const COL_CANT_INI = 25;     // Z
  const COL_TOTAL_INI = 37;    // AL
  const COL_TOTAL_ANIO = 49;   // AX

  // Estilos de encabezados (fila 6) y datos (filas 7+).
  for (let c = 0; c < HEADERS_PXQ.length; c++) {
    const headerAddr = XLSX.utils.encode_cell({ r: 5, c });
    if (worksheet[headerAddr]) worksheet[headerAddr].s = headerStyleFor(c);

    const dataStyle = dataStyleFor(c);
    for (let r = 0; r < excelRows.length; r++) {
      const addr = XLSX.utils.encode_cell({ r: 6 + r, c });
      if (!worksheet[addr]) worksheet[addr] = { v: '', t: 's' };
      worksheet[addr].s = dataStyle;
      if (dataStyle.numFmt) worksheet[addr].z = dataStyle.numFmt;
      if (c === 10 && worksheet[addr].v instanceof Date) worksheet[addr].z = 'm/d/yy';

      // Totales mensuales (AL–AW) como fórmula =Precio×Cantidad. El precio de la
      // celda ya es el unitario efectivo (incluye IVA/IPC y diferidos con cant=1),
      // así que la fórmula reproduce exactamente el total calculado. Se conserva
      // el valor numérico como caché para quien abra sin recalcular.
      if (c >= COL_TOTAL_INI && c <= COL_TOTAL_INI + 11) {
        const mesIdx = c - COL_TOTAL_INI;
        const precioAddr = XLSX.utils.encode_cell({ r: 6 + r, c: COL_PRECIO_INI + mesIdx });
        const cantAddr = XLSX.utils.encode_cell({ r: 6 + r, c: COL_CANT_INI + mesIdx });
        const total = Number(worksheet[addr].v) || 0;
        worksheet[addr] = { t: 'n', f: `${precioAddr}*${cantAddr}`, v: total, s: dataStyle, z: dataStyle.numFmt };
      } else if (c === COL_TOTAL_ANIO) {
        // Total año 1 (AX) = suma de los 12 totales mensuales de la fila.
        const desde = XLSX.utils.encode_cell({ r: 6 + r, c: COL_TOTAL_INI });
        const hasta = XLSX.utils.encode_cell({ r: 6 + r, c: COL_TOTAL_INI + 11 });
        const total = Number(worksheet[addr].v) || 0;
        worksheet[addr] = { t: 'n', f: `SUM(${desde}:${hasta})`, v: total, s: dataStyle, z: dataStyle.numFmt };
      }
    }
  }

  worksheet['!cols'] = COL_WIDTHS_PXQ.map(w => (w == null ? ({} as any) : { wch: w }));
  worksheet['!rows'] = [{ hpt: 15 }, { hpt: 15 }, { hpt: 15 }, { hpt: 15 }, { hpt: 15 }, { hpt: 43.5 }];
  worksheet['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 5 + excelRows.length, c: HEADERS_PXQ.length - 1 } });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'PXQ ');
  XLSX.writeFile(workbook, 'Plantilla_OPEX_Exportada.xlsx', { cellDates: true });
};

// ── Internal detail export ────────────────────────────────────
// Generates a per-parameter/item breakdown grouped by zone and matrix.

const MESES_LABEL = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

export const exportDetalleInternoToExcel = (actividades: ActividadAmbiental[]) => {
  const opexActivities = actividades.filter(a => !!a.opexDataRaw && parseOpex(a.opexDataRaw) !== null);

  if (opexActivities.length === 0) {
    alert("No hay actividades con planeación presupuestal registrada para exportar.");
    return;
  }

  const rows: Record<string, any>[] = [];

  for (const item of opexActivities) {
    const opx = parseOpex(item.opexDataRaw);
    if (!opx?.meses) continue;

    const zona    = opx.zona || item.zona || '';
    const linea   = item.lineaOperativa || '';
    const fuente  = (item as any).fuentePresupuesto || opx.fuentePresupuesto || 'OPEX';
    const tipo    = (item as any).tipoPlaneacion    || opx.tipoPlaneacion    || 'Plan';
    const anio    = (item as any).anioPlaneacion    || opx.anioPlaneacion    || '';
    const estacion = item.estacion || opx.pk || zona;
    const objetoContrato = opx.objeto || '';
    const descripcionNecesidad = opx.descripcionNecesidad || item.descripcion || item.tarea || '';

    // New format: per-item rows using preciosIndividuales
    const firstMonth = opx.meses[0];
    const tieneDesglose = firstMonth?.preciosIndividuales?.length > 0 &&
                          firstMonth.preciosIndividuales[0].total !== undefined;

    if (tieneDesglose) {
      const itemKeys: string[] = (firstMonth.preciosIndividuales as any[]).map((p: any) => p.key);

      for (const itemKey of itemKeys) {
        const firstEntry = (firstMonth.preciosIndividuales as any[]).find((p: any) => p.key === itemKey);
        if (!firstEntry) continue;

        let totalAnual = 0;
        let cantidadAnual = 0;
        const mesTotals: Record<string, number> = {};
        for (const mes of opx.meses as any[]) {
          const entry = (mes.preciosIndividuales as any[] | undefined)?.find((p: any) => p.key === itemKey);
          const mesTotal = entry?.total ?? 0;
          mesTotals[mes.mes] = mesTotal;
          totalAnual += mesTotal;
          cantidadAnual += Number(entry?.cantidad) || 0;
        }

        let precioEfectivo: number;
        if (cantidadAnual > 0) {
          precioEfectivo = totalAnual / cantidadAnual;
        } else if (totalAnual > 0) {
          precioEfectivo = totalAnual;
        } else {
          const basePrecio = firstEntry.precio ?? 0;
          const aplicaIva = firstEntry.aplicaIva ?? !((opx.ivaItemsExcluidos ?? []).includes(itemKey));
          const ivaFactor = (opx.ivaGlobalActivo && aplicaIva && (opx.ivaGlobalPorcentaje ?? 0) > 0)
            ? (1 + (opx.ivaGlobalPorcentaje / 100))
            : 1;
          precioEfectivo = basePrecio * ivaFactor;
        }

        const row: Record<string, any> = {
          "Zona": zona,
          "Línea Operativa": linea,
          "Fuente": fuente,
          "Tipo": tipo,
          "Año": anio,
          "Estación / Ubicación": estacion,
          "Objeto del contrato": objetoContrato,
          "Necesidad": opx.necesidad || "",
          "Subnecesidad": opx.subnecesidad || "",
          "Ítem / Parámetro": firstEntry.nombre,
          "Puntos": opx.paramTipoMuestra?.[itemKey] === 'compuesto' ? 0 : 1,
          "Compuestos": opx.paramTipoMuestra?.[itemKey] === 'compuesto' ? (opx.paramCantCompuestos?.[itemKey] || 1) : 0,
          "Precio / Und": precioEfectivo,
        };

        for (const [mesNombre, mesTotal] of Object.entries(mesTotals)) {
          row[mesNombre] = mesTotal;
        }
        // Fill any missing month columns with 0
        for (const m of MESES_LABEL) {
          if (!(m in row)) row[m] = 0;
        }
        row["Total Anual"] = totalAnual;
        row["Observaciones"] = descripcionNecesidad;
        rows.push(row);
      }
    } else {
      // Legacy format (no per-item breakdown): single row per activity
      const monthTotals: Record<string, number> = {};
      for (const mes of opx.meses as any[]) {
        monthTotals[mes.mes] = mes.total || 0;
      }
      const row: Record<string, any> = {
        "Zona": zona,
        "Línea Operativa": linea,
        "Fuente": fuente,
        "Tipo": tipo,
        "Año": anio,
        "Estación / Ubicación": estacion,
        "Objeto del contrato": objetoContrato,
        "Necesidad": opx.necesidad || "",
        "Subnecesidad": opx.subnecesidad || "",
        "Ítem / Parámetro": item.tarea || '',
        "Puntos": 0,
        "Compuestos": 0,
        "Precio / Und": 0,
      };
      for (const m of MESES_LABEL) row[m] = monthTotals[m] || 0;
      row["Total Anual"] = item.presupuestoPlan || 0;
      row["Observaciones"] = descripcionNecesidad;
      rows.push(row);
    }
  }

  if (rows.length === 0) return;

  rows.sort((a, b) =>
    (a["Zona"] + a["Línea Operativa"] + a["Ítem / Parámetro"])
      .localeCompare(b["Zona"] + b["Línea Operativa"] + b["Ítem / Parámetro"])
  );

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook  = XLSX.utils.book_new();
  const keys = Object.keys(rows[0]);
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      if (!worksheet[addr]) continue;
      const isHeader = R === 0;
      const col = keys[C];
      const isCurrency = MESES_LABEL.includes(col) || col === 'Total Anual' || col === 'Precio / Und';
      if (isCurrency && !isHeader) worksheet[addr].z = '"$"#,##0';
      worksheet[addr].s = {
        font: { bold: isHeader, color: isHeader ? { rgb: "FFFFFF" } : { rgb: "000000" }, name: "Calibri", sz: 11 },
        fill: isHeader ? { fgColor: { rgb: "003057" } } : undefined,
        border: {
          top: { style: 'thin', color: { auto: 1 } }, bottom: { style: 'thin', color: { auto: 1 } },
          left: { style: 'thin', color: { auto: 1 } }, right: { style: 'thin', color: { auto: 1 } },
        },
        alignment: { vertical: "center", horizontal: isCurrency ? "right" : "left", wrapText: true },
      };
    }
  }

  worksheet['!cols'] = keys.map(k =>
    MESES_LABEL.includes(k) ? { wch: 14 } :
    (k.includes('Objeto') || k.includes('Descripcion')) ? { wch: 42 } :
    (k.includes('Ítem') || k.includes('Parámetro')) ? { wch: 38 } :
    { wch: 18 }
  );

  XLSX.utils.book_append_sheet(workbook, worksheet, "Detalle Interno");
  XLSX.writeFile(workbook, "Detalle_Planeacion_Interna.xlsx");
};
