import type { ItemLinea } from '../services/ItemsLineaService';

type TipoIca = 'consolidacion' | 'elaboracion';
type IcaRow = [TipoIca, string, string, string, string, string];

const PRECIOS_ICA: Record<TipoIca, number[]> = {
  consolidacion: [
    1692763.90, 1692763.90, 1692763.90, 1692763.90,
    1692763.90, 1692763.90, 1692763.90, 1692763.90,
    1762099.64, 1762099.64, 1762099.64, 1762099.64,
  ],
  elaboracion: [
    36816701.42, 36816701.42, 36816701.42, 36816701.42,
    36816701.42, 36816701.42, 36816701.42, 36816701.42,
    38324716.31, 38324716.31, 38324716.31, 38324716.31,
  ],
};

const ICA_ROWS: IcaRow[] = [
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT BICENTENARIO', 'BICENTENARIO', 'BICENTENARIO', 'CCS085180', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT BICENTENARIO', 'BICENTENARIO', 'BICENTENARIO', 'CCS085180', '7407020251'],
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT Oleoducto Transandino', 'SUR', 'OCCIDENTE', 'CCS080311', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT Oleoducto Transandino', 'SUR', 'OCCIDENTE', 'CCS080311', '7407020251'],
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT OSO-OMO-OCHO', 'SUR', 'OCCIDENTE', 'CCS080312', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT OSO-OMO-OCHO', 'SUR', 'OCCIDENTE', 'CCS080312', '7407020251'],
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT Oleoducto Toldado Gualanday', 'SUR', 'ORIENTE', 'CCS081701', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT Oleoducto Toldado Gualanday', 'SUR', 'ORIENTE', 'CCS081701', '7407020251'],
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT POLIANDINO', 'ANDINA', 'LLANOS', 'CCS081780', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT POLIANDINO', 'ANDINA', 'LLANOS', 'CCS081780', '7407020251'],
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT Poliducto Salgar Bogotá', 'ANDINA', 'ORIENTE', 'CCS082390', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT Poliducto Salgar Bogotá', 'ANDINA', 'ORIENTE', 'CCS082390', '7407020251'],
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT POLIORIENTE', 'ANDINA', 'ORIENTE 70 %', 'CCS082540', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT POLIORIENTE', 'ANDINA', 'ORIENTE 70 %', 'CCS082540', '7407020251'],
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT POLIORIENTE', 'ANDINA', 'CENTRO 30 %', '', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT POLIORIENTE', 'ANDINA', 'CENTRO 30 %', '', '7407020251'],
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT Terminal Pozos Colorados', 'CARIBE', 'NORTE', 'CCS083147', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT Terminal Pozos Colorados', 'CARIBE', 'NORTE', 'CCS083147', '7407020251'],
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT Cartagena Baranoa', 'CARIBE', 'NORTE', 'CCS083230', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT Cartagena Baranoa', 'CARIBE', 'NORTE', 'CCS083230', '7407020251'],
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT PPG', 'CARIBE', 'NORTE 100%', 'CCS083860', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT PPG', 'CARIBE', 'NORTE 100%', 'CCS083860', '7407020251'],
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT Oleoducto Yaguará Tenay', 'SUR', 'ORIENTE', 'CCS084287', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT Oleoducto Yaguará Tenay', 'SUR', 'ORIENTE', 'CCS084287', '7407020251'],
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT Combustoleoducto Ayacucho Coveñas', 'COVEÑAS', 'COVEÑAS', 'CCS087406', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT Combustoleoducto Ayacucho Coveñas', 'COVEÑAS', 'COVEÑAS', 'CCS087406', '7407020251'],
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT Combustoleoducto Galan Ayacucho Coveñas Cartagena', 'COVEÑAS', 'COVEÑAS 70%', 'CCS087406', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT Combustoleoducto Galan Ayacucho Coveñas Cartagena', 'COVEÑAS', 'COVEÑAS70%', 'CCS087406', '7407020251'],
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT Combustoleoducto Galan Ayacucho Coveñas Cartagena', 'COVEÑAS', 'NORTE 30%', '', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT Combustoleoducto Galan Ayacucho Coveñas Cartagena', 'COVEÑAS', 'NORTE 30%', '', '7407020251'],
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT Oleoducto Galan Ayacucho 8', 'COVEÑAS', 'COVEÑAS 50%', 'CCS087406', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT Oleoducto Galan Ayacucho 8', 'COVEÑAS', 'COVEÑAS 50%', 'CCS087406', '7407020251'],
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT Oleoducto Galan Ayacucho 8', 'COVEÑAS', 'NORTE 50%', '', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT Oleoducto Galan Ayacucho 8', 'COVEÑAS', 'NORTE 50%', '', '7407020251'],
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT Terminal Maritimo COVEÑAS', 'COVEÑAS', 'COVEÑAS', 'CCS087406', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT Terminal Maritimo COVEÑAS', 'COVEÑAS', 'COVEÑAS', 'CCS087406', '7407020251'],
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT OLE CAÑO LIMÓN COVEÑAS', 'CAÑO LIMON', 'CAÑO LIMON 70%', 'CCS087407', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT OLE CAÑO LIMÓN', 'CAÑO LIMON', 'CAÑO LIMON 70%', 'CCS087407', '7407020251'],
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT OLE CAÑO LIMÓN COVEÑAS', 'CAÑO LIMON', 'COVEÑAS 30%', '', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT OLE CAÑO LIMÓN', 'CAÑO LIMON', 'COVEÑAS 30%', '', '7407020251'],
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT Oleoducto Apiay Porvenir', 'LLANOS', 'LLANOS', 'CCS087409', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT Oleoducto Apiay Porvenir', 'LLANOS', 'LLANOS', 'CCS087409', '7407020251'],
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT Oleoducto Araguaney Porvenir', 'LLANOS', 'LLANOS', 'CCS087409', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT Oleoducto Araguaney Porvenir', 'LLANOS', 'LLANOS', 'CCS087409', '7407020251'],
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT Oleoducto Castilla Apiay', 'LLANOS', 'LLANOS', 'CCS087409', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT Oleoducto Castilla Apiay', 'LLANOS', 'LLANOS', 'CCS087409', '7407020251'],
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT Oleoducto santiango Porvenir', 'LLANOS', 'LLANOS', 'CCS087409', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT Oleoducto santiango Porvenir', 'LLANOS', 'LLANOS', 'CCS087409', '7407020251'],
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT Oleoducto santiango Porvenir Derivación', 'LLANOS', 'LLANOS', 'CCS087409', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT Oleoducto santiango Porvenir Derivación', 'LLANOS', 'LLANOS', 'CCS087409', '7407020251'],
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT San Fernando', 'LLANOS', 'LLANOS', 'CCS087409', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT San Fernando', 'LLANOS', 'LLANOS', 'CCS087409', '7407020251'],
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT Vasconia', 'VASCONIA', 'CENTRO', 'CCS087410', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT Vasconia', 'VASCONIA', 'CENTRO', 'CCS087410', '7407020251'],
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT Poliducto Galan Salgar 8', 'MAGDALENA MEDIO', 'CENTRO', 'CCS087412', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT Poliducto Galan Salgar 8', 'MAGDALENA MEDIO', 'CENTRO', 'CCS087412', '7407020251'],
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT Poliducto Galan  Salgar 12-16', 'MAGDALENA MEDIO', 'CENTRO', 'CCS087412', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT Poliducto Galan  Salgar 12-16', 'MAGDALENA MEDIO', 'CENTRO', 'CCS087412', '7407020251'],
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT Poliducto Galan Chimita', 'MAGDALENA MEDIO', 'CENTRO', 'CCS087412', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT Poliducto Galan Chimita', 'MAGDALENA MEDIO', 'CENTRO', 'CCS087412', '7407020251'],
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT Poliducto Sebastopol Medellin Cartago', 'MAGDALENA MEDIO', 'OCCIDENTE 100%', 'CCS087412', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT Poliducto Sebastopol Medellin Cartago', 'MAGDALENA MEDIO', 'OCCIDENTE100%', 'CCS087412', '7407020251'],
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT Variante Galan Chimita', 'MAGDALENA MEDIO', 'CENTRO', 'CCS087412', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT Variante Galan Chimita', 'MAGDALENA MEDIO', 'CENTRO', 'CCS087412', '7407020251'],
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT Poliducto Salgar Cartago Yumbo', 'OCCIDENTE', 'OCCIDENTE', 'CCS087413', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT Poliducto Salgar Cartago Yumbo', 'OCCIDENTE', 'OCCIDENTE', 'CCS087413', '7407020251'],
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT Poliduto Yumbo Buenaventura', 'OCCIDENTE', 'OCCIDENTE', 'CCS087413', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT Poliduto Yumbo Buenaventura', 'OCCIDENTE', 'OCCIDENTE', 'CCS087413', '7407020251'],
  ['consolidacion', 'Consolidar información para Informes de Cumplimiento Ambiental - ICA- CENIT Poliducto Salgar Neiva', 'CENTRAL- ORIENTE', 'ORIENTE', 'CCS087284', '7407020251'],
  ['elaboracion', 'Elaborar Informes de Cumplimiento Ambiental - ICA- CENIT Poliducto Salgar Neiva', 'CENTRAL- ORIENTE', 'ORIENTE', 'CCS087284', '7407020251'],
];

const normalizeZona = (value: string): string => {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/Ñ/g, 'N')
    .replace(/[^A-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (normalized === 'CLC') return 'CANO LIMON';
  return normalized;
};

const preciosMensuales = (tipo: TipoIca): Record<number, number> =>
  Object.fromEntries(PRECIOS_ICA[tipo].map((precio, mesIndex) => [mesIndex, precio])) as Record<number, number>;

export const ITEMS_ICAS: ItemLinea[] = ICA_ROWS.map(([tipoIca, item, zonaIca, baseServicio, ordenInterna, cuentaContable], index) => {
  const precios = preciosMensuales(tipoIca);
  return {
    id: `ICAS-${String(index + 1).padStart(3, '0')}`,
    lineaOperativa: 'ICAs',
    item,
    descripcion: `${baseServicio}${ordenInterna ? ` · ${ordenInterna}` : ''}`,
    unidad: 'Global',
    precioReferencia: precios[0],
    preciosMensuales: precios,
    tipoIca,
    zonaIca,
    baseServicio,
    ordenInterna,
    cuentaContable,
  };
});

export const getItemsIcasPorZona = (zona?: string): ItemLinea[] => {
  if (!zona) return ITEMS_ICAS;
  const zonaNormalizada = normalizeZona(zona);
  return ITEMS_ICAS.filter(item => {
    const itemZona = normalizeZona(item.zonaIca ?? '');
    const base = normalizeZona(item.baseServicio ?? '');
    return itemZona.includes(zonaNormalizada)
      || base.includes(zonaNormalizada)
      || zonaNormalizada.includes(itemZona)
      || zonaNormalizada.includes(base);
  });
};
