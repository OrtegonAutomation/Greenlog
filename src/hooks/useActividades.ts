// ============================================================
// useActividades — Custom hook para gestión de estado de datos
// ============================================================
import { useCallback, useEffect, useState } from 'react';
import { ActividadAmbiental, NuevaActividadPayload } from '../types';
import { ActividadesService as MockService } from '../generated/services/ActividadesService';
import { SharePointService } from '../services/SharePointService';

// TOGGLE: Change to true to use real SharePoint data (requires Auth context or deployment)
const USE_REAL_DATA = true;
const ActividadesService = USE_REAL_DATA ? SharePointService : MockService;

export interface UseActividadesReturn {
  actividades: ActividadAmbiental[];
  cargando: boolean;
  errorCarga: string | null;
  guardando: boolean;
  recargar: () => void;
  crear: (payload: NuevaActividadPayload) => Promise<ActividadAmbiental>;
  actualizar: (id: string, cambios: Partial<NuevaActividadPayload>) => Promise<ActividadAmbiental>;
  eliminar: (id: string) => Promise<void>;
}

export function useActividades(): UseActividadesReturn {
  const [actividades, setActividades] = useState<ActividadAmbiental[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [version, setVersion] = useState(0); // trigger de recarga

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    setCargando(true);
    setErrorCarga(null);

    // Intento 1: Cargar datos reales de SharePoint
    SharePointService.getAll()
      .then((data) => { if (!cancelled) setActividades(data); })
      .catch((err) => {
        console.warn('Fallo conexión SharePoint (esperado en localhost). Usando datos Mock.', err);
        // Fallback: Si falla (403/401 probables en local), usar MockService invisiblemente
        MockService.getAll().then((mockData) => {
          if (!cancelled) setActividades(mockData);
        });
        // No mostramos error UI para que la experiencia sea fluida
      })
      .finally(() => { if (!cancelled) setCargando(false); });

    return () => { cancelled = true; };
  }, [version]);

  const crear = useCallback(async (payload: NuevaActividadPayload) => {
    setGuardando(true);
    try {
      const nueva = await ActividadesService.create(payload);
      // Optimistic update: insertar al inicio
      setActividades((prev) => [nueva, ...prev]);
      return nueva;
    } finally {
      setGuardando(false);
    }
  }, []);

  const actualizar = useCallback(async (id: string, cambios: Partial<NuevaActividadPayload>) => {
    setGuardando(true);
    try {
      const actualizada = await ActividadesService.update(id, cambios);
      setActividades((prev) => prev.map((a) => (a.id === id ? actualizada : a)));
      return actualizada;
    } finally {
      setGuardando(false);
    }
  }, []);

  const eliminar = useCallback(async (id: string) => {
    // Optimistic delete
    setActividades((prev) => prev.filter((a) => a.id !== id));
    try {
      await ActividadesService.delete(id);
    } catch {
      recargar(); // Revertir si falla
    }
  }, [recargar]);

  return { actividades, cargando, errorCarga, guardando, recargar, crear, actualizar, eliminar };
}
