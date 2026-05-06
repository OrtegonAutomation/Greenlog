// ============================================================
// Dashboard — Provisiones Ambientales
// KPIs + Visualizaciones CSS puro + FeatureCards
// ============================================================
import React, { useMemo } from 'react';
import {
  makeStyles, shorthands, tokens,
  Title2, Title3, Body1, Caption1,
  Card, CardHeader, Button,
} from '@fluentui/react-components';
import {
  DocumentBulletListRegular,
  LeafOneRegular,
  CalculatorRegular,
  ChartMultipleRegular,
  ArrowTrendingLinesRegular,
  MoneyRegular,
  ShieldCheckmarkRegular,
  WarningRegular,
} from '@fluentui/react-icons';
import { useProvisiones } from '../../../hooks/useProvisiones';
import { useCompensaciones } from '../../../hooks/useCompensaciones';
import { CENIT_COLORS } from '../../../theme/cenitTheme';
import { SeccionProvisiones, EstadoProvision } from '../../../types/provisiones';
import { FeatureCard } from '../../common/FeatureCard';

const fmtCOP = (n: number) => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  return `$${n.toLocaleString('es-CO')}`;
};

const ESTADO_COLORS: Record<EstadoProvision, string> = {
  'Notificada': '#94a3b8',
  'ID Generado': '#60a5fa',
  'En Estimación': '#818cf8',
  'Solicitud Enviada': '#f59e0b',
  'En Revisión Operaciones': '#fb923c',
  'Recursos Asignados': '#34d399',
  'En Ejecución': CENIT_COLORS.blueBrand,
  'En Facturación': '#a78bfa',
  'Cerrada': '#22c55e',
};

const ZONA_COLORS: Record<string, string> = {
  'Occidente': '#3b82f6',
  'Centro': '#10b981',
  'Oriente': '#f59e0b',
  'Llanos': '#ef4444',
  'CLC': '#8b5cf6',
  'Norte': '#06b6d4',
  'Coveñas': '#ec4899',
};

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalL),
    animationName: {
      from: { opacity: '0', transform: 'translateY(10px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    },
    animationDuration: '0.4s',
    animationFillMode: 'both',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    ...shorthands.gap(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    background: 'linear-gradient(90deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 100%)',
    backdropFilter: 'blur(10px)',
    ...shorthands.padding('24px'),
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
    marginBottom: tokens.spacingVerticalL,
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.5)'),
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
  },
  subtitle: {
    color: tokens.colorNeutralForeground2,
  },

  // KPI Grid
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    ...shorthands.gap(tokens.spacingHorizontalL),
  },
  kpiCard: {
    ...shorthands.padding(tokens.spacingVerticalL),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    position: 'relative',
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(12px)',
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.8)'),
    borderRadius: '16px',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
      background: 'rgba(255,255,255,0.9)',
    },
  },
  kpiIconWrap: {
    ...shorthands.padding('12px'),
    borderRadius: '12px',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    fontSize: '36px',
    fontWeight: '800',
    color: '#003057',
    lineHeight: '1',
    marginBottom: '4px',
  },
  kpiLabel: {
    color: tokens.colorNeutralForeground2,
    fontSize: '14px',
    fontWeight: '500',
  },

  // Charts
  chartContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    ...shorthands.gap(tokens.spacingHorizontalL),
    marginTop: tokens.spacingVerticalL,
  },
  chartCard: {
    ...shorthands.padding('24px'),
    background: 'rgba(255,255,255,0.6)',
    backdropFilter: 'blur(12px)',
    borderRadius: '20px',
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.5)'),
    boxShadow: '0 4px 24px rgba(0,0,0,0.02)',
  },
  barChart: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalM),
    marginTop: tokens.spacingVerticalL,
  },
  barRow: {
    display: 'flex',
    alignItems: 'center',
  },
  barLabel: {
    width: '110px',
    fontSize: '13px',
    fontWeight: '500',
    color: tokens.colorNeutralForeground1,
    flexShrink: 0,
  },
  barTrack: {
    flex: 1,
    height: '12px',
    background: 'rgba(0,0,0,0.04)',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: '8px',
    color: 'white',
    fontSize: '10px',
    fontWeight: '700',
    transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
  },
  barCount: {
    width: '40px',
    textAlign: 'right' as const,
    fontWeight: '600',
    fontSize: '12px',
  },

  // Donut
  donutWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('20px', '0'),
  },
  donutChart: {
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    position: 'relative',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
  },
  donutHole: {
    width: '130px',
    height: '130px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.95)',
    position: 'absolute',
    top: '35px',
    left: '35px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)',
  },
  donutLegend: {
    display: 'flex',
    flexWrap: 'wrap',
    ...shorthands.gap('8px'),
    justifyContent: 'center',
    marginTop: '16px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('4px'),
    fontSize: '11px',
    color: tokens.colorNeutralForeground2,
  },
  legendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },

  // Top 5
  topList: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
    marginTop: '16px',
  },
  topItem: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
  },
  topItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topItemLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
  },
  topItemValue: {
    fontSize: '12px',
    fontWeight: '700',
    color: CENIT_COLORS.blueBrand,
  },
  progressTrack: {
    height: '8px',
    background: 'rgba(0,0,0,0.04)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
  },

  // Feature cards grid
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    ...shorthands.gap(tokens.spacingHorizontalL),
    marginTop: tokens.spacingVerticalXXL,
  },
});

interface Props {
  onNavigate: (seccion: SeccionProvisiones) => void;
}

export const ProvisionesDashboard: React.FC<Props> = ({ onNavigate }) => {
  const styles = useStyles();
  const { provisiones } = useProvisiones();
  const { compensaciones } = useCompensaciones();

  const stats = useMemo(() => {
    const activas = provisiones.filter(p => p.estadoAvance !== 'Cerrada').length;
    const valorTotal = provisiones.reduce((s, p) => s + p.valorProvisionTotal, 0);
    const saldoTotal = provisiones.reduce((s, p) => s + p.saldoProvision, 0);
    const riesgoAlto = compensaciones.filter(c => c.riesgoReal === 'Alto').length;

    // By zone
    const byZona = provisiones.reduce((acc, p) => {
      acc[p.zona] = (acc[p.zona] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // By estado
    const byEstado = provisiones.reduce((acc, p) => {
      acc[p.estadoAvance] = (acc[p.estadoAvance] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top 5 by saldo
    const top5 = [...provisiones]
      .sort((a, b) => b.saldoProvision - a.saldoProvision)
      .slice(0, 5);

    const maxSaldo = top5.length > 0 ? top5[0].saldoProvision : 1;

    return { activas, valorTotal, saldoTotal, riesgoAlto, byZona, byEstado, top5, maxSaldo };
  }, [provisiones, compensaciones]);

  // Donut chart conic-gradient
  const donutGradient = useMemo(() => {
    const entries = Object.entries(stats.byEstado);
    const total = entries.reduce((s, [, c]) => s + c, 0);
    if (total === 0) return 'conic-gradient(#e2e8f0 0% 100%)';
    let acc = 0;
    const stops = entries.map(([estado, count]) => {
      const start = acc;
      acc += (count / total) * 100;
      const color = ESTADO_COLORS[estado as EstadoProvision] || '#94a3b8';
      return `${color} ${start.toFixed(1)}% ${acc.toFixed(1)}%`;
    });
    return `conic-gradient(${stops.join(', ')})`;
  }, [stats.byEstado]);

  const maxZona = Math.max(...Object.values(stats.byZona), 1);

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Title2 style={{ color: '#003057', fontWeight: 700 }}>Provisiones Ambientales</Title2>
          <Body1 className={styles.subtitle}>
            Resumen general de provisiones, compensaciones y balance
          </Body1>
        </div>
      </div>

      {/* KPI Grid */}
      <div className={styles.kpiGrid}>
        <Card className={styles.kpiCard}>
          <div className={styles.kpiIconWrap} style={{ background: 'rgba(0, 75, 135, 0.1)' }}>
            <ShieldCheckmarkRegular fontSize={28} color={CENIT_COLORS.blueBrand} />
          </div>
          <span className={styles.kpiValue}>{stats.activas}</span>
          <span className={styles.kpiLabel}>Provisiones Activas</span>
        </Card>

        <Card className={styles.kpiCard}>
          <div className={styles.kpiIconWrap} style={{ background: 'rgba(22, 163, 74, 0.1)' }}>
            <MoneyRegular fontSize={28} color={CENIT_COLORS.green} />
          </div>
          <span className={styles.kpiValue}>{fmtCOP(stats.valorTotal)}</span>
          <span className={styles.kpiLabel}>Valor Total Provisionado</span>
        </Card>

        <Card className={styles.kpiCard}>
          <div className={styles.kpiIconWrap} style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
            <ArrowTrendingLinesRegular fontSize={28} color="#6366f1" />
          </div>
          <span className={styles.kpiValue}>{fmtCOP(stats.saldoTotal)}</span>
          <span className={styles.kpiLabel}>Saldo Disponible</span>
        </Card>

        <Card className={styles.kpiCard}>
          <div className={styles.kpiIconWrap} style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
            <WarningRegular fontSize={28} color="#ef4444" />
          </div>
          <span className={styles.kpiValue}>{stats.riesgoAlto}</span>
          <span className={styles.kpiLabel}>Compensaciones en Riesgo</span>
        </Card>
      </div>

      {/* Charts */}
      <div className={styles.chartContainer}>
        {/* Distribución por zona */}
        <Card className={styles.chartCard}>
          <CardHeader header={<Title3 style={{ color: '#003057' }}>Distribución por Zona</Title3>} />
          <div className={styles.barChart}>
            {Object.entries(stats.byZona)
              .sort((a, b) => b[1] - a[1])
              .map(([zona, count]) => {
                const pct = Math.round((count / maxZona) * 100);
                const color = ZONA_COLORS[zona] || CENIT_COLORS.blueBrand;
                return (
                  <div key={zona} className={styles.barRow}>
                    <div className={styles.barLabel}>{zona}</div>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{ width: `${pct}%`, background: color, boxShadow: `0 2px 6px ${color}40` }}
                      />
                    </div>
                    <div className={styles.barCount}>{count}</div>
                  </div>
                );
              })}
          </div>
        </Card>

        {/* Estado donut */}
        <Card className={styles.chartCard}>
          <CardHeader header={<Title3 style={{ color: '#003057' }}>Estado de Provisiones</Title3>} />
          <div className={styles.donutWrap}>
            <div className={styles.donutChart} style={{ background: donutGradient }}>
              <div className={styles.donutHole}>
                <span style={{ fontSize: '32px', fontWeight: '800', color: CENIT_COLORS.blueBrand, lineHeight: 1 }}>
                  {provisiones.length}
                </span>
                <span style={{ fontSize: '11px', fontWeight: '600', color: tokens.colorNeutralForeground3, letterSpacing: '0.5px' }}>
                  TOTAL
                </span>
              </div>
            </div>
            <div className={styles.donutLegend}>
              {Object.entries(stats.byEstado).map(([estado, count]) => (
                <div key={estado} className={styles.legendItem}>
                  <div
                    className={styles.legendDot}
                    style={{ background: ESTADO_COLORS[estado as EstadoProvision] || '#94a3b8' }}
                  />
                  <span>{estado} ({count})</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Top 5 por saldo */}
        <Card className={styles.chartCard}>
          <CardHeader header={<Title3 style={{ color: '#003057' }}>Top 5 por Saldo</Title3>} />
          <div className={styles.topList}>
            {stats.top5.map((p) => {
              const pct = Math.round((p.saldoProvision / stats.maxSaldo) * 100);
              return (
                <div key={p.id} className={styles.topItem}>
                  <div className={styles.topItemHeader}>
                    <span className={styles.topItemLabel}>{p.id} — {p.zona}</span>
                    <span className={styles.topItemValue}>{fmtCOP(p.saldoProvision)}</span>
                  </div>
                  <div className={styles.progressTrack}>
                    <div
                      className={styles.progressFill}
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${CENIT_COLORS.blueBrand}, ${CENIT_COLORS.blueLight})`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Feature Cards */}
      <div className={styles.featureGrid}>
        <FeatureCard
          title="Registro de Obligaciones"
          description="CRUD completo de provisiones ambientales con pipeline de estados."
          gradient="linear-gradient(135deg, #0033A0 0%, #0056D2 100%)"
          actionLabel="Ir a Obligaciones"
          onClick={() => onNavigate('obligaciones')}
        />
        <FeatureCard
          title="Compensaciones"
          description="Seguimiento físico de áreas, árboles e informes de mantenimiento."
          gradient="linear-gradient(135deg, #059669 0%, #10b981 100%)"
          actionLabel="Ver Compensaciones"
          onClick={() => onNavigate('compensaciones')}
        />
        <FeatureCard
          title="PxQ / Estimaciones"
          description="Detalle de costos por actividad con tarifas de contrato."
          gradient="linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)"
          actionLabel="Ver PxQ"
          onClick={() => onNavigate('pxq')}
        />
        <FeatureCard
          title="Seguimiento y Balance"
          description="Balance mensual, proyecciones y reporte por zona."
          gradient="linear-gradient(135deg, #dc2626 0%, #f59e0b 100%)"
          actionLabel="Ver Seguimiento"
          onClick={() => onNavigate('seguimiento')}
        />
      </div>
    </div>
  );
};
