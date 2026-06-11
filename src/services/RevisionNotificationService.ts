import { ActividadAmbiental, EstadoAprobacion } from '../types';
import {
  EquipoAmbientalUser,
  getRevisoresAmbientales,
  normalizeEmail,
} from '../data/equipoAmbiental';

export const REVISION_NOTIFICATIONS_ENABLED = true;
export const REVISION_NOTIFICATIONS_TEST_MODE = true;
export const REVISION_NOTIFICATIONS_TEST_EMAIL = 'camilo.ortegonc@outlook.com';
// Correos que SIEMPRE reciben copia (además de los destinatarios reales), de
// forma temporal para supervisión. Vaciar este arreglo para desactivar la copia.
export const REVISION_NOTIFICATIONS_ALWAYS_CC = ['camilo.ortegonc@outlook.com'];
export const REVISION_WEBHOOK_URL = 'https://n8n.srv1253947.hstgr.cloud/webhook/872ac679-540e-43a0-be83-e49777633e88';

const GREENLOG_APP_URL = 'https://ortegonautomation.github.io/Greenlog/';
const WEBHOOK_TIMEOUT_MS = 8000;

type RevisionRequestAction = 'created' | 'updated' | 'resent';

interface UserRef {
  nombre: string;
  email: string;
}

export interface RevisionNotificationResult {
  ok: boolean;
  message?: string;
}

const parseOpex = (raw?: string) => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const compactUniqueEmails = (emails: string[]) => {
  const seen = new Set<string>();
  return emails
    .map(email => normalizeEmail(email))
    .filter(email => {
      if (!email || seen.has(email)) return false;
      seen.add(email);
      return true;
    });
};

const toUserRef = (user?: EquipoAmbientalUser | null): UserRef => ({
  nombre: user?.nombre ?? '',
  email: user?.email ? normalizeEmail(user.email) : '',
});

const getSolicitante = (actividad: ActividadAmbiental, fallback?: EquipoAmbientalUser | null): UserRef => {
  const opx = parseOpex(actividad.opexDataRaw);
  return {
    nombre: actividad.solicitanteNombre || opx?.solicitanteNombre || fallback?.nombre || '',
    email: normalizeEmail(actividad.solicitanteEmail || opx?.solicitanteEmail || fallback?.email || ''),
  };
};

const num = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0);

// Resumen detallado de la programación a partir del opexDataRaw, para que el
// correo muestre TODA la planeación (ítems/parámetros, meses, totales).
const buildDetalleProgramacion = (actividad: ActividadAmbiental) => {
  const opx = parseOpex(actividad.opexDataRaw);
  if (!opx) return null;

  const meses: any[] = Array.isArray(opx.meses) ? opx.meses : [];

  // Agregar cada ítem/parámetro sumando sus 12 meses → total anual por ítem.
  const itemsMap = new Map<string, any>();
  let mesesActivos = 0;
  let totalAnual = 0;

  for (const mes of meses) {
    const totalMes = num(mes?.total);
    if (totalMes > 0) mesesActivos += 1;
    totalAnual += totalMes;
    for (const pi of (Array.isArray(mes?.preciosIndividuales) ? mes.preciosIndividuales : [])) {
      const key = String(pi?.key ?? pi?.nombre ?? '');
      if (!key) continue;
      const prev = itemsMap.get(key) ?? {
        key,
        nombre: pi?.nombre ?? key,
        esLogistica: String(pi?.key ?? '').startsWith('LOG-'),
        aplicaIva: !!pi?.aplicaIva,
        precio: num(pi?.precio),
        cantidadTotal: 0,
        totalAnual: 0,
      };
      prev.cantidadTotal += num(pi?.cantidad);
      prev.totalAnual += num(pi?.total);
      if (num(pi?.precio) > 0) prev.precio = num(pi?.precio);
      if (pi?.aplicaIva) prev.aplicaIva = true;
      itemsMap.set(key, prev);
    }
  }

  const items = [...itemsMap.values()]
    .filter(it => it.totalAnual > 0 || it.cantidadTotal > 0)
    .sort((a, b) => b.totalAnual - a.totalAnual);

  // Monitoreos: cada entrada es una MATRIZ (key = "MATRIZ|<nombre>", nombre =
  // "<matriz> (N params)"). Resumimos por matriz con total y nº de parámetros.
  const esMonitoreo = actividad.lineaOperativa === 'Monitoreos';
  const matrices = esMonitoreo
    ? items
        .filter(it => String(it.key).startsWith('MATRIZ|'))
        .map(it => {
          const nombreMatriz = String(it.key).replace(/^MATRIZ\|/, '').trim();
          const m = /\((\d+)\s*params?\)/i.exec(String(it.nombre));
          return {
            matriz: nombreMatriz,
            parametros: m ? Number(m[1]) : null,
            totalAnual: it.totalAnual,
          };
        })
        .sort((a, b) => b.totalAnual - a.totalAnual)
    : [];

  const mesesResumen = meses.map((m: any) => ({
    mes: m?.mes,
    total: num(m?.total),
    cantidad: num(m?.cantidad),
    activo: num(m?.total) > 0,
  }));

  return {
    esMonitoreo,
    matrices,
    items,
    meses: mesesResumen,
    totalAnual,
    mesesActivos,
    ipcActivo: !!opx.ipcGlobalActivo,
    ipcPorcentaje: num(opx.ipcGlobalPorcentaje),
    ivaActivo: !!opx.ivaGlobalActivo,
    ivaPorcentaje: num(opx.ivaGlobalPorcentaje),
    pagosDiferidosActivo: !!opx.pagosDiferidosActivo,
    contrato: {
      proveedor: opx.proveedor ?? null,
      numero: opx.contrato ?? actividad.contrato ?? null,
      administrador: opx.administrador ?? actividad.responsable ?? null,
      objeto: opx.objeto ?? null,
      descripcionNecesidad: opx.descripcionNecesidad ?? null,
      unidadMedida: opx.unidadMedida ?? null,
    },
  };
};

const buildActividadPayload = (actividad: ActividadAmbiental) => ({
  id: actividad.id,
  tarea: actividad.tarea,
  descripcion: actividad.descripcion ?? null,
  lineaOperativa: actividad.lineaOperativa,
  zona: actividad.zona,
  estacion: actividad.estacion ?? null,
  tipoLugar: actividad.tipoLugar ?? null,
  pk: actividad.pk ?? null,
  contrato: actividad.contrato ?? null,
  responsable: actividad.responsable ?? null,
  fuentePresupuesto: actividad.fuentePresupuesto,
  tipoPlaneacion: actividad.tipoPlaneacion,
  anioPlaneacion: actividad.anioPlaneacion,
  cuenta: actividad.cuenta ?? null,
  prioridad: actividad.prioridad ?? null,
  estado: actividad.estado ?? null,
  mes: actividad.mes ?? null,
  fechaInicio: actividad.fechaInicio ?? null,
  fechaFin: actividad.fechaFin ?? null,
  cumplimientoNormativo: actividad.cumplimientoNormativo ?? null,
  presupuestoPlan: actividad.presupuestoPlan,
  matricesAplicables: actividad.matricesAplicables ?? [],
  estadoAprobacion: actividad.estadoAprobacion,
  aprobadoPor: actividad.aprobadoPor,
  fechaAprobacion: actividad.fechaAprobacion,
  detalle: buildDetalleProgramacion(actividad),
});

const postWebhook = async (payload: Record<string, unknown>): Promise<RevisionNotificationResult> => {
  if (!REVISION_NOTIFICATIONS_ENABLED) return { ok: true, message: 'Notificaciones deshabilitadas.' };

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

  try {
    const response = await fetch(REVISION_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      return { ok: false, message: `n8n respondió ${response.status} ${response.statusText}`.trim() };
    }

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo conectar con n8n.';
    return { ok: false, message };
  } finally {
    window.clearTimeout(timeout);
  }
};

const buildReviewerRecipients = (actividad: ActividadAmbiental) => {
  const revisoresReales = getRevisoresAmbientales(actividad.lineaOperativa, actividad.zona);
  const recipients = REVISION_NOTIFICATIONS_TEST_MODE
    ? [REVISION_NOTIFICATIONS_TEST_EMAIL]
    : [...revisoresReales.map(revisor => revisor.email), ...REVISION_NOTIFICATIONS_ALWAYS_CC];

  return {
    recipients: compactUniqueEmails(recipients),
    revisoresReales,
  };
};

export const RevisionNotificationService = {
  notifyRevisionRequested(
    actividad: ActividadAmbiental,
    actor: EquipoAmbientalUser,
    action: RevisionRequestAction,
  ): Promise<RevisionNotificationResult> {
    const { recipients, revisoresReales } = buildReviewerRecipients(actividad);

    if (recipients.length === 0) {
      return Promise.resolve({
        ok: false,
        message: 'No hay revisores con correo para esta línea y zona.',
      });
    }

    return postWebhook({
      eventType: 'revision_solicitada',
      action,
      appUrl: GREENLOG_APP_URL,
      testMode: REVISION_NOTIFICATIONS_TEST_MODE,
      recipients,
      revisoresReales,
      revisores: revisoresReales,
      actividad: buildActividadPayload(actividad),
      solicitante: getSolicitante(actividad, actor),
      actor: toUserRef(actor),
    });
  },

  notifyRevisionResolved(
    actividad: ActividadAmbiental,
    actor: EquipoAmbientalUser,
    resultado: Exclude<EstadoAprobacion, 'Pendiente'>,
  ): Promise<RevisionNotificationResult> {
    const solicitante = getSolicitante(actividad);
    const recipients = REVISION_NOTIFICATIONS_TEST_MODE
      ? [REVISION_NOTIFICATIONS_TEST_EMAIL]
      : [solicitante.email, ...REVISION_NOTIFICATIONS_ALWAYS_CC];

    const normalizedRecipients = compactUniqueEmails(recipients);
    if (normalizedRecipients.length === 0) {
      return Promise.resolve({
        ok: false,
        message: 'No hay correo de solicitante para notificar la revisión.',
      });
    }

    return postWebhook({
      eventType: 'revision_resuelta',
      action: resultado === 'Aprobado' ? 'approved' : 'rejected',
      resultado,
      appUrl: GREENLOG_APP_URL,
      testMode: REVISION_NOTIFICATIONS_TEST_MODE,
      recipients: normalizedRecipients,
      revisoresReales: getRevisoresAmbientales(actividad.lineaOperativa, actividad.zona),
      actividad: buildActividadPayload(actividad),
      solicitante,
      actor: toUserRef(actor),
    });
  },
};
