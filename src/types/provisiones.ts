// ============================================================
// Tipos del dominio - PROVISIONES AMBIENTALES (GREENLOG)
// Modelo basado en Matriz Provisiones, Compensaciones y PxQ
// ============================================================

// ── Navegación ──────────────────────────────────────────────
export type SeccionProvisiones = 'dashboard' | 'obligaciones' | 'compensaciones' | 'pxq' | 'seguimiento';

// ── Enums / Union Types ─────────────────────────────────────
export type EstadoProvision =
  | 'Notificada'
  | 'ID Generado'
  | 'En Estimación'
  | 'Solicitud Enviada'
  | 'En Revisión Operaciones'
  | 'Recursos Asignados'
  | 'En Ejecución'
  | 'En Facturación'
  | 'Cerrada';

export type EstadoCompensacion =
  | 'Sin iniciar'
  | 'En ejecución'
  | 'Establecimiento'
  | 'Mantenimiento'
  | 'Cerrada';

export type TipoObligacion =
  | 'Compensación Forestal'
  | 'Inversión 1%'
  | 'Compensación Biótica'
  | 'Compensación Abiótica'
  | 'Ocupación Cauce'
  | 'Plan de Manejo';

export type CategoriaCompensacion =
  | 'Restauración'
  | 'Reforestación'
  | 'Conservación'
  | 'PSA'
  | 'Uso Sostenible'
  | 'Infraestructura';

export type TipoCuentaProvision = 'OPEX' | 'CAPEX';

export type NivelRiesgo = 'Alto' | 'Medio' | 'Bajo';

// ── Interfaces principales ──────────────────────────────────

/** Provisión ambiental - entidad central (Matriz Provisiones) */
export interface Provision {
  id: string;                           // COMP_XXX
  tipoObligacion: TipoObligacion;
  estadoAvance: EstadoProvision;
  zona: string;
  sistema: string;
  troncal: string;
  responsable: string;
  // Legal
  autoridadAmbiental: string;
  jurisdiccionCAR: string;
  numeroExpediente: string;
  actoAdministrativo: {
    tipo: string;
    numero: string;
    fecha: string;
  };
  departamento: string;
  municipio: string;
  // Compensación
  medidaCompensacion: string;
  categoria: CategoriaCompensacion;
  // Financiero
  tipoCuenta: TipoCuentaProvision;
  contrato: string;
  ods: string;
  solped: string;
  valorProvisionTotal: number;
  usoProvisionTotal: number;
  saldoProvision: number;
  anioConstitucion: number;
  // Proyecciones
  valorProvisionAnual: Record<number, number>;
  usoProvisionAnual: Record<number, number>;
  usoProyectado: Record<number, number>;
  costosAdminMensuales: number[];       // 12 meses
  // Metadata
  creadoEn?: string;
  actualizadoEn?: string;
}

/** Compensación ambiental - seguimiento físico (Matriz Compensación) */
export interface Compensacion {
  id: string;
  provisionId: string;
  zona: string;
  responsable: string;
  descripcionObligacion: string;
  medidaCompensacion: string;
  categoria: CategoriaCompensacion;
  areaPlaneadoHa: number;
  areaEjecutadoHa: number;
  cantidadArboles: number;
  fechaInicio: string;
  periodoDuracion: number;              // años
  fechaTerminacion: string;
  estado: EstadoCompensacion;
  departamento: string;
  municipio: string;
  vereda: string;
  informesMantenimiento: InformeMantenimiento[];
  riesgoReal: NivelRiesgo;
  planAccion: string;
  prioritaria: boolean;
  observaciones: string;
  creadoEn?: string;
  actualizadoEn?: string;
}

export interface InformeMantenimiento {
  numero: number;                       // 1–15
  fecha?: string;
  estado?: 'Aprobado' | 'Pendiente' | 'En revisión';
}

/** Ítem PxQ - detalle de costos por actividad */
export interface ItemPxQ {
  id: string;
  provisionId: string;
  sth: string;
  zona: string;
  municipio: string;
  itemContrato: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  valorUnitario: number;
  totalAnual: Record<number, number>;
  solped: string;
  posicion: string;
}

// ── Payloads ────────────────────────────────────────────────
export type NuevaProvisionPayload = Omit<Provision, 'id' | 'creadoEn' | 'actualizadoEn'>;
export type NuevaCompensacionPayload = Omit<Compensacion, 'id' | 'creadoEn' | 'actualizadoEn'>;

// ── Constantes ──────────────────────────────────────────────

export const ESTADOS_PROVISION: { value: EstadoProvision; label: string }[] = [
  { value: 'Notificada',                label: 'Notificada' },
  { value: 'ID Generado',               label: 'ID Generado' },
  { value: 'En Estimación',             label: 'En Estimación' },
  { value: 'Solicitud Enviada',         label: 'Solicitud Enviada' },
  { value: 'En Revisión Operaciones',   label: 'En Revisión Operaciones' },
  { value: 'Recursos Asignados',        label: 'Recursos Asignados' },
  { value: 'En Ejecución',              label: 'En Ejecución' },
  { value: 'En Facturación',            label: 'En Facturación' },
  { value: 'Cerrada',                   label: 'Cerrada' },
];

export const ESTADOS_COMPENSACION: { value: EstadoCompensacion; label: string }[] = [
  { value: 'Sin iniciar',      label: 'Sin Iniciar' },
  { value: 'En ejecución',     label: 'En Ejecución' },
  { value: 'Establecimiento',  label: 'Establecimiento' },
  { value: 'Mantenimiento',    label: 'Mantenimiento' },
  { value: 'Cerrada',          label: 'Cerrada' },
];

export const TIPOS_OBLIGACION: { value: TipoObligacion; label: string }[] = [
  { value: 'Compensación Forestal',   label: 'Compensación Forestal' },
  { value: 'Inversión 1%',            label: 'Inversión 1%' },
  { value: 'Compensación Biótica',    label: 'Compensación Biótica' },
  { value: 'Compensación Abiótica',   label: 'Compensación Abiótica' },
  { value: 'Ocupación Cauce',         label: 'Ocupación de Cauce' },
  { value: 'Plan de Manejo',          label: 'Plan de Manejo' },
];

export const CATEGORIAS_COMPENSACION: { value: CategoriaCompensacion; label: string }[] = [
  { value: 'Restauración',     label: 'Restauración' },
  { value: 'Reforestación',    label: 'Reforestación' },
  { value: 'Conservación',     label: 'Conservación' },
  { value: 'PSA',              label: 'PSA (Pago por Servicios Ambientales)' },
  { value: 'Uso Sostenible',   label: 'Uso Sostenible' },
  { value: 'Infraestructura',  label: 'Infraestructura' },
];

export const NIVELES_RIESGO: { value: NivelRiesgo; label: string }[] = [
  { value: 'Alto',  label: 'Alto' },
  { value: 'Medio', label: 'Medio' },
  { value: 'Bajo',  label: 'Bajo' },
];

/** Breadcrumbs para navegación del shell */
export const BREADCRUMBS_PROVISIONES: Record<SeccionProvisiones, string> = {
  dashboard: 'Dashboard',
  obligaciones: 'Registro de Obligaciones',
  compensaciones: 'Compensaciones',
  pxq: 'PxQ / Estimaciones',
  seguimiento: 'Seguimiento y Balance',
};
