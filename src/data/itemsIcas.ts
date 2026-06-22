import type { ItemLinea } from '../services/ItemsLineaService';

// ICAs maneja un único ítem. El precio se digita por mes en el wizard
// (la línea funciona como Pagos y Publicaciones), por eso no hay precio
// de referencia ni desglose por estación/zona.
const ITEM_ICAS_UNICO: ItemLinea = {
  id: 'ICAS-UNICO',
  lineaOperativa: 'ICAs',
  item: 'Consolidar, Elaborar y Radicar información para ICAS',
  descripcion: '',
  unidad: 'Global',
  precioReferencia: 0,
  cuentaContable: '7407020251',
};

export const ITEMS_ICAS: ItemLinea[] = [ITEM_ICAS_UNICO];

export const getItemsIcasPorZona = (_zona?: string): ItemLinea[] => [ITEM_ICAS_UNICO];
