import type { ItemLinea } from '../services/ItemsLineaService';

// Tarifa única de ICAs (todas las zonas, por ahora).
export const TARIFA_ICAS = 49423961;
// Reparto del desglose: Consolidar 70% / Radicación 30%.
export const ICAS_CONSOLIDAR_PCT = 70;

// ICAs maneja un único ítem con su tarifa de referencia. En el paso de
// programación se puede "abrir el desglose" en Consolidar (70%) y Radicación
// (30%); antes de completar la planeación deben volverse a unir en un ítem.
const ITEM_ICAS_UNICO: ItemLinea = {
  id: 'ICAS-UNICO',
  lineaOperativa: 'ICAs',
  item: 'Consolidar y Radicar información para ICAS',
  descripcion: '',
  unidad: 'Global',
  precioReferencia: TARIFA_ICAS,
  cuentaContable: '7407020251',
};

export const ITEMS_ICAS: ItemLinea[] = [ITEM_ICAS_UNICO];

export const getItemsIcasPorZona = (_zona?: string): ItemLinea[] => [ITEM_ICAS_UNICO];
