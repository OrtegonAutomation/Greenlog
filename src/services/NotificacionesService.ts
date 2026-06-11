// ============================================================
// NotificacionesService — campana de notificaciones in-app
// Persiste en Supabase (tabla greenlog_notificaciones).
// Si Supabase no está habilitado, los métodos hacen no-op.
// ============================================================
import { ActividadAmbiental, EstadoAprobacion, Notificacion, TipoNotificacion } from '../types';
import { getSupabaseClient, isSupabaseEnabled } from './supabaseClient';
import { getRevisoresAmbientales, normalizeEmail } from '../data/equipoAmbiental';

const TABLE = 'greenlog_notificaciones';

type NotificacionRow = {
  id: string;
  destinatario_email: string;
  tipo: string;
  titulo: string | null;
  mensaje: string | null;
  actividad_id: string | null;
  actividad_tarea: string | null;
  linea_operativa: string | null;
  zona: string | null;
  actor_nombre: string | null;
  leida: boolean | null;
  creado_en: string | null;
};

const mapRow = (row: NotificacionRow): Notificacion => ({
  id: row.id,
  destinatarioEmail: row.destinatario_email,
  tipo: (row.tipo ?? 'revision_solicitada') as TipoNotificacion,
  titulo: row.titulo ?? undefined,
  mensaje: row.mensaje ?? undefined,
  actividadId: row.actividad_id ?? undefined,
  actividadTarea: row.actividad_tarea ?? undefined,
  lineaOperativa: row.linea_operativa ?? undefined,
  zona: row.zona ?? undefined,
  actorNombre: row.actor_nombre ?? undefined,
  leida: !!row.leida,
  creadoEn: row.creado_en ?? new Date().toISOString(),
});

type RevisionRequestAction = 'created' | 'updated' | 'resent';

const tareaCorta = (actividad: ActividadAmbiental) =>
  actividad.tarea?.length > 80 ? `${actividad.tarea.slice(0, 77)}…` : actividad.tarea;

export const NotificacionesService = {
  /**
   * Lista las notificaciones del usuario (más recientes primero).
   * Si `verTodas` es true (admin), trae todas las notificaciones — la RLS de
   * Supabase debe permitirlo (ver notificaciones_admin.sql).
   */
  async listForUser(email: string, verTodas = false): Promise<Notificacion[]> {
    if (!isSupabaseEnabled() || (!email && !verTodas)) return [];
    const supabase = getSupabaseClient();
    let query = supabase.from(TABLE).select('*');
    if (!verTodas) query = query.eq('destinatario_email', normalizeEmail(email));
    const { data, error } = await query
      .order('creado_en', { ascending: false })
      .limit(verTodas ? 100 : 50);

    if (error) throw error;
    return (data ?? []).map(row => mapRow(row as NotificacionRow));
  },

  async markRead(id: string): Promise<void> {
    if (!isSupabaseEnabled()) return;
    const supabase = getSupabaseClient();
    const { error } = await supabase.from(TABLE).update({ leida: true }).eq('id', id);
    if (error) throw error;
  },

  async markAllRead(email: string): Promise<void> {
    if (!isSupabaseEnabled() || !email) return;
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from(TABLE)
      .update({ leida: true })
      .eq('destinatario_email', normalizeEmail(email))
      .eq('leida', false);
    if (error) throw error;
  },

  /** Crea una notificación por cada revisor de la línea+zona (excluye al actor). */
  async crearParaRevisores(
    actividad: ActividadAmbiental,
    actorNombre: string,
    actorEmail: string,
    action: RevisionRequestAction,
  ): Promise<void> {
    if (!isSupabaseEnabled()) return;
    const revisores = getRevisoresAmbientales(actividad.lineaOperativa, actividad.zona)
      .filter(r => r.email && normalizeEmail(r.email) !== normalizeEmail(actorEmail));
    if (revisores.length === 0) return;

    const verbo = action === 'created' ? 'creó' : action === 'updated' ? 'actualizó' : 'reenvió';
    const filas = revisores.map(r => ({
      destinatario_email: normalizeEmail(r.email),
      tipo: 'revision_solicitada' as TipoNotificacion,
      titulo: 'Revisión solicitada',
      mensaje: `${actorNombre} ${verbo} una planeación de ${actividad.lineaOperativa} en ${actividad.zona} que requiere tu revisión.`,
      actividad_id: actividad.id,
      actividad_tarea: tareaCorta(actividad),
      linea_operativa: actividad.lineaOperativa,
      zona: actividad.zona,
      actor_nombre: actorNombre,
    }));

    const supabase = getSupabaseClient();
    const { error } = await supabase.from(TABLE).insert(filas);
    if (error) throw error;
  },

  /** Crea una notificación para el solicitante al aprobar/rechazar. */
  async crearParaSolicitante(
    actividad: ActividadAmbiental,
    resultado: Exclude<EstadoAprobacion, 'Pendiente'>,
    actorNombre: string,
  ): Promise<void> {
    if (!isSupabaseEnabled()) return;
    const destinatario = actividad.solicitanteEmail;
    if (!destinatario) return;

    const aprobada = resultado === 'Aprobado';
    const tipo: TipoNotificacion = aprobada ? 'revision_aprobada' : 'revision_rechazada';
    const fila = {
      destinatario_email: normalizeEmail(destinatario),
      tipo,
      titulo: aprobada ? 'Planeación aprobada' : 'Planeación rechazada',
      mensaje: `${actorNombre} ${aprobada ? 'aprobó' : 'rechazó'} tu planeación de ${actividad.lineaOperativa} en ${actividad.zona}.`,
      actividad_id: actividad.id,
      actividad_tarea: tareaCorta(actividad),
      linea_operativa: actividad.lineaOperativa,
      zona: actividad.zona,
      actor_nombre: actorNombre,
    };

    const supabase = getSupabaseClient();
    const { error } = await supabase.from(TABLE).insert(fila);
    if (error) throw error;
  },
};
