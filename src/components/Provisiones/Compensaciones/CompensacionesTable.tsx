// ============================================================
// CompensacionesTable — Tabla de compensaciones
// ============================================================
import React, { useState, useMemo } from 'react';
import {
  makeStyles, shorthands, tokens, mergeClasses,
  Input,
} from '@fluentui/react-components';
import { SearchRegular } from '@fluentui/react-icons';
import { Compensacion, EstadoCompensacion, NivelRiesgo, ESTADOS_COMPENSACION } from '../../../types/provisiones';
import { CENIT_COLORS } from '../../../theme/cenitTheme';

const ESTADO_BADGE: Record<EstadoCompensacion, { color: string; bg: string }> = {
  'Sin iniciar':     { color: '#475569', bg: '#f1f5f9' },
  'En ejecución':    { color: '#2563eb', bg: '#eff6ff' },
  'Establecimiento': { color: '#7c3aed', bg: '#f5f3ff' },
  'Mantenimiento':   { color: '#d97706', bg: '#fffbeb' },
  'Cerrada':         { color: '#16a34a', bg: '#f0fdf4' },
};

const RIESGO_BADGE: Record<NivelRiesgo, { color: string; bg: string }> = {
  'Alto':  { color: '#dc2626', bg: '#fef2f2' },
  'Medio': { color: '#d97706', bg: '#fffbeb' },
  'Bajo':  { color: '#16a34a', bg: '#f0fdf4' },
};

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    flexWrap: 'wrap',
  },
  searchWrap: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    flex: 1,
    minWidth: '200px',
    maxWidth: '400px',
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    ...shorthands.gap('6px'),
  },
  chip: {
    ...shorthands.padding('4px', '12px'),
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ...shorthands.border('1px', 'solid', 'rgba(0,0,0,0.08)'),
    background: 'rgba(255,255,255,0.8)',
    color: tokens.colorNeutralForeground2,
    userSelect: 'none',
    ':hover': { background: 'rgba(0,51,160,0.06)' },
  },
  chipActive: {
    background: CENIT_COLORS.blueBrand,
    color: '#fff',
    ...shorthands.border('1px', 'solid', CENIT_COLORS.blueBrand),
    ':hover': { background: CENIT_COLORS.blueLight },
  },
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
    position: 'sticky',
    top: 0,
    background: 'rgba(255,255,255,0.95)',
    zIndex: 1,
  },
  td: {
    ...shorthands.padding('10px', '14px'),
    ...shorthands.borderBottom('1px', 'solid', 'rgba(0,0,0,0.04)'),
    color: tokens.colorNeutralForeground1,
    whiteSpace: 'nowrap',
  },
  tr: {
    transition: 'background 0.15s ease',
    cursor: 'pointer',
    ':hover': { background: 'rgba(0,51,160,0.03)' },
  },
  badge: {
    ...shorthands.padding('3px', '10px'),
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    display: 'inline-block',
  },
  avanceCell: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('6px'),
  },
  avanceTrack: {
    width: '60px',
    height: '6px',
    background: 'rgba(0,0,0,0.04)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  avanceFill: {
    height: '100%',
    borderRadius: '3px',
  },
  empty: {
    ...shorthands.padding('48px'),
    textAlign: 'center' as const,
    color: tokens.colorNeutralForeground3,
    fontSize: '14px',
  },
});

interface Props {
  compensaciones: Compensacion[];
  cargando: boolean;
  onView: (c: Compensacion) => void;
}

export const CompensacionesTable: React.FC<Props> = ({ compensaciones, cargando, onView }) => {
  const styles = useStyles();
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoCompensacion | null>(null);

  const filtered = useMemo(() => {
    let list = compensaciones;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.id.toLowerCase().includes(q) ||
        c.provisionId.toLowerCase().includes(q) ||
        c.zona.toLowerCase().includes(q) ||
        c.responsable.toLowerCase().includes(q) ||
        c.medidaCompensacion.toLowerCase().includes(q)
      );
    }
    if (filtroEstado) list = list.filter(c => c.estado === filtroEstado);
    return list;
  }, [compensaciones, search, filtroEstado]);

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Input
            placeholder="Buscar por ID, provisión, zona..."
            contentBefore={<SearchRegular />}
            value={search}
            onChange={(_, d) => setSearch(d.value)}
            style={{ flex: 1 }}
          />
        </div>
      </div>

      <div className={styles.chips}>
        <span
          className={mergeClasses(styles.chip, !filtroEstado && styles.chipActive)}
          onClick={() => setFiltroEstado(null)}
        >
          Todos ({compensaciones.length})
        </span>
        {ESTADOS_COMPENSACION.map(({ value, label }) => {
          const count = compensaciones.filter(c => c.estado === value).length;
          if (count === 0) return null;
          return (
            <span
              key={value}
              className={mergeClasses(styles.chip, filtroEstado === value && styles.chipActive)}
              onClick={() => setFiltroEstado(filtroEstado === value ? null : value)}
            >
              {label} ({count})
            </span>
          );
        })}
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>ID</th>
              <th className={styles.th}>Provisión</th>
              <th className={styles.th}>Zona</th>
              <th className={styles.th}>Medida</th>
              <th className={styles.th} style={{ textAlign: 'right' }}>Área Plan</th>
              <th className={styles.th} style={{ textAlign: 'right' }}>Área Ejec</th>
              <th className={styles.th}>% Avance</th>
              <th className={styles.th} style={{ textAlign: 'right' }}>Árboles</th>
              <th className={styles.th}>Estado</th>
              <th className={styles.th}>Riesgo</th>
              <th className={styles.th}>Fecha Term.</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td className={styles.td} colSpan={11} style={{ textAlign: 'center', padding: '40px' }}>Cargando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className={styles.empty} colSpan={11}>No se encontraron compensaciones</td></tr>
            ) : (
              filtered.map(c => {
                const avance = c.areaPlaneadoHa > 0
                  ? Math.round((c.areaEjecutadoHa / c.areaPlaneadoHa) * 100) : 0;
                const estadoBadge = ESTADO_BADGE[c.estado];
                const riesgoBadge = RIESGO_BADGE[c.riesgoReal];

                return (
                  <tr key={c.id} className={styles.tr} onClick={() => onView(c)}>
                    <td className={styles.td} style={{ fontWeight: '700', color: CENIT_COLORS.blueBrand }}>{c.id}</td>
                    <td className={styles.td} style={{ fontWeight: '600' }}>{c.provisionId}</td>
                    <td className={styles.td}>{c.zona}</td>
                    <td className={styles.td} style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.medidaCompensacion}
                    </td>
                    <td className={styles.td} style={{ textAlign: 'right' }}>{c.areaPlaneadoHa} ha</td>
                    <td className={styles.td} style={{ textAlign: 'right' }}>{c.areaEjecutadoHa} ha</td>
                    <td className={styles.td}>
                      <div className={styles.avanceCell}>
                        <div className={styles.avanceTrack}>
                          <div className={styles.avanceFill} style={{
                            width: `${avance}%`,
                            background: avance >= 80 ? CENIT_COLORS.green : avance >= 40 ? '#f59e0b' : '#ef4444',
                          }} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '600', minWidth: '30px' }}>{avance}%</span>
                      </div>
                    </td>
                    <td className={styles.td} style={{ textAlign: 'right' }}>{c.cantidadArboles.toLocaleString('es-CO')}</td>
                    <td className={styles.td}>
                      <span className={styles.badge} style={{ color: estadoBadge.color, background: estadoBadge.bg }}>
                        {c.estado}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.badge} style={{ color: riesgoBadge.color, background: riesgoBadge.bg }}>
                        {c.riesgoReal}
                      </span>
                    </td>
                    <td className={styles.td}>{c.fechaTerminacion}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
