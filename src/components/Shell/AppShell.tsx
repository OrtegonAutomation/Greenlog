// ============================================================
// AppShell — Layout principal CENIT (GREENLOG)
// Estética: sidebar oscuro con gradiente, header glassmorphism,
// fondo mesh-gradient, nav pills redondeados
// ============================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  makeStyles, shorthands, tokens, mergeClasses,
  Body1Strong, Caption1, Tooltip, Avatar, Button,
  Popover, PopoverTrigger, PopoverSurface,
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
  ArrowLeftRegular,
  CheckmarkCircleRegular,
  DismissCircleRegular,
  ClipboardTaskRegular,
  ShieldPersonRegular,
} from '@fluentui/react-icons';
import { SeccionApp } from '../../types';
import { Dashboard } from '../Dashboard/Dashboard';
import { PlaneacionModule } from '../Planeacion/PlaneacionModule';
import { EjecucionModule } from '../Ejecucion/EjecucionModule';
import { ReportesModule } from '../Reportes/ReportesModule';
import { AdminModule } from '../Admin/AdminModule';
import { CENIT_COLORS } from '../../theme/cenitTheme';
import { startTour, maybeAutoStartTour } from '../Tour/TourGuide';
import GreenLogBlanco from '../../assets/GreenLog Blanco.png';
import { useAuth } from '../../auth/AuthContext';
import { useNotificaciones } from '../../context/NotificacionesContext';
import { Notificacion } from '../../types';
import { getSectionFromPath, getSectionPath, normalizePath, getActividadParam, clearActividadParam } from '../../utils/appRoutes';
import { MEDIA, useResponsive } from '../../hooks/useResponsive';
import { BottomTabBar, BOTTOM_TAB_BAR_HEIGHT } from './BottomTabBar';

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
    background: 'linear-gradient(135deg, #F6F8FA 0%, #F2F4F6 100%)',
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
  notifWrap: {
    position: 'relative',
    display: 'inline-flex',
  },
  notifBadge: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    minWidth: '16px',
    height: '16px',
    ...shorthands.padding('0', '4px'),
    borderRadius: '999px',
    background: '#e81123',
    color: '#fff',
    fontSize: '10px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    boxShadow: '0 0 0 2px #fff',
    pointerEvents: 'none',
  },
  notifPanel: {
    width: '360px',
    maxWidth: '92vw',
    ...shorthands.padding('0'),
    [MEDIA.mobile]: {
      width: 'calc(100vw - 16px)',
      maxWidth: 'calc(100vw - 16px)',
      borderRadius: '14px',
    },
  },
  notifHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('12px', '16px'),
    ...shorthands.borderBottom('1px', 'solid', 'rgba(0,0,0,0.08)'),
  },
  notifList: {
    maxHeight: '420px',
    overflowY: 'auto',
    [MEDIA.mobile]: {
      maxHeight: '60vh',
      WebkitOverflowScrolling: 'touch',
    },
  },
  notifItem: {
    display: 'flex',
    ...shorthands.gap('10px'),
    ...shorthands.padding('12px', '16px'),
    ...shorthands.borderBottom('1px', 'solid', 'rgba(0,0,0,0.05)'),
    cursor: 'pointer',
    transition: 'background 0.12s ease',
    ':hover': { background: 'rgba(0,51,160,0.04)' },
  },
  notifItemUnread: {
    background: 'rgba(0,51,160,0.06)',
  },
  notifIcon: {
    flexShrink: 0,
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
  },
  notifEmpty: {
    ...shorthands.padding('32px', '16px'),
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
  notifDot: {
    flexShrink: 0,
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: CENIT_COLORS.blueBrand,
    marginTop: '6px',
  },

  content: {
    flex: 1,
    overflowY: 'auto',
    ...shorthands.padding('28px'),
  },
  contentMobile: {
    ...shorthands.padding('16px'),
    paddingBottom: `${BOTTOM_TAB_BAR_HEIGHT + 20}px`,
    WebkitOverflowScrolling: 'touch',
    overflowX: 'hidden',
  },

  // ── Header móvil ──
  headerMobile: {
    minHeight: '56px',
    ...shorthands.padding('0', '14px'),
  },
  mobileLogoWrap: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    minWidth: 0,
  },
  mobileLogo: {
    width: '36px',
    height: '36px',
    flexShrink: 0,
    background: CENIT_COLORS.sidebarGradient,
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('3px'),
  },
  mobileTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: tokens.colorNeutralForeground1,
    letterSpacing: '-0.2px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
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
  { id: 'dashboard', label: 'Inicio', icon: <GridRegular /> },
  { id: 'planeacion', label: 'Planeación', icon: <CalendarLtrRegular /> },
  { id: 'ejecucion', label: 'Ejecución', icon: <PlayCircleRegular /> },
  { id: 'reportes', label: 'Reportes', icon: <DataBarVerticalRegular /> },
  { id: 'administracion', label: 'Administración', icon: <ShieldPersonRegular /> },
];

const BREADCRUMBS: Record<SeccionApp, string> = {
  dashboard: 'Página de Inicio',
  planeacion: 'Planeación Ambiental',
  ejecucion: 'Seguimiento a Ejecución',
  reportes: 'Reportes e Indicadores',
  administracion: 'Administración',
};

// ── Campana de notificaciones ─────────────────────────────────
const fmtFechaRelativa = (iso: string) => {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const dias = Math.floor(h / 24);
  if (dias < 7) return `hace ${dias} d`;
  return d.toLocaleDateString('es-CO');
};

const NotifVisual: React.FC<{ tipo: Notificacion['tipo'] }> = ({ tipo }) => {
  if (tipo === 'revision_aprobada') {
    return <div style={{ background: 'rgba(0,176,80,0.14)', color: '#00803b', width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckmarkCircleRegular /></div>;
  }
  if (tipo === 'revision_rechazada') {
    return <div style={{ background: 'rgba(232,17,35,0.12)', color: '#c50f1f', width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><DismissCircleRegular /></div>;
  }
  return <div style={{ background: 'rgba(0,51,160,0.10)', color: CENIT_COLORS.blueBrand, width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ClipboardTaskRegular /></div>;
};

const NotificacionesBell: React.FC<{
  styles: ReturnType<typeof useStyles>;
  dashboardBg?: string;
  onNavigateActividad: (actividadId?: string) => void;
}> = ({ styles, dashboardBg, onNavigateActividad }) => {
  const { notificaciones, unreadCount, marcarLeida, marcarTodasLeidas } = useNotificaciones();
  const [open, setOpen] = useState(false);

  const handleClick = (n: Notificacion) => {
    if (!n.leida) void marcarLeida(n.id);
    setOpen(false);
    onNavigateActividad(n.actividadId);
  };

  return (
    <Popover open={open} onOpenChange={(_, d) => setOpen(d.open)} positioning="below-end" withArrow>
      <PopoverTrigger disableButtonEnhancement>
        <Tooltip content="Notificaciones" relationship="label">
          <div
            className={styles.notifWrap}
            role="button"
            tabIndex={0}
            aria-label="Notificaciones"
          >
            <div className={styles.iconBtn} style={{ backgroundColor: dashboardBg }}>
              <AlertRegular />
            </div>
            {unreadCount > 0 && (
              <span className={styles.notifBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </div>
        </Tooltip>
      </PopoverTrigger>
      <PopoverSurface className={styles.notifPanel}>
        <div className={styles.notifHeader}>
          <Body1Strong>Notificaciones</Body1Strong>
          {unreadCount > 0 && (
            <Button appearance="transparent" size="small" onClick={() => void marcarTodasLeidas()}>
              Marcar todas como leídas
            </Button>
          )}
        </div>
        <div className={styles.notifList}>
          {notificaciones.length === 0 ? (
            <div className={styles.notifEmpty}>
              <Caption1>No tienes notificaciones.</Caption1>
            </div>
          ) : (
            notificaciones.map(n => (
              <div
                key={n.id}
                className={mergeClasses(styles.notifItem, !n.leida && styles.notifItemUnread)}
                onClick={() => handleClick(n)}
                role="button"
                tabIndex={0}
              >
                <NotifVisual tipo={n.tipo} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Body1Strong style={{ display: 'block', fontSize: '13px' }}>{n.titulo}</Body1Strong>
                  <Caption1 style={{ display: 'block', color: tokens.colorNeutralForeground2 }}>{n.mensaje}</Caption1>
                  {n.actividadTarea && (
                    <Caption1 style={{ display: 'block', color: tokens.colorNeutralForeground3, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {n.actividadTarea}
                    </Caption1>
                  )}
                  <Caption1 style={{ color: tokens.colorNeutralForeground4 }}>{fmtFechaRelativa(n.creadoEn)}</Caption1>
                </div>
                {!n.leida && <div className={styles.notifDot} />}
              </div>
            ))
          )}
        </div>
      </PopoverSurface>
    </Popover>
  );
};

// ── Componente ────────────────────────────────────────────────
interface AppShellProps {
  onBack?: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({ onBack }) => {
  const styles = useStyles();
  const { isMobile } = useResponsive();
  const { currentUser, isAdmin, logout } = useAuth();
  const { pedirAbrirActividad } = useNotificaciones();
  const [seccion, setSeccion] = useState<SeccionApp>(() => getSectionFromPath() ?? 'dashboard');
  const [collapsed, setCollapsed] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onEnter = () => { if (timer.current) clearTimeout(timer.current); setCollapsed(false); };
  const onLeave = () => { timer.current = setTimeout(() => setCollapsed(true), COLLAPSE_DELAY); };

  // Visor puro: solo consulta Inicio y Reportes (salvo que tenga acceso de
  // solo-visualización a Planeación).
  const esVisor = !!currentUser?.visor && !isAdmin;
  const puedeVerPlaneacion = !esVisor || !!currentUser?.verPlaneacion;
  const navItems = NAV_ITEMS.filter(item => {
    if (item.id === 'ejecucion' || item.id === 'administracion') return isAdmin;
    if (item.id === 'planeacion') return puedeVerPlaneacion;
    return true;
  });

  const navigateSection = useCallback((next: SeccionApp, replace = false) => {
    setSeccion(next);
    if (typeof window === 'undefined') return;

    const nextPath = getSectionPath(next);
    if (normalizePath(window.location.pathname) === normalizePath(nextPath)) return;
    window.history[replace ? 'replaceState' : 'pushState'](null, '', nextPath);
  }, []);

  // Disparar tour automático la PRIMERA vez que el usuario abre la app
  useEffect(() => {
    const sectionFromPath = getSectionFromPath();
    if (!sectionFromPath) {
      navigateSection('dashboard', true);
    }

    const onPopState = () => {
      setSeccion(getSectionFromPath() ?? 'dashboard');
    };

    window.addEventListener('popstate', onPopState);
    maybeAutoStartTour(navigateSection, isAdmin, esVisor);
    return () => window.removeEventListener('popstate', onPopState);
  }, [navigateSection]);

  // Guard de rutas por rol: Ejecución y Administración solo admin; Planeación no para visores.
  useEffect(() => {
    if ((seccion === 'ejecucion' || seccion === 'administracion') && !isAdmin) {
      navigateSection('dashboard', true);
    } else if (seccion === 'planeacion' && !puedeVerPlaneacion) {
      navigateSection('reportes', true);
    }
  }, [seccion, isAdmin, esVisor, puedeVerPlaneacion, navigateSection]);

  // Deep-link desde correos (?actividad=<id>): ir a Planeación y abrir el detalle.
  useEffect(() => {
    const actividadId = getActividadParam();
    if (!actividadId) return;
    navigateSection('planeacion');
    pedirAbrirActividad(actividadId);
    clearActividadParam();
  }, [navigateSection, pedirAbrirActividad]);

  const renderContent = () => {
    switch (seccion) {
      case 'dashboard': return <Dashboard onNavigate={navigateSection} />;
      case 'planeacion': return <PlaneacionModule />;
      case 'ejecucion': return isAdmin ? <EjecucionModule /> : <Dashboard onNavigate={navigateSection} />;
      case 'reportes': return <ReportesModule />;
      case 'administracion': return isAdmin ? <AdminModule /> : <Dashboard onNavigate={navigateSection} />;
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

  if (isMobile) {
    return (
      <div className={styles.shell}>
        <main className={styles.main}>
          <header className={mergeClasses(styles.header, styles.headerMobile)}>
            <div className={styles.mobileLogoWrap} onClick={onBack} role={onBack ? 'button' : undefined}>
              <div className={styles.mobileLogo}>
                <img src={GreenLogBlanco} alt="GreenLog" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <span className={styles.mobileTitle}>
                {seccion === 'dashboard' ? 'GreenLog' : BREADCRUMBS[seccion]}
              </span>
            </div>
            <div className={styles.headerRight}>
              <NotificacionesBell
                styles={styles}
                onNavigateActividad={(actividadId) => {
                  navigateSection('planeacion');
                  if (actividadId) pedirAbrirActividad(actividadId);
                }}
              />
              <Avatar name={currentUser?.nombre ?? 'Usuario GreenLog'} color="colorful" size={32} />
              <Button appearance="subtle" size="small" onClick={logout}>
                Salir
              </Button>
            </div>
          </header>
          <div className={mergeClasses(styles.content, styles.contentMobile)}>{renderContent()}</div>
        </main>
        <BottomTabBar seccion={seccion} onNavigate={navigateSection} />
      </div>
    );
  }

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
                  'Control Ambiental'
                )}
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const active = seccion === item.id;
            return (
              <div
                key={item.id}
                id={`nav-${item.id}`}
                className={mergeClasses(styles.navItem, active && styles.navItemActive)}
                onClick={() => navigateSection(item.id)}
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
                onClick={() => startTour(navigateSection, isAdmin, esVisor)}
                style={{ backgroundColor: seccion === 'dashboard' ? 'rgba(255,255,255,0.5)' : undefined }}
              >
                <QuestionCircleRegular />
              </div>
            </Tooltip>
            <NotificacionesBell
              styles={styles}
              dashboardBg={seccion === 'dashboard' ? 'rgba(255,255,255,0.5)' : undefined}
              onNavigateActividad={(actividadId) => {
                navigateSection('planeacion');
                if (actividadId) pedirAbrirActividad(actividadId);
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Avatar name={currentUser?.nombre ?? 'Usuario GreenLog'} color="colorful" size={32} />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: tokens.colorNeutralForeground1 }}>
                  {currentUser?.nombre ?? 'Usuario'}
                </span>
                <span style={{ fontSize: '10px', color: tokens.colorNeutralForeground3 }}>
                  {isAdmin ? 'Admin' : currentUser?.visor ? 'Revisor' : currentUser?.zonaBase ?? 'Ambiental'}
                </span>
              </div>
              <Button appearance="subtle" size="small" onClick={logout}>
                Salir
              </Button>
            </div>
          </div>
        </header>
        <div className={styles.content}>{renderContent()}</div>
      </main>
    </div >
  );
};
