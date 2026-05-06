// ============================================================
// ObligacionesTable — Tabla principal de provisiones
// ============================================================
import React, { useState, useMemo } from 'react';
import {
  makeStyles, shorthands, tokens, mergeClasses,
  Input, Button, Badge,
} from '@fluentui/react-components';
import {
  SearchRegular,
  AddRegular,
  Eye20Regular,
  Edit20Regular,
  Delete20Regular,
  FilterRegular,
} from '@fluentui/react-icons';
import { Provision, EstadoProvision, ESTADOS_PROVISION } from '../../../types/provisiones';
import { CENIT_COLORS } from '../../../theme/cenitTheme';

const fmtCOP = (n: number) => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  return `$${n.toLocaleString('es-CO')}`;
};

const ESTADO_BADGE: Record<EstadoProvision, { color: string; bg: string }> = {
  'Notificada':               { color: '#475569', bg: '#f1f5f9' },
  'ID Generado':              { color: '#2563eb', bg: '#eff6ff' },
  'En Estimación':            { color: '#7c3aed', bg: '#f5f3ff' },
  'Solicitud Enviada':        { color: '#d97706', bg: '#fffbeb' },
  'En Revisión Operaciones':  { color: '#ea580c', bg: '#fff7ed' },
  'Recursos Asignados':       { color: '#059669', bg: '#ecfdf5' },
  'En Ejecución':             { color: CENIT_COLORS.blueBrand, bg: '#eff6ff' },
  'En Facturación':           { color: '#7c3aed', bg: '#faf5ff' },
  'Cerrada':                  { color: '#16a34a', bg: '#f0fdf4' },
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
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    ...shorthands.gap('12px'),
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
    marginTop: '4px',
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
    ':hover': {
      background: 'rgba(0,51,160,0.06)',
    },
  },
  chipActive: {
    background: CENIT_COLORS.blueBrand,
    color: '#fff',
    ...shorthands.border('1px', 'solid', CENIT_COLORS.blueBrand),
    ':hover': {
      background: CENIT_COLORS.blueLight,
    },
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
    ':hover': {
      background: 'rgba(0,51,160,0.03)',
    },
  },
  badge: {
    ...shorthands.padding('3px', '10px'),
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    display: 'inline-block',
    letterSpacing: '0.02em',
  },
  actions: {
    display: 'flex',
    ...shorthands.gap('4px'),
  },
  actionBtn: {
    width: '28px',
    height: '28px',
    minWidth: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.15s ease, transform 0.15s ease',
    color: tokens.colorNeutralForeground2,
    ':hover': {
      background: 'rgba(0,0,0,0.06)',
      transform: 'scale(1.1)',
      color: tokens.colorNeutralForeground1,
    },
  },
  empty: {
    ...shorthands.padding('48px'),
    textAlign: 'center' as const,
    color: tokens.colorNeutralForeground3,
    fontSize: '14px',
  },
});

interface Props {
  provisiones: Provision[];
  cargando: boolean;
  onView: (p: Provision) => void;
  onEdit: (p: Provision) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

export const ObligacionesTable: React.FC<Props> = ({
  provisiones, cargando, onView, onEdit, onDelete, onCreate,
}) => {
  const styles = useStyles();
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoProvision | null>(null);
  const [filtroZona, setFiltroZona] = useState<string | null>(null);
  const [filtroCuenta, setFiltroCuenta] = useState<string | null>(null);

  const zonas = useMemo(() => [...new Set(provisiones.map(p => p.zona))].sort(), [provisiones]);

  const filtered = useMemo(() => {
    let list = provisiones;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.id.toLowerCase().includes(q) ||
        p.responsable.toLowerCase().includes(q) ||
        p.zona.toLowerCase().includes(q) ||
        p.municipio.toLowerCase().includes(q) ||
        p.tipoObligacion.toLowerCase().includes(q)
      );
    }
    if (filtroEstado) list = list.filter(p => p.estadoAvance === filtroEstado);
    if (filtroZona) list = list.filter(p => p.zona === filtroZona);
    if (filtroCuenta) list = list.filter(p => p.tipoCuenta === filtroCuenta);
    return list;
  }, [provisiones, search, filtroEstado, filtroZona, filtroCuenta]);

  return (
    <div className={styles.root}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Input
            placeholder="Buscar por ID, responsable, zona..."
            contentBefore={<SearchRegular />}
            value={search}
            onChange={(_, d) => setSearch(d.value)}
            style={{ flex: 1 }}
          />
        </div>
        <Button
          appearance="primary"
          icon={<AddRegular />}
          onClick={onCreate}
          style={{ borderRadius: '12px' }}
        >
          Nueva Obligación
        </Button>
      </div>

      {/* Filtros por estado */}
      <div className={styles.chips}>
        <span
          className={mergeClasses(styles.chip, !filtroEstado && styles.chipActive)}
          onClick={() => setFiltroEstado(null)}
        >
          Todos ({provisiones.length})
        </span>
        {ESTADOS_PROVISION.map(({ value, label }) => {
          const count = provisiones.filter(p => p.estadoAvance === value).length;
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

      {/* Filtros por zona */}
      <div className={styles.chips}>
        {zonas.map(z => (
          <span
            key={z}
            className={mergeClasses(styles.chip, filtroZona === z && styles.chipActive)}
            onClick={() => setFiltroZona(filtroZona === z ? null : z)}
          >
            {z}
          </span>
        ))}
        {['OPEX', 'CAPEX'].map(c => (
          <span
            key={c}
            className={mergeClasses(styles.chip, filtroCuenta === c && styles.chipActive)}
            onClick={() => setFiltroCuenta(filtroCuenta === c ? null : c)}
          >
            {c}
          </span>
        ))}
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>ID</th>
              <th className={styles.th}>Tipo</th>
              <th className={styles.th}>Zona</th>
              <th className={styles.th}>Municipio</th>
              <th className={styles.th}>Categoría</th>
              <th className={styles.th}>Cuenta</th>
              <th className={styles.th} style={{ textAlign: 'right' }}>Valor</th>
              <th className={styles.th} style={{ textAlign: 'right' }}>Uso</th>
              <th className={styles.th} style={{ textAlign: 'right' }}>Saldo</th>
              <th className={styles.th}>Estado</th>
              <th className={styles.th}>Responsable</th>
              <th className={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td className={styles.td} colSpan={12} style={{ textAlign: 'center', padding: '40px' }}>Cargando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className={styles.empty} colSpan={12}>No se encontraron obligaciones</td></tr>
            ) : (
              filtered.map(p => {
                const badge = ESTADO_BADGE[p.estadoAvance];
                return (
                  <tr key={p.id} className={styles.tr} onClick={() => onView(p)}>
                    <td className={styles.td} style={{ fontWeight: '700', color: CENIT_COLORS.blueBrand }}>{p.id}</td>
                    <td className={styles.td}>{p.tipoObligacion}</td>
                    <td className={styles.td}>{p.zona}</td>
                    <td className={styles.td}>{p.municipio}</td>
                    <td className={styles.td}>{p.categoria}</td>
                    <td className={styles.td}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                        background: p.tipoCuenta === 'OPEX' ? '#eff6ff' : '#faf5ff',
                        color: p.tipoCuenta === 'OPEX' ? '#2563eb' : '#7c3aed',
                      }}>
                        {p.tipoCuenta}
                      </span>
                    </td>
                    <td className={styles.td} style={{ textAlign: 'right', fontWeight: '600' }}>{fmtCOP(p.valorProvisionTotal)}</td>
                    <td className={styles.td} style={{ textAlign: 'right' }}>{fmtCOP(p.usoProvisionTotal)}</td>
                    <td className={styles.td} style={{ textAlign: 'right', fontWeight: '600', color: p.saldoProvision > 0 ? '#059669' : '#ef4444' }}>
                      {fmtCOP(p.saldoProvision)}
                    </td>
                    <td className={styles.td}>
                      <span className={styles.badge} style={{ color: badge.color, background: badge.bg }}>{p.estadoAvance}</span>
                    </td>
                    <td className={styles.td}>{p.responsable}</td>
                    <td className={styles.td} onClick={e => e.stopPropagation()}>
                      <div className={styles.actions}>
                        <div className={styles.actionBtn} onClick={() => onView(p)} title="Ver detalle">
                          <Eye20Regular />
                        </div>
                        <div className={styles.actionBtn} onClick={() => onEdit(p)} title="Editar">
                          <Edit20Regular />
                        </div>
                        <div className={styles.actionBtn} onClick={() => onDelete(p.id)} title="Eliminar"
                          style={{ ':hover': { color: '#ef4444' } } as any}>
                          <Delete20Regular />
                        </div>
                      </div>
                    </td>
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
