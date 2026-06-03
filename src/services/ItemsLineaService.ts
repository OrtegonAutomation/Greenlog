// ============================================================
// ItemsLineaService — Ítems de pago por línea operativa
// Estructura análoga a MonitoreosMatrizService pero para
// líneas que no usan la matriz de monitoreos (ICAs, RESPEL, etc.)
// ============================================================

import { LineaOperativa } from '../types';
import { ITEMS_COMPENSACIONES_BQS, EstacionBQS, ESTACIONES_BQS } from '../data/itemsCompensacionesBQS';
import { getItemsIcasPorZona, ITEMS_ICAS } from '../data/itemsIcas';
import { getItemsServiciosEPorZona, ITEMS_SERVICIOS_E, type ServicioEComplejidad } from '../data/itemsServiciosE';

export interface ItemLinea {
  id: string;
  lineaOperativa: LineaOperativa;
  item: string;           // Nombre del ítem de pago
  descripcion: string;
  unidad: string;          // ej: "Global", "Kg", "Visita", "Und"
  precioReferencia: number; // Precio base de referencia
  preciosMensuales?: Record<number, number>; // Override por mes
  tipoIca?: 'consolidacion' | 'elaboracion';
  zonaIca?: string;
  baseServicio?: string;
  ordenInterna?: string;
  cuentaContable?: string;
  servicioEZona?: string;
  servicioEBase?: string;
  servicioEComplejidad?: ServicioEComplejidad;
  requiereComplejidad?: boolean;
}

/** Ítems de logística — aplican a todas las líneas (especialmente monitoreos) */
export const ITEMS_LOGISTICA: ItemLinea[] = [
  { id: 'LOG-001', lineaOperativa: 'Monitoreos', item: 'Personal en campo',     descripcion: 'Personal técnico para toma de muestras', unidad: 'Día', precioReferencia: 350_000 },
  { id: 'LOG-002', lineaOperativa: 'Monitoreos', item: 'Transporte en la zona', descripcion: 'Transporte interno dentro de la zona',       unidad: 'Día', precioReferencia: 280_000 },
  { id: 'LOG-003', lineaOperativa: 'Monitoreos', item: 'Transporte local',      descripcion: 'Transporte local punto a punto',             unidad: 'Día', precioReferencia: 150_000 },
];

/** Base de ítems por línea operativa (mock data — pendiente actualización del equipo) */
const ITEMS_DB: ItemLinea[] = [
  // ── RESPEL ────────────────────────────────────────────────
  { id: 'RESP-001', lineaOperativa: 'Residuos peligrosos', item: 'Recolección RESPEL',            descripcion: 'Recolección de residuos peligrosos en estación',        unidad: 'Kg',      precioReferencia: 4_500 },
  { id: 'RESP-002', lineaOperativa: 'Residuos peligrosos', item: 'Transporte RESPEL',             descripcion: 'Transporte de RESPEL a sitio de disposición',           unidad: 'Viaje',   precioReferencia: 1_800_000 },
  { id: 'RESP-003', lineaOperativa: 'Residuos peligrosos', item: 'Disposición final RESPEL',      descripcion: 'Disposición final en celda de seguridad',               unidad: 'Kg',      precioReferencia: 6_200 },
  { id: 'RESP-004', lineaOperativa: 'Residuos peligrosos', item: 'Certificado disposición',       descripcion: 'Certificado de disposición final por gestor autorizado', unidad: 'Und',     precioReferencia: 350_000 },
  { id: 'RESP-005', lineaOperativa: 'Residuos peligrosos', item: 'Contenedores RESPEL',           descripcion: 'Suministro de contenedores para residuos peligrosos',   unidad: 'Und',     precioReferencia: 450_000 },
  { id: 'RESP-006', lineaOperativa: 'Residuos peligrosos', item: 'Capacitación manejo RESPEL',    descripcion: 'Capacitación en manejo de residuos peligrosos',         unidad: 'Sesión',  precioReferencia: 1_200_000 },
  { id: 'RESP-007', lineaOperativa: 'Residuos peligrosos', item: 'Etiquetado y rotulación',       descripcion: 'Etiquetado según normativa NTC',                       unidad: 'Global',  precioReferencia: 280_000 },
  { id: 'RESP-008', lineaOperativa: 'Residuos peligrosos', item: 'Plan de contingencia RESPEL',   descripcion: 'Actualización plan de contingencia',                   unidad: 'Und',     precioReferencia: 2_000_000 },
  { id: 'RESP-009', lineaOperativa: 'Residuos peligrosos', item: 'Registro IDEAM',                descripcion: 'Registro ante IDEAM como generador',                   unidad: 'Und',     precioReferencia: 500_000 },
  { id: 'RESP-010', lineaOperativa: 'Residuos peligrosos', item: 'Auditoría gestor RESPEL',       descripcion: 'Auditoría al gestor autorizado',                       unidad: 'Visita',  precioReferencia: 1_500_000 },

  // ── Compensaciones estaciones ────────────────────────────
  { id: 'COMPEST-001', lineaOperativa: 'Compensaciones estaciones', item: 'Compensación forestal',        descripcion: 'Compensación forestal por estación',               unidad: 'Ha',      precioReferencia: 12_000_000 },
  { id: 'COMPEST-002', lineaOperativa: 'Compensaciones estaciones', item: 'Restauración ecológica',       descripcion: 'Restauración ecológica en área de influencia',     unidad: 'Ha',      precioReferencia: 15_000_000 },
  { id: 'COMPEST-003', lineaOperativa: 'Compensaciones estaciones', item: 'Informe de mantenimiento',     descripcion: 'Informe periódico de mantenimiento',               unidad: 'Informe', precioReferencia: 2_200_000 },

  // ── Estudios Ambientales ──────────────────────────────────
  { id: 'EST-001', lineaOperativa: 'Estudios Ambientales', item: 'Estudio de impacto ambiental',   descripcion: 'EIA para nuevos proyectos',                       unidad: 'Global',  precioReferencia: 45_000_000 },
  { id: 'EST-002', lineaOperativa: 'Estudios Ambientales', item: 'Diagnóstico ambiental',          descripcion: 'Diagnóstico ambiental de alternativas',           unidad: 'Global',  precioReferencia: 25_000_000 },
  { id: 'EST-003', lineaOperativa: 'Estudios Ambientales', item: 'Plan de manejo ambiental',       descripcion: 'Elaboración/actualización PMA',                   unidad: 'Global',  precioReferencia: 18_000_000 },

  // ── Hojas de Ruta ─────────────────────────────────────────
  { id: 'HR-001', lineaOperativa: 'Hojas de Ruta Sostenibilidad Ambiental', item: 'Taller sostenibilidad',      descripcion: 'Taller de sostenibilidad con comunidades',        unidad: 'Evento',  precioReferencia: 5_000_000 },
  { id: 'HR-002', lineaOperativa: 'Hojas de Ruta Sostenibilidad Ambiental', item: 'Informe hoja de ruta',       descripcion: 'Informe de avance hoja de ruta',                  unidad: 'Informe', precioReferencia: 3_500_000 },
  { id: 'HR-003', lineaOperativa: 'Hojas de Ruta Sostenibilidad Ambiental', item: 'Consultoría ESG',            descripcion: 'Consultoría en criterios ESG',                    unidad: 'Mes',     precioReferencia: 8_000_000 },

  // ── Pagos Autoridades ─────────────────────────────────────
  { id: 'PAG-001', lineaOperativa: 'Pagos', item: 'Tasa retributiva',        descripcion: 'Pago tasa retributiva a autoridad ambiental',      unidad: 'Pago',    precioReferencia: 12_000_000 },
  { id: 'PAG-002', lineaOperativa: 'Pagos', item: 'Tasa uso agua',           descripcion: 'Pago tasa uso de agua',                            unidad: 'Pago',    precioReferencia: 8_500_000 },
  { id: 'PAG-003', lineaOperativa: 'Pagos', item: 'Publicación ambiental',   descripcion: 'Publicación en diario oficial',                    unidad: 'Und',     precioReferencia: 1_800_000 },
  { id: 'PAG-004', lineaOperativa: 'Pagos', item: 'Evaluación ambiental',    descripcion: 'Pago por evaluación de licencia',                  unidad: 'Pago',    precioReferencia: 5_200_000 },

  // ── Herramienta Digital ───────────────────────────────────
  { id: 'HD-001', lineaOperativa: 'Herramienta Digital', item: 'Licencia herramienta',    descripcion: 'Licenciamiento herramienta de cumplimiento',       unidad: 'Año',     precioReferencia: 15_000_000 },
  { id: 'HD-002', lineaOperativa: 'Herramienta Digital', item: 'Soporte técnico',         descripcion: 'Soporte técnico herramienta digital',              unidad: 'Mes',     precioReferencia: 4_000_000 },
  { id: 'HD-003', lineaOperativa: 'Herramienta Digital', item: 'Desarrollo personalizado', descripcion: 'Desarrollos a medida en herramienta',              unidad: 'Sprint',  precioReferencia: 12_000_000 },

  // ── Servicios Generales ───────────────────────────────────
  { id: 'SG-001', lineaOperativa: 'Servicios Generales', item: 'Servicio consultoría ambiental',  descripcion: 'Consultoría ambiental general',      unidad: 'Mes',     precioReferencia: 6_000_000 },
  { id: 'SG-002', lineaOperativa: 'Servicios Generales', item: 'Capacitación ambiental',          descripcion: 'Capacitación en temas ambientales',  unidad: 'Sesión',  precioReferencia: 2_500_000 },
  { id: 'SG-003', lineaOperativa: 'Servicios Generales', item: 'Gestión documental ambiental',    descripcion: 'Gestión de documentos ambientales',  unidad: 'Mes',     precioReferencia: 3_800_000 },
];


/** Líneas que usan el catálogo BQS con tarifas por estación */
const LINEAS_BQS: LineaOperativa[] = ['Compensaciones estaciones', 'Compensaciones e Inv'];

function isEstacionBQS(v: string | undefined): v is EstacionBQS {
  return !!v && (ESTACIONES_BQS as string[]).includes(v);
}

export const ItemsLineaService = {
  /**
   * Get all items for a specific línea operativa.
   * Para Compensaciones, si se pasa `estacion`, el `precioReferencia` se toma
   * de la columna correspondiente del consolidado BQS.
   */
  getItems(
    linea: LineaOperativa,
    estacion?: string,
    zona?: string,
    servicioEComplejidad?: ServicioEComplejidad,
  ): ItemLinea[] {
    if (linea === 'ICAs') {
      return getItemsIcasPorZona(zona);
    }

    if (linea === 'Servicios E') {
      return getItemsServiciosEPorZona(zona, servicioEComplejidad);
    }

    if (LINEAS_BQS.includes(linea)) {
      const est = isEstacionBQS(estacion) ? estacion : undefined;
      return ITEMS_COMPENSACIONES_BQS.map(it => ({
        id: it.id,
        lineaOperativa: linea,
        item: `${it.num}. ${it.descripcion}`.slice(0, 160),
        descripcion: it.descripcion,
        unidad: it.unidad,
        precioReferencia: est ? it.preciosPorEstacion[est] : 0,
      }));
    }
    return ITEMS_DB.filter(it => it.lineaOperativa === linea);
  },

  /** Get items de logística (aplican a todas las líneas, especialmente monitoreos) */
  getLogistica(): ItemLinea[] {
    return ITEMS_LOGISTICA;
  },

  /** Get all available líneas that have items configured */
  getLineasConItems(): LineaOperativa[] {
    const lineas = new Set(ITEMS_DB.map(it => it.lineaOperativa));
    if (ITEMS_ICAS.length > 0) lineas.add('ICAs');
    if (ITEMS_SERVICIOS_E.length > 0) lineas.add('Servicios E');
    return [...lineas];
  },

  /** Get a specific item by ID */
  getItemById(id: string): ItemLinea | undefined {
    const hit = ITEMS_DB.find(it => it.id === id)
      ?? ITEMS_LOGISTICA.find(it => it.id === id)
      ?? ITEMS_ICAS.find(it => it.id === id)
      ?? ITEMS_SERVICIOS_E.find(it => it.id === id);
    if (hit) return hit;
    const bqs = ITEMS_COMPENSACIONES_BQS.find(it => it.id === id);
    if (bqs) {
      return {
        id: bqs.id,
        lineaOperativa: 'Compensaciones estaciones',
        item: `${bqs.num}. ${bqs.descripcion}`.slice(0, 160),
        descripcion: bqs.descripcion,
        unidad: bqs.unidad,
        precioReferencia: 0,
      };
    }
    return undefined;
  },

  /** Update price for a specific month (in-memory) */
  updatePrecioMensual(itemId: string, mesIndex: number, newPrice: number): void {
    const item = ITEMS_DB.find(it => it.id === itemId) ?? ITEMS_LOGISTICA.find(it => it.id === itemId);
    if (item) {
      if (!item.preciosMensuales) item.preciosMensuales = {};
      item.preciosMensuales[mesIndex] = newPrice;
    }
  },

  /** Get effective price for an item in a given month */
  getPrecioEfectivo(item: ItemLinea, mesIndex: number): number {
    return item.preciosMensuales?.[mesIndex] ?? item.precioReferencia;
  },
};
