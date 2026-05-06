import { useState, useEffect, useCallback } from 'react';
import { ItemPxQ } from '../types/provisiones';
import { PxQService } from '../services/PxQService';

export interface UsePxQReturn {
  items: ItemPxQ[];
  cargando: boolean;
  errorCarga: string | null;
  recargar: () => void;
}

export const usePxQ = (): UsePxQReturn => {
  const [items, setItems] = useState<ItemPxQ[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setErrorCarga(null);

    PxQService.getAll()
      .then((data) => { if (!cancelado) setItems(data); })
      .catch((err) => { if (!cancelado) setErrorCarga(err instanceof Error ? err.message : 'Error al cargar PxQ'); })
      .finally(() => { if (!cancelado) setCargando(false); });

    return () => { cancelado = true; };
  }, [version]);

  return { items, cargando, errorCarga, recargar };
};
