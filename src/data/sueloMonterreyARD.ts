import type { MonitoreoRow } from '../services/MonitoreosMatrizService';

// ============================================================
// Parámetros de Suelo (Vertimiento ARD) — Llanos / Descargadero Monterrey.
// Solo los que faltaban respecto a los ya existentes en la estación.
// Puntos 4, Compuesto 1 (según archivo de cambios). chemilab = base 2026,
// preciosMensuales: 4=Mayo(base) 9=Octubre(valor 2027).
// ============================================================
const PARAMS: Array<[string, number, number]> = [
  ['AMONIFICANTES (OXIDANTES DE AMONIO Y OXIDANTES DE NITRITO)', 120000, 126120],
  ['BACTERIAS Y ACTINOMICETOS', 50000, 52550],
  ['CALCIO INTERCAMBIABLE', 30589, 32149],
  ['CAPACIDAD DE INTERCAMBIO CATIÓNICO', 16000, 16816],
  ['CELULOLÍTICOS AEROBIOS', 95000, 99845],
  ['CIANUROS TOTALES', 32199, 33841],
  ['COLIFORMES FECALES', 25000, 26275],
  ['CONDUCTIVIDAD', 1019, 1071],
  ['CONSISTENCIA', 53664, 56401],
  ['E COLI', 28000, 29428],
  ['ESTRUCTURA SUELO', 60000, 63060],
  ['FIJADORES DE NITRÓGENO Y DESNITRIFICANTES', 95000, 99845],
  ['HONGOS AEROBIOS', 132860, 139636],
  ['MACRO Y MICRO POROSIDAD', 118000, 124018],
  ['MAGNESIO INTERCAMBIABLE', 15200, 15975],
  ['NITRIFICANTES', 82000, 86182],
  ['NITRÓGENO POTENCIALMENTE MINERALIZABLE', 40950, 43038],
  ['POTASIO INTERCAMBIABLE', 15200, 15975],
  ['POTENCIAL DE ÓXIDO REDUCCIÓN,', 8000, 8408],
  ['PRUEBA DE INFILTRACIÓN', 112158, 117878],
  ['RELACION DE ABSOCIÓN DE SODIO (RAS)', 42931, 45120],
  ['RETENCIÓN DE HUMEDAD', 14000, 14714],
  ['SODIO INTERCAMBIABLE', 29161, 30648],
];

export const SUELO_MONTERREY_ARD_ROWS: MonitoreoRow[] = PARAMS.map(([parametro, base2026, valor2027]) => ({
  zona: 'Llanos',
  estacion: 'Descargadero Monterrey',
  matriz: 'Suelo',
  permiso: 'Vertimiento ARD',
  receptor: 'Suelo',
  requerimiento: '',
  norma: 'Norma Louisiana',
  parametro,
  item: 'Parámetro',
  sistema: '',
  chemilab: base2026,
  puntos: 4,
  compuesto: 1,
  preciosMensuales: { 4: base2026, 9: valor2027 },
}));
