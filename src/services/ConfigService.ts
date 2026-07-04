// ============================================================
// ConfigService — flags de configuración en greenlog_config.
// El principal: presupuesto_congelado (matriz financiera enviada).
// Con Supabase deshabilitado (mock) usa la constante local.
// ============================================================
import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient, isSupabaseEnabled } from './supabaseClient';
import { MATRIZ_FINANCIERA_ENVIADA } from '../config/presupuesto';

const CLAVE_CONGELADO = 'presupuesto_congelado';

export const ConfigService = {
  async getPresupuestoCongelado(): Promise<boolean> {
    if (!isSupabaseEnabled()) return MATRIZ_FINANCIERA_ENVIADA;
    const { data, error } = await getSupabaseClient()
      .from('greenlog_config')
      .select('valor')
      .eq('clave', CLAVE_CONGELADO)
      .maybeSingle();
    if (error || !data) return MATRIZ_FINANCIERA_ENVIADA;
    return data.valor === 'true';
  },

  /** Solo admins (la policy RLS lo exige). */
  async setPresupuestoCongelado(congelado: boolean): Promise<void> {
    const { error } = await getSupabaseClient()
      .from('greenlog_config')
      .upsert({ clave: CLAVE_CONGELADO, valor: congelado ? 'true' : 'false', actualizado_en: new Date().toISOString() }, { onConflict: 'clave' });
    if (error) throw new Error(error.message);
  },
};

/** Estado del congelamiento del presupuesto, leído de la BD. */
export function usePresupuestoCongelado() {
  const [congelado, setCongelado] = useState<boolean>(MATRIZ_FINANCIERA_ENVIADA);
  const [cargando, setCargando] = useState(true);

  const refrescar = useCallback(async () => {
    try {
      setCongelado(await ConfigService.getPresupuestoCongelado());
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { void refrescar(); }, [refrescar]);

  return { congelado, cargando, refrescar, setCongelado };
}
