// ============================================================
// MonitoreosMatrizService — Datos de matriz de monitoreos 2026
// Carga lazy el JSON extraído del Excel original
// ============================================================

export interface MonitoreoRow {
  zona: string;
  estacion: string;
  matriz: string;
  permiso: string;
  receptor: string;
  requerimiento: string;
  norma: string;
  parametro: string;
  chemilab: number; // Base reference price
  preciosMensuales?: Record<number, number>; // MonthIndex -> Overridden Price
  puntos: number;
  compuesto: number;
}

interface MonitoreosData {
  estacionesPorZona: Record<string, string[]>;
  matrizData: MonitoreoRow[];
}

let _cache: MonitoreosData | null = null;

async function loadData(): Promise<MonitoreosData> {
  if (_cache) return _cache;
  const mod = await import('./monitoreos_data.json');
  _cache = mod.default as unknown as MonitoreosData;
  return _cache;
}

export const MonitoreosMatrizService = {
  /** Get all zone names */
  async getZonas(): Promise<string[]> {
    const d = await loadData();
    return Object.keys(d.estacionesPorZona).sort();
  },

  /** Get stations for a given zone */
  async getEstaciones(zona: string): Promise<string[]> {
    const d = await loadData();
    return d.estacionesPorZona[zona] || [];
  },

  /** Get all rows for a specific zone+station */
  async getRows(zona: string, estacion: string): Promise<MonitoreoRow[]> {
    const d = await loadData();
    return d.matrizData.filter(r => r.zona === zona && r.estacion === estacion);
  },

  /** Get unique matrices for a zone+station */
  async getMatrices(zona: string, estacion: string): Promise<string[]> {
    const rows = await this.getRows(zona, estacion);
    return [...new Set(rows.map(r => r.matriz))].sort();
  },

  /** Get all rows for a complete zone (all stations) */
  async getRowsByZona(zona: string): Promise<MonitoreoRow[]> {
    const d = await loadData();
    return d.matrizData.filter(r => r.zona === zona);
  },

  /** Get unique matrices for a full zone */
  async getMatricesByZona(zona: string): Promise<string[]> {
    const rows = await this.getRowsByZona(zona);
    return [...new Set(rows.map(r => r.matriz))].sort();
  },

  /** Get filtered params for a given zone+station, or full zone when station is omitted */
  async getParametros(zona: string, estacion?: string, matriz?: string): Promise<MonitoreoRow[]> {
    let rows = estacion ? await this.getRows(zona, estacion) : await this.getRowsByZona(zona);
    if (matriz) rows = rows.filter(r => r.matriz === matriz);
    return rows;
  },

  /** Update the chemilab price of a specific row in memory for a specific month */
  async updateChemilabMensual(zona: string, estacion: string, parametro: string, matriz: string, mesIndex: number, newPrice: number): Promise<void> {
    const d = await loadData();
    for (const row of d.matrizData) {
      if (row.zona === zona && row.estacion === estacion && row.parametro === parametro && row.matriz === matriz) {
        if (!row.preciosMensuales) row.preciosMensuales = {};
        row.preciosMensuales[mesIndex] = newPrice;
      }
    }
  },

  /** Get all data (for advanced filtering) */
  async getAll(): Promise<MonitoreosData> {
    return loadData();
  },
};
