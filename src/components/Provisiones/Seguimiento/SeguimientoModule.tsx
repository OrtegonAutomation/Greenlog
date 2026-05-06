// ============================================================
// SeguimientoModule — Balance mensual + proyecciones
// ============================================================
import React, { useMemo, useState } from 'react';
import {
  makeStyles, shorthands, tokens, mergeClasses,
  Title2, Title3, Body1, Caption1, Card, CardHeader,
  Dropdown, Option,
} from '@fluentui/react-components';
import { useProvisiones } from '../../../hooks/useProvisiones';
import { CENIT_COLORS } from '../../../theme/cenitTheme';

const fmtCOP = (n: number) => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString('es-CO')}`;
};

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const PROJ_YEARS = [2026, 2027, 2028, 2029, 2030, 2031, 2032];

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
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.5)'),
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
  },
  subtitle: { color: tokens.colorNeutralForeground2 },

  // Year selector
  yearSelector: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },

  // Monthly grid
  monthGridWrapper: {
    background: 'rgba(255,255,255,0.6)',
    backdropFilter: 'blur(12px)',
    borderRadius: '20px',
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.5)'),
    ...shorthands.padding('24px'),
    boxShadow: '0 4px 24px rgba(0,0,0,0.02)',
  },
  monthGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    ...shorthands.gap('12px'),
    marginTop: '16px',
  },
  monthCell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.gap('4px'),
    ...shorthands.padding('14px', '8px'),
    borderRadius: '14px',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
    },
  },
  monthLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  monthValue: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#003057',
  },

  // Charts
  chartContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    ...shorthands.gap(tokens.spacingHorizontalL),
  },
  chartCard: {
    ...shorthands.padding('24px'),
    background: 'rgba(255,255,255,0.6)',
    backdropFilter: 'blur(12px)',
    borderRadius: '20px',
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.5)'),
    boxShadow: '0 4px 24px rgba(0,0,0,0.02)',
  },

  // Projection chart (bar-based)
  projChart: {
    display: 'flex',
    alignItems: 'flex-end',
    ...shorthands.gap('8px'),
    height: '200px',
    marginTop: '16px',
    ...shorthands.padding('0', '8px'),
  },
  projBarGroup: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.gap('4px'),
    height: '100%',
    justifyContent: 'flex-end',
  },
  projBars: {
    display: 'flex',
    ...shorthands.gap('2px'),
    alignItems: 'flex-end',
    width: '100%',
    justifyContent: 'center',
  },
  projBar: {
    width: '16px',
    borderRadius: '4px 4px 0 0',
    transition: 'height 1s cubic-bezier(0.16,1,0.3,1)',
    minHeight: '2px',
  },
  projLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground3,
  },

  // Legend
  legend: {
    display: 'flex',
    ...shorthands.gap('16px'),
    justifyContent: 'center',
    marginTop: '12px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('6px'),
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
    fontWeight: '500',
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '3px',
    flexShrink: 0,
  },

  // Zone table
  zoneTableWrapper: {
    background: 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(12px)',
    borderRadius: '16px',
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.5)'),
    overflow: 'auto',
    boxShadow: '0 4px 24px rgba(0,0,0,0.02)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  th: {
    ...shorthands.padding('12px', '14px'),
    textAlign: 'left',
    fontWeight: '700',
    color: '#003057',
    fontSize: '12px',
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
    ...shorthands.borderBottom('2px', 'solid', 'rgba(0,0,0,0.06)'),
    whiteSpace: 'nowrap',
    background: 'rgba(255,255,255,0.95)',
  },
  td: {
    ...shorthands.padding('10px', '14px'),
    ...shorthands.borderBottom('1px', 'solid', 'rgba(0,0,0,0.04)'),
    color: tokens.colorNeutralForeground1,
    whiteSpace: 'nowrap',
  },
  tr: {
    transition: 'background 0.15s ease',
    ':hover': { background: 'rgba(0,51,160,0.03)' },
  },
  totalRow: {
    fontWeight: '700',
    background: 'rgba(0,51,160,0.03)',
  },
});

export const SeguimientoModule: React.FC = () => {
  const styles = useStyles();
  const { provisiones } = useProvisiones();
  const [selectedYear, setSelectedYear] = useState(2026);

  const stats = useMemo(() => {
    // Monthly admin costs (aggregate all provisiones)
    const monthlyCosts = Array.from({ length: 12 }, (_, i) =>
      provisiones.reduce((s, p) => s + (p.costosAdminMensuales[i] || 0), 0)
    );

    const maxCost = Math.max(...monthlyCosts, 1);

    // By zone
    const byZona: Record<string, { count: number; valor: number; uso: number; saldo: number }> = {};
    for (const p of provisiones) {
      if (!byZona[p.zona]) byZona[p.zona] = { count: 0, valor: 0, uso: 0, saldo: 0 };
      byZona[p.zona].count++;
      byZona[p.zona].valor += p.valorProvisionTotal;
      byZona[p.zona].uso += p.usoProvisionTotal;
      byZona[p.zona].saldo += p.saldoProvision;
    }

    // Projection
    const projData: Record<number, { uso: number; saldo: number }> = {};
    for (const y of PROJ_YEARS) {
      const uso = provisiones.reduce((s, p) => s + (p.usoProyectado[y] || 0), 0);
      const totalValor = provisiones.reduce((s, p) => s + p.valorProvisionTotal, 0);
      const totalUso = provisiones.reduce((s, p) => s + p.usoProvisionTotal, 0);
      projData[y] = { uso, saldo: Math.max(0, totalValor - totalUso - uso * (y - 2025)) };
    }
    const maxProj = Math.max(
      ...Object.values(projData).map(d => Math.max(d.uso, d.saldo)),
      1
    );

    const totalValor = provisiones.reduce((s, p) => s + p.valorProvisionTotal, 0);
    const totalUso = provisiones.reduce((s, p) => s + p.usoProvisionTotal, 0);
    const totalSaldo = provisiones.reduce((s, p) => s + p.saldoProvision, 0);

    return { monthlyCosts, maxCost, byZona, projData, maxProj, totalValor, totalUso, totalSaldo };
  }, [provisiones]);

  // Color scale for monthly cells
  const getCellBg = (value: number) => {
    const ratio = value / stats.maxCost;
    if (ratio > 0.75) return { bg: '#fee2e2', color: '#dc2626' };
    if (ratio > 0.5) return { bg: '#fef3c7', color: '#d97706' };
    if (ratio > 0.25) return { bg: '#dbeafe', color: '#2563eb' };
    return { bg: '#f0fdf4', color: '#059669' };
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Title2 style={{ color: '#003057', fontWeight: 700 }}>Seguimiento y Balance</Title2>
          <Body1 className={styles.subtitle}>
            Balance mensual de costos administrativos, proyecciones y resumen por zona
          </Body1>
        </div>
      </div>

      {/* Monthly cost grid */}
      <div className={styles.monthGridWrapper}>
        <Title3 style={{ color: '#003057' }}>Costos Administrativos Mensuales — {selectedYear}</Title3>
        <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
          Color basado en magnitud relativa. Rojo = más alto, Verde = más bajo.
        </Caption1>
        <div className={styles.monthGrid}>
          {MESES.map((mes, i) => {
            const val = stats.monthlyCosts[i];
            const cell = getCellBg(val);
            return (
              <div key={mes} className={styles.monthCell} style={{ background: cell.bg }}>
                <span className={styles.monthLabel}>{mes}</span>
                <span className={styles.monthValue} style={{ color: cell.color }}>{fmtCOP(val)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts */}
      <div className={styles.chartContainer}>
        {/* Projection chart */}
        <Card className={styles.chartCard}>
          <CardHeader header={<Title3 style={{ color: '#003057' }}>Proyección USO vs SALDO (2026-2032)</Title3>} />
          <div className={styles.projChart}>
            {PROJ_YEARS.map(y => {
              const d = stats.projData[y];
              const usoH = Math.max(2, (d.uso / stats.maxProj) * 180);
              const saldoH = Math.max(2, (d.saldo / stats.maxProj) * 180);
              return (
                <div key={y} className={styles.projBarGroup}>
                  <div className={styles.projBars}>
                    <div className={styles.projBar} style={{
                      height: `${usoH}px`,
                      background: `linear-gradient(180deg, ${CENIT_COLORS.blueBrand}, ${CENIT_COLORS.blueLight})`,
                    }} />
                    <div className={styles.projBar} style={{
                      height: `${saldoH}px`,
                      background: `linear-gradient(180deg, ${CENIT_COLORS.green}, ${CENIT_COLORS.greenMid})`,
                    }} />
                  </div>
                  <span className={styles.projLabel}>{y}</span>
                </div>
              );
            })}
          </div>
          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <div className={styles.legendDot} style={{ background: CENIT_COLORS.blueBrand }} />
              <span>Uso Proyectado</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendDot} style={{ background: CENIT_COLORS.green }} />
              <span>Saldo Estimado</span>
            </div>
          </div>
        </Card>

        {/* Summary card */}
        <Card className={styles.chartCard}>
          <CardHeader header={<Title3 style={{ color: '#003057' }}>Resumen General</Title3>} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Caption1 style={{ fontWeight: '600' }}>Valor Total Provisionado</Caption1>
              <span style={{ fontSize: '28px', fontWeight: '800', color: '#003057' }}>{fmtCOP(stats.totalValor)}</span>
            </div>
            <div style={{ display: 'flex', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                <Caption1 style={{ fontWeight: '600' }}>Uso Total</Caption1>
                <span style={{ fontSize: '22px', fontWeight: '700', color: CENIT_COLORS.blueBrand }}>{fmtCOP(stats.totalUso)}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                <Caption1 style={{ fontWeight: '600' }}>Saldo</Caption1>
                <span style={{ fontSize: '22px', fontWeight: '700', color: '#059669' }}>{fmtCOP(stats.totalSaldo)}</span>
              </div>
            </div>
            {/* Usage ratio bar */}
            <div>
              <Caption1 style={{ fontWeight: '600' }}>% Utilización</Caption1>
              <div style={{
                marginTop: '8px', height: '12px', background: 'rgba(0,0,0,0.04)',
                borderRadius: '6px', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: '6px',
                  width: `${stats.totalValor > 0 ? Math.round((stats.totalUso / stats.totalValor) * 100) : 0}%`,
                  background: `linear-gradient(90deg, ${CENIT_COLORS.blueBrand}, ${CENIT_COLORS.blueLight})`,
                  transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <Caption1>0%</Caption1>
                <Caption1 style={{ fontWeight: '700', color: CENIT_COLORS.blueBrand }}>
                  {stats.totalValor > 0 ? Math.round((stats.totalUso / stats.totalValor) * 100) : 0}%
                </Caption1>
                <Caption1>100%</Caption1>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Zone summary table */}
      <div className={styles.zoneTableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Zona</th>
              <th className={styles.th} style={{ textAlign: 'right' }}>Obligaciones</th>
              <th className={styles.th} style={{ textAlign: 'right' }}>Valor Total</th>
              <th className={styles.th} style={{ textAlign: 'right' }}>Uso Total</th>
              <th className={styles.th} style={{ textAlign: 'right' }}>Saldo</th>
              <th className={styles.th} style={{ textAlign: 'right' }}>% Uso</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats.byZona)
              .sort((a, b) => b[1].valor - a[1].valor)
              .map(([zona, data]) => {
                const pctUso = data.valor > 0 ? Math.round((data.uso / data.valor) * 100) : 0;
                return (
                  <tr key={zona} className={styles.tr}>
                    <td className={styles.td} style={{ fontWeight: '700', color: CENIT_COLORS.blueBrand }}>{zona}</td>
                    <td className={styles.td} style={{ textAlign: 'right' }}>{data.count}</td>
                    <td className={styles.td} style={{ textAlign: 'right', fontWeight: '600' }}>{fmtCOP(data.valor)}</td>
                    <td className={styles.td} style={{ textAlign: 'right' }}>{fmtCOP(data.uso)}</td>
                    <td className={styles.td} style={{ textAlign: 'right', fontWeight: '600', color: data.saldo > 0 ? '#059669' : '#ef4444' }}>
                      {fmtCOP(data.saldo)}
                    </td>
                    <td className={styles.td} style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                        <div style={{
                          width: '60px', height: '6px', background: 'rgba(0,0,0,0.04)',
                          borderRadius: '3px', overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%', borderRadius: '3px', width: `${pctUso}%`,
                            background: pctUso > 80 ? '#ef4444' : pctUso > 50 ? '#f59e0b' : CENIT_COLORS.green,
                          }} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '600', minWidth: '30px' }}>{pctUso}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            <tr className={mergeClasses(styles.tr, styles.totalRow)}>
              <td className={styles.td}>TOTAL</td>
              <td className={styles.td} style={{ textAlign: 'right' }}>{provisiones.length}</td>
              <td className={styles.td} style={{ textAlign: 'right' }}>{fmtCOP(stats.totalValor)}</td>
              <td className={styles.td} style={{ textAlign: 'right' }}>{fmtCOP(stats.totalUso)}</td>
              <td className={styles.td} style={{ textAlign: 'right', color: '#059669' }}>{fmtCOP(stats.totalSaldo)}</td>
              <td className={styles.td} style={{ textAlign: 'right' }}>
                {stats.totalValor > 0 ? Math.round((stats.totalUso / stats.totalValor) * 100) : 0}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
