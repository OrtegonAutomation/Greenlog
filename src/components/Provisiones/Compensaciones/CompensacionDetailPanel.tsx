// ============================================================
// CompensacionDetailPanel — Drawer con timeline de mantenimientos
// ============================================================
import React from 'react';
import {
  makeStyles, shorthands, tokens, mergeClasses,
  Title3, Caption1, Badge,
} from '@fluentui/react-components';
import {
  DismissRegular,
  CheckmarkCircle20Filled,
  Clock20Regular,
  CircleSmall20Filled,
} from '@fluentui/react-icons';
import { Compensacion, NivelRiesgo } from '../../../types/provisiones';
import { CENIT_COLORS } from '../../../theme/cenitTheme';

const RIESGO_COLORS: Record<NivelRiesgo, { color: string; bg: string }> = {
  'Alto':  { color: '#dc2626', bg: '#fef2f2' },
  'Medio': { color: '#d97706', bg: '#fffbeb' },
  'Bajo':  { color: '#16a34a', bg: '#f0fdf4' },
};

const useStyles = makeStyles({
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.3)',
    backdropFilter: 'blur(4px)',
    zIndex: 100,
    animationName: { from: { opacity: '0' }, to: { opacity: '1' } },
    animationDuration: '0.2s',
    animationFillMode: 'both',
  },
  drawer: {
    position: 'fixed',
    top: 0, right: 0, bottom: 0,
    width: '580px',
    maxWidth: '100vw',
    background: '#fff',
    boxShadow: '-12px 0 48px rgba(0,0,0,0.12)',
    zIndex: 101,
    display: 'flex',
    flexDirection: 'column',
    animationName: { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
    animationDuration: '0.3s',
    animationTimingFunction: 'cubic-bezier(0.16,1,0.3,1)',
    animationFillMode: 'both',
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('20px', '24px'),
    ...shorthands.borderBottom('1px', 'solid', 'rgba(0,0,0,0.06)'),
    flexShrink: 0,
  },
  closeBtn: {
    width: '36px', height: '36px', minWidth: '36px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '10px', cursor: 'pointer',
    transition: 'background 0.15s ease',
    color: tokens.colorNeutralForeground2,
    ':hover': { background: 'rgba(0,0,0,0.06)' },
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    ...shorthands.padding('24px'),
  },

  // Progress
  progressSection: {
    marginBottom: '24px',
  },
  progressBar: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    marginTop: '8px',
  },
  progressTrack: {
    flex: 1,
    height: '10px',
    background: 'rgba(0,0,0,0.04)',
    borderRadius: '5px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '5px',
    transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
  },
  progressLabel: {
    fontSize: '14px',
    fontWeight: '700',
    minWidth: '40px',
    textAlign: 'right' as const,
  },

  // Info
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: CENIT_COLORS.blueBrand,
    marginBottom: '12px',
    ...shorthands.borderBottom('2px', 'solid', CENIT_COLORS.blueBrand),
    paddingBottom: '6px',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    ...shorthands.gap('8px', '16px'),
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
  },
  infoLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  infoValue: {
    fontSize: '14px',
    fontWeight: '500',
    color: tokens.colorNeutralForeground1,
    marginTop: '2px',
  },

  // Timeline
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('0'),
    position: 'relative',
  },
  timelineItem: {
    display: 'flex',
    alignItems: 'flex-start',
    ...shorthands.gap('12px'),
    position: 'relative',
    paddingBottom: '16px',
  },
  timelineLine: {
    position: 'absolute',
    left: '13px',
    top: '28px',
    bottom: 0,
    width: '2px',
    background: 'rgba(0,0,0,0.06)',
  },
  timelineDot: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    zIndex: 1,
    fontSize: '11px',
    fontWeight: '700',
    transition: 'all 0.2s ease',
  },
  timelineDotAprobado: {
    background: '#dcfce7',
    color: '#16a34a',
  },
  timelineDotPendiente: {
    background: '#fef3c7',
    color: '#d97706',
  },
  timelineDotRevision: {
    background: '#dbeafe',
    color: '#2563eb',
  },
  timelineDotEmpty: {
    background: '#f1f5f9',
    color: '#94a3b8',
    ...shorthands.border('2px', 'dashed', 'rgba(0,0,0,0.1)'),
  },
  timelineContent: {
    display: 'flex',
    flexDirection: 'column',
    paddingTop: '4px',
  },
  timelineTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
  },
  timelineDate: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    marginTop: '2px',
  },
  timelineBadge: {
    marginTop: '4px',
    fontSize: '10px',
    fontWeight: '700',
    ...shorthands.padding('2px', '8px'),
    borderRadius: '10px',
    display: 'inline-block',
    width: 'fit-content',
  },
});

interface Props {
  compensacion: Compensacion | null;
  open: boolean;
  onClose: () => void;
}

export const CompensacionDetailPanel: React.FC<Props> = ({ compensacion, open, onClose }) => {
  const styles = useStyles();

  if (!open || !compensacion) return null;

  const avance = compensacion.areaPlaneadoHa > 0
    ? Math.round((compensacion.areaEjecutadoHa / compensacion.areaPlaneadoHa) * 100)
    : 0;
  const riesgo = RIESGO_COLORS[compensacion.riesgoReal];

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.drawer}>
        <div className={styles.drawerHeader}>
          <div>
            <Title3 style={{ color: '#003057' }}>{compensacion.id}</Title3>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
              {compensacion.medidaCompensacion} — Provisión {compensacion.provisionId}
            </Caption1>
          </div>
          <div className={styles.closeBtn} onClick={onClose}><DismissRegular /></div>
        </div>

        <div className={styles.body}>
          {/* Progress */}
          <div className={styles.progressSection}>
            <Caption1 style={{ fontWeight: '600' }}>Avance de Área</Caption1>
            <div className={styles.progressBar}>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: `${avance}%`,
                    background: avance >= 80 ? CENIT_COLORS.green : avance >= 40 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
              <span className={styles.progressLabel} style={{
                color: avance >= 80 ? CENIT_COLORS.green : avance >= 40 ? '#f59e0b' : '#ef4444',
              }}>
                {avance}%
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <Caption1>{compensacion.areaEjecutadoHa} ha ejecutadas</Caption1>
              <Caption1>{compensacion.areaPlaneadoHa} ha planeadas</Caption1>
            </div>
          </div>

          {/* Información */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Información General</div>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Zona</span>
                <span className={styles.infoValue}>{compensacion.zona}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Responsable</span>
                <span className={styles.infoValue}>{compensacion.responsable}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Categoría</span>
                <span className={styles.infoValue}>{compensacion.categoria}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Estado</span>
                <span className={styles.infoValue}>{compensacion.estado}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Árboles</span>
                <span className={styles.infoValue}>{compensacion.cantidadArboles.toLocaleString('es-CO')}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Riesgo</span>
                <span className={styles.infoValue} style={{
                  display: 'inline-block', padding: '2px 10px', borderRadius: '10px',
                  background: riesgo.bg, color: riesgo.color, fontWeight: '700', width: 'fit-content',
                }}>
                  {compensacion.riesgoReal}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Ubicación</span>
                <span className={styles.infoValue}>{compensacion.departamento}, {compensacion.municipio}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Vereda</span>
                <span className={styles.infoValue}>{compensacion.vereda}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Fecha Inicio</span>
                <span className={styles.infoValue}>{compensacion.fechaInicio}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Fecha Terminación</span>
                <span className={styles.infoValue}>{compensacion.fechaTerminacion}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Duración</span>
                <span className={styles.infoValue}>{compensacion.periodoDuracion} años</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Prioritaria</span>
                <span className={styles.infoValue}>{compensacion.prioritaria ? 'Sí' : 'No'}</span>
              </div>
            </div>
          </div>

          {/* Descripción */}
          {compensacion.descripcionObligacion && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Descripción de la Obligación</div>
              <p style={{ fontSize: '14px', lineHeight: '1.6', color: tokens.colorNeutralForeground1, margin: 0 }}>
                {compensacion.descripcionObligacion}
              </p>
            </div>
          )}

          {/* Plan de acción */}
          {compensacion.planAccion && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Plan de Acción</div>
              <p style={{ fontSize: '14px', lineHeight: '1.6', color: tokens.colorNeutralForeground1, margin: 0 }}>
                {compensacion.planAccion}
              </p>
            </div>
          )}

          {/* Timeline de informes */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Informes de Mantenimiento (15)</div>
            <div className={styles.timeline}>
              {compensacion.informesMantenimiento.map((informe, idx) => {
                const isLast = idx === compensacion.informesMantenimiento.length - 1;
                const hasData = !!informe.fecha;

                let dotClass = styles.timelineDotEmpty;
                let badgeStyle = {};
                if (informe.estado === 'Aprobado') {
                  dotClass = styles.timelineDotAprobado;
                  badgeStyle = { background: '#dcfce7', color: '#16a34a' };
                } else if (informe.estado === 'Pendiente') {
                  dotClass = styles.timelineDotPendiente;
                  badgeStyle = { background: '#fef3c7', color: '#d97706' };
                } else if (informe.estado === 'En revisión') {
                  dotClass = styles.timelineDotRevision;
                  badgeStyle = { background: '#dbeafe', color: '#2563eb' };
                }

                return (
                  <div key={informe.numero} className={styles.timelineItem}>
                    {!isLast && <div className={styles.timelineLine} />}
                    <div className={mergeClasses(styles.timelineDot, dotClass)}>
                      {hasData ? (
                        informe.estado === 'Aprobado' ? <CheckmarkCircle20Filled /> : informe.numero
                      ) : informe.numero}
                    </div>
                    <div className={styles.timelineContent}>
                      <span className={styles.timelineTitle}>
                        Informe {informe.numero}
                      </span>
                      {informe.fecha && (
                        <span className={styles.timelineDate}>{informe.fecha}</span>
                      )}
                      {informe.estado && (
                        <span className={styles.timelineBadge} style={badgeStyle}>
                          {informe.estado}
                        </span>
                      )}
                      {!hasData && (
                        <span className={styles.timelineDate}>Pendiente</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Observaciones */}
          {compensacion.observaciones && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Observaciones</div>
              <p style={{ fontSize: '14px', lineHeight: '1.6', color: tokens.colorNeutralForeground1, margin: 0 }}>
                {compensacion.observaciones}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
