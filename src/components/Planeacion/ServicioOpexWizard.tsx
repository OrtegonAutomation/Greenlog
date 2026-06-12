import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  makeStyles, shorthands, tokens, mergeClasses,
  Title2, Title3, Body1, Caption1,
  Button, Input, Portal
} from '@fluentui/react-components';
import { DismissRegular, CheckmarkRegular } from '@fluentui/react-icons';

const STEPS = [
  { label: 'Información Base' },
  { label: 'Programación Mensual' }
];
import { MonitoreosMatrizService } from '../../services/MonitoreosMatrizService';
import { CENIT_COLORS } from '../../theme/cenitTheme';
import { MEDIA, useResponsive } from '../../hooks/useResponsive';

export interface ServicioMensual {
  mes: string;
  mesIndex: number;
  cantidad: number;
  precio: number;
  total: number;
}

export interface ServicioWizardResult {
  tipo: 'servicios';
  zona: string;
  descripcion: string;
  unidadMedida: string;
  programacion: ServicioMensual[];
  valorTotal: number;
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const fmtCOP = (n: number) => `$${n.toLocaleString('es-CO')}`;

const useStyles = makeStyles({
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,12,36,0.5)',
    backdropFilter: 'blur(8px)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animationName: { from: { opacity: '0' }, to: { opacity: '1' } },
    animationDuration: '0.25s',
    animationFillMode: 'both',
  },
  wizard: {
    width: '900px',
    maxWidth: '95vw',
    maxHeight: '90vh',
    background: '#fff',
    borderRadius: '24px',
    boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  wizardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('20px', '28px'),
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
  stepsBar: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('0'),
    ...shorthands.padding('16px', '28px'),
    background: 'rgba(0,48,87,0.02)',
    ...shorthands.borderBottom('1px', 'solid', 'rgba(0,0,0,0.04)'),
    flexShrink: 0,
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    flex: 1,
  },
  stepDot: {
    width: '32px', height: '32px',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '13px', fontWeight: '700',
    ...shorthands.border('2px', 'solid', 'rgba(0,0,0,0.1)'),
    background: '#f8fafc',
    color: '#94a3b8',
    transition: 'all 0.3s ease',
    flexShrink: 0,
  },
  stepDotActive: {
    background: CENIT_COLORS.blueBrand,
    ...shorthands.border('2px', 'solid', CENIT_COLORS.blueBrand),
    color: '#fff',
    boxShadow: `0 0 0 4px rgba(0,51,160,0.15)`,
  },
  stepDotDone: {
    background: CENIT_COLORS.green,
    ...shorthands.border('2px', 'solid', CENIT_COLORS.green),
    color: '#fff',
  },
  stepLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#94a3b8',
  },
  stepLabelActive: {
    color: CENIT_COLORS.blueBrand,
    fontWeight: '700',
  },
  stepLine: {
    flex: 1,
    height: '2px',
    background: 'rgba(0,0,0,0.06)',
    marginLeft: '4px',
    marginRight: '4px',
  },
  stepLineDone: {
    background: CENIT_COLORS.green,
  },
  wizardBody: {
    flexGrow: 1,
    overflowY: 'auto',
    ...shorthands.padding('28px'),
  },
  wizardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('16px', '28px'),
    ...shorthands.borderTop('1px', 'solid', 'rgba(0,0,0,0.06)'),
    background: 'rgba(0,0,0,0.01)',
  },
  monthGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    ...shorthands.gap('12px'),
    marginTop: '16px',
    [MEDIA.mobile]: {
      display: 'flex',
      flexDirection: 'column',
      ...shorthands.gap('8px'),
    },
  },
  monthAcc: {
    ...shorthands.border('1px', 'solid', 'rgba(0,0,0,0.08)'),
    borderRadius: '10px',
    background: '#fff',
    overflow: 'hidden',
  },
  monthAccSummary: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('10px'),
    ...shorthands.padding('12px', '14px'),
    cursor: 'pointer',
    listStyle: 'none',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    background: 'rgba(0,51,160,0.03)',
    '::-webkit-details-marker': { display: 'none' },
    '::before': {
      content: '"▸"',
      fontSize: '11px',
      color: 'rgba(0,51,160,0.45)',
    },
  },
  monthAccBody: {
    ...shorthands.padding('12px', '14px'),
    borderTop: '1px solid rgba(0,0,0,0.06)',
  },
  monthCard: {
    ...shorthands.padding('16px', '20px'),
    borderRadius: '14px',
    ...shorthands.border('1px', 'solid', 'rgba(0,0,0,0.06)'),
    background: 'rgba(255,255,255,0.7)',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('10px'),
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('2px'),
  },
  monthHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthLabel: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#003057',
  },
  monthTotal: {
    fontSize: '15px',
    fontWeight: '800',
    color: CENIT_COLORS.blueBrand,
  },
  monthFields: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    ...shorthands.gap('8px'),
    [MEDIA.mobile]: { gridTemplateColumns: '1fr' },
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('6px'),
    minWidth: 0,
    marginBottom: '16px'
  },
  fieldLabel: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: tokens.colorNeutralForeground3,
  },
  selectionGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
  },
  selectionCard: {
    ...shorthands.padding('16px', '20px'),
    borderRadius: '14px',
    ...shorthands.border('2px', 'solid', 'rgba(0,0,0,0.06)'),
    cursor: 'pointer',
    width: '160px',
    transition: 'all 0.2s ease',
    ':hover': {
      ...shorthands.border('2px', 'solid', CENIT_COLORS.blueBrand),
      background: 'rgba(0,51,160,0.02)',
    },
  },
  selectionCardActive: {
    ...shorthands.padding('16px', '20px'),
    borderRadius: '14px',
    cursor: 'pointer',
    width: '160px',
    ...shorthands.border('2px', 'solid', CENIT_COLORS.blueBrand),
    background: 'rgba(0,51,160,0.04)',
    boxShadow: '0 4px 16px rgba(0,51,160,0.08)',
  },
  formSection: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
    marginBottom: '32px'
  }
});

export interface ServicioInitialData {
  zona: string;
  descripcion: string;
  unidadMedida: string;
  programacion: ServicioMensual[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onComplete: (result: ServicioWizardResult) => void;
  initialData?: ServicioInitialData | null;
}

export const ServicioOpexWizard: React.FC<Props> = ({ open, onClose, onComplete, initialData }) => {
  const styles = useStyles();
  const { isMobile } = useResponsive();

  const [step, setStep] = useState(0);
  const [zonas, setZonas] = useState<string[]>([]);
  const [zona, setZona] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [unidadMedida, setUnidadMedida] = useState<string>('Unidad');
  
  const [monthlyData, setMonthlyData] = useState<ServicioMensual[]>([]);

  useEffect(() => {
    if (open) {
      setStep(0);
      MonitoreosMatrizService.getZonas().then(setZonas);
      if (initialData) {
        setZona(initialData.zona);
        setDescripcion(initialData.descripcion);
        setUnidadMedida(initialData.unidadMedida);
        setMonthlyData(initialData.programacion);
      } else {
        setZona('');
        setDescripcion('');
        setUnidadMedida('Unidad');
        setMonthlyData(MESES.map((mes, i) => ({ mes, mesIndex: i, cantidad: 0, precio: 0, total: 0 })));
      }
    }
  }, [open, initialData]);

  const updateMonth = useCallback((index: number, field: 'cantidad' | 'precio', value: number) => {
    setMonthlyData(prev => prev.map((m, i) => {
      if (i !== index) return m;
      const updated = { ...m, [field]: value };
      updated.total = updated.cantidad * updated.precio;
      return updated;
    }));
  }, []);

  const valorTotal = useMemo(() => monthlyData.reduce((s, m) => s + m.total, 0), [monthlyData]);

  const canNext = () => {
    if (step === 0) return zona !== '' && descripcion.trim() !== '' && unidadMedida.trim() !== '';
    return true;
  };

  const handleNext = () => {
    if (step === 0) setStep(1);
    else {
      onComplete({
        tipo: 'servicios',
        zona,
        descripcion,
        unidadMedida,
        programacion: monthlyData,
        valorTotal
      });
    }
  };

  if (!open) return null;

  return (
    <Portal>
      <div className={styles.overlay}>
        <div className={styles.wizard}>
          
          <div className={styles.wizardHeader}>
            <div className={styles.headerLeft}>
              <Title2 style={{ color: '#003057', fontWeight: 700 }}>Nuevo Servicio</Title2>
              <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                {STEPS[step]?.label} — Paso {step + 1} de {STEPS.length}
              </Caption1>
            </div>
            <div className={styles.closeBtn} onClick={onClose}><DismissRegular /></div>
          </div>

          <div className={styles.stepsBar}>
            {STEPS.map((s, i) => (
              <React.Fragment key={i}>
                <div className={styles.step}>
                  <div className={mergeClasses(
                    styles.stepDot,
                    i === step && styles.stepDotActive,
                    i < step && styles.stepDotDone,
                  )}>
                    {i < step ? <CheckmarkRegular /> : i + 1}
                  </div>
                  <span className={mergeClasses(
                    styles.stepLabel,
                    (i === step || i < step) && styles.stepLabelActive,
                  )}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={mergeClasses(styles.stepLine, i < step && styles.stepLineDone)} />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className={styles.wizardBody}>
            {step === 0 && (
              <div>
                <div className={styles.formSection}>
                  <div className={styles.fieldLabel}>Zona</div>
                  <div className={styles.selectionGrid}>
                    {zonas.map(z => (
                      <div 
                        key={z} 
                        className={z === zona ? styles.selectionCardActive : styles.selectionCard}
                        onClick={() => setZona(z)}
                      >
                        <Body1 style={{ fontWeight: z === zona ? 'bold' : 'normal' }}>{z}</Body1>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.formSection}>
                  <div className={styles.fieldLabel}>Descripción de la Necesidad</div>
                  <Input 
                    value={descripcion} 
                    onChange={(e, data) => setDescripcion(data.value)} 
                    placeholder="Ej. Aseguramiento ICA's, Gestión Integral de Residuos..."
                    size="large"
                  />
                </div>

                <div className={styles.formSection}>
                  <div className={styles.fieldLabel}>Unidad de Medida</div>
                  <Input 
                    value={unidadMedida} 
                    onChange={(e, data) => setUnidadMedida(data.value)} 
                    placeholder="Ej. Unidad, GL, Mes..."
                    size="large"
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <Title3>Planificación Mensual</Title3>
                <div className={styles.monthGrid}>
                  {monthlyData.map((m, i) => {
                    const fields = (
                      <div className={styles.monthFields}>
                        <div className={styles.fieldGroup}>
                          <div className={styles.fieldLabel}>Precio</div>
                          <Input
                            type="number"
                            value={m.precio.toString()}
                            onChange={(e, data) => updateMonth(i, 'precio', parseFloat(data.value || '0') || 0)}
                          />
                        </div>
                        <div className={styles.fieldGroup}>
                          <div className={styles.fieldLabel}>Cantidad</div>
                          <Input
                            type="number"
                            value={m.cantidad.toString()}
                            onChange={(e, data) => updateMonth(i, 'cantidad', parseFloat(data.value || '0') || 0)}
                          />
                        </div>
                      </div>
                    );

                    if (isMobile) {
                      return (
                        <details key={m.mes} className={styles.monthAcc}>
                          <summary className={styles.monthAccSummary}>
                            <span className={styles.monthLabel}>{m.mes}</span>
                            <span
                              className={styles.monthTotal}
                              style={{ marginLeft: 'auto', ...(m.total > 0 ? { color: CENIT_COLORS.greenDark } : { color: 'rgba(0,0,0,0.35)', fontWeight: 500 }) }}
                            >
                              {m.total > 0 ? fmtCOP(m.total) : '—'}
                            </span>
                          </summary>
                          <div className={styles.monthAccBody}>{fields}</div>
                        </details>
                      );
                    }

                    return (
                      <div key={m.mes} className={styles.monthCard}>
                        <div className={styles.monthHeader}>
                          <div className={styles.monthLabel}>{m.mes}</div>
                          <div className={styles.monthTotal}>{fmtCOP(m.total)}</div>
                        </div>
                        {fields}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className={styles.wizardFooter}>
            {step === 0 ? <div /> : (
              <Button appearance="secondary" onClick={() => setStep(0)}>Atrás</Button>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className={styles.fieldLabel}>TOTAL PRESUPUESTADO</span>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: CENIT_COLORS.blueBrand }}>
                  {fmtCOP(valorTotal)}
                </span>
              </div>
              <Button 
                appearance="primary" 
                size="large" 
                disabled={!canNext()} 
                onClick={handleNext}
              >
                {step === 0 ? 'Siguiente' : 'Finalizar y Añadir Contrato'}
              </Button>
            </div>
          </div>

        </div>
      </div>
    </Portal>
  );
};
