import { ActividadAmbiental, EstadoAprobacion } from '../types';
import {
  EquipoAmbientalUser,
  getRevisoresAmbientales,
  normalizeEmail,
} from '../data/equipoAmbiental';

export const REVISION_NOTIFICATIONS_ENABLED = true;
export const REVISION_NOTIFICATIONS_TEST_MODE = false;
export const REVISION_NOTIFICATIONS_TEST_EMAIL = 'camilo.ortegonc@outlook.com';
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

const buildActividadPayload = (actividad: ActividadAmbiental) => ({
  id: actividad.id,
  tarea: actividad.tarea,
  lineaOperativa: actividad.lineaOperativa,
  zona: actividad.zona,
  estacion: actividad.estacion,
  tipoLugar: actividad.tipoLugar,
  fuentePresupuesto: actividad.fuentePresupuesto,
  tipoPlaneacion: actividad.tipoPlaneacion,
  anioPlaneacion: actividad.anioPlaneacion,
  presupuestoPlan: actividad.presupuestoPlan,
  estadoAprobacion: actividad.estadoAprobacion,
  aprobadoPor: actividad.aprobadoPor,
  fechaAprobacion: actividad.fechaAprobacion,
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
    : revisoresReales.map(revisor => revisor.email);

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
      : [solicitante.email];

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
