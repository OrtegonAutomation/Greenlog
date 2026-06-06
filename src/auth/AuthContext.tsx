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
const PENDING_EMAIL_KEY = 'greenlog-auth-pending-email';
const OTP_COOLDOWN_PREFIX = 'greenlog-auth-otp-next:';
const DEFAULT_OTP_COOLDOWN_MS = 60_000;

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

const getRedirectUrl = () => {
  if (typeof window === 'undefined') return undefined;
  return `${window.location.origin}${getLoginPath()}`;
};

const getCooldownKey = (email: string) => `${OTP_COOLDOWN_PREFIX}${email}`;

const getCooldownRemainingSeconds = (email: string) => {
  if (typeof window === 'undefined') return 0;
  const nextAllowed = Number(window.localStorage.getItem(getCooldownKey(email)) ?? 0);
  return Math.max(0, Math.ceil((nextAllowed - Date.now()) / 1000));
};

const setOtpCooldown = (email: string, seconds?: number) => {
  if (typeof window === 'undefined') return;
  const ms = Math.max(1, seconds ?? DEFAULT_OTP_COOLDOWN_MS / 1000) * 1000;
  window.localStorage.setItem(getCooldownKey(email), String(Date.now() + ms));
};

const parseCooldownSeconds = (message?: string) => {
  const match = message?.match(/after\s+(\d+)\s+seconds?/i);
  return match ? Number(match[1]) : undefined;
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
  const [currentUser, setCurrentUser] = useState<EquipoAmbientalUser | null>(() => supabaseEnabled ? null : getInitialUser());
  const [authLoading, setAuthLoading] = useState(supabaseEnabled);

  const isAdmin = !!currentUser?.admin;

  const setUserFromEmail = useCallback(async (email?: string | null) => {
    const normalized = normalizeEmail(email ?? '');
    const user = normalized ? findEquipoAmbientalUser(normalized) : null;
    setCurrentUser(user);

    if (user) {
      window.localStorage.setItem(STORAGE_KEY, normalized);
      window.localStorage.removeItem(PENDING_EMAIL_KEY);
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

  const login = useCallback(async (email: string): Promise<LoginResult> => {
    const normalized = normalizeEmail(email);
    const user = findEquipoAmbientalUser(normalized);
    if (!user) {
      return {
        ok: false,
        message: 'Este correo no está habilitado para GreenLog. Verifica el correo o solicita actualización de la matriz de accesos.',
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

    const cooldown = getCooldownRemainingSeconds(normalized);
    if (cooldown > 0) {
      return {
        ok: true,
        pendingEmail: true,
        message: `Ya solicitamos un enlace para este correo. Revisa tu bandeja o intenta nuevamente en ${cooldown} segundos.`,
      };
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: {
        emailRedirectTo: getRedirectUrl(),
        shouldCreateUser: true,
      },
    });

    if (error) {
      const waitSeconds = parseCooldownSeconds(error.message);
      if (waitSeconds) {
        setOtpCooldown(normalized, waitSeconds);
        return {
          ok: true,
          pendingEmail: true,
          message: `Supabase ya envió un enlace recientemente. Revisa tu correo o intenta de nuevo en ${waitSeconds} segundos.`,
        };
      }

      return {
        ok: false,
        message: `No fue posible enviar el enlace de acceso: ${error.message}`,
      };
    }

    setOtpCooldown(normalized);
    window.localStorage.setItem(PENDING_EMAIL_KEY, normalized);
    setCurrentUser(null);
    return {
      ok: true,
      pendingEmail: true,
      message: 'Te enviamos un enlace seguro. Ábrelo desde tu correo para entrar a GreenLog.',
    };
  }, [setUserFromEmail, supabaseEnabled]);

  const logout = useCallback(async () => {
    if (supabaseEnabled) {
      await getSupabaseClient().auth.signOut();
    }
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(PENDING_EMAIL_KEY);
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
