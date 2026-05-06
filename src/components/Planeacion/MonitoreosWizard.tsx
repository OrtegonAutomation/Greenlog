// ============================================================
// MonitoreosWizard — Multi-step wizard for creating a new
// monitoring activity from the 2026 matrix
// Steps: Tipo → Zona → Estación → Parámetros → Programación mensual
// ============================================================
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  makeStyles, shorthands, tokens, mergeClasses,
  Title2, Title3, Body1, Body2, Caption1, Card,
  Button, Input, Checkbox, Spinner, Portal,
  Popover, PopoverTrigger, PopoverSurface,
} from '@fluentui/react-components';
import {
  DismissRegular,
  ArrowLeftRegular,
  ArrowRightRegular,
  CheckmarkRegular,
  SearchRegular,
  LocationRegular,
  BuildingRegular,
  BeakerRegular,
  CalendarRegular,
  ChevronRight20Regular,
  EditRegular,
} from '@fluentui/react-icons';
import { MonitoreosMatrizService, MonitoreoRow } from '../../services/MonitoreosMatrizService';
import { CENIT_COLORS } from '../../theme/cenitTheme';

// ── Types ──
export interface MonitoreoMensualParams {
  key: string;
  parametro: string;
  precio: number;
}

export interface MonitoreoMensual {
  mes: string;
  mesIndex: number;
  puntos: number;
  comp: number;
  precio: number;    // Computed as sum of preciosIndividuales
  preciosIndividuales: MonitoreoMensualParams[];
  total: number;     // puntos × comp × precio
}

export interface MonitoreoWizardResult {
  tipo: 'monitoreos' | 'servicios';
  zona: string;
  estacion: string;
  parametrosSeleccionados: MonitoreoRow[];
  programacion: MonitoreoMensual[];
  valorTotal: number;
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const fmtCOP = (n: number) => `$${n.toLocaleString('es-CO')}`;

// ── Styles ──
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
    animationName: {
      from: { opacity: '0', transform: 'scale(0.95) translateY(20px)' },
      to: { opacity: '1', transform: 'scale(1) translateY(0)' },
    },
    animationDuration: '0.35s',
    animationTimingFunction: 'cubic-bezier(0.16,1,0.3,1)',
    animationFillMode: 'both',
  },

  // Header
  wizardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('20px', '28px'),
    ...shorthands.borderBottom('1px', 'solid', 'rgba(0,0,0,0.06)'),
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('2px'),
  },
  closeBtn: {
    width: '36px', height: '36px', minWidth: '36px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '10px', cursor: 'pointer',
    transition: 'background 0.15s ease',
    color: tokens.colorNeutralForeground2,
    ':hover': { background: 'rgba(0,0,0,0.06)' },
  },

  // Steps indicator
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
    display: 'none',
    '@media (min-width: 768px)': {
      display: 'block',
    },
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

  // Body
  wizardBody: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto',
    minHeight: 0,
    overflowY: 'auto',
    ...shorthands.padding('28px'),
  },

  // Footer
  wizardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('16px', '28px'),
    ...shorthands.borderTop('1px', 'solid', 'rgba(0,0,0,0.06)'),
    flexShrink: 0,
    background: 'rgba(0,0,0,0.01)',
  },

  // Step 0 - Tipo selection
  tipoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    ...shorthands.gap('20px'),
    maxWidth: '600px',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: '24px',
  },
  tipoCard: {
    ...shorthands.padding('32px', '24px'),
    borderRadius: '20px',
    ...shorthands.border('2px', 'solid', 'rgba(0,0,0,0.06)'),
    background: 'rgba(255,255,255,0.8)',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    ':hover': {
      ...shorthands.border('2px', 'solid', CENIT_COLORS.blueBrand),
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 32px rgba(0,51,160,0.12)',
    },
  },
  tipoCardActive: {
    ...shorthands.border('2px', 'solid', CENIT_COLORS.blueBrand),
    background: 'rgba(0,51,160,0.03)',
    boxShadow: '0 8px 24px rgba(0,51,160,0.1)',
  },
  tipoIcon: {
    width: '56px', height: '56px',
    borderRadius: '16px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '24px',
  },

  // Step 1-2 - Selection grid
  selectionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    ...shorthands.gap('12px'),
    marginTop: '16px',
  },
  selectionCard: {
    ...shorthands.padding('16px', '20px'),
    borderRadius: '14px',
    ...shorthands.border('2px', 'solid', 'rgba(0,0,0,0.06)'),
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    ':hover': {
      ...shorthands.border('2px', 'solid', CENIT_COLORS.blueBrand),
      background: 'rgba(0,51,160,0.02)',
    },
  },
  selectionCardActive: {
    ...shorthands.border('2px', 'solid', CENIT_COLORS.blueBrand),
    background: 'rgba(0,51,160,0.04)',
    boxShadow: '0 4px 16px rgba(0,51,160,0.08)',
  },
  selectionDot: {
    width: '12px', height: '12px',
    borderRadius: '50%',
    ...shorthands.border('2px', 'solid', 'rgba(0,0,0,0.15)'),
    flexShrink: 0,
    transition: 'all 0.2s ease',
  },
  selectionDotActive: {
    ...shorthands.border('2px', 'solid', CENIT_COLORS.blueBrand),
    background: CENIT_COLORS.blueBrand,
    boxShadow: '0 0 0 3px rgba(0,51,160,0.2)',
  },

  // Step 3 - Params table
  paramTableWrap: {
    background: 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(12px)',
    borderRadius: '16px',
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.5)'),
    overflow: 'auto',
    maxHeight: '400px',
  },
  paramTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px',
  },
  paramTh: {
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
    background: 'rgba(255,255,255,0.98)',
    zIndex: 1,
  },
  paramTd: {
    ...shorthands.padding('8px', '12px'),
    ...shorthands.borderBottom('1px', 'solid', 'rgba(0,0,0,0.04)'),
    color: tokens.colorNeutralForeground1,
  },
  paramTr: {
    transition: 'background 0.15s ease',
    cursor: 'pointer',
    ':hover': { background: 'rgba(0,51,160,0.02)' },
  },
  paramTrSelected: {
    background: 'rgba(0,51,160,0.04)',
  },

  // Step 4 - Monthly grid
  monthGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    ...shorthands.gap('12px'),
    marginTop: '16px',
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
    gridTemplateColumns: '1fr 1fr 1fr',
    ...shorthands.gap('8px'),
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('3px'),
    minWidth: 0,
  },
  fieldLabel: {
    fontSize: '10px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: tokens.colorNeutralForeground3,
  },
  footerTotals: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('24px'),
  },
  footerTotal: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('2px'),
  },

  // Search
  searchWrap: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    marginBottom: '12px',
  },

  // Summary
  selectedCount: {
    fontSize: '13px',
    fontWeight: '600',
    color: CENIT_COLORS.blueBrand,
    ...shorthands.padding('6px', '14px'),
    borderRadius: '20px',
    background: 'rgba(0,51,160,0.06)',
  },

  spinnerWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('48px'),
  },
});

// ── Component ──
export interface MonitoreoInitialData {
  zona: string;
  estacion: string;
  parametrosKeys: string[];      // keys de los parámetros seleccionados
  programacion: MonitoreoMensual[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onComplete: (result: MonitoreoWizardResult) => void;
  initialData?: MonitoreoInitialData | null;
}

const STEPS = [
  { label: 'Zona', icon: '📍' },
  { label: 'Estación', icon: '🏭' },
  { label: 'Parámetros', icon: '🧪' },
  { label: 'Programación', icon: '📅' },
];

export const MonitoreosWizard: React.FC<Props> = ({ open, onClose, onComplete, initialData }) => {
  const styles = useStyles();

  // Wizard state
  const [step, setStep] = useState(0);
  const [tipo, setTipo] = useState<'monitoreos' | 'servicios' | null>(null);

  // Selection state
  const [zonas, setZonas] = useState<string[]>([]);
  const [estaciones, setEstaciones] = useState<string[]>([]);
  const [selectedZona, setSelectedZona] = useState<string | null>(null);
  const [selectedEstacion, setSelectedEstacion] = useState<string | null>(null);

  // Params
  const [availableParams, setAvailableParams] = useState<MonitoreoRow[]>([]);
  const [selectedParams, setSelectedParams] = useState<Set<string>>(new Set());
  const [paramSearch, setParamSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Monthly programming
  const [monthlyData, setMonthlyData] = useState<MonitoreoMensual[]>([]);

  // Reset on open — si hay initialData pre-llenar
  useEffect(() => {
    if (open) {
      setTipo('monitoreos');
      setParamSearch('');
      if (initialData) {
        setStep(0);
        setSelectedZona(initialData.zona);
        setSelectedEstacion(initialData.estacion);
        setSelectedParams(new Set(initialData.parametrosKeys));
        setMonthlyData(initialData.programacion);
      } else {
        setStep(0);
        setSelectedZona(null);
        setSelectedEstacion(null);
        setSelectedParams(new Set());
        setMonthlyData([]);
      }
    }
  }, [open, initialData]);

  // Load zones
  useEffect(() => {
    if (open) {
      MonitoreosMatrizService.getZonas().then(setZonas);
    }
  }, [open]);

  // Load stations when zone is selected
  useEffect(() => {
    if (selectedZona) {
      MonitoreosMatrizService.getEstaciones(selectedZona).then(setEstaciones);
    } else {
      setEstaciones([]);
    }
  }, [selectedZona]);

  // Load params when station is selected
  useEffect(() => {
    if (selectedZona && selectedEstacion) {
      setLoading(true);
      MonitoreosMatrizService.getParametros(selectedZona, selectedEstacion).then(rows => {
        setAvailableParams(rows);
        setLoading(false);
      });
    }
  }, [selectedZona, selectedEstacion]);

  useEffect(() => {
    if (step === 3 && selectedParams.size > 0) {
      const selRows = availableParams.filter(r => selectedParams.has(paramKey(r)));

      setMonthlyData(prevData => {
        return MESES.map((mes, i) => {
          const existingMonth = prevData && prevData.length > i ? prevData[i] : null;
          
          // Construct granular parameter list for this month, keeping previous custom edits
          const paramList: MonitoreoMensualParams[] = selRows.map(r => {
            const key = paramKey(r);
            const existingParam = existingMonth?.preciosIndividuales?.find(p => p.key === key);
            // Check matrix to see if there is an explicit price stored for this month in the history
            const baseOrMonthlyPrice = (r.preciosMensuales && r.preciosMensuales[i] !== undefined) ? r.preciosMensuales[i] : r.chemilab;
            
            return {
              key,
              parametro: r.parametro,
              precio: existingParam ? existingParam.precio : baseOrMonthlyPrice
            };
          });

          const currentPrecio = paramList.reduce((s, p) => s + p.precio, 0);
          const currentPuntos = existingMonth ? existingMonth.puntos : 0;
          const currentComp = existingMonth ? existingMonth.comp : 0;

          return {
            mes,
            mesIndex: i,
            puntos: currentPuntos,
            comp: currentComp,
            precio: currentPrecio,
            preciosIndividuales: paramList,
            total: currentPuntos * currentComp * currentPrecio,
          };
        });
      });
    }
  }, [step]);

  // Filtered params
  const filteredParams = useMemo(() => {
    if (!paramSearch) return availableParams;
    const q = paramSearch.toLowerCase();
    return availableParams.filter(r =>
      r.parametro.toLowerCase().includes(q) ||
      r.matriz.toLowerCase().includes(q) ||
      r.norma.toLowerCase().includes(q) ||
      r.permiso.toLowerCase().includes(q)
    );
  }, [availableParams, paramSearch]);

  const paramKey = (r: MonitoreoRow) => `${r.parametro}|${r.matriz}|${r.norma}`;

  const toggleParam = useCallback((r: MonitoreoRow) => {
    const key = paramKey(r);
    setSelectedParams(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selectedParams.size === filteredParams.length) {
      setSelectedParams(new Set());
    } else {
      setSelectedParams(new Set(filteredParams.map(r => paramKey(r))));
    }
  }, [filteredParams, selectedParams]);

  // Update monthly value
  const updateMonth = useCallback((index: number, field: 'puntos' | 'comp' | 'precio', value: number) => {
    setMonthlyData(prev => prev.map((m, i) => {
      if (i !== index) return m;
      const updated = { ...m, [field]: value };
      updated.total = updated.puntos * updated.comp * updated.precio;
      return updated;
    }));
  }, []);

  // Calculated totals
  const valorTotal = useMemo(() => monthlyData.reduce((s, m) => s + m.total, 0), [monthlyData]);

  // Navigation
  const canNext = () => {
    switch (step) {
      case 0: return !!selectedZona;
      case 1: return !!selectedEstacion;
      case 2: return selectedParams.size > 0;
      case 3: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else {
      // Complete
      const selRows = availableParams.filter(r => selectedParams.has(paramKey(r)));
      onComplete({
        tipo: tipo!,
        zona: selectedZona!,
        estacion: selectedEstacion!,
        parametrosSeleccionados: selRows,
        programacion: monthlyData,
        valorTotal,
      });
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  // Handle individual parameter price change within a specific month
  const handleIndividualPriceChange = useCallback((monthIndex: number, paramToEditKey: string, newPrice: number) => {
    setMonthlyData(prev => {
      const next = [...prev];
      const month = { ...next[monthIndex] };
      const paramList = [...month.preciosIndividuales];
      
      const paramIdx = paramList.findIndex(p => p.key === paramToEditKey);
      if (paramIdx >= 0) {
        paramList[paramIdx] = { ...paramList[paramIdx], precio: newPrice };
      }
      
      month.preciosIndividuales = paramList;
      // Recompute the sum
      month.precio = paramList.reduce((s, p) => s + p.precio, 0);
      month.total = month.puntos * month.comp * month.precio;
      
      next[monthIndex] = month;
      return next;
    });

    // Re-enabled: The user explicitly requested that editing a specific parameter's price
    // should update its global reference value in the Matrix for future activities.
    // UPDATE: Now it updates the matrix ONLY for the specific MONTH being edited, preserving the base reference.
    const row = availableParams.find(r => paramKey(r) === paramToEditKey);
    if (row) {
      MonitoreosMatrizService.updateChemilabMensual(row.zona, row.estacion, row.parametro, row.matriz, monthIndex, newPrice);
    }
  }, [availableParams]);

  if (!open) return null;

  return (
    <Portal>
      <div className={styles.overlay} onClick={onClose}>
      <div className={styles.wizard} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.wizardHeader}>
          <div className={styles.headerLeft}>
            <Title2 style={{ color: '#003057', fontWeight: 700 }}>Nueva Actividad</Title2>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
              {STEPS[step].label} — Paso {step + 1} de {STEPS.length}
            </Caption1>
          </div>
          <div className={styles.closeBtn} onClick={onClose}><DismissRegular /></div>
        </div>

        {/* Steps bar */}
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

        {/* Body */}
        <div className={styles.wizardBody}>
          {/* Step 0: Zona */}
          {step === 0 && (
            <div>
              <Title3 style={{ color: '#003057', display: 'block', marginBottom: '4px' }}>Selecciona la zona</Title3>
              <Caption1 style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
                Zonas disponibles según la matriz de monitoreo 2026
              </Caption1>
              <div className={styles.selectionGrid}>
                {zonas.map(z => (
                  <div
                    key={z}
                    className={mergeClasses(styles.selectionCard, selectedZona === z && styles.selectionCardActive)}
                    onClick={() => { setSelectedZona(z); setSelectedEstacion(null); setSelectedParams(new Set()); }}
                  >
                    <div className={mergeClasses(styles.selectionDot, selectedZona === z && styles.selectionDotActive)} />
                    <Body2 style={{ fontWeight: '600' }}>{z}</Body2>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Estación */}
          {step === 1 && (
            <div>
              <Title3 style={{ color: '#003057', display: 'block', marginBottom: '4px' }}>Selecciona la estación</Title3>
              <Caption1 style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
                Estaciones en la zona <strong>{selectedZona}</strong>
              </Caption1>
              <div className={styles.selectionGrid}>
                {estaciones.map(e => (
                  <div
                    key={e}
                    className={mergeClasses(styles.selectionCard, selectedEstacion === e && styles.selectionCardActive)}
                    onClick={() => { setSelectedEstacion(e); setSelectedParams(new Set()); }}
                  >
                    <div className={mergeClasses(styles.selectionDot, selectedEstacion === e && styles.selectionDotActive)} />
                    <Body2 style={{ fontWeight: '600' }}>{e}</Body2>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Parámetros */}
          {step === 2 && (
            <div>
              <Title3 style={{ color: '#003057', display: 'block', marginBottom: '4px' }}>Selecciona parámetros</Title3>
              <Caption1 style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
                Parámetros de la matriz 2026 para <strong>{selectedZona} — {selectedEstacion}</strong>
              </Caption1>

              <div className={styles.searchWrap} style={{ marginTop: '16px' }}>
                <Input
                  placeholder="Buscar por parámetro, matriz, norma..."
                  contentBefore={<SearchRegular />}
                  value={paramSearch}
                  onChange={(_, d) => setParamSearch(d.value)}
                  style={{ flex: 1, maxWidth: '400px' }}
                />
                <span className={styles.selectedCount}>
                  {selectedParams.size} seleccionados
                </span>
              </div>

              {loading ? (
                <div className={styles.spinnerWrap}><Spinner label="Cargando parámetros..." /></div>
              ) : (
                <div className={styles.paramTableWrap}>
                  <table className={styles.paramTable}>
                    <thead>
                      <tr>
                        <th className={styles.paramTh} style={{ width: '40px' }}>
                          <Checkbox
                            checked={selectedParams.size > 0 && selectedParams.size === filteredParams.length ? true : selectedParams.size > 0 ? 'mixed' : false}
                            onChange={toggleAll}
                          />
                        </th>
                        <th className={styles.paramTh}>Parámetro</th>
                        <th className={styles.paramTh}>Matriz</th>
                        <th className={styles.paramTh}>Norma Referencia</th>
                        <th className={styles.paramTh}>Permiso</th>
                        <th className={styles.paramTh}>Requerimiento</th>
                        <th className={styles.paramTh}>Receptor/Uso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredParams.map((r, idx) => {
                        const key = paramKey(r);
                        const sel = selectedParams.has(key);
                        return (
                          <tr
                            key={key + idx}
                            className={mergeClasses(styles.paramTr, sel && styles.paramTrSelected)}
                            onClick={() => toggleParam(r)}
                          >
                            <td className={styles.paramTd}>
                              <Checkbox checked={sel} onChange={() => toggleParam(r)} />
                            </td>
                            <td className={styles.paramTd} style={{ fontWeight: '600', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {r.parametro}
                            </td>
                            <td className={styles.paramTd}>{r.matriz}</td>
                            <td className={styles.paramTd} style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {r.norma}
                            </td>
                            <td className={styles.paramTd}>{r.permiso}</td>
                            <td className={styles.paramTd} style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {r.requerimiento}
                            </td>
                            <td className={styles.paramTd}>{r.receptor}</td>
                          </tr>
                        );
                      })}
                      {filteredParams.length === 0 && (
                        <tr>
                          <td className={styles.paramTd} colSpan={7} style={{ textAlign: 'center', padding: '32px', color: tokens.colorNeutralForeground3 }}>
                            No se encontraron parámetros
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Programación mensual */}
          {step === 3 && (
            <div>
              <Title3 style={{ color: '#003057', display: 'block', marginBottom: '4px' }}>Programación Mensual — 2027</Title3>
              <Caption1 style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
                Define la cantidad (Puntos/Q), Compuesto y el valor por mes. El total se calcula automáticamente.
              </Caption1>

              <div className={styles.monthGrid}>
                {monthlyData.map((m, i) => (
                  <div key={m.mes} className={styles.monthCard} style={m.total > 0 ? { borderColor: 'rgba(0,51,160,0.15)' } : {}}>
                    <div className={styles.monthHeader}>
                      <span className={styles.monthLabel}>{m.mes}</span>
                      <span className={styles.monthTotal}>
                        {m.total > 0 ? fmtCOP(m.total) : '—'}
                      </span>
                    </div>
                    <div className={styles.monthFields}>
                      <div className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Puntos/Q</span>
                        <Input
                          type="number"
                          size="small"
                          value={m.puntos > 0 ? String(m.puntos) : ''}
                          placeholder="0"
                          onChange={(_, d) => updateMonth(i, 'puntos', Number(d.value) || 0)}
                          style={{ minWidth: 0, width: '100%' }}
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Comp</span>
                        <Input
                          type="number"
                          size="small"
                          value={m.comp > 0 ? String(m.comp) : ''}
                          placeholder="0"
                          onChange={(_, d) => updateMonth(i, 'comp', Number(d.value) || 0)}
                          style={{ minWidth: 0, width: '100%' }}
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Valor</span>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <Input
                            type="text"
                            size="small"
                            value={m.precio > 0 ? fmtCOP(m.precio) : '0'}
                            readOnly
                            style={{ minWidth: 0, width: '100%', flex: 1, pointerEvents: 'none', background: 'rgba(0,0,0,0.02)' }}
                          />
                          <Popover withArrow={true} positioning="below-end">
                            <PopoverTrigger disableButtonEnhancement>
                              <Button
                                icon={<EditRegular />}
                                size="small"
                                appearance="subtle"
                                title="Editar precios individuales"
                              />
                            </PopoverTrigger>
                            <PopoverSurface style={{ padding: '16px', minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <Title3 style={{ fontSize: '14px', color: '#003057' }}>Desglose - {m.mes}</Title3>
                              <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                                {m.preciosIndividuales?.map(p => (
                                  <div key={p.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <Caption1 style={{ color: tokens.colorNeutralForeground3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {p.parametro}
                                    </Caption1>
                                    <Input
                                      type="number"
                                      size="small"
                                      value={p.precio > 0 ? String(p.precio) : ''}
                                      onChange={(_, d) => handleIndividualPriceChange(i, p.key, Number(d.value) || 0)}
                                    />
                                  </div>
                                ))}
                              </div>
                            </PopoverSurface>
                          </Popover>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.wizardFooter}>
          <div className={styles.footerTotals}>
            {step === 4 && (
              <>
                <div className={styles.footerTotal}>
                  <Caption1 style={{ fontWeight: '600', color: tokens.colorNeutralForeground3 }}>VALOR TOTAL DEL EJERCICIO</Caption1>
                  <span style={{ fontSize: '22px', fontWeight: '800', color: '#003057' }}>{fmtCOP(valorTotal)}</span>
                </div>
                <div className={styles.footerTotal}>
                  <Caption1 style={{ fontWeight: '600', color: tokens.colorNeutralForeground3 }}>MESES CON DATOS</Caption1>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: CENIT_COLORS.blueBrand }}>
                    {monthlyData.filter(m => m.total > 0).length} / 12
                  </span>
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {step > 0 && (
              <Button
                appearance="subtle"
                icon={<ArrowLeftRegular />}
                onClick={handleBack}
                style={{ borderRadius: '12px' }}
              >
                Anterior
              </Button>
            )}
            <Button
              appearance="primary"
              icon={step === 4 ? <CheckmarkRegular /> : <ArrowRightRegular />}
              iconPosition="after"
              onClick={handleNext}
              disabled={!canNext()}
              style={{ borderRadius: '12px', paddingLeft: '20px', paddingRight: '20px' }}
            >
              {step === 4 ? 'Completar' : 'Siguiente'}
            </Button>
          </div>
        </div>
      </div>
      </div>
    </Portal>
  );
};
