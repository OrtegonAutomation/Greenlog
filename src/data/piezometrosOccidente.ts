import type { MonitoreoRow } from '../services/MonitoreosMatrizService';

// ============================================================
// Parámetros de Piezómetros (Auto 5828 de 2018, ANLA LAM0674).
// Zona Occidente · matriz Agua Subterranea · permiso Piezometros.
// Estaciones: Mariquita, Fresno, Herveo, Manizales, Pereira, Yumbo.
// ============================================================
export const PIEZOMETROS_ESTACIONES = ['Mariquita','Fresno','Herveo','Manizales','Pereira','Yumbo'];

const PARAMS: Array<[string, number]> = [
  ['Bicarbonatos (HCO3-)', 6118],
  ['Calcio (Ca++)', 15200],
  ['Carbonatos', 6118],
  ['Coliformes fecales', 23750],
  ['Coliformes totales', 23750],
  ['Cromo+6 (Cr)', 15200],
  ['Hidrocarburos Aromáticos Policíclicos (HAP)', 120000],
  ['Hierro (Fe)', 15200],
  ['Hierro (Fe++)', 15200],
  ['Magnesio (Mg++)', 15200],
  ['Níquel (Ni)', 15200],
  ['Nitratos (N-NO3)', 12235],
  ['Nitritos (N-NO2)', 12235],
  ['Ortofosfatos (P-PO4)', 12879],
  ['Plomo (Pb)', 15200],
  ['Potasio (K+)', 15200],
  ['Selenio (Se)', 15200],
  ['Sodio (Na+)', 15200],
  ['Sólidos Disueltos Totales (SDT)', 9500],
  ['Sulfatos (SO4)', 12235],
  ['Temperatura', 500],
  ['Vanadio(V)', 15200],
  ['Zinc (Zn)', 15200],
];

export const PIEZOMETROS_ROWS: MonitoreoRow[] = PIEZOMETROS_ESTACIONES.flatMap(estacion =>
  PARAMS.map(([parametro, vr]) => ({
    zona: 'Occidente',
    estacion,
    matriz: 'Agua Subterranea',
    permiso: 'Piezometros',
    receptor: 'Agua Subterranea',
    requerimiento: 'Auto 5828 de 2018',
    norma: 'Auto 5828 de 2018 (ANLA LAM0674)',
    parametro,
    item: 'Parámetro',
    sistema: '',
    chemilab: vr,
    puntos: 1,
    compuesto: 1,
  }))
);
