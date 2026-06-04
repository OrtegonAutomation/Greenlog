import { SeccionApp } from '../types';

const GITHUB_PAGES_BASE = '/Greenlog';

export const SECTION_ROUTES: Record<SeccionApp, string> = {
  dashboard: '/',
  planeacion: '/planeacion',
  ejecucion: '/ejecucion',
  reportes: '/reportes',
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
