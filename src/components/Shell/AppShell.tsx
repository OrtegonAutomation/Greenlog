// ============================================================
// AppShell — Layout principal CENIT (GREENLOG)
// Estética: sidebar oscuro con gradiente, header glassmorphism,
// fondo mesh-gradient, nav pills redondeados
// ============================================================
import React, { useRef, useState } from 'react';
import {
  makeStyles, shorthands, tokens, mergeClasses,
  Body1Strong, Caption1, Tooltip, Avatar,
} from '@fluentui/react-components';
import {
  GridRegular,
  CalendarLtrRegular,
  PlayCircleRegular,
  DataBarVerticalRegular,
  NavigationRegular,
  LeafOneRegular,
  AlertRegular,
  QuestionCircleRegular,
} from '@fluentui/react-icons';
import { SeccionApp } from '../../types';
import { Dashboard } from '../Dashboard/Dashboard';
import { PlaneacionModule } from '../Planeacion/PlaneacionModule';
import { EjecucionModule } from '../Ejecucion/EjecucionModule';
import { ReportesModule } from '../Reportes/ReportesModule';
import { CENIT_COLORS } from '../../theme/cenitTheme';
import { startTour } from '../Tour/TourGuide';
import GreenLogBlanco from '../../assets/GreenLog Blanco.png';

// ... (existing code)



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
    // Removed white background, borderRadius and shadow as requested
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
  navSection: {
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '0.10em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.28)',
    ...shorthands.padding('14px', '10px', '5px'),
    whiteSpace: 'nowrap',
    overflow: 'hidden',
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
  navItemAccent: {
    position: 'relative',
    '::before': {
      content: '""',
      position: 'absolute',
      left: '-10px',
      top: '20%',
      bottom: '20%',
      width: '3px',
      borderRadius: '0 4px 4px 0',
      background: CENIT_COLORS.green,
    },
  },
  navIcon: { flexShrink: 0, fontSize: '19px', color: 'inherit' },
  navText: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' },
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

  userSection: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('10px'),
    ...shorthands.padding('14px', '14px'),
    ...shorthands.borderTop('1px', 'solid', 'rgba(255,255,255,0.07)'),
    overflow: 'hidden',
    flexShrink: 0,
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flex: 1,
    whiteSpace: 'nowrap',
  },
  userName: { fontSize: '13px', fontWeight: '600', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis' },
  userEmail: { fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis' },
  onlineDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#22c55e',
    flexShrink: 0,
    boxShadow: '0 0 0 2px rgba(34,197,94,0.3)',
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
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('6px'),
    fontSize: '14px',
  },
  breadcrumbRoot: { color: tokens.colorNeutralForeground4 },
  breadcrumbSep: { color: tokens.colorNeutralForeground4, opacity: '0.4', fontSize: '16px' },
  breadcrumbCurrent: { fontWeight: '700', color: tokens.colorNeutralForeground1 },
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

  // ── Branding & Footer ──
  sidebarFooter: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('24px'),
    ...shorthands.borderTop('1px', 'solid', 'rgba(255,255,255,0.1)'),
  },

  // ── Nav Styles ──
  navLabel: {
    ...shorthands.flex(1),
    fontSize: '14px',
    fontWeight: '500',
    letterSpacing: '0.3px',
  },
  activeIndicator: {
    width: '4px',
    height: '16px',
    borderRadius: '4px',
    backgroundColor: '#4ade80', // Green accent
    marginLeft: 'auto',
  },

  // Coming soon
  comingSoon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: '400px',
    animationName: {
      from: { opacity: '0', transform: 'translateY(16px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    },
    animationDuration: '0.4s',
    animationFillMode: 'both',
  },
  comingSoonCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    ...shorthands.padding('52px', '64px'),
    background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(16px)',
    borderRadius: '24px',
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.9)'),
    boxShadow: '0 8px 40px rgba(0,0,0,0.06)',
    textAlign: 'center' as const,
  },
  comingSoonIcon: {
    fontSize: '52px',
    color: CENIT_COLORS.green,
    opacity: '0.35',
  },
});

// ── Items de navegación ───────────────────────────────────────
interface NavItemDef { id: SeccionApp; label: string; icon: React.ReactNode; badge?: string; }

const NAV_ITEMS: NavItemDef[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <GridRegular /> },
  { id: 'planeacion', label: 'Planeación', icon: <CalendarLtrRegular /> },
  { id: 'ejecucion', label: 'Ejecución', icon: <PlayCircleRegular /> },
  { id: 'reportes', label: 'Reportes', icon: <DataBarVerticalRegular /> },
];

const BREADCRUMBS: Record<SeccionApp, string> = {
  dashboard: 'Dashboard',
  planeacion: 'Planeación Ambiental',
  ejecucion: 'Seguimiento a Ejecución',
  reportes: 'Reportes e Indicadores',
};

// ── Componente ────────────────────────────────────────────────
export const AppShell: React.FC = () => {
  const styles = useStyles();
  const [seccion, setSeccion] = useState<SeccionApp>('dashboard');
  const [collapsed, setCollapsed] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onEnter = () => { if (timer.current) clearTimeout(timer.current); setCollapsed(false); };
  const onLeave = () => { timer.current = setTimeout(() => setCollapsed(true), COLLAPSE_DELAY); };

  const renderContent = () => {
    switch (seccion) {
      case 'dashboard': return <Dashboard onNavigate={setSeccion} />;
      case 'planeacion': return <PlaneacionModule />;
      case 'ejecucion': return <EjecucionModule />;
      case 'reportes': return <ReportesModule />;
      default: return (
        <div className={styles.comingSoon}>
          <div className={styles.comingSoonCard}>
            <DataBarVerticalRegular className={styles.comingSoonIcon} />
            <Body1Strong style={{ fontSize: '18px' }}>{BREADCRUMBS[seccion]}</Body1Strong>
            <Caption1 style={{ color: tokens.colorNeutralForeground3, maxWidth: '280px' }}>
              Este módulo estará disponible en la siguiente fase del proyecto CENIT.
            </Caption1>
          </div>
        </div>
      );
    }
  };

  return (
    <div className={styles.shell}>
      <aside
        className={mergeClasses(styles.sidebar, collapsed ? styles.sidebarCollapsed : styles.sidebarExpanded)}
        id="app-sidebar"
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        {/* Logo Area */}
        <div className={styles.logoArea} id="sidebar-logo">
          <div
            className={styles.logoIcon}
            style={{
              width: collapsed ? '50px' : '64px',
              height: collapsed ? '50px' : '64px',
            }}
          >
            <img src={GreenLogBlanco} alt="GreenLog Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          {!collapsed && (
            <div className={styles.logoText}>
              <span className={styles.logoTitle}>GREENLOG</span>
              <span className={styles.logoSub}>Control Ambiental</span>
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
                id={`nav-${item.id}`}
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
                {BREADCRUMBS[seccion]}
              </span>
            )}
          </div>
          <div className={styles.headerRight}>
            <Tooltip content="Ayuda / Tour" relationship="label">
              <div
                className={styles.iconBtn}
                id="tour-trigger"
                role="button"
                tabIndex={0}
                aria-label="Iniciar Tour"
                onClick={() => startTour(setSeccion)}
                style={{ backgroundColor: seccion === 'dashboard' ? 'rgba(255,255,255,0.5)' : undefined }}
              >
                <QuestionCircleRegular />
              </div>
            </Tooltip>
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
            {/* Avatar sin label para ser más minimalista */}
            <Avatar name="Camilo Ortegón" color="colorful" size={32} />
          </div>
        </header>
        <div className={styles.content}>{renderContent()}</div>
      </main>
    </div >
  );
};
