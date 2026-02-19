import React, { useEffect, useRef, useState } from 'react';
import { makeStyles, shorthands, tokens, Caption1, Body1Strong } from '@fluentui/react-components';

// ── Hook de contador animado ──────────────────────────────────
function useCountUp(target: number, duration = 900, delay = 0): number {
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    const timeout = setTimeout(() => {
      started.current = true;
      const startTime = Date.now();
      const tick = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, duration, delay]);

  return count;
}

// ── Estilos ───────────────────────────────────────────────────
const useStyles = makeStyles({
  card: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('10px'),
    ...shorthands.padding('22px', '22px', '20px'),
    borderRadius: '20px',
    // Sin borde duro — glassmorphism suave
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.85)'),
    background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(16px) saturate(160%)',
    WebkitBackdropFilter: 'blur(16px) saturate(160%)',
    cursor: 'default',
    position: 'relative',
    overflow: 'hidden',
    transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s cubic-bezier(0.16,1,0.3,1)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
    animationName: {
      from: { opacity: '0', transform: 'translateY(20px) scale(0.97)' },
      to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
    },
    animationDuration: '0.5s',
    animationFillMode: 'both',
    animationTimingFunction: 'cubic-bezier(0.16,1,0.3,1)',
    ':hover': {
      transform: 'translateY(-5px) scale(1.01)',
      boxShadow: '0 16px 48px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.06)',
    },
  },
  // Barra de color en la parte superior de la tarjeta
  colorBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    borderRadius: '20px 20px 0 0',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: '4px',
  },
  iconBox: {
    width: '46px',
    height: '46px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '14px',
    fontSize: '21px',
    // Sombra coloreada del ícono
    transition: 'transform 0.2s ease',
    ':hover': { transform: 'scale(1.08) rotate(-4deg)' },
  },
  number: {
    fontSize: '38px',
    fontWeight: '800',
    lineHeight: '1',
    color: tokens.colorNeutralForeground1,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-1px',
  },
  label: {
    color: tokens.colorNeutralForeground3,
    fontSize: '13px',
    fontWeight: '500',
    letterSpacing: '0.01em',
  },
  progressTrack: {
    height: '5px',
    borderRadius: '3px',
    backgroundColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
    marginTop: '4px',
  },
  progressBar: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 1.1s cubic-bezier(0.16,1,0.3,1)',
  },
  trend: {
    fontSize: '11px',
    fontWeight: '700',
    ...shorthands.padding('3px', '8px'),
    borderRadius: '20px',
  },
});

export interface KPICardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  progressValue?: number;   // 0-100
  progressColor?: string;
  trend?: string;
  trendUp?: boolean;
  animDelay?: number;       // ms para el stagger
  suffix?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  label, value, icon, iconBg, iconColor,
  progressValue, progressColor = '#1CB322',
  trend, trendUp, animDelay = 0, suffix = '',
}) => {
  const styles = useStyles();
  const animated = useCountUp(value, 900, animDelay + 200);
  const [progVisible, setProgVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setProgVisible(true), animDelay + 400);
    return () => clearTimeout(t);
  }, [animDelay]);

  return (
    <div className={styles.card} style={{ animationDelay: `${animDelay}ms` }}>
      {/* Barra de color superior */}
      <div className={styles.colorBar} style={{ background: progressColor }} />

      <div className={styles.header}>
        <div
          className={styles.iconBox}
          style={{
            background: iconBg,
            color: iconColor,
            boxShadow: `0 4px 12px ${iconBg}cc`,
          }}
        >
          {icon}
        </div>
        {trend && (
          <span
            className={styles.trend}
            style={{
              background: trendUp ? '#dcfce7' : '#fee2e2',
              color:      trendUp ? '#15803d' : '#dc2626',
            }}
          >
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>

      <div className={styles.number}>{animated}{suffix}</div>
      <Caption1 className={styles.label}>{label}</Caption1>

      {progressValue !== undefined && (
        <div className={styles.progressTrack}>
          <div
            className={styles.progressBar}
            style={{
              width: progVisible ? `${Math.min(progressValue, 100)}%` : '0%',
              background: progressColor,
            }}
          />
        </div>
      )}
    </div>
  );
};
