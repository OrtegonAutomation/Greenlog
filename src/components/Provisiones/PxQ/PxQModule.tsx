// ============================================================
// PxQModule — Tabla agrupada por COMP, solo lectura
// ============================================================
import React, { useMemo, useState } from 'react';
import {
  makeStyles, shorthands, tokens, mergeClasses,
  Title2, Title3, Body1, Caption1, Card, Input,
} from '@fluentui/react-components';
import { SearchRegular, ChevronDown20Regular, ChevronRight20Regular } from '@fluentui/react-icons';
import { usePxQ } from '../../../hooks/usePxQ';
import { CENIT_COLORS } from '../../../theme/cenitTheme';

const fmtCOP = (n: number) => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  return `$${n.toLocaleString('es-CO')}`;
};

const YEARS = [2025, 2026, 2027, 2028, 2029, 2030];

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

  // Summary cards
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    ...shorthands.gap('12px'),
  },
  summaryCard: {
    ...shorthands.padding('16px'),
    background: 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(12px)',
    borderRadius: '14px',
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.5)'),
    textAlign: 'center' as const,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
    },
  },
  summaryYear: {
    fontSize: '13px',
    fontWeight: '700',
    color: tokens.colorNeutralForeground3,
    letterSpacing: '0.04em',
  },
  summaryValue: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#003057',
    marginTop: '4px',
  },

  // Search
  searchWrap: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    maxWidth: '400px',
  },

  // Table
  tableWrapper: {
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
    fontSize: '12px',
  },
  th: {
    ...shorthands.padding('10px', '12px'),
    textAlign: 'left',
    fontWeight: '700',
    color: '#003057',
    fontSize: '11px',
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
    ...shorthands.borderBottom('2px', 'solid', 'rgba(0,0,0,0.06)'),
    whiteSpace: 'nowrap',
    position: 'sticky',
    top: 0,
    background: 'rgba(255,255,255,0.95)',
    zIndex: 1,
  },
  td: {
    ...shorthands.padding('8px', '12px'),
    ...shorthands.borderBottom('1px', 'solid', 'rgba(0,0,0,0.04)'),
    color: tokens.colorNeutralForeground1,
    whiteSpace: 'nowrap',
  },
  groupRow: {
    cursor: 'pointer',
    transition: 'background 0.15s ease',
    ':hover': { background: 'rgba(0,51,160,0.03)' },
  },
  groupHeader: {
    ...shorthands.padding('10px', '12px'),
    fontWeight: '700',
    fontSize: '13px',
    color: CENIT_COLORS.blueBrand,
    background: 'rgba(0,51,160,0.03)',
    ...shorthands.borderBottom('1px', 'solid', 'rgba(0,0,0,0.06)'),
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  itemRow: {
    ':hover': { background: 'rgba(0,0,0,0.01)' },
  },
});

export const PxQModule: React.FC = () => {
  const styles = useStyles();
  const { items, cargando } = usePxQ();
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(i =>
      i.provisionId.toLowerCase().includes(q) ||
      i.zona.toLowerCase().includes(q) ||
      i.descripcion.toLowerCase().includes(q) ||
      i.municipio.toLowerCase().includes(q)
    );
  }, [items, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof items> = {};
    for (const item of filtered) {
      if (!groups[item.provisionId]) groups[item.provisionId] = [];
      groups[item.provisionId].push(item);
    }
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const yearTotals = useMemo(() => {
    const totals: Record<number, number> = {};
    for (const y of YEARS) {
      totals[y] = items.reduce((s, i) => s + (i.totalAnual[y] || 0), 0);
    }
    return totals;
  }, [items]);

  const toggleGroup = (id: string) => {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Title2 style={{ color: '#003057', fontWeight: 700 }}>PxQ / Estimaciones</Title2>
          <Body1 className={styles.subtitle}>
            Detalle de costos por actividad con tarifas de contrato — Solo lectura
          </Body1>
        </div>
      </div>

      {/* Year summary cards */}
      <div className={styles.summaryGrid}>
        {YEARS.map(y => (
          <div key={y} className={styles.summaryCard}>
            <div className={styles.summaryYear}>{y}</div>
            <div className={styles.summaryValue}>{fmtCOP(yearTotals[y] || 0)}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className={styles.searchWrap}>
        <Input
          placeholder="Buscar por COMP, zona, descripción..."
          contentBefore={<SearchRegular />}
          value={search}
          onChange={(_, d) => setSearch(d.value)}
          style={{ flex: 1 }}
        />
      </div>

      {/* Grouped table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th} style={{ width: '30px' }}></th>
              <th className={styles.th}>Descripción</th>
              <th className={styles.th}>Zona</th>
              <th className={styles.th}>Municipio</th>
              <th className={styles.th}>Unidad</th>
              <th className={styles.th} style={{ textAlign: 'right' }}>Cantidad</th>
              <th className={styles.th} style={{ textAlign: 'right' }}>Val. Unitario</th>
              {YEARS.map(y => (
                <th key={y} className={styles.th} style={{ textAlign: 'right' }}>{y}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td className={styles.td} colSpan={8 + YEARS.length} style={{ textAlign: 'center', padding: '40px' }}>Cargando...</td></tr>
            ) : grouped.length === 0 ? (
              <tr><td className={styles.td} colSpan={8 + YEARS.length} style={{ textAlign: 'center', padding: '40px', color: tokens.colorNeutralForeground3 }}>Sin resultados</td></tr>
            ) : (
              grouped.map(([compId, groupItems]) => {
                const isCollapsed = !!collapsed[compId];
                const groupTotals: Record<number, number> = {};
                for (const y of YEARS) {
                  groupTotals[y] = groupItems.reduce((s, i) => s + (i.totalAnual[y] || 0), 0);
                }

                return (
                  <React.Fragment key={compId}>
                    <tr className={styles.groupRow} onClick={() => toggleGroup(compId)}>
                      <td colSpan={8 + YEARS.length}>
                        <div className={styles.groupHeader}>
                          {isCollapsed ? <ChevronRight20Regular /> : <ChevronDown20Regular />}
                          <span>{compId}</span>
                          <span style={{ fontSize: '12px', fontWeight: '500', color: tokens.colorNeutralForeground3 }}>
                            — {groupItems.length} ítems
                          </span>
                          <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: '700' }}>
                            {YEARS.map(y => fmtCOP(groupTotals[y])).join(' | ')}
                          </span>
                        </div>
                      </td>
                    </tr>
                    {!isCollapsed && groupItems.map(item => (
                      <tr key={item.id} className={styles.itemRow}>
                        <td className={styles.td}></td>
                        <td className={styles.td} style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.descripcion}
                        </td>
                        <td className={styles.td}>{item.zona}</td>
                        <td className={styles.td}>{item.municipio}</td>
                        <td className={styles.td}>{item.unidad}</td>
                        <td className={styles.td} style={{ textAlign: 'right' }}>{item.cantidad}</td>
                        <td className={styles.td} style={{ textAlign: 'right' }}>{fmtCOP(item.valorUnitario)}</td>
                        {YEARS.map(y => (
                          <td key={y} className={styles.td} style={{
                            textAlign: 'right',
                            color: (item.totalAnual[y] || 0) > 0 ? tokens.colorNeutralForeground1 : tokens.colorNeutralForeground4,
                          }}>
                            {(item.totalAnual[y] || 0) > 0 ? fmtCOP(item.totalAnual[y]) : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
