import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ActividadAmbiental, LineaOperativa } from '../types';
import {
  AmbitoAmbiental,
  EquipoAmbientalUser,
  ambitoMatches,
  findEquipoAmbientalUser,
  normalizeEmail,
} from '../data/equipoAmbiental';
import { getSupabaseClient, isSupabaseEnabled } from '../services/supabaseClient';
import { getLoginPath } from '../utils/appRoutes';

const STORAGE_KEY = 'greenlog-auth-email';

interface LoginResult {
  ok: boolean;
  message?: string;
  pendingConfirmation?: boolean;
}

interface AuthContextValue {
  currentUser: EquipoAmbientalUser | null;
  isAdmin: boolean;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
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

const getRedirectUrl = () => {
  if (typeof window === 'undefined') return undefined;
  return `${window.location.origin}${getLoginPath()}`;
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

/**
 * Allowlist en BD: usuarios creados desde el módulo de Administración
 * (p. ej. visores de Reportes) que no están en la lista embebida del front.
 */
const fetchUsuarioBD = async (email: string): Promise<EquipoAmbientalUser | null> => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('greenlog_allowlist_profile', { p_email: email });
    if (error || !data || data.length === 0) return null;
    const row = data[0] as { nombre: string; alcance: string; zona_base: string; admin: boolean; visor: boolean };

    // Ámbitos (solo disponible con sesión; sin sesión quedan vacíos y se
    // recargan tras el login por onAuthStateChange).
    const planeador: EquipoAmbientalUser['planeador'] = [];
    const revisor: EquipoAmbientalUser['revisor'] = [];
    try {
      const { data: ambitos } = await supabase.rpc('greenlog_allowlist_ambitos', { p_email: email });
      for (const a of (ambitos ?? []) as { tipo: string; linea_operativa: string; zona: string; global: boolean }[]) {
        const destino = a.tipo === 'planeador' ? planeador : revisor;
        destino.push({ lineas: [a.linea_operativa as never], zonas: [a.zona], global: a.global });
      }
    } catch { /* sin sesión aún */ }

    return {
      nombre: row.nombre || email,
      email,
      alcance: row.alcance || (row.visor ? 'Consulta Reportes' : ''),
      baseTrabajo: '',
      zonaBase: row.zona_base || 'Transversal',
      planeador,
      revisor,
      admin: row.admin,
      visor: row.visor,
    };
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const supabaseEnabled = isSupabaseEnabled();
  const [currentUser, setCurrentUser] = useState<EquipoAmbientalUser | null>(() => supabaseEnabled ? null : getInitialUser());
  const [authLoading, setAuthLoading] = useState(supabaseEnabled);

  const isAdmin = !!currentUser?.admin;

  const setUserFromEmail = useCallback(async (email?: string | null) => {
    const normalized = normalizeEmail(email ?? '');
    let user = normalized ? findEquipoAmbientalUser(normalized) : null;
    if (!user && normalized && supabaseEnabled) {
      user = await fetchUsuarioBD(normalized);
    }
    setCurrentUser(user);

    if (user) {
      window.localStorage.setItem(STORAGE_KEY, normalized);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }

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
        if (data.session?.user.email) {
          await setUserFromEmail(data.session.user.email);
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
          setCurrentUser(null);
        }
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user.email) {
        void setUserFromEmail(session.user.email);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
        setCurrentUser(null);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [setUserFromEmail, supabaseEnabled]);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    const normalized = normalizeEmail(email);
    const normalizedPassword = password.trim();
    let user = findEquipoAmbientalUser(normalized);
    if (!user && supabaseEnabled) {
      user = await fetchUsuarioBD(normalized);
    }
    if (!user) {
      return {
        ok: false,
        message: 'Este correo no está habilitado para GreenLog. Verifica el correo o solicita actualización de la matriz de accesos.',
      };
    }

    if (!normalizedPassword) {
      return {
        ok: false,
        message: 'Ingresa la contraseña temporal asignada.',
      };
    }

    if (!supabaseEnabled) {
      window.localStorage.setItem(STORAGE_KEY, normalized);
      setCurrentUser(user);
      return { ok: true };
    }

    const supabase = getSupabaseClient();
    const { data: sessionData } = await supabase.auth.getSession();
    if (normalizeEmail(sessionData.session?.user.email ?? '') === normalized) {
      await setUserFromEmail(normalized);
      return { ok: true };
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: normalized,
      password: normalizedPassword,
    });

    if (!signInError) {
      await setUserFromEmail(normalized);
      return { ok: true };
    }

    const signInMessage = signInError.message.toLowerCase();
    if (signInMessage.includes('email not confirmed')) {
      return {
        ok: false,
        message: 'La cuenta existe, pero Supabase todavía pide confirmar el correo. Revisa la bandeja del correo registrado.',
      };
    }

    if (!signInMessage.includes('invalid login credentials')) {
      return {
        ok: false,
        message: `No fue posible iniciar sesión: ${signInError.message}`,
      };
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: normalized,
      password: normalizedPassword,
      options: {
        emailRedirectTo: getRedirectUrl(),
        data: {
          nombre: user.nombre,
          greenlogAllowlisted: true,
        },
      },
    });

    if (signUpError) {
      return {
        ok: false,
        message: `No fue posible activar la cuenta: ${signUpError.message}`,
      };
    }

    const identities = signUpData.user?.identities;
    if (Array.isArray(identities) && identities.length === 0) {
      return {
        ok: false,
        message: 'La cuenta ya existe y la contraseña no coincide. Verifica la contraseña temporal asignada.',
      };
    }

    if (signUpData.session?.user.email) {
      await setUserFromEmail(signUpData.session.user.email);
      return { ok: true };
    }

    setCurrentUser(null);
    return {
      ok: true,
      pendingConfirmation: true,
      message: 'Cuenta activada. Si Supabase solicita confirmación de correo, abre el enlace enviado y vuelve a ingresar con esta contraseña.',
    };
  }, [setUserFromEmail, supabaseEnabled]);

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

  const canViewActividad = useCallback((_actividad: ActividadAmbiental) => {
    // Lectura global: cualquier usuario autorizado ve todas las actividades
    // (los Reportes son completos, no recortados por zona). La edición sigue
    // controlada por canEditActividad / canPlan / canReview y el congelamiento.
    return !!currentUser;
  }, [currentUser]);

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
