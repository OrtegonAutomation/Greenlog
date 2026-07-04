import { SeccionApp } from '../types';

const GITHUB_PAGES_BASE = '/Greenlog';

export const SECTION_ROUTES: Record<SeccionApp, string> = {
  dashboard: '/',
  planeacion: '/planeacion',
  ejecucion: '/ejecucion',
  reportes: '/reportes',
  administracion: '/administracion',
};

const ROUTE_SECTIONS = Object.entries(SECTION_ROUTES).reduce<Record<string, SeccionApp>>((acc, [section, route]) => {
  acc[route] = section as SeccionApp;
  return acc;
}, {});

export const normalizePath = (path: string) => path.replace(/\/+$/, '').toLowerCase() || '/';

export const getBasePath = () => {
  if (typeof window === 'undefined') return '';
  return window.location.pathname.toLowerCase().startsWith('/greenlog') ? GITHUB_PAGES_BASE : '';
};

export const buildAppPath = (route: string) => {
  const basePath = getBasePath();
  if (route === '/') return basePath ? `${basePath}/` : '/';
  return `${basePath}${route}`;
};

export const getLoginPath = () => buildAppPath('/login');

export const getSectionPath = (section: SeccionApp) => buildAppPath(SECTION_ROUTES[section]);

export const getSectionFromPath = (path = typeof window === 'undefined' ? '/' : window.location.pathname) => {
  const basePath = getBasePath().toLowerCase();
  let route = path.toLowerCase();
  if (basePath && route.startsWith(basePath)) {
    route = route.slice(basePath.length) || '/';
  }

  route = normalizePath(route);
  return ROUTE_SECTIONS[route] ?? null;
};

export const isLoginPath = (path = typeof window === 'undefined' ? '/' : window.location.pathname) =>
  normalizePath(path) === normalizePath(getLoginPath());

/** Lee el id de actividad de la URL (?actividad=<id>), usado por el deep-link de los correos. */
export const getActividadParam = () => {
  if (typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get('actividad');
  return value && value.trim() ? value.trim() : null;
};

/** Elimina ?actividad= de la URL sin recargar (tras consumirlo). */
export const clearActividadParam = () => {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has('actividad')) return;
  url.searchParams.delete('actividad');
  window.history.replaceState(null, '', url.pathname + url.search + url.hash);
};
