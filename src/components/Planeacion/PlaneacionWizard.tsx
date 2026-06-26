// ============================================================
// PlaneacionWizard — Unified multi-step wizard for creating
// environmental planning activities across all líneas operativas.
// Steps: Línea → Zona → Lugar → Clasificación → Datos auxiliares → Ítems/Parámetros → Programación
// Replaces the old MonitoreosWizard + ServicioOpexWizard split.
// ============================================================
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  makeStyles, shorthands, tokens, mergeClasses,
  Title2, Title3, Body1, Body2, Caption1,
  Button, Input, Checkbox, Spinner, Portal, Tooltip,
  Popover, PopoverTrigger, PopoverSurface,
  Combobox, Option,
} from '@fluentui/react-components';
import {
  DismissRegular,
  ArrowLeftRegular,
  ArrowRightRegular,
  CheckmarkRegular,
  SearchRegular,
  EditRegular,
  AddRegular,
  DeleteRegular,
} from '@fluentui/react-icons';
import { MonitoreosMatrizService, MonitoreoRow, invalidateMonitoreosCache } from '../../services/MonitoreosMatrizService';
import { SupabaseService } from '../../services/SupabaseService';
import { isSupabaseEnabled } from '../../services/supabaseClient';
import { ItemsLineaService, ItemLinea, ITEMS_LOGISTICA } from '../../services/ItemsLineaService';
import { CatalogoItemsGlobalService } from '../../services/CatalogoItemsGlobalService';
import { paramKeyOf, precioMatriz } from '../../services/monitoreosTarifas';
import { TarifasParametrosService } from '../../services/TarifasParametrosService';
import { categoriaDeMatriz } from '../../data/tarifasParametros2026';
import { useAuth } from '../../auth/AuthContext';
import { DEPARTAMENTOS_MUNICIPIOS, DEPARTAMENTOS_LIST } from '../../data/jurisdiccionesCompensaciones';
import type { ServicioEComplejidad } from '../../data/itemsServiciosE';
import { TARIFA_ICAS, ICAS_CONSOLIDAR_2026 } from '../../data/itemsIcas';
import { CENIT_COLORS } from '../../theme/cenitTheme';
import { MEDIA, useResponsive } from '../../hooks/useResponsive';
import {
  DatosAuxiliaresPresupuestales,
  DatosAuxiliaresPresupuestalesForm,
  DEFAULT_DATOS_AUXILIARES,
} from './DatosAuxiliaresPresupuestalesForm';
import {
  LineaOperativa, LineaPlaneacionConfig, TipoLugar, TipoPlaneacion, FuentePresupuesto,
  LINEAS_PLANEACION, TIPOS_LUGAR, TIPOS_PLANEACION, FUENTES_PRESUPUESTO,
  ZONAS_ESTACIONES, ZONAS, MATRICES_AMBIENTALES,
} from '../../types';

// ── Result types ──

export interface PlaneacionMensualParam {
  key: string;
  nombre: string;
  precio: number;      // Unit price
  cantidad: number;    // Units this month
  frecuencia: number;  // Composite multiplier (monitoreos) or 1
  aplicaIva?: boolean; // Applies IVA to this item/parameter across scheduled months
  porcentajeDiferido?: number; // % of item value scheduled in this month
  total: number;       // precio × cantidad × frecuencia
}

export interface PlaneacionMensual {
  mes: string;
  mesIndex: number;
  cantidad: number;       // Puntos/Q for monitoreos, Cantidad for items
  frecuencia: number;     // Comp for monitoreos, 1 for items
  precio: number;         // Sum of individual prices
  preciosIndividuales: PlaneacionMensualParam[];
  total: number;          // cantidad × frecuencia × precio
}

export interface PlaneacionWizardResult {
  lineaOperativa: LineaOperativa;
  zona: string;
  tipoLugar: TipoLugar;
  estacion?: string;
  pk?: string;
  fuentePresupuesto: FuentePresupuesto;
  tipoPlaneacion: TipoPlaneacion;
  anioPlaneacion: number;
  datosAuxiliaresPresupuestales: DatosAuxiliaresPresupuestales;
  parametrosSeleccionados: MonitoreoRow[];
  itemsSeleccionados: ItemLinea[];
  logisticaSeleccionada: ItemLinea[];
  selectedParamKeys?: string[];
  selectedItemIds?: string[];
  selectedLogisticaIds?: string[];
  selectedMatrices?: string[];
  customItems?: ItemLinea[];
  customMonitoreoRows?: MonitoreoRow[];
  programacion: PlaneacionMensual[];
  valorTotal: number;
  // Cambio 5: tipo muestra por param
  paramTipoMuestra?: Record<string, 'simple' | 'compuesto'>;
  paramCantCompuestos?: Record<string, number>;
  paramPuntos?: Record<string, number>;
  icasConsolidarPct?: number;
  icasDesglosadoKeys?: string[];
  icasSplitData?: Record<string, { cons: number[]; rad: number[] }>;
  // Cambio 4: IPC global
  ipcGlobalActivo?: boolean;
  ipcGlobalPorcentaje?: number;
  ipcMeses?: number[];
  // IVA global por item
  ivaGlobalActivo?: boolean;
  ivaGlobalPorcentaje?: number;
  ivaMeses?: number[];
  // Compatibilidad histórica con planeaciones antiguas que tenían IVA por ítem.
  ivaItemsExcluidos?: string[];
  pagosDiferidosActivo?: boolean;
  pagosDiferidosItems?: Record<string, PagoDiferidoItemConfig>;
  // Compensaciones: Sistema + Sector
  sistema?: string;
  sector?: string;
  // Compensaciones: Obligación metadata
  obligacion?: {
    id: string;
    fechaCreacion: string;
    actoAdministrativo: { tipo: string; numero: string; fecha: string; };
    permiso: string;
    autoridad: string;
    jurisdiccion: {
      corporacion: string;
      departamento: string;
      municipio: string;
      veredaPredio: string;
    };
    expediente: string;
    categoria: string;
  };
  // Compensaciones: Clasificación extendida
  asignacionRecursos?: boolean;
  saldoDisponible?: number;
  aniosAPlanear?: number;
  contratoSeleccionado?: string;
  // Compensaciones: Programación multi-año (Año 2 / Año 3 anualizados)
  programacionY2?: ProgramacionAnualItem[];
  programacionY3?: ProgramacionAnualItem[];
  itemsCambianPorAnio?: boolean;
  selectedItemsY2?: string[];
  selectedItemsY3?: string[];
  servicioEComplejidad?: ServicioEComplejidad;
}

// Compensaciones: ítem anual simplificado (Año 2 y Año 3)
export interface ProgramacionAnualItem {
  key: string;
  nombre: string;
  precio: number;
  cantidad: number;
  total: number;
}

export interface PagoDiferidoItemConfig {
  porcentajeAsignado: number;
  mesesSeleccionados: number[];
  porcentajesMensuales: Record<number, number>;
}

export interface PlaneacionInitialData {
  lineaOperativa?: LineaOperativa;
  zona?: string;
  tipoLugar?: TipoLugar;
  estacion?: string;
  pk?: string;
  fuentePresupuesto?: FuentePresupuesto;
  tipoPlaneacion?: TipoPlaneacion;
  anioPlaneacion?: number;
  datosAuxiliaresPresupuestales?: Partial<DatosAuxiliaresPresupuestales>;
  programacion?: PlaneacionMensual[];
  selectedParamKeys?: string[];
  selectedItemIds?: string[];
  selectedLogisticaIds?: string[];
  selectedMatrices?: string[];
  customItems?: ItemLinea[];
  customMonitoreoRows?: MonitoreoRow[];
  paramTipoMuestra?: Record<string, 'simple' | 'compuesto'>;
  paramCantCompuestos?: Record<string, number>;
  paramPuntos?: Record<string, number>;
  icasConsolidarPct?: number;
  icasDesglosadoKeys?: string[];
  icasSplitData?: Record<string, { cons: number[]; rad: number[] }>;
  ipcGlobalActivo?: boolean;
  ipcGlobalPorcentaje?: number;
  ipcMeses?: number[];
  servicioEComplejidad?: ServicioEComplejidad;
  ivaGlobalActivo?: boolean;
  ivaGlobalPorcentaje?: number;
  ivaMeses?: number[];
  pagosDiferidosActivo?: boolean;
  pagosDiferidosItems?: Record<string, PagoDiferidoItemConfig>;
  sistema?: string;
  sector?: string;
  obligacion?: PlaneacionWizardResult['obligacion'];
  asignacionRecursos?: boolean;
  saldoDisponible?: number;
  aniosAPlanear?: number;
  contratoSeleccionado?: string;
  programacionY2?: ProgramacionAnualItem[];
  programacionY3?: ProgramacionAnualItem[];
  itemsCambianPorAnio?: boolean;
  selectedItemsY2?: string[];
  selectedItemsY3?: string[];
  preserveProgramacionSinSeleccion?: boolean;
}

// ── Constants ──

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const MESES_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const fmtCOP = (n: number) => `$${n.toLocaleString('es-CO')}`;
const formatCOPInput = (value: string) => {
  const digits = value.replace(/\D/g, '');
  return digits ? Number(digits).toLocaleString('es-CO') : '';
};
const parseCOPInput = (value: string) => {
  const digits = value.replace(/\D/g, '');
  return digits ? Number(digits) : 0;
};
// Redondeo a 3 decimales para evitar artefactos de coma flotante en cantidades.
const roundCant = (n: number) => Math.round((Number.isFinite(n) ? n : 0) * 1000) / 1000;
// Cantidad con decimales: acepta coma o punto (ej. "0,08" o "0.08").
const parseCantidad = (value: string) => {
  const clean = String(value).replace(/[^\d.,-]/g, '').replace(',', '.');
  const n = Number(clean);
  return Number.isFinite(n) ? roundCant(n) : 0;
};

// Input de cantidad que admite decimales con coma o punto sin pelear con el
// valor controlado (mantiene un buffer local mientras se escribe).
const CantidadInput: React.FC<{
  value: number;
  onCommit: (n: number) => void;
  style?: React.CSSProperties;
}> = ({ value, onCommit, style }) => {
  const [txt, setTxt] = React.useState(value > 0 ? String(roundCant(value)) : '');
  React.useEffect(() => {
    // Sincroniza solo cuando el cambio viene de afuera (no de lo que se está escribiendo).
    if (parseCantidad(txt) !== roundCant(value)) setTxt(value > 0 ? String(roundCant(value)) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <Input
      inputMode="decimal"
      size="small"
      value={txt}
      placeholder="0"
      style={style}
      onChange={(_, d) => { setTxt(d.value); onCommit(parseCantidad(d.value)); }}
    />
  );
};
const clampPct = (value: number) => Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
const roundPct = (value: number) => Number(value.toFixed(6));
const fmtPct = (value: number) =>
  `${value.toLocaleString('es-CO', { maximumFractionDigits: 4 })}%`;

const shouldIgnoreWizardEnter = (event: React.KeyboardEvent<HTMLElement>) => {
  if (
    event.defaultPrevented ||
    event.key !== 'Enter' ||
    event.shiftKey ||
    event.ctrlKey ||
    event.altKey ||
    event.metaKey ||
    (event.nativeEvent as KeyboardEvent).isComposing
  ) {
    return true;
  }

  const target = event.target as HTMLElement | null;
  if (!target || target.isContentEditable) return true;

  if (
    target.closest(
      'textarea, select, button, a, [role="button"], [role="combobox"], [role="listbox"], [role="option"], [data-enter-ignore="true"]',
    )
  ) {
    return true;
  }

  const input = target.closest('input') as HTMLInputElement | null;
  if (!input) return false;

  const type = (input.getAttribute('type') ?? 'text').toLowerCase();
  return ['button', 'checkbox', 'color', 'date', 'datetime-local', 'file', 'radio', 'reset', 'submit', 'time'].includes(type);
};

const shouldIgnoreWizardEnterNative = (event: KeyboardEvent) => {
  if (
    event.defaultPrevented ||
    event.key !== 'Enter' ||
    event.shiftKey ||
    event.ctrlKey ||
    event.altKey ||
    event.metaKey ||
    event.isComposing
  ) {
    return true;
  }

  const target = event.target as HTMLElement | null;
  if (!target || target.isContentEditable) return true;

  if (
    target.closest(
      'textarea, select, button, a, [role="button"], [role="combobox"], [role="listbox"], [role="option"], [data-enter-ignore="true"]',
    )
  ) {
    return true;
  }

  const input = target.closest('input') as HTMLInputElement | null;
  if (!input) return false;

  const type = (input.getAttribute('type') ?? 'text').toLowerCase();
  return ['button', 'checkbox', 'color', 'date', 'datetime-local', 'file', 'radio', 'reset', 'submit', 'time'].includes(type);
};

const CATEGORIAS_ORDEN: string[] = ['Gestión Ambiental', 'Iniciativas Tecnológicas', 'Servicios HSE'];
const LINEAS_COMPENSACIONES: LineaOperativa[] = [
  'Compensaciones estaciones',
  'Compensaciones e Inv',
];

const UNIDADES_CONTRATO = [
  'Global', 'Mes', 'Día', 'Kg', 'Und', 'Visita', 'Ha', 'Árbol', 'ml',
  'Informe', 'Pago', 'Año', 'Sprint', 'Reporte', 'Evento', 'Sesión', 'Viaje',
];

// Compensaciones constants — tomados de la Matriz Provisiones 2 (valores reales)
export const ZONAS_COMPENSACIONES = [
  'Caño Limón','Centro','Coveñas','Llanos','Norte',
  'Occidente Norte','Occidente Sur','Oriente',
];

export const SISTEMAS_CENIT = [
  '30000003-01 Oleoducto Castilla-Apiay',
  '30000003-02 Oleoducto Araguaney-El Porvenir',
  '30000003-02-08 Oleoducto Araguaney-El Porvenir',
  '30000003-03 Oleoducto Santiago-El Porvenir',
  '30000003-04 Derivación Oleoducto Santiago El Porvenir-Planta Monterrey',
  '30000003-05 Oleoducto Apiay-El Porvenir',
  '30000003-06 Oleoducto Vasconia-CIB y Vasconia-Velasquez',
  '30000003-07 Oleoducto Yaguará-Tenay',
  '30000003-09 Poliducto Yumbo-Buenaventura',
  '30000003-10 Poliducto Puerto Salgar-Neiva',
  '30000003-11 Poliducto y Propanoducto Puerto Salgar-Bogotá',
  '30000003-12 Oleoducto San Miguel Orito - Churuyaco - Orito - Mansoyá - Orito (OSO-OCHO-OMO)',
  '30000003-13 Oleoducto Trasandino',
  '30000003-14 Terminal Marítimo Coveñas',
  '30000003-15 Terminal Marítimo Pozos Colorados',
  '30000003-16 Poliducto Cartagena-Baranoa',
  '30000003-17 Propanoducto Galan-Salgar 8',
  '30000003-18 Combustoleoducto Galán-Ayacucho-Coveñas-Cartagena',
  '30000003-19 Oleoducto Ayacucho - Galán 14”',
  '30000003-19 Oleoducto Caño Limón-Coveñas',
  '30000003-20 Poliducto Sebastopol-Medellín-Cartago',
  '30000003-21 Poliducto Puerto Salgar-Cartago-Yumbo',
  '30000003-22 Poliducto Pozos Colorados - Galán 14” y Oleoducto Ayacucho - Galán 14”',
  '30000003-23 Poliducto Galan - Puerto Salgar 12” y 16”',
  '30000003-25 Poliducto Andino',
  '30000003-26 Poliducto de Oriente',
  '30000003-27 Poliducto Galan-Chimita',
  '30000003-28 Oleoducto Galán - Ayacucho - Coveñas 8”',
  '30000003-29 Estación San Fernando',
  '30000003-40 Oleoducto Bicentenario',
  'Otro',
];

export const TIPOS_ACTO = ['Resolución', 'Comunicado'];

export const TIPOS_PERMISO = [
  'COMPENSACIÓN POR PÉRDIDA DE BIODIVERSIDAD',
  'COMPENSACIÓN POR PÉRDIDA DE BIODIVERSIDAD Y POR CAMBIO DEL USO DEL SUELO',
  'COMPENSACIÓN POR CAMBIO DEL USO DEL SUELO',
  'COMPENSACIÓN POR INTERVENCIÓN DE LA COBERTURA VEGETAL Y POR CAMBIO DEL USO DEL SUELO',
  'COMPENSACIÓN POR APROVECHAMIENTO DE LA COBERTURA VEGETAL',
  'COMPENSACIÓN POR PERMISO DE APROVECHAMIENTO FORESTAL',
  'COMPENSACIÓN POR PERMISO DE TALA Y PODA',
  'COMPENSACIÓN POR PERMISO DE OCUPACIÓN DE CAUCE',
  'COMPENSACIÓN POR PERMISO DE OCUPACIÓN DE CAUCE Y VERTIMIENTO',
  'COMPENSACIÓN POR PERMISO DE VERTIMIENTO',
  'COMPENSACIÓN POR PERMISO DE VERTIMIENTO Y CONCESIÓN DE AGUAS',
  'COMPENSACIÓN POR PERMISO DE VERTIMIENTOS, APROVECHAMIENTO FORESTAL Y CONCESIÓN DE AGUAS',
  'COMPENSACIÓN POR CONCESIÓN DE AGUAS',
  'COMPENSACIÓN POR LEVANTAMIENTO DE VEDA',
  'COMPENSACIÓN POR AFECTACIÓN DEL PAISAJE',
  'COMPENSACIÓN POR LICENCIA AMBIENTAL',
  'COMPENSACIÓN POR MODIFICACIÓN DE LA LICENCIA AMBIENTAL',
  'COMPENSACIÓN POR ESTABLECIMIENTO DEL PLAN DE MANEJO AMBIENTAL',
  'COMPENSACIÓN POR MODIFICACIÓN DEL PLAN DE MANEJO AMBIENTAL',
  'COMPENSACIÓN POR EL CUMPLIMIENTO DE FICHAS DEL PLAN DE MANEJO AMBIENTAL',
  'COMPENSACIÓN POR SUSTRACCIÓN DE RESERVA FORESTAL NACIONAL',
  'COMPENSACIÓN POR SUSTRACCIÓN DE ÁREAS PROTEGIDAS REGIONALES',
  'COMPENSACIÓN POR MULTAS / SANCIONES',
  'COMPENSACIÓN POR CONTINGENCIAS',
  'COMPENSACIONES DEL COMPONENTE BIÓTICO',
  'INVERSIÓN DEL 1%',
  'Otro',
];

export const AUTORIDADES_AMBIENTALES = [
  'ANLA','MADS','CAR','CAR (Bajo Magdalena).',
  'CAR Dirección Regional Bajo Magdalena (DRBM)',
  'CAR Dirección Regional Gualivá (DRG)',
  'CAR Dirección Regional Sabana Centro (DRSC)',
  'CAM','CAS','CARDER','CARDIQUE','CARSUCRE','CDMB',
  'CORANTIOQUIA','CORMACARENA','CORNARE','CORPAMAG','CORPOAMAZONIA',
  'CORPOBOYACA','CORPOCALDAS','CORPOCESAR','CORPONOR','CORPONariño',
  'CORPORINOQUIA','CORTOLIMA','CRA','CSB','CVC',
  'CVC DAR BRUT','CVC DAR Centro Sur','CVC DAR Norte','CVC DARPE',
  'AMVA','DADSA','EPA','SDA',
  'Alcaldía Municipal Puerto Parra','Alcaldía de Puerto Boyacá (UGAM)',
  'Municipio de Villavicencio','No Aplica','OTRO',
];

export const CATEGORIAS_COMPENSACION = [
  'PSA',
  'Restauración Ecológica',
  'Bancos de Habitat',
  'Compra de Predios',
  'Concertación',
  'Cosecha de agua',
  'Estudios Ambientales - Manejo Ciatea',
  'Manejo de Epifitas',
  'Obras biomecanicas',
  'Pago por compensación',
  'Sistemas Productivos Sostenibles',
  'No aplica',
];

// Contratos / contratistas vigentes para Compensaciones.
// Solo BQS por ahora — los demás (Terrazos, Agricultura, Apluso) se agregarán
// cuando se entreguen sus matrices de tarifas.
export const CONTRATOS_COMPENSACIONES = ['BQS'];

const getStepLabels = (isMonitoreo: boolean, isCompensaciones: boolean) => {
  const base = [
    { label: 'Línea',         icon: '📋' },
    { label: 'Zona',          icon: '📍' },
    { label: 'Lugar',         icon: '🏭' },
  ];
  if (isCompensaciones) {
    base.push({ label: 'Descripción',   icon: '📄' });
  }
  base.push({ label: 'Clasificación', icon: '⚙️' });
  base.push({ label: 'Datos auxiliares', icon: '🗂️' });
  base.push({ label: isMonitoreo ? 'Parámetros' : 'Ítems', icon: '🧪' });
  base.push({ label: 'Programación',  icon: '📅' });
  return base;
};

// ── Styles ──

const useStyles = makeStyles({
  // Overlay + card
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
    position: 'relative',
    width: 'min(960px, 94vw)',
    maxHeight: '90vh',
    background: '#fff',
    borderRadius: '24px',
    boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    animationName: {
      from: { opacity: '0', transform: 'scale(0.95) translateY(20px)' },
      to:   { opacity: '1', transform: 'scale(1) translateY(0)' },
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
  exitConfirmBackdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,12,36,0.42)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    ...shorthands.padding('24px'),
  },
  exitConfirmCard: {
    width: '460px',
    maxWidth: '92vw',
    background: '#fff',
    borderRadius: '20px',
    ...shorthands.padding('24px'),
    boxShadow: '0 24px 64px rgba(0,0,0,0.28)',
    ...shorthands.border('1px', 'solid', 'rgba(0,51,160,0.12)'),
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('14px'),
  },
  exitConfirmIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '16px',
    background: 'rgba(250,173,20,0.14)',
    color: '#9a5b00',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 800,
  },
  exitConfirmActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    ...shorthands.gap('10px'),
    marginTop: '6px',
  },

  // Steps indicator
  stepsBar: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('0'),
    ...shorthands.padding('12px', '28px'),
    background: 'rgba(0,48,87,0.02)',
    ...shorthands.borderBottom('1px', 'solid', 'rgba(0,0,0,0.04)'),
    flexShrink: 0,
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('6px'),
    flex: 1,
  },
  stepDot: {
    width: '30px', height: '30px',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '12px', fontWeight: '700',
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
    boxShadow: '0 0 0 4px rgba(0,51,160,0.15)',
  },
  stepDotDone: {
    background: CENIT_COLORS.green,
    ...shorthands.border('2px', 'solid', CENIT_COLORS.green),
    color: '#fff',
  },
  stepLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#94a3b8',
    display: 'none',
    '@media (min-width: 768px)': { display: 'block' },
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
    flexGrow: 1, flexShrink: 1, flexBasis: 'auto',
    minHeight: 0,
    overflowY: 'auto',
    ...shorthands.padding('24px', '28px'),
  },

  // Footer
  wizardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('14px', '28px'),
    ...shorthands.borderTop('1px', 'solid', 'rgba(0,0,0,0.06)'),
    flexShrink: 0,
    background: 'rgba(0,0,0,0.01)',
  },

  // ── Step 0 – Línea operativa cards ──
  lineaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    ...shorthands.gap('10px'),
    marginTop: '10px',
  },
  categoriaLabel: {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: tokens.colorNeutralForeground3,
    marginTop: '16px',
    marginBottom: '4px',
  },
  lineaCard: {
    ...shorthands.padding('14px', '16px'),
    borderRadius: '14px',
    ...shorthands.border('2px', 'solid', 'rgba(0,0,0,0.06)'),
    background: 'rgba(255,255,255,0.8)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'flex-start',
    ...shorthands.gap('12px'),
    ':hover': {
      ...shorthands.border('2px', 'solid', CENIT_COLORS.blueBrand),
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 24px rgba(0,51,160,0.08)',
    },
  },
  lineaCardActive: {
    ...shorthands.border('2px', 'solid', CENIT_COLORS.blueBrand),
    background: 'rgba(0,51,160,0.03)',
    boxShadow: '0 6px 20px rgba(0,51,160,0.1)',
  },
  lineaCardDisabled: {
    cursor: 'not-allowed',
    opacity: 0.48,
    ':hover': {
      ...shorthands.border('2px', 'solid', 'rgba(0,0,0,0.06)'),
      transform: 'none',
      boxShadow: 'none',
    },
  },
  lineaIcon: {
    fontSize: '22px',
    width: '36px', height: '36px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '10px',
    background: 'rgba(0,51,160,0.04)',
    flexShrink: 0,
  },
  lineaInfo: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('2px'),
    minWidth: 0,
  },

  // ── Selection grid (Zona, Estación) ──
  selectionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
    ...shorthands.gap('10px'),
    marginTop: '14px',
  },
  selectionCard: {
    ...shorthands.padding('14px', '18px'),
    borderRadius: '14px',
    ...shorthands.border('2px', 'solid', 'rgba(0,0,0,0.06)'),
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('10px'),
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

  // ── Tipo Lugar cards ──
  tipoLugarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    ...shorthands.gap('12px'),
    marginTop: '14px',
    marginBottom: '18px',
  },
  tipoLugarCard: {
    ...shorthands.padding('18px', '16px'),
    borderRadius: '16px',
    ...shorthands.border('2px', 'solid', 'rgba(0,0,0,0.06)'),
    background: 'rgba(255,255,255,0.8)',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.gap('6px'),
    ':hover': {
      ...shorthands.border('2px', 'solid', CENIT_COLORS.blueBrand),
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 24px rgba(0,51,160,0.08)',
    },
  },
  tipoLugarCardActive: {
    ...shorthands.border('2px', 'solid', CENIT_COLORS.blueBrand),
    background: 'rgba(0,51,160,0.03)',
    boxShadow: '0 6px 20px rgba(0,51,160,0.1)',
  },

  // ── Matrix filter bar ──
  matrizFilterBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    ...shorthands.gap('12px'),
    marginTop: '14px',
    marginBottom: '14px',
    ...shorthands.padding('16px'),
    borderRadius: '20px',
    background: 'linear-gradient(135deg, rgba(0,51,160,0.05), rgba(0,176,80,0.04))',
    ...shorthands.border('1px', 'solid', 'rgba(0,51,160,0.08)'),
  },
  matrizChip: {
    ...shorthands.padding('16px', '18px'),
    borderRadius: '18px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    ...shorthands.border('2px', 'solid', 'rgba(0,51,160,0.12)'),
    background: 'rgba(255,255,255,0.92)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
    transition: 'all 0.22s cubic-bezier(0.16,1,0.3,1)',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('6px'),
    minHeight: '96px',
    ':hover': {
      ...shorthands.border('2px', 'solid', CENIT_COLORS.blueBrand),
      transform: 'translateY(-2px)',
      boxShadow: '0 14px 30px rgba(0,51,160,0.12)',
    },
  },
  matrizChipActive: {
    background: `linear-gradient(135deg, ${CENIT_COLORS.blueBrand}, #1f4fb8)`,
    color: '#fff',
    ...shorthands.border('2px', 'solid', CENIT_COLORS.blueBrand),
    boxShadow: '0 16px 34px rgba(0,51,160,0.22)',
  },

  // ── Params / Items table ──
  paramTableWrap: {
    background: 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(12px)',
    borderRadius: '16px',
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.5)'),
    overflow: 'auto',
    maxHeight: '320px',
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

  // ── Logística section ──
  logisticaSection: {
    marginTop: '16px',
    ...shorthands.padding('14px', '16px'),
    borderRadius: '12px',
    background: 'rgba(0,176,80,0.04)',
    ...shorthands.border('1px', 'solid', 'rgba(0,176,80,0.12)'),
  },

  // ── Clasificación step ──
  clasificacionGroup: {
    marginBottom: '20px',
  },
  clasificacionCards: {
    display: 'flex',
    ...shorthands.gap('10px'),
    marginTop: '8px',
    flexWrap: 'wrap',
  },
  clasificacionCard: {
    ...shorthands.padding('14px', '20px'),
    borderRadius: '14px',
    ...shorthands.border('2px', 'solid', 'rgba(0,0,0,0.06)'),
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('2px'),
    flex: '1 1 120px',
    ':hover': {
      ...shorthands.border('2px', 'solid', CENIT_COLORS.blueBrand),
      background: 'rgba(0,51,160,0.02)',
    },
  },
  clasificacionCardActive: {
    ...shorthands.border('2px', 'solid', CENIT_COLORS.blueBrand),
    background: 'rgba(0,51,160,0.04)',
  },

  // ── Monthly grid ──
  monthGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    ...shorthands.gap('10px'),
    marginTop: '14px',
  },
  monthCard: {
    ...shorthands.padding('14px', '18px'),
    borderRadius: '14px',
    ...shorthands.border('1px', 'solid', 'rgba(0,0,0,0.06)'),
    background: 'rgba(255,255,255,0.7)',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
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
    fontSize: '14px',
    fontWeight: '800',
    color: CENIT_COLORS.blueBrand,
  },
  monthFields: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    ...shorthands.gap('8px'),
    [MEDIA.mobile]: { gridTemplateColumns: '1fr' },
  },
  monthFieldsTwo: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    ...shorthands.gap('8px'),
    [MEDIA.mobile]: { gridTemplateColumns: '1fr' },
  },

  // ── Matriz de programación: versión móvil (acordeón por ítem) ──
  mobMatrixList: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
    marginTop: '8px',
  },
  mobItemAcc: {
    ...shorthands.border('1px', 'solid', 'rgba(0,0,0,0.08)'),
    borderRadius: '10px',
    background: '#fff',
    overflow: 'hidden',
  },
  mobItemSummary: {
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
      flexShrink: 0,
    },
  },
  mobItemName: {
    fontWeight: 700,
    fontSize: '13px',
    color: '#003057',
    flex: 1,
    minWidth: 0,
    lineHeight: '1.3',
  },
  mobItemTotal: {
    fontWeight: 800,
    fontSize: '13px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  mobItemBody: {
    ...shorthands.padding('12px', '14px'),
    borderTop: '1px solid rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('10px'),
  },
  mobMonthRow: {
    display: 'grid',
    gridTemplateColumns: '40px 1fr auto',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    ...shorthands.padding('6px', '0'),
    borderBottom: '1px solid rgba(0,0,0,0.04)',
  },
  mobMonthLabel: {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: tokens.colorNeutralForeground3,
  },
  mobMonthTotal: {
    fontSize: '11px',
    fontWeight: 700,
    color: CENIT_COLORS.blueBrand,
    whiteSpace: 'nowrap',
    minWidth: '64px',
    textAlign: 'right',
  },
  mobIpcGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    ...shorthands.gap('4px'),
    ...shorthands.padding('12px', '14px'),
    borderTop: '1px solid rgba(0,0,0,0.06)',
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

  // ── Programming matrix (Step 5) ──
  ajustesPanel: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    ...shorthands.gap('20px'),
    marginTop: '12px',
    marginBottom: '4px',
    ...shorthands.padding('12px', '16px'),
    borderRadius: '12px',
    background: 'rgba(0,51,160,0.04)',
    ...shorthands.border('1px', 'solid', 'rgba(0,51,160,0.12)'),
  },
  ajustesGroup: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  progTopScroll: {
    marginTop: '14px',
    overflowX: 'auto',
    overflowY: 'hidden',
    // Barra de scroll horizontal superior, sincronizada con la tabla.
  },
  progMatrixWrap: {
    marginTop: '6px',
    overflow: 'auto',
    maxWidth: '100%',
    WebkitOverflowScrolling: 'touch',
    maxHeight: '52vh',
    borderRadius: '12px',
    ...shorthands.border('1px', 'solid', 'rgba(0,0,0,0.08)'),
  },
  progMatrixTable: {
    borderCollapse: 'collapse',
    width: '100%',
    minWidth: '1100px',
    fontSize: '12px',
  },
  progMatrixItemTh: {
    ...shorthands.padding('10px', '12px'),
    textAlign: 'left',
    fontWeight: '700',
    color: '#fff',
    background: '#003057',
    fontSize: '11px',
    minWidth: '200px',
    position: 'sticky',
    left: '0',
    top: '0',
    zIndex: '4',
    whiteSpace: 'nowrap',
  },
  progMatrixMonthTh: {
    ...shorthands.padding('10px', '4px'),
    textAlign: 'center',
    fontWeight: '700',
    color: '#fff',
    background: '#003057',
    fontSize: '11px',
    minWidth: '78px',
    position: 'sticky',
    top: '0',
    zIndex: '3',
  },
  progMatrixTotalTh: {
    ...shorthands.padding('10px', '12px'),
    textAlign: 'right',
    fontWeight: '700',
    color: '#fff',
    background: '#003057',
    fontSize: '11px',
    minWidth: '110px',
    position: 'sticky',
    top: '0',
    zIndex: '3',
  },
  progMatrixItemTd: {
    ...shorthands.padding('10px', '12px'),
    ...shorthands.borderBottom('1px', 'solid', 'rgba(0,0,0,0.05)'),
    verticalAlign: 'top',
    background: 'rgba(255,255,255,0.98)',
    position: 'sticky',
    left: '0',
    zIndex: '1',
    minWidth: '200px',
  },
  progMatrixMonthTd: {
    ...shorthands.padding('6px', '4px'),
    ...shorthands.borderBottom('1px', 'solid', 'rgba(0,0,0,0.04)'),
    verticalAlign: 'top',
    textAlign: 'center',
  },
  progMatrixTotalTd: {
    ...shorthands.padding('8px', '12px'),
    ...shorthands.borderBottom('1px', 'solid', 'rgba(0,0,0,0.04)'),
    textAlign: 'right',
    fontWeight: '600',
    color: CENIT_COLORS.blueBrand,
    background: 'rgba(0,51,160,0.03)',
    fontSize: '12px',
    verticalAlign: 'middle',
  },
  progMatrixIpcTh: {
    ...shorthands.padding('8px', '4px'),
    textAlign: 'center',
    fontWeight: '700',
    color: '#fff',
    background: CENIT_COLORS.blueBrand,
    fontSize: '11px',
    position: 'sticky',
    top: '37px',
    zIndex: '3',
  },
  progMatrixIpcThItem: {
    ...shorthands.padding('8px', '12px'),
    textAlign: 'right',
    fontWeight: '700',
    color: '#fff',
    background: CENIT_COLORS.blueBrand,
    fontSize: '11px',
    minWidth: '200px',
    position: 'sticky',
    left: '0',
    top: '37px',
    zIndex: '4',
    whiteSpace: 'nowrap',
  },
  progMatrixRow: {
    ':hover': { background: 'rgba(0,51,160,0.015)' },
  },
  progMatrixLogRow: {
    background: 'rgba(0,176,80,0.03)',
    ':hover': { background: 'rgba(0,176,80,0.05)' },
  },
  progMatrixTotalesRow: {
    background: 'rgba(0,51,160,0.04)',
    ...shorthands.borderTop('2px', 'solid', 'rgba(0,51,160,0.15)'),
  },

  // Footer elements
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
  pkInput: {
    marginTop: '12px',
    maxWidth: '320px',
  },
  infoBox: {
    ...shorthands.padding('16px'),
    borderRadius: '12px',
    background: 'rgba(0,51,160,0.04)',
    marginTop: '12px',
    color: '#003057',
    fontSize: '14px',
  },
  addLineaCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    ...shorthands.padding('16px'),
    borderRadius: '14px',
    ...shorthands.border('2px', 'dashed', tokens.colorNeutralStroke2),
    cursor: 'pointer',
    color: tokens.colorNeutralForeground3,
    fontSize: '14px',
    fontWeight: '500',
    ':hover': {
      ...shorthands.border('2px', 'dashed', CENIT_COLORS.blueBrand),
      color: CENIT_COLORS.blueBrand,
      background: 'rgba(0,51,160,0.03)',
    },
  },
  newLineaOverlay: {
    ...shorthands.padding('20px'),
    borderRadius: '14px',
    background: 'rgba(0,51,160,0.04)',
    marginTop: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  newLineaRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  tempItemsTableWrap: {
    borderRadius: '8px',
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    overflow: 'hidden',
    marginBottom: '8px',
  },
  tempItemRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    marginTop: '4px',
  },
  addItemCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    ...shorthands.padding('8px', '14px'),
    borderRadius: '8px',
    ...shorthands.border('2px', 'dashed', tokens.colorNeutralStroke2),
    cursor: 'pointer',
    color: tokens.colorNeutralForeground3,
    fontSize: '13px',
    fontWeight: '500',
    marginTop: '8px',
    ':hover': {
      ...shorthands.border('2px', 'dashed', CENIT_COLORS.blueBrand),
      color: CENIT_COLORS.blueBrand,
    },
  },
});

// ── Component ──

interface TempItem { id: string; nombre: string; unidad: string; precio: number; }

interface Props {
  open: boolean;
  onClose: () => void;
  onComplete: (result: PlaneacionWizardResult) => void;
  initialData?: PlaneacionInitialData | null;
  canSelectLinea?: (linea: LineaOperativa) => boolean;
  canSelectZona?: (linea: LineaOperativa, zona: string) => boolean;
  allowCustomLineas?: boolean;
}

export const PlaneacionWizard: React.FC<Props> = ({
  open,
  onClose,
  onComplete,
  initialData,
  canSelectLinea,
  canSelectZona,
  allowCustomLineas = true,
}) => {
  const styles = useStyles();
  const { isMobile } = useResponsive();
  const { isAdmin } = useAuth();

  // ── State ──
  const [step, setStep] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Scroll horizontal sincronizado (barra superior <-> tabla de programación)
  const progScrollRef = useRef<HTMLDivElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const [progScrollWidth, setProgScrollWidth] = useState(0);
  const syncingScroll = useRef(false);
  const syncScroll = useCallback((from: 'top' | 'table') => {
    if (syncingScroll.current) { syncingScroll.current = false; return; }
    const top = topScrollRef.current;
    const table = progScrollRef.current;
    if (!top || !table) return;
    syncingScroll.current = true;
    if (from === 'top') table.scrollLeft = top.scrollLeft;
    else top.scrollLeft = table.scrollLeft;
  }, []);
  const measureProgScroll = useCallback(() => {
    const el = progScrollRef.current;
    if (el) setProgScrollWidth(el.scrollWidth);
  }, []);

  // Step 0: Línea
  const [selectedLinea, setSelectedLinea] = useState<LineaPlaneacionConfig | null>(null);

  // Custom líneas (session-only)
  const [customLineas, setCustomLineas] = useState<LineaPlaneacionConfig[]>([]);
  const [creandoLinea, setCreandoLinea] = useState(false);
  const [newLineaNombre, setNewLineaNombre] = useState('');
  const [newLineaDesc, setNewLineaDesc] = useState('');
  const [newLineaCategoria, setNewLineaCategoria] = useState<string>(CATEGORIAS_ORDEN[0]);
  const [newLineaLugar, setNewLineaLugar] = useState<TipoLugar>('Estación');
  const [tempItems, setTempItems] = useState<TempItem[]>([]);
  const [tempItemNombre, setTempItemNombre] = useState('');
  const [tempItemUnidad, setTempItemUnidad] = useState(UNIDADES_CONTRATO[0]);
  const [tempItemPrecio, setTempItemPrecio] = useState('');

  // Custom items registry (session-only; keyed by linea.value)
  const [customItemsMap, setCustomItemsMap] = useState<Record<string, ItemLinea[]>>({});

  // Step 3 inline add-item form
  const [addingItemStep3, setAddingItemStep3] = useState(false);
  const [s3Nombre, setS3Nombre] = useState('');
  const [s3Unidad, setS3Unidad] = useState(UNIDADES_CONTRATO[0]);
  const [s3Precio, setS3Precio] = useState('');

  // Step 1: Zona
  const [selectedZona, setSelectedZona] = useState<string | null>(null);

  // Step 2: Lugar
  const [tipoLugar, setTipoLugar] = useState<TipoLugar>('Estación');
  const [availableEstaciones, setAvailableEstaciones] = useState<string[]>([]);
  const [selectedEstacion, setSelectedEstacion] = useState<string | null>(null);
  const [pk, setPk] = useState('');
  // Step 4: Parámetros / Ítems
  const [availableMatrices, setAvailableMatrices] = useState<string[]>([]);
  const [selectedMatrices, setSelectedMatrices] = useState<Set<string>>(new Set());
  const [matrizDetalleActiva, setMatrizDetalleActiva] = useState<string | null>(null);
  const [availableParams, setAvailableParams] = useState<MonitoreoRow[]>([]);
  const [selectedParams, setSelectedParams] = useState<Set<string>>(new Set());
  // Cambio 5: Simple/Compuesto per parameter
  const [paramTipoMuestra, setParamTipoMuestra] = useState<Map<string, 'simple' | 'compuesto'>>(new Map());
  const [paramCantCompuestos, setParamCantCompuestos] = useState<Map<string, number>>(new Map());
  // Puntos por parámetro: solo guarda overrides; el default es r.puntos (del Excel)
  const [paramPuntos, setParamPuntos] = useState<Map<string, number>>(new Map());
  // ICAs: desglose del ítem en Consolidar (%) y Radicación (100 - %). Default 70/30.
  const [icasConsolidarPct, setIcasConsolidarPct] = useState<number>(70);
  // ICAs: si está desglosado, el ítem se programa como DOS ítems (Consolidar / Elaborar y Radicar).
  // Desglose por ítem: claves (id de ítem ICAs) que están desglosadas.
  const [icasDesglosadoKeys, setIcasDesglosadoKeys] = useState<Set<string>>(new Set());
  // ICAs: cantidades mensuales del desglose (Consolidar/Radicación) por ítem.
  // Persisten al unir/re-desglosar para no perder lo digitado; al unir, el ítem
  // único conserva el DINERO (consPrecio×cons + radPrecio×rad), no la suma de cantidades.
  const [icasSplitData, setIcasSplitData] = useState<Record<string, { cons: number[]; rad: number[] }>>({});
  // Cambio 4: IPC global (uno solo para toda la planeación)
  const [ipcGlobalActivo, setIpcGlobalActivo] = useState<boolean>(false);
  const [ipcGlobalPorcentaje, setIpcGlobalPorcentaje] = useState<number>(0);
  // IVA por item: toggle global + porcentaje; la selección vive en cada ítem programado.
  const [ivaGlobalActivo, setIvaGlobalActivo] = useState<boolean>(false);
  const [ivaGlobalPorcentaje, setIvaGlobalPorcentaje] = useState<number>(19);
  const [customMonitoreoRows, setCustomMonitoreoRows] = useState<MonitoreoRow[]>([]);
  const [addingParamStep3, setAddingParamStep3] = useState(false);
  const [s3ParamEstacion, setS3ParamEstacion] = useState('');
  const [s3ParamNombre, setS3ParamNombre] = useState('');
  const [s3ParamMatriz, setS3ParamMatriz] = useState<string>(MATRICES_AMBIENTALES[0]?.value ?? 'ARD');
  const [s3ParamNorma, setS3ParamNorma] = useState('');
  const [s3ParamPermiso, setS3ParamPermiso] = useState('');
  const [s3ParamRequerimiento, setS3ParamRequerimiento] = useState('');
  const [s3ParamReceptor, setS3ParamReceptor] = useState('');
  const [s3ParamPrecio, setS3ParamPrecio] = useState('');
  const [availableItems, setAvailableItems] = useState<ItemLinea[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  // Ítems/parámetros eliminados por el usuario (se ocultan aunque el efecto recargue desde el servicio).
  const [deletedKeys, setDeletedKeys] = useState<Set<string>>(new Set());
  const [selectedLogistica, setSelectedLogistica] = useState<Set<string>>(new Set(ITEMS_LOGISTICA.map(it => it.id)));
  const [paramSearch, setParamSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [catalogWarning, setCatalogWarning] = useState<string | null>(null);

  // Step 4: Clasificación
  const [fuentePresupuesto, setFuentePresupuesto] = useState<FuentePresupuesto>('OPEX');
  const [tipoPlaneacion, setTipoPlaneacion] = useState<TipoPlaneacion>('Plan');
  const [anioPlaneacion, setAnioPlaneacion] = useState(new Date().getFullYear() + 1);

  // Datos auxiliares presupuestales (aplican para OPEX y CAPEX)
  const [datosAuxiliaresPresupuestales, setDatosAuxiliaresPresupuestales] =
    useState<DatosAuxiliaresPresupuestales>({ ...DEFAULT_DATOS_AUXILIARES });

  // Programación
  const [monthlyData, setMonthlyData] = useState<PlaneacionMensual[]>([]);
  // IPC per month toggle (which months apply IPC adjustment)
  const [ipcMeses, setIpcMeses] = useState<Set<number>>(new Set());
  const [ivaMeses, setIvaMeses] = useState<Set<number>>(new Set());
  const [pagosDiferidosActivo, setPagosDiferidosActivo] = useState(false);
  const [pagosDiferidosItems, setPagosDiferidosItems] = useState<Record<string, PagoDiferidoItemConfig>>({});
  const [pagosDiferidosWarning, setPagosDiferidosWarning] = useState<string | null>(null);

  // Step 2: Sistema + Sector (Compensaciones only)
  const [selectedSistema, setSelectedSistema] = useState('');
  const [selectedSector, setSelectedSector] = useState('');

  // Step 3 (Compensaciones): Descripción de la obligación
  const [obligacionId, setObligacionId] = useState('');
  const [obligacionFechaCreacion, setObligacionFechaCreacion] = useState(() => new Date().toISOString().split('T')[0]);
  const [obligacionActoTipo, setObligacionActoTipo] = useState<string>('Resolución');
  const [obligacionActoNumero, setObligacionActoNumero] = useState('');
  const [obligacionActoFecha, setObligacionActoFecha] = useState('');
  const [obligacionPermiso, setObligacionPermiso] = useState('');
  const [obligacionAutoridad, setObligacionAutoridad] = useState('');
  // Jurisdicción dividida en 4 campos (Compensaciones)
  const [obligacionJurisdiccionCorp, setObligacionJurisdiccionCorp] = useState('');
  const [obligacionDepartamento, setObligacionDepartamento] = useState('');
  const [obligacionMunicipio, setObligacionMunicipio] = useState('');
  const [obligacionVeredaPredio, setObligacionVeredaPredio] = useState('');
  const [obligacionExpediente, setObligacionExpediente] = useState('');
  const [obligacionCategoria, setObligacionCategoria] = useState('');

  // Compensaciones: Clasificación extendida
  const [asignacionRecursos, setAsignacionRecursos] = useState<boolean>(false);
  const [saldoDisponible, setSaldoDisponible] = useState<number>(0);
  const [aniosAPlanear, setAniosAPlanear] = useState<number>(1);
  const [contratoSeleccionado, setContratoSeleccionado] = useState<string>('');

  // Compensaciones: Programación multi-año (anualizada)
  const [progY2, setProgY2] = useState<ProgramacionAnualItem[]>([]);
  const [progY3, setProgY3] = useState<ProgramacionAnualItem[]>([]);
  // Compensaciones: pestaña activa en Programación (1, 2 o 3)
  const [tabAnio, setTabAnio] = useState<number>(1);
  // Compensaciones: ¿las actividades del Año 2/3 son distintas a las del Año 1?
  // Si true, cada año mantiene su propia selección de ítems (independiente).
  const [itemsCambianPorAnio, setItemsCambianPorAnio] = useState<boolean>(false);
  const [selectedItemsY2, setSelectedItemsY2] = useState<Set<string>>(new Set());
  const [selectedItemsY3, setSelectedItemsY3] = useState<Set<string>>(new Set());
  const [preserveNextProgramacionBuild, setPreserveNextProgramacionBuild] = useState(false);

  // Derived
  const isMonitoreo = selectedLinea?.usaMatriz === true;
  const isCompensaciones = !!selectedLinea && LINEAS_COMPENSACIONES.includes(selectedLinea.value);
  const isCompensacionesProvisiones = selectedLinea?.value === 'Compensaciones provisiones';
  const isIcas = selectedLinea?.value === 'ICAs';
  const isEstudiosAmbientales = selectedLinea?.value === 'Estudios Ambientales';
  const isServiciosE = selectedLinea?.value === 'Servicios E';
  // Líneas donde el usuario digita el precio directamente por mes
  // (sin precio de referencia ni cantidad): Pagos y Compensaciones provisiones.
  // ICAs vuelve a precio de referencia + cantidad por mes (ver desglose Consolidar/Elaborar).
  const isPagos = selectedLinea?.value === 'Pagos';
  const isPrecioPorMes = isPagos || isCompensacionesProvisiones;
  const isPagosDiferidosDisponible = isEstudiosAmbientales;
  const tiposLugarDisponibles = useMemo(
    () => isServiciosE
      ? TIPOS_LUGAR.filter(t => t.value !== 'Estación')
      : TIPOS_LUGAR.filter(t => t.value !== 'Transversal'),
    [isServiciosE],
  );

  // Step index offsets for Compensaciones (new Obligación step inserted at index 3)
  const STEP_CLASIFICACION = isCompensaciones ? 4 : 3;
  const STEP_DATOS_AUXILIARES = STEP_CLASIFICACION + 1;
  const STEP_PARAMETROS    = isCompensaciones ? 6 : 5;
  const STEP_PROGRAMACION  = isCompensaciones ? 7 : 6;
  const TOTAL_STEPS        = isCompensaciones ? 8 : 7;

  const STEPS = useMemo(() => getStepLabels(isMonitoreo, isCompensaciones), [isMonitoreo, isCompensaciones]);
  const isEditMode = !!initialData;

  // Medir el ancho real de la tabla para dimensionar la barra de scroll superior.
  useEffect(() => {
    if (step !== STEP_PROGRAMACION) return;
    measureProgScroll();
    window.addEventListener('resize', measureProgScroll);
    return () => window.removeEventListener('resize', measureProgScroll);
  }, [step, STEP_PROGRAMACION, monthlyData, measureProgScroll]);

  const lineasPlaneacionVisibles = useMemo(
    () => LINEAS_PLANEACION.filter(linea => !canSelectLinea || canSelectLinea(linea.value)),
    [canSelectLinea],
  );

  // ── Param key helper ──
  const paramKey = useCallback((r: MonitoreoRow) => paramKeyOf(r), []);

  const zonasDisponiblesPaso = useMemo(() => {
    const zonasBase = isCompensaciones ? ZONAS_COMPENSACIONES : ZONAS;
    const zonasFiltradas = !selectedLinea || !canSelectZona
      ? zonasBase
      : zonasBase.filter(zona => canSelectZona(selectedLinea.value, zona));
    if (selectedLinea?.value !== 'Servicios E') return zonasFiltradas;
    return zonasFiltradas.includes('Transversal')
      ? zonasFiltradas
      : [...zonasFiltradas, 'Transversal'];
  }, [canSelectZona, isCompensaciones, selectedLinea]);

  // ── Reset on open ──
  useEffect(() => {
    if (!open) return;
    setParamSearch('');
    setCatalogWarning(null);
    setShowExitConfirm(false);
    if (initialData) {
      const cfg = LINEAS_PLANEACION.find(l => l.value === initialData.lineaOperativa) ?? null;
      const initialTipoLugar = initialData.tipoLugar ?? cfg?.lugarPorDefecto ?? 'Estación';
      const safeTipoLugar = cfg?.value === 'Servicios E' && initialTipoLugar === 'Estación'
        ? 'Zona'
        : initialTipoLugar;
      setSelectedLinea(cfg);
      setStep(0);
      setSelectedZona(initialData.zona ?? null);
      setTipoLugar(safeTipoLugar);
      setSelectedEstacion(safeTipoLugar === 'Estación' ? initialData.estacion ?? null : null);
      setPk(initialData.pk ?? '');
      setFuentePresupuesto(initialData.fuentePresupuesto ?? 'OPEX');
      setTipoPlaneacion(initialData.tipoPlaneacion ?? 'Plan');
      setAnioPlaneacion(initialData.anioPlaneacion ?? new Date().getFullYear() + 1);
      setDatosAuxiliaresPresupuestales({
        ...DEFAULT_DATOS_AUXILIARES,
        ...initialData.datosAuxiliaresPresupuestales,
      });
      setSelectedParams(new Set(initialData.selectedParamKeys ?? []));
      setSelectedItems(new Set(initialData.selectedItemIds ?? []));
      setSelectedLogistica(new Set(initialData.selectedLogisticaIds ?? ITEMS_LOGISTICA.map(it => it.id)));
      setSelectedMatrices(new Set(initialData.selectedMatrices ?? []));
      setMatrizDetalleActiva(null);
      setCustomMonitoreoRows(initialData.customMonitoreoRows ?? []);
      if (cfg) {
        setCustomItemsMap(prev => ({
          ...prev,
          [cfg.value]: initialData.customItems ?? [],
        }));
      }
      setParamTipoMuestra(new Map(Object.entries(initialData.paramTipoMuestra ?? {})));
      setParamCantCompuestos(new Map(
        Object.entries(initialData.paramCantCompuestos ?? {}).map(([key, value]) => [key, Number(value) || 1])
      ));
      setParamPuntos(new Map(
        Object.entries(initialData.paramPuntos ?? {}).map(([key, value]) => [key, Number(value) || 1])
      ));
      if (typeof initialData.icasConsolidarPct === 'number') setIcasConsolidarPct(initialData.icasConsolidarPct);
      setIcasDesglosadoKeys(new Set(initialData.icasDesglosadoKeys ?? []));
      setIcasSplitData(initialData.icasSplitData ?? {});
      setMonthlyData(initialData.programacion ?? []);
      setIpcGlobalActivo(initialData.ipcGlobalActivo ?? false);
      setIpcGlobalPorcentaje(initialData.ipcGlobalPorcentaje ?? 0);
      setIpcMeses(new Set(initialData.ipcMeses ?? []));
      setIvaGlobalActivo(initialData.ivaGlobalActivo ?? false);
      setIvaGlobalPorcentaje(initialData.ivaGlobalPorcentaje ?? 19);
      setIvaMeses(new Set(initialData.ivaMeses ?? []));
      setPagosDiferidosActivo(!!initialData.pagosDiferidosActivo);
      setPagosDiferidosItems(initialData.pagosDiferidosItems ?? {});
      setPagosDiferidosWarning(null);
      setSelectedSistema(initialData.sistema ?? '');
      setSelectedSector(initialData.sector ?? '');
      setObligacionId(initialData.obligacion?.id ?? '');
      setObligacionFechaCreacion(initialData.obligacion?.fechaCreacion ?? new Date().toISOString().split('T')[0]);
      setObligacionActoTipo(initialData.obligacion?.actoAdministrativo?.tipo ?? 'Resolución');
      setObligacionActoNumero(initialData.obligacion?.actoAdministrativo?.numero ?? '');
      setObligacionActoFecha(initialData.obligacion?.actoAdministrativo?.fecha ?? '');
      setObligacionPermiso(initialData.obligacion?.permiso ?? '');
      setObligacionAutoridad(initialData.obligacion?.autoridad ?? '');
      setObligacionJurisdiccionCorp(initialData.obligacion?.jurisdiccion?.corporacion ?? '');
      setObligacionDepartamento(initialData.obligacion?.jurisdiccion?.departamento ?? '');
      setObligacionMunicipio(initialData.obligacion?.jurisdiccion?.municipio ?? '');
      setObligacionVeredaPredio(initialData.obligacion?.jurisdiccion?.veredaPredio ?? '');
      setObligacionExpediente(initialData.obligacion?.expediente ?? '');
      setObligacionCategoria(initialData.obligacion?.categoria ?? '');
      setAsignacionRecursos(initialData.asignacionRecursos ?? false);
      setSaldoDisponible(initialData.saldoDisponible ?? 0);
      setAniosAPlanear(initialData.aniosAPlanear ?? 1);
      setContratoSeleccionado(initialData.contratoSeleccionado ?? '');
      setProgY2(initialData.programacionY2 ?? []);
      setProgY3(initialData.programacionY3 ?? []);
      setTabAnio(1);
      setItemsCambianPorAnio(initialData.itemsCambianPorAnio ?? false);
      setSelectedItemsY2(new Set(initialData.selectedItemsY2 ?? []));
      setSelectedItemsY3(new Set(initialData.selectedItemsY3 ?? []));
      setPreserveNextProgramacionBuild(!!initialData.preserveProgramacionSinSeleccion);
    } else {
      setStep(0);
      setSelectedLinea(null);
      setSelectedZona(null);
      setTipoLugar('Estación');
      setSelectedEstacion(null);
      setPk('');
      setAvailableEstaciones([]);
      setAvailableMatrices([]);
      setAvailableParams([]);
      setAvailableItems([]);
      setSelectedParams(new Set());
      setSelectedItems(new Set());
      setDeletedKeys(new Set());
      setIcasDesglosadoKeys(new Set());
      setIcasSplitData({});
      setSelectedLogistica(new Set(ITEMS_LOGISTICA.map(it => it.id)));
      setSelectedMatrices(new Set());
      setMatrizDetalleActiva(null);
      setParamTipoMuestra(new Map());
      setParamCantCompuestos(new Map());
      setCustomMonitoreoRows([]);
      setCustomItemsMap({});
      setFuentePresupuesto('OPEX');
      setTipoPlaneacion('Plan');
      setAnioPlaneacion(new Date().getFullYear() + 1);
      setDatosAuxiliaresPresupuestales({ ...DEFAULT_DATOS_AUXILIARES });
      setMonthlyData([]);
      setIpcGlobalActivo(false);
      setIpcGlobalPorcentaje(0);
      setIpcMeses(new Set());
      setSelectedSistema('');
      setSelectedSector('');
      setObligacionId('');
      setObligacionFechaCreacion(new Date().toISOString().split('T')[0]);
      setObligacionActoTipo('Resolución');
      setObligacionActoNumero('');
      setObligacionActoFecha('');
      setObligacionPermiso('');
      setObligacionAutoridad('');
      setObligacionJurisdiccionCorp('');
      setObligacionDepartamento('');
      setObligacionMunicipio('');
      setObligacionVeredaPredio('');
      setObligacionExpediente('');
      setObligacionCategoria('');
      setAsignacionRecursos(false);
      setSaldoDisponible(0);
      setAniosAPlanear(1);
      setContratoSeleccionado('');
      setProgY2([]);
      setProgY3([]);
      setTabAnio(1);
      setItemsCambianPorAnio(false);
      setSelectedItemsY2(new Set());
      setSelectedItemsY3(new Set());
      setIvaGlobalActivo(false);
      setIvaGlobalPorcentaje(19);
      setIvaMeses(new Set());
      setPagosDiferidosActivo(false);
      setPagosDiferidosItems({});
      setPagosDiferidosWarning(null);
      setPreserveNextProgramacionBuild(false);
    }
  }, [open, initialData]);

  useEffect(() => {
    if (!isServiciosE || tipoLugar !== 'Estación') return;
    setTipoLugar('Zona');
    setSelectedEstacion(null);
  }, [isServiciosE, tipoLugar]);

  useEffect(() => {
    if (isPagosDiferidosDisponible) return;
    setPagosDiferidosActivo(false);
    setPagosDiferidosItems({});
    setPagosDiferidosWarning(null);
  }, [isPagosDiferidosDisponible]);

  // ── Load estaciones when zona + tipoLugar change ──
  useEffect(() => {
    if (!selectedZona || tipoLugar !== 'Estación') {
      setAvailableEstaciones([]);
      return;
    }
    if (isMonitoreo) {
      MonitoreosMatrizService.getEstaciones(selectedZona).then(setAvailableEstaciones);
    } else {
      setAvailableEstaciones(ZONAS_ESTACIONES[selectedZona] ?? []);
    }
  }, [selectedZona, tipoLugar, isMonitoreo]);

  // ── Load matrices + params when entering Parámetros step (monitoreos) ──
  useEffect(() => {
    if (step !== STEP_PARAMETROS || !isMonitoreo) return;
    const z = selectedZona;
    const e = tipoLugar === 'Estación' ? selectedEstacion : undefined;
    if (!z) return;
    if (tipoLugar === 'Estación' && !e) return;

    setLoading(true);
    (async () => {
      let baseRows: MonitoreoRow[] = [];
      if (tipoLugar === 'Zona') {
        baseRows = await MonitoreosMatrizService.getParametros(z);
      } else if (e) {
        baseRows = await MonitoreosMatrizService.getParametros(z, e);
      }

      const customRows = customMonitoreoRows.filter(r =>
        r.zona === z && (tipoLugar === 'Zona' ? true : r.estacion === e)
      );
      const rows = [...baseRows, ...customRows].filter(r => !deletedKeys.has(paramKey(r)));
      const mats = [...new Set(rows.map(r => r.matriz))].sort();

      setAvailableMatrices(mats);
      setAvailableParams(rows);

      // Sembrar tipo de muestra / nº de compuestos desde la matriz (Excel de referencia).
      // Solo para claves que aún no tenga el usuario, para no pisar ediciones manuales.
      setParamTipoMuestra(prev => {
        const next = new Map(prev);
        for (const r of rows) {
          const key = paramKey(r);
          if (next.has(key)) continue;
          if ((r.compuesto ?? 0) > 1) next.set(key, 'compuesto');
        }
        return next;
      });
      setParamCantCompuestos(prev => {
        const next = new Map(prev);
        for (const r of rows) {
          const key = paramKey(r);
          if (next.has(key)) continue;
          if ((r.compuesto ?? 0) > 1) next.set(key, r.compuesto);
        }
        return next;
      });

      if (selectedMatrices.size > 0) {
        const validKeys = new Set(rows.map(r => paramKey(r)));
        const hasValidSelection = [...selectedParams].some(key => validKeys.has(key));
        if (!hasValidSelection) {
          setSelectedParams(new Set(
            rows
              .filter(r => selectedMatrices.has(r.matriz))
              .map(r => paramKey(r))
          ));
        }
      }
      setLoading(false);
    })();
  }, [step, isMonitoreo, selectedZona, selectedEstacion, tipoLugar, customMonitoreoRows, paramKey, deletedKeys]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load items when entering Parámetros step (non-monitoreos) ──
  useEffect(() => {
    if (step !== STEP_PARAMETROS || isMonitoreo || !selectedLinea) return;
    let cancelled = false;
    setLoading(true);
    setCatalogWarning(null);

    (async () => {
      // Para Compensaciones la zona ES la estación (columnas del consolidado BQS)
      const estacionParaTarifa = isCompensaciones ? (selectedZona ?? undefined) : undefined;
      const serviceItems = ItemsLineaService.getItems(
        selectedLinea.value,
        estacionParaTarifa,
        selectedZona ?? undefined,
        undefined,
      );
      const custom = customItemsMap[selectedLinea.value] ?? [];
      let globalItems: ItemLinea[] = [];

      try {
        globalItems = await CatalogoItemsGlobalService.getItems(selectedLinea.value, selectedZona ?? undefined);
      } catch (error) {
        console.warn('No se pudo cargar el catálogo global de ítems.', error);
        if (!cancelled) {
          setCatalogWarning('No se pudo cargar el catálogo global. Puedes seguir planeando con el catálogo local.');
        }
      }

      let merged = ItemsLineaService.mergeItems(serviceItems, globalItems, custom);
      // Compensaciones: filtrar adicionalmente por contrato seleccionado si los ítems traen campo `contrato`
      if (isCompensaciones && contratoSeleccionado) {
        merged = merged.filter(it => {
          const c = (it as any).contrato;
          return !c || c === contratoSeleccionado;
        });
      }
      // Ocultar los ítems que el usuario eliminó (aunque vuelvan del servicio/catálogo).
      merged = merged.filter(it => !deletedKeys.has(it.id));

      if (!cancelled) {
        setAvailableItems(merged);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [step, isMonitoreo, selectedLinea, customItemsMap, isCompensaciones, selectedZona, contratoSeleccionado, deletedKeys]);

  // ── Build monthly data when entering Programación step ──
  useEffect(() => {
    if (step !== STEP_PROGRAMACION) return;

    if (preserveNextProgramacionBuild && monthlyData.length > 0) {
      setPreserveNextProgramacionBuild(false);
      return;
    }

    // Build individual price entries from selected params/items + logística
    const buildEntry = (
      key: string, nombre: string, basePrice: number,
      mesIndex: number, prev?: PlaneacionMensual, defaultFrec = 1,
      forcePrice = false, // si true, siempre usa basePrice (ignora el precio guardado)
    ): PlaneacionMensualParam => {
      const ex = prev?.preciosIndividuales?.find(p => p.key === key);
      const porcentajeDiferido = isPagosDiferidosDisponible && pagosDiferidosActivo
        ? (ex?.porcentajeDiferido ?? pagosDiferidosItems[key]?.porcentajesMensuales?.[mesIndex] ?? 0)
        : undefined;
      const precio    = (forcePrice || !ex) ? basePrice : ex.precio;
      // Precio por mes: el "total" del mes es el precio digitado (cantidad y frecuencia fijas en 1).
      const cantidad  = ex?.cantidad  ?? (isPrecioPorMes ? 1 : 0);
      const frecuencia = ex?.frecuencia ?? defaultFrec;
      const aplicaIva = ex?.aplicaIva ?? false;
      const entry: PlaneacionMensualParam = {
        key,
        nombre,
        precio,
        cantidad,
        frecuencia,
        aplicaIva,
        porcentajeDiferido,
        total: 0,
      };
      entry.total = calculateEntryTotal(entry, mesIndex);
      return entry;
    };

    setMonthlyData(prev => {
      return MESES.map((mes, i) => {
        const existing = prev.length > i ? prev[i] : undefined;
        const list: PlaneacionMensualParam[] = [];

        if (isMonitoreo) {
          // Group selected params by Matriz for programming
          const selParams = availableParams.filter(r => selectedParams.has(paramKey(r)));
          const matrizMap = new Map<string, MonitoreoRow[]>();
          for (const r of selParams) {
            const arr = matrizMap.get(r.matriz) || [];
            arr.push(r);
            matrizMap.set(r.matriz, arr);
          }
          for (const [matriz, rows] of matrizMap) {
            // Precio matriz = Σ(precio_param × compuestos_param × puntos_param)
            // compuestos_param = cantCompuestos si tipo=compuesto, sino 1 (simple)
            // puntos_param = override del usuario o el valor del Excel (r.puntos)
            const matrizPrecio = precioMatriz(rows, i, paramTipoMuestra, paramCantCompuestos, paramPuntos);
            list.push(buildEntry(`MATRIZ|${matriz}`, `${matriz} (${rows.length} params)`, matrizPrecio, i, existing, 1, true));
          }
        } else {
          for (const it of availableItems.filter(it => selectedItems.has(it.id))) {
            // ICAs: tarifa por ítem según el año (2026/2027). Otras líneas: precio efectivo.
            const base = isIcas ? (it.precioReferencia || TARIFA_ICAS) : (isPrecioPorMes ? 0 : ItemsLineaService.getPrecioEfectivo(it, i));
            const pc = Math.max(0, Math.min(100, icasConsolidarPct)) / 100;
            const consPrecio = ICAS_CONSOLIDAR_2026;
            const radPrecio = base * (1 - pc);
            const saved = icasSplitData[it.id];
            if (isIcas && icasDesglosadoKeys.has(it.id)) {
              // ICAs desglosado (2026): Consolidar valor fijo; Radicación al 30%.
              // La cantidad se toma de lo digitado en sesión (prev) o, si se re-desglosa
              // tras unir, de icasSplitData (no se pierde lo digitado). Default 0.
              const prevCons = existing?.preciosIndividuales?.find(p => p.key === `${it.id}::CONSOLIDAR`);
              const prevRad = existing?.preciosIndividuales?.find(p => p.key === `${it.id}::RADICACION`);
              // forcePrice=true: el precio es fijo (no se hereda de datos guardados/corruptos).
              const eC = buildEntry(`${it.id}::CONSOLIDAR`, 'Consolidar información para ICAS', consPrecio, i, existing, 1, true);
              eC.cantidad = prevCons?.cantidad ?? saved?.cons[i] ?? 0;
              eC.total = calculateEntryTotal(eC, i);
              const eR = buildEntry(`${it.id}::RADICACION`, 'Radicación información para ICAS', radPrecio, i, existing, 1, true);
              eR.cantidad = prevRad?.cantidad ?? saved?.rad[i] ?? 0;
              eR.total = calculateEntryTotal(eR, i);
              list.push(eC, eR);
            } else {
              // Al unir, el ítem único conserva el DINERO del desglose:
              //   total = consPrecio×consCant + radPrecio×radCant
              // y la cantidad se deriva (= total / tarifa) para mantener $/u = tarifa.
              // forcePrice para ICAs: la tarifa siempre es la del año (no se corrompe).
              const e = buildEntry(it.id, it.item, base, i, existing, 1, isIcas);
              const prevSingle = existing?.preciosIndividuales?.find(p => p.key === it.id);
              if (isIcas && saved && !prevSingle) {
                // Primera vez que se une: derivar del desglose guardado (preserva el dinero).
                const money = consPrecio * (saved.cons[i] ?? 0) + radPrecio * (saved.rad[i] ?? 0);
                e.cantidad = base > 0 ? money / base : 0;
                e.total = calculateEntryTotal(e, i);
              }
              list.push(e);
            }
          }
        }

        // Logística — solo en Monitoreos (no aplica para Compensaciones u otras líneas)
        if (isMonitoreo) {
          for (const log of ITEMS_LOGISTICA.filter(l => selectedLogistica.has(l.id))) {
            // Logística solo usa cantidad (sin compuesto): frecuencia fija en 1.
            const logEntry = buildEntry(log.id, log.item, ItemsLineaService.getPrecioEfectivo(log, i), i, existing, 1);
            if (logEntry.frecuencia !== 1) {
              logEntry.frecuencia = 1;
              logEntry.total = calculateEntryTotal(logEntry, i);
            }
            list.push(logEntry);
          }
        }

        return {
          mes, mesIndex: i,
          cantidad: 0,
          frecuencia: 1,
          precio: list.reduce((s, p) => s + p.precio, 0),
          preciosIndividuales: list,
          total: list.reduce((s, p) => s + p.total, 0),
        };
      });
    });
  }, [step, paramTipoMuestra, paramCantCompuestos, paramPuntos, icasDesglosadoKeys, icasConsolidarPct, icasSplitData]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Filtered params (monitoreos) ──
  const filteredParams = useMemo(() => {
    let rows = availableParams;
    if (!matrizDetalleActiva || !selectedMatrices.has(matrizDetalleActiva)) return [];
    rows = rows.filter(r => r.matriz === matrizDetalleActiva);
    // Apply text search
    if (paramSearch) {
      const q = paramSearch.toLowerCase();
      rows = rows.filter(r =>
        r.parametro.toLowerCase().includes(q) ||
        r.estacion.toLowerCase().includes(q) ||
        r.matriz.toLowerCase().includes(q) ||
        r.norma.toLowerCase().includes(q) ||
        r.permiso.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [availableParams, matrizDetalleActiva, selectedMatrices, paramSearch]);

  const matrixSummaries = useMemo(() => {
    const map = new Map<string, { matriz: string; params: number; estaciones: Set<string>; selected: number }>();
    for (const row of availableParams) {
      const key = row.matriz;
      const current = map.get(key) ?? { matriz: key, params: 0, estaciones: new Set<string>(), selected: 0 };
      current.params += 1;
      if (row.estacion) current.estaciones.add(row.estacion);
      if (selectedParams.has(paramKey(row))) current.selected += 1;
      map.set(key, current);
    }
    return [...map.values()].sort((a, b) => a.matriz.localeCompare(b.matriz));
  }, [availableParams, selectedParams, paramKey]);

  // ── Filtered items (non-monitoreos) ──
  const filteredItems = useMemo(() => {
    if (!paramSearch) return availableItems;
    const q = paramSearch.toLowerCase();
    return availableItems.filter(it =>
      it.item.toLowerCase().includes(q) ||
      it.descripcion.toLowerCase().includes(q)
    );
  }, [availableItems, paramSearch]);

  const totalSelectedCount = isMonitoreo
    ? selectedParams.size
    : (isCompensaciones && itemsCambianPorAnio && tabAnio === 2 ? selectedItemsY2.size
       : isCompensaciones && itemsCambianPorAnio && tabAnio === 3 ? selectedItemsY3.size
       : selectedItems.size);

  // ── Toggle helpers ──
  const toggleParam = useCallback((r: MonitoreoRow) => {
    const key = paramKey(r);
    setSelectedParams(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, [paramKey]);

  const toggleAllParams = useCallback(() => {
    const visibleKeys = filteredParams.map(r => paramKey(r));
    const allVisibleSelected = visibleKeys.length > 0 && visibleKeys.every(key => selectedParams.has(key));
    setSelectedParams(prev => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleKeys.forEach(key => next.delete(key));
      } else {
        visibleKeys.forEach(key => next.add(key));
      }
      return next;
    });
  }, [filteredParams, selectedParams, paramKey]);

  const toggleItem = useCallback((it: ItemLinea) => {
    const reselect = isCompensaciones && itemsCambianPorAnio && tabAnio > 1 && step === STEP_PARAMETROS;
    const setter = reselect
      ? (tabAnio === 2 ? setSelectedItemsY2 : setSelectedItemsY3)
      : setSelectedItems;
    setter(prev => {
      const next = new Set(prev);
      if (next.has(it.id)) next.delete(it.id); else next.add(it.id);
      return next;
    });
  }, [isCompensaciones, itemsCambianPorAnio, tabAnio, step, STEP_PARAMETROS]);

  const toggleAllItems = useCallback(() => {
    const reselect = isCompensaciones && itemsCambianPorAnio && tabAnio > 1 && step === STEP_PARAMETROS;
    const cur = reselect
      ? (tabAnio === 2 ? selectedItemsY2 : selectedItemsY3)
      : selectedItems;
    const setter = reselect
      ? (tabAnio === 2 ? setSelectedItemsY2 : setSelectedItemsY3)
      : setSelectedItems;
    if (cur.size === filteredItems.length && filteredItems.length > 0) {
      setter(new Set());
    } else {
      setter(new Set(filteredItems.map(it => it.id)));
    }
  }, [filteredItems, selectedItems, selectedItemsY2, selectedItemsY3, isCompensaciones, itemsCambianPorAnio, tabAnio, step, STEP_PARAMETROS]);

  const toggleLogistica = useCallback((log: ItemLinea) => {
    setSelectedLogistica(prev => {
      const next = new Set(prev);
      if (next.has(log.id)) next.delete(log.id); else next.add(log.id);
      return next;
    });
  }, []);

  const toggleMatriz = useCallback((m: string) => {
    const matrixRows = availableParams.filter(r => r.matriz === m);
    const matrixSelected = selectedMatrices.has(m);
    setSelectedMatrices(prev => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m); else next.add(m);
      return next;
    });
    if (matrixSelected && matrizDetalleActiva === m) {
      setMatrizDetalleActiva(null);
    }
    setSelectedParams(prev => {
      const next = new Set(prev);
      for (const row of matrixRows) {
        const key = paramKey(row);
        if (matrixSelected) next.delete(key);
        else next.add(key);
      }
      return next;
    });
  }, [availableParams, matrizDetalleActiva, paramKey, selectedMatrices]);

  const clearMatrices = useCallback(() => {
    setSelectedMatrices(new Set());
    setSelectedParams(new Set());
    setMatrizDetalleActiva(null);
  }, []);

  const updateParamPrice = useCallback((row: MonitoreoRow, newPrice: number) => {
    const key = paramKey(row);
    const preciosMensuales = Object.fromEntries(MESES.map((_, index) => [index, newPrice]));
    const updater = (r: MonitoreoRow) => paramKey(r) === key
      ? { ...r, chemilab: newPrice, preciosMensuales }
      : r;
    setAvailableParams(prev => prev.map(updater));
    setCustomMonitoreoRows(prev => prev.map(updater));
    setMonthlyData([]);
  }, [paramKey]);

  // Al confirmar (blur) el precio de un parámetro: si es admin y hay supabase,
  // persiste la tarifa en el catálogo y propaga el cambio a las planeaciones ya hechas.
  const commitTarifaParametro = useCallback((row: MonitoreoRow) => {
    if (!isMonitoreo || !isAdmin || !isSupabaseEnabled()) return;
    const key = paramKey(row);
    const current = availableParams.find(r => paramKey(r) === key) ?? row;
    const precio = current.chemilab || 0;
    if (precio <= 0) return;
    const categoria = categoriaDeMatriz(current.matriz);
    void (async () => {
      try {
        await TarifasParametrosService.upsertTarifa(categoria, current.parametro, precio);
        invalidateMonitoreosCache();
        const map = await TarifasParametrosService.getTarifaMap();
        await SupabaseService.propagarTarifas(map);
      } catch {
        // No bloquear la edición si falla la propagación.
      }
    })();
  }, [isMonitoreo, isAdmin, availableParams, paramKey]);

  const handleAddParametroStep3 = useCallback(() => {
    if (!selectedZona || !s3ParamNombre.trim()) return;

    const estacionValue = tipoLugar === 'Zona'
      ? (s3ParamEstacion || availableEstaciones[0] || '')
      : (selectedEstacion ?? '');

    if (!estacionValue) return;

    const row: MonitoreoRow = {
      zona: selectedZona,
      estacion: estacionValue,
      matriz: s3ParamMatriz,
      permiso: s3ParamPermiso.trim() || '-',
      receptor: s3ParamReceptor.trim() || '-',
      requerimiento: s3ParamRequerimiento.trim() || '-',
      norma: s3ParamNorma.trim() || '-',
      parametro: s3ParamNombre.trim(),
      chemilab: Number(s3ParamPrecio) || 0,
      puntos: 0,
      compuesto: 1,
    };

    setCustomMonitoreoRows(prev => [...prev, row]);
    setAvailableParams(prev => [...prev, row]);
    setAvailableMatrices(prev => prev.includes(row.matriz) ? prev : [...prev, row.matriz].sort());
    setSelectedMatrices(prev => prev.size > 0 ? new Set([...prev, row.matriz]) : prev);
    setSelectedParams(prev => new Set([...prev, paramKey(row)]));

    setAddingParamStep3(false);
    setS3ParamNombre('');
    setS3ParamNorma('');
    setS3ParamPermiso('');
    setS3ParamRequerimiento('');
    setS3ParamReceptor('');
    setS3ParamPrecio('');
    if (tipoLugar === 'Zona') setS3ParamEstacion('');
  }, [selectedZona, selectedEstacion, tipoLugar, s3ParamEstacion, s3ParamNombre, s3ParamMatriz, s3ParamNorma, s3ParamPermiso, s3ParamRequerimiento, s3ParamReceptor, s3ParamPrecio, availableEstaciones, paramKey]);

  // ── Helper: factor IPC por mes × IVA por ítem ──
  const computeFactor = useCallback((mesIndex: number, aplicaIva?: boolean) => {
    const ipcFactor = (ipcGlobalActivo && ipcMeses.has(mesIndex) && ipcGlobalPorcentaje > 0)
      ? (1 + (ipcGlobalPorcentaje / 100)) : 1;
    const ivaFactor = (ivaGlobalActivo && aplicaIva && ivaGlobalPorcentaje > 0)
      ? (1 + (ivaGlobalPorcentaje / 100)) : 1;
    return ipcFactor * ivaFactor;
  }, [ipcMeses, ipcGlobalActivo, ipcGlobalPorcentaje, ivaGlobalActivo, ivaGlobalPorcentaje]);

  const isPagoDiferidoItem = useCallback((itemKey: string) =>
    isPagosDiferidosDisponible
    && pagosDiferidosActivo
    && !isMonitoreo
    && !itemKey.startsWith('LOG-')
    && !itemKey.startsWith('MATRIZ|'),
  [isPagosDiferidosDisponible, pagosDiferidosActivo, isMonitoreo]);

  const calculateEntryTotal = useCallback((entry: PlaneacionMensualParam, mesIndex: number) => {
    const factor = computeFactor(mesIndex, entry.aplicaIva);
    if (isPagoDiferidoItem(entry.key)) {
      return entry.precio * (clampPct(entry.porcentajeDiferido ?? 0) / 100) * factor;
    }
    return entry.precio * entry.cantidad * entry.frecuencia * factor;
  }, [computeFactor, isPagoDiferidoItem]);

  // ── Monthly per-item update ──
  const updateItemMonth = useCallback((mesIndex: number, itemKey: string, field: 'cantidad' | 'frecuencia', value: number) => {
    setMonthlyData(prev => {
      const next = [...prev];
      const month = { ...next[mesIndex] };
      const list = [...month.preciosIndividuales];
      const idx = list.findIndex(p => p.key === itemKey);
      if (idx >= 0) {
        const entry = { ...list[idx], [field]: value };
        entry.total = calculateEntryTotal(entry, mesIndex);
        list[idx] = entry;
      }
      month.preciosIndividuales = list;
      month.total = list.reduce((s, p) => s + p.total, 0);
      next[mesIndex] = month;
      return next;
    });
  }, [calculateEntryTotal]);

  // ── ICAs: abrir desglose de un ítem (Consolidar / Radicación) ──
  const abrirDesgloseIca = useCallback((baseId: string) => {
    setIcasDesglosadoKeys(prev => new Set(prev).add(baseId));
  }, []);

  // ── ICAs: unir el desglose en un solo ítem ──
  // Captura las cantidades mensuales de Consolidar/Radicación para no perderlas
  // (se restauran si se vuelve a desglosar) y para derivar el dinero del ítem unido.
  const unirIca = useCallback((baseId: string) => {
    const cons = Array.from({ length: 12 }, (_, i) =>
      monthlyData[i]?.preciosIndividuales?.find(p => p.key === `${baseId}::CONSOLIDAR`)?.cantidad ?? 0);
    const rad = Array.from({ length: 12 }, (_, i) =>
      monthlyData[i]?.preciosIndividuales?.find(p => p.key === `${baseId}::RADICACION`)?.cantidad ?? 0);
    setIcasSplitData(sd => ({ ...sd, [baseId]: { cons, rad } }));
    setIcasDesglosadoKeys(prev => { const s = new Set(prev); s.delete(baseId); return s; });
  }, [monthlyData]);

  // ── Precio digitado por mes (línea Pagos): edita solo el mes indicado ──
  const updateItemMonthPrice = useCallback((mesIndex: number, itemKey: string, value: number) => {
    setMonthlyData(prev => {
      const next = [...prev];
      const month = { ...next[mesIndex] };
      const list = [...month.preciosIndividuales];
      const idx = list.findIndex(p => p.key === itemKey);
      if (idx >= 0) {
        const entry = { ...list[idx], precio: value, cantidad: 1, frecuencia: 1 };
        entry.total = calculateEntryTotal(entry, mesIndex);
        list[idx] = entry;
      }
      month.preciosIndividuales = list;
      month.total = list.reduce((s, p) => s + p.total, 0);
      next[mesIndex] = month;
      return next;
    });
  }, [calculateEntryTotal]);

  const updateItemPrice = useCallback((itemKey: string, newPrice: number) => {
    setMonthlyData(prev => prev.map((month, mi) => {
      const idx = month.preciosIndividuales.findIndex(p => p.key === itemKey);
      if (idx < 0) return month;
      const list = [...month.preciosIndividuales];
      const entry = { ...list[idx], precio: newPrice };
      entry.total = calculateEntryTotal(entry, mi);
      list[idx] = entry;
      return { ...month, preciosIndividuales: list, total: list.reduce((s, p) => s + p.total, 0) };
    }));
    // Persist to service
    if (isMonitoreo) {
      const row = availableParams.find(r => paramKey(r) === itemKey);
      if (row) {
        MESES.forEach((_, i) => MonitoreosMatrizService.updateChemilabMensual(row.zona, row.estacion, row.parametro, row.matriz, i, newPrice));
      }
    } else {
      MESES.forEach((_, i) => ItemsLineaService.updatePrecioMensual(itemKey, i, newPrice));
    }
  }, [isMonitoreo, availableParams, paramKey, calculateEntryTotal]);

  const updateItemIva = useCallback((itemKey: string, aplicaIva: boolean) => {
    if (aplicaIva) setIvaGlobalActivo(true);
    setMonthlyData(prev => prev.map((month, mi) => {
      const idx = month.preciosIndividuales.findIndex(p => p.key === itemKey);
      if (idx < 0) return month;
      const list = [...month.preciosIndividuales];
      const entry = { ...list[idx], aplicaIva };
      entry.total = calculateEntryTotal(entry, mi);
      list[idx] = entry;
      return { ...month, preciosIndividuales: list, total: list.reduce((s, p) => s + p.total, 0) };
    }));
  }, [calculateEntryTotal]);

  const updatePagoDiferidoConfig = useCallback((
    itemKey: string,
    updater: (current: PagoDiferidoItemConfig) => PagoDiferidoItemConfig,
  ) => {
    setPagosDiferidosWarning(null);
    setPagosDiferidosItems(prev => {
      const current = prev[itemKey] ?? {
        porcentajeAsignado: 0,
        mesesSeleccionados: [],
        porcentajesMensuales: {},
      };
      return { ...prev, [itemKey]: updater(current) };
    });
  }, []);

  const syncPagoDiferidoMonth = useCallback((itemKey: string, mesIndex: number, porcentaje: number) => {
    setMonthlyData(prev => prev.map((month, mi) => {
      if (mi !== mesIndex) return month;
      const idx = month.preciosIndividuales.findIndex(p => p.key === itemKey);
      if (idx < 0) return month;
      const list = [...month.preciosIndividuales];
      const entry = { ...list[idx], porcentajeDiferido: roundPct(clampPct(porcentaje)), cantidad: 0, frecuencia: 1 };
      entry.total = calculateEntryTotal(entry, mi);
      list[idx] = entry;
      return { ...month, preciosIndividuales: list, total: list.reduce((s, p) => s + p.total, 0) };
    }));
  }, [calculateEntryTotal]);

  const updatePagoDiferidoAsignado = useCallback((itemKey: string, value: number) => {
    updatePagoDiferidoConfig(itemKey, current => ({
      ...current,
      porcentajeAsignado: roundPct(clampPct(value)),
    }));
  }, [updatePagoDiferidoConfig]);

  const togglePagoDiferidoMes = useCallback((itemKey: string, mesIndex: number, checked: boolean) => {
    updatePagoDiferidoConfig(itemKey, current => {
      const meses = new Set(current.mesesSeleccionados);
      const porcentajes = { ...current.porcentajesMensuales };
      if (checked) {
        meses.add(mesIndex);
      } else {
        meses.delete(mesIndex);
        delete porcentajes[mesIndex];
        syncPagoDiferidoMonth(itemKey, mesIndex, 0);
      }
      return {
        ...current,
        mesesSeleccionados: [...meses].sort((a, b) => a - b),
        porcentajesMensuales: porcentajes,
      };
    });
  }, [syncPagoDiferidoMonth, updatePagoDiferidoConfig]);

  const updatePagoDiferidoMes = useCallback((itemKey: string, mesIndex: number, value: number) => {
    const porcentaje = roundPct(clampPct(value));
    updatePagoDiferidoConfig(itemKey, current => {
      const meses = new Set(current.mesesSeleccionados);
      if (porcentaje > 0) meses.add(mesIndex);
      return {
        ...current,
        mesesSeleccionados: [...meses].sort((a, b) => a - b),
        porcentajesMensuales: {
          ...current.porcentajesMensuales,
          [mesIndex]: porcentaje,
        },
      };
    });
    syncPagoDiferidoMonth(itemKey, mesIndex, porcentaje);
  }, [syncPagoDiferidoMonth, updatePagoDiferidoConfig]);

  const distribuirPagoDiferido = useCallback((itemKey: string) => {
    const config = pagosDiferidosItems[itemKey];
    const meses = config?.mesesSeleccionados ?? [];
    const porcentajeAsignado = config?.porcentajeAsignado ?? 0;
    if (meses.length === 0) {
      setPagosDiferidosWarning('Selecciona al menos un mes para diferir el pago de este ítem.');
      return;
    }
    if (porcentajeAsignado <= 0) {
      setPagosDiferidosWarning('Define primero el porcentaje asignado del ítem.');
      return;
    }

    const porcentajeMes = roundPct(porcentajeAsignado / meses.length);
    const porcentajesMensuales: Record<number, number> = {};
    meses.forEach(mesIndex => { porcentajesMensuales[mesIndex] = porcentajeMes; });

    setPagosDiferidosWarning(null);
    setPagosDiferidosItems(prev => ({
      ...prev,
      [itemKey]: {
        porcentajeAsignado,
        mesesSeleccionados: [...meses].sort((a, b) => a - b),
        porcentajesMensuales,
      },
    }));
    setMonthlyData(prev => prev.map((month, mi) => {
      const idx = month.preciosIndividuales.findIndex(p => p.key === itemKey);
      if (idx < 0) return month;
      const list = [...month.preciosIndividuales];
      const porcentajeDiferido = porcentajesMensuales[mi] ?? 0;
      const entry = { ...list[idx], porcentajeDiferido, cantidad: 0, frecuencia: 1 };
      entry.total = calculateEntryTotal(entry, mi);
      list[idx] = entry;
      return { ...month, preciosIndividuales: list, total: list.reduce((s, p) => s + p.total, 0) };
    }));
  }, [calculateEntryTotal, pagosDiferidosItems]);

  // ── Recalculate totals when IPC / IVA toggles change ──
  useEffect(() => {
    if (monthlyData.length === 0) return;
    setMonthlyData(prev => prev.map((month, mi) => {
      const list = month.preciosIndividuales.map(entry => ({
        ...entry,
        total: calculateEntryTotal(entry, mi),
      }));
      return { ...month, preciosIndividuales: list, total: list.reduce((s, p) => s + p.total, 0) };
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ipcMeses, ipcGlobalActivo, ipcGlobalPorcentaje, ivaGlobalActivo, ivaGlobalPorcentaje, pagosDiferidosActivo]);

  // ── Totals ──
  const valorTotalY1 = useMemo(() => monthlyData.reduce((s, m) => s + m.total, 0), [monthlyData]);
  const valorTotalY2 = useMemo(() => progY2.reduce((s, p) => s + p.total, 0), [progY2]);
  const valorTotalY3 = useMemo(() => progY3.reduce((s, p) => s + p.total, 0), [progY3]);
  const valorTotal = useMemo(() => {
    if (!isCompensaciones) return valorTotalY1;
    let total = valorTotalY1;
    if (aniosAPlanear >= 2) total += valorTotalY2;
    if (aniosAPlanear >= 3) total += valorTotalY3;
    return total;
  }, [isCompensaciones, aniosAPlanear, valorTotalY1, valorTotalY2, valorTotalY3]);

  const getPagoDiferidoProgramado = useCallback((itemKey: string) =>
    monthlyData.reduce((s, mes) => {
      const entry = mes.preciosIndividuales.find(p => p.key === itemKey);
      return s + (entry?.porcentajeDiferido ?? 0);
    }, 0),
  [monthlyData]);

  const pagosDiferidosErrores = useMemo(() => {
    if (!isPagosDiferidosDisponible || !pagosDiferidosActivo) return [];
    return (monthlyData[0]?.preciosIndividuales ?? [])
      .map(item => {
        const asignado = pagosDiferidosItems[item.key]?.porcentajeAsignado ?? 0;
        const programado = getPagoDiferidoProgramado(item.key);
        return {
          key: item.key,
          nombre: item.nombre,
          asignado,
          programado,
        };
      })
      .filter(item => item.programado > item.asignado + 0.0001);
  }, [getPagoDiferidoProgramado, isPagosDiferidosDisponible, monthlyData, pagosDiferidosActivo, pagosDiferidosItems]);

  // Compensaciones: validación de tope (no superar saldo asignado)
  const excedeTope = isCompensaciones && asignacionRecursos && saldoDisponible > 0 && valorTotal > saldoDisponible;
  const excedePagosDiferidos = pagosDiferidosErrores.length > 0;

  // Compensaciones: sincronizar Año 2 y Año 3.
  // - Si itemsCambianPorAnio=false → usa los mismos ítems del Año 1.
  // - Si itemsCambianPorAnio=true  → usa la selección propia del año (selectedItemsY2/Y3) tomando
  //   precio/nombre desde availableItems o desde monthlyData[0].
  useEffect(() => {
    if (!isCompensaciones) return;
    if (aniosAPlanear < 2) { setProgY2([]); return; }
    setProgY2(prev => {
      let items: { key: string; nombre: string; precio: number }[];
      if (itemsCambianPorAnio) {
        items = availableItems
          .filter(it => selectedItemsY2.has(it.id))
          .map(it => ({ key: it.id, nombre: it.item, precio: ItemsLineaService.getPrecioEfectivo(it, 0) }));
      } else {
        items = (monthlyData[0]?.preciosIndividuales ?? []).map(it => ({ key: it.key, nombre: it.nombre, precio: it.precio }));
      }
      return items.map(it => {
        const ex = prev.find(p => p.key === it.key);
        const cantidad = ex?.cantidad ?? 0;
        const precio = ex?.precio ?? it.precio;
        return { key: it.key, nombre: it.nombre, precio, cantidad, total: precio * cantidad };
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompensaciones, aniosAPlanear, monthlyData, itemsCambianPorAnio, selectedItemsY2, availableItems]);

  useEffect(() => {
    if (!isCompensaciones) return;
    if (aniosAPlanear < 3) { setProgY3([]); return; }
    setProgY3(prev => {
      let items: { key: string; nombre: string; precio: number }[];
      if (itemsCambianPorAnio) {
        items = availableItems
          .filter(it => selectedItemsY3.has(it.id))
          .map(it => ({ key: it.id, nombre: it.item, precio: ItemsLineaService.getPrecioEfectivo(it, 0) }));
      } else {
        items = (monthlyData[0]?.preciosIndividuales ?? []).map(it => ({ key: it.key, nombre: it.nombre, precio: it.precio }));
      }
      return items.map(it => {
        const ex = prev.find(p => p.key === it.key);
        const cantidad = ex?.cantidad ?? 0;
        const precio = ex?.precio ?? it.precio;
        return { key: it.key, nombre: it.nombre, precio, cantidad, total: precio * cantidad };
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompensaciones, aniosAPlanear, monthlyData, itemsCambianPorAnio, selectedItemsY3, availableItems]);

  // Cuando el usuario activa "ítems cambian por año", precargar Y2/Y3 con la selección del Año 1
  // (para que no empiece de cero, sólo modifique lo que cambia).
  useEffect(() => {
    if (!isCompensaciones || !itemsCambianPorAnio) return;
    if (selectedItemsY2.size === 0 && selectedItems.size > 0) {
      setSelectedItemsY2(new Set(selectedItems));
    }
    if (selectedItemsY3.size === 0 && selectedItems.size > 0) {
      setSelectedItemsY3(new Set(selectedItems));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompensaciones, itemsCambianPorAnio]);

  const updateProgYItem = useCallback((anio: 2 | 3, key: string, field: 'cantidad' | 'precio', value: number) => {
    const setter = anio === 2 ? setProgY2 : setProgY3;
    setter(prev => prev.map(p => {
      if (p.key !== key) return p;
      const next = { ...p, [field]: value };
      next.total = next.precio * next.cantidad;
      return next;
    }));
  }, []);

  // ── Navigation ──
  const canNext = (): boolean => {
    switch (step) {
      case 0: return !!selectedLinea;
      case 1: return !!selectedZona;
      case 2: {
        if (isCompensaciones) return true; // Sistema + Sector optional
        if (tipoLugar === 'Estación') return !!selectedEstacion;
        if (tipoLugar === 'Línea') return pk.trim().length > 0;
        return true; // 'Zona'
      }
      case 3: {
        if (isCompensaciones) return obligacionId.trim().length > 0; // ID obligación required
        return true; // Clasificación always valid
      }
      default: {
        if (step === STEP_CLASIFICACION) {
          // Compensaciones: contrato obligatorio (filtra los ítems del siguiente step)
          if (isCompensaciones && !contratoSeleccionado) return false;
          return true;
        }
        if (step === STEP_DATOS_AUXILIARES) {
          return datosAuxiliaresPresupuestales.contrato.trim().length > 0
            && datosAuxiliaresPresupuestales.proveedor.trim().length > 0;
        }
        if (step === STEP_PARAMETROS) {
          if (preserveNextProgramacionBuild && monthlyData.length > 0) return true;
          // Si estamos planeando Año 2/3 con itemsCambian, validar contra Y2/Y3
          if (isCompensaciones && itemsCambianPorAnio && tabAnio === 2) return selectedItemsY2.size > 0;
          if (isCompensaciones && itemsCambianPorAnio && tabAnio === 3) return selectedItemsY3.size > 0;
          return totalSelectedCount > 0;
        }
        if (step === STEP_PROGRAMACION) {
          // Compensaciones: bloquear si excede el saldo asignado (validación final)
          if (excedeTope) return false;
          if (excedePagosDiferidos) return false;
          // ICAs: obligar a unir el desglose antes de completar (para la plantilla financiera/interna)
          if (isIcas && icasDesglosadoKeys.size > 0) return false;
          return true;
        }
        return false;
      }
    }
  };

  // Compensaciones: ¿hay más años por planear después del actual?
  const hayMasAnios = isCompensaciones && tabAnio < aniosAPlanear;

  // Compensaciones: cuando el step Items se está usando para reseleccionar para Año 2/3,
  // el set efectivo es selectedItemsY2 / selectedItemsY3 en lugar de selectedItems.
  const isItemsReselect = isCompensaciones && itemsCambianPorAnio && tabAnio > 1 && step === STEP_PARAMETROS;
  const itemsSelSet = isItemsReselect
    ? (tabAnio === 2 ? selectedItemsY2 : selectedItemsY3)
    : selectedItems;
  const setItemsSelSet: (s: Set<string>) => void = isItemsReselect
    ? (tabAnio === 2 ? setSelectedItemsY2 : setSelectedItemsY3)
    : setSelectedItems;

  const handleNext = () => {
    if (!canNext()) return;

    // Caso especial: en STEP_PARAMETROS planeando Año 2/3 → saltar Clasificación e ir directo a Programación
    if (step === STEP_PARAMETROS && isCompensaciones && itemsCambianPorAnio && tabAnio > 1) {
      setStep(STEP_PROGRAMACION);
      return;
    }
    if (step < STEP_PROGRAMACION) {
      setStep(step + 1);
      return;
    }
    // step === STEP_PROGRAMACION
    // Caso multi-año: si quedan años por planear, avanzar al siguiente año
    if (hayMasAnios) {
      const next = (tabAnio + 1) as 1 | 2 | 3;
      setTabAnio(next);
      if (itemsCambianPorAnio) {
        // Regresar a Items para reseleccionar
        setStep(STEP_PARAMETROS);
      }
      // Si no, queda en Programación viendo el año siguiente (que hereda los ítems)
      return;
    }
    // Último año → Completar
    {
      // Complete
      const selRows = isMonitoreo ? availableParams.filter(r => selectedParams.has(paramKey(r))) : [];
      const selItems = !isMonitoreo ? availableItems.filter(it => selectedItems.has(it.id)) : [];
      const selLog = isMonitoreo ? ITEMS_LOGISTICA.filter(l => selectedLogistica.has(l.id)) : [];
      onComplete({
        lineaOperativa: selectedLinea!.value,
        zona: selectedZona!,
        tipoLugar,
        estacion: tipoLugar === 'Estación' ? selectedEstacion ?? undefined : undefined,
        pk: tipoLugar === 'Línea' ? pk : undefined,
        fuentePresupuesto,
        tipoPlaneacion,
        anioPlaneacion,
        datosAuxiliaresPresupuestales,
        parametrosSeleccionados: selRows,
        itemsSeleccionados: selItems,
        logisticaSeleccionada: selLog,
        selectedParamKeys: [...selectedParams],
        selectedItemIds: [...selectedItems],
        selectedLogisticaIds: [...selectedLogistica],
        selectedMatrices: [...selectedMatrices],
        customItems: customItemsMap[selectedLinea!.value] ?? [],
        customMonitoreoRows,
        programacion: monthlyData,
        valorTotal,
        paramTipoMuestra: Object.fromEntries(paramTipoMuestra),
        paramCantCompuestos: Object.fromEntries(paramCantCompuestos),
        paramPuntos: Object.fromEntries(paramPuntos),
        icasConsolidarPct,
        icasDesglosadoKeys: [...icasDesglosadoKeys],
        icasSplitData,
        ipcGlobalActivo,
        ipcGlobalPorcentaje,
        ipcMeses: [...ipcMeses],
        ivaGlobalActivo,
        ivaGlobalPorcentaje,
        ivaMeses: [...ivaMeses],
        ivaItemsExcluidos: ivaGlobalActivo
          ? (monthlyData[0]?.preciosIndividuales ?? [])
              .filter(item => !item.aplicaIva)
              .map(item => item.key)
          : [],
        pagosDiferidosActivo: isPagosDiferidosDisponible ? pagosDiferidosActivo : false,
        pagosDiferidosItems: isPagosDiferidosDisponible ? pagosDiferidosItems : undefined,
        ...(isCompensaciones && {
          sistema: selectedSistema || undefined,
          sector: selectedSector || undefined,
          obligacion: {
            id: obligacionId,
            fechaCreacion: obligacionFechaCreacion,
            actoAdministrativo: {
              tipo: obligacionActoTipo,
              numero: obligacionActoNumero,
              fecha: obligacionActoFecha,
            },
            permiso: obligacionPermiso,
            autoridad: obligacionAutoridad,
            jurisdiccion: {
              corporacion: obligacionJurisdiccionCorp,
              departamento: obligacionDepartamento,
              municipio: obligacionMunicipio,
              veredaPredio: obligacionVeredaPredio,
            },
            expediente: obligacionExpediente,
            categoria: obligacionCategoria,
          },
          asignacionRecursos,
          saldoDisponible: asignacionRecursos ? saldoDisponible : undefined,
          aniosAPlanear,
          contratoSeleccionado: contratoSeleccionado || undefined,
          programacionY2: aniosAPlanear >= 2 ? progY2 : undefined,
          programacionY3: aniosAPlanear >= 3 ? progY3 : undefined,
          itemsCambianPorAnio,
          selectedItemsY2: itemsCambianPorAnio && aniosAPlanear >= 2 ? [...selectedItemsY2] : undefined,
          selectedItemsY3: itemsCambianPorAnio && aniosAPlanear >= 3 ? [...selectedItemsY3] : undefined,
        }),
      });
    }
  };

  const handleBack = () => {
    // Caso especial: en STEP_PARAMETROS reseleccionando para Año 2/3 → regresar a Programación del año anterior
    if (isItemsReselect) {
      setTabAnio((tabAnio - 1) as 1 | 2 | 3);
      setStep(STEP_PROGRAMACION);
      return;
    }
    // Caso especial: en STEP_PROGRAMACION viendo Año 2/3 sin re-selección → retroceder un año
    if (step === STEP_PROGRAMACION && isCompensaciones && tabAnio > 1) {
      if (itemsCambianPorAnio) {
        // Volver a Items del año actual (donde se reseleccionó)
        setStep(STEP_PARAMETROS);
      } else {
        setTabAnio((tabAnio - 1) as 1 | 2 | 3);
      }
      return;
    }
    if (step > 0) setStep(step - 1);
  };

  const handleWizardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (addingItemStep3 || addingParamStep3 || shouldIgnoreWizardEnter(event)) return;
    event.preventDefault();
    handleNext();
  };

  useEffect(() => {
    if (!open || showExitConfirm) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (addingItemStep3 || addingParamStep3 || shouldIgnoreWizardEnterNative(event)) return;
      event.preventDefault();
      handleNext();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  });

  // ── Selection handlers with reset cascade ──
  const handleSelectLinea = useCallback((cfg: LineaPlaneacionConfig) => {
    if (isEditMode) return;
    setSelectedLinea(cfg);
    setTipoLugar(cfg.value === 'Servicios E' && cfg.lugarPorDefecto === 'Estación' ? 'Zona' : cfg.lugarPorDefecto);
    // Reset downstream
    setSelectedEstacion(null);
    setPk('');
    setSelectedParams(new Set());
    setSelectedItems(new Set());
    setSelectedMatrices(new Set());
    setMatrizDetalleActiva(null);
    setMonthlyData([]);
    setPagosDiferidosActivo(false);
    setPagosDiferidosItems({});
    setPagosDiferidosWarning(null);
  }, [isEditMode]);

  const handleSelectZona = useCallback((z: string) => {
    setSelectedZona(z);
    if (selectedLinea?.value === 'Servicios E' && z === 'Transversal') {
      setTipoLugar('Transversal');
    } else if (selectedLinea?.value === 'Servicios E' && tipoLugar === 'Transversal') {
      setTipoLugar('Zona');
    }
    setSelectedEstacion(null);
    setPk('');
    setSelectedParams(new Set());
    setSelectedItems(new Set());
    setSelectedMatrices(new Set());
    setMatrizDetalleActiva(null);
    setMonthlyData([]);
  }, [selectedLinea, tipoLugar]);

  const handleSelectEstacion = useCallback((e: string) => {
    setSelectedEstacion(e);
    setSelectedParams(new Set());
    setSelectedMatrices(new Set());
    setMonthlyData([]);
  }, []);

  // ── Ítems custom: temp form (Step 0) ──
  const handleAddTempItem = useCallback(() => {
    if (!tempItemNombre.trim()) return;
    setTempItems(prev => [...prev, {
      id: `TMPITEM-${Date.now()}`,
      nombre: tempItemNombre.trim(),
      unidad: tempItemUnidad,
      precio: parseCOPInput(tempItemPrecio),
    }]);
    setTempItemNombre('');
    setTempItemPrecio('');
  }, [tempItemNombre, tempItemUnidad, tempItemPrecio]);

  const handleRemoveTempItem = useCallback((id: string) => {
    setTempItems(prev => prev.filter(it => it.id !== id));
  }, []);

  // ── Crear línea custom ──
  const handleCreateLinea = useCallback(() => {
    if (!allowCustomLineas) return;
    if (!newLineaNombre.trim()) return;
    const cfg: LineaPlaneacionConfig = {
      value: newLineaNombre.trim().toLowerCase().replace(/\s+/g, '_') as LineaOperativa,
      label: newLineaNombre.trim(),
      icon: '📌',
      descripcion: newLineaDesc.trim() || newLineaNombre.trim(),
      usaMatriz: false,
      lugarPorDefecto: newLineaLugar,
      categoria: newLineaCategoria as LineaPlaneacionConfig['categoria'],
    };
    if (tempItems.length > 0) {
      const items: ItemLinea[] = tempItems.map(ti => ({
        id: `CUSTOM-${cfg.value}-${ti.id}`,
        lineaOperativa: cfg.value as LineaOperativa,
        item: ti.nombre,
        descripcion: ti.nombre,
        unidad: ti.unidad,
        precioReferencia: ti.precio,
      }));
      setCustomItemsMap(prev => ({ ...prev, [cfg.value]: items }));
    }
    setCustomLineas(prev => [...prev, cfg]);
    setCreandoLinea(false);
    setNewLineaNombre('');
    setNewLineaDesc('');
    setTempItems([]);
    setTempItemNombre('');
    setTempItemPrecio('');
    handleSelectLinea(cfg);
  }, [allowCustomLineas, newLineaNombre, newLineaDesc, newLineaCategoria, newLineaLugar, tempItems, handleSelectLinea]);

  const persistCatalogItem = useCallback(async (item: ItemLinea) => {
    try {
      const saved = await CatalogoItemsGlobalService.upsertItem(item, {
        zona: selectedZona ?? undefined,
        estacion: tipoLugar === 'Estación' ? selectedEstacion ?? undefined : undefined,
      });

      if (saved) {
        setAvailableItems(prev => ItemsLineaService.mergeItems(prev, [saved]));
        setCustomItemsMap(prev => {
          const current = prev[item.lineaOperativa] ?? [];
          if (!current.some(custom => custom.id === item.id)) return prev;
          return {
            ...prev,
            [item.lineaOperativa]: current.map(custom => custom.id === item.id ? { ...custom, ...saved } : custom),
          };
        });
      }
    } catch (error) {
      console.warn('No se pudo guardar el ítem en el catálogo global.', error);
      setCatalogWarning('El ítem quedó en esta planeación, pero no se pudo guardar en el catálogo global.');
    }
  }, [selectedEstacion, selectedZona, tipoLugar]);

  const persistCatalogPrice = useCallback(async (itemKey: string) => {
    if (!selectedLinea) return;
    const baseItem = availableItems.find(item => item.id === itemKey);
    const entries = monthlyData
      .map(month => ({
        mesIndex: month.mesIndex,
        entry: month.preciosIndividuales.find(entry => entry.key === itemKey),
      }))
      .filter((item): item is { mesIndex: number; entry: PlaneacionMensualParam } => !!item.entry);

    const firstEntry = entries[0]?.entry;
    if (!baseItem || !firstEntry) return;

    const preciosMensuales = Object.fromEntries(
      entries.map(({ mesIndex, entry }) => [mesIndex, entry.precio])
    ) as Record<number, number>;

    try {
      const saved = await CatalogoItemsGlobalService.upsertItem({
        ...baseItem,
        precioReferencia: firstEntry.precio,
        preciosMensuales,
      }, {
        zona: selectedZona ?? undefined,
        estacion: tipoLugar === 'Estación' ? selectedEstacion ?? undefined : undefined,
      });

      if (saved) {
        setAvailableItems(prev => ItemsLineaService.mergeItems(prev, [saved]));
      }
      setCatalogWarning('Esta tarifa aplicará para nuevas planeaciones; las actividades existentes no se recalculan.');
    } catch (error) {
      console.warn('No se pudo guardar la tarifa en el catálogo global.', error);
      setCatalogWarning('La tarifa se actualizó en esta planeación, pero no se pudo guardar en el catálogo global.');
    }
  }, [availableItems, monthlyData, selectedEstacion, selectedLinea, selectedZona, tipoLugar]);

  // ── Añadir ítem en Step 3 (cualquier línea) ──
  const handleAddItemStep3 = useCallback(() => {
    if (!s3Nombre.trim() || !selectedLinea) return;
    const item: ItemLinea = {
      id: `CUSTOM-${selectedLinea.value}-${Date.now()}`,
      lineaOperativa: selectedLinea.value as LineaOperativa,
      item: s3Nombre.trim(),
      descripcion: s3Nombre.trim(),
      unidad: s3Unidad,
      precioReferencia: parseCOPInput(s3Precio),
    };
    setCustomItemsMap(prev => ({
      ...prev,
      [selectedLinea.value]: [...(prev[selectedLinea.value] ?? []), item],
    }));
    setAvailableItems(prev => [...prev, item]);
    setSelectedItems(prev => new Set([...prev, item.id]));
    void persistCatalogItem(item);
    setAddingItemStep3(false);
    setS3Nombre('');
    setS3Precio('');
  }, [persistCatalogItem, s3Nombre, s3Unidad, s3Precio, selectedLinea]);

  // ── Eliminar ítem (no solo deseleccionar). Admin puede borrar del catálogo global. ──
  const handleDeleteItem = useCallback((item: ItemLinea) => {
    const esCatalogo = item.catalogSource === 'global';
    const msg = esCatalogo
      ? `¿Eliminar "${item.item}" del catálogo? Dejará de aparecer en nuevas planeaciones.`
      : `¿Eliminar "${item.item}" de esta planeación?`;
    if (typeof window !== 'undefined' && !window.confirm(msg)) return;

    setDeletedKeys(prev => new Set(prev).add(item.id));
    setSelectedItems(prev => { const s = new Set(prev); s.delete(item.id); return s; });
    setAvailableItems(prev => prev.filter(it => it.id !== item.id));
    if (selectedLinea) {
      setCustomItemsMap(prev => ({
        ...prev,
        [selectedLinea.value]: (prev[selectedLinea.value] ?? []).filter(it => it.id !== item.id),
      }));
    }
    if (esCatalogo && isAdmin) {
      void CatalogoItemsGlobalService.deleteItem(item.id, { zona: selectedZona ?? undefined })
        .catch(err => console.warn('No se pudo eliminar del catálogo global.', err));
    }
  }, [isAdmin, selectedLinea, selectedZona]);

  // ── Eliminar parámetro de monitoreo (no solo deseleccionar) ──
  const handleDeleteParam = useCallback((r: MonitoreoRow) => {
    const key = paramKey(r);
    if (typeof window !== 'undefined' && !window.confirm(`¿Eliminar el parámetro "${r.parametro}" de esta planeación?`)) return;
    setDeletedKeys(prev => new Set(prev).add(key));
    setSelectedParams(prev => { const s = new Set(prev); s.delete(key); return s; });
    setAvailableParams(prev => prev.filter(p => paramKey(p) !== key));
    setCustomMonitoreoRows(prev => prev.filter(p => paramKey(p) !== key));
  }, [paramKey]);

  // ── Eliminar VARIOS ítems seleccionados (los marcados con checkbox) ──
  const handleDeleteSelectedItems = useCallback(() => {
    const ids = [...itemsSelSet];
    if (!ids.length) return;
    if (typeof window !== 'undefined' && !window.confirm(`¿Eliminar ${ids.length} ítem(s) seleccionado(s)?`)) return;
    const idSet = new Set(ids);
    setDeletedKeys(prev => new Set([...prev, ...ids]));
    setItemsSelSet(new Set());
    setAvailableItems(prev => prev.filter(it => !idSet.has(it.id)));
    if (selectedLinea) {
      setCustomItemsMap(prev => ({
        ...prev,
        [selectedLinea.value]: (prev[selectedLinea.value] ?? []).filter(it => !idSet.has(it.id)),
      }));
    }
    if (isAdmin) {
      availableItems
        .filter(it => idSet.has(it.id) && it.catalogSource === 'global')
        .forEach(it => void CatalogoItemsGlobalService.deleteItem(it.id, { zona: selectedZona ?? undefined }).catch(() => {}));
    }
  }, [itemsSelSet, setItemsSelSet, selectedLinea, selectedZona, isAdmin, availableItems]);

  // ── Eliminar VARIOS parámetros seleccionados ──
  const handleDeleteSelectedParams = useCallback(() => {
    const keys = [...selectedParams];
    if (!keys.length) return;
    if (typeof window !== 'undefined' && !window.confirm(`¿Eliminar ${keys.length} parámetro(s) seleccionado(s)?`)) return;
    const keySet = new Set(keys);
    setDeletedKeys(prev => new Set([...prev, ...keys]));
    setSelectedParams(new Set());
    setAvailableParams(prev => prev.filter(p => !keySet.has(paramKey(p))));
    setCustomMonitoreoRows(prev => prev.filter(p => !keySet.has(paramKey(p))));
  }, [selectedParams, paramKey]);

  // ── Grupo de líneas por categoría ──
  const lineasPorCategoria = useMemo(() => {
    const all = [...lineasPlaneacionVisibles, ...(allowCustomLineas ? customLineas : [])];
    const map = new Map<string, LineaPlaneacionConfig[]>();
    for (const cat of CATEGORIAS_ORDEN) map.set(cat, []);
    for (const l of all) {
      const arr = map.get(l.categoria);
      if (arr) arr.push(l);
    }
    return map;
  }, [allowCustomLineas, customLineas, lineasPlaneacionVisibles]);

  const hasWizardProgress = useMemo(() => (
    step > 0 ||
    !!selectedLinea ||
    !!selectedZona ||
    !!selectedEstacion ||
    !!pk.trim() ||
    selectedMatrices.size > 0 ||
    selectedParams.size > 0 ||
    selectedItems.size > 0 ||
    monthlyData.some(m => m.total > 0) ||
    datosAuxiliaresPresupuestales.contrato.trim().length > 0 ||
    datosAuxiliaresPresupuestales.proveedor.trim().length > 0 ||
    obligacionId.trim().length > 0
  ), [
    datosAuxiliaresPresupuestales.contrato,
    datosAuxiliaresPresupuestales.proveedor,
    monthlyData,
    obligacionId,
    pk,
    selectedEstacion,
    selectedItems,
    selectedLinea,
    selectedMatrices,
    selectedParams,
    selectedZona,
    step,
  ]);

  const requestClose = useCallback(() => {
    if (hasWizardProgress) {
      setShowExitConfirm(true);
      return;
    }
    onClose();
  }, [hasWizardProgress, onClose]);

  const confirmExit = useCallback(() => {
    setShowExitConfirm(false);
    onClose();
  }, [onClose]);

  if (!open) return null;

  // ── Render ──
  return (
    <Portal>
      <div className={styles.overlay} onClick={requestClose}>
        <div className={styles.wizard} onClick={e => e.stopPropagation()} onKeyDown={handleWizardKeyDown}>
          {/* Header */}
          <div className={styles.wizardHeader}>
            <div className={styles.headerLeft}>
              <Title2 style={{ color: '#003057', fontWeight: 700 }}>
                {selectedLinea ? `Nueva — ${selectedLinea.label}` : 'Nueva Planeación'}
              </Title2>
              <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                {STEPS[step].label} — Paso {step + 1} de {STEPS.length}
              </Caption1>
            </div>
            <div className={styles.closeBtn} onClick={requestClose}><DismissRegular /></div>
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

            {/* ═══ Step 0: Línea Operativa ═══ */}
            {step === 0 && (
              <div>
                <Title3 style={{ color: '#003057', display: 'block', marginBottom: '4px' }}>Selecciona la línea operativa</Title3>
                <Caption1 style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
                  {isEditMode
                    ? 'La línea operativa se conserva para no convertir esta actividad en otra distinta. Puedes editar ubicación, clasificación, datos auxiliares, ítems y programación.'
                    : 'Define el tipo de actividad a planear. Cada línea tiene sus propios ítems y flujo.'}
                </Caption1>

                {[...lineasPorCategoria.entries()].map(([cat, items]) => items.length > 0 && (
                  <React.Fragment key={cat}>
                    <div className={styles.categoriaLabel}>{cat}</div>
                    <div className={styles.lineaGrid}>
                      {items.map(cfg => (
                        <div
                          key={cfg.value}
                          className={mergeClasses(
                            styles.lineaCard,
                            selectedLinea?.value === cfg.value && styles.lineaCardActive,
                            isEditMode && selectedLinea?.value !== cfg.value && styles.lineaCardDisabled,
                          )}
                          onClick={() => handleSelectLinea(cfg)}
                        >
                          <div className={styles.lineaIcon}>{cfg.icon}</div>
                          <div className={styles.lineaInfo}>
                            <Body2 style={{ fontWeight: '600', lineHeight: '1.3' }}>{cfg.label}</Body2>
                            <Caption1 style={{ color: tokens.colorNeutralForeground3, lineHeight: '1.3' }}>
                              {cfg.descripcion}
                            </Caption1>
                          </div>
                        </div>
                      ))}
                    </div>
                  </React.Fragment>
                ))}

                {/* Nueva línea inline */}
                {allowCustomLineas && !isEditMode && (!creandoLinea ? (
                  <div className={styles.addLineaCard} onClick={() => setCreandoLinea(true)}>
                    <AddRegular /> Nueva línea operativa
                  </div>
                ) : (
                  <div className={styles.newLineaOverlay}>
                    <Body2 style={{ fontWeight: '600', color: '#003057' }}>Crear línea operativa</Body2>
                    <div className={styles.newLineaRow}>
                      <div style={{ flex: 1, minWidth: '180px' }}>
                        <Caption1>Nombre *</Caption1>
                        <Input
                          value={newLineaNombre}
                          onChange={(_, d) => setNewLineaNombre(d.value)}
                          placeholder="Ej: Residuos Peligrosos"
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: '180px' }}>
                        <Caption1>Descripción</Caption1>
                        <Input
                          value={newLineaDesc}
                          onChange={(_, d) => setNewLineaDesc(d.value)}
                          placeholder="Breve descripción"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                    <div className={styles.newLineaRow}>
                      <div style={{ minWidth: '180px' }}>
                        <Caption1>Categoría</Caption1>
                        <select
                          value={newLineaCategoria}
                          onChange={e => setNewLineaCategoria(e.target.value)}
                          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
                        >
                          {CATEGORIAS_ORDEN.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div style={{ minWidth: '160px' }}>
                        <Caption1>Lugar por defecto</Caption1>
                        <select
                          value={newLineaLugar}
                          onChange={e => setNewLineaLugar(e.target.value as TipoLugar)}
                          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
                        >
                          {TIPOS_LUGAR.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                    </div>
                    {/* Ítems del contrato para esta línea */}
                    <div>
                      <Caption1 style={{ fontWeight: '700', color: '#003057', display: 'block', marginBottom: '6px' }}>
                        Ítems del contrato{' '}
                        <span style={{ fontWeight: '400', color: tokens.colorNeutralForeground3 }}>(opcional)</span>
                      </Caption1>
                      {tempItems.length > 0 && (
                        <div className={styles.tempItemsTableWrap}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                              <tr>
                                <th className={styles.paramTh}>Ítem</th>
                                <th className={styles.paramTh}>Unidad</th>
                                <th className={styles.paramTh}>Precio ref.</th>
                                <th className={styles.paramTh} style={{ width: '32px' }} />
                              </tr>
                            </thead>
                            <tbody>
                              {tempItems.map(it => (
                                <tr key={it.id} className={styles.paramTr}>
                                  <td className={styles.paramTd} style={{ fontWeight: '600' }}>{it.nombre}</td>
                                  <td className={styles.paramTd}>{it.unidad}</td>
                                  <td className={styles.paramTd}>{fmtCOP(it.precio)}</td>
                                  <td className={styles.paramTd}>
                                    <Button appearance="subtle" size="small" onClick={() => handleRemoveTempItem(it.id)}>✕</Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      <div className={styles.tempItemRow}>
                        <Input
                          value={tempItemNombre}
                          onChange={(_, d) => setTempItemNombre(d.value)}
                          placeholder="Nombre del ítem"
                          style={{ flex: 2, minWidth: '140px' }}
                        />
                        <select
                          value={tempItemUnidad}
                          onChange={e => setTempItemUnidad(e.target.value)}
                          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13px', minWidth: '90px' }}
                        >
                          {UNIDADES_CONTRATO.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                        <Input
                          value={tempItemPrecio}
                          onChange={(_, d) => setTempItemPrecio(formatCOPInput(d.value))}
                          placeholder="Precio COP"
                          style={{ flex: 1, minWidth: '100px' }}
                        />
                        <Button
                          appearance="primary"
                          size="small"
                          disabled={!tempItemNombre.trim()}
                          onClick={handleAddTempItem}
                          icon={<AddRegular />}
                        >
                          Añadir
                        </Button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <Button
                        appearance="primary"
                        disabled={!newLineaNombre.trim()}
                        onClick={handleCreateLinea}
                      >
                        Crear
                      </Button>
                      <Button appearance="subtle" onClick={() => { setCreandoLinea(false); setTempItems([]); setTempItemNombre(''); setTempItemPrecio(''); }}>Cancelar</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ═══ Step 1: Zona ═══ */}
            {step === 1 && (
              <div>
                <Title3 style={{ color: '#003057', display: 'block', marginBottom: '4px' }}>Selecciona la zona</Title3>
                <Caption1 style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
                  Zona geográfica para la planeación de {selectedLinea?.label}
                </Caption1>
                <div className={styles.selectionGrid}>
                  {zonasDisponiblesPaso.map(z => (
                    <div
                      key={z}
                      className={mergeClasses(styles.selectionCard, selectedZona === z && styles.selectionCardActive)}
                      onClick={() => handleSelectZona(z)}
                    >
                      <div className={mergeClasses(styles.selectionDot, selectedZona === z && styles.selectionDotActive)} />
                      <Body2 style={{ fontWeight: '600' }}>{z}</Body2>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ Step 2: Lugar ═══ */}
            {step === 2 && (
              <div>
                <Title3 style={{ color: '#003057', display: 'block', marginBottom: '4px' }}>Ubicación</Title3>

                {isCompensaciones ? (
                  <>
                    <Caption1 style={{ color: tokens.colorNeutralForeground3, display: 'block', marginBottom: '16px' }}>
                      Indica el sistema (oleoducto/poliducto) y el sector/proyecto donde aplica la compensación.
                    </Caption1>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', maxWidth: '560px' }}>
                      <div>
                        <Caption1 style={{ display: 'block', fontWeight: '600', color: '#003057', marginBottom: '4px' }}>Sistema</Caption1>
                        <select
                          value={selectedSistema}
                          onChange={e => setSelectedSistema(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px' }}
                        >
                          <option value="">Selecciona un sistema...</option>
                          {SISTEMAS_CENIT.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <Caption1 style={{ display: 'block', fontWeight: '600', color: '#003057', marginBottom: '4px' }}>Sector</Caption1>
                        <Input
                          placeholder="Ej: PK 70+100 Poliducto Puerto Salgar Cartago Yumbo"
                          value={selectedSector}
                          onChange={(_, d) => setSelectedSector(d.value)}
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <Caption1 style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
                      ¿La actividad aplica a una estación, una línea (PK) o a toda la zona <strong>{selectedZona}</strong>?
                    </Caption1>

                    {/* Tipo de lugar */}
                    <div className={styles.tipoLugarGrid}>
                      {tiposLugarDisponibles.map(tl => (
                        <div
                          key={tl.value}
                          className={mergeClasses(styles.tipoLugarCard, tipoLugar === tl.value && styles.tipoLugarCardActive)}
                          onClick={() => {
                            setTipoLugar(tl.value);
                            if (tl.value === 'Transversal') setSelectedZona('Transversal');
                            setSelectedEstacion(null);
                            setPk('');
                          }}
                        >
                          <Body2 style={{ fontWeight: '700' }}>{tl.label}</Body2>
                          <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>{tl.descripcion}</Caption1>
                        </div>
                      ))}
                    </div>

                    {/* Sub-selection based on tipo */}
                    {tipoLugar === 'Estación' && (
                      <>
                        <Caption1 style={{ color: '#003057', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                          Estaciones en {selectedZona}
                        </Caption1>
                        {availableEstaciones.length > 0 ? (
                          <div className={styles.selectionGrid}>
                            {availableEstaciones.map(e => (
                              <div
                                key={e}
                                className={mergeClasses(styles.selectionCard, selectedEstacion === e && styles.selectionCardActive)}
                                onClick={() => handleSelectEstacion(e)}
                              >
                                <div className={mergeClasses(styles.selectionDot, selectedEstacion === e && styles.selectionDotActive)} />
                                <Body2 style={{ fontWeight: '600' }}>{e}</Body2>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className={styles.infoBox}>
                            No hay estaciones registradas en la zona {selectedZona}.
                          </div>
                        )}
                      </>
                    )}

                    {tipoLugar === 'Línea' && (
                      <div className={styles.pkInput}>
                        <Caption1 style={{ color: '#003057', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                          Ingresa el PK de la línea
                        </Caption1>
                        <Input
                          placeholder="Ej: PK 120+500"
                          value={pk}
                          onChange={(_, d) => setPk(d.value)}
                          style={{ width: '100%' }}
                        />
                      </div>
                    )}

                    {tipoLugar === 'Zona' && (
                      <div className={styles.infoBox}>
                        La actividad aplica a toda la zona <strong>{selectedZona}</strong>. No es necesario seleccionar una estación.
                      </div>
                    )}

                    {tipoLugar === 'Transversal' && (
                      <div className={styles.infoBox}>
                        La actividad aplica de forma transversal. No es necesario seleccionar estación ni PK.
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ═══ Step 3 (Compensaciones only): Descripción ═══ */}
            {step === 3 && isCompensaciones && (
              <div style={{ maxWidth: '720px', margin: '0 auto' }}>
                <Title3 style={{ color: '#003057', display: 'block', marginBottom: '4px' }}>Descripción</Title3>
                <Caption1 style={{ color: tokens.colorNeutralForeground3, display: 'block', marginBottom: '20px' }}>
                  Registra los datos del acto administrativo y la compensación ambiental asociada.
                </Caption1>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px 24px', maxWidth: '720px', margin: '0 auto' }}>
                  {/* ID obligación */}
                  <div>
                    <Caption1 style={{ display: 'block', fontWeight: '700', color: '#003057', marginBottom: '4px' }}>
                      ID <span style={{ color: '#e00' }}>*</span>
                    </Caption1>
                    <Input
                      placeholder="Ej: COMP_01"
                      value={obligacionId}
                      onChange={(_, d) => setObligacionId(d.value)}
                      style={{ width: '100%' }}
                    />
                    <Caption1 style={{ color: tokens.colorNeutralForeground3, fontSize: '11px' }}>
                      Formato sugerido: COMP_## o INV_##
                    </Caption1>
                  </div>

                  {/* Fecha creación */}
                  <div>
                    <Caption1 style={{ display: 'block', fontWeight: '700', color: '#003057', marginBottom: '4px' }}>Fecha de creación</Caption1>
                    <Input
                      type="date"
                      value={obligacionFechaCreacion}
                      onChange={(_, d) => setObligacionFechaCreacion(d.value)}
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* Acto administrativo — span full width */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Caption1 style={{ display: 'block', fontWeight: '700', color: '#003057', marginBottom: '8px' }}>Acto administrativo</Caption1>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: '12px', alignItems: 'end' }}>
                      <div>
                        <Caption1 style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>Tipo</Caption1>
                        <select
                          value={obligacionActoTipo}
                          onChange={e => setObligacionActoTipo(e.target.value)}
                          style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px' }}
                        >
                          {TIPOS_ACTO.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <Caption1 style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>Número</Caption1>
                        <Input
                          placeholder="Ej: 1234"
                          value={obligacionActoNumero}
                          onChange={(_, d) => setObligacionActoNumero(d.value)}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <Caption1 style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>Fecha de expedición</Caption1>
                        <Input
                          type="date"
                          value={obligacionActoFecha}
                          onChange={(_, d) => setObligacionActoFecha(d.value)}
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Permiso */}
                  <div>
                    <Caption1 style={{ display: 'block', fontWeight: '700', color: '#003057', marginBottom: '4px' }}>Permiso que origina la obligación / Tipo de obligación</Caption1>
                    <select
                      value={obligacionPermiso}
                      onChange={e => setObligacionPermiso(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px' }}
                    >
                      <option value="">Selecciona...</option>
                      {TIPOS_PERMISO.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  {/* Autoridad ambiental */}
                  <div>
                    <Caption1 style={{ display: 'block', fontWeight: '700', color: '#003057', marginBottom: '4px' }}>Autoridad ambiental</Caption1>
                    <select
                      value={obligacionAutoridad}
                      onChange={e => setObligacionAutoridad(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px' }}
                    >
                      <option value="">Selecciona...</option>
                      {AUTORIDADES_AMBIENTALES.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>

                  {/* Jurisdicción — 4 campos separados (donde se ejecuta la compensación) */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Caption1 style={{ display: 'block', fontWeight: '700', color: '#003057', marginBottom: '8px' }}>
                      Jurisdicción (donde se ejecuta la compensación)
                    </Caption1>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                      <div>
                        <Caption1 style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>Corporación</Caption1>
                        <select
                          value={obligacionJurisdiccionCorp}
                          onChange={e => setObligacionJurisdiccionCorp(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px' }}
                        >
                          <option value="">Selecciona...</option>
                          {AUTORIDADES_AMBIENTALES.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </div>
                      <div>
                        <Caption1 style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>Departamento</Caption1>
                        <select
                          value={obligacionDepartamento}
                          onChange={e => {
                            setObligacionDepartamento(e.target.value);
                            // Si cambia depto, limpiar municipio y vereda
                            setObligacionMunicipio('');
                            setObligacionVeredaPredio('');
                          }}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px' }}
                        >
                          <option value="">Selecciona...</option>
                          {DEPARTAMENTOS_LIST.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <Caption1 style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>
                          Municipio
                          {obligacionDepartamento && (
                            <span style={{ color: tokens.colorNeutralForeground3, fontSize: '10px', marginLeft: '6px', fontWeight: 400 }}>
                              (sugerencias filtradas por {obligacionDepartamento})
                            </span>
                          )}
                        </Caption1>
                        <Combobox
                          freeform
                          placeholder={obligacionDepartamento ? 'Ej: Villeta — escribe o selecciona' : 'Selecciona un departamento primero'}
                          value={obligacionMunicipio}
                          selectedOptions={obligacionMunicipio ? [obligacionMunicipio] : []}
                          onInput={e => {
                            const v = (e.target as HTMLInputElement).value;
                            setObligacionMunicipio(v);
                            setObligacionVeredaPredio('');
                          }}
                          onOptionSelect={(_, d) => {
                            setObligacionMunicipio(d.optionValue ?? '');
                            setObligacionVeredaPredio('');
                          }}
                          style={{ width: '100%' }}
                        >
                          {(DEPARTAMENTOS_MUNICIPIOS[obligacionDepartamento] ?? []).map(m => (
                            <Option key={m} value={m}>{m}</Option>
                          ))}
                        </Combobox>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <Caption1 style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>Vereda / Predio</Caption1>
                        <Input
                          placeholder="Ej: Vda. La Palma — Predio El Jardín"
                          value={obligacionVeredaPredio}
                          onChange={(_, d) => setObligacionVeredaPredio(d.value)}
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expediente */}
                  <div>
                    <Caption1 style={{ display: 'block', fontWeight: '700', color: '#003057', marginBottom: '4px' }}>Número de expediente</Caption1>
                    <Input
                      placeholder="Ej: EXP-2024-001234"
                      value={obligacionExpediente}
                      onChange={(_, d) => setObligacionExpediente(d.value)}
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* Categoría */}
                  <div>
                    <Caption1 style={{ display: 'block', fontWeight: '700', color: '#003057', marginBottom: '4px' }}>Categoría</Caption1>
                    <select
                      value={obligacionCategoria}
                      onChange={e => setObligacionCategoria(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px' }}
                    >
                      <option value="">Selecciona...</option>
                      {CATEGORIAS_COMPENSACION.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ Parámetros / Ítems (step 4 non-comp, step 5 comp) ═══ */}
            {step === STEP_PARAMETROS && (
              <div>
                <Title3 style={{ color: '#003057', display: 'block', marginBottom: '4px' }}>
                  {isItemsReselect
                    ? `Selecciona ítems para el Año ${tabAnio} (${anioPlaneacion + (tabAnio - 1)})`
                    : isMonitoreo ? 'Selecciona matrices' : 'Selecciona ítems de pago'}
                </Title3>
                <Caption1 style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
                  {isItemsReselect
                    ? `Las actividades del Año ${tabAnio} son distintas a las del Año 1. Marca los ítems que aplican para el Año ${tabAnio}.`
                    : isMonitoreo
                      ? `Selecciona una o más matrices parametrizadas para ${selectedZona}${tipoLugar === 'Zona' ? ' — zona completa' : selectedEstacion ? ` — ${selectedEstacion}` : ''}`
                      : `Ítems de pago del contrato ${selectedLinea?.label} para ${selectedZona}`}
                </Caption1>
                {isItemsReselect && (
                  <div style={{ marginTop: '8px', marginBottom: '8px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(0,176,80,0.08)', border: '1px solid rgba(0,176,80,0.25)' }}>
                    <Caption1 style={{ color: '#003057', fontWeight: 600 }}>
                      🔁 Reselección para Año {tabAnio} — esta selección reemplaza la del año anterior solo para el Año {tabAnio}.
                    </Caption1>
                  </div>
                )}

                {/* Panel destacado de ajustes: IPC e IVA — visible en la parte superior */}
                <div className={styles.ajustesPanel}>
                  {selectedLinea?.value !== 'Hojas de Ruta Sostenibilidad Ambiental' && (
                    <div className={styles.ajustesGroup}>
                      <Checkbox
                        label="📈 Aplicar IPC"
                        checked={ipcGlobalActivo}
                        onChange={(_, d) => setIpcGlobalActivo(!!d.checked)}
                      />
                      {ipcGlobalActivo && (
                        <>
                          <Input
                            type="number"
                            size="small"
                            value={String(ipcGlobalPorcentaje || '')}
                            placeholder="%"
                            onChange={(_, d) => setIpcGlobalPorcentaje(Number(d.value) || 0)}
                            style={{ width: '70px' }}
                          />
                          <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>% (se marcan los meses en Programación)</Caption1>
                        </>
                      )}
                    </div>
                  )}
                  <div className={styles.ajustesGroup}>
                    <Checkbox
                      label="🧾 Aplicar IVA"
                      checked={ivaGlobalActivo}
                      onChange={(_, d) => setIvaGlobalActivo(!!d.checked)}
                    />
                    {ivaGlobalActivo && (
                      <>
                        <Input
                          type="number"
                          size="small"
                          value={String(ivaGlobalPorcentaje || '')}
                          placeholder="%"
                          onChange={(_, d) => setIvaGlobalPorcentaje(Number(d.value) || 0)}
                          style={{ width: '70px' }}
                        />
                        <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>% (se marca por ítem en Programación)</Caption1>
                      </>
                    )}
                  </div>
                </div>

                {/* Matrix selection (monitoreos only) */}
                {isMonitoreo && matrixSummaries.length > 0 && (
                  <>
                    <div className={styles.matrizFilterBar}>
                      {matrixSummaries.map(m => (
                        <span
                          key={m.matriz}
                          className={mergeClasses(styles.matrizChip, selectedMatrices.has(m.matriz) && styles.matrizChipActive)}
                          onClick={() => toggleMatriz(m.matriz)}
                          title={`${m.params} parámetros · ${m.estaciones.size} estación(es)`}
                        >
                          <span style={{ fontSize: '18px', lineHeight: 1.1 }}>{m.matriz}</span>
                          <span style={{ fontSize: '12px', fontWeight: 600, opacity: selectedMatrices.has(m.matriz) ? 0.92 : 0.68 }}>
                            {m.selected}/{m.params} parámetros
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 500, opacity: selectedMatrices.has(m.matriz) ? 0.82 : 0.58 }}>
                            {m.estaciones.size} estación{m.estaciones.size === 1 ? '' : 'es'}
                          </span>
                        </span>
                      ))}
                      {selectedMatrices.size > 0 && (
                        <span
                          className={styles.matrizChip}
                          style={{ fontStyle: 'italic', justifyContent: 'center', alignItems: 'center', minHeight: '96px' }}
                          onClick={clearMatrices}
                        >
                          Limpiar selección
                        </span>
                      )}
                    </div>
                    {selectedMatrices.size > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px', alignItems: 'center' }}>
                        <Caption1 style={{ color: tokens.colorNeutralForeground3, fontWeight: 700 }}>
                          Editar detalle:
                        </Caption1>
                        {[...selectedMatrices].sort().map(matriz => {
                          const summary = matrixSummaries.find(m => m.matriz === matriz);
                          return (
                            <Button
                              key={matriz}
                              size="small"
                              appearance={matrizDetalleActiva === matriz ? 'primary' : 'secondary'}
                              onClick={() => setMatrizDetalleActiva(prev => prev === matriz ? null : matriz)}
                              style={{ borderRadius: '999px' }}
                            >
                              {matriz} {summary ? `(${summary.selected}/${summary.params})` : ''}
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {/* Search bar */}
                <div className={styles.searchWrap} style={{ marginTop: isMonitoreo && matrixSummaries.length > 0 ? '4px' : '14px' }}>
                  <Input
                    placeholder={isMonitoreo ? 'Buscar dentro de matrices seleccionadas...' : 'Buscar ítem...'}
                    contentBefore={<SearchRegular />}
                    value={paramSearch}
                    onChange={(_, d) => setParamSearch(d.value)}
                    style={{ flex: 1, maxWidth: '400px' }}
                  />
                  <span className={styles.selectedCount} style={{ marginLeft: 'auto' }}>
                    {isMonitoreo
                      ? `${selectedMatrices.size} matrices · ${selectedParams.size} parámetros`
                      : `${totalSelectedCount} seleccionados`}
                  </span>
                  {isMonitoreo && selectedParams.size > 0 && (
                    <Button size="small" appearance="subtle" icon={<DeleteRegular />}
                      onClick={handleDeleteSelectedParams}
                      style={{ color: CENIT_COLORS.red, borderRadius: '8px' }}>
                      Eliminar seleccionados ({selectedParams.size})
                    </Button>
                  )}
                  {!isMonitoreo && itemsSelSet.size > 0 && (
                    <Button size="small" appearance="subtle" icon={<DeleteRegular />}
                      onClick={handleDeleteSelectedItems}
                      style={{ color: CENIT_COLORS.red, borderRadius: '8px' }}>
                      Eliminar seleccionados ({itemsSelSet.size})
                    </Button>
                  )}
                </div>

                {catalogWarning && (
                  <div style={{
                    marginTop: '10px',
                    marginBottom: '8px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(250, 173, 20, 0.12)',
                    color: '#7a4b00',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}>
                    {catalogWarning}
                  </div>
                )}

                {loading ? (
                  <div className={styles.spinnerWrap}><Spinner label="Cargando..." /></div>
                ) : isMonitoreo ? (
                  // ── Monitoreo params table ──
                  <>
                    {!matrizDetalleActiva ? (
                      <div className={styles.infoBox} style={{ marginTop: '12px' }}>
                        Selecciona una matriz y usa <strong>Editar detalle</strong> para revisar o ajustar sus parámetros. La selección de matriz ya incluye sus parámetros automáticamente.
                      </div>
                    ) : (
                    <div className={styles.paramTableWrap}>
                      <div style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                        <Body2 style={{ fontWeight: 700, color: '#003057' }}>
                          Editando matriz: {matrizDetalleActiva}
                        </Body2>
                        <Button size="small" appearance="subtle" onClick={() => setMatrizDetalleActiva(null)}>
                          Cerrar detalle
                        </Button>
                      </div>
                      <table className={styles.paramTable}>
                        <thead>
                          <tr>
                            <th className={styles.paramTh} style={{ width: '36px' }}>
                              <Checkbox
                                checked={
                                  filteredParams.length > 0 && filteredParams.every(r => selectedParams.has(paramKey(r)))
                                    ? true
                                    : filteredParams.some(r => selectedParams.has(paramKey(r)))
                                      ? 'mixed'
                                      : false
                                }
                                onChange={toggleAllParams}
                              />
                            </th>
                            {tipoLugar === 'Zona' && <th className={styles.paramTh}>Estación</th>}
                            <th className={styles.paramTh}>Parámetro</th>
                            <th className={styles.paramTh}>Matriz</th>
                            <th className={styles.paramTh}>Precio</th>
                            <th className={styles.paramTh}>Puntos</th>
                            <th className={styles.paramTh}>Tipo muestra</th>
                            <th className={styles.paramTh}>Compuestos</th>
                            <th className={styles.paramTh} style={{ width: '40px' }}></th>
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
                                <td className={styles.paramTd} onClick={e => e.stopPropagation()}>
                                  <Checkbox checked={sel} onChange={() => toggleParam(r)} />
                                </td>
                                {tipoLugar === 'Zona' && <td className={styles.paramTd} style={{ fontWeight: '600' }}>{r.estacion}</td>}
                                <td className={styles.paramTd} style={{ fontWeight: '600', maxWidth: '280px' }}>
                                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {r.parametro}
                                  </div>
                                  <Caption1
                                    title={[r.norma, r.permiso, r.receptor, r.requerimiento].filter(Boolean).join(' · ')}
                                    style={{ display: 'block', color: tokens.colorNeutralForeground3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '260px' }}
                                  >
                                    {[r.permiso, r.receptor].filter(Boolean).join(' · ') || r.norma}
                                  </Caption1>
                                </td>
                                <td className={styles.paramTd}>{r.matriz}</td>
                                <td className={styles.paramTd} onClick={e => e.stopPropagation()}>
                                  <Input
                                    inputMode="numeric"
                                    size="small"
                                    value={r.chemilab ? r.chemilab.toLocaleString('es-CO') : ''}
                                    placeholder="0"
                                    onChange={(_, d) => updateParamPrice(r, parseCOPInput(d.value))}
                                    onBlur={() => commitTarifaParametro(r)}
                                    style={{ width: '96px' }}
                                  />
                                </td>
                                <td className={styles.paramTd} onClick={e => e.stopPropagation()}>
                                  <Input
                                    type="number"
                                    size="small"
                                    min={1}
                                    value={String(paramPuntos.get(key) ?? (r.puntos || 1))}
                                    onChange={(_, d) => { const m = new Map(paramPuntos); m.set(key, Number(d.value) || 1); setParamPuntos(m); }}
                                    style={{ width: '64px' }}
                                  />
                                </td>
                                <td className={styles.paramTd} onClick={e => e.stopPropagation()}>
                                  <select
                                    value={paramTipoMuestra.get(key) || 'simple'}
                                    onChange={e => { const m = new Map(paramTipoMuestra); m.set(key, e.target.value as 'simple' | 'compuesto'); setParamTipoMuestra(m); }}
                                    style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px' }}
                                  >
                                    <option value="simple">Simple</option>
                                    <option value="compuesto">Compuesto</option>
                                  </select>
                                </td>
                                <td className={styles.paramTd} onClick={e => e.stopPropagation()}>
                                  {paramTipoMuestra.get(key) === 'compuesto' && (
                                    <Input
                                      type="number"
                                      size="small"
                                      value={String(paramCantCompuestos.get(key) || 1)}
                                      min={1}
                                      onChange={(_, d) => { const m = new Map(paramCantCompuestos); m.set(key, Number(d.value) || 1); setParamCantCompuestos(m); }}
                                      style={{ width: '60px' }}
                                    />
                                  )}
                                </td>
                                <td className={styles.paramTd} onClick={e => e.stopPropagation()}>
                                  <Tooltip content="Eliminar parámetro" relationship="label">
                                    <Button size="small" appearance="subtle" icon={<DeleteRegular />} onClick={() => handleDeleteParam(r)} aria-label="Eliminar parámetro" />
                                  </Tooltip>
                                </td>
                              </tr>
                            );
                          })}
                          {filteredParams.length === 0 && (
                            <tr>
                              <td className={styles.paramTd} colSpan={tipoLugar === 'Zona' ? 9 : 8} style={{ textAlign: 'center', padding: '32px', color: tokens.colorNeutralForeground3 }}>
                                {selectedMatrices.size === 0
                                  ? 'Selecciona una o más matrices para ver y editar sus parámetros.'
                                  : 'No se encontraron parámetros para las matrices seleccionadas.'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    )}

                    {!addingParamStep3 ? (
                      <div className={styles.addItemCard} onClick={() => { setAddingParamStep3(true); setS3ParamEstacion(selectedEstacion ?? availableEstaciones[0] ?? ''); }}>
                        <AddRegular /> Añadir parámetro
                      </div>
                    ) : (
                      <div className={styles.newLineaOverlay}>
                        <Body2 style={{ fontWeight: '600', color: '#003057' }}>Nuevo parámetro de monitoreo</Body2>
                        <div className={styles.newLineaRow}>
                          {tipoLugar === 'Zona' && (
                            <div style={{ minWidth: '180px' }}>
                              <Caption1>Estación *</Caption1>
                              <select
                                value={s3ParamEstacion}
                                onChange={e => setS3ParamEstacion(e.target.value)}
                                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
                              >
                                <option value="">Selecciona una estación</option>
                                {availableEstaciones.map(est => <option key={est} value={est}>{est}</option>)}
                              </select>
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: '180px' }}>
                            <Caption1>Parámetro *</Caption1>
                            <Input value={s3ParamNombre} onChange={(_, d) => setS3ParamNombre(d.value)} placeholder="Ej: DQO" style={{ width: '100%' }} />
                          </div>
                          <div style={{ minWidth: '160px' }}>
                            <Caption1>Matriz</Caption1>
                            <select
                              value={s3ParamMatriz}
                              onChange={e => setS3ParamMatriz(e.target.value)}
                              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
                            >
                              {[...new Set([...availableMatrices, ...MATRICES_AMBIENTALES.map(m => m.value)])].map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                          </div>
                          <div style={{ minWidth: '140px' }}>
                            <Caption1>Precio ref. (COP)</Caption1>
                            <Input value={s3ParamPrecio} onChange={(_, d) => setS3ParamPrecio(d.value)} placeholder="0" style={{ width: '100%' }} />
                          </div>
                        </div>
                        <div className={styles.newLineaRow}>
                          <div style={{ flex: 1, minWidth: '160px' }}>
                            <Caption1>Norma</Caption1>
                            <Input value={s3ParamNorma} onChange={(_, d) => setS3ParamNorma(d.value)} placeholder="Norma aplicable" style={{ width: '100%' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: '160px' }}>
                            <Caption1>Permiso</Caption1>
                            <Input value={s3ParamPermiso} onChange={(_, d) => setS3ParamPermiso(d.value)} placeholder="Permiso" style={{ width: '100%' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: '160px' }}>
                            <Caption1>Requerimiento</Caption1>
                            <Input value={s3ParamRequerimiento} onChange={(_, d) => setS3ParamRequerimiento(d.value)} placeholder="Requerimiento" style={{ width: '100%' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: '160px' }}>
                            <Caption1>Receptor</Caption1>
                            <Input value={s3ParamReceptor} onChange={(_, d) => setS3ParamReceptor(d.value)} placeholder="Receptor" style={{ width: '100%' }} />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Button
                            appearance="primary"
                            disabled={!s3ParamNombre.trim() || (tipoLugar === 'Zona' && !s3ParamEstacion)}
                            onClick={handleAddParametroStep3}
                          >
                            Agregar
                          </Button>
                          <Button
                            appearance="subtle"
                            onClick={() => {
                              setAddingParamStep3(false);
                              setS3ParamNombre('');
                              setS3ParamNorma('');
                              setS3ParamPermiso('');
                              setS3ParamRequerimiento('');
                              setS3ParamReceptor('');
                              setS3ParamPrecio('');
                              setS3ParamEstacion('');
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  // ── Non-monitoreo items table ──
                  <>
                  <div className={styles.paramTableWrap}>
                    <table className={styles.paramTable}>
                      <thead>
                        <tr>
                          <th className={styles.paramTh} style={{ width: '36px' }}>
                            <Checkbox
                              checked={itemsSelSet.size > 0 && itemsSelSet.size === filteredItems.length ? true : itemsSelSet.size > 0 ? 'mixed' : false}
                              onChange={toggleAllItems}
                            />
                          </th>
                          <th className={styles.paramTh}>Ítem</th>
                          <th className={styles.paramTh}>{isIcas ? 'Expediente / Año' : 'Descripción'}</th>
                          <th className={styles.paramTh}>Unidad</th>
                          {!isPrecioPorMes && <th className={styles.paramTh}>Precio Ref.</th>}
                          <th className={styles.paramTh} style={{ width: '40px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredItems.map(it => {
                          const sel = itemsSelSet.has(it.id);
                          return (
                            <tr
                              key={it.id}
                              className={mergeClasses(styles.paramTr, sel && styles.paramTrSelected)}
                              onClick={() => toggleItem(it)}
                            >
                              <td className={styles.paramTd} onClick={e => e.stopPropagation()}>
                                <Checkbox checked={sel} onChange={() => toggleItem(it)} />
                              </td>
                              <td className={styles.paramTd} style={{ fontWeight: '600' }}>{it.item}</td>
                              <td className={styles.paramTd} style={{ maxWidth: '260px' }}>
                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {it.descripcion}
                                </div>
                              </td>
                              <td className={styles.paramTd}>{it.unidad}</td>
                              {!isPrecioPorMes && <td className={styles.paramTd} style={{ fontWeight: '600' }}>{fmtCOP(it.precioReferencia)}</td>}
                              <td className={styles.paramTd} onClick={e => e.stopPropagation()}>
                                <Tooltip content={it.catalogSource === 'global' ? (isAdmin ? 'Eliminar del catálogo' : 'Quitar de la planeación') : 'Eliminar ítem'} relationship="label">
                                  <Button size="small" appearance="subtle" icon={<DeleteRegular />} onClick={() => handleDeleteItem(it)} aria-label="Eliminar ítem" />
                                </Tooltip>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredItems.length === 0 && (
                          <tr>
                            <td className={styles.paramTd} colSpan={6 - (isPrecioPorMes ? 1 : 0)} style={{ textAlign: 'center', padding: '32px', color: tokens.colorNeutralForeground3 }}>
                              {isCompensacionesProvisiones
                                ? 'Agrega ítems manualmente para esta provisión.'
                                : `No se encontraron ítems para ${selectedLinea?.label}`}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Añadir ítem inline */}
                  {!addingItemStep3 ? (
                    <div className={styles.addItemCard} onClick={() => setAddingItemStep3(true)}>
                      <AddRegular /> Añadir ítem
                    </div>
                  ) : (
                    <div className={styles.newLineaOverlay}>
                      <Body2 style={{ fontWeight: '600', color: '#003057' }}>Nuevo ítem</Body2>
                      <div className={styles.newLineaRow}>
                        <div style={{ flex: 2, minWidth: '160px' }}>
                          <Caption1>Nombre *</Caption1>
                          <Input value={s3Nombre} onChange={(_, d) => setS3Nombre(d.value)} placeholder="Nombre del ítem" style={{ width: '100%' }} />
                        </div>
                        <div style={{ minWidth: '120px' }}>
                          <Caption1>Unidad</Caption1>
                          <select value={s3Unidad} onChange={e => setS3Unidad(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}>
                            {UNIDADES_CONTRATO.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>
                        {!isPrecioPorMes && (
                          <div style={{ minWidth: '140px' }}>
                            <Caption1>Precio ref. (COP)</Caption1>
                            <Input value={s3Precio} onChange={(_, d) => setS3Precio(formatCOPInput(d.value))} placeholder="0" style={{ width: '100%' }} />
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button appearance="primary" disabled={!s3Nombre.trim()} onClick={handleAddItemStep3}>Agregar</Button>
                        <Button appearance="subtle" onClick={() => { setAddingItemStep3(false); setS3Nombre(''); setS3Precio(''); }}>Cancelar</Button>
                      </div>
                    </div>
                  )}
                  </>
                )}

                {/* Logística section — solo Monitoreos */}
                {isMonitoreo && <div className={styles.logisticaSection}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: selectedLogistica.size > 0 ? '10px' : '0' }}>
                    <Checkbox
                      checked={selectedLogistica.size === ITEMS_LOGISTICA.length ? true : selectedLogistica.size > 0 ? 'mixed' : false}
                      onChange={() => {
                        if (selectedLogistica.size > 0) {
                          setSelectedLogistica(new Set());
                        } else {
                          setSelectedLogistica(new Set(ITEMS_LOGISTICA.map(l => l.id)));
                        }
                      }}
                    />
                    <Caption1 style={{ fontWeight: '700', color: '#003057' }}>
                      🚐 Logística
                    </Caption1>
                    <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                      {selectedLogistica.size === 0 ? '(no incluida)' : `${selectedLogistica.size} de ${ITEMS_LOGISTICA.length} seleccionados`}
                    </Caption1>
                  </div>
                  {selectedLogistica.size > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {ITEMS_LOGISTICA.map(log => (
                        <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Checkbox
                            checked={selectedLogistica.has(log.id)}
                            onChange={() => toggleLogistica(log)}
                          />
                          <Body1 style={{ fontWeight: '600', fontSize: '13px' }}>{log.item}</Body1>
                          <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                            — {log.descripcion} · {fmtCOP(log.precioReferencia)}/{log.unidad}
                          </Caption1>
                        </div>
                      ))}
                    </div>
                  )}
                </div>}
              </div>
            )}

            {/* ═══ Clasificación (step 3 non-comp, step 4 comp) ═══ */}
            {step === STEP_CLASIFICACION && (
              <div>
                <Title3 style={{ color: '#003057', display: 'block', marginBottom: '4px' }}>Clasificación presupuestal</Title3>
                <Caption1 style={{ color: tokens.colorNeutralForeground3, display: 'block', marginBottom: '16px' }}>
                  {isCompensaciones
                    ? 'Define la fuente de presupuesto y el tipo de planeación.'
                    : 'Define la fuente de presupuesto, el tipo de planeación y el año a planear.'}
                </Caption1>

                {/* Fuente presupuesto */}
                <div className={styles.clasificacionGroup}>
                  <Body2 style={{ fontWeight: '700', color: '#003057' }}>Fuente de presupuesto</Body2>
                  <div className={styles.clasificacionCards}>
                    {FUENTES_PRESUPUESTO.map(fp => (
                      <div
                        key={fp.value}
                        className={mergeClasses(styles.clasificacionCard, fuentePresupuesto === fp.value && styles.clasificacionCardActive)}
                        onClick={() => setFuentePresupuesto(fp.value)}
                      >
                        <Body2 style={{ fontWeight: '700' }}>{fp.label}</Body2>
                        <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>{fp.descripcion}</Caption1>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tipo planeación */}
                <div className={styles.clasificacionGroup}>
                  <Body2 style={{ fontWeight: '700', color: '#003057' }}>Tipo de planeación</Body2>
                  <div className={styles.clasificacionCards}>
                    {TIPOS_PLANEACION.map(tp => (
                      <div
                        key={tp.value}
                        className={mergeClasses(styles.clasificacionCard, tipoPlaneacion === tp.value && styles.clasificacionCardActive)}
                        onClick={() => setTipoPlaneacion(tp.value)}
                      >
                        <Body2 style={{ fontWeight: '700' }}>{tp.label}</Body2>
                        <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>{tp.descripcion}</Caption1>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Año a planear (solo no-Compensaciones) */}
                {!isCompensaciones && (
                  <div className={styles.clasificacionGroup}>
                    <Body2 style={{ fontWeight: '700', color: '#003057' }}>Año a planear</Body2>
                    <div style={{ marginTop: '8px', maxWidth: '180px' }}>
                      <Input
                        type="number"
                        value={String(anioPlaneacion)}
                        onChange={(_, d) => setAnioPlaneacion(Number(d.value) || new Date().getFullYear() + 1)}
                        min={new Date().getFullYear()}
                        max={new Date().getFullYear() + 5}
                      />
                    </div>
                  </div>
                )}

                {isPagosDiferidosDisponible && (
                  <div className={styles.clasificacionGroup}>
                    <Body2 style={{ fontWeight: '700', color: '#003057' }}>Pagos diferidos</Body2>
                    <Caption1 style={{ color: tokens.colorNeutralForeground3, display: 'block', marginBottom: '8px' }}>
                      Activa esta opción si un ítem debe pagarse por porcentajes distribuidos entre varios meses.
                    </Caption1>
                    <div className={styles.clasificacionCards}>
                      <div
                        className={mergeClasses(styles.clasificacionCard, !pagosDiferidosActivo && styles.clasificacionCardActive)}
                        onClick={() => setPagosDiferidosActivo(false)}
                      >
                        <Body2 style={{ fontWeight: '700' }}>Programación normal</Body2>
                        <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                          Usa cantidad mensual como hasta ahora.
                        </Caption1>
                      </div>
                      <div
                        className={mergeClasses(styles.clasificacionCard, pagosDiferidosActivo && styles.clasificacionCardActive)}
                        onClick={() => setPagosDiferidosActivo(true)}
                      >
                        <Body2 style={{ fontWeight: '700' }}>Pagos diferidos</Body2>
                        <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                          Define % asignado por ítem y reparte el pago entre meses seleccionados.
                        </Caption1>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Compensaciones: Asignación de recursos / Años / Contrato ── */}
                {isCompensaciones && (
                  <>
                    {/* Asignación de recursos */}
                    <div className={styles.clasificacionGroup}>
                      <Body2 style={{ fontWeight: '700', color: '#003057' }}>¿Asignación de recursos?</Body2>
                      <Caption1 style={{ color: tokens.colorNeutralForeground3, display: 'block', marginBottom: '8px' }}>
                        Marca Sí si la obligación ya tiene un saldo asignado para no superarlo al planear.
                      </Caption1>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '6px' }}>
                        <div
                          className={mergeClasses(styles.clasificacionCard, asignacionRecursos && styles.clasificacionCardActive)}
                          style={{ minWidth: '90px', textAlign: 'center', cursor: 'pointer' }}
                          onClick={() => setAsignacionRecursos(true)}
                        >
                          <Body2 style={{ fontWeight: '700' }}>Sí</Body2>
                        </div>
                        <div
                          className={mergeClasses(styles.clasificacionCard, !asignacionRecursos && styles.clasificacionCardActive)}
                          style={{ minWidth: '90px', textAlign: 'center', cursor: 'pointer' }}
                          onClick={() => { setAsignacionRecursos(false); setSaldoDisponible(0); }}
                        >
                          <Body2 style={{ fontWeight: '700' }}>No</Body2>
                        </div>
                        {asignacionRecursos && (
                          <div style={{ marginLeft: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Caption1 style={{ fontWeight: '600' }}>Saldo disponible (COP):</Caption1>
                            <Input
                              inputMode="numeric"
                              value={saldoDisponible ? saldoDisponible.toLocaleString('es-CO') : ''}
                              placeholder="0"
                              onChange={(_, d) => setSaldoDisponible(parseCOPInput(d.value))}
                              style={{ width: '180px' }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Años a planear + Año base */}
                    <div className={styles.clasificacionGroup}>
                      <Body2 style={{ fontWeight: '700', color: '#003057' }}>Años a planear</Body2>
                      <Caption1 style={{ color: tokens.colorNeutralForeground3, display: 'block', marginBottom: '8px' }}>
                        Año 1 se planea mensualizado; Años 2 y 3 anualizados (cantidad × precio).
                      </Caption1>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                        <div>
                          <Caption1 style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>Cantidad de años</Caption1>
                          <select
                            value={String(aniosAPlanear)}
                            onChange={e => setAniosAPlanear(Number(e.target.value))}
                            style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px' }}
                          >
                            <option value="1">1 año</option>
                            <option value="2">2 años</option>
                            <option value="3">3 años</option>
                          </select>
                        </div>
                        <div>
                          <Caption1 style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>Año base (Año 1)</Caption1>
                          <Input
                            type="number"
                            value={String(anioPlaneacion)}
                            onChange={(_, d) => setAnioPlaneacion(Number(d.value) || new Date().getFullYear() + 1)}
                            min={new Date().getFullYear()}
                            max={new Date().getFullYear() + 5}
                            style={{ maxWidth: '140px' }}
                          />
                        </div>
                      </div>
                      {/* Checkbox: las actividades cambian por año */}
                      {aniosAPlanear > 1 && (
                        <div style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(0,51,160,0.04)' }}>
                          <Checkbox
                            label="Las actividades cambian entre años (siembra → mantenimiento)"
                            checked={itemsCambianPorAnio}
                            onChange={(_, d) => setItemsCambianPorAnio(!!d.checked)}
                          />
                          <Caption1 style={{ display: 'block', color: tokens.colorNeutralForeground3, marginTop: '4px', fontSize: '11px' }}>
                            {itemsCambianPorAnio
                              ? 'En Programación podrás reseleccionar ítems específicos para cada año (Año 2, Año 3).'
                              : 'Año 2 y Año 3 usarán los mismos ítems que el Año 1 (recomendado para mantenimientos similares).'}
                          </Caption1>
                        </div>
                      )}
                    </div>

                    {/* Contrato — obligatorio */}
                    <div className={styles.clasificacionGroup}>
                      <Body2 style={{ fontWeight: '700', color: '#003057' }}>
                        Contrato / Contratista <span style={{ color: '#e00' }}>*</span>
                      </Body2>
                      <Caption1 style={{ color: tokens.colorNeutralForeground3, display: 'block', marginBottom: '8px' }}>
                        Filtra los ítems disponibles según el contrato vigente para esta zona.
                      </Caption1>
                      <select
                        value={contratoSeleccionado}
                        onChange={e => setContratoSeleccionado(e.target.value)}
                        style={{
                          padding: '8px 10px', borderRadius: '8px',
                          border: contratoSeleccionado ? '1px solid #ccc' : '1px solid #e00',
                          fontSize: '14px', minWidth: '200px',
                        }}
                      >
                        <option value="">Selecciona un contrato...</option>
                        {CONTRATOS_COMPENSACIONES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ═══ Datos auxiliares presupuestales (OPEX y CAPEX) ═══ */}
            {step === STEP_DATOS_AUXILIARES && (
              <div style={{ maxWidth: '760px', margin: '0 auto' }}>
                <Title3 style={{ color: '#003057', display: 'block', marginBottom: '4px' }}>
                  Datos auxiliares presupuestales
                </Title3>
                <Caption1 style={{ color: tokens.colorNeutralForeground3, display: 'block', marginBottom: '20px' }}>
                  Completa la información contractual asociada a la planeación {fuentePresupuesto}.
                  Los campos marcados con * son obligatorios para continuar.
                </Caption1>
                <DatosAuxiliaresPresupuestalesForm
                  value={datosAuxiliaresPresupuestales}
                  onChange={setDatosAuxiliaresPresupuestales}
                />
              </div>
            )}

            {/* ═══ Programación Mensual ═══ */}
            {step === STEP_PROGRAMACION && (
              <div>
                <Title3 style={{ color: '#003057', display: 'block', marginBottom: '4px' }}>
                  {isCompensaciones && aniosAPlanear > 1
                    ? `Programación Multi-Año — Base ${anioPlaneacion}`
                    : `Programación Mensual — ${anioPlaneacion}`}
                </Title3>
                <Caption1 style={{ color: tokens.colorNeutralForeground3, display: 'block', marginBottom: '14px' }}>
                  {isMonitoreo
                    ? 'Ingresa la cantidad de monitoreos por matriz y mes.'
                    : 'Ingresa la cantidad por ítem y mes.'}
                  {' '}El total se calcula automáticamente.
                  {ipcGlobalActivo && ipcGlobalPorcentaje > 0 && (
                    <span style={{ display: 'block', marginTop: '4px', color: CENIT_COLORS.blueBrand, fontWeight: 600 }}>
                      💡 Marca los meses a partir de los cuales aplicar el ajuste de IPC (+{ipcGlobalPorcentaje}%). El precio de esos meses se multiplicará por {(1 + ipcGlobalPorcentaje / 100).toFixed(2)}.
                    </span>
                  )}
                  {ivaGlobalActivo && ivaGlobalPorcentaje > 0 && (
                    <span style={{ display: 'block', marginTop: '4px', color: CENIT_COLORS.green, fontWeight: 600 }}>
                      💡 Marca IVA en cada ítem o parámetro que lo requiera. El ajuste (+{ivaGlobalPorcentaje}%) aplica a todos los meses programados de esa fila.
                    </span>
                  )}
                  {isPagosDiferidosDisponible && pagosDiferidosActivo && (
                    <span style={{ display: 'block', marginTop: '4px', color: CENIT_COLORS.blueBrand, fontWeight: 600 }}>
                      💡 Para cada ítem define un % asignado, selecciona los meses y usa “Diferir pagos” para repartirlo.
                    </span>
                  )}
                </Caption1>

                {isMonitoreo && ivaGlobalActivo && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(0, 176, 80, 0.08)',
                    color: CENIT_COLORS.green,
                    fontSize: '12px',
                    fontWeight: 700,
                  }}>
                    <span>IVA por ítem/parámetro en programación</span>
                    <Input
                      type="number"
                      size="small"
                      value={String(ivaGlobalPorcentaje || '')}
                      placeholder="%"
                      onChange={(_, d) => {
                        setIvaGlobalPorcentaje(Number(d.value) || 0);
                        if (Number(d.value) > 0) setIvaGlobalActivo(true);
                      }}
                      style={{ width: '72px' }}
                    />
                    <span>%</span>
                  </div>
                )}

                {catalogWarning && (
                  <div style={{
                    marginBottom: '12px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(250, 173, 20, 0.12)',
                    color: '#7a4b00',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}>
                    {catalogWarning}
                  </div>
                )}

                {/* Indicador de progreso multi-año — solo Compensaciones con aniosAPlanear > 1 */}
                {isCompensaciones && aniosAPlanear > 1 && (
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', borderBottom: '2px solid rgba(0,0,0,0.06)' }}>
                    {[1, 2, 3].slice(0, aniosAPlanear).map(n => {
                      const totalAnio = n === 1 ? valorTotalY1 : n === 2 ? valorTotalY2 : valorTotalY3;
                      const active = tabAnio === n;
                      const done = tabAnio > n;
                      const pending = tabAnio < n;
                      return (
                        <div
                          key={n}
                          style={{
                            padding: '10px 18px',
                            borderRadius: '10px 10px 0 0',
                            background: active ? CENIT_COLORS.blueBrand : done ? 'rgba(0,176,80,0.1)' : 'rgba(0,0,0,0.04)',
                            color: active ? '#fff' : done ? CENIT_COLORS.green : '#94a3b8',
                            fontWeight: 700,
                            fontSize: '13px',
                            opacity: pending ? 0.6 : 1,
                            display: 'flex', flexDirection: 'column', gap: '2px',
                            cursor: 'default',
                            userSelect: 'none',
                          }}
                          title={pending ? 'Aún no llegas a este año' : done ? 'Año ya planeado' : 'Año actual'}
                        >
                          <span>
                            {done && '✓ '}Año {n} — {anioPlaneacion + (n - 1)}
                          </span>
                          <span style={{ fontSize: '10px', fontWeight: 500, opacity: 0.85 }}>
                            {n === 1 ? 'mensualizado' : 'anualizado'} · {fmtCOP(totalAnio)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Aviso de tope excedido (Compensaciones con asignaciónRecursos=Sí) */}
                {excedeTope && (
                  <div style={{
                    padding: '12px 16px', borderRadius: '10px',
                    background: 'rgba(232, 17, 35, 0.08)',
                    border: '1px solid rgba(232, 17, 35, 0.3)',
                    color: '#a4262c', fontSize: '13px', fontWeight: 600,
                    marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    ⚠️ El total planeado ({fmtCOP(valorTotal)}) excede el saldo disponible ({fmtCOP(saldoDisponible)}). Reduce cantidades para poder completar.
                  </div>
                )}

                {pagosDiferidosWarning && (
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(250, 173, 20, 0.12)',
                    border: '1px solid rgba(250, 173, 20, 0.28)',
                    color: '#7a4b00',
                    fontSize: '12px',
                    fontWeight: 600,
                    marginBottom: '12px',
                  }}>
                    {pagosDiferidosWarning}
                  </div>
                )}

                {excedePagosDiferidos && (
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(232, 17, 35, 0.08)',
                    border: '1px solid rgba(232, 17, 35, 0.3)',
                    color: '#a4262c',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '12px',
                  }}>
                    ⚠️ Hay pagos diferidos que superan el porcentaje asignado:{' '}
                    {pagosDiferidosErrores.map(err =>
                      `${err.nombre} (${fmtPct(err.programado)} de ${fmtPct(err.asignado)})`
                    ).join('; ')}. Ajusta los porcentajes mensuales para completar.
                  </div>
                )}

                {/* Año 2 / Año 3 — tabla anualizada (Compensaciones) */}
                {isCompensaciones && aniosAPlanear > 1 && (tabAnio === 2 || tabAnio === 3) && (
                  <div className={styles.progMatrixWrap}>
                    <table className={styles.progMatrixTable} style={{ minWidth: '600px' }}>
                      <thead>
                        <tr>
                          <th className={styles.progMatrixItemTh}>Ítem</th>
                          <th className={styles.progMatrixMonthTh} style={{ minWidth: '120px' }}>Precio unitario</th>
                          <th className={styles.progMatrixMonthTh} style={{ minWidth: '120px' }}>Cantidad</th>
                          <th className={styles.progMatrixTotalTh}>Total anual</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(tabAnio === 2 ? progY2 : progY3).map(it => (
                          <tr key={it.key} className={styles.progMatrixRow}>
                            <td className={styles.progMatrixItemTd}>
                              <div style={{ fontWeight: '600', color: '#003057', fontSize: '12px' }}>{it.nombre}</div>
                            </td>
                            <td className={styles.progMatrixMonthTd}>
                              <Input
                                inputMode="numeric"
                                size="small"
                                value={it.precio > 0 ? it.precio.toLocaleString('es-CO') : ''}
                                placeholder="0"
                                onChange={(_, d) => updateProgYItem(tabAnio as 2 | 3, it.key, 'precio', parseCOPInput(d.value))}
                                style={{ width: '100%' }}
                              />
                            </td>
                            <td className={styles.progMatrixMonthTd}>
                              <Input
                                type="number"
                                size="small"
                                value={it.cantidad > 0 ? String(it.cantidad) : ''}
                                placeholder="0"
                                onChange={(_, d) => updateProgYItem(tabAnio as 2 | 3, it.key, 'cantidad', Number(d.value) || 0)}
                                style={{ width: '100%' }}
                              />
                            </td>
                            <td className={styles.progMatrixTotalTd}>
                              {it.total > 0 ? fmtCOP(it.total) : '—'}
                            </td>
                          </tr>
                        ))}
                        <tr className={styles.progMatrixTotalesRow}>
                          <td className={styles.progMatrixItemTd} style={{ fontWeight: '700', color: '#003057', fontSize: '12px' }}>Total Año {tabAnio}</td>
                          <td className={styles.progMatrixMonthTd}></td>
                          <td className={styles.progMatrixMonthTd}></td>
                          <td className={styles.progMatrixTotalTd} style={{ fontWeight: '800', fontSize: '13px' }}>
                            {fmtCOP(tabAnio === 2 ? valorTotalY2 : valorTotalY3)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Año 1 / no-Compensaciones — versión móvil: acordeón por ítem */}
                {(!isCompensaciones || tabAnio === 1) && isMobile && (
                  <div className={styles.mobMatrixList}>
                    {ipcGlobalActivo && ipcGlobalPorcentaje > 0 && selectedLinea?.value !== 'Hojas de Ruta Sostenibilidad Ambiental' && (
                      <details className={styles.mobItemAcc}>
                        <summary className={styles.mobItemSummary}>
                          <span className={styles.mobItemName}>📈 Aplicar IPC (+{ipcGlobalPorcentaje}%) por mes</span>
                          <span className={styles.mobItemTotal} style={{ color: CENIT_COLORS.blueBrand }}>{ipcMeses.size}/12</span>
                        </summary>
                        <div className={styles.mobIpcGrid}>
                          {MESES_SHORT.map((m, i) => (
                            <Checkbox
                              key={m}
                              label={m}
                              checked={ipcMeses.has(i)}
                              onChange={() => { const s = new Set(ipcMeses); s.has(i) ? s.delete(i) : s.add(i); setIpcMeses(s); }}
                            />
                          ))}
                        </div>
                      </details>
                    )}

                    {(monthlyData[0]?.preciosIndividuales ?? []).map(item => {
                      const isLog = item.key.startsWith('LOG-');
                      const rowTotal = monthlyData.reduce((s, m) => {
                        const e = m.preciosIndividuales.find(p => p.key === item.key);
                        return s + (e?.total ?? 0);
                      }, 0);
                      const pagoDiferidoConfig = pagosDiferidosItems[item.key] ?? {
                        porcentajeAsignado: 0,
                        mesesSeleccionados: [],
                        porcentajesMensuales: {},
                      };
                      const pagoDiferidoProgramado = getPagoDiferidoProgramado(item.key);
                      const pagoDiferidoExcede = isPagosDiferidosDisponible
                        && pagosDiferidosActivo
                        && pagoDiferidoProgramado > pagoDiferidoConfig.porcentajeAsignado + 0.0001;

                      return (
                        <details key={item.key} className={styles.mobItemAcc}>
                          <summary className={styles.mobItemSummary}>
                            <span className={styles.mobItemName}>{isLog && '🚐 '}{item.nombre}</span>
                            <span
                              className={styles.mobItemTotal}
                              style={rowTotal > 0 ? { color: CENIT_COLORS.greenDark } : { color: 'rgba(0,0,0,0.35)', fontWeight: 500 }}
                            >
                              {rowTotal > 0 ? fmtCOP(rowTotal) : '—'}
                            </span>
                          </summary>
                          <div className={styles.mobItemBody}>
                            {/* Precio unitario (oculto: el precio se digita por mes) */}
                            {!isPrecioPorMes && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Caption1 style={{ color: tokens.colorNeutralForeground3, fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                                  Precio unitario
                                </Caption1>
                                <Input
                                  inputMode="numeric"
                                  size="small"
                                  readOnly={isIcas}
                                  value={item.precio > 0 ? item.precio.toLocaleString('es-CO') : ''}
                                  placeholder="0"
                                  onChange={(_, d) => updateItemPrice(item.key, parseCOPInput(d.value))}
                                  onBlur={() => { void persistCatalogPrice(item.key); }}
                                  style={{ flex: 1, minWidth: 0 }}
                                />
                              </div>
                            )}

                            {isIcas && !item.key.includes('::') && item.key.includes('-2026') && (
                              <Button size="small" appearance="primary" icon={<EditRegular />}
                                onClick={() => abrirDesgloseIca(item.key)}
                                style={{ borderRadius: '8px', alignSelf: 'flex-start', background: CENIT_COLORS.blueBrand }}>
                                Abrir desglose (2 ítems)
                              </Button>
                            )}
                            {isIcas && item.key.endsWith('::CONSOLIDAR') && (
                              <Button size="small" appearance="subtle" icon={<DismissRegular />}
                                onClick={() => unirIca(item.key.split('::')[0])}
                                style={{ borderRadius: '8px', alignSelf: 'flex-start' }}>
                                Unir en un ítem
                              </Button>
                            )}

                            {ivaGlobalActivo && ivaGlobalPorcentaje > 0 && (
                              <Checkbox
                                label={`IVA +${ivaGlobalPorcentaje}%`}
                                checked={!!item.aplicaIva}
                                onChange={(_, d) => updateItemIva(item.key, !!d.checked)}
                              />
                            )}

                            {isPagosDiferidosDisponible && pagosDiferidosActivo && (
                              <div style={{
                                display: 'flex', flexDirection: 'column', gap: '6px',
                                padding: '8px', borderRadius: '8px',
                                background: pagoDiferidoExcede ? 'rgba(232,17,35,0.08)' : 'rgba(0,51,160,0.04)',
                                border: pagoDiferidoExcede ? '1px solid rgba(232,17,35,0.22)' : '1px solid rgba(0,51,160,0.12)',
                              }}>
                                <Caption1 style={{ color: tokens.colorNeutralForeground3, fontSize: '10px', fontWeight: 700 }}>% asignado</Caption1>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                  <Input
                                    type="number"
                                    size="small"
                                    min={0}
                                    max={100}
                                    value={pagoDiferidoConfig.porcentajeAsignado > 0 ? String(pagoDiferidoConfig.porcentajeAsignado) : ''}
                                    placeholder="0"
                                    onChange={(_, d) => updatePagoDiferidoAsignado(item.key, Number(d.value) || 0)}
                                    style={{ width: '72px' }}
                                  />
                                  <span style={{ fontSize: '11px', color: tokens.colorNeutralForeground3 }}>%</span>
                                  <Button size="small" appearance="secondary" onClick={() => distribuirPagoDiferido(item.key)} style={{ borderRadius: '8px' }}>
                                    Diferir pagos
                                  </Button>
                                </div>
                                <Caption1 style={{
                                  fontSize: '10px',
                                  color: pagoDiferidoExcede ? '#a4262c' : tokens.colorNeutralForeground3,
                                  fontWeight: pagoDiferidoExcede ? 700 : 500,
                                }}>
                                  Programado {fmtPct(pagoDiferidoProgramado)} de {fmtPct(pagoDiferidoConfig.porcentajeAsignado)}
                                </Caption1>
                              </div>
                            )}

                            {/* Meses */}
                            <div>
                              {monthlyData.map((month, mi) => {
                                const entry = month.preciosIndividuales.find(p => p.key === item.key);
                                if (!entry) return null;
                                const mesDiferidoSeleccionado = pagoDiferidoConfig.mesesSeleccionados.includes(mi)
                                  || (entry.porcentajeDiferido ?? 0) > 0;
                                return (
                                  <div key={mi} className={styles.mobMonthRow}>
                                    <span className={styles.mobMonthLabel}>{MESES_SHORT[mi]}</span>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', minWidth: 0 }}>
                                      {isPagosDiferidosDisponible && pagosDiferidosActivo ? (
                                        <>
                                          <Checkbox
                                            checked={mesDiferidoSeleccionado}
                                            onChange={(_, d) => togglePagoDiferidoMes(item.key, mi, !!d.checked)}
                                          />
                                          <Input
                                            type="number"
                                            size="small"
                                            min={0}
                                            max={100}
                                            value={(entry.porcentajeDiferido ?? 0) > 0 ? String(entry.porcentajeDiferido) : ''}
                                            placeholder="%"
                                            disabled={!mesDiferidoSeleccionado}
                                            onChange={(_, d) => updatePagoDiferidoMes(item.key, mi, Number(d.value) || 0)}
                                            style={{ flex: 1, minWidth: 0 }}
                                          />
                                        </>
                                      ) : isPrecioPorMes ? (
                                        <Input
                                          inputMode="numeric"
                                          size="small"
                                          value={entry.precio > 0 ? entry.precio.toLocaleString('es-CO') : ''}
                                          placeholder="$ del mes"
                                          onChange={(_, d) => updateItemMonthPrice(mi, item.key, parseCOPInput(d.value))}
                                          style={{ flex: 1, minWidth: 0 }}
                                        />
                                      ) : (
                                        <CantidadInput
                                          value={entry.cantidad}
                                          onCommit={(n) => updateItemMonth(mi, item.key, 'cantidad', n)}
                                          style={{ flex: 1, minWidth: 0 }}
                                        />
                                      )}
                                      {isMonitoreo && !isLog && !item.key.startsWith('MATRIZ|') && (
                                        <Input
                                          type="number"
                                          size="small"
                                          value={entry.frecuencia > 0 ? String(entry.frecuencia) : ''}
                                          placeholder="Comp"
                                          onChange={(_, d) => updateItemMonth(mi, item.key, 'frecuencia', Number(d.value) || 0)}
                                          style={{ flex: 1, minWidth: 0 }}
                                        />
                                      )}
                                    </div>
                                    <span className={styles.mobMonthTotal}>
                                      {entry.total > 0 ? fmtCOP(entry.total) : '—'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </details>
                      );
                    })}
                  </div>
                )}

                {/* Año 1 / no-Compensaciones — tabla mensualizada (la existente) */}
                {(!isCompensaciones || tabAnio === 1) && !isMobile && (
                <>
                <div
                  ref={topScrollRef}
                  className={styles.progTopScroll}
                  onScroll={() => syncScroll('top')}
                >
                  <div style={{ width: progScrollWidth || '100%', height: '1px' }} />
                </div>
                <div
                  ref={progScrollRef}
                  className={styles.progMatrixWrap}
                  onScroll={() => syncScroll('table')}
                >
                  <table className={styles.progMatrixTable}>
                    <thead>
                      <tr>
                        <th className={styles.progMatrixItemTh}>Ítem / Parámetro</th>
                        {MESES_SHORT.map(m => (
                          <th key={m} className={styles.progMatrixMonthTh}>{m}</th>
                        ))}
                        <th className={styles.progMatrixTotalTh}>Total anual</th>
                      </tr>
                      {/* IPC per-month toggle row — solo visible si IPC global está activo */}
                      {ipcGlobalActivo && ipcGlobalPorcentaje > 0 && selectedLinea?.value !== 'Hojas de Ruta Sostenibilidad Ambiental' && (
                        <tr>
                          <th className={styles.progMatrixIpcThItem} title={`Marca los meses donde aplicar +${ipcGlobalPorcentaje}% de IPC`}>
                            📈 Aplicar IPC (+{ipcGlobalPorcentaje}%) →
                          </th>
                          {MESES_SHORT.map((_, i) => (
                            <th key={i} className={styles.progMatrixIpcTh}>
                              <Checkbox
                                checked={ipcMeses.has(i)}
                                onChange={() => { const s = new Set(ipcMeses); s.has(i) ? s.delete(i) : s.add(i); setIpcMeses(s); }}
                              />
                            </th>
                          ))}
                          <th className={styles.progMatrixIpcTh}></th>
                        </tr>
                      )}
                    </thead>
                    <tbody>
                      {(monthlyData[0]?.preciosIndividuales ?? []).map(item => {
                        const isLog = item.key.startsWith('LOG-');
                        const rowTotal = monthlyData.reduce((s, m) => {
                          const e = m.preciosIndividuales.find(p => p.key === item.key);
                          return s + (e?.total ?? 0);
                        }, 0);
                        const pagoDiferidoConfig = pagosDiferidosItems[item.key] ?? {
                          porcentajeAsignado: 0,
                          mesesSeleccionados: [],
                          porcentajesMensuales: {},
                        };
                        const pagoDiferidoProgramado = getPagoDiferidoProgramado(item.key);
                        const pagoDiferidoExcede = isPagosDiferidosDisponible
                          && pagosDiferidosActivo
                          && pagoDiferidoProgramado > pagoDiferidoConfig.porcentajeAsignado + 0.0001;
                        return (
                          <tr key={item.key} className={isLog ? styles.progMatrixLogRow : styles.progMatrixRow}>
                            {/* Item name + editable unit price */}
                            <td className={styles.progMatrixItemTd}>
                              <div style={{ fontWeight: '600', color: '#003057', marginBottom: '4px', fontSize: '12px', lineHeight: '1.3' }}>
                                {isLog && <span style={{ marginRight: '4px', fontSize: '10px' }}>🚐</span>}
                                {item.nombre}
                              </div>
                              {isIcas && !item.key.includes('::') && item.key.includes('-2026') && (
                                <Button size="small" appearance="primary" icon={<EditRegular />}
                                  onClick={() => abrirDesgloseIca(item.key)}
                                  style={{ marginBottom: '4px', borderRadius: '8px', background: CENIT_COLORS.blueBrand }}>
                                  Abrir desglose (2 ítems)
                                </Button>
                              )}
                              {isIcas && item.key.endsWith('::CONSOLIDAR') && (
                                <Button size="small" appearance="subtle" icon={<DismissRegular />}
                                  onClick={() => unirIca(item.key.split('::')[0])}
                                  style={{ marginBottom: '4px', borderRadius: '8px' }}>
                                  Unir en un ítem
                                </Button>
                              )}
                              {!isPrecioPorMes && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Caption1 style={{ color: tokens.colorNeutralForeground3, fontSize: '10px', whiteSpace: 'nowrap' }}>$/u:</Caption1>
                                  <Input
                                    inputMode="numeric"
                                    size="small"
                                    readOnly={isIcas}
                                    value={item.precio > 0 ? item.precio.toLocaleString('es-CO') : ''}
                                    placeholder="0"
                                    onChange={(_, d) => updateItemPrice(item.key, parseCOPInput(d.value))}
                                    onBlur={() => { void persistCatalogPrice(item.key); }}
                                    style={{ width: '90px' }}
                                  />
                                </div>
                              )}
                              {isPagosDiferidosDisponible && pagosDiferidosActivo && (
                                <div style={{
                                  marginTop: '6px',
                                  display: 'grid',
                                  gridTemplateColumns: '1fr',
                                  gap: '4px',
                                  padding: '8px',
                                  borderRadius: '8px',
                                  background: pagoDiferidoExcede ? 'rgba(232,17,35,0.08)' : 'rgba(0,51,160,0.04)',
                                  border: pagoDiferidoExcede ? '1px solid rgba(232,17,35,0.22)' : '1px solid rgba(0,51,160,0.12)',
                                }}>
                                  <Caption1 style={{ color: tokens.colorNeutralForeground3, fontSize: '10px', fontWeight: 700 }}>
                                    % asignado
                                  </Caption1>
                                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                    <Input
                                      type="number"
                                      size="small"
                                      min={0}
                                      max={100}
                                      value={pagoDiferidoConfig.porcentajeAsignado > 0 ? String(pagoDiferidoConfig.porcentajeAsignado) : ''}
                                      placeholder="0"
                                      onChange={(_, d) => updatePagoDiferidoAsignado(item.key, Number(d.value) || 0)}
                                      style={{ width: '72px' }}
                                    />
                                    <span style={{ fontSize: '11px', color: tokens.colorNeutralForeground3 }}>%</span>
                                    <Button
                                      size="small"
                                      appearance="secondary"
                                      onClick={() => distribuirPagoDiferido(item.key)}
                                      style={{ minWidth: '96px', borderRadius: '8px' }}
                                    >
                                      Diferir pagos
                                    </Button>
                                  </div>
                                  <Caption1 style={{
                                    fontSize: '10px',
                                    color: pagoDiferidoExcede ? '#a4262c' : tokens.colorNeutralForeground3,
                                    fontWeight: pagoDiferidoExcede ? 700 : 500,
                                  }}>
                                    Programado {fmtPct(pagoDiferidoProgramado)} de {fmtPct(pagoDiferidoConfig.porcentajeAsignado)}
                                  </Caption1>
                                </div>
                              )}
                              {ivaGlobalActivo && ivaGlobalPorcentaje > 0 && (
                                <div style={{ marginTop: '4px' }}>
                                  <Checkbox
                                    label={`IVA +${ivaGlobalPorcentaje}%`}
                                    checked={!!item.aplicaIva}
                                    onChange={(_, d) => updateItemIva(item.key, !!d.checked)}
                                  />
                                </div>
                              )}
                            </td>
                            {/* Month cells */}
                            {monthlyData.map((month, mi) => {
                              const entry = month.preciosIndividuales.find(p => p.key === item.key);
                              if (!entry) return <td key={mi} className={styles.progMatrixMonthTd}>—</td>;
                              const mesDiferidoSeleccionado = pagoDiferidoConfig.mesesSeleccionados.includes(mi)
                                || (entry.porcentajeDiferido ?? 0) > 0;
                              return (
                                <td key={mi} className={styles.progMatrixMonthTd}>
                                  {isPagosDiferidosDisponible && pagosDiferidosActivo ? (
                                    <>
                                      <Checkbox
                                        checked={mesDiferidoSeleccionado}
                                        onChange={(_, d) => togglePagoDiferidoMes(item.key, mi, !!d.checked)}
                                      />
                                      <Input
                                        type="number"
                                        size="small"
                                        min={0}
                                        max={100}
                                        value={(entry.porcentajeDiferido ?? 0) > 0 ? String(entry.porcentajeDiferido) : ''}
                                        placeholder="%"
                                        disabled={!mesDiferidoSeleccionado}
                                        onChange={(_, d) => updatePagoDiferidoMes(item.key, mi, Number(d.value) || 0)}
                                        style={{ width: '100%', minWidth: 0, marginTop: '2px' }}
                                      />
                                    </>
                                  ) : isPrecioPorMes ? (
                                    <Input
                                      inputMode="numeric"
                                      size="small"
                                      value={entry.precio > 0 ? entry.precio.toLocaleString('es-CO') : ''}
                                      placeholder="$ mes"
                                      onChange={(_, d) => updateItemMonthPrice(mi, item.key, parseCOPInput(d.value))}
                                      style={{ width: '100%', minWidth: 0 }}
                                    />
                                  ) : (
                                    <CantidadInput
                                      value={entry.cantidad}
                                      onCommit={(n) => updateItemMonth(mi, item.key, 'cantidad', n)}
                                      style={{ width: '100%', minWidth: 0 }}
                                    />
                                  )}
                                  {isMonitoreo && !isLog && !item.key.startsWith('MATRIZ|') && (
                                    <Input
                                      type="number"
                                      size="small"
                                      value={entry.frecuencia > 0 ? String(entry.frecuencia) : ''}
                                      placeholder="Comp"
                                      onChange={(_, d) => updateItemMonth(mi, item.key, 'frecuencia', Number(d.value) || 0)}
                                      style={{ width: '100%', minWidth: 0, marginTop: '2px' }}
                                    />
                                  )}
                                  {isPagosDiferidosDisponible && pagosDiferidosActivo && (entry.porcentajeDiferido ?? 0) > 0 && (
                                    <Caption1 style={{ fontSize: '10px', color: tokens.colorNeutralForeground3, display: 'block', marginTop: '2px', textAlign: 'right' }}>
                                      {fmtPct(entry.porcentajeDiferido ?? 0)}
                                    </Caption1>
                                  )}
                                  {entry.total > 0 && (
                                    <Caption1 style={{ fontSize: '10px', color: CENIT_COLORS.blueBrand, display: 'block', marginTop: '2px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                      {fmtCOP(entry.total)}
                                    </Caption1>
                                  )}
                                </td>
                              );
                            })}
                            {/* Row total */}
                            <td className={styles.progMatrixTotalTd}>
                              {rowTotal > 0 ? fmtCOP(rowTotal) : '—'}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Totals row */}
                      <tr className={styles.progMatrixTotalesRow}>
                        <td className={styles.progMatrixItemTd} style={{ fontWeight: '700', color: '#003057', fontSize: '12px' }}>
                          Total mensual
                        </td>
                        {monthlyData.map((m, mi) => (
                          <td key={mi} className={styles.progMatrixMonthTd} style={{ fontWeight: '700', color: '#003057', fontSize: '12px', verticalAlign: 'middle', padding: '8px 4px' }}>
                            {m.total > 0 ? fmtCOP(m.total) : '—'}
                          </td>
                        ))}
                        <td className={styles.progMatrixTotalTd} style={{ fontWeight: '800', fontSize: '13px' }}>
                          {fmtCOP(valorTotalY1)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                </>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={styles.wizardFooter}>
            <div className={styles.footerTotals}>
              {step === STEP_PROGRAMACION && isIcas && icasDesglosadoKeys.size > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a4262c', fontWeight: 600, fontSize: '12px', marginRight: '8px' }}>
                  ⚠️ Une los ítems de ICAs ("Unir en un ítem") para poder completar.
                </div>
              )}
              {step === STEP_PROGRAMACION && (
                <>
                  <div className={styles.footerTotal}>
                    <Caption1 style={{ fontWeight: '600', color: tokens.colorNeutralForeground3 }}>VALOR TOTAL</Caption1>
                    <span style={{ fontSize: '20px', fontWeight: '800', color: '#003057' }}>{fmtCOP(valorTotal)}</span>
                  </div>
                  <div className={styles.footerTotal}>
                    <Caption1 style={{ fontWeight: '600', color: tokens.colorNeutralForeground3 }}>MESES CON DATOS</Caption1>
                    <span style={{ fontSize: '15px', fontWeight: '700', color: CENIT_COLORS.blueBrand }}>
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
                icon={step === STEP_PROGRAMACION && !hayMasAnios ? <CheckmarkRegular /> : <ArrowRightRegular />}
                iconPosition="after"
                onClick={handleNext}
                disabled={!canNext()}
                style={{ borderRadius: '12px', paddingLeft: '20px', paddingRight: '20px' }}
              >
                {step === STEP_PROGRAMACION
                  ? (hayMasAnios ? `Siguiente año (Año ${tabAnio + 1})` : 'Completar')
                  : 'Siguiente'}
              </Button>
            </div>
          </div>

          {showExitConfirm && (
            <div className={styles.exitConfirmBackdrop} onClick={e => e.stopPropagation()}>
              <div className={styles.exitConfirmCard}>
                <div className={styles.exitConfirmIcon}>!</div>
                <Title3 style={{ color: '#003057', margin: 0 }}>
                  Cuidado, podrías perder tu progreso
                </Title3>
                <Body1 style={{ color: tokens.colorNeutralForeground2, lineHeight: 1.5 }}>
                  Le diste a salir del wizard. ¿Estás seguro de salir? Si sales ahora, perderás el progreso que no hayas guardado.
                </Body1>
                <div className={styles.exitConfirmActions}>
                  <Button appearance="secondary" onClick={() => setShowExitConfirm(false)}>
                    Seguir editando
                  </Button>
                  <Button appearance="primary" onClick={confirmExit} style={{ background: '#a4262c' }}>
                    Salir y perder progreso
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </Portal>
  );
};
