import { useState, useEffect, useCallback } from 'react';
import { Compensacion, NuevaCompensacionPayload } from '../types/provisiones';
import { CompensacionesService } from '../services/CompensacionesService';

export interface UseCompensacionesReturn {
  compensaciones: Compensacion[];
  cargando: boolean;
  errorCarga: string | null;
  guardando: boolean;
  recargar: () => void;
  crear: (payload: NuevaCompensacionPayload) => Promise<Compensacion>;
  actualizar: (id: string, cambios: Partial<Compensacion>) => Promise<Compensacion>;
  eliminar: (id: string) => Promise<void>;
}

export const useCompensaciones = (): UseCompensacionesReturn => {
  const [compensaciones, setCompensaciones] = useState<Compensacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [version, setVersion] = useState(0);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setErrorCarga(null);

    CompensacionesService.getAll()
      .then((data) => { if (!cancelado) setCompensaciones(data); })
      .catch((err) => { if (!cancelado) setErrorCarga(err instanceof Error ? err.message : 'Error al cargar compensaciones'); })
      .finally(() => { if (!cancelado) setCargando(false); });

    return () => { cancelado = true; };
  }, [version]);

  const crear = useCallback(async (payload: NuevaCompensacionPayload) => {
    setGuardando(true);
    try {
      const nuevo = await CompensacionesService.create(payload);
      setCompensaciones((prev) => [...prev, nuevo]);
      return nuevo;
    } finally {
      setGuardando(false);
    }
  }, []);

  const actualizar = useCallback(async (id: string, cambios: Partial<Compensacion>) => {
    setGuardando(true);
    try {
      const actualizado = await CompensacionesService.update(id, cambios);
      setCompensaciones((prev) => prev.map((c) => (c.id === id ? actualizado : c)));
      return actualizado;
    } finally {
      setGuardando(false);
    }
  }, []);

  const eliminar = useCallback(async (id: string) => {
    setGuardando(true);
    try {
      await CompensacionesService.delete(id);
      setCompensaciones((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setGuardando(false);
    }
  }, []);

  return { compensaciones, cargando, errorCarga, guardando, recargar, crear, actualizar, eliminar };
};
