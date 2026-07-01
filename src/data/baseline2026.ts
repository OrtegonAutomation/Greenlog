// ============================================================
// Línea base presupuestal 2026 (OPEX ambiental) — matriz Zona × Línea.
// Fuente: 'Analisis 2027.xlsx' hoja 'Plantilla Opex 2026'. Total ≈ $17.43B.
// El 2026 no existe en la app; se usa como base de comparación vs 2027 (vivo).
// ============================================================

export interface Baseline2026Cell { zona: string; linea: string; valor: number; }

export const BASELINE_2026: Baseline2026Cell[] = [
  { zona: 'CLC', linea: 'Servicios E', valor: 327913954 },
  { zona: 'CLC', linea: 'ICAs', valor: 96796177 },
  { zona: 'CLC', linea: 'Monitoreos', valor: 821559992 },
  { zona: 'CLC', linea: 'Residuos peligrosos', valor: 69867513 },
  { zona: 'CLC', linea: 'Pagos', valor: 386493647 },
  { zona: 'CLC', linea: 'Hojas de Ruta Sostenibilidad', valor: 34147230 },
  { zona: 'Centro', linea: 'Servicios E', valor: 297800499 },
  { zona: 'Centro', linea: 'Estudios Ambientales', valor: 73925250 },
  { zona: 'Centro', linea: 'ICAs', valor: 301776304 },
  { zona: 'Centro', linea: 'Monitoreos', valor: 579752170 },
  { zona: 'Centro', linea: 'Residuos peligrosos', valor: 97763663 },
  { zona: 'Centro', linea: 'Pagos', valor: 494587848 },
  { zona: 'Centro', linea: 'Hojas de Ruta Sostenibilidad', valor: 73112265 },
  { zona: 'Coveñas', linea: 'Servicios E', valor: 161912383 },
  { zona: 'Coveñas', linea: 'ICAs', valor: 199286242 },
  { zona: 'Coveñas', linea: 'Monitoreos', valor: 377161970 },
  { zona: 'Coveñas', linea: 'Residuos peligrosos', valor: 17791435 },
  { zona: 'Coveñas', linea: 'Pagos', valor: 789232098 },
  { zona: 'Coveñas', linea: 'Hojas de Ruta Sostenibilidad', valor: 9369667 },
  { zona: 'Llanos', linea: 'Servicios E', valor: 322601477 },
  { zona: 'Llanos', linea: 'ICAs', valor: 398572482 },
  { zona: 'Llanos', linea: 'Monitoreos', valor: 1686260970 },
  { zona: 'Llanos', linea: 'Residuos peligrosos', valor: 66800291 },
  { zona: 'Llanos', linea: 'Pagos', valor: 561578123 },
  { zona: 'Llanos', linea: 'Hojas de Ruta Sostenibilidad', valor: 42684039 },
  { zona: 'Norte', linea: 'Servicios E', valor: 161912383 },
  { zona: 'Norte', linea: 'ICAs', valor: 216367917 },
  { zona: 'Norte', linea: 'Monitoreos', valor: 437293220 },
  { zona: 'Norte', linea: 'Residuos peligrosos', valor: 39237373 },
  { zona: 'Norte', linea: 'Pagos', valor: 380561832 },
  { zona: 'Norte', linea: 'Hojas de Ruta Sostenibilidad', valor: 64575455 },
  { zona: 'Occidente', linea: 'Servicios E', valor: 490425190 },
  { zona: 'Occidente', linea: 'Estudios Ambientales', valor: 22233960 },
  { zona: 'Occidente', linea: 'ICAs', valor: 284694630 },
  { zona: 'Occidente', linea: 'Monitoreos', valor: 1975209610 },
  { zona: 'Occidente', linea: 'Residuos peligrosos', valor: 156629837 },
  { zona: 'Occidente', linea: 'Pagos', valor: 950882038 },
  { zona: 'Occidente', linea: 'Hojas de Ruta Sostenibilidad', valor: 102441692 },
  { zona: 'Oriente', linea: 'Servicios E', valor: 314457684 },
  { zona: 'Oriente', linea: 'ICAs', valor: 267612955 },
  { zona: 'Oriente', linea: 'Monitoreos', valor: 1030967920 },
  { zona: 'Oriente', linea: 'Residuos peligrosos', valor: 73616005 },
  { zona: 'Oriente', linea: 'Pagos', valor: 451253210 },
  { zona: 'Oriente', linea: 'Hojas de Ruta Sostenibilidad', valor: 188538777 },
  { zona: 'Transversal', linea: 'Servicios E', valor: 789975483 },
  { zona: 'Transversal', linea: 'Herramienta Digital', valor: 642980578 },
  { zona: 'Transversal', linea: 'Compensaciones estaciones', valor: 100000000 },
  { zona: 'Transversal', linea: 'Hojas de Ruta Sostenibilidad', valor: 3328087 },
];

export const TOTAL_2026 = BASELINE_2026.reduce((s, c) => s + c.valor, 0);

/** Total 2026 por zona. */
export function baseline2026PorZona(): Record<string, number> {
  const m: Record<string, number> = {};
  for (const c of BASELINE_2026) m[c.zona] = (m[c.zona] ?? 0) + c.valor;
  return m;
}

/** Total 2026 por línea operativa. */
export function baseline2026PorLinea(): Record<string, number> {
  const m: Record<string, number> = {};
  for (const c of BASELINE_2026) m[c.linea] = (m[c.linea] ?? 0) + c.valor;
  return m;
}
