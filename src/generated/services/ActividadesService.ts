// ============================================================
// ActividadesService — Mock completo CENIT (GREENLOG)
// Datos basados en Plan Monitoreos v7 + Presupuesto 2026 DB
// ============================================================

import { ActividadAmbiental, NuevaActividadPayload } from '../../types';

let STORE: ActividadAmbiental[] = [];

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const rndDelay = () => 200 + Math.random() * 350;

export const ActividadesService = {
  async getAll(): Promise<ActividadAmbiental[]> {
    await delay(rndDelay());
    return STORE.map((a) => ({ ...a }));
  },

  async getById(id: string): Promise<ActividadAmbiental | undefined> {
    await delay(rndDelay());
    return STORE.find((a) => a.id === id);
  },

  async create(payload: NuevaActividadPayload): Promise<ActividadAmbiental> {
    await delay(rndDelay());
    const nueva: ActividadAmbiental = {
      ...payload,
      id: `act-${Date.now()}`,
      creadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
    };
    STORE = [nueva, ...STORE];
    return { ...nueva };
  },

  async update(id: string, cambios: Partial<NuevaActividadPayload>): Promise<ActividadAmbiental> {
    await delay(rndDelay());
    STORE = STORE.map((a) =>
      a.id === id ? { ...a, ...cambios, actualizadoEn: new Date().toISOString() } : a
    );
    return { ...STORE.find((a) => a.id === id)! };
  },

  async delete(id: string): Promise<void> {
    await delay(rndDelay());
    STORE = STORE.filter((a) => a.id !== id);
  },
};
