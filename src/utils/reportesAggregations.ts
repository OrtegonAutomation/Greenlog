// ============================================================
// reportesAggregations — cálculos para la página de Reportes.
// Año planeado: en vivo desde las actividades (opex_data_raw), incluyendo
// programaciones Año 2/Año 3 de compensaciones multi-año. Año base: matriz
// estática (2026) o snapshot congelado / agregado vivo tipo Plan (2027+).
// Todas las funciones son puras.
// ============================================================
import { ActividadAmbiental } from '../types';
import { BASELINE_2026, Baseline2026Cell } from '../data/baseline2026';

/** Filtra celdas de una base (2026 estática o snapshot) por zona/línea. */
export function filtrarCeldas(celdas: Baseline2026Cell[], zona?: string, linea?: string): Baseline2026Cell[] {
  return celdas.filter(c =>
    (!zona || zona === 'Todas' || c.zona === zona) &&
    (!linea || linea === 'Todas' || c.linea === linea));
}
/** @deprecated usar filtrarCeldas(BASELINE_2026, ...) — se mantiene por compatibilidad. */
export function baseline2026Filtrada(zona?: string, linea?: string): Baseline2026Cell[] {
  return filtrarCeldas(BASELINE_2026, zona, linea);
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
export const MES_ABBR = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const parseOpex = (raw?: string): any => { try { return raw ? JSON.parse(raw) : {}; } catch { return {}; } };

const anioBaseActividad = (a: ActividadAmbiental): number | undefined =>
  a.anioPlaneacion ?? (Number(parseOpex(a.opexDataRaw).anioPlaneacion) || undefined);

const sumProg = (arr: any): number =>
  Array.isArray(arr) ? arr.reduce((s: number, p: any) => s + (p.total || 0), 0) : 0;

/**
 * Monto de la actividad imputable al año dado.
 * - Año 1 (anioPlaneacion): suma de opx.meses; si no hay meses y la actividad
 *   es de un solo año, presupuestoPlan. En multi-año NO se usa presupuestoPlan
 *   para el año 1 porque incluye los totales de Año 2/Año 3.
 * - Año 2/Año 3 (compensaciones multi-año): suma de programacionY2/Y3.
 */
export function montoActividadEnAnio(a: ActividadAmbiental, anio: number): number {
  const anio1 = anioBaseActividad(a);
  if (anio1 === undefined) return 0;
  const opx = parseOpex(a.opexDataRaw);
  if (anio === anio1) {
    if (Array.isArray(opx.meses) && opx.meses.length > 0) {
      return opx.meses.reduce((s: number, m: any) => s + (m.total || 0), 0);
    }
    const multiAnio = (Number(opx.aniosAPlanear) || 1) > 1;
    if (!multiAnio && typeof a.presupuestoPlan === 'number' && a.presupuestoPlan > 0) return a.presupuestoPlan;
    return 0;
  }
  if (anio === anio1 + 1) return sumProg(opx.programacionY2);
  if (anio === anio1 + 2) return sumProg(opx.programacionY3);
  return 0;
}

/** Actividades con presupuesto imputable al año (incluye Año 2/3 de multi-año). */
export function actividadesEnAnio(actividades: ActividadAmbiental[], anio: number): ActividadAmbiental[] {
  return actividades.filter(a =>
    anioBaseActividad(a) === anio || montoActividadEnAnio(a, anio) > 0);
}

/** @deprecated usar actividadesEnAnio (sin default de año). */
export const actividadesAnio = actividadesEnAnio;

/** Años con planeación: años base + años derivados de programaciones Y2/Y3. */
export function aniosDisponibles(actividades: ActividadAmbiental[]): number[] {
  const anios = new Set<number>();
  for (const a of actividades) {
    const anio1 = anioBaseActividad(a);
    if (anio1 === undefined) continue;
    anios.add(anio1);
    const opx = parseOpex(a.opexDataRaw);
    if (sumProg(opx.programacionY2) > 0) anios.add(anio1 + 1);
    if (sumProg(opx.programacionY3) > 0) anios.add(anio1 + 2);
  }
  return [...anios].sort((x, y) => x - y);
}

/** Año de planeación vigente: el mayor con datos, o el año próximo. */
export function anioVigente(actividades: ActividadAmbiental[]): number {
  const anios = aniosDisponibles(actividades);
  return anios.length > 0 ? anios[anios.length - 1] : new Date().getFullYear() + 1;
}

const sumBy = (acts: ActividadAmbiental[], anio: number, key: (a: ActividadAmbiental) => string): Record<string, number> => {
  const m: Record<string, number> = {};
  for (const a of acts) { const k = key(a) || '—'; m[k] = (m[k] ?? 0) + montoActividadEnAnio(a, anio); }
  return m;
};

// ---- Totales del año planeado ----
export const totalAnio = (acts: ActividadAmbiental[], anio: number) =>
  acts.reduce((s, a) => s + montoActividadEnAnio(a, anio), 0);
export const porZonaAnio = (acts: ActividadAmbiental[], anio: number) => sumBy(acts, anio, a => a.zona);
export const porLineaAnio = (acts: ActividadAmbiental[], anio: number) => sumBy(acts, anio, a => a.lineaOperativa);

// ---- Base de comparación en vivo (solo tipo Plan) ----
const tipoPlaneacionDe = (a: ActividadAmbiental): string => {
  const t = (a as any).tipoPlaneacion ?? parseOpex(a.opexDataRaw).tipoPlaneacion ?? 'Plan';
  return String(t);
};

/**
 * Base viva del año: agregado Zona×Línea de lo planeado tipo "Plan"
 * (excluye Adicional/Emergencia). Se usa cuando el año base aún no tiene
 * snapshot congelado, y también para generar el snapshot en Administración.
 */
export function baseVivaAnio(actividades: ActividadAmbiental[], anio: number): Baseline2026Cell[] {
  const m: Record<string, Record<string, number>> = {};
  for (const a of actividadesEnAnio(actividades, anio)) {
    if (tipoPlaneacionDe(a) !== 'Plan') continue;
    const monto = montoActividadEnAnio(a, anio);
    if (monto <= 0) continue;
    const zona = a.zona || '—';
    const linea = a.lineaOperativa || '—';
    if (!m[zona]) m[zona] = {};
    m[zona][linea] = (m[zona][linea] ?? 0) + monto;
  }
  const celdas: Baseline2026Cell[] = [];
  for (const [zona, lineas] of Object.entries(m)) {
    for (const [linea, valor] of Object.entries(lineas)) celdas.push({ zona, linea, valor });
  }
  return celdas;
}

// ---- Comparación base vs año planeado ----
export interface CompRow { nombre: string; base: number; plan: number; delta: number; varPct: number | null; }

const buildComp = (mBase: Record<string, number>, mPlan: Record<string, number>): CompRow[] => {
  const nombres = [...new Set([...Object.keys(mBase), ...Object.keys(mPlan)])];
  return nombres.map(nombre => {
    const base = mBase[nombre] ?? 0;
    const plan = mPlan[nombre] ?? 0;
    return { nombre, base, plan, delta: plan - base, varPct: base > 0 ? (plan - base) / base : null };
  }).sort((a, b) => b.delta - a.delta);
};

// La base se pasa siempre desde el módulo (celdas ya filtradas por zona/línea)
// para que la comparación sea consistente con los filtros aplicados.
export const comparacionPorZona = (acts: ActividadAmbiental[], anio: number, basePorZona: Record<string, number>) =>
  buildComp(basePorZona, porZonaAnio(acts, anio));
export const comparacionPorLinea = (acts: ActividadAmbiental[], anio: number, basePorLinea: Record<string, number>) =>
  buildComp(basePorLinea, porLineaAnio(acts, anio));

export function resumenComparacion(acts: ActividadAmbiental[], anio: number, totalBase: number) {
  const totalPlan = totalAnio(acts, anio);
  const crecimiento = totalBase > 0 ? (totalPlan - totalBase) / totalBase : null;
  return { totalBase, totalPlan, delta: totalPlan - totalBase, crecimiento };
}

// ---- Pareto de líneas (rubros) ----
export interface ParetoRow { nombre: string; valor: number; acumPct: number; }
export function paretoLineas(acts: ActividadAmbiental[], anio: number): { filas: ParetoRow[]; total: number } {
  const m = porLineaAnio(acts, anio);
  const ordenadas = Object.entries(m).sort((a, b) => b[1] - a[1]);
  const total = ordenadas.reduce((s, [, v]) => s + v, 0) || 1;
  let acum = 0;
  const filas = ordenadas.map(([nombre, valor]) => { acum += valor; return { nombre, valor, acumPct: (acum / total) * 100 }; });
  return { filas, total };
}

/** Concentración de los top-N rubros (por defecto 3), en % del total. */
export function concentracionTop(acts: ActividadAmbiental[], anio: number, n = 3): number {
  const { filas, total } = paretoLineas(acts, anio);
  const top = filas.slice(0, n).reduce((s, f) => s + f.valor, 0);
  return total > 0 ? (top / total) * 100 : 0;
}

// ---- Caja mensual del año planeado ----
// Los aportes de Año 2/Año 3 (multi-año) no tienen mensualización: se guardan
// como totales anuales, así que se distribuyen uniformes (total/12) para que
// la caja mensual cuadre con el total del año.
export interface MesRow { mes: string; valor: number; }

const mesesDeActividadEnAnio = (a: ActividadAmbiental, anio: number): number[] => {
  const tot = new Array(12).fill(0);
  const anio1 = anioBaseActividad(a);
  if (anio1 === undefined) return tot;
  const opx = parseOpex(a.opexDataRaw);
  if (anio === anio1) {
    if (Array.isArray(opx.meses)) {
      opx.meses.forEach((m: any, i: number) => {
        const idx = MESES_LABEL.indexOf(m.mes); const k = idx >= 0 ? idx : i;
        if (k >= 0 && k < 12) tot[k] += (m.total || 0);
      });
    }
    return tot;
  }
  const anual = anio === anio1 + 1 ? sumProg(opx.programacionY2)
    : anio === anio1 + 2 ? sumProg(opx.programacionY3) : 0;
  if (anual > 0) { const cuota = anual / 12; for (let i = 0; i < 12; i++) tot[i] = cuota; }
  return tot;
};

export function cajaMensual(acts: ActividadAmbiental[], anio: number): { filas: MesRow[]; promedio: number; picoMes: string; picoValor: number } {
  const tot = new Array(12).fill(0);
  for (const a of acts) {
    const meses = mesesDeActividadEnAnio(a, anio);
    for (let i = 0; i < 12; i++) tot[i] += meses[i];
  }
  const filas = tot.map((valor, i) => ({ mes: MES_ABBR[i], valor }));
  const suma = tot.reduce((s, v) => s + v, 0);
  const promedio = suma / 12;
  let picoIdx = 0; tot.forEach((v, i) => { if (v > tot[picoIdx]) picoIdx = i; });
  return { filas, promedio, picoMes: MES_ABBR[picoIdx], picoValor: tot[picoIdx] };
}

/** Presupuesto del año por línea operativa de UN mes (índice 0-11). */
export function porLineaDeMes(acts: ActividadAmbiental[], anio: number, mesIdx: number): Record<string, number> {
  const m: Record<string, number> = {};
  for (const a of acts) {
    const total = mesesDeActividadEnAnio(a, anio)[mesIdx] || 0;
    if (total > 0) m[a.lineaOperativa || '—'] = (m[a.lineaOperativa || '—'] ?? 0) + total;
  }
  return m;
}

// ---- Dependencia de proveedores ----
export interface ProveedorRow { nombre: string; valor: number; pct: number; }
export function dependenciaProveedores(acts: ActividadAmbiental[], anio: number, n = 8): ProveedorRow[] {
  const m: Record<string, number> = {};
  for (const a of acts) {
    const opx = parseOpex(a.opexDataRaw);
    const prov = (opx.proveedor || '').trim();
    if (!prov) continue;
    m[prov] = (m[prov] ?? 0) + montoActividadEnAnio(a, anio);
  }
  const total = Object.values(m).reduce((s, v) => s + v, 0) || 1;
  return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n)
    .map(([nombre, valor]) => ({ nombre, valor, pct: (valor / total) * 100 }));
}

// ---- Exposición por estado de contrato ----
// "Base ejecutable" = contrato VIGENTE/CERRADO con número; "Por definir/cerrar" = sin número o POR FIRMAR.
export interface ExposicionRow { linea: string; base: number; porDefinir: number; total: number; pctPorDefinir: number; }
const esPorDefinir = (opx: any): boolean => {
  const estado = String(opx.estadoContrato || '').toUpperCase();
  const contrato = String(opx.contrato || '').trim();
  return !contrato || estado.includes('POR FIRMAR') || estado.includes('DEFINIR');
};
export function exposicionPorLinea(acts: ActividadAmbiental[], anio: number): { filas: ExposicionRow[]; totalPorDefinir: number; total: number } {
  const m: Record<string, { base: number; porDefinir: number }> = {};
  let totalPorDefinir = 0, total = 0;
  for (const a of acts) {
    const opx = parseOpex(a.opexDataRaw);
    const monto = montoActividadEnAnio(a, anio);
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

// ---- Heatmap Zona × Línea ----
export interface HeatmapData { zonas: string[]; lineas: string[]; valores: Record<string, Record<string, number>>; max: number; }
export function heatmapZonaLinea(acts: ActividadAmbiental[], anio: number, topLineas = 6): HeatmapData {
  const porLinea = porLineaAnio(acts, anio);
  const lineas = Object.entries(porLinea).sort((a, b) => b[1] - a[1]).slice(0, topLineas).map(([l]) => l);
  const porZona = porZonaAnio(acts, anio);
  const zonas = Object.entries(porZona).sort((a, b) => b[1] - a[1]).map(([z]) => z);
  const valores: Record<string, Record<string, number>> = {};
  let max = 0;
  for (const a of acts) {
    if (!lineas.includes(a.lineaOperativa)) continue;
    const z = a.zona || '—';
    if (!valores[z]) valores[z] = {};
    valores[z][a.lineaOperativa] = (valores[z][a.lineaOperativa] ?? 0) + montoActividadEnAnio(a, anio);
    if (valores[z][a.lineaOperativa] > max) max = valores[z][a.lineaOperativa];
  }
  return { zonas, lineas, valores, max };
}

// ---- Formato ----
// Formato en miles de millones (MM) de COP. Ej: $30.0 MM.
export function fmtB(v: number): string {
  const mm = v / 1_000_000_000;
  if (Math.abs(mm) >= 1) return `$${mm.toFixed(1)} MM`;
  const m = v / 1_000_000;
  return `$${m.toFixed(0)} M`;
}
export function fmtPct(v: number | null): string {
  if (v === null) return '—';
  return `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}%`;
}
export const fmtCOP = (v: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);
