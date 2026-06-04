import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ActividadAmbiental, LineaOperativa } from '../types';
import {
  AmbitoAmbiental,
  EquipoAmbientalUser,
  ambitoMatches,
  findEquipoAmbientalUser,
  normalizeEmail,
} from '../data/equipoAmbiental';
import { getSectionPath } from '../utils/appRoutes';
import { getSupabaseClient, isSupabaseEnabled } from '../services/supabaseClient';

const STORAGE_KEY = 'greenlog-auth-email';

interface LoginResult {
  ok: boolean;
  message?: string;
  pendingEmail?: boolean;
}

interface AuthContextValue {
  currentUser: EquipoAmbientalUser | null;
  isAdmin: boolean;
  authLoading: boolean;
  login: (email: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
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
  authLoading: false,
  login: async () => ({ ok: false, message: 'AuthProvider no inicializado.' }),
  logout: async () => undefined,
  canPlan: () => false,
  canReview: () => false,
  canViewActividad: () => false,
  canEditActividad: () => false,
  getPlaneacionZonas: () => [],
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const supabaseEnabled = isSupabaseEnabled();
  const [currentUser, setCurrentUser] = useState<EquipoAmbientalUser | null>(() => (
    supabaseEnabled ? null : getInitialUser()
  ));
  const [authLoading, setAuthLoading] = useState(supabaseEnabled);

  const isAdmin = !!currentUser?.admin;

  const setUserFromEmail = useCallback(async (email?: string | null) => {
    const normalized = normalizeEmail(email ?? '');
    const user = normalized ? findEquipoAmbientalUser(normalized) : null;
    setCurrentUser(user);

    if (supabaseEnabled && normalized && !user) {
      try {
        await getSupabaseClient().auth.signOut();
      } catch {
        // No bloquear render si el cierre falla.
      }
    }

    return user;
  }, [supabaseEnabled]);

  useEffect(() => {
    if (!supabaseEnabled) return;

    const supabase = getSupabaseClient();
    let active = true;

    setAuthLoading(true);
    supabase.auth.getSession()
      .then(async ({ data }) => {
        if (!active) return;
        await setUserFromEmail(data.session?.user.email);
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void setUserFromEmail(session?.user.email);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [setUserFromEmail, supabaseEnabled]);

  const login = useCallback(async (email: string): Promise<LoginResult> => {
    const normalized = normalizeEmail(email);
    const user = findEquipoAmbientalUser(normalized);
    if (!user) {
      return {
        ok: false,
        message: 'Este correo no está habilitado para GreenLog. Verifica el correo o solicita actualización de la matriz de accesos.',
      };
    }

    if (supabaseEnabled) {
      const redirectTo = typeof window === 'undefined'
        ? undefined
        : `${window.location.origin}${getSectionPath('dashboard')}`;
      const { error } = await getSupabaseClient().auth.signInWithOtp({
        email: normalized,
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
        },
      });

      if (error) {
        return { ok: false, message: error.message };
      }

      return {
        ok: true,
        pendingEmail: true,
        message: 'Te enviamos un enlace de acceso. Abre el correo para entrar a GreenLog.',
      };
    }

    window.localStorage.setItem(STORAGE_KEY, normalized);
    setCurrentUser(user);
    return { ok: true };
  }, [supabaseEnabled]);

  const logout = useCallback(async () => {
    if (supabaseEnabled) {
      await getSupabaseClient().auth.signOut();
    }
    window.localStorage.removeItem(STORAGE_KEY);
    setCurrentUser(null);
  }, [supabaseEnabled]);

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
    authLoading,
    login,
    logout,
    canPlan,
    canReview,
    canViewActividad,
    canEditActividad,
    getPlaneacionZonas,
  }), [currentUser, isAdmin, authLoading, login, logout, canPlan, canReview, canViewActividad, canEditActividad, getPlaneacionZonas]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
