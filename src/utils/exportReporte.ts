// ============================================================
// exportReporte — genera un informe Excel del tablero de Reportes
// (comparación año base vs año planeado + análisis OPEX) en varias hojas.
// ============================================================
import * as XLSX from 'xlsx-js-style';
import { ActividadAmbiental } from '../types';
import { Baseline2026Cell } from '../data/baseline2026';
import {
  actividadesEnAnio, resumenComparacion, comparacionPorZona, comparacionPorLinea,
  paretoLineas, concentracionTop, cajaMensual, dependenciaProveedores,
  exposicionPorLinea, heatmapZonaLinea, MESES_LABEL, mapPorZona, mapPorLinea,
} from './reportesAggregations';

const HDR_STYLE = {
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 10 },
  fill: { fgColor: { rgb: '003057' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
};

function hoja(wb: XLSX.WorkBook, nombre: string, rows: Record<string, any>[], anchos: number[]) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    if (ws[addr]) ws[addr].s = HDR_STYLE;
  }
  ws['!cols'] = anchos.map(wch => ({ wch }));
  XLSX.utils.book_append_sheet(wb, ws, nombre.slice(0, 31));
}

export function exportReporteToExcel(
  actividades: ActividadAmbiental[],
  anio: number,
  base: { celdas: Baseline2026Cell[]; anioBase: number },
) {
  const acts = actividadesEnAnio(actividades, anio);
  const totalBase = base.celdas.reduce((s, c) => s + c.valor, 0);
  const resumen = resumenComparacion(acts, anio, totalBase);
  const { anioBase } = base;
  const wb = XLSX.utils.book_new();

  // 1. Resumen
  hoja(wb, 'Resumen', [
    { Indicador: `Presupuesto ${anio}`, Valor: Math.round(resumen.totalPlan) },
    { Indicador: `Base ${anioBase}`, Valor: Math.round(resumen.totalBase) },
    { Indicador: `Crecimiento vs ${anioBase} (%)`, Valor: resumen.crecimiento !== null ? +(resumen.crecimiento * 100).toFixed(1) : '' },
    { Indicador: 'Delta absoluto', Valor: Math.round(resumen.delta) },
    { Indicador: 'Concentración top 3 líneas operativas (%)', Valor: +concentracionTop(acts, anio, 3).toFixed(1) },
    { Indicador: 'Mayor mes de caja', Valor: cajaMensual(acts, anio).picoMes },
  ], [34, 20]);

  // 2. Comparación por zona
  hoja(wb, 'Comparación Zona', comparacionPorZona(acts, anio, mapPorZona(base.celdas)).map(c => ({
    Zona: c.nombre, [`${anioBase}`]: Math.round(c.base), [`${anio}`]: Math.round(c.plan),
    Delta: Math.round(c.delta), 'Var %': c.varPct !== null ? +(c.varPct * 100).toFixed(1) : '',
  })), [16, 18, 18, 18, 10]);

  // 3. Comparación por línea
  hoja(wb, 'Comparación Línea', comparacionPorLinea(acts, anio, mapPorLinea(base.celdas)).map(c => ({
    'Línea Operativa': c.nombre, [`${anioBase}`]: Math.round(c.base), [`${anio}`]: Math.round(c.plan),
    Delta: Math.round(c.delta), 'Var %': c.varPct !== null ? +(c.varPct * 100).toFixed(1) : '',
  })), [30, 18, 18, 18, 10]);

  // 4. Pareto
  hoja(wb, 'Pareto Líneas Operativas', paretoLineas(acts, anio).filas.map(f => ({
    'Línea Operativa': f.nombre, Valor: Math.round(f.valor), 'Acumulado %': +f.acumPct.toFixed(1),
  })), [30, 18, 14]);

  // 5. Caja mensual
  const caja = cajaMensual(acts, anio);
  hoja(wb, 'Caja Mensual', caja.filas.map((f, i) => ({
    Mes: MESES_LABEL[i], Valor: Math.round(f.valor),
  })), [16, 18]);

  // 6. Proveedores
  hoja(wb, 'Proveedores', dependenciaProveedores(acts, anio, 15).map(p => ({
    Proveedor: p.nombre, Valor: Math.round(p.valor), '% del gasto': +p.pct.toFixed(1),
  })), [40, 18, 12]);

  // 7. Exposición contractual
  const exp = exposicionPorLinea(acts, anio);
  hoja(wb, 'Exposición Contrato', exp.filas.map(f => ({
    'Línea Operativa': f.linea, 'Base ejecutable': Math.round(f.base),
    'Por definir/cerrar': Math.round(f.porDefinir), Total: Math.round(f.total),
    '% Por definir': +f.pctPorDefinir.toFixed(1),
  })), [30, 18, 18, 18, 14]);

  // 8. Heatmap Zona × Rubro
  const heat = heatmapZonaLinea(acts, anio, 8);
  hoja(wb, 'Zona x Línea Operativa', heat.zonas.map(z => {
    const row: Record<string, any> = { Zona: z };
    for (const l of heat.lineas) row[l] = Math.round(heat.valores[z]?.[l] ?? 0);
    return row;
  }), [16, ...heat.lineas.map(() => 18)]);

  XLSX.writeFile(wb, `Reporte_OPEX_${anio}.xlsx`);
}
