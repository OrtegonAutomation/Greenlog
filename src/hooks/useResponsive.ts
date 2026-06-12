// ============================================================
// useResponsive — breakpoints centralizados para GreenLog
// mobile  : < 640px  (teléfonos)
// tablet  : 640–1023px
// desktop : >= 1024px (layout actual intacto)
// ============================================================
import { useEffect, useState } from 'react';

export const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
} as const;

/** Media queries reutilizables en makeStyles, p. ej. [MEDIA.mobile]: { ... } */
export const MEDIA = {
  mobile: `@media (max-width: ${BREAKPOINTS.mobile - 1}px)`,
  tabletDown: `@media (max-width: ${BREAKPOINTS.tablet - 1}px)`,
  desktop: `@media (min-width: ${BREAKPOINTS.tablet}px)`,
} as const;

const matches = (query: string) =>
  typeof window !== 'undefined' && window.matchMedia(query).matches;

function useMediaQuery(query: string): boolean {
  const [match, setMatch] = useState(() => matches(query));

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatch(e.matches);
    setMatch(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return match;
}

export interface ResponsiveState {
  isMobile: boolean;
  isTabletDown: boolean;
  isDesktop: boolean;
}

export function useResponsive(): ResponsiveState {
  const isMobile = useMediaQuery(`(max-width: ${BREAKPOINTS.mobile - 1}px)`);
  const isTabletDown = useMediaQuery(`(max-width: ${BREAKPOINTS.tablet - 1}px)`);
  return { isMobile, isTabletDown, isDesktop: !isTabletDown };
}
