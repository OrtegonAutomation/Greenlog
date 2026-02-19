// ============================================================
// Tipos del dominio - CENIT (GREENLOG)
// Sistema de Control Ambiental - Power Apps Code App
// ============================================================

export type EstadoActividad   = 'Planeada' | 'En Ejecución' | 'Cerrada' | 'Pendiente Aprobación';
export type Prioridad         = 'Alta' | 'Media' | 'Baja';
export type TipoActividad     = 'Monitoreo' | 'Auditoría' | 'Mantenimiento' | 'Inspección' | 'Capacitación' | 'Otro';
export type EstadoAprobacion  = 'Pendiente' | 'Aprobado' | 'Rechazado';
export type SeccionApp        = 'dashboard' | 'planeacion' | 'ejecucion' | 'reportes';

export interface ActividadAmbiental {
  id: string;
  tarea: string;
  tipo: TipoActividad;
  descripcion?: string;
  responsable: string;
  fechaInicio: string;
  fechaFin: string;
  fechaInicioReal?: string;
  fechaFinReal?: string;
  ubicacionZona: string;
  estado: EstadoActividad;
  prioridad: Prioridad;
  cumplimientoNormativo?: string;
  novedades?: string;
  porcentajeAvance: number;
  estadoAprobacion: EstadoAprobacion;
  aprobadoPor?: string;
  fechaAprobacion?: string;
  creadoEn?: string;
  actualizadoEn?: string;
}

export type NuevaActividadPayload = Omit<ActividadAmbiental, 'id' | 'creadoEn' | 'actualizadoEn'>;

export const FORM_INICIAL: NuevaActividadPayload = {
  tarea: '',
  tipo: 'Monitoreo',
  descripcion: '',
  responsable: '',
  fechaInicio: '',
  fechaFin: '',
  ubicacionZona: '',
  estado: 'Planeada',
  prioridad: 'Media',
  cumplimientoNormativo: '',
  novedades: '',
  porcentajeAvance: 0,
  estadoAprobacion: 'Pendiente',
};

export const ESTADOS_ACTIVIDAD: { value: EstadoActividad; label: string }[] = [
  { value: 'Planeada',             label: 'Planeada' },
  { value: 'En Ejecución',         label: 'En Ejecución' },
  { value: 'Pendiente Aprobación', label: 'Pendiente Aprobación' },
  { value: 'Cerrada',              label: 'Cerrada' },
];

export const PRIORIDADES: { value: Prioridad; label: string }[] = [
  { value: 'Alta',  label: 'Alta' },
  { value: 'Media', label: 'Media' },
  { value: 'Baja',  label: 'Baja' },
];

export const TIPOS_ACTIVIDAD: TipoActividad[] = [
  'Monitoreo', 'Auditoría', 'Mantenimiento', 'Inspección', 'Capacitación', 'Otro',
];

export const ZONAS: string[] = [
  'Zona Norte - Planta Principal',
  'Zona Sur - Orilla del Río',
  'Bodega Central',
  'Zona Industrial',
  'Área Administrativa',
  'Campo - Oleoducto Norte',
  'Campo - Oleoducto Sur',
  'Estación de Bombeo 1',
  'Estación de Bombeo 2',
  'Otra',
];
