// ============================================================
// NecesidadesService — catálogo Necesidad (padre) → Subnecesidad (hija).
// Fuente: tabla greenlog_necesidades (supabase) + semilla del bundle.
// Cualquier planeador puede agregar nuevos pares.
// ============================================================

import { getSupabaseClient, isSupabaseEnabled } from './supabaseClient';
import { CatalogoNecesidades, NECESIDADES_DEFAULT } from '../data/necesidades';

const TABLE = 'greenlog_necesidades';

type NecesidadRow = { necesidad: string; subnecesidad: string };

let _cache: CatalogoNecesidades | null = null;

function clonarBundle(): CatalogoNecesidades {
  const out: CatalogoNecesidades = {};
  for (const [k, v] of Object.entries(NECESIDADES_DEFAULT)) out[k] = [...v];
  return out;
}

function agregarPar(cat: CatalogoNecesidades, necesidad: string, subnecesidad: string) {
  const n = (necesidad || '').trim();
  const s = (subnecesidad || '').trim();
  if (!n) return;
  if (!cat[n]) cat[n] = [];
  if (s && !cat[n].includes(s)) cat[n].push(s);
}

export const NecesidadesService = {
  /** Catálogo vigente: bundle base + filas de Supabase. Cacheado. */
  async getCatalogo(): Promise<CatalogoNecesidades> {
    if (_cache) return _cache;
    const cat = clonarBundle();
    if (isSupabaseEnabled()) {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.from(TABLE).select('necesidad, subnecesidad');
        if (error) throw error;
        for (const r of (data ?? []) as NecesidadRow[]) agregarPar(cat, r.necesidad, r.subnecesidad);
      } catch {
        // Falla suave (tabla inexistente / sin permiso): usar solo el bundle.
      }
    }
    // ordenar subnecesidades
    for (const k of Object.keys(cat)) cat[k].sort((a, b) => a.localeCompare(b, 'es'));
    _cache = cat;
    return _cache;
  },

  invalidate() { _cache = null; },

  /** Lista plana de pares (necesidad, subnecesidad) del catálogo vigente. */
  async getPares(): Promise<Array<{ necesidad: string; subnecesidad: string }>> {
    const cat = await this.getCatalogo();
    return Object.entries(cat).flatMap(([necesidad, subs]) =>
      subs.map(subnecesidad => ({ necesidad, subnecesidad })));
  },

  /** Agrega un par (necesidad, subnecesidad) al catálogo. Devuelve true si persistió en supabase. */
  async crearPar(necesidad: string, subnecesidad: string): Promise<boolean> {
    const n = (necesidad || '').trim();
    const s = (subnecesidad || '').trim();
    if (!n || !s) return false;
    if (_cache) agregarPar(_cache, n, s);
    if (!isSupabaseEnabled()) return false;
    try {
      const supabase = getSupabaseClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData.session?.user.email?.toLowerCase() ?? null;
      const { error } = await supabase
        .from(TABLE)
        .upsert({ necesidad: n, subnecesidad: s, creado_por_email: email }, { onConflict: 'necesidad,subnecesidad' });
      if (error) throw error;
      return true;
    } catch {
      return false;
    }
  },

  /** Importa varios pares (plantilla de carga masiva). Devuelve cuántos se procesaron. */
  async importarPares(pares: Array<{ necesidad: string; subnecesidad: string }>): Promise<number> {
    const limpios = pares
      .map(p => ({ necesidad: (p.necesidad || '').trim(), subnecesidad: (p.subnecesidad || '').trim() }))
      .filter(p => p.necesidad && p.subnecesidad);
    if (limpios.length === 0) return 0;
    if (_cache) for (const p of limpios) agregarPar(_cache, p.necesidad, p.subnecesidad);
    if (!isSupabaseEnabled()) return limpios.length;
    const supabase = getSupabaseClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const email = sessionData.session?.user.email?.toLowerCase() ?? null;
    const rows = limpios.map(p => ({ ...p, creado_por_email: email }));
    const { error } = await supabase.from(TABLE).upsert(rows, { onConflict: 'necesidad,subnecesidad' });
    if (error) throw error;
    this.invalidate();
    return limpios.length;
  },

  /** Elimina una subnecesidad (un par). */
  async eliminarSubnecesidad(necesidad: string, subnecesidad: string): Promise<void> {
    if (_cache?.[necesidad]) _cache[necesidad] = _cache[necesidad].filter(s => s !== subnecesidad);
    if (!isSupabaseEnabled()) return;
    const supabase = getSupabaseClient();
    const { error } = await supabase.from(TABLE).delete()
      .eq('necesidad', necesidad).eq('subnecesidad', subnecesidad);
    if (error) throw error;
    this.invalidate();
  },

  /** Elimina una necesidad padre completa (todas sus subnecesidades). */
  async eliminarNecesidad(necesidad: string): Promise<void> {
    if (_cache) delete _cache[necesidad];
    if (!isSupabaseEnabled()) return;
    const supabase = getSupabaseClient();
    const { error } = await supabase.from(TABLE).delete().eq('necesidad', necesidad);
    if (error) throw error;
    this.invalidate();
  },
};
