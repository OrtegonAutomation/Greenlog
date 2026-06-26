// ============================================================
// TarifasParametrosService — catálogo persistente de tarifas de
// parámetros de Monitoreos. Clave: (categoria, parametro_norm).
// Fuente: tabla greenlog_tarifas_parametros (supabase) o, en mock,
// el bundle TARIFAS_PARAMETROS_2026 generado del Excel.
// ============================================================

import { getSupabaseClient, isSupabaseEnabled } from './supabaseClient';
import {
  TARIFAS_PARAMETROS_2026,
  CategoriaTarifa,
  normParametro,
} from '../data/tarifasParametros2026';

const TABLE = 'greenlog_tarifas_parametros';

type TarifaRow = {
  categoria: string;
  parametro_norm: string;
  parametro: string;
  precio: number | null;
};

const claveDeRow = (categoria: string, parametroNorm: string) => `${categoria}|${parametroNorm}`;

let _cache: Map<string, number> | null = null;

/** Map a partir del bundle del Excel (fallback / mock). */
function mapDesdeBundle(): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of TARIFAS_PARAMETROS_2026) {
    m.set(claveDeRow(t.categoria, t.parametroNorm), t.precio);
  }
  return m;
}

export const TarifasParametrosService = {
  /** Map `${categoria}|${parametroNorm}` -> precio. Cacheado. */
  async getTarifaMap(): Promise<Map<string, number>> {
    if (_cache) return _cache;
    if (!isSupabaseEnabled()) {
      _cache = mapDesdeBundle();
      return _cache;
    }
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from(TABLE).select('categoria, parametro_norm, precio');
      if (error) throw error;
      const rows = (data ?? []) as TarifaRow[];
      // Si la tabla aún no está sembrada, usar el bundle como base.
      const base = mapDesdeBundle();
      for (const r of rows) {
        if (r.precio != null) base.set(claveDeRow(r.categoria, r.parametro_norm), Number(r.precio));
      }
      _cache = base;
    } catch {
      // Falla suave (tabla inexistente / sin permiso): usar el bundle.
      _cache = mapDesdeBundle();
    }
    return _cache;
  },

  /** Invalida el cache para forzar recarga. */
  invalidate() {
    _cache = null;
  },

  /** Upsert de una tarifa (admin/planeador, solo supabase). Actualiza también el cache. */
  async upsertTarifa(categoria: CategoriaTarifa, parametro: string, precio: number): Promise<boolean> {
    const parametroNorm = normParametro(parametro);
    if (_cache) _cache.set(claveDeRow(categoria, parametroNorm), precio);
    if (!isSupabaseEnabled()) return false;
    const supabase = getSupabaseClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const email = sessionData.session?.user.email?.toLowerCase() ?? null;
    const { error } = await supabase
      .from(TABLE)
      .upsert(
        { categoria, parametro_norm: parametroNorm, parametro, precio, actualizado_por_email: email },
        { onConflict: 'categoria,parametro_norm' },
      );
    if (error) throw error;
    return true;
  },

  /** Siembra masiva de la tabla con las tarifas del Excel (idempotente). */
  async seedDesdeExcel(): Promise<number> {
    if (!isSupabaseEnabled()) return 0;
    const supabase = getSupabaseClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const email = sessionData.session?.user.email?.toLowerCase() ?? null;
    const rows = TARIFAS_PARAMETROS_2026.map(t => ({
      categoria: t.categoria,
      parametro_norm: t.parametroNorm,
      parametro: t.parametro,
      precio: t.precio,
      actualizado_por_email: email,
    }));
    // Upsert en lotes para no exceder límites.
    const CHUNK = 200;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const { error } = await supabase
        .from(TABLE)
        .upsert(rows.slice(i, i + CHUNK), { onConflict: 'categoria,parametro_norm' });
      if (error) throw error;
    }
    this.invalidate();
    return rows.length;
  },
};
