// ============================================================
// exportReporte — genera un informe Excel del tablero de Reportes
// (comparación 2026 vs 2027 + análisis OPEX 2027) en varias hojas.
// ============================================================
import * as XLSX from 'xlsx-js-style';
import { ActividadAmbiental } from '../types';
import {
  actividadesAnio, resumenComparacion, comparacionPorZona, comparacionPorLinea,
  paretoLineas, concentracionTop, cajaMensual, dependenciaProveedores,
  exposicionPorLinea, heatmapZonaLinea, MESES_LABEL,
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

export function exportReporteToExcel(actividades: ActividadAmbiental[], anio = 2027) {
  const acts = actividadesAnio(actividades, anio);
  const resumen = resumenComparacion(acts);
  const wb = XLSX.utils.book_new();

  // 1. Resumen
  hoja(wb, 'Resumen', [
    { Indicador: `Presupuesto ${anio}`, Valor: Math.round(resumen.total2027) },
    { Indicador: 'Base 2026', Valor: Math.round(resumen.total2026) },
    { Indicador: 'Crecimiento vs 2026 (%)', Valor: resumen.crecimiento !== null ? +(resumen.crecimiento * 100).toFixed(1) : '' },
    { Indicador: 'Delta absoluto', Valor: Math.round(resumen.delta) },
    { Indicador: 'Concentración top 3 rubros (%)', Valor: +concentracionTop(acts, 3).toFixed(1) },
    { Indicador: 'Mayor mes de caja', Valor: cajaMensual(acts).picoMes },
  ], [34, 20]);

  // 2. Comparación por zona
  hoja(wb, 'Comparación Zona', comparacionPorZona(acts).map(c => ({
    Zona: c.nombre, '2026': Math.round(c.y2026), [`${anio}`]: Math.round(c.y2027),
    Delta: Math.round(c.delta), 'Var %': c.varPct !== null ? +(c.varPct * 100).toFixed(1) : '',
  })), [16, 18, 18, 18, 10]);

  // 3. Comparación por línea
  hoja(wb, 'Comparación Línea', comparacionPorLinea(acts).map(c => ({
    'Línea Operativa': c.nombre, '2026': Math.round(c.y2026), [`${anio}`]: Math.round(c.y2027),
    Delta: Math.round(c.delta), 'Var %': c.varPct !== null ? +(c.varPct * 100).toFixed(1) : '',
  })), [30, 18, 18, 18, 10]);

  // 4. Pareto
  hoja(wb, 'Pareto Rubros', paretoLineas(acts).filas.map(f => ({
    'Línea Operativa': f.nombre, Valor: Math.round(f.valor), 'Acumulado %': +f.acumPct.toFixed(1),
  })), [30, 18, 14]);

  // 5. Caja mensual
  const caja = cajaMensual(acts);
  hoja(wb, 'Caja Mensual', caja.filas.map((f, i) => ({
    Mes: MESES_LABEL[i], Valor: Math.round(f.valor),
  })), [16, 18]);

  // 6. Proveedores
  hoja(wb, 'Proveedores', dependenciaProveedores(acts, 15).map(p => ({
    Proveedor: p.nombre, Valor: Math.round(p.valor), '% del gasto': +p.pct.toFixed(1),
  })), [40, 18, 12]);

  // 7. Exposición contractual
  const exp = exposicionPorLinea(acts);
  hoja(wb, 'Exposición Contrato', exp.filas.map(f => ({
    'Línea Operativa': f.linea, 'Base ejecutable': Math.round(f.base),
    'Por definir/cerrar': Math.round(f.porDefinir), Total: Math.round(f.total),
    '% Por definir': +f.pctPorDefinir.toFixed(1),
  })), [30, 18, 18, 18, 14]);

  // 8. Heatmap Zona × Rubro
  const heat = heatmapZonaLinea(acts, 8);
  hoja(wb, 'Zona x Rubro', heat.zonas.map(z => {
    const row: Record<string, any> = { Zona: z };
    for (const l of heat.lineas) row[l] = Math.round(heat.valores[z]?.[l] ?? 0);
    return row;
  }), [16, ...heat.lineas.map(() => 18)]);

  XLSX.writeFile(wb, `Reporte_OPEX_${anio}.xlsx`);
}
