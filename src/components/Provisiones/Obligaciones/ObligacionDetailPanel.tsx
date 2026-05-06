// ============================================================
// ObligacionDetailPanel — Drawer read-only con pipeline visual
// ============================================================
import React from 'react';
import {
  makeStyles, shorthands, tokens, mergeClasses,
  Title3, Body1, Caption1,
} from '@fluentui/react-components';
import { DismissRegular, CheckmarkCircle20Filled } from '@fluentui/react-icons';
import { Provision, EstadoProvision, ESTADOS_PROVISION } from '../../../types/provisiones';
import { CENIT_COLORS } from '../../../theme/cenitTheme';

const fmtCOP = (n: number) => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B COP`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M COP`;
  return `$${n.toLocaleString('es-CO')} COP`;
};

const PIPELINE: EstadoProvision[] = [
  'Notificada', 'ID Generado', 'En Estimación', 'Solicitud Enviada',
  'En Revisión Operaciones', 'Recursos Asignados', 'En Ejecución', 'En Facturación', 'Cerrada',
];

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
    width: '620px',
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

  // Pipeline
  pipeline: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('0'),
    marginBottom: '28px',
    overflowX: 'auto',
    ...shorthands.padding('4px', '0'),
  },
  pipelineStep: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.gap('4px'),
    position: 'relative',
    flex: 1,
    minWidth: '70px',
  },
  pipelineDot: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '700',
    ...shorthands.border('2px', 'solid', 'rgba(0,0,0,0.1)'),
    background: '#f8fafc',
    color: '#94a3b8',
    transition: 'all 0.3s ease',
    zIndex: 1,
  },
  pipelineDotDone: {
    background: CENIT_COLORS.green,
    ...shorthands.border('2px', 'solid', CENIT_COLORS.green),
    color: '#fff',
  },
  pipelineDotCurrent: {
    background: CENIT_COLORS.blueBrand,
    ...shorthands.border('2px', 'solid', CENIT_COLORS.blueBrand),
    color: '#fff',
    boxShadow: `0 0 0 4px rgba(0,51,160,0.15)`,
    transform: 'scale(1.15)',
  },
  pipelineLabel: {
    fontSize: '9px',
    fontWeight: '600',
    color: '#94a3b8',
    textAlign: 'center' as const,
    lineHeight: '1.2',
    maxWidth: '70px',
  },
  pipelineLabelActive: {
    color: CENIT_COLORS.blueBrand,
    fontWeight: '700',
  },
  pipelineLine: {
    position: 'absolute',
    top: '14px',
    left: '50%',
    width: '100%',
    height: '2px',
    background: 'rgba(0,0,0,0.08)',
    zIndex: 0,
  },
  pipelineLineDone: {
    background: CENIT_COLORS.green,
  },

  // Info sections
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

  // Financial table
  finTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px',
    marginTop: '12px',
  },
  finTh: {
    ...shorthands.padding('8px', '10px'),
    textAlign: 'right',
    fontWeight: '700',
    fontSize: '11px',
    color: '#003057',
    ...shorthands.borderBottom('2px', 'solid', 'rgba(0,0,0,0.06)'),
  },
  finTd: {
    ...shorthands.padding('6px', '10px'),
    textAlign: 'right',
    ...shorthands.borderBottom('1px', 'solid', 'rgba(0,0,0,0.04)'),
  },
});

interface Props {
  provision: Provision | null;
  open: boolean;
  onClose: () => void;
}

export const ObligacionDetailPanel: React.FC<Props> = ({ provision, open, onClose }) => {
  const styles = useStyles();

  if (!open || !provision) return null;

  const currentIdx = PIPELINE.indexOf(provision.estadoAvance);
  const years = Object.keys(provision.valorProvisionAnual).map(Number).sort();

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.drawer}>
        <div className={styles.drawerHeader}>
          <div>
            <Title3 style={{ color: '#003057' }}>{provision.id}</Title3>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
              {provision.tipoObligacion} — {provision.zona}
            </Caption1>
          </div>
          <div className={styles.closeBtn} onClick={onClose}><DismissRegular /></div>
        </div>

        <div className={styles.body}>
          {/* Pipeline Visual */}
          <div className={styles.pipeline}>
            {PIPELINE.map((step, i) => {
              const isDone = i < currentIdx;
              const isCurrent = i === currentIdx;
              return (
                <div key={step} className={styles.pipelineStep}>
                  {i < PIPELINE.length - 1 && (
                    <div className={mergeClasses(styles.pipelineLine, isDone && styles.pipelineLineDone)} />
                  )}
                  <div className={mergeClasses(
                    styles.pipelineDot,
                    isDone && styles.pipelineDotDone,
                    isCurrent && styles.pipelineDotCurrent,
                  )}>
                    {isDone ? <CheckmarkCircle20Filled /> : i + 1}
                  </div>
                  <span className={mergeClasses(
                    styles.pipelineLabel,
                    (isDone || isCurrent) && styles.pipelineLabelActive,
                  )}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Identificación */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Identificación</div>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Zona</span>
                <span className={styles.infoValue}>{provision.zona}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Responsable</span>
                <span className={styles.infoValue}>{provision.responsable}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Sistema</span>
                <span className={styles.infoValue}>{provision.sistema}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Troncal</span>
                <span className={styles.infoValue}>{provision.troncal}</span>
              </div>
            </div>
          </div>

          {/* Legal */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Legal</div>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Autoridad Ambiental</span>
                <span className={styles.infoValue}>{provision.autoridadAmbiental}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Jurisdicción CAR</span>
                <span className={styles.infoValue}>{provision.jurisdiccionCAR}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Expediente</span>
                <span className={styles.infoValue}>{provision.numeroExpediente}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Acto Admin.</span>
                <span className={styles.infoValue}>
                  {provision.actoAdministrativo.tipo} {provision.actoAdministrativo.numero}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Departamento</span>
                <span className={styles.infoValue}>{provision.departamento}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Municipio</span>
                <span className={styles.infoValue}>{provision.municipio}</span>
              </div>
            </div>
          </div>

          {/* Compensación */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Compensación</div>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Medida</span>
                <span className={styles.infoValue}>{provision.medidaCompensacion}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Categoría</span>
                <span className={styles.infoValue}>{provision.categoria}</span>
              </div>
            </div>
          </div>

          {/* Financiero */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Financiero</div>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Tipo Cuenta</span>
                <span className={styles.infoValue} style={{
                  display: 'inline-block', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700',
                  background: provision.tipoCuenta === 'OPEX' ? '#eff6ff' : '#faf5ff',
                  color: provision.tipoCuenta === 'OPEX' ? '#2563eb' : '#7c3aed',
                  width: 'fit-content',
                }}>
                  {provision.tipoCuenta}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Contrato</span>
                <span className={styles.infoValue}>{provision.contrato}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Valor Total</span>
                <span className={styles.infoValue} style={{ fontWeight: '700', color: '#003057' }}>
                  {fmtCOP(provision.valorProvisionTotal)}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Uso Total</span>
                <span className={styles.infoValue}>{fmtCOP(provision.usoProvisionTotal)}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Saldo</span>
                <span className={styles.infoValue} style={{
                  fontWeight: '700',
                  color: provision.saldoProvision > 0 ? '#059669' : '#ef4444',
                }}>
                  {fmtCOP(provision.saldoProvision)}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Año Constitución</span>
                <span className={styles.infoValue}>{provision.anioConstitucion}</span>
              </div>
            </div>
          </div>

          {/* Tabla financiera anual */}
          {years.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Desglose Anual</div>
              <table className={styles.finTable}>
                <thead>
                  <tr>
                    <th className={styles.finTh} style={{ textAlign: 'left' }}>Año</th>
                    <th className={styles.finTh}>Provisión</th>
                    <th className={styles.finTh}>Uso</th>
                  </tr>
                </thead>
                <tbody>
                  {years.map(y => (
                    <tr key={y}>
                      <td className={styles.finTd} style={{ textAlign: 'left', fontWeight: '600' }}>{y}</td>
                      <td className={styles.finTd}>{fmtCOP(provision.valorProvisionAnual[y] || 0)}</td>
                      <td className={styles.finTd}>{fmtCOP(provision.usoProvisionAnual[y] || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
