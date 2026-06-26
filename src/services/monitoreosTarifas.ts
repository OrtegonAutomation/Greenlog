// ============================================================
// monitoreosTarifas — lógica compartida de aplicación de tarifas de
// parámetros de Monitoreos. La usan:
//  - MonitoreosMatrizService.loadData (overlay sobre el catálogo)
//  - PlaneacionWizard (cálculo del precio por matriz)
//  - la propagación a planeaciones guardadas (recompute del opex)
// ============================================================

import { MonitoreoRow } from './MonitoreosMatrizService';
import { categoriaDeMatriz, normParametro } from '../data/tarifasParametros2026';

/** Clave estable de un parámetro (idéntica a la del wizard). */
export const paramKeyOf = (r: MonitoreoRow): string => [
  r.zona, r.estacion, r.parametro, r.matriz, r.norma,
  r.permiso, r.receptor, r.requerimiento, r.item ?? '', r.sistema ?? '',
].join('|');

const claveTarifaRow = (r: MonitoreoRow) =>
  `${categoriaDeMatriz(r.matriz)}|${normParametro(r.parametro)}`;

/**
 * Devuelve una copia de la fila con la tarifa nueva aplicada:
 * si hay tarifa para (categoria, parámetro), fija chemilab = tarifa y
 * limpia preciosMensuales (la tarifa nueva es plana). Si no hay match,
 * la fila queda igual (conserva su precio actual).
 */
export function aplicarTarifaARow(r: MonitoreoRow, map: Map<string, number>): MonitoreoRow {
  const t = map.get(claveTarifaRow(r));
  if (t == null) return r;
  return { ...r, chemilab: t, preciosMensuales: undefined };
}

export function aplicarTarifasARows(rows: MonitoreoRow[], map: Map<string, number>): MonitoreoRow[] {
  return rows.map(r => aplicarTarifaARow(r, map));
}

type MapNum = Map<string, number>;
type MapStr = Map<string, string>;

/**
 * Precio de una matriz para un mes = Σ(precio_param × compuestos × puntos).
 * Asume que las filas ya traen el chemilab vigente (overlay aplicado).
 */
export function precioMatriz(
  rows: MonitoreoRow[],
  mesIndex: number,
  paramTipoMuestra: MapStr,
  paramCantCompuestos: MapNum,
  paramPuntos: MapNum,
): number {
  return rows.reduce((s, r) => {
    const key = paramKeyOf(r);
    const precioParam = r.preciosMensuales?.[mesIndex] ?? r.chemilab;
    const compuestos = paramTipoMuestra.get(key) === 'compuesto'
      ? (paramCantCompuestos.get(key) || 1) : 1;
    const puntos = paramPuntos.get(key) ?? (r.puntos || 1);
    return s + precioParam * compuestos * puntos;
  }, 0);
}

const MATRIZ_PREFIX = 'MATRIZ|';

interface OpexParam { key: string; precio: number; cantidad: number; frecuencia: number; total: number; [k: string]: unknown; }
interface OpexMes { preciosIndividuales: OpexParam[]; precio: number; total: number; [k: string]: unknown; }
interface OpexParsed {
  programacion?: OpexMes[];
  parametrosSeleccionados?: MonitoreoRow[];
  paramTipoMuestra?: Record<string, string>;
  paramCantCompuestos?: Record<string, number>;
  paramPuntos?: Record<string, number>;
  valorTotal?: number;
  [k: string]: unknown;
}

/**
 * Recalcula una planeación de monitoreos con las tarifas nuevas, SIN re-consultar
 * el catálogo (usa los datos inline del opex). Solo cambia el precio unitario de las
 * entradas MATRIZ|; preserva cantidades, compuestos, puntos y factores (IVA/IPC)
 * escalando el total proporcionalmente al cambio de precio.
 *
 * Devuelve null si la planeación no es de monitoreos o no hay nada que recalcular.
 */
export function recomputeOpexConTarifas(
  opex: OpexParsed,
  map: Map<string, number>,
): { opex: OpexParsed; valorTotal: number } | null {
  const rows = opex.parametrosSeleccionados;
  const programacion = opex.programacion;
  if (!Array.isArray(rows) || rows.length === 0 || !Array.isArray(programacion)) return null;
  // ¿Hay alguna entrada MATRIZ|? (si no, no es planeación de monitoreos editable por tarifa)
  const tieneMatriz = programacion.some(m => m.preciosIndividuales?.some(p => p.key?.startsWith(MATRIZ_PREFIX)));
  if (!tieneMatriz) return null;

  const overlaid = aplicarTarifasARows(rows, map);
  const porMatriz = new Map<string, MonitoreoRow[]>();
  for (const r of overlaid) {
    const arr = porMatriz.get(r.matriz) || [];
    arr.push(r);
    porMatriz.set(r.matriz, arr);
  }
  const tipoMuestra = new Map(Object.entries(opex.paramTipoMuestra ?? {}));
  const cantCompuestos = new Map(Object.entries(opex.paramCantCompuestos ?? {}).map(([k, v]) => [k, Number(v)]));
  const puntos = new Map(Object.entries(opex.paramPuntos ?? {}).map(([k, v]) => [k, Number(v)]));

  let valorTotal = 0;
  let cambiado = false;
  const nuevaProg = programacion.map((mes, i) => {
    const lista = mes.preciosIndividuales.map(p => {
      if (!p.key?.startsWith(MATRIZ_PREFIX)) return p;
      const matriz = p.key.slice(MATRIZ_PREFIX.length);
      const grupo = porMatriz.get(matriz);
      if (!grupo) return p;
      const nuevoPrecio = precioMatriz(grupo, i, tipoMuestra, cantCompuestos, puntos);
      if (nuevoPrecio === p.precio) return p;
      cambiado = true;
      // Escalar el total preservando cantidad/frecuencia/factor (IVA/IPC).
      const nuevoTotal = p.precio > 0
        ? p.total * (nuevoPrecio / p.precio)
        : nuevoPrecio * (p.cantidad || 0) * (p.frecuencia || 1);
      return { ...p, precio: nuevoPrecio, total: nuevoTotal };
    });
    const precioMes = lista.reduce((s, p) => s + p.precio, 0);
    const totalMes = lista.reduce((s, p) => s + p.total, 0);
    valorTotal += totalMes;
    return { ...mes, preciosIndividuales: lista, precio: precioMes, total: totalMes };
  });

  if (!cambiado) return null;
  return {
    opex: { ...opex, programacion: nuevaProg, parametrosSeleccionados: overlaid, valorTotal },
    valorTotal,
  };
}
