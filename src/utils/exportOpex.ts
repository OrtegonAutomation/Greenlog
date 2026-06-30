import * as XLSX from 'xlsx-js-style';
import { ActividadAmbiental } from '../types';

const parseOpex = (raw?: string) => {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

export const exportOpexToExcel = (actividades: ActividadAmbiental[]) => {
  // Filter only activities that have OPEX data
  const opexActivities = actividades.filter(a => !!a.opexDataRaw && parseOpex(a.opexDataRaw) !== null);

  if (opexActivities.length === 0) {
    alert("No hay actividades con planeación presupuestal OPEX registrada para exportar.");
    return;
  }

  // Format data for Excel
  const excelData = opexActivities.map(item => {
    const opx = parseOpex(item.opexDataRaw);
    
    // Helper function to extract properties by month
    const getMonthData = (mesNombre: string) => {
      const match = opx.meses?.find((m: any) => m.mes.toLowerCase() === mesNombre.toLowerCase());
      return {
        precio: match ? (match.precio || 0) : 0,
        cantidad: match ? (match.cantidad || 0) : 0,
        total: match ? (match.total || 0) : 0
      };
    };

    const ene = getMonthData("Enero");
    const feb = getMonthData("Febrero");
    const mar = getMonthData("Marzo");
    const abr = getMonthData("Abril");
    const may = getMonthData("Mayo");
    const jun = getMonthData("Junio");
    const jul = getMonthData("Julio");
    const ago = getMonthData("Agosto");
    const sep = getMonthData("Septiembre");
    const oct = getMonthData("Octubre");
    const nov = getMonthData("Noviembre");
    const dic = getMonthData("Diciembre");

    return {
      "Línea Operativa": item.lineaOperativa || "",
      "Fuente": (item as any).fuentePresupuesto || opx.fuentePresupuesto || "OPEX",
      "Tipo Planeación": (item as any).tipoPlaneacion || opx.tipoPlaneacion || "Plan",
      "Año": (item as any).anioPlaneacion || opx.anioPlaneacion || "",
      "Usuario Registra": item.responsable || "Sistema",
      "Zona": opx.zona || item.zona,
      "Tipo Lugar": opx.tipoLugar || "Estación",
      "Estación / PK": item.estacion || opx.pk || "",
      "Moneda": "COP",
      "Unidad de Medida": opx.unidadMedida || "UN",
      "Proceso abastecimiento": opx.procesoAbastecimiento || "",
      "No. de contrato": opx.contrato || item.contrato || "",
      "Objeto": opx.objeto || "",
      "Proveedor": opx.proveedor || "",
      "Fecha inicio contrato": opx.fechaInicio || item.fechaInicio,
      "Fecha final contrato": opx.fechaFin || item.fechaFin,
      "Administrador": opx.administrador || "",
      "Supervisor técnico": opx.supervisor || "",
      "Estado del contrato": opx.estadoContrato || "",
      "Necesidad": opx.necesidad || "",
      "Subnecesidad": opx.subnecesidad || "",
      // Compensaciones metadata (empty for non-compensaciones)
      "ID Obligación": opx.obligacion?.id || "",
      "Fecha creación obligación": opx.obligacion?.fechaCreacion || "",
      "Tipo acto": opx.obligacion?.actoAdministrativo?.tipo || "",
      "Número acto": opx.obligacion?.actoAdministrativo?.numero || "",
      "Fecha acto": opx.obligacion?.actoAdministrativo?.fecha || "",
      "Permiso": opx.obligacion?.permiso || "",
      "Autoridad ambiental": opx.obligacion?.autoridad || "",
      "Jurisdicción - Corporación": opx.obligacion?.jurisdiccion?.corporacion || "",
      "Jurisdicción - Departamento": opx.obligacion?.jurisdiccion?.departamento || "",
      "Jurisdicción - Municipio": opx.obligacion?.jurisdiccion?.municipio || "",
      "Jurisdicción - Vereda/Predio": opx.obligacion?.jurisdiccion?.veredaPredio || "",
      "Expediente": opx.obligacion?.expediente || "",
      "Categoría compensación": opx.obligacion?.categoria || "",
      "Sistema": opx.sistema || "",
      "Sector": opx.sector || "",
      "Asignación de recursos": opx.asignacionRecursos === true ? "Sí" : opx.asignacionRecursos === false ? "No" : "",
      "Saldo disponible": opx.saldoDisponible || 0,
      "Años planeados": opx.aniosAPlanear || "",
      "Contrato": opx.contratoSeleccionado || "",
      "Total Año 2": Array.isArray(opx.programacionY2) ? opx.programacionY2.reduce((s: number, p: any) => s + (p.total || 0), 0) : 0,
      "Total Año 3": Array.isArray(opx.programacionY3) ? opx.programacionY3.reduce((s: number, p: any) => s + (p.total || 0), 0) : 0,

      "Precio enero año 1": ene.precio, "Precio febrero año 1": feb.precio, "Precio marzo año 1": mar.precio,
      "Precio abril año 1": abr.precio, "Precio mayo año 1": may.precio, "Precio junio año 1": jun.precio,
      "Precio julio año 1": jul.precio, "Precio agosto año 1": ago.precio, "Precio septiembre año 1": sep.precio,
      "Precio octubre año 1": oct.precio, "Precio noviembre año 1": nov.precio, "Precio diciembre año 1": dic.precio,

      "Cantidad enero año 1": ene.cantidad, "Cantidad febrero año 1": feb.cantidad, "Cantidad marzo año 1": mar.cantidad,
      "Cantidad abril año 1": abr.cantidad, "Cantidad mayo año 1": may.cantidad, "Cantidad junio año 1": jun.cantidad,
      "Cantidad julio año 1": jul.cantidad, "Cantidad agosto año 1": ago.cantidad, "Cantidad septiembre año 1": sep.cantidad,
      "Cantidad octubre año 1": oct.cantidad, "Cantidad noviembre año 1": nov.cantidad, "Cantidad diciembre año 1": dic.cantidad,

      "Total enero año 1": ene.total, "Total febrero año 1": feb.total, "Total marzo año 1": mar.total,
      "Total abril año 1": abr.total, "Total mayo año 1": may.total, "Total junio año 1": jun.total,
      "Total julio año 1": jul.total, "Total agosto año 1": ago.total, "Total septiembre año 1": sep.total,
      "Total octubre año 1": oct.total, "Total noviembre año 1": nov.total, "Total diciembre año 1": dic.total,

      "Total año 1": item.presupuestoPlan || 0,

      "Total equivalente enero año 1 Ajustado2": 0, "Total equivalente febrero año 1 Ajustado3": 0,
      "Total equivalente marzo año 1 Ajustado4": 0, "Total equivalente abril año 1 Ajustado5": 0,
      "Total equivalente mayo año 1 Ajustado6": 0, "Total equivalente junio año 1 Ajustado7": 0,
      "Total equivalente julio año 1 Ajustado8": 0, "Total equivalente agosto año 1 Ajustado9": 0,
      "Total equivalente septiembre año 1 Ajustado10": 0, "Total equivalente octubre año 1 Ajustado11": 0,
      "Total equivalente noviembre año 1 Ajustado12": 0, "Total equivalente diciembre año 1 Ajustado13": 0,
      "Total equivalente año 1 Ajustado14": 0,

      // Notas libres al final (antes "Descripción de la necesidad").
      "Observaciones": opx.descripcionNecesidad || ""
    };
  });

  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();

  // Enhance cell formatting and styles
  const keys = Object.keys(excelData[0]);
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
  
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!worksheet[cellAddress]) continue;

      const isHeader = R === 0;
      const columnName = keys[C];
      const isCurrency = columnName && (columnName.includes("Precio") || columnName.includes("Total"));

      if (isCurrency && !isHeader) {
        worksheet[cellAddress].z = '"$"#,##0.00'; // Formato moneda colombiana
      }

      worksheet[cellAddress].s = {
        font: {
          bold: isHeader,
          color: isHeader ? { rgb: "FFFFFF" } : { rgb: "000000" },
          name: "Calibri",
          sz: 11
        },
        fill: isHeader ? { fgColor: { rgb: "00B050" } } : undefined, // Header color: verde standard (00B050)
        border: {
          top: { style: 'thin', color: { auto: 1 } },
          bottom: { style: 'thin', color: { auto: 1 } },
          left: { style: 'thin', color: { auto: 1 } },
          right: { style: 'thin', color: { auto: 1 } }
        },
        alignment: {
          vertical: "center",
          horizontal: isHeader || columnName?.includes("Cantidad") ? "center" : (isCurrency ? "right" : "left"),
          wrapText: true
        }
      };
    }
  }

  const defaultWidth = { wch: 18 };
  const largeWidth = { wch: 35 };
  worksheet['!cols'] = keys.map(k => k.includes("Objeto") || k.includes("Descripción") || k.includes("Proceso") ? largeWidth : defaultWidth);

  XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla OPEX");

  // Export
  XLSX.writeFile(workbook, "Plantilla_OPEX_Exportada.xlsx");
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
          "Precio / Und": firstEntry.precio,
        };

        let totalAnual = 0;
        for (const mes of opx.meses as any[]) {
          const entry = (mes.preciosIndividuales as any[] | undefined)?.find((p: any) => p.key === itemKey);
          const mesTotal = entry?.total ?? 0;
          row[mes.mes] = mesTotal;
          totalAnual += mesTotal;
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
