// ============================================================
// BottomTabBar — navegación inferior tipo app nativa (móvil)
// Fondo: gradiente sidebar CENIT; tab activo en verde #8CC63F
// ============================================================
import React from 'react';
import { makeStyles, mergeClasses } from '@fluentui/react-components';
import {
  GridRegular, GridFilled,
  CalendarLtrRegular, CalendarLtrFilled,
  PlayCircleRegular, PlayCircleFilled,
  DataBarVerticalRegular, DataBarVerticalFilled,
} from '@fluentui/react-icons';
import { SeccionApp } from '../../types';
import { CENIT_COLORS } from '../../theme/cenitTheme';

const useStyles = makeStyles({
  bar: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
    display: 'flex',
    alignItems: 'stretch',
    background: CENIT_COLORS.sidebarGradient,
    borderTop: '1px solid rgba(255,255,255,0.10)',
    boxShadow: '0 -4px 24px rgba(0,0,0,0.22)',
    paddingBottom: 'env(safe-area-inset-bottom)',
  },
  tab: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '3px',
    minHeight: '56px',
    cursor: 'pointer',
    color: 'rgba(255,255,255,0.60)',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    transition: 'color 0.18s ease, transform 0.12s ease',
    ':active': { transform: 'scale(0.94)' },
  },
  tabActive: {
    color: CENIT_COLORS.green,
  },
  icon: { fontSize: '22px', lineHeight: 1 },
  label: { fontSize: '10px', fontWeight: '600', letterSpacing: '0.02em' },
});

interface TabDef {
  id: SeccionApp;
  label: string;
  icon: React.ReactNode;
  iconActive: React.ReactNode;
}

const TABS: TabDef[] = [
  { id: 'dashboard', label: 'Inicio', icon: <GridRegular />, iconActive: <GridFilled /> },
  { id: 'planeacion', label: 'Planeación', icon: <CalendarLtrRegular />, iconActive: <CalendarLtrFilled /> },
  { id: 'ejecucion', label: 'Ejecución', icon: <PlayCircleRegular />, iconActive: <PlayCircleFilled /> },
  { id: 'reportes', label: 'Reportes', icon: <DataBarVerticalRegular />, iconActive: <DataBarVerticalFilled /> },
];

export const BOTTOM_TAB_BAR_HEIGHT = 56;

export const BottomTabBar: React.FC<{
  seccion: SeccionApp;
  onNavigate: (s: SeccionApp) => void;
}> = ({ seccion, onNavigate }) => {
  const styles = useStyles();
  return (
    <nav className={styles.bar} aria-label="Navegación principal">
      {TABS.map(tab => {
        const active = seccion === tab.id;
        return (
          <div
            key={tab.id}
            className={mergeClasses(styles.tab, active && styles.tabActive)}
            role="button"
            tabIndex={0}
            aria-current={active ? 'page' : undefined}
            onClick={() => onNavigate(tab.id)}
          >
            <span className={styles.icon}>{active ? tab.iconActive : tab.icon}</span>
            <span className={styles.label}>{tab.label}</span>
          </div>
        );
      })}
    </nav>
  );
};
