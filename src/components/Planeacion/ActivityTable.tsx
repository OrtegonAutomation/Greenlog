// ============================================================
// ActivityTable — Tabla de actividades con filtros y skeleton
// ============================================================
import React, { useMemo, useState } from 'react';
import {
  makeStyles, shorthands, tokens, mergeClasses,
  Input, Button, Caption1, Select,
  Tooltip,
} from '@fluentui/react-components';
import {
  SearchRegular, DismissRegular, FilterRegular,
  LocationRegular, ClipboardTaskListLtrRegular, OrganizationRegular,
  LayerRegular,
} from '@fluentui/react-icons';
import { ActividadAmbiental, EstadoActividad } from '../../types';
import { StatusBadge } from '../shared/StatusBadge';
import { SkeletonTable } from '../shared/SkeletonLoader';
import { EmptyState } from '../shared/EmptyState';
import { MEDIA, useResponsive } from '../../hooks/useResponsive';

// ── Estilos ───────────────────────────────────────────────────
const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalM),
  },
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalM),
    flexWrap: 'wrap',
    paddingBottom: '8px',
  },
  searchWrap: {
    flex: '1 1 220px',
    maxWidth: '360px',
    [MEDIA.mobile]: { maxWidth: '100%', flexBasis: '100%' },
  },
  chips: {
    display: 'flex',
    ...shorthands.gap(tokens.spacingHorizontalS),
    flexWrap: 'wrap',
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.padding('6px', '16px'),
    borderRadius: '100px',
    border: '1px solid rgba(0,0,0,0.05)',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    background: 'rgba(255,255,255,0.6)',
    backdropFilter: 'blur(8px)',
    color: tokens.colorNeutralForeground2,
    transition: 'all 0.2s cubic-bezier(0.33, 1, 0.68, 1)',
    userSelect: 'none',
    ':hover': {
      background: 'rgba(255,255,255,0.9)',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
    },
  },
  chipActive: {
    background: 'linear-gradient(135deg, #003057 0%, #004b87 100%)',
    color: '#fff',
    border: '1px solid transparent',
    boxShadow: '0 4px 12px rgba(0, 48, 87, 0.25)',
    ':hover': {
      background: 'linear-gradient(135deg, #00264d 0%, #003d73 100%)',
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 16px rgba(0, 48, 87, 0.3)',
    },
  },
  tableWrap: {
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.6)',
    overflowX: 'auto',
    overflowY: 'hidden',
    boxShadow: '0 10px 40px rgba(0,0,0,0.04), 0 2px 10px rgba(0,0,0,0.02)',
    background: 'rgba(255,255,255,0.4)',
    backdropFilter: 'blur(20px) saturate(180%)',
    position: 'relative',
    [MEDIA.mobile]: { overflowX: 'hidden' },
  },
  count: {
    color: tokens.colorNeutralForeground3,
    fontSize: '12px',
    marginLeft: 'auto',
    fontWeight: '600',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },

  // ── Vista móvil: lista de tarjetas ──
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
  },
  mobileCard: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
    ...shorthands.padding('14px'),
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.7)',
    background: 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
    ':active': { transform: 'scale(0.985)' },
  },
  mobileCardTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    ...shorthands.gap('8px'),
  },
  mobileCardTitle: {
    fontWeight: '700',
    fontSize: '14px',
    lineHeight: '1.3',
    color: '#003057',
    flex: 1,
    minWidth: 0,
  },
  mobileCardDesc: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  mobileCardMeta: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    ...shorthands.gap('4px', '14px'),
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
  },
  mobileCardMetaItem: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.gap('5px'),
    minWidth: 0,
  },
  mobileCardMoney: {
    fontWeight: '700',
    color: '#003057',
    fontSize: '13px',
    overflowWrap: 'anywhere',
  },
});

// ── Filtros de estado ─────────────────────────────────────────
const FILTROS: { label: string; value: EstadoActividad | 'Todos' }[] = [
  { label: 'Todos', value: 'Todos' },
  { label: 'Planeada', value: 'Planeada' },
  { label: 'En Ejecución', value: 'En Ejecución' },
  { label: 'Pendiente Aprobación', value: 'Pendiente Aprobación' },
  { label: 'Cerrada', value: 'Cerrada' },
];

const parseOpex = (raw?: string) => {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

const formatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

// Anchos de columna (px) — table-layout: fixed los respeta exactamente
const COL = { tarea: 260, linea: 160, proveedor: 200, zona: 150, presupuesto: 150, meses: 160, estado: 130 };

// Estilos inline compartidos
const thStyle: React.CSSProperties = {
  fontWeight: 600, fontSize: '13px', color: '#323130',
  padding: '12px 16px', textAlign: 'left',
  borderBottom: '1px solid rgba(0,0,0,0.07)',
  background: 'rgba(248,250,252,0.8)',
  whiteSpace: 'nowrap', overflow: 'hidden',
};
const tdStyle: React.CSSProperties = {
  padding: '14px 16px', verticalAlign: 'middle',
  borderBottom: '1px solid rgba(0,0,0,0.04)',
  overflow: 'hidden',
};
const cellInner: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden',
};
const textStack: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '2px',
  overflow: 'hidden', minWidth: 0,
};
const line1: React.CSSProperties = {
  fontWeight: 600, fontSize: '13px', lineHeight: 1.3,
  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
};
const line2: React.CSSProperties = {
  fontSize: '11px', color: '#605E5C',
  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
};

// ── Componente ────────────────────────────────────────────────
interface ActivityTableProps {
  actividades: ActividadAmbiental[];
  cargando: boolean;
  onNueva?: () => void;
  onItemClick?: (item: ActividadAmbiental) => void;
}

export const ActivityTable: React.FC<ActivityTableProps> = ({ actividades, cargando, onNueva, onItemClick }) => {
  const styles = useStyles();
  const { isMobile } = useResponsive();
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoActividad | 'Todos'>('Todos');
  const [filtroAnio, setFiltroAnio] = useState<number | null>(null);
  const [filtroZona, setFiltroZona] = useState<string>('Todas');
  const [filtroLinea, setFiltroLinea] = useState<string>('Todas');

  // Compute available years from the data
  const aniosDisponibles = useMemo(() => {
    const years = new Set<number>();
    for (const a of actividades) {
      const anio = (a as any).anioPlaneacion;
      if (anio && typeof anio === 'number') years.add(anio);
    }
    return [...years].sort();
  }, [actividades]);

  // Zonas y líneas operativas presentes en los datos
  const zonasDisponibles = useMemo(
    () => [...new Set(actividades.map(a => a.zona).filter(Boolean))].sort(),
    [actividades],
  );
  const lineasDisponibles = useMemo(
    () => [...new Set(actividades.map(a => a.lineaOperativa).filter(Boolean))].sort(),
    [actividades],
  );

  const filtradas = useMemo(() => {
    const q = search.toLowerCase().trim();
    return actividades.filter((a) => {
      const matchEstado = filtroEstado === 'Todos' || a.estado === filtroEstado;
      if (!matchEstado) return false;
      if (filtroAnio !== null && (a as any).anioPlaneacion !== filtroAnio) return false;
      if (filtroZona !== 'Todas' && a.zona !== filtroZona) return false;
      if (filtroLinea !== 'Todas' && a.lineaOperativa !== filtroLinea) return false;
      if (!q) return true;
      return (
        a.tarea.toLowerCase().includes(q) ||
        a.responsable.toLowerCase().includes(q) ||
        a.zona.toLowerCase().includes(q) ||
        (a.estacion ?? '').toLowerCase().includes(q) ||
        a.lineaOperativa.toLowerCase().includes(q) ||
        (a.contrato ?? '').toLowerCase().includes(q)
      );
    });
  }, [actividades, search, filtroEstado, filtroAnio, filtroZona, filtroLinea]);

  return (
    <div className={styles.root}>
      {/* Barra de filtros */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <Input
            contentBefore={<SearchRegular />}
            placeholder="Buscar por tarea, responsable, zona..."
            value={search}
            onChange={(_, d) => setSearch(d.value)}
            contentAfter={search
              ? <Button appearance="transparent" size="small" icon={<DismissRegular />} onClick={() => setSearch('')} aria-label="Limpiar búsqueda" />
              : undefined
            }
          />
        </div>

        <FilterRegular style={{ color: tokens.colorNeutralForeground3, flexShrink: 0 }} />

        <div className={styles.chips}>
          {FILTROS.map((f) => (
            <Tooltip key={f.value} content={`Filtrar por: ${f.label}`} relationship="label">
              <span
                role="button"
                tabIndex={0}
                className={mergeClasses(styles.chip, filtroEstado === f.value && styles.chipActive)}
                onClick={() => setFiltroEstado(f.value)}
                onKeyDown={(e) => e.key === 'Enter' && setFiltroEstado(f.value)}
              >
                {f.label}
              </span>
            </Tooltip>
          ))}
        </div>

        {aniosDisponibles.length > 0 && (
          <div className={styles.chips}>
            <span
              role="button"
              tabIndex={0}
              className={mergeClasses(styles.chip, filtroAnio === null && styles.chipActive)}
              onClick={() => setFiltroAnio(null)}
              onKeyDown={(e) => e.key === 'Enter' && setFiltroAnio(null)}
              style={{ fontSize: '12px' }}
            >
              Todos los años
            </span>
            {aniosDisponibles.map(y => (
              <span
                key={y}
                role="button"
                tabIndex={0}
                className={mergeClasses(styles.chip, filtroAnio === y && styles.chipActive)}
                onClick={() => setFiltroAnio(y)}
                onKeyDown={(e) => e.key === 'Enter' && setFiltroAnio(y)}
                style={{ fontSize: '12px' }}
              >
                {y}
              </span>
            ))}
          </div>
        )}

        {lineasDisponibles.length > 0 && (
          <Select
            size="small"
            aria-label="Filtrar por línea operativa"
            value={filtroLinea}
            onChange={(_, d) => setFiltroLinea(d.value)}
            style={{ minWidth: 0, maxWidth: 200 }}
          >
            <option value="Todas">Todas las líneas</option>
            {lineasDisponibles.map(l => <option key={l} value={l}>{l}</option>)}
          </Select>
        )}

        {zonasDisponibles.length > 0 && (
          <Select
            size="small"
            aria-label="Filtrar por zona"
            value={filtroZona}
            onChange={(_, d) => setFiltroZona(d.value)}
            style={{ minWidth: 0, maxWidth: 160 }}
          >
            <option value="Todas">Todas las zonas</option>
            {zonasDisponibles.map(z => <option key={z} value={z}>{z}</option>)}
          </Select>
        )}

        <Caption1 className={styles.count}>
          {filtradas.length} {filtradas.length === 1 ? 'actividad' : 'actividades'}
        </Caption1>
      </div>

      {/* Tabla */}
      <div className={styles.tableWrap}>
        {cargando ? (
          <SkeletonTable rows={6} />
        ) : filtradas.length === 0 ? (
          <EmptyState
            title="Sin resultados"
            subtitle={
              search || filtroEstado !== 'Todos'
                ? 'No hay actividades que coincidan con los filtros aplicados.'
                : 'Aún no hay actividades registradas en el módulo de planeación.'
            }
            actionLabel={!search && filtroEstado === 'Todos' && onNueva ? 'Nueva planeación' : undefined}
            onAction={!search && filtroEstado === 'Todos' && onNueva ? onNueva : undefined}
          />
        ) : isMobile ? (
          <div className={styles.cardList} style={{ padding: '12px' }}>
            {filtradas.map((item) => {
              const opx = parseOpex(item.opexDataRaw);
              const description = opx?.objeto || item.lineaOperativa || '';
              const mesesActivos = opx?.meses
                ? opx.meses.filter((m: any) => m.total > 0).map((m: any) => m.mes.substring(0, 3))
                : [];
              const mesesTexto = mesesActivos.length === 0 ? '—'
                : mesesActivos.length === 12 ? '12 Meses'
                : mesesActivos.join(', ');

              return (
                <div
                  key={item.id}
                  className={styles.mobileCard}
                  role="button"
                  tabIndex={0}
                  onClick={() => onItemClick?.(item)}
                >
                  <div className={styles.mobileCardTop}>
                    <span className={styles.mobileCardTitle}>{item.tarea}</span>
                    <StatusBadge estado={item.estado} />
                  </div>
                  {description && <span className={styles.mobileCardDesc}>{description}</span>}
                  <div className={styles.mobileCardMeta}>
                    <span className={styles.mobileCardMetaItem}>
                      <LayerRegular style={{ fontSize: '14px', color: '#107C41' }} />
                      {item.lineaOperativa || '—'}
                    </span>
                    <span className={styles.mobileCardMetaItem}>
                      <LocationRegular style={{ fontSize: '14px' }} />
                      {item.zona}{item.estacion ? ` · ${item.estacion}` : ''}
                    </span>
                  </div>
                  <div className={styles.mobileCardMeta}>
                    <span className={styles.mobileCardMetaItem}>
                      <OrganizationRegular style={{ fontSize: '14px' }} />
                      {opx?.proveedor || 'No asignado'}
                    </span>
                  </div>
                  <div className={styles.mobileCardMeta}>
                    <span className={styles.mobileCardMoney}>
                      {item.presupuestoPlan ? formatter.format(item.presupuestoPlan) : 'Sin presupuesto'}
                    </span>
                    <span style={{ marginLeft: 'auto', minWidth: 0, textAlign: 'right' }}>{mesesTexto}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
            <colgroup>
              <col style={{ width: COL.tarea }} />
              <col style={{ width: COL.linea }} />
              <col style={{ width: COL.proveedor }} />
              <col style={{ width: COL.zona }} />
              <col style={{ width: COL.presupuesto }} />
              <col style={{ width: COL.meses }} />
              <col style={{ width: COL.estado }} />
            </colgroup>
            <thead>
              <tr>
                <th style={thStyle}>Objeto / Tarea</th>
                <th style={thStyle}>Línea Operativa</th>
                <th style={thStyle}>Contrato y Proveedor</th>
                <th style={thStyle}>Ubicación</th>
                <th style={thStyle}>Total OPEX</th>
                <th style={thStyle}>Meses Progr.</th>
                <th style={thStyle}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((item, idx) => {
                const opx = parseOpex(item.opexDataRaw);
                const description = opx?.objeto || item.lineaOperativa || '';
                const mesesActivos = opx?.meses
                  ? opx.meses.filter((m: any) => m.total > 0).map((m: any) => m.mes.substring(0, 3))
                  : [];
                const mesesTexto = mesesActivos.length === 0 ? '—'
                  : mesesActivos.length === 12 ? '12 Meses'
                  : mesesActivos.join(', ');

                return (
                  <tr
                    key={item.id}
                    onClick={() => onItemClick?.(item)}
                    style={{
                      cursor: 'pointer',
                      animationName: 'fadeInUp',
                      animationDuration: '0.4s',
                      animationDelay: `${idx * 40}ms`,
                      animationFillMode: 'both',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.55)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    {/* Objeto / Tarea */}
                    <td style={tdStyle}>
                      <div style={cellInner}>
                        <ClipboardTaskListLtrRegular style={{ color: '#0078D4', flexShrink: 0, fontSize: '18px' }} />
                        <div style={textStack}>
                          <span style={line1}>{item.tarea}</span>
                          <span style={line2}>
                            {description.length > 60 ? description.substring(0, 60) + '...' : description}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Línea Operativa */}
                    <td style={tdStyle}>
                      <div style={cellInner}>
                        <LayerRegular style={{ flexShrink: 0, fontSize: '16px', color: '#107C41' }} />
                        <span style={line1}>{item.lineaOperativa || '—'}</span>
                      </div>
                    </td>

                    {/* Contrato y Proveedor */}
                    <td style={tdStyle}>
                      <div style={cellInner}>
                        <OrganizationRegular style={{ flexShrink: 0, fontSize: '16px', color: '#605E5C' }} />
                        <div style={textStack}>
                          <span style={line1}>{opx?.proveedor || 'No asignado'}</span>
                          <span style={line2}>Contrato: {opx?.contrato || item.contrato || '—'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Ubicación */}
                    <td style={tdStyle}>
                      <div style={cellInner}>
                        <LocationRegular style={{ flexShrink: 0, fontSize: '16px', color: '#605E5C' }} />
                        <div style={textStack}>
                          <span style={line1}>{item.zona}</span>
                          {item.estacion && <span style={line2}>{item.estacion}</span>}
                        </div>
                      </div>
                    </td>

                    {/* Total OPEX */}
                    <td style={tdStyle}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#003057', whiteSpace: 'nowrap' }}>
                        {item.presupuestoPlan ? formatter.format(item.presupuestoPlan) : '—'}
                      </span>
                    </td>

                    {/* Meses Progr. */}
                    <td style={tdStyle}>
                      <span style={{ fontSize: '12px', color: '#323130' }}>{mesesTexto}</span>
                    </td>

                    {/* Estado */}
                    <td style={tdStyle}>
                      <StatusBadge estado={item.estado} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
