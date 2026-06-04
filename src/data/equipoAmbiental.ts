import { LineaOperativa, ZONAS } from '../types';

export type RolAmbiental = 'planeador' | 'revisor' | 'admin';

export interface AmbitoAmbiental {
  lineas: LineaOperativa[];
  zonas: string[];
  global?: boolean;
}

export interface EquipoAmbientalUser {
  nombre: string;
  email: string;
  alcance: string;
  baseTrabajo: string;
  zonaBase: string;
  planeador: AmbitoAmbiental[];
  revisor: AmbitoAmbiental[];
  admin?: boolean;
}

export const LINEAS_GESTION_AMBIENTAL: LineaOperativa[] = [
  'ICAs',
  'Compensaciones estaciones',
  'Residuos peligrosos',
  'Estudios Ambientales',
  'Monitoreos',
  'Pagos',
  'Servicios E',
  'Compensaciones provisiones',
];

export const LINEAS_COMPENSACIONES: LineaOperativa[] = [
  'Compensaciones estaciones',
  'Compensaciones provisiones',
  'Compensaciones e Inv',
];

export const TODAS_LINEAS_AMBIENTALES: LineaOperativa[] = [
  'Monitoreos',
  'ICAs',
  'Pagos',
  'S.Cumplimiento',
  'S. Contigencias',
  'S. Viabilidad',
  'S. Proyectos',
  'Servicios E',
  'Compensaciones estaciones',
  'Compensaciones e Inv',
  'Compensaciones provisiones',
  'Estudios Ambientales',
  'Servicios Generales',
  'Hojas de Ruta Sostenibilidad Ambiental',
  'Residuos peligrosos',
  'Herramienta Digital',
  'Inversion Ambiental Voluntaria',
  'Obras por Impuestos',
];

const scope = (lineas: LineaOperativa[], zonas: string[], global = false): AmbitoAmbiental => ({
  lineas,
  zonas,
  global,
});

export const EQUIPO_AMBIENTAL: EquipoAmbientalUser[] = [
  {
    nombre: 'Camilo Ortegón',
    email: 'camilo.ortegonc@outlook.com',
    alcance: 'Administrador temporal',
    baseTrabajo: 'Bogotá',
    zonaBase: 'Transversal',
    admin: true,
    planeador: [scope(TODAS_LINEAS_AMBIENTALES, ['*'], true)],
    revisor: [scope(TODAS_LINEAS_AMBIENTALES, ['*'], true)],
  },
  {
    nombre: 'Viviana Gonzalez',
    email: 'viviana.gonzalez@cenit-transporte.com',
    alcance: 'Especialista HSE-Ambiental CENIT',
    baseTrabajo: 'Santa Marta',
    zonaBase: 'Norte-Coveñas',
    planeador: [scope(LINEAS_GESTION_AMBIENTAL, ['Norte', 'Coveñas'])],
    revisor: [],
  },
  {
    nombre: 'Eliana Cortes',
    email: 'eliana.cortes@cenit-transporte.com',
    alcance: 'Especialista HSE-Ambiental CENIT',
    baseTrabajo: 'Bogotá',
    zonaBase: 'Oriente',
    planeador: [scope(LINEAS_GESTION_AMBIENTAL, ['Oriente'])],
    revisor: [scope(['Monitoreos'], ['Oriente'])],
  },
  {
    nombre: 'Luis Alberto Pelaez',
    email: 'luis.pelaez@cenit-transporte.com',
    alcance: 'Especialista HSE-Ambiental CENIT',
    baseTrabajo: 'Cali',
    zonaBase: 'Occidente-Sur',
    planeador: [scope(LINEAS_GESTION_AMBIENTAL, ['Occidente'])],
    revisor: [],
  },
  {
    nombre: 'Javier Hernandez',
    email: 'javier.hernandez@cenit-transporte.com',
    alcance: 'Especialista HSE-Ambiental CENIT',
    baseTrabajo: 'Cúcuta',
    zonaBase: 'CLC',
    planeador: [scope(LINEAS_GESTION_AMBIENTAL, ['CLC'])],
    revisor: [],
  },
  {
    nombre: 'Maria Ximena Puerto',
    email: 'maria.puerto@cenit-transporte.com',
    alcance: 'Especialista HSE-Ambiental CENIT',
    baseTrabajo: 'Barrancabermeja',
    zonaBase: 'Centro',
    planeador: [scope(LINEAS_GESTION_AMBIENTAL, ['Centro'])],
    revisor: [scope(['Residuos peligrosos'], ['Centro'])],
  },
  {
    nombre: 'Paola Ferreira',
    email: 'paola.ferreira@cenit-transporte.com',
    alcance: 'Especialista HSE-Ambiental CENIT',
    baseTrabajo: 'Villavicencio',
    zonaBase: 'Llanos',
    planeador: [scope(LINEAS_GESTION_AMBIENTAL, ['Llanos'])],
    revisor: [],
  },
  {
    nombre: 'Carmen Rosero',
    email: 'carmen.rosero@cenit-transporte.com',
    alcance: 'Especialista HSE-Ambiental CENIT',
    baseTrabajo: 'Pereira',
    zonaBase: 'Occidente-Norte',
    planeador: [scope(LINEAS_GESTION_AMBIENTAL, ['Occidente'])],
    revisor: [],
  },
  {
    nombre: 'Viviana Buitrago',
    email: 'viviana.buitrago@cenit-transporte.com',
    alcance: 'Especialista HSE-Ambiental CENIT',
    baseTrabajo: 'Bogotá',
    zonaBase: 'Transversal',
    planeador: [],
    revisor: [scope(['Servicios E'], ZONAS, true)],
  },
  {
    nombre: 'Diana Basto',
    email: 'diana.basto@cenit-transporte.com',
    alcance: 'Especialista HSE-Ambiental CENIT',
    baseTrabajo: 'Bogotá',
    zonaBase: 'Transversal',
    planeador: [scope(['ICAs', 'Herramienta Digital', 'Pagos'], ZONAS, true)],
    revisor: [scope(['ICAs', 'Herramienta Digital', 'Pagos', ...LINEAS_COMPENSACIONES], ZONAS, true)],
  },
  {
    nombre: 'Andrés Yara',
    email: 'edgar.yara@cenit-transporte.com',
    alcance: 'Especialista HSE-Ambiental CENIT',
    baseTrabajo: 'Bogotá',
    zonaBase: 'Transversal',
    planeador: [],
    revisor: [],
  },
  {
    nombre: 'Diego Efren Enriquez',
    email: 'diego.enriquez@cenit-transporte.com',
    alcance: 'Especialista HSE-Ambiental CENIT',
    baseTrabajo: 'Bogotá',
    zonaBase: 'Transversal',
    planeador: [],
    revisor: [],
  },
  {
    nombre: 'Juan Helderth Cardenas Ospina',
    email: 'juan.cardenaso@cenit-transporte.com',
    alcance: 'Jefe Ambiental',
    baseTrabajo: 'Bogotá',
    zonaBase: 'Transversal',
    admin: true,
    planeador: [scope(TODAS_LINEAS_AMBIENTALES, ['*'], true)],
    revisor: [scope(TODAS_LINEAS_AMBIENTALES, ['*'], true)],
  },
];

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const findEquipoAmbientalUser = (email: string) =>
  EQUIPO_AMBIENTAL.find(user => normalizeEmail(user.email) === normalizeEmail(email)) ?? null;
