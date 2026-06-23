// ============================================================
// Maestro de contratos / convenios para la Gestión Ambiental
// Fuente: "2026.06 Contratos_Convenios Ambientales.xlsx"
// (hoja "Estado contratos_convenios"). Usado para predefinir los
// datos auxiliares presupuestales del wizard de planeación.
// ============================================================

export type TipoContratoAmbiental =
  | 'GESTION AMBIENTAL'
  | 'OxI AMBIENTAL'
  | 'COMPENSACION AMBIENTAL';

export interface ContratoAmbiental {
  noContrato: string;
  contratista: string;
  administrador: string;
  supervisor: string;
  objeto: string;
  fechaInicio: string; // YYYY-MM-DD ('' si está por firmar acta de inicio)
  fechaFin: string;    // YYYY-MM-DD ('' si está por firmar acta de inicio)
  tipo: TipoContratoAmbiental;
}

export const CONTRATOS_AMBIENTALES: ContratoAmbiental[] = [
  {
    noContrato: '8000009091',
    contratista: 'SERVICIOS GEOLOGICOS INTEGRADOS S.A- SGI S.A.S.',
    administrador: 'Diana Leiva',
    supervisor: 'Luis Alberto Pelaez',
    objeto: 'SERVICIO DE GERENCIA DEL PROYECTO IMPLEMENTACIÓN DE LA ESTRATEGIA PAGO SERVICIOS AMBIENTALES (PSA) REACTIVACION ECONOMICA SOSTENIBLE Y AMBIENTAL (RESA) EN EL CONSEJO COMUNITARIO BAJO MIRA Y FRONTERA DEL MUNICIPIO DE TUMACO.',
    fechaInicio: '2024-09-02',
    fechaFin: '2026-09-02',
    tipo: 'OxI AMBIENTAL',
  },
  {
    noContrato: '8000009140',
    contratista: 'FUNDACION SACHA LLAQTA',
    administrador: 'Diana Leiva',
    supervisor: 'Viviana Buitrago',
    objeto: 'Servicios de SERVICIOS PARA LA IMPLEMENTACIÓN DE LA ESTRATEGIA PAGO SERVICIOS AMBIENTALES (PSA) REACTIVACION ECONOMICA SOSTENIBLE Y AMBIENTAL (RESA) EN EL CONSEJO COMUNITARIO BAJO MIRA Y FRONTERA DEL MUNICIPIO DE TUMACO, en el marco del mecanismo de obras por impuestos',
    fechaInicio: '2024-09-02',
    fechaFin: '2026-09-02',
    tipo: 'OxI AMBIENTAL',
  },
  {
    noContrato: '8000008649',
    contratista: 'ESTUDIOS TECNICOS SAS',
    administrador: 'Diana Leiva',
    supervisor: 'Diana Basto',
    objeto: 'SERVICIOS DE CONSOLIDACIÓN Y ELABORACIÓN DE INFORMES DE CUMPLIMIENTO AMBIENTAL – ICA.',
    fechaInicio: '2023-09-06',
    fechaFin: '2026-09-05',
    tipo: 'GESTION AMBIENTAL',
  },
  {
    noContrato: '8000009020',
    contratista: 'APPLUS NORCONTROL COLOMBIA LTDA',
    administrador: 'Diana Leiva',
    supervisor: 'Viviana Buitrago',
    objeto: 'SERVICIO PARA EL SOPORTE TÉCNICO Y ADMINISTRATIVO ESPECIALIZADO PARA LA GESTIÓN DE LOS RIESGOS Y LA GESTIÓN AMBIENTAL',
    fechaInicio: '2024-03-01',
    fechaFin: '2027-02-28',
    tipo: 'GESTION AMBIENTAL',
  },
  {
    noContrato: '8000008150',
    contratista: 'TERRASOS S.A.S.',
    administrador: 'Diana Leiva',
    supervisor: '',
    objeto: 'SERVICIOS DE RESERVA Y COMPRA DE CUPOS DE BIODIVERSIDAD EN LOS BANCO DE HÁBITAT REGISTRADOS Y APROBADOS POR EL MADS PARA EL CUMPLIMIENTO DE LAS OBLIGACIONES DE COMPENSACIÓN E INVERSIÓN DEL 1%',
    fechaInicio: '',
    fechaFin: '2027-05-31',
    tipo: 'COMPENSACION AMBIENTAL',
  },
  {
    noContrato: '8000009231',
    contratista: 'TWM SAS',
    administrador: 'Diana Leiva',
    supervisor: 'Maria Ximena Puerto',
    objeto: 'Recolección, Transporte, Tratamiento Y Disposición Final De Residuos Peligrosos Generados En Ductos, Plantas Y Terminales, Durante El Desarrollo De Las Actividades De Operación, Mantenimiento Y Contingencias, En Los Sistemas De Transporte De Hidrocarburos (EN LIQUIDACIÓN)',
    fechaInicio: '2023-09-11',
    fechaFin: '2027-09-11',
    tipo: 'GESTION AMBIENTAL',
  },
  {
    noContrato: '8000009587',
    contratista: 'CHEMICAL LABORATORY S.A.S. CHEMILAB S.A.S',
    administrador: 'Diana Leiva',
    supervisor: 'Eliana Cortés',
    objeto: 'SERVICIO DE MONITOREOS AMBIENTALES Y ENSAYOS FISICOQUÍMICOS DE PARÁMETROS ASOCIADOS A MATRICES AMBIENTALES',
    fechaInicio: '2025-09-06',
    fechaFin: '2028-10-06',
    tipo: 'GESTION AMBIENTAL',
  },
  {
    noContrato: '8000009578',
    contratista: 'ATENCION EN SOSTENIBILIDAD INTEGRAL',
    administrador: 'Diana Leiva',
    supervisor: 'Edgar Andrés Yara',
    objeto: 'SERVICIOS DE ESTUDIOS AMBIENTALES ESPECIALIZADOS',
    fechaInicio: '2025-09-15',
    fechaFin: '2028-10-15',
    tipo: 'GESTION AMBIENTAL',
  },
  {
    noContrato: '8000009782',
    contratista: 'BUSSINESS AND QUALITY SERVICES SAS',
    administrador: 'Diana Leiva',
    supervisor: 'Viviana Buitrago',
    objeto: 'Servicio para la ejecución del proyecto "Implementación de un esquema de pago por servicios ambientales (PSA) para la reactivación económica sostenible y ambiental (RESA) en el Consejo Comunitario Unión Río Caunapí municipio de Tumaco departamento de Nariño", en el marco del mecanismo de obras por impuestos.',
    fechaInicio: '2026-05-26',
    fechaFin: '2029-05-18',
    tipo: 'OxI AMBIENTAL',
  },
  {
    noContrato: '8000009536',
    contratista: 'SERVICIOS GEOLOGICOS INTEGRADOS S.A- SGI S.A.S.',
    administrador: 'Diana Leiva',
    supervisor: 'Luis Alberto Pelaez',
    objeto: 'SERVICIO DE GERENCIA DEL PROYECTO IMPLEMENTACIÓN DE LA ESTRATEGIA PAGO SERVICIOS AMBIENTALES (PSA) REACTIVACION ECONOMICA SOSTENIBLE Y AMBIENTAL (RESA) EN EL CONSEJO COMUNITARIO UNION CAUNAPI DEL MUNICIPIO DE TUMACO.',
    fechaInicio: '',
    fechaFin: '',
    tipo: 'OxI AMBIENTAL',
  },
  {
    noContrato: '8000009383',
    contratista: 'BUSSINESS AND QUALITY SERVICES SAS',
    administrador: 'Diana Leiva',
    supervisor: 'Juan Helderth Cardenas',
    objeto: 'SERVICIOS AMBIENTALES PARA EL DESARROLLO DE ACTIVIDADES QUE DEN CUMPLIMIENTO A LAS OBLIGACIONES Y/O MEDIDAS COMPENSATORIAS Y/O INVERSIÓN AL 1% Y/O VOLUNTARIAS.',
    fechaInicio: '',
    fechaFin: '2030-01-19',
    tipo: 'COMPENSACION AMBIENTAL',
  },
  {
    noContrato: '8000009781',
    contratista: 'AITEC S.A.S',
    administrador: 'Diana Leiva',
    supervisor: 'Viviana Buitrago',
    objeto: '',
    fechaInicio: '2026-05-21',
    fechaFin: '',
    tipo: 'OxI AMBIENTAL',
  },
  {
    noContrato: '8000009551',
    contratista: 'SERVICIOS GEOLOGICOS INTEGRADOS S.A- SGI S.A.S.',
    administrador: 'Diana Leiva',
    supervisor: 'Luis Alberto Pelaez',
    objeto: 'SERVICIO DE GERENCIA DEL PROYECTO IMPLEMENTACIÓN DE LA ESTRATEGIA PAGO SERVICIOS AMBIENTALES (PSA) REACTIVACION ECONOMICA SOSTENIBLE Y AMBIENTAL (RESA) EN EL CONSEJO COMUNITARIO RECUERDO DE NUESTROS ANCESTROS RIO MEJICANO DEL MUNICIPIO DE TUMACO.',
    fechaInicio: '',
    fechaFin: '',
    tipo: 'OxI AMBIENTAL',
  },
];

// Etiquetas legibles para agrupar en el selector
export const TIPO_CONTRATO_LABEL: Record<TipoContratoAmbiental, string> = {
  'GESTION AMBIENTAL': 'Gestión Ambiental',
  'OxI AMBIENTAL': 'Obras por Impuestos (OxI) Ambiental',
  'COMPENSACION AMBIENTAL': 'Compensación Ambiental',
};

// Orden de los grupos en el selector
export const TIPOS_CONTRATO_ORDEN: TipoContratoAmbiental[] = [
  'GESTION AMBIENTAL',
  'OxI AMBIENTAL',
  'COMPENSACION AMBIENTAL',
];

export const getContratoByNo = (no?: string): ContratoAmbiental | undefined =>
  no ? CONTRATOS_AMBIENTALES.find(c => c.noContrato === no) : undefined;

/** Contratos agrupados por tipo, respetando TIPOS_CONTRATO_ORDEN. */
export const contratosPorTipo = (): { tipo: TipoContratoAmbiental; contratos: ContratoAmbiental[] }[] =>
  TIPOS_CONTRATO_ORDEN
    .map(tipo => ({ tipo, contratos: CONTRATOS_AMBIENTALES.filter(c => c.tipo === tipo) }))
    .filter(g => g.contratos.length > 0);
