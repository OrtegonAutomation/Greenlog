// ============================================================
// NotificacionesContext — estado compartido de la campana
// Permite que el header (AppShell) muestre el badge y que
// PlaneacionModule recargue tras crear/revisar y abra el detalle.
// ============================================================
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Notificacion } from '../types';
import { NotificacionesService } from '../services/NotificacionesService';
import { useAuth } from '../auth/AuthContext';

interface NotificacionesContextValue {
  notificaciones: Notificacion[];
  unreadCount: number;
  cargando: boolean;
  recargar: () => Promise<void>;
  marcarLeida: (id: string) => Promise<void>;
  marcarTodasLeidas: () => Promise<void>;
  /** Actividad cuyo detalle debe abrirse (set por la campana, consumido por PlaneacionModule). */
  actividadIdParaAbrir: string | null;
  pedirAbrirActividad: (id: string) => void;
  limpiarAbrirActividad: () => void;
}

const NotificacionesContext = createContext<NotificacionesContextValue>({
  notificaciones: [],
  unreadCount: 0,
  cargando: false,
  recargar: async () => {},
  marcarLeida: async () => {},
  marcarTodasLeidas: async () => {},
  actividadIdParaAbrir: null,
  pedirAbrirActividad: () => {},
  limpiarAbrirActividad: () => {},
});

export const NotificacionesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAdmin } = useAuth();
  const email = currentUser?.email ?? '';

  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [actividadIdParaAbrir, setActividadIdParaAbrir] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    if (!email && !isAdmin) {
      setNotificaciones([]);
      return;
    }
    setCargando(true);
    try {
      // El admin ve todas las notificaciones del sistema; el resto, solo las suyas.
      const lista = await NotificacionesService.listForUser(email, isAdmin);
      setNotificaciones(lista);
    } catch {
      // Silencioso: la campana no debe romper la app si falla la BD.
      setNotificaciones([]);
    } finally {
      setCargando(false);
    }
  }, [email, isAdmin]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const marcarLeida = useCallback(async (id: string) => {
    setNotificaciones(prev => prev.map(n => (n.id === id ? { ...n, leida: true } : n)));
    try {
      await NotificacionesService.markRead(id);
    } catch {
      void recargar();
    }
  }, [recargar]);

  const marcarTodasLeidas = useCallback(async () => {
    if (!email) return;
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    try {
      await NotificacionesService.markAllRead(email);
    } catch {
      void recargar();
    }
  }, [email, recargar]);

  const pedirAbrirActividad = useCallback((id: string) => setActividadIdParaAbrir(id), []);
  const limpiarAbrirActividad = useCallback(() => setActividadIdParaAbrir(null), []);

  const unreadCount = useMemo(() => notificaciones.filter(n => !n.leida).length, [notificaciones]);

  const value = useMemo<NotificacionesContextValue>(() => ({
    notificaciones,
    unreadCount,
    cargando,
    recargar,
    marcarLeida,
    marcarTodasLeidas,
    actividadIdParaAbrir,
    pedirAbrirActividad,
    limpiarAbrirActividad,
  }), [notificaciones, unreadCount, cargando, recargar, marcarLeida, marcarTodasLeidas, actividadIdParaAbrir, pedirAbrirActividad, limpiarAbrirActividad]);

  return <NotificacionesContext.Provider value={value}>{children}</NotificacionesContext.Provider>;
};

export const useNotificaciones = () => useContext(NotificacionesContext);
