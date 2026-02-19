import React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { EstadoActividad, Prioridad } from '../../types';
import { CENIT_COLORS } from '../../theme/cenitTheme';

// ── Estilos ──────────────────────────────────────────────────
const useStyles = makeStyles({
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.gap('6px'),
    ...shorthands.padding('4px', '12px'),
    ...shorthands.borderRadius(tokens.borderRadiusCircular),
    fontSize: '12px',
    fontWeight: '600',
    lineHeight: '1.4',
    whiteSpace: 'nowrap',
    letterSpacing: '0.01em',
  },
  dot: {
    width: '7px',
    height: '7px',
    ...shorthands.borderRadius('50%'),
    flexShrink: 0,
  },
  // Animación de pulso para "En Ejecución"
  dotPulse: {
    animationName: {
      '0%':   { boxShadow: `0 0 0 0 ${CENIT_COLORS.orange}99` },
      '70%':  { boxShadow: `0 0 0 7px ${CENIT_COLORS.orange}00` },
      '100%': { boxShadow: `0 0 0 0 ${CENIT_COLORS.orange}00` },
    },
    animationDuration: '2s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'ease-out',
  },
  // Prioridad badge (más compacto)
  prioridad: {
    ...shorthands.padding('2px', '8px'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    fontSize: '11px',
    fontWeight: '600',
  },
});

// ── Configuración de estilos por estado ──────────────────────
const ESTADO_CONFIG: Record<EstadoActividad, { bg: string; color: string; dotColor: string; pulse: boolean }> = {
  'Planeada':             { bg: '#dbeafe', color: '#1d4ed8', dotColor: '#3b82f6', pulse: false },
  'En Ejecución':         { bg: '#fef3c7', color: '#92400e', dotColor: '#f59e0b', pulse: true  },
  'Cerrada':              { bg: '#dcfce7', color: '#14532d', dotColor: '#16a34a', pulse: false },
  'Pendiente Aprobación': { bg: '#ede9fe', color: '#5b21b6', dotColor: '#7c3aed', pulse: false },
};

const PRIORIDAD_CONFIG: Record<Prioridad, { bg: string; color: string }> = {
  Alta:  { bg: '#fee2e2', color: '#991b1b' },
  Media: { bg: '#fef3c7', color: '#92400e' },
  Baja:  { bg: '#f3f4f6', color: '#374151' },
};

// ── Componentes ───────────────────────────────────────────────
interface StatusBadgeProps { estado: EstadoActividad; }

export const StatusBadge: React.FC<StatusBadgeProps> = ({ estado }) => {
  const styles = useStyles();
  const cfg = ESTADO_CONFIG[estado];

  return (
    <span className={styles.badge} style={{ background: cfg.bg, color: cfg.color }}>
      <span
        className={`${styles.dot}${cfg.pulse ? ` ${styles.dotPulse}` : ''}`}
        style={{ background: cfg.dotColor }}
      />
      {estado}
    </span>
  );
};

interface PrioridadBadgeProps { prioridad: Prioridad; }

export const PrioridadBadge: React.FC<PrioridadBadgeProps> = ({ prioridad }) => {
  const styles = useStyles();
  const cfg = PRIORIDAD_CONFIG[prioridad];
  return (
    <span className={styles.prioridad} style={{ background: cfg.bg, color: cfg.color }}>
      {prioridad}
    </span>
  );
};
