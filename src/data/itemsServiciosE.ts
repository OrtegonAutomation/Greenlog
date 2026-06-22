import type { ItemLinea } from '../services/ItemsLineaService';

export type ServicioEComplejidad = 'Muy alto' | 'Alto' | 'Moderado';

export const SERVICIO_E_COMPLEJIDADES: ServicioEComplejidad[] = ['Muy alto', 'Alto', 'Moderado'];

// Los precios se mantienen por tramo; solo cambia la etiqueta mostrada
// (antes: Alto / Moderado / Bajo).
const SERVICIO_PRECIOS: Record<ServicioEComplejidad, number> = {
  'Muy alto': 21065640,
  Alto: 17944843,
  Moderado: 12483384,
};

const SERVICIOS_E_ZONAS = ['NORTE', 'CENTRO', 'OCCIDENTE', 'LLANOS', 'ORIENTE', 'CLC', 'TRANSVERSAL'] as const;
type ServicioEZona = typeof SERVICIOS_E_ZONAS[number];

const BOLSA_CONSUMO_BASE: Record<ServicioEZona, number> = {
  NORTE: 2066486.855,
  CENTRO: 170117.935,
  OCCIDENTE: 1341150.715,
  LLANOS: 1857316.4,
  ORIENTE: 1227906.255,
  CLC: 2232708.585,
  TRANSVERSAL: 2232708.585,
};

const GASTOS_VIAJE_BASE: Record<ServicioEZona, number> = {
  NORTE: 277584.85,
  CENTRO: 45518.945,
  OCCIDENTE: 513213.965,
  LLANOS: 367542.005,
  ORIENTE: 325155.175,
  CLC: 424767.005,
  TRANSVERSAL: 424767.005,
};

const GASTOS_REEMBOLSABLES_BASE: Record<ServicioEZona, number> = {
  NORTE: 415946.289,
  CENTRO: 415946.289,
  OCCIDENTE: 415946.289,
  LLANOS: 415946.289,
  ORIENTE: 415946.289,
  CLC: 415946.289,
  TRANSVERSAL: 415946.289,
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function preciosMensuales(precio: number): Record<number, number> {
  return Object.fromEntries(
    Array.from({ length: 12 }, (_, index) => [
      index,
      roundMoney(precio),
    ]),
  );
}

export function normalizeZonaServicioE(zona?: string): ServicioEZona {
  const normalized = (zona || 'TRANSVERSAL')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();

  const aliases: Record<string, ServicioEZona> = {
    'CANO LIMON': 'CLC',
    'CAO LIMON': 'CLC',
    CLC: 'CLC',
    COVENAS: 'TRANSVERSAL',
  };

  const aliased = aliases[normalized] ?? normalized;
  return (SERVICIOS_E_ZONAS as readonly string[]).includes(aliased)
    ? (aliased as ServicioEZona)
    : 'TRANSVERSAL';
}

function itemBase(
  id: string,
  item: string,
  descripcion: string,
  zona: ServicioEZona,
  base: string,
  precioBase2025: number,
): ItemLinea {
  const precios = preciosMensuales(precioBase2025);
  return {
    id,
    lineaOperativa: 'Servicios E',
    item,
    descripcion,
    unidad: 'Mes',
    precioReferencia: precios[0],
    preciosMensuales: precios,
    servicioEZona: zona,
    servicioEBase: base,
  };
}

export function getItemsServiciosEPorZona(
  zona?: string,
): ItemLinea[] {
  const zonaKey = normalizeZonaServicioE(zona);
  const serviciosPorComplejidad = SERVICIO_E_COMPLEJIDADES.map(complejidad => {
    const servicioPrecio = SERVICIO_PRECIOS[complejidad];
    const servicioPrecios = preciosMensuales(servicioPrecio);
    return {
      id: `SERVE-SERVICIO-${complejidad.toUpperCase().replace(/\s+/g, '-')}`,
      lineaOperativa: 'Servicios E' as const,
      item: `Servicio ${complejidad}`,
      descripcion: `Servicio APPLUS - complejidad ${complejidad}`,
      unidad: 'Mes',
      precioReferencia: servicioPrecios[0],
      preciosMensuales: servicioPrecios,
      servicioEZona: zonaKey,
      servicioEBase: 'APPLUS',
      servicioEComplejidad: complejidad,
    };
  });

  return [
    ...serviciosPorComplejidad,
    itemBase(
      'SERVE-BOLSA-CONSUMO',
      'Bolsa de Consumo',
      `Bolsa de Consumo APPLUS - zona ${zonaKey}`,
      zonaKey,
      'APPLUS',
      BOLSA_CONSUMO_BASE[zonaKey],
    ),
    itemBase(
      'SERVE-GASTOS-VIAJE',
      'Gastos de Viaje',
      `Gastos de Viaje APPLUS - zona ${zonaKey}`,
      zonaKey,
      'APPLUS',
      GASTOS_VIAJE_BASE[zonaKey],
    ),
    itemBase(
      'SERVE-GASTOS-REEMBOLSABLES',
      'Gastos Reembolsables',
      `Gastos Reembolsables APPLUS - zona ${zonaKey}`,
      zonaKey,
      'APPLUS',
      GASTOS_REEMBOLSABLES_BASE[zonaKey],
    ),
  ];
}

export const ITEMS_SERVICIOS_E = getItemsServiciosEPorZona('TRANSVERSAL');
