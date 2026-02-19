// ============================================================
// ActividadesService — Mock completo CENIT (GREENLOG)
// En producción, generado por PAC CLI al ejecutar:
//   pac code add-data-source -a "shared_sharepointonline"
//                            -c "<connectionId>"
//                            -t "ActividadesAmbientales"
//                            -d "https://<tenant>.sharepoint.com/sites/CENIT"
// ============================================================

import { ActividadAmbiental, NuevaActividadPayload } from '../../types';

let STORE: ActividadAmbiental[] = [
  {
    id: 'act-001',
    tarea: 'Monitoreo de calidad del aire PM2.5 y PM10',
    tipo: 'Monitoreo',
    descripcion: 'Medición continua de material particulado en zona de operaciones oleoducto norte. Incluye instalación de sensores temporales y toma de muestras.',
    responsable: 'Carlos Mendoza',
    fechaInicio: '2026-02-01',
    fechaFin: '2026-02-28',
    ubicacionZona: 'Campo - Oleoducto Norte',
    estado: 'En Ejecución',
    prioridad: 'Alta',
    porcentajeAvance: 62,
    cumplimientoNormativo: 'Res. 2254/2017 MADS',
    estadoAprobacion: 'Aprobado',
    aprobadoPor: 'Jefe Ambiental',
    creadoEn: '2026-01-25T08:00:00Z',
  },
  {
    id: 'act-002',
    tarea: 'Auditoría de residuos sólidos y peligrosos Q1',
    tipo: 'Auditoría',
    descripcion: 'Revisión del manejo, clasificación, almacenamiento temporal y disposición final de residuos generados en la bodega central.',
    responsable: 'Laura Gómez',
    fechaInicio: '2026-03-01',
    fechaFin: '2026-03-15',
    ubicacionZona: 'Bodega Central',
    estado: 'Planeada',
    prioridad: 'Alta',
    porcentajeAvance: 0,
    cumplimientoNormativo: 'Dec. 1076/2015 Art. 2.2.6',
    estadoAprobacion: 'Pendiente',
    creadoEn: '2026-01-30T09:30:00Z',
  },
  {
    id: 'act-003',
    tarea: 'Revisión de vertimientos - Cuenca Río Magdalena',
    tipo: 'Inspección',
    descripcion: 'Control de puntos de vertimiento de aguas residuales industriales. Toma de muestras fisicoquímicas y verificación del permiso de vertimientos vigente.',
    responsable: 'Andrés Ruiz',
    fechaInicio: '2026-01-10',
    fechaFin: '2026-01-31',
    ubicacionZona: 'Zona Sur - Orilla del Río',
    estado: 'Cerrada',
    prioridad: 'Alta',
    porcentajeAvance: 100,
    cumplimientoNormativo: 'Dec. 3930/2010',
    estadoAprobacion: 'Aprobado',
    aprobadoPor: 'Jefe Ambiental',
    fechaAprobacion: '2026-02-02',
    creadoEn: '2026-01-05T07:00:00Z',
  },
  {
    id: 'act-004',
    tarea: 'Mantenimiento de trampa de grasas - Estación Bombeo 1',
    tipo: 'Mantenimiento',
    descripcion: 'Limpieza y mantenimiento preventivo de la trampa de grasas y separador de agua-aceite. Verificar estado de tuberías de conducción.',
    responsable: 'Miguel Torres',
    fechaInicio: '2026-02-10',
    fechaFin: '2026-02-12',
    ubicacionZona: 'Estación de Bombeo 1',
    estado: 'Cerrada',
    prioridad: 'Media',
    porcentajeAvance: 100,
    cumplimientoNormativo: 'Plan de Manejo Ambiental PMA',
    estadoAprobacion: 'Aprobado',
    aprobadoPor: 'Supervisor Operativo',
    fechaAprobacion: '2026-02-13',
    creadoEn: '2026-02-01T10:00:00Z',
  },
  {
    id: 'act-005',
    tarea: 'Capacitación gestión ambiental para operadores',
    tipo: 'Capacitación',
    descripcion: 'Jornada de formación sobre procedimientos ambientales, manejo de derrames, reporte de incidentes y uso de EPP. Plataforma Teams + presencial.',
    responsable: 'Sandra Vega',
    fechaInicio: '2026-03-05',
    fechaFin: '2026-03-05',
    ubicacionZona: 'Área Administrativa',
    estado: 'Planeada',
    prioridad: 'Media',
    porcentajeAvance: 0,
    estadoAprobacion: 'Pendiente',
    creadoEn: '2026-02-05T11:00:00Z',
  },
  {
    id: 'act-006',
    tarea: 'Inspección flora y fauna zona amortiguadora',
    tipo: 'Inspección',
    descripcion: 'Reconocimiento visual de la franja de protección ambiental. Registro fotográfico de especies y evaluación de estado de cobertura vegetal.',
    responsable: 'Paola Medina',
    fechaInicio: '2026-02-15',
    fechaFin: '2026-02-20',
    ubicacionZona: 'Campo - Oleoducto Sur',
    estado: 'En Ejecución',
    prioridad: 'Baja',
    porcentajeAvance: 40,
    cumplimientoNormativo: 'Ley 99/1993',
    estadoAprobacion: 'Pendiente',
    creadoEn: '2026-02-08T14:00:00Z',
  },
  {
    id: 'act-007',
    tarea: 'Monitoreo ruido ambiental perímetro planta',
    tipo: 'Monitoreo',
    descripcion: 'Medición de niveles de presión sonora en puntos perimetrales de la planta principal. Reporte para autoridad ambiental.',
    responsable: 'Carlos Mendoza',
    fechaInicio: '2026-03-10',
    fechaFin: '2026-03-12',
    ubicacionZona: 'Zona Norte - Planta Principal',
    estado: 'Planeada',
    prioridad: 'Media',
    porcentajeAvance: 0,
    cumplimientoNormativo: 'Res. 627/2006',
    estadoAprobacion: 'Pendiente',
    creadoEn: '2026-02-10T09:00:00Z',
  },
  {
    id: 'act-008',
    tarea: 'Reporte mensual IDEAM - Inventario emisiones',
    tipo: 'Auditoría',
    descripcion: 'Consolidación y envío del informe mensual de emisiones atmosféricas al IDEAM según registro RUNAP. Incluye verificación de datos de todos los puntos de monitoreo.',
    responsable: 'Laura Gómez',
    fechaInicio: '2026-02-25',
    fechaFin: '2026-02-28',
    ubicacionZona: 'Área Administrativa',
    estado: 'Pendiente Aprobación',
    prioridad: 'Alta',
    porcentajeAvance: 95,
    cumplimientoNormativo: 'Res. 2153/2010 IDEAM',
    estadoAprobacion: 'Pendiente',
    novedades: 'Pendiente firma digital del Jefe de Ambiente.',
    creadoEn: '2026-02-15T07:30:00Z',
  },
];

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const rndDelay = () => 200 + Math.random() * 350;

export const ActividadesService = {
  async getAll(): Promise<ActividadAmbiental[]> {
    await delay(rndDelay());
    return STORE.map((a) => ({ ...a }));
  },

  async getById(id: string): Promise<ActividadAmbiental | undefined> {
    await delay(rndDelay());
    return STORE.find((a) => a.id === id);
  },

  async create(payload: NuevaActividadPayload): Promise<ActividadAmbiental> {
    await delay(rndDelay());
    const nueva: ActividadAmbiental = {
      ...payload,
      id: `act-${Date.now()}`,
      creadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
    };
    STORE = [nueva, ...STORE];
    return { ...nueva };
  },

  async update(id: string, cambios: Partial<NuevaActividadPayload>): Promise<ActividadAmbiental> {
    await delay(rndDelay());
    STORE = STORE.map((a) =>
      a.id === id ? { ...a, ...cambios, actualizadoEn: new Date().toISOString() } : a
    );
    return { ...STORE.find((a) => a.id === id)! };
  },

  async delete(id: string): Promise<void> {
    await delay(rndDelay());
    STORE = STORE.filter((a) => a.id !== id);
  },
};
