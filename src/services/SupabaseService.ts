import { ActividadAmbiental, MatrizAmbiental, NuevaActividadPayload } from '../types';
import { getSupabaseClient } from './supabaseClient';

type SupabaseActividadRow = {
  id: string;
  tarea: string;
  linea_operativa: string;
  descripcion: string | null;
  responsable: string | null;
  contrato: string | null;
  zona: string | null;
  estacion: string | null;
  tipo_lugar: string | null;
  pk: string | null;
  fuente_presupuesto: string | null;
  tipo_planeacion: string | null;
  anio_planeacion: number | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  fecha_inicio_real: string | null;
  fecha_fin_real: string | null;
  mes: string | null;
  estado: string | null;
  prioridad: string | null;
  cuenta: string | null;
  cumplimiento_normativo: string | null;
  novedades: string | null;
  porcentaje_avance: number | null;
  estado_aprobacion: string | null;
  aprobado_por: string | null;
  fecha_aprobacion: string | null;
  solicitante_nombre: string | null;
  solicitante_email: string | null;
  presupuesto_plan: number | null;
  presupuesto_ejecutado: number | null;
  presupuesto_forecast: number | null;
  matrices_aplicables: MatrizAmbiental[] | null;
  opex_data_raw: unknown;
  creado_en: string | null;
  actualizado_en: string | null;
};

const TABLE = 'greenlog_actividades';

const toDateOnly = (value?: string) => {
  if (!value) return null;
  return value.includes('T') ? value.slice(0, 10) : value;
};

const parseOpexRaw = (value: unknown) => {
  if (value == null) return undefined;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
};

const toJson = (value?: string) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const mapRowToActividad = (row: SupabaseActividadRow): ActividadAmbiental => ({
  id: row.id,
  tarea: row.tarea,
  lineaOperativa: row.linea_operativa as ActividadAmbiental['lineaOperativa'],
  descripcion: row.descripcion ?? undefined,
  responsable: row.responsable ?? '',
  contrato: row.contrato ?? undefined,
  zona: row.zona ?? '',
  estacion: row.estacion ?? undefined,
  tipoLugar: row.tipo_lugar as ActividadAmbiental['tipoLugar'],
  pk: row.pk ?? undefined,
  fuentePresupuesto: row.fuente_presupuesto as ActividadAmbiental['fuentePresupuesto'],
  tipoPlaneacion: row.tipo_planeacion as ActividadAmbiental['tipoPlaneacion'],
  anioPlaneacion: row.anio_planeacion ?? undefined,
  fechaInicio: row.fecha_inicio ?? '',
  fechaFin: row.fecha_fin ?? '',
  fechaInicioReal: row.fecha_inicio_real ?? undefined,
  fechaFinReal: row.fecha_fin_real ?? undefined,
  mes: row.mes ?? '',
  estado: (row.estado ?? 'Planeada') as ActividadAmbiental['estado'],
  prioridad: (row.prioridad ?? 'Media') as ActividadAmbiental['prioridad'],
  cuenta: (row.cuenta ?? 'OPEX') as ActividadAmbiental['cuenta'],
  cumplimientoNormativo: row.cumplimiento_normativo ?? undefined,
  novedades: row.novedades ?? undefined,
  porcentajeAvance: Number(row.porcentaje_avance ?? 0),
  estadoAprobacion: (row.estado_aprobacion ?? 'Pendiente') as ActividadAmbiental['estadoAprobacion'],
  aprobadoPor: row.aprobado_por ?? undefined,
  fechaAprobacion: row.fecha_aprobacion ?? undefined,
  solicitanteNombre: row.solicitante_nombre ?? undefined,
  solicitanteEmail: row.solicitante_email ?? undefined,
  presupuestoPlan: Number(row.presupuesto_plan ?? 0),
  presupuestoEjecutado: Number(row.presupuesto_ejecutado ?? 0),
  presupuestoForecast: row.presupuesto_forecast == null ? undefined : Number(row.presupuesto_forecast),
  matricesAplicables: row.matrices_aplicables ?? [],
  creadoEn: row.creado_en ?? undefined,
  actualizadoEn: row.actualizado_en ?? undefined,
  opexDataRaw: parseOpexRaw(row.opex_data_raw),
});

const hasOwn = (payload: Partial<NuevaActividadPayload>, key: keyof NuevaActividadPayload) =>
  Object.prototype.hasOwnProperty.call(payload, key);

const mapPayloadToRow = (payload: Partial<NuevaActividadPayload>) => {
  const row: Record<string, unknown> = {};
  const set = <K extends keyof NuevaActividadPayload>(
    column: string,
    key: K,
    map: (value: NuevaActividadPayload[K] | undefined) => unknown = value => value,
  ) => {
    if (hasOwn(payload, key)) row[column] = map(payload[key]);
  };

  set('tarea', 'tarea');
  set('linea_operativa', 'lineaOperativa');
  set('descripcion', 'descripcion', value => value ?? null);
  set('responsable', 'responsable', value => value ?? '');
  set('contrato', 'contrato', value => value ?? null);
  set('zona', 'zona');
  set('estacion', 'estacion', value => value ?? null);
  set('tipo_lugar', 'tipoLugar', value => value ?? null);
  set('pk', 'pk', value => value ?? null);
  set('fuente_presupuesto', 'fuentePresupuesto', value => value ?? null);
  set('tipo_planeacion', 'tipoPlaneacion', value => value ?? null);
  set('anio_planeacion', 'anioPlaneacion', value => value ?? null);
  set('fecha_inicio', 'fechaInicio', toDateOnly);
  set('fecha_fin', 'fechaFin', toDateOnly);
  set('fecha_inicio_real', 'fechaInicioReal', toDateOnly);
  set('fecha_fin_real', 'fechaFinReal', toDateOnly);
  set('mes', 'mes', value => value ?? null);
  set('estado', 'estado');
  set('prioridad', 'prioridad');
  set('cuenta', 'cuenta');
  set('cumplimiento_normativo', 'cumplimientoNormativo', value => value ?? null);
  set('novedades', 'novedades', value => value ?? null);
  set('porcentaje_avance', 'porcentajeAvance', value => value ?? 0);
  set('estado_aprobacion', 'estadoAprobacion', value => value ?? 'Pendiente');
  set('aprobado_por', 'aprobadoPor', value => value ?? null);
  set('fecha_aprobacion', 'fechaAprobacion', value => value ?? null);
  set('solicitante_nombre', 'solicitanteNombre', value => value ?? null);
  set('solicitante_email', 'solicitanteEmail', value => value ?? null);
  set('presupuesto_plan', 'presupuestoPlan', value => value ?? 0);
  set('presupuesto_ejecutado', 'presupuestoEjecutado', value => value ?? 0);
  set('presupuesto_forecast', 'presupuestoForecast', value => value ?? null);
  set('matrices_aplicables', 'matricesAplicables', value => value ?? []);
  set('opex_data_raw', 'opexDataRaw', toJson);

  return row;
};

const cleanUndefined = <T extends Record<string, unknown>>(obj: T) =>
  Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));

const getSessionEmail = async () => {
  const { data } = await getSupabaseClient().auth.getSession();
  return data.session?.user.email?.toLowerCase() ?? null;
};

export const SupabaseService = {
  async getAll(): Promise<ActividadAmbiental[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('creado_en', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(row => mapRowToActividad(row as SupabaseActividadRow));
  },

  async create(payload: NuevaActividadPayload): Promise<ActividadAmbiental> {
    const supabase = getSupabaseClient();
    const email = await getSessionEmail();
    const row = {
      ...mapPayloadToRow(payload),
      creado_por_email: email,
      actualizado_por_email: email,
    };

    const { data, error } = await supabase
      .from(TABLE)
      .insert(cleanUndefined(row))
      .select('*')
      .single();

    if (error) throw error;
    return mapRowToActividad(data as SupabaseActividadRow);
  },

  async update(id: string, cambios: Partial<NuevaActividadPayload>): Promise<ActividadAmbiental> {
    const supabase = getSupabaseClient();
    const email = await getSessionEmail();
    const row = {
      ...mapPayloadToRow(cambios),
      actualizado_por_email: email,
    };

    const { data, error } = await supabase
      .from(TABLE)
      .update(cleanUndefined(row))
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return mapRowToActividad(data as SupabaseActividadRow);
  },

  async delete(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Propaga las tarifas vigentes a las planeaciones de Monitoreos ya guardadas:
   * recalcula el opex_data_raw (precios de matriz + totales) y el presupuesto_plan.
   * Devuelve el nº de planeaciones actualizadas. No-op fuera de supabase.
   */
  async propagarTarifas(map: Map<string, number>): Promise<number> {
    const { recomputeOpexConTarifas } = await import('./monitoreosTarifas');
    const actividades = await this.getAll();
    let actualizadas = 0;
    for (const act of actividades) {
      if (act.lineaOperativa !== 'Monitoreos' || !act.opexDataRaw) continue;
      let opex: Record<string, unknown>;
      try { opex = JSON.parse(act.opexDataRaw); } catch { continue; }
      const res = recomputeOpexConTarifas(opex, map);
      if (!res) continue;
      await this.update(act.id, {
        opexDataRaw: JSON.stringify(res.opex),
        presupuestoPlan: res.valorTotal,
      });
      actualizadas += 1;
    }
    return actualizadas;
  },
};
