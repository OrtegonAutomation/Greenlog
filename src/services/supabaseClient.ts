import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const DATA_SOURCE = import.meta.env.VITE_GREENLOG_DATA_SOURCE ?? 'mock';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
const GREENLOG_AUTH_EMAIL_STORAGE_KEY = 'greenlog-auth-email';

let client: SupabaseClient | null = null;
let clientEmail = '';

export const isSupabaseEnabled = () => DATA_SOURCE === 'supabase';

export const getSupabaseClient = () => {
  if (!isSupabaseEnabled()) {
    throw new Error('Supabase no esta habilitado para este build.');
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY.');
  }

  const email = typeof window === 'undefined'
    ? ''
    : (window.localStorage.getItem(GREENLOG_AUTH_EMAIL_STORAGE_KEY) ?? '').trim().toLowerCase();

  if (!client || clientEmail !== email) {
    clientEmail = email;
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: email ? { 'x-greenlog-email': email } : {},
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return client;
};
