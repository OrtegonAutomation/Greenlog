// ============================================================
// ActivityTable — Tabla de actividades con filtros y skeleton
// ============================================================
import React, { useMemo, useState } from 'react';
import {
  makeStyles, shorthands, tokens, mergeClasses,
  DataGrid, DataGridBody, DataGridCell, DataGridHeader,
  DataGridHeaderCell, DataGridRow, TableColumnDefinition, createTableColumn,
  TableCellLayout, Input, Button, Caption1,
  Tooltip,
} from '@fluentui/react-components';
import {
  SearchRegular, DismissRegular, FilterRegular,
  CalendarLtrRegular, PersonRegular, LocationRegular,
  ClipboardTaskListLtrRegular,
} from '@fluentui/react-icons';
import { ActividadAmbiental, EstadoActividad } from '../../types';
import { StatusBadge, PrioridadBadge } from '../shared/StatusBadge';
import { SkeletonTable } from '../shared/SkeletonLoader';
import { EmptyState } from '../shared/EmptyState';
import { CENIT_COLORS } from '../../theme/cenitTheme';

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
  searchWrap: { flex: '1 1 220px', maxWidth: '360px' },
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
    background: 'linear-gradient(135deg, #003057 0%, #004b87 100%)', // Blue Cenit Brand
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
    overflow: 'hidden',
    boxShadow: '0 10px 40px rgba(0,0,0,0.04), 0 2px 10px rgba(0,0,0,0.02)',
    background: 'rgba(255,255,255,0.4)', // More transparent
    backdropFilter: 'blur(20px) saturate(180%)',
  },
  // Row animation
  row: {
    animationName: {
      from: { opacity: '0', transform: 'translateY(10px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    },
    animationDuration: '0.4s',
    animationFillMode: 'both',
    animationTimingFunction: 'cubic-bezier(0.33, 1, 0.68, 1)',
    transition: 'background-color 0.2s ease, transform 0.2s ease',
    ':hover': {
      backgroundColor: 'rgba(255,255,255,0.5)',
      transform: 'scale(1.002)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
      zIndex: 1,
      position: 'relative',
    },
  },
  progressMini: {
    height: '6px',
    borderRadius: '3px',
    backgroundColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
    marginTop: '6px',
    width: '100px',
  },
  progressFill: {
    height: '100%',
    borderRadius: '3px',
    // Gradient for progress
    background: 'linear-gradient(90deg, #16a34a 0%, #4ade80 100%)',
    transition: 'width 1s cubic-bezier(0.33, 1, 0.68, 1)',
  },
  count: {
    color: tokens.colorNeutralForeground3,
    fontSize: '12px',
    marginLeft: 'auto',
    fontWeight: '600',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
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

// ── Columnas ──────────────────────────────────────────────────
function buildColumns(): TableColumnDefinition<ActividadAmbiental>[] {
  return [
    createTableColumn({
      columnId: 'tarea',
      compare: (a, b) => a.tarea.localeCompare(b.tarea),
      renderHeaderCell: () => 'Tarea',
      renderCell: (item) => (
        <TableCellLayout media={<ClipboardTaskListLtrRegular style={{ color: '#0078D4' }} />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontWeight: 500, fontSize: '14px' }}>{item.tarea}</span>
            <span style={{ fontSize: '11px', color: '#605E5C' }}>{item.tipo}</span>
          </div>
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'responsable',
      compare: (a, b) => a.responsable.localeCompare(b.responsable),
      renderHeaderCell: () => 'Responsable',
      renderCell: (item) => (
        <TableCellLayout media={<PersonRegular />}>{item.responsable}</TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'fechas',
      renderHeaderCell: () => 'Período',
      renderCell: (item) => (
        <TableCellLayout media={<CalendarLtrRegular />}>
          <span style={{ fontSize: '13px' }}>
            {item.fechaInicio.split('-').reverse().join('/')} – {item.fechaFin.split('-').reverse().join('/')}
          </span>
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'ubicacionZona',
      renderHeaderCell: () => 'Zona',
      renderCell: (item) => (
        <TableCellLayout media={<LocationRegular />}>
          <span style={{ fontSize: '13px' }}>{item.ubicacionZona}</span>
        </TableCellLayout>
      ),
    }),
    createTableColumn({
      columnId: 'avance',
      compare: (a, b) => a.porcentajeAvance - b.porcentajeAvance,
      renderHeaderCell: () => 'Avance',
      renderCell: (item) => {
        const styles = useStyles(); // eslint-disable-line react-hooks/rules-of-hooks
        return (
          <div>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{item.porcentajeAvance}%</span>
            <div className={styles.progressMini}>
              <div className={styles.progressFill} style={{ width: `${item.porcentajeAvance}%` }} />
            </div>
          </div>
        );
      },
    }),
    createTableColumn({
      columnId: 'prioridad',
      compare: (a, b) => a.prioridad.localeCompare(b.prioridad),
      renderHeaderCell: () => 'Prioridad',
      renderCell: (item) => <PrioridadBadge prioridad={item.prioridad} />,
    }),
    createTableColumn({
      columnId: 'estado',
      compare: (a, b) => a.estado.localeCompare(b.estado),
      renderHeaderCell: () => 'Estado',
      renderCell: (item) => <StatusBadge estado={item.estado} />,
    }),
  ];
}

const COLUMNS = buildColumns();

// ── Componente ────────────────────────────────────────────────
interface ActivityTableProps {
  actividades: ActividadAmbiental[];
  cargando: boolean;
  onNueva: () => void;
}

export const ActivityTable: React.FC<ActivityTableProps> = ({ actividades, cargando, onNueva }) => {
  const styles = useStyles();
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoActividad | 'Todos'>('Todos');

  const filtradas = useMemo(() => {
    const q = search.toLowerCase().trim();
    return actividades.filter((a) => {
      const matchEstado = filtroEstado === 'Todos' || a.estado === filtroEstado;
      if (!matchEstado) return false;
      if (!q) return true;
      return (
        a.tarea.toLowerCase().includes(q) ||
        a.responsable.toLowerCase().includes(q) ||
        a.ubicacionZona.toLowerCase().includes(q) ||
        a.tipo.toLowerCase().includes(q)
      );
    });
  }, [actividades, search, filtroEstado]);

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
            actionLabel={!search && filtroEstado === 'Todos' ? 'Crear primera actividad' : undefined}
            onAction={!search && filtroEstado === 'Todos' ? onNueva : undefined}
          />
        ) : (
          <DataGrid
            items={filtradas}
            columns={COLUMNS}
            sortable
            getRowId={(item) => item.id}
            focusMode="composite"
            style={{ width: '100%' }}
          >
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell }) => (
                  <DataGridHeaderCell style={{ fontWeight: 600, fontSize: '13px' }}>
                    {renderHeaderCell()}
                  </DataGridHeaderCell>
                )}
              </DataGridRow>
            </DataGridHeader>

            <DataGridBody<ActividadAmbiental>>
              {({ item, rowId }) => (
                <DataGridRow<ActividadAmbiental>
                  key={rowId}
                  className={styles.row}
                  style={{ animationDelay: `${filtradas.indexOf(item) * 40}ms` }}
                >
                  {({ renderCell }) => (
                    <DataGridCell>{renderCell(item)}</DataGridCell>
                  )}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>
        )}
      </div>
    </div>
  );
};
