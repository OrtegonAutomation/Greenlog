// ============================================================
// useActividades — Custom hook para gestión de estado de datos
// ============================================================
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActividadAmbiental, NuevaActividadPayload } from '../types';
import { ActividadesService as MockService } from '../generated/services/ActividadesService';
import { SharePointService } from '../services/SharePointService';
import { useAuth } from '../auth/AuthContext';

// TOGGLE: Change to true to use real SharePoint data (requires Auth context or deployment)
const USE_REAL_DATA = false;
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
  const { canViewActividad } = useAuth();

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    setCargando(true);
    setErrorCarga(null);

    const cargarActividades = async () => {
      try {
        const data = await ActividadesService.getAll();
        if (!cancelled) setActividades(data);
      } catch (err) {
        if (!USE_REAL_DATA) {
          if (!cancelled) setErrorCarga('No se pudieron cargar los datos de prueba.');
          console.error('Error cargando datos mock.', err);
          return;
        }

        console.warn('Fallo conexión SharePoint. Usando datos mock.', err);
        try {
          const mockData = await MockService.getAll();
          if (!cancelled) setActividades(mockData);
        } catch (mockErr) {
          if (!cancelled) setErrorCarga('No se pudieron cargar actividades.');
          console.error('Error cargando fallback mock.', mockErr);
        }
      } finally {
        if (!cancelled) setCargando(false);
      }
    };

    cargarActividades();

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

  const actividadesVisibles = useMemo(
    () => actividades.filter(canViewActividad),
    [actividades, canViewActividad],
  );

  return { actividades: actividadesVisibles, cargando, errorCarga, guardando, recargar, crear, actualizar, eliminar };
}
