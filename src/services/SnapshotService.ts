// ============================================================
// SnapshotService — snapshots anuales de planeación ("Bloquear año").
// Tabla greenlog_snapshot_anual: agregado Zona×Línea de lo planeado
// tipo "Plan" de un año, congelado desde Administración. Reportes lo usa
// como base de comparación; si un año no está congelado se usa el agregado
// vivo (baseVivaAnio) y para 2026 la matriz estática.
// ============================================================
import { useEffect, useMemo, useState } from 'react';
import { getSupabaseClient, isSupabaseEnabled } from './supabaseClient';
import { ActividadAmbiental } from '../types';
import { BASELINE_2026, Baseline2026Cell } from '../data/baseline2026';
import { baseVivaAnio } from '../utils/reportesAggregations';

const ANIO_BASELINE_ESTATICA = 2026;

export interface SnapshotAnual {
  anio: number;
  celdas: Baseline2026Cell[];
  total: number;
  nActividades: number;
  creadoPor?: string;
  creadoEn?: string;
}

const rowToSnapshot = (row: any): SnapshotAnual => ({
  anio: row.anio,
  celdas: Array.isArray(row.celdas) ? row.celdas : [],
  total: Number(row.total) || 0,
  nActividades: row.n_actividades ?? 0,
  creadoPor: row.creado_por ?? undefined,
  creadoEn: row.creado_en ?? undefined,
});

export const SnapshotService = {
  async getSnapshot(anio: number): Promise<SnapshotAnual | null> {
    if (!isSupabaseEnabled()) return null;
    const { data, error } = await getSupabaseClient()
      .from('greenlog_snapshot_anual')
      .select('*')
      .eq('anio', anio)
      .maybeSingle();
    if (error || !data) return null;
    return rowToSnapshot(data);
  },

  async listAniosCongelados(): Promise<number[]> {
    if (!isSupabaseEnabled()) return [];
    const { data, error } = await getSupabaseClient()
      .from('greenlog_snapshot_anual')
      .select('anio')
      .order('anio');
    if (error || !data) return [];
    return data.map((r: any) => r.anio);
  },

  /** Solo admins (la policy RLS lo exige). Reemplaza el snapshot si ya existe. */
  async congelarAnio(anio: number, celdas: Baseline2026Cell[], total: number, nActividades: number, email?: string): Promise<void> {
    const { error } = await getSupabaseClient()
      .from('greenlog_snapshot_anual')
      .upsert({
        anio,
        celdas,
        total,
        n_actividades: nActividades,
        creado_por: email ?? null,
        creado_en: new Date().toISOString(),
      }, { onConflict: 'anio' });
    if (error) throw new Error(error.message);
  },

  /** Solo admins. */
  async descongelarAnio(anio: number): Promise<void> {
    const { error } = await getSupabaseClient()
      .from('greenlog_snapshot_anual')
      .delete()
      .eq('anio', anio);
    if (error) throw new Error(error.message);
  },
};

export type OrigenBase = 'estatica' | 'snapshot' | 'viva';

/**
 * Base de comparación para un año:
 * - 2026 → matriz estática (BASELINE_2026).
 * - Otro año → snapshot congelado si existe; si no, agregado vivo solo tipo Plan.
 */
export function useBaseComparacion(actividades: ActividadAmbiental[], anioBase: number): {
  celdas: Baseline2026Cell[];
  total: number;
  origen: OrigenBase;
  cargando: boolean;
} {
  const [snapshot, setSnapshot] = useState<SnapshotAnual | null>(null);
  const [cargando, setCargando] = useState(anioBase !== ANIO_BASELINE_ESTATICA);

  useEffect(() => {
    if (anioBase === ANIO_BASELINE_ESTATICA) { setSnapshot(null); setCargando(false); return; }
    let vigente = true;
    setCargando(true);
    void SnapshotService.getSnapshot(anioBase).then(s => {
      if (!vigente) return;
      setSnapshot(s);
      setCargando(false);
    });
    return () => { vigente = false; };
  }, [anioBase]);

  return useMemo(() => {
    if (anioBase === ANIO_BASELINE_ESTATICA) {
      const total = BASELINE_2026.reduce((s, c) => s + c.valor, 0);
      return { celdas: BASELINE_2026, total, origen: 'estatica' as OrigenBase, cargando: false };
    }
    if (snapshot && snapshot.anio === anioBase) {
      return { celdas: snapshot.celdas, total: snapshot.total, origen: 'snapshot' as OrigenBase, cargando };
    }
    const celdas = baseVivaAnio(actividades, anioBase);
    const total = celdas.reduce((s, c) => s + c.valor, 0);
    return { celdas, total, origen: 'viva' as OrigenBase, cargando };
  }, [actividades, anioBase, snapshot, cargando]);
}
