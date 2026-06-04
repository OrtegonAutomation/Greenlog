// ============================================================
// ActivityDetailPanel — Detalle completo de actividad ambiental
// ============================================================
import React, { useMemo } from 'react';
import {
  makeStyles, tokens,
  OverlayDrawer, DrawerHeader, DrawerHeaderTitle, DrawerBody,
  Button, Badge,
} from '@fluentui/react-components';
import {
  DismissRegular, EditRegular, DeleteRegular,
  CalendarLtrRegular, PersonRegular, LocationRegular,
  DocumentRegular, MoneyRegular, ShieldCheckmarkRegular,
  ClipboardTaskListLtrRegular, ArrowTrendingRegular,
  BuildingRegular, TagRegular, InfoRegular,
} from '@fluentui/react-icons';
import { ActividadAmbiental, MATRICES_AMBIENTALES, LINEAS_OPERATIVAS } from '../../types';
import { StatusBadge, PrioridadBadge } from '../shared/StatusBadge';
import { CENIT_COLORS } from '../../theme/cenitTheme';

// ── Estilos ───────────────────────────────────────────────────
const useStyles = makeStyles({
  drawer: { '--drawer-size': '560px' } as any,

  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    padding: '0',
    overflowY: 'auto',
    overflowX: 'hidden',
  },

  // ── Hero ──────────────────────────────────────────────────
  hero: {
    background: 'linear-gradient(135deg, #001a5c 0%, #0033A0 55%, #0056D2 100%)',
    padding: '24px 24px 20px',
    color: '#fff',
    position: 'relative',
    overflow: 'hidden',
    flexShrink: 0,
  },
  heroAccent: {
    position: 'absolute', top: '-40px', right: '-40px',
    width: '220px', height: '220px',
    background: 'radial-gradient(circle, rgba(140,198,63,0.18) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  heroAccent2: {
    position: 'absolute', bottom: '-20px', left: '30%',
    width: '160px', height: '160px',
    background: 'radial-gradient(circle, rgba(0,86,210,0.25) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  heroLinea: {
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em',
    textTransform: 'uppercase', opacity: 0.65, marginBottom: '6px',
    position: 'relative', zIndex: 1,
  },
  heroTitle: {
    fontSize: '19px', fontWeight: 800, lineHeight: '1.3',
    position: 'relative', zIndex: 1, marginBottom: '14px',
  },
  heroBadges: {
    display: 'flex', gap: '8px', alignItems: 'center',
    position: 'relative', zIndex: 1, flexWrap: 'wrap',
  },
  heroMeta: {
    display: 'flex', gap: '16px', marginTop: '14px', flexWrap: 'wrap',
    position: 'relative', zIndex: 1,
    borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '12px',
  },
  heroMetaItem: {
    display: 'flex', alignItems: 'center', gap: '5px',
    fontSize: '12px', opacity: 0.8,
  },

  // ── Avance strip ─────────────────────────────────────────
  avanceStrip: {
    background: 'rgba(0,51,160,0.04)',
    borderBottom: '1px solid rgba(0,51,160,0.08)',
    padding: '12px 24px',
    display: 'flex', alignItems: 'center', gap: '14px',
    flexShrink: 0,
  },
  avancePct: {
    fontSize: '26px', fontWeight: 800, color: CENIT_COLORS.blueBrand,
    minWidth: '56px',
  },
  progressTrack: {
    flex: 1, height: '8px', borderRadius: '4px',
    backgroundColor: 'rgba(0,0,0,0.07)', overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: '4px',
    transition: 'width 0.8s cubic-bezier(0.33, 1, 0.68, 1)',
  },

  // ── Contenido scrollable ──────────────────────────────────
  content: {
    flex: 1, overflowY: 'auto', overflowX: 'hidden',
    display: 'flex', flexDirection: 'column', gap: '0',
  },

  // ── Secciones ────────────────────────────────────────────
  section: {
    padding: '18px 24px',
    borderBottom: '1px solid rgba(0,0,0,0.05)',
  },
  sectionHeader: {
    display: 'flex', alignItems: 'center', gap: '7px',
    marginBottom: '14px',
    color: CENIT_COLORS.blueBrand,
    fontSize: '11px', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.08em',
  },
  sectionIcon: { fontSize: '15px', color: CENIT_COLORS.blueLight },

  // ── Grid de campos ────────────────────────────────────────
  grid2: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: '12px 20px',
  },
  grid3: {
    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
    gap: '12px 16px',
  },
  grid1: { display: 'flex', flexDirection: 'column', gap: '10px' },

  fieldBlock: { display: 'flex', flexDirection: 'column', gap: '2px' },
  fieldLabel: {
    fontSize: '10px', fontWeight: 700,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase', letterSpacing: '0.05em',
  },
  fieldValue: {
    fontSize: '13px', fontWeight: 500,
    color: tokens.colorNeutralForeground1, lineHeight: '1.4',
  },
  fieldEmpty: {
    fontSize: '12px', fontStyle: 'italic',
    color: tokens.colorNeutralForeground4,
  },

  // ── Tarjetas de presupuesto ───────────────────────────────
  budgetGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px',
    marginBottom: '12px',
  },
  budgetCard: {
    background: 'linear-gradient(135deg, rgba(0,51,160,0.04) 0%, rgba(0,86,210,0.02) 100%)',
    borderRadius: '10px', padding: '12px 10px',
    border: '1px solid rgba(0,51,160,0.08)', textAlign: 'center',
  },
  budgetValue: {
    fontSize: '15px', fontWeight: 800,
    color: CENIT_COLORS.blueBrand, lineHeight: '1.2',
  },
  budgetLabel: {
    fontSize: '10px', color: tokens.colorNeutralForeground3,
    marginTop: '3px', fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },

  // ── OPEX info chip row ───────────────────────────────────
  opexInfoRow: {
    display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px',
  },
  opexChip: {
    display: 'flex', alignItems: 'center', gap: '5px',
    background: 'rgba(0,51,160,0.05)', borderRadius: '20px',
    padding: '4px 10px', fontSize: '12px',
    border: '1px solid rgba(0,51,160,0.1)',
    color: CENIT_COLORS.blueBrand,
  },

  // ── Grid mensual ─────────────────────────────────────────
  mesesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '6px',
  },
  mesCard: {
    borderRadius: '8px', padding: '9px 8px',
    border: '1px solid',
    textAlign: 'center',
  },
  mesNombre: {
    fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.05em', display: 'block', marginBottom: '3px',
  },
  mesPrecio: { fontSize: '10px', display: 'block', marginBottom: '2px' },
  mesCant: { fontSize: '10px', display: 'block', marginBottom: '4px' },
  mesTotal: { fontSize: '12px', fontWeight: 700, display: 'block' },

  // ── Matrices ─────────────────────────────────────────────
  matricesWrap: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' },

  // ── Footer ───────────────────────────────────────────────
  footer: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 20px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    flexShrink: 0,
  },

  timestamps: {
    fontSize: '10px', color: tokens.colorNeutralForeground4,
    fontStyle: 'italic', textAlign: 'right',
    padding: '10px 24px 4px',
  },
});

// ── Helpers ───────────────────────────────────────────────────
const fmtDate = (d?: string) => {
  if (!d) return '—';
  return d.split('-').reverse().join('/');
};

const fmtCOP = (n?: number) => {
  if (!n && n !== 0) return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(n);
};

const fmtCOPShort = (n: number) => {
  if (n === 0) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
};

const parseOpex = (raw?: string) => {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

const getLineaLabel = (value: string) =>
  LINEAS_OPERATIVAS.find((lo) => lo.value === value)?.label ?? value;

function progressColor(pct: number): string {
  if (pct >= 80) return 'linear-gradient(90deg, #16a34a 0%, #4ade80 100%)';
  if (pct >= 50) return 'linear-gradient(90deg, #0056D2 0%, #38bdf8 100%)';
  if (pct >= 25) return 'linear-gradient(90deg, #F59E0B 0%, #fbbf24 100%)';
  return 'linear-gradient(90deg, #EF4444 0%, #f87171 100%)';
}

const MES_ABREV: Record<string, string> = {
  Enero:'Ene', Febrero:'Feb', Marzo:'Mar', Abril:'Abr',
  Mayo:'May', Junio:'Jun', Julio:'Jul', Agosto:'Ago',
  Septiembre:'Sep', Octubre:'Oct', Noviembre:'Nov', Diciembre:'Dic',
};

// ── Props ─────────────────────────────────────────────────────
interface ActivityDetailPanelProps {
  actividad: ActividadAmbiental | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (actividad: ActividadAmbiental) => void;
  onDelete?: (id: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canReview?: boolean;
  onApprove?: (actividad: ActividadAmbiental) => void;
  onReject?: (actividad: ActividadAmbiental) => void;
}

// ── Componente ────────────────────────────────────────────────
export const ActivityDetailPanel: React.FC<ActivityDetailPanelProps> = ({
  actividad,
  open,
  onClose,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = !!onDelete,
  canReview = false,
  onApprove,
  onReject,
}) => {
  const styles = useStyles();

  const opx = useMemo(() => parseOpex(actividad?.opexDataRaw), [actividad?.opexDataRaw]);

  const matricesLabels = useMemo(() => {
    if (!actividad?.matricesAplicables?.length) return [];
    return actividad.matricesAplicables.map(
      (m) => MATRICES_AMBIENTALES.find((ma) => ma.value === m)?.label ?? m
    );
  }, [actividad]);

  const mesesActivos = useMemo(() =>
    (opx?.meses ?? []).filter((m: any) => m.total > 0),
  [opx]);

  const esMonitoreo = actividad?.lineaOperativa === 'Monitoreos';

  if (!actividad) return null;

  const Field = ({ label, value, empty }: { label: string; value?: string | number | null; empty?: string }) => (
    <div className={styles.fieldBlock}>
      <span className={styles.fieldLabel}>{label}</span>
      {value || value === 0 ? (
        <span className={styles.fieldValue}>{value}</span>
      ) : (
        <span className={styles.fieldEmpty}>{empty ?? 'Sin especificar'}</span>
      )}
    </div>
  );

  return (
    <OverlayDrawer
      position="end"
      size="large"
      open={open}
      onOpenChange={(_, s) => { if (!s.open) onClose(); }}
      className={styles.drawer}
    >
      <DrawerHeader style={{ padding: '12px 16px 10px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <DrawerHeaderTitle
          action={
            <Button appearance="subtle" aria-label="Cerrar" icon={<DismissRegular />} onClick={onClose} />
          }
        >
          <span style={{ fontSize: '13px', color: tokens.colorNeutralForeground3, fontWeight: 500 }}>
            Detalle de actividad
          </span>
        </DrawerHeaderTitle>
      </DrawerHeader>

      <DrawerBody className={styles.body}>

        {/* ══ HERO ══════════════════════════════════════════════ */}
        <div className={styles.hero}>
          <div className={styles.heroAccent} />
          <div className={styles.heroAccent2} />

          <div className={styles.heroLinea}>{getLineaLabel(actividad.lineaOperativa)}</div>
          <div className={styles.heroTitle}>{actividad.tarea}</div>

          <div className={styles.heroBadges}>
            <StatusBadge estado={actividad.estado} />
            <PrioridadBadge prioridad={actividad.prioridad} />
            {actividad.cuenta && (
              <span style={{
                background: 'rgba(255,255,255,0.15)', borderRadius: '20px',
                padding: '2px 10px', fontSize: '11px', fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.25)',
              }}>
                {actividad.cuenta}
              </span>
            )}
          </div>

          <div className={styles.heroMeta}>
            {actividad.zona && (
              <span className={styles.heroMetaItem}>
                <LocationRegular style={{ fontSize: '13px' }} />
                {actividad.zona}{actividad.estacion ? ` · ${actividad.estacion}` : ''}
              </span>
            )}
            {actividad.responsable && (
              <span className={styles.heroMetaItem}>
                <PersonRegular style={{ fontSize: '13px' }} />
                {actividad.responsable}
              </span>
            )}
            {(opx?.contrato || actividad.contrato) && (
              <span className={styles.heroMetaItem}>
                <TagRegular style={{ fontSize: '13px' }} />
                {opx?.contrato || actividad.contrato}
              </span>
            )}
          </div>
        </div>

        {/* ══ BARRA DE AVANCE ══════════════════════════════════ */}
        <div className={styles.avanceStrip}>
          <span className={styles.avancePct}>{actividad.porcentajeAvance}%</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', color: tokens.colorNeutralForeground3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }}>
              Avance de ejecución
            </div>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${actividad.porcentajeAvance}%`, background: progressColor(actividad.porcentajeAvance) }}
              />
            </div>
          </div>
          <ArrowTrendingRegular style={{ fontSize: '18px', color: tokens.colorNeutralForeground3 }} />
        </div>

        {/* ══ CONTENIDO SCROLLABLE ════════════════════════════ */}
        <div className={styles.content}>

          {/* ── Contrato OPEX ─────────────────────────────── */}
          {opx && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <BuildingRegular className={styles.sectionIcon} />
                Información del Contrato
              </div>
              <div className={styles.grid2}>
                <Field label="Proveedor" value={opx.proveedor} />
                <Field label="No. Contrato" value={opx.contrato} />
                <Field label="Administrador" value={opx.administrador || actividad.responsable} />
                {opx.unidadMedida && <Field label="Unidad de Medida" value={opx.unidadMedida} />}
              </div>
              {opx.objeto && (
                <div style={{ marginTop: '10px' }}>
                  <Field label="Objeto del Contrato" value={opx.objeto} />
                </div>
              )}
              {opx.descripcionNecesidad && (
                <div style={{ marginTop: '10px' }}>
                  <Field label="Descripción de la Necesidad" value={opx.descripcionNecesidad} />
                </div>
              )}
            </div>
          )}

          {/* ── Presupuesto ───────────────────────────────── */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <MoneyRegular className={styles.sectionIcon} />
              Presupuesto COP
            </div>
            <div className={styles.budgetGrid}>
              <div className={styles.budgetCard}>
                <div className={styles.budgetValue}>{fmtCOP(actividad.presupuestoPlan)}</div>
                <div className={styles.budgetLabel}>Plan</div>
              </div>
              <div className={styles.budgetCard}>
                <div className={styles.budgetValue} style={{ color: CENIT_COLORS.greenDark }}>
                  {fmtCOP(actividad.presupuestoEjecutado)}
                </div>
                <div className={styles.budgetLabel}>Ejecutado</div>
              </div>
            </div>
          </div>

          {/* ── Desglose mensual OPEX ─────────────────────── */}
          {opx?.meses && opx.meses.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <CalendarLtrRegular className={styles.sectionIcon} />
                Programación Mensual
                {mesesActivos.length > 0 && (
                  <span style={{
                    marginLeft: 'auto', fontWeight: 600, fontSize: '10px',
                    color: CENIT_COLORS.greenDark, textTransform: 'none', letterSpacing: 0,
                  }}>
                    {mesesActivos.length === 12 ? 'Todo el año' : `${mesesActivos.length} mes${mesesActivos.length !== 1 ? 'es' : ''} activo${mesesActivos.length !== 1 ? 's' : ''}`}
                    {' · '}Total: {fmtCOP(actividad.presupuestoPlan)}
                  </span>
                )}
              </div>

              {/* Chips de info si es monitoreo */}
              {esMonitoreo && actividad.descripcion && (
                <div className={styles.opexInfoRow}>
                  <span className={styles.opexChip}>
                    <InfoRegular style={{ fontSize: '12px' }} />
                    {actividad.descripcion}
                  </span>
                </div>
              )}

              <div className={styles.mesesGrid}>
                {opx.meses.map((m: any) => {
                  const activo = m.total > 0;
                  return (
                    <div
                      key={m.mes}
                      className={styles.mesCard}
                      style={{
                        background: activo
                          ? 'linear-gradient(135deg, rgba(0,51,160,0.06) 0%, rgba(0,86,210,0.03) 100%)'
                          : 'rgba(0,0,0,0.015)',
                        borderColor: activo ? 'rgba(0,51,160,0.18)' : 'rgba(0,0,0,0.05)',
                      }}
                    >
                      <span
                        className={styles.mesNombre}
                        style={{ color: activo ? CENIT_COLORS.blueBrand : tokens.colorNeutralForeground4 }}
                      >
                        {MES_ABREV[m.mes] ?? m.mes.substring(0, 3)}
                      </span>
                      {activo ? (
                        <>
                          {m.precio > 0 && (
                            <span className={styles.mesPrecio} style={{ color: tokens.colorNeutralForeground3 }}>
                              P: {fmtCOPShort(m.precio)}
                            </span>
                          )}
                          {m.cantidad > 0 && (
                            <span className={styles.mesCant} style={{ color: tokens.colorNeutralForeground3 }}>
                              {esMonitoreo ? `${m.cantidad} pts` : `x${m.cantidad}`}
                            </span>
                          )}
                          <span className={styles.mesTotal} style={{ color: CENIT_COLORS.blueBrand }}>
                            {fmtCOPShort(m.total)}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: '13px', color: tokens.colorNeutralForeground4 }}>—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Planificación temporal ───────────────────── */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <CalendarLtrRegular className={styles.sectionIcon} />
              Vigencia del Contrato
            </div>
            <div className={styles.grid3}>
              <Field label="Mes presupuestal" value={actividad.mes} />
              <Field label="Fecha inicio" value={fmtDate(actividad.fechaInicio)} />
              <Field label="Fecha fin" value={fmtDate(actividad.fechaFin)} />
            </div>
            {(actividad.fechaInicioReal || actividad.fechaFinReal) && (
              <div className={styles.grid2} style={{ marginTop: '10px' }}>
                <Field label="Inicio real" value={fmtDate(actividad.fechaInicioReal)} />
                <Field label="Fin real" value={fmtDate(actividad.fechaFinReal)} />
              </div>
            )}
          </div>

          {/* ── Matrices ambientales ─────────────────────── */}
          {matricesLabels.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <ShieldCheckmarkRegular className={styles.sectionIcon} />
                Matrices Ambientales Aplicables
              </div>
              <div className={styles.matricesWrap}>
                {matricesLabels.map((label) => (
                  <Badge key={label} appearance="tint" color="informative" shape="rounded" size="medium">
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* ── Estado y normatividad ────────────────────── */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <DocumentRegular className={styles.sectionIcon} />
              Estado y Normatividad
            </div>
            <div className={styles.grid2}>
              <Field label="Estado aprobación" value={actividad.estadoAprobacion} />
              <Field label="Aprobado por" value={actividad.aprobadoPor} />
            </div>
            {actividad.cumplimientoNormativo && (
              <div style={{ marginTop: '10px' }}>
                <Field label="Cumplimiento normativo" value={actividad.cumplimientoNormativo} />
              </div>
            )}
            {actividad.novedades && (
              <div style={{ marginTop: '10px' }}>
                <Field label="Novedades / Observaciones" value={actividad.novedades} />
              </div>
            )}
          </div>

          {/* ── Descripción ──────────────────────────────── */}
          {actividad.descripcion && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <ClipboardTaskListLtrRegular className={styles.sectionIcon} />
                Descripción
              </div>
              <p style={{
                margin: 0, fontSize: '13px', lineHeight: '1.65',
                color: tokens.colorNeutralForeground2, whiteSpace: 'pre-wrap',
              }}>
                {actividad.descripcion}
              </p>
            </div>
          )}

          {/* Timestamps */}
          {(actividad.creadoEn || actividad.actualizadoEn) && (
            <div className={styles.timestamps}>
              {actividad.creadoEn && <div>Creado: {fmtDate(actividad.creadoEn)}</div>}
              {actividad.actualizadoEn && <div>Actualizado: {fmtDate(actividad.actualizadoEn)}</div>}
            </div>
          )}

        </div>{/* fin content */}

        {/* ══ FOOTER ═══════════════════════════════════════════ */}
        <div className={styles.footer}>
          {canDelete ? (
            <Button
              appearance="subtle"
              icon={<DeleteRegular />}
              style={{ color: CENIT_COLORS.red }}
              onClick={() => onDelete?.(actividad.id)}
            >
              Eliminar
            </Button>
          ) : <span />}
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button appearance="secondary" onClick={onClose}>Cerrar</Button>
            {canReview && (
              <>
                <Button appearance="secondary" onClick={() => onReject?.(actividad)}>
                  Rechazar
                </Button>
                <Button
                  appearance="primary"
                  style={{ background: CENIT_COLORS.green, color: '#003057', borderRadius: '10px', fontWeight: 700 }}
                  onClick={() => onApprove?.(actividad)}
                >
                  Aprobar
                </Button>
              </>
            )}
            {canEdit && (
              <Button
                appearance="primary"
                icon={<EditRegular />}
                style={{
                  background: 'linear-gradient(135deg, #0033A0 0%, #0056D2 100%)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,51,160,0.3)',
                  borderRadius: '10px',
                }}
                onClick={() => onEdit?.(actividad)}
              >
                Editar
              </Button>
            )}
          </div>
        </div>

      </DrawerBody>
    </OverlayDrawer>
  );
};
