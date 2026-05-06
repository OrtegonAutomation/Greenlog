import { useState, useEffect, useCallback } from 'react';
import { Provision, NuevaProvisionPayload } from '../types/provisiones';
import { ProvisionesService } from '../services/ProvisionesService';

export interface UseProvisionesReturn {
  provisiones: Provision[];
  cargando: boolean;
  errorCarga: string | null;
  guardando: boolean;
  recargar: () => void;
  crear: (payload: NuevaProvisionPayload) => Promise<Provision>;
  actualizar: (id: string, cambios: Partial<Provision>) => Promise<Provision>;
  eliminar: (id: string) => Promise<void>;
}

export const useProvisiones = (): UseProvisionesReturn => {
  const [provisiones, setProvisiones] = useState<Provision[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [version, setVersion] = useState(0);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setErrorCarga(null);

    ProvisionesService.getAll()
      .then((data) => { if (!cancelado) setProvisiones(data); })
      .catch((err) => { if (!cancelado) setErrorCarga(err instanceof Error ? err.message : 'Error al cargar provisiones'); })
      .finally(() => { if (!cancelado) setCargando(false); });

    return () => { cancelado = true; };
  }, [version]);

  const crear = useCallback(async (payload: NuevaProvisionPayload) => {
    setGuardando(true);
    try {
      const nuevo = await ProvisionesService.create(payload);
      setProvisiones((prev) => [...prev, nuevo]);
      return nuevo;
    } finally {
      setGuardando(false);
    }
  }, []);

  const actualizar = useCallback(async (id: string, cambios: Partial<Provision>) => {
    setGuardando(true);
    try {
      const actualizado = await ProvisionesService.update(id, cambios);
      setProvisiones((prev) => prev.map((p) => (p.id === id ? actualizado : p)));
      return actualizado;
    } finally {
      setGuardando(false);
    }
  }, []);

  const eliminar = useCallback(async (id: string) => {
    setGuardando(true);
    try {
      await ProvisionesService.delete(id);
      setProvisiones((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setGuardando(false);
    }
  }, []);

  return { provisiones, cargando, errorCarga, guardando, recargar, crear, actualizar, eliminar };
};
