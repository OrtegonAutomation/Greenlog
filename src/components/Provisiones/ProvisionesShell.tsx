// ============================================================
// ProvisionesShell — Layout principal Provisiones Ambientales
// Sidebar idéntico en estilo a AppShell, con sus propias secciones
// ============================================================
import React, { useRef, useState } from 'react';
import {
  makeStyles, shorthands, tokens, mergeClasses,
  Body1Strong, Caption1, Tooltip, Avatar,
} from '@fluentui/react-components';
import {
  GridRegular,
  DocumentBulletListRegular,
  LeafOneRegular,
  CalculatorRegular,
  ChartMultipleRegular,
  AlertRegular,
  QuestionCircleRegular,
  ArrowLeftRegular,
} from '@fluentui/react-icons';
import { SeccionProvisiones, BREADCRUMBS_PROVISIONES } from '../../types/provisiones';
import { CENIT_COLORS } from '../../theme/cenitTheme';
import GreenLogBlanco from '../../assets/GreenLog Blanco.png';
import { ProvisionesDashboard } from './Dashboard/ProvisionesDashboard';
import { ObligacionesModule } from './Obligaciones/ObligacionesModule';
import { CompensacionesModule } from './Compensaciones/CompensacionesModule';
import { PxQModule } from './PxQ/PxQModule';
import { SeguimientoModule } from './Seguimiento/SeguimientoModule';

// ── Layout ────────────────────────────────────────────────────
const SIDEBAR_EXPANDED = 256;
const SIDEBAR_COLLAPSED = 72;
const COLLAPSE_DELAY = 300;

// ── Estilos ───────────────────────────────────────────────────
const useStyles = makeStyles({
  shell: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #F0F6FF 0%, #F4FCE3 100%)',
  },

  // ── Sidebar ──────────────────────────────────────────────────
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    background: CENIT_COLORS.sidebarGradient,
    color: '#fff',
    flexShrink: 0,
    overflow: 'hidden',
    transition: 'width 0.3s cubic-bezier(0.16,1,0.3,1)',
    ...shorthands.borderRight('1px', 'solid', 'rgba(255,255,255,0.06)'),
    boxShadow: '6px 0 32px rgba(0,0,0,0.18)',
    zIndex: 20,
    animationName: {
      from: { transform: 'translateX(-100%)', opacity: '0' },
      to: { transform: 'translateX(0)', opacity: '1' },
    },
    animationDuration: '0.45s',
    animationFillMode: 'both',
    animationTimingFunction: 'cubic-bezier(0.16,1,0.3,1)',
  },
  sidebarExpanded: { width: `${SIDEBAR_EXPANDED}px` },
  sidebarCollapsed: { width: `${SIDEBAR_COLLAPSED}px` },

  logoArea: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    ...shorthands.padding('20px', '8px', '18px'),
    ...shorthands.borderBottom('1px', 'solid', 'rgba(255,255,255,0.07)'),
    minHeight: '68px',
    overflow: 'hidden',
    flexShrink: 0,
  },
  logoIcon: {
    width: '60px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: '#fff',
    transition: 'all 0.3s ease',
  },
  logoText: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    animationName: {
      from: { opacity: '0', transform: 'translateX(-10px)' },
      to: { opacity: '1', transform: 'translateX(0)' },
    },
    animationDuration: '0.25s',
    animationFillMode: 'both',
  },
  logoTitle: { fontSize: '16px', fontWeight: '800', color: '#fff', lineHeight: '1.1', letterSpacing: '-0.3px' },
  logoSub: { fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' },

  nav: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.padding('10px', '10px'),
    ...shorthands.gap('2px'),
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    ...shorthands.padding('10px', '12px'),
    borderRadius: '12px',
    cursor: 'pointer',
    color: 'rgba(255,255,255,0.62)',
    fontSize: '14px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    transition: 'background 0.18s ease, color 0.18s ease, transform 0.18s cubic-bezier(0.16,1,0.3,1)',
    userSelect: 'none',
    ':hover': {
      background: 'rgba(255,255,255,0.09)',
      color: 'rgba(255,255,255,0.92)',
      transform: 'translateX(3px)',
    },
  },
  navItemActive: {
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    fontWeight: '600',
    ':hover': {
      background: 'rgba(22,163,74,0.26)',
      transform: 'translateX(0)',
    },
  },
  navIcon: { flexShrink: 0, fontSize: '19px', color: 'inherit' },
  navLabel: {
    ...shorthands.flex(1),
    fontSize: '14px',
    fontWeight: '500',
    letterSpacing: '0.3px',
  },
  navBadge: {
    flexShrink: 0,
    fontSize: '9px',
    fontWeight: '700',
    letterSpacing: '0.04em',
    ...shorthands.padding('2px', '7px'),
    borderRadius: '20px',
    background: 'rgba(255,255,255,0.10)',
    color: 'rgba(255,255,255,0.45)',
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.13)'),
  },
  activeIndicator: {
    width: '4px',
    height: '16px',
    borderRadius: '4px',
    backgroundColor: '#4ade80',
    marginLeft: 'auto',
  },

  sidebarFooter: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('24px'),
    ...shorthands.borderTop('1px', 'solid', 'rgba(255,255,255,0.1)'),
  },

  // ── Main ─────────────────────────────────────────────────────
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    overflow: 'hidden',
    animationName: {
      from: { opacity: '0' },
      to: { opacity: '1' },
    },
    animationDuration: '0.4s',
    animationDelay: '0.15s',
    animationFillMode: 'both',
  },

  // Header glassmorphism
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('0', '28px'),
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    backgroundColor: 'rgba(255,255,255,0.80)',
    ...shorthands.borderBottom('1px', 'solid', 'rgba(255,255,255,0.65)'),
    boxShadow: '0 2px 24px rgba(0,0,0,0.05)',
    minHeight: '60px',
    flexShrink: 0,
    zIndex: 10,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('10px'),
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('6px'),
  },
  iconBtn: {
    width: '38px',
    height: '38px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
    cursor: 'pointer',
    color: tokens.colorNeutralForeground2,
    transition: 'background 0.15s ease, transform 0.15s ease',
    ':hover': {
      background: 'rgba(0,0,0,0.05)',
      transform: 'scale(1.08)',
      color: tokens.colorNeutralForeground1,
    },
    ':active': { transform: 'scale(0.94)' },
  },

  content: {
    flex: 1,
    overflowY: 'auto',
    ...shorthands.padding('28px'),
  },
});

// ── Items de navegación ───────────────────────────────────────
interface NavItemDef {
  id: SeccionProvisiones;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

const NAV_ITEMS: NavItemDef[] = [
  { id: 'dashboard',       label: 'Dashboard',       icon: <GridRegular /> },
  { id: 'obligaciones',    label: 'Obligaciones',    icon: <DocumentBulletListRegular /> },
  { id: 'compensaciones',  label: 'Compensaciones',  icon: <LeafOneRegular /> },
  { id: 'pxq',             label: 'PxQ / Estimaciones', icon: <CalculatorRegular /> },
  { id: 'seguimiento',     label: 'Seguimiento',     icon: <ChartMultipleRegular /> },
];

// ── Componente ────────────────────────────────────────────────
interface ProvisionesShellProps {
  onBack?: () => void;
}

export const ProvisionesShell: React.FC<ProvisionesShellProps> = ({ onBack }) => {
  const styles = useStyles();
  const [seccion, setSeccion] = useState<SeccionProvisiones>('dashboard');
  const [collapsed, setCollapsed] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onEnter = () => { if (timer.current) clearTimeout(timer.current); setCollapsed(false); };
  const onLeave = () => { timer.current = setTimeout(() => setCollapsed(true), COLLAPSE_DELAY); };

  const renderContent = () => {
    switch (seccion) {
      case 'dashboard':      return <ProvisionesDashboard onNavigate={setSeccion} />;
      case 'obligaciones':   return <ObligacionesModule />;
      case 'compensaciones': return <CompensacionesModule />;
      case 'pxq':            return <PxQModule />;
      case 'seguimiento':    return <SeguimientoModule />;
      default:               return null;
    }
  };

  return (
    <div className={styles.shell}>
      <aside
        className={mergeClasses(styles.sidebar, collapsed ? styles.sidebarCollapsed : styles.sidebarExpanded)}
        id="provisiones-sidebar"
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        {/* Logo Area */}
        <div className={styles.logoArea}>
          <div
            className={styles.logoIcon}
            style={{
              width: collapsed ? '50px' : '64px',
              height: collapsed ? '50px' : '64px',
              cursor: onBack ? 'pointer' : undefined,
            }}
            onClick={onBack}
            title={onBack ? 'Volver al inicio' : undefined}
          >
            <img src={GreenLogBlanco} alt="GreenLog Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          {!collapsed && (
            <div className={styles.logoText}>
              <span className={styles.logoTitle}>GREENLOG</span>
              <span className={styles.logoSub} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {onBack ? (
                  <span
                    onClick={onBack}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <ArrowLeftRegular style={{ fontSize: '12px' }} />
                    Cambiar módulo
                  </span>
                ) : (
                  'Provisiones Ambientales'
                )}
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const active = seccion === item.id;
            return (
              <div
                key={item.id}
                id={`prov-nav-${item.id}`}
                className={mergeClasses(styles.navItem, active && styles.navItemActive)}
                onClick={() => setSeccion(item.id)}
                role="button"
                tabIndex={0}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {!collapsed && (
                  <>
                    <span className={styles.navLabel}>{item.label}</span>
                    {item.badge && <span className={styles.navBadge}>{item.badge}</span>}
                  </>
                )}
                {active && <div className={styles.activeIndicator} />}
              </div>
            );
          })}
        </nav>

        {/* Cenit Logo Footer */}
        <div className={styles.sidebarFooter}>
          <img
            src="https://cenit-transporte.com/wp-content/uploads/2025/10/cobranding-en-blanco.png"
            alt="Cenit Logo"
            style={{
              width: collapsed ? '40px' : '140px',
              opacity: 0.9,
              transition: 'all 0.3s ease',
              objectFit: 'contain'
            }}
          />
        </div>
      </aside>

      {/* ── Main ── */}
      <main className={styles.main}>
        <header
          className={styles.header}
          style={{
            background: seccion === 'dashboard' ? 'transparent' : undefined,
            borderBottom: seccion === 'dashboard' ? 'none' : undefined,
            boxShadow: seccion === 'dashboard' ? 'none' : undefined,
          }}
        >
          <div className={styles.headerLeft}>
            {seccion !== 'dashboard' && (
              <span style={{ fontSize: '18px', fontWeight: '700', color: tokens.colorNeutralForeground1 }}>
                {BREADCRUMBS_PROVISIONES[seccion]}
              </span>
            )}
          </div>
          <div className={styles.headerRight}>
            <Tooltip content="Notificaciones" relationship="label">
              <div
                className={styles.iconBtn}
                role="button"
                tabIndex={0}
                aria-label="Notificaciones"
                style={{ backgroundColor: seccion === 'dashboard' ? 'rgba(255,255,255,0.5)' : undefined }}
              >
                <AlertRegular />
              </div>
            </Tooltip>
            <Avatar name="Camilo Ortegón" color="colorful" size={32} />
          </div>
        </header>
        <div className={styles.content}>{renderContent()}</div>
      </main>
    </div>
  );
};
