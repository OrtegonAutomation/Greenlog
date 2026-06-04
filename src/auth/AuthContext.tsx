import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ActividadAmbiental, LineaOperativa } from '../types';
import {
  AmbitoAmbiental,
  EquipoAmbientalUser,
  ambitoMatches,
  findEquipoAmbientalUser,
  normalizeEmail,
} from '../data/equipoAmbiental';

const STORAGE_KEY = 'greenlog-auth-email';

interface LoginResult {
  ok: boolean;
  message?: string;
}

interface AuthContextValue {
  currentUser: EquipoAmbientalUser | null;
  isAdmin: boolean;
  login: (email: string) => LoginResult;
  logout: () => void;
  canPlan: (linea?: LineaOperativa, zona?: string) => boolean;
  canReview: (linea?: LineaOperativa, zona?: string) => boolean;
  canViewActividad: (actividad: ActividadAmbiental) => boolean;
  canEditActividad: (actividad: ActividadAmbiental) => boolean;
  getPlaneacionZonas: (linea?: LineaOperativa) => string[];
}

const collectZonas = (scopes: AmbitoAmbiental[], linea?: LineaOperativa) => {
  const zonas = new Set<string>();
  for (const scope of scopes) {
    if (linea && !scope.lineas.includes(linea)) continue;
    if (scope.global || scope.zonas.includes('*')) {
      zonas.add('*');
      continue;
    }
    scope.zonas.forEach(zona => zonas.add(zona));
  }
  return [...zonas];
};

const getInitialUser = () => {
  if (typeof window === 'undefined') return null;
  const storedEmail = window.localStorage.getItem(STORAGE_KEY);
  return storedEmail ? findEquipoAmbientalUser(storedEmail) : null;
};

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  isAdmin: false,
  login: () => ({ ok: false, message: 'AuthProvider no inicializado.' }),
  logout: () => undefined,
  canPlan: () => false,
  canReview: () => false,
  canViewActividad: () => false,
  canEditActividad: () => false,
  getPlaneacionZonas: () => [],
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<EquipoAmbientalUser | null>(() => getInitialUser());

  const isAdmin = !!currentUser?.admin;

  const login = useCallback((email: string): LoginResult => {
    const normalized = normalizeEmail(email);
    const user = findEquipoAmbientalUser(normalized);
    if (!user) {
      return {
        ok: false,
        message: 'Este correo no está habilitado para GreenLog. Verifica el correo o solicita actualización de la matriz de accesos.',
      };
    }
    window.localStorage.setItem(STORAGE_KEY, normalized);
    setCurrentUser(user);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setCurrentUser(null);
  }, []);

  const canPlan = useCallback((linea?: LineaOperativa, zona?: string) => {
    if (!currentUser) return false;
    if (currentUser.admin) return true;
    return ambitoMatches(currentUser.planeador, linea, zona);
  }, [currentUser]);

  const canReview = useCallback((linea?: LineaOperativa, zona?: string) => {
    if (!currentUser) return false;
    if (currentUser.admin) return true;
    return ambitoMatches(currentUser.revisor, linea, zona);
  }, [currentUser]);

  const canViewActividad = useCallback((actividad: ActividadAmbiental) => {
    if (!currentUser) return false;
    if (currentUser.admin) return true;
    return canPlan(actividad.lineaOperativa, actividad.zona) || canReview(actividad.lineaOperativa, actividad.zona);
  }, [canPlan, canReview, currentUser]);

  const canEditActividad = useCallback((actividad: ActividadAmbiental) => {
    if (!currentUser) return false;
    if (currentUser.admin) return true;
    return canPlan(actividad.lineaOperativa, actividad.zona);
  }, [canPlan, currentUser]);

  const getPlaneacionZonas = useCallback((linea?: LineaOperativa) => {
    if (!currentUser) return [];
    if (currentUser.admin) return ['*'];
    return collectZonas(currentUser.planeador, linea);
  }, [currentUser]);

  const value = useMemo<AuthContextValue>(() => ({
    currentUser,
    isAdmin,
    login,
    logout,
    canPlan,
    canReview,
    canViewActividad,
    canEditActividad,
    getPlaneacionZonas,
  }), [currentUser, isAdmin, login, logout, canPlan, canReview, canViewActividad, canEditActividad, getPlaneacionZonas]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
