// ============================================================
// reportesAggregations — cálculos para la página de Reportes.
// 2027: en vivo desde las actividades (opex_data_raw). 2026: línea base estática.
// Todas las funciones son puras.
// ============================================================
import { ActividadAmbiental } from '../types';
import {
  BASELINE_2026, TOTAL_2026, baseline2026PorZona, baseline2026PorLinea, Baseline2026Cell,
} from '../data/baseline2026';

/** Filtra la línea base 2026 por zona/línea (el tipo CAPEX/OPEX no aplica: la base es OPEX). */
export function baseline2026Filtrada(zona?: string, linea?: string): Baseline2026Cell[] {
  return BASELINE_2026.filter(c =>
    (!zona || zona === 'Todas' || c.zona === zona) &&
    (!linea || linea === 'Todas' || c.linea === linea));
}
export function mapPorZona(celdas: Baseline2026Cell[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const c of celdas) m[c.zona] = (m[c.zona] ?? 0) + c.valor;
  return m;
}
export function mapPorLinea(celdas: Baseline2026Cell[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const c of celdas) m[c.linea] = (m[c.linea] ?? 0) + c.valor;
  return m;
}

export const MESES_LABEL = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const MES_ABBR = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const parseOpex = (raw?: string): any => { try { return raw ? JSON.parse(raw) : {}; } catch { return {}; } };

/** Actividades del año indicado (por defecto 2027). */
export function actividadesAnio(actividades: ActividadAmbiental[], anio = 2027): ActividadAmbiental[] {
  return actividades.filter(a => {
    const y = a.anioPlaneacion ?? (Number(parseOpex(a.opexDataRaw).anioPlaneacion) || undefined);
    return y === anio;
  });
}

const montoActividad = (a: ActividadAmbiental): number => {
  if (typeof a.presupuestoPlan === 'number' && a.presupuestoPlan > 0) return a.presupuestoPlan;
  const opx = parseOpex(a.opexDataRaw);
  if (Array.isArray(opx.meses)) return opx.meses.reduce((s: number, m: any) => s + (m.total || 0), 0);
  return 0;
};

const sumBy = (acts: ActividadAmbiental[], key: (a: ActividadAmbiental) => string): Record<string, number> => {
  const m: Record<string, number> = {};
  for (const a of acts) { const k = key(a) || '—'; m[k] = (m[k] ?? 0) + montoActividad(a); }
  return m;
};

// ---- Totales 2027 ----
export const total2027 = (acts: ActividadAmbiental[]) => acts.reduce((s, a) => s + montoActividad(a), 0);
export const porZona2027 = (acts: ActividadAmbiental[]) => sumBy(acts, a => a.zona);
export const porLinea2027 = (acts: ActividadAmbiental[]) => sumBy(acts, a => a.lineaOperativa);

// ---- Comparación 2026 vs 2027 ----
export interface CompRow { nombre: string; y2026: number; y2027: number; delta: number; varPct: number | null; }

const buildComp = (m2026: Record<string, number>, m2027: Record<string, number>): CompRow[] => {
  const nombres = [...new Set([...Object.keys(m2026), ...Object.keys(m2027)])];
  return nombres.map(nombre => {
    const y2026 = m2026[nombre] ?? 0;
    const y2027 = m2027[nombre] ?? 0;
    return { nombre, y2026, y2027, delta: y2027 - y2026, varPct: y2026 > 0 ? (y2027 - y2026) / y2026 : null };
  }).sort((a, b) => b.delta - a.delta);
};

// Los parámetros de base 2026 son opcionales: por defecto usan el baseline completo,
// pero el módulo puede pasar una base ya filtrada (por zona/línea/tipo) para que la
// comparación 2026 vs 2027 sea consistente con los filtros aplicados.
export const comparacionPorZona = (acts: ActividadAmbiental[], base2026Zona: Record<string, number> = baseline2026PorZona()) =>
  buildComp(base2026Zona, porZona2027(acts));
export const comparacionPorLinea = (acts: ActividadAmbiental[], base2026Linea: Record<string, number> = baseline2026PorLinea()) =>
  buildComp(base2026Linea, porLinea2027(acts));

export function resumenComparacion(acts: ActividadAmbiental[], total2026 = TOTAL_2026) {
  const t2027 = total2027(acts);
  const crecimiento = total2026 > 0 ? (t2027 - total2026) / total2026 : null;
  return { total2026, total2027: t2027, delta: t2027 - total2026, crecimiento };
}

// ---- Pareto de líneas (rubros) ----
export interface ParetoRow { nombre: string; valor: number; acumPct: number; }
export function paretoLineas(acts: ActividadAmbiental[]): { filas: ParetoRow[]; total: number } {
  const m = porLinea2027(acts);
  const ordenadas = Object.entries(m).sort((a, b) => b[1] - a[1]);
  const total = ordenadas.reduce((s, [, v]) => s + v, 0) || 1;
  let acum = 0;
  const filas = ordenadas.map(([nombre, valor]) => { acum += valor; return { nombre, valor, acumPct: (acum / total) * 100 }; });
  return { filas, total };
}

/** Concentración de los top-N rubros (por defecto 3), en % del total. */
export function concentracionTop(acts: ActividadAmbiental[], n = 3): number {
  const { filas, total } = paretoLineas(acts);
  const top = filas.slice(0, n).reduce((s, f) => s + f.valor, 0);
  return total > 0 ? (top / total) * 100 : 0;
}

// ---- Caja mensual 2027 ----
export interface MesRow { mes: string; valor: number; }
export function cajaMensual(acts: ActividadAmbiental[]): { filas: MesRow[]; promedio: number; picoMes: string; picoValor: number } {
  const tot = new Array(12).fill(0);
  for (const a of acts) {
    const opx = parseOpex(a.opexDataRaw);
    if (Array.isArray(opx.meses)) {
      opx.meses.forEach((m: any, i: number) => {
        const idx = MESES_LABEL.indexOf(m.mes); const k = idx >= 0 ? idx : i;
        if (k >= 0 && k < 12) tot[k] += (m.total || 0);
      });
    }
  }
  const filas = tot.map((valor, i) => ({ mes: MES_ABBR[i], valor }));
  const suma = tot.reduce((s, v) => s + v, 0);
  const promedio = suma / 12;
  let picoIdx = 0; tot.forEach((v, i) => { if (v > tot[picoIdx]) picoIdx = i; });
  return { filas, promedio, picoMes: MES_ABBR[picoIdx], picoValor: tot[picoIdx] };
}

// ---- Dependencia de proveedores 2027 ----
export interface ProveedorRow { nombre: string; valor: number; pct: number; }
export function dependenciaProveedores(acts: ActividadAmbiental[], n = 8): ProveedorRow[] {
  const m: Record<string, number> = {};
  for (const a of acts) {
    const opx = parseOpex(a.opexDataRaw);
    const prov = (opx.proveedor || '').trim();
    if (!prov) continue;
    m[prov] = (m[prov] ?? 0) + montoActividad(a);
  }
  const total = Object.values(m).reduce((s, v) => s + v, 0) || 1;
  return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n)
    .map(([nombre, valor]) => ({ nombre, valor, pct: (valor / total) * 100 }));
}

// ---- Exposición por estado de contrato 2027 ----
// "Base ejecutable" = contrato VIGENTE/CERRADO con número; "Por definir/cerrar" = sin número o POR FIRMAR.
export interface ExposicionRow { linea: string; base: number; porDefinir: number; total: number; pctPorDefinir: number; }
const esPorDefinir = (opx: any): boolean => {
  const estado = String(opx.estadoContrato || '').toUpperCase();
  const contrato = String(opx.contrato || '').trim();
  return !contrato || estado.includes('POR FIRMAR') || estado.includes('DEFINIR');
};
export function exposicionPorLinea(acts: ActividadAmbiental[]): { filas: ExposicionRow[]; totalPorDefinir: number; total: number } {
  const m: Record<string, { base: number; porDefinir: number }> = {};
  let totalPorDefinir = 0, total = 0;
  for (const a of acts) {
    const opx = parseOpex(a.opexDataRaw);
    const monto = montoActividad(a);
    const linea = a.lineaOperativa || '—';
    if (!m[linea]) m[linea] = { base: 0, porDefinir: 0 };
    if (esPorDefinir(opx)) { m[linea].porDefinir += monto; totalPorDefinir += monto; }
    else m[linea].base += monto;
    total += monto;
  }
  const filas = Object.entries(m).map(([linea, v]) => ({
    linea, base: v.base, porDefinir: v.porDefinir, total: v.base + v.porDefinir,
    pctPorDefinir: (v.base + v.porDefinir) > 0 ? (v.porDefinir / (v.base + v.porDefinir)) * 100 : 0,
  })).sort((a, b) => b.total - a.total);
  return { filas, totalPorDefinir, total };
}

// ---- Heatmap Zona × Línea 2027 ----
export interface HeatmapData { zonas: string[]; lineas: string[]; valores: Record<string, Record<string, number>>; max: number; }
export function heatmapZonaLinea(acts: ActividadAmbiental[], topLineas = 6): HeatmapData {
  const porLinea = porLinea2027(acts);
  const lineas = Object.entries(porLinea).sort((a, b) => b[1] - a[1]).slice(0, topLineas).map(([l]) => l);
  const porZona = porZona2027(acts);
  const zonas = Object.entries(porZona).sort((a, b) => b[1] - a[1]).map(([z]) => z);
  const valores: Record<string, Record<string, number>> = {};
  let max = 0;
  for (const a of acts) {
    if (!lineas.includes(a.lineaOperativa)) continue;
    const z = a.zona || '—';
    if (!valores[z]) valores[z] = {};
    valores[z][a.lineaOperativa] = (valores[z][a.lineaOperativa] ?? 0) + montoActividad(a);
    if (valores[z][a.lineaOperativa] > max) max = valores[z][a.lineaOperativa];
  }
  return { zonas, lineas, valores, max };
}

// ---- Formato ----
export function fmtB(v: number): string {
  const b = v / 1_000_000_000;
  if (Math.abs(b) >= 1) return `$${b.toFixed(1)}B`;
  const m = v / 1_000_000;
  return `$${m.toFixed(0)}M`;
}
export function fmtPct(v: number | null): string {
  if (v === null) return '—';
  return `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}%`;
}
export const fmtCOP = (v: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);
