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

const serviciosEGlobal = () => scope(['Servicios E'], ZONAS, true);

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
    planeador: [scope(LINEAS_GESTION_AMBIENTAL, ['Norte', 'Coveñas']), serviciosEGlobal()],
    revisor: [serviciosEGlobal()],
  },
  {
    nombre: 'Eliana Cortes',
    email: 'eliana.cortes@cenit-transporte.com',
    alcance: 'Especialista HSE-Ambiental CENIT',
    baseTrabajo: 'Bogotá',
    zonaBase: 'Oriente',
    planeador: [scope(LINEAS_GESTION_AMBIENTAL, ['Oriente']), serviciosEGlobal()],
    revisor: [scope(['Monitoreos'], ['Oriente']), serviciosEGlobal()],
  },
  {
    nombre: 'Luis Alberto Pelaez',
    email: 'luis.pelaez@cenit-transporte.com',
    alcance: 'Especialista HSE-Ambiental CENIT',
    baseTrabajo: 'Cali',
    zonaBase: 'Occidente-Sur',
    planeador: [scope(LINEAS_GESTION_AMBIENTAL, ['Occidente']), serviciosEGlobal()],
    revisor: [serviciosEGlobal()],
  },
  {
    nombre: 'Javier Hernandez',
    email: 'javier.hernandez@cenit-transporte.com',
    alcance: 'Especialista HSE-Ambiental CENIT',
    baseTrabajo: 'Cúcuta',
    zonaBase: 'CLC',
    planeador: [scope(LINEAS_GESTION_AMBIENTAL, ['CLC']), serviciosEGlobal()],
    revisor: [serviciosEGlobal()],
  },
  {
    nombre: 'Maria Ximena Puerto',
    email: 'maria.puerto@cenit-transporte.com',
    alcance: 'Especialista HSE-Ambiental CENIT',
    baseTrabajo: 'Barrancabermeja',
    zonaBase: 'Centro',
    planeador: [scope(LINEAS_GESTION_AMBIENTAL, ['Centro']), serviciosEGlobal()],
    revisor: [scope(['Residuos peligrosos'], ['Centro']), serviciosEGlobal()],
  },
  {
    nombre: 'Paola Ferreira',
    email: 'paola.ferreira@cenit-transporte.com',
    alcance: 'Especialista HSE-Ambiental CENIT',
    baseTrabajo: 'Villavicencio',
    zonaBase: 'Llanos',
    planeador: [scope(LINEAS_GESTION_AMBIENTAL, ['Llanos']), serviciosEGlobal()],
    revisor: [serviciosEGlobal()],
  },
  {
    nombre: 'Carmen Rosero',
    email: 'carmen.rosero@cenit-transporte.com',
    alcance: 'Especialista HSE-Ambiental CENIT',
    baseTrabajo: 'Pereira',
    zonaBase: 'Occidente-Norte',
    planeador: [scope(LINEAS_GESTION_AMBIENTAL, ['Occidente']), serviciosEGlobal()],
    revisor: [serviciosEGlobal()],
  },
  {
    nombre: 'Viviana Buitrago',
    email: 'viviana.buitrago@cenit-transporte.com',
    alcance: 'Especialista HSE-Ambiental CENIT',
    baseTrabajo: 'Bogotá',
    zonaBase: 'Transversal',
    planeador: [serviciosEGlobal()],
    revisor: [serviciosEGlobal()],
  },
  {
    nombre: 'Diana Basto',
    email: 'diana.basto@cenit-transporte.com',
    alcance: 'Especialista HSE-Ambiental CENIT',
    baseTrabajo: 'Bogotá',
    zonaBase: 'Transversal',
    planeador: [scope(['ICAs', 'Herramienta Digital', 'Pagos'], ZONAS, true), serviciosEGlobal()],
    revisor: [scope(['ICAs', 'Herramienta Digital', 'Pagos', ...LINEAS_COMPENSACIONES], ZONAS, true), serviciosEGlobal()],
  },
  {
    nombre: 'Andrés Yara',
    email: 'edgar.yara@cenit-transporte.com',
    alcance: 'Especialista HSE-Ambiental CENIT',
    baseTrabajo: 'Bogotá',
    zonaBase: 'Transversal',
    planeador: [serviciosEGlobal()],
    revisor: [serviciosEGlobal()],
  },
  {
    nombre: 'Diego Efren Enriquez',
    email: 'diego.enriquez@cenit-transporte.com',
    alcance: 'Especialista HSE-Ambiental CENIT',
    baseTrabajo: 'Bogotá',
    zonaBase: 'Transversal',
    planeador: [serviciosEGlobal()],
    revisor: [serviciosEGlobal()],
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
  {
    nombre: 'Jefatura Ambiental',
    email: 'jefatura-ambiental@cenit-transporte.com',
    alcance: 'Jefatura Ambiental',
    baseTrabajo: 'Bogotá',
    zonaBase: 'Transversal',
    admin: true,
    planeador: [scope(TODAS_LINEAS_AMBIENTALES, ['*'], true)],
    revisor: [scope(TODAS_LINEAS_AMBIENTALES, ['*'], true)],
  },
];

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const zonaTokens = (zona?: string) => {
  if (!zona) return [];
  const normalized = normalizeText(zona);
  if (!normalized) return [];
  if (normalized === '*' || normalized === 'transversal') return ['*'];
  if (normalized.includes('norte covenas')) return ['norte', 'covenas'];
  if (normalized.includes('occidente')) return ['occidente'];
  if (normalized === 'clc' || normalized.includes('cano limon')) return ['clc'];
  if (normalized.includes('covenas')) return ['covenas'];
  return [normalized];
};

export const zonasMatch = (scopeZona: string, targetZona?: string) => {
  const scopeTokens = zonaTokens(scopeZona);
  if (scopeTokens.includes('*')) return true;
  const targetTokens = zonaTokens(targetZona);
  if (targetTokens.length === 0) return false;
  return scopeTokens.some(token => targetTokens.includes(token));
};

export const ambitoMatches = (scopes: AmbitoAmbiental[], linea?: LineaOperativa, zona?: string) =>
  scopes.some(scope => {
    const matchLinea = !linea || scope.lineas.includes(linea);
    const matchZona = !zona || scope.global || scope.zonas.some(scopeZona => zonasMatch(scopeZona, zona));
    return matchLinea && matchZona;
  });

export const getRevisoresAmbientales = (linea: LineaOperativa, zona?: string) => {
  const vistos = new Set<string>();

  return EQUIPO_AMBIENTAL
    .filter(user => user.email && ambitoMatches(user.revisor, linea, zona))
    .map(user => ({
      nombre: user.nombre,
      email: normalizeEmail(user.email),
      alcance: user.alcance,
      zonaBase: user.zonaBase,
      admin: !!user.admin,
    }))
    .filter(user => {
      if (vistos.has(user.email)) return false;
      vistos.add(user.email);
      return true;
    });
};

export const findEquipoAmbientalUser = (email: string) =>
  EQUIPO_AMBIENTAL.find(user => normalizeEmail(user.email) === normalizeEmail(email)) ?? null;
