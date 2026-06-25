// ============================================================
// BulkUploadPanel — Carga masiva de actividades desde Excel
// Incluye: Drag & Drop, validación, preview, template generation
// ============================================================
import React, { useCallback, useRef, useState } from 'react';
import {
  makeStyles, shorthands, tokens,
  Dialog, DialogSurface, DialogTitle, DialogBody, DialogContent, DialogActions,
  Button, Body1, Body2, Caption1, Caption1Strong, Divider,
  MessageBar, MessageBarBody, MessageBarTitle,
  Spinner, Badge, Subtitle2,
  DataGrid, DataGridBody, DataGridCell, DataGridHeader,
  DataGridHeaderCell, DataGridRow, TableColumnDefinition, createTableColumn,
  TableCellLayout,
} from '@fluentui/react-components';
import {
  ArrowUploadRegular, DocumentTableRegular, DismissRegular,
  ArrowDownloadRegular, CheckmarkCircleRegular, ErrorCircleRegular,
  WarningRegular,
} from '@fluentui/react-icons';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import {
  NuevaActividadPayload, FORM_INICIAL,
  LINEAS_OPERATIVAS, ZONAS, CONTRATOS, MESES,
  TIPOS_CUENTA, ESTADOS_ACTIVIDAD, PRIORIDADES,
  MATRICES_AMBIENTALES, LineaOperativa, TipoCuenta,
  EstadoActividad, Prioridad, MatrizAmbiental,
  ZONAS_ESTACIONES, RESPONSABLES,
  TIPOS_LUGAR, TIPOS_PLANEACION, FUENTES_PRESUPUESTO,
  TipoLugar, TipoPlaneacion, FuentePresupuesto,
} from '../../types';
import { CENIT_COLORS } from '../../theme/cenitTheme';
import {
  ZONAS_COMPENSACIONES, SISTEMAS_CENIT, TIPOS_ACTO, TIPOS_PERMISO,
  AUTORIDADES_AMBIENTALES, CATEGORIAS_COMPENSACION, CONTRATOS_COMPENSACIONES,
} from './PlaneacionWizard';
import { DEPARTAMENTOS_LIST } from '../../data/jurisdiccionesCompensaciones';
import { OBLIGACIONES_SEED } from '../../data/obligacionesSeed';

// ── Estilos ───────────────────────────────────────────────────
const useStyles = makeStyles({
  surface: {
    maxWidth: '900px',
    width: '90vw',
    maxHeight: '85vh',
    ...shorthands.borderRadius('20px'),
  },
  dropZone: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('40px', '24px'),
    ...shorthands.borderRadius('16px'),
    border: '2px dashed rgba(0, 51, 160, 0.25)',
    background: 'linear-gradient(135deg, rgba(230,240,255,0.4) 0%, rgba(244,252,227,0.3) 100%)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    ':hover': {
      border: '2px dashed rgba(0, 51, 160, 0.5)',
      background: 'linear-gradient(135deg, rgba(230,240,255,0.6) 0%, rgba(244,252,227,0.5) 100%)',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 24px rgba(0,51,160,0.08)',
    },
  },
  dropZoneActive: {
    border: '2px solid #0056D2',
    background: 'rgba(0, 86, 210, 0.08)',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(0,51,160,0.12)',
  },
  dropIcon: {
    fontSize: '48px',
    color: CENIT_COLORS.blueLight,
    marginBottom: '12px',
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    ...shorthands.padding('12px', '16px'),
    ...shorthands.borderRadius('12px'),
    background: 'rgba(255,255,255,0.6)',
    border: '1px solid rgba(0,0,0,0.06)',
    marginTop: '12px',
  },
  previewWrap: {
    maxHeight: '300px',
    overflowY: 'auto',
    ...shorthands.borderRadius('12px'),
    border: '1px solid rgba(0,0,0,0.06)',
    marginTop: '12px',
  },
  summaryRow: {
    display: 'flex',
    ...shorthands.gap('16px'),
    flexWrap: 'wrap',
    marginTop: '12px',
    marginBottom: '8px',
  },
  summaryCard: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    ...shorthands.padding('8px', '16px'),
    ...shorthands.borderRadius('10px'),
    background: 'rgba(255,255,255,0.7)',
    border: '1px solid rgba(0,0,0,0.04)',
    fontSize: '13px',
    fontWeight: 600,
  },
  templateSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('16px'),
    ...shorthands.borderRadius('12px'),
    background: 'linear-gradient(135deg, rgba(244,252,227,0.5) 0%, rgba(230,240,255,0.3) 100%)',
    border: '1px solid rgba(140,198,63,0.2)',
    marginTop: '16px',
  },
  errorList: {
    maxHeight: '120px',
    overflowY: 'auto',
    fontSize: '12px',
    ...shorthands.padding('8px', '12px'),
    ...shorthands.borderRadius('8px'),
    background: '#FEF2F2',
    color: '#991B1B',
    marginTop: '8px',
  },
});

// ── Mapeo de columnas Excel ↔ campos ─────────────────────────
const COLUMN_MAP: Record<string, keyof NuevaActividadPayload> = {
  'Tarea':                'tarea',
  'Línea Operativa':      'lineaOperativa',
  'Descripción':          'descripcion',
  'Responsable':          'responsable',
  'Zona':                 'zona',
  'Tipo Lugar':           'tipoLugar',
  'Estación':             'estacion',
  'PK':                   'pk',
  'Fuente Presupuesto':   'fuentePresupuesto',
  'Tipo Planeación':      'tipoPlaneacion',
  'Año':                  'anioPlaneacion',
  'Fecha Inicio':         'fechaInicio',
  'Fecha Fin':            'fechaFin',
  'Estado':               'estado',
  'Prioridad':            'prioridad',
  'Tipo Cuenta':          'cuenta',
  'Matrices Ambientales': 'matricesAplicables',
  'Novedades':            'novedades',
  'Proveedor':            'contrato',
};

// ── Validación de una fila ──────────────────────────────────
interface RowResult {
  rowIndex: number;
  payload: NuevaActividadPayload;
  errors: string[];
  isValid: boolean;
}

export interface BulkUploadResult {
  createdCount: number;
  failedCount: number;
  errors: string[];
}

const VALID_LINEAS = LINEAS_OPERATIVAS.map((l) => l.value);
const VALID_ZONAS = ZONAS;
const VALID_ESTADOS = ESTADOS_ACTIVIDAD.map((e) => e.value);
const VALID_PRIORIDADES = PRIORIDADES.map((p) => p.value);
const VALID_CUENTAS = TIPOS_CUENTA.map((t) => t.value);
const VALID_MATRICES = MATRICES_AMBIENTALES.map((m) => m.value);
const VALID_TIPOS_LUGAR = TIPOS_LUGAR.map((t) => t.value);
const VALID_TIPOS_PLANEACION = TIPOS_PLANEACION.map((t) => t.value);
const VALID_FUENTES = FUENTES_PRESUPUESTO.map((f) => f.value);

function getActivityKey(raw: Record<string, unknown>, rowIdx: number): string {
  const key = String(raw['ActividadKey'] ?? raw['Tarea'] ?? `ACT-${rowIdx}`).trim();
  return key || `ACT-${rowIdx}`;
}

function parseExcelDate(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'number') {
    // Excel serial date
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      const y = String(date.y).padStart(4, '0');
      const m = String(date.m).padStart(2, '0');
      const d = String(date.d).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }
  const s = String(value).trim();
  // Try dd/mm/yyyy or dd-mm-yyyy
  const match = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (match) return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
  // Try yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return s;
}

function validateRow(raw: Record<string, unknown>, rowIdx: number, detailRows: Record<string, unknown>[] = []): RowResult {
  const errors: string[] = [];
  const payload: NuevaActividadPayload = { ...FORM_INICIAL };
  const activityKey = getActivityKey(raw, rowIdx);

  // Map columns from header sheet
  for (const [excelCol, fieldName] of Object.entries(COLUMN_MAP)) {
    const rawVal = raw[excelCol];
    if (rawVal === undefined || rawVal === null || rawVal === '') continue;

    switch (fieldName) {
      case 'tarea':
      case 'descripcion':
      case 'responsable':
      case 'contrato':
      case 'zona':
      case 'estacion':
      case 'pk':
      case 'cumplimientoNormativo':
      case 'novedades':
        (payload as any)[fieldName] = String(rawVal).trim();
        break;

      case 'lineaOperativa': {
        const lo = String(rawVal).trim();
        if (VALID_LINEAS.includes(lo as any)) payload.lineaOperativa = lo as LineaOperativa;
        else errors.push(`Fila ${rowIdx}: Línea Operativa "${lo}" no válida`);
        break;
      }

      case 'tipoLugar': {
        const tl = String(rawVal).trim();
        if (VALID_TIPOS_LUGAR.includes(tl as any)) payload.tipoLugar = tl as TipoLugar;
        else errors.push(`Fila ${rowIdx}: Tipo Lugar "${tl}" no válido`);
        break;
      }

      case 'fuentePresupuesto': {
        const fp = String(rawVal).trim();
        if (VALID_FUENTES.includes(fp as any)) payload.fuentePresupuesto = fp as FuentePresupuesto;
        else errors.push(`Fila ${rowIdx}: Fuente Presupuesto "${fp}" no válida`);
        break;
      }

      case 'tipoPlaneacion': {
        const tp = String(rawVal).trim();
        if (VALID_TIPOS_PLANEACION.includes(tp as any)) payload.tipoPlaneacion = tp as TipoPlaneacion;
        else errors.push(`Fila ${rowIdx}: Tipo Planeación "${tp}" no válido`);
        break;
      }

      case 'anioPlaneacion': {
        const year = Number(rawVal);
        if (Number.isFinite(year) && year >= 2020 && year <= 2100) payload.anioPlaneacion = year;
        else errors.push(`Fila ${rowIdx}: Año "${rawVal}" no válido`);
        break;
      }

      case 'estado': {
        const est = String(rawVal).trim();
        if (VALID_ESTADOS.includes(est as any)) payload.estado = est as EstadoActividad;
        else errors.push(`Fila ${rowIdx}: Estado "${est}" no válido`);
        break;
      }

      case 'prioridad': {
        const pri = String(rawVal).trim();
        if (VALID_PRIORIDADES.includes(pri as any)) payload.prioridad = pri as Prioridad;
        else errors.push(`Fila ${rowIdx}: Prioridad "${pri}" no válida`);
        break;
      }

      case 'cuenta': {
        const cta = String(rawVal).trim();
        if (VALID_CUENTAS.includes(cta as any)) payload.cuenta = cta as TipoCuenta;
        else errors.push(`Fila ${rowIdx}: Tipo Cuenta "${cta}" no válido`);
        break;
      }

      case 'fechaInicio':
        payload.fechaInicio = parseExcelDate(rawVal);
        break;

      case 'fechaFin':
        payload.fechaFin = parseExcelDate(rawVal);
        break;

      case 'matricesAplicables': {
        const matrices = String(rawVal).split(',').map((s) => s.trim()).filter(Boolean);
        const validMatrices: MatrizAmbiental[] = [];
        for (const m of matrices) {
          if (VALID_MATRICES.includes(m as any)) validMatrices.push(m as MatrizAmbiental);
          else errors.push(`Fila ${rowIdx}: Matriz "${m}" no válida`);
        }
        payload.matricesAplicables = validMatrices;
        break;
      }
    }
  }

  // Smart defaults for the new schema
  if ((!raw['Tipo Lugar'] || String(raw['Tipo Lugar']).trim() === '') && payload.pk?.trim()) {
    payload.tipoLugar = 'Línea';
  } else if ((!raw['Tipo Lugar'] || String(raw['Tipo Lugar']).trim() === '') && !payload.estacion?.trim()) {
    payload.tipoLugar = 'Zona';
  }

  // Build OPEX payload either from Detail sheet (new model) or from monthly columns (legacy model)
  let opexMeses: any[] = [];
  let totalAnio = 0;
  let primerMesActivo: string | null = null;

  if (detailRows.length > 0) {
    const estacionesZona = payload.zona ? (ZONAS_ESTACIONES[payload.zona] ?? []) : [];
    const estacionesSet = new Set<string>();
    const matricesSet = new Set<string>();
    const nombres: string[] = [];

    opexMeses = MESES.map((mes) => ({
      mes,
      precio: 0,
      cantidad: 0,
      frecuencia: 1,
      preciosIndividuales: [] as any[],
      total: 0,
    }));

    for (const det of detailRows) {
      const nombre = String(
        det['Ítem / Parámetro'] ?? det['Item / Parámetro'] ?? det['Ítem / Parametro'] ??
        det['Item / Parametro'] ?? det['Parámetro / Ítem'] ?? det['Parametro / Item'] ?? ''
      ).trim();
      if (!nombre) {
        errors.push(`Fila ${rowIdx}: La hoja Detalle tiene una fila sin "Ítem / Parámetro" para ${activityKey}`);
        continue;
      }

      const estacionDet = String(det['Estación'] ?? raw['Estación'] ?? '').trim();
      const matrizDet = String(det['Matriz'] ?? '').trim();
      const precioUnitario = Number(det['Precio Unitario']) || 0;
      // Puntos por parámetro (Monitoreos): se pliega en el precio efectivo. Default 1.
      const puntos = Number(det['Puntos']) || 1;

      nombres.push(nombre);
      if (estacionDet) {
        estacionesSet.add(estacionDet);
        if (payload.zona && estacionesZona.length > 0 && !estacionesZona.includes(estacionDet)) {
          errors.push(`Fila ${rowIdx}: Estación "${estacionDet}" no válida para la zona "${payload.zona}"`);
        }
      }
      if (matrizDet) matricesSet.add(matrizDet);

      if (payload.lineaOperativa === 'Monitoreos' && payload.tipoLugar === 'Zona' && !estacionDet) {
        errors.push(`Fila ${rowIdx}: Para Monitoreos por Zona, cada fila de Detalle debe indicar "Estación"`);
      }

      MESES.forEach((mes, mi) => {
        const precio = (Number(det[`Precio ${mes}`]) || precioUnitario) * puntos;
        const cantidad = Number(det[`Cantidad ${mes}`]) || 0;
        const freqRaw = det[`Frecuencia ${mes}`];
        const frecuencia = (freqRaw !== '' && freqRaw !== undefined && freqRaw !== null)
          ? (Number(freqRaw) || 1)
          : 1;
        const total = precio * cantidad * frecuencia;

        if (total > 0 && !primerMesActivo) primerMesActivo = mes;

        const key = [estacionDet, matrizDet, nombre].filter(Boolean).join('|') || nombre;
        const displayName = payload.lineaOperativa === 'Monitoreos' && estacionDet
          ? `${estacionDet} — ${nombre}`
          : nombre;

        opexMeses[mi].preciosIndividuales.push({ key, nombre: displayName, precio, cantidad, frecuencia, total });
        opexMeses[mi].precio += precio;
        opexMeses[mi].total += total;
      });
    }

    totalAnio = opexMeses.reduce((s, m) => s + m.total, 0);

    if ((!payload.matricesAplicables || payload.matricesAplicables.length === 0) && matricesSet.size > 0) {
      payload.matricesAplicables = Array.from(matricesSet).filter((m) => VALID_MATRICES.includes(m as any)) as MatrizAmbiental[];
    }
    if ((!payload.estacion || !payload.estacion.trim()) && payload.tipoLugar === 'Estación' && estacionesSet.size === 1) {
      payload.estacion = Array.from(estacionesSet)[0];
    }
    if (payload.tipoLugar === 'Zona') {
      payload.estacion = '';
    }
    if (!(payload.descripcion ?? '').trim() && nombres.length > 0) {
      const uniqueNames = Array.from(new Set(nombres));
      payload.descripcion = `${payload.lineaOperativa === 'Monitoreos' ? 'Parámetros' : 'Ítems'}: ${uniqueNames.join(', ')}`;
    }
  } else {
    // Legacy 1-sheet format: still supported
    const legacyMeses: any[] = [];
    for (const mes of MESES) {
      const precio = Number(raw[`Precio ${mes}`]) || 0;
      const cantidad = Number(raw[`Cantidad ${mes}`]) || 0;
      const frecuencia = (Number(raw[`Frecuencia ${mes}`]) || 1);
      const totalRaw = raw[`Total ${mes}`];
      const total = (totalRaw !== undefined && totalRaw !== '' && totalRaw !== null)
        ? (Number(totalRaw) || (precio * cantidad * frecuencia))
        : (precio * cantidad * frecuencia);
      if (total > 0 && !primerMesActivo) primerMesActivo = mes;
      totalAnio += total;
      legacyMeses.push({ mes, precio, cantidad, frecuencia, preciosIndividuales: [], total });
    }
    opexMeses = legacyMeses;
  }

  payload.presupuestoPlan = totalAnio;
  payload.mes = primerMesActivo ?? '';

  // Build opexDataRaw with the new metadata model
  const objeto = String(raw['Objeto del Contrato'] ?? '').trim();
  const noContrato = String(raw['No. Contrato'] ?? '').trim();
  const admin = String(raw['Administrador'] ?? '').trim();

  payload.opexDataRaw = JSON.stringify({
    meses: opexMeses,
    proveedor: payload.contrato,
    objeto,
    contrato: noContrato,
    administrador: admin,
    zona: payload.zona,
    tipoLugar: payload.tipoLugar,
    pk: payload.pk,
    fuentePresupuesto: payload.fuentePresupuesto,
    tipoPlaneacion: payload.tipoPlaneacion,
    anioPlaneacion: payload.anioPlaneacion,
  });

  // Required field validation
  if (!payload.tarea.trim()) errors.push(`Fila ${rowIdx}: Campo "Tarea" es obligatorio`);
  if (!payload.responsable.trim()) errors.push(`Fila ${rowIdx}: Campo "Responsable" es obligatorio`);
  if (!payload.fechaInicio) errors.push(`Fila ${rowIdx}: "Fecha Inicio" es obligatorio`);
  if (!payload.fechaFin) errors.push(`Fila ${rowIdx}: "Fecha Fin" es obligatorio`);
  if (!payload.zona) errors.push(`Fila ${rowIdx}: "Zona" es obligatorio`);
  if (!payload.mes) errors.push(`Fila ${rowIdx}: No hay ningún mes con Total > 0. Ingresa al menos un mes activo.`);
  if (payload.tipoLugar === 'Línea' && !payload.pk?.trim()) {
    errors.push(`Fila ${rowIdx}: El campo "PK" es obligatorio cuando Tipo Lugar = Línea`);
  }

  if (payload.zona && !VALID_ZONAS.includes(payload.zona)) {
    errors.push(`Fila ${rowIdx}: Zona "${payload.zona}" no válida`);
  }

  if (payload.zona === 'Transversal' || payload.tipoLugar === 'Zona') {
    payload.estacion = '';
  } else if (payload.zona) {
    const estacionesZona = ZONAS_ESTACIONES[payload.zona] ?? [];
    const estacion = payload.estacion?.trim() ?? '';
    if (!estacion && payload.lineaOperativa === 'Monitoreos' && payload.tipoLugar === 'Estación') {
      errors.push(`Fila ${rowIdx}: "Estación" es obligatoria para Monitoreos cuando Tipo Lugar = Estación`);
    } else if (estacion && !estacionesZona.includes(estacion)) {
      errors.push(`Fila ${rowIdx}: Estación "${estacion}" no válida para la zona "${payload.zona}"`);
    }
  }

  if (payload.fechaInicio && payload.fechaFin) {
    const inicio = new Date(payload.fechaInicio);
    const fin = new Date(payload.fechaFin);
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
      errors.push(`Fila ${rowIdx}: Las fechas no tienen un formato válido`);
    } else if (inicio > fin) {
      errors.push(`Fila ${rowIdx}: La fecha de inicio no puede ser mayor que la fecha de fin`);
    }
  }

  return { rowIndex: rowIdx, payload, errors, isValid: errors.length === 0 };
}

// ────────────────────────────────────────────────────────────────
// VALIDACIÓN DE FILA DE COMPENSACIONES
// ────────────────────────────────────────────────────────────────
function validateCompensacionesRow(
  raw: Record<string, unknown>,
  rowIdx: number,
  detailY1: Record<string, unknown>[],
  detailY2: Record<string, unknown>[],
  detailY3: Record<string, unknown>[],
): RowResult {
  const errors: string[] = [];
  const payload: NuevaActividadPayload = { ...FORM_INICIAL };

  const idObligacion = String(raw['ID Obligación'] ?? '').trim();
  const obligacionKey = String(raw['ObligacionKey'] ?? idObligacion).trim();
  const lineaStr = String(raw['Línea Operativa'] ?? '').trim();
  const fechaCreacion = parseExcelDate(raw['Fecha Creación']);
  const actoTipo = String(raw['Acto - Tipo'] ?? '').trim();
  const actoNumero = String(raw['Acto - Número'] ?? '').trim();
  const actoFecha = parseExcelDate(raw['Acto - Fecha']);
  const permiso = String(raw['Permiso / Tipo de obligación'] ?? '').trim();
  const autoridad = String(raw['Autoridad Ambiental'] ?? '').trim();
  const jurisdiccionCorp = String(raw['Jurisdicción - Corporación'] ?? '').trim();
  const jurisdiccionDpto = String(raw['Jurisdicción - Departamento'] ?? '').trim();
  const jurisdiccionMun = String(raw['Jurisdicción - Municipio'] ?? '').trim();
  const jurisdiccionVer = String(raw['Jurisdicción - Vereda/Predio'] ?? '').trim();
  const expediente = String(raw['Expediente'] ?? '').trim();
  const categoria = String(raw['Categoría'] ?? '').trim();
  const sistema = String(raw['Sistema'] ?? '').trim();
  const sector = String(raw['Sector / Proyecto'] ?? '').trim();
  const zona = String(raw['Zona'] ?? '').trim();
  const fuenteStr = String(raw['Fuente Presupuesto'] ?? 'OPEX').trim();
  const tipoPlanStr = String(raw['Tipo Planeación'] ?? 'Plan').trim();
  const anioBase = Number(raw['Año Base']);
  const asignacionRecursos = String(raw['Asignación Recursos'] ?? 'No').trim().toLowerCase() === 'sí'
    || String(raw['Asignación Recursos'] ?? 'No').trim().toLowerCase() === 'si';
  const saldoDisponible = Number(raw['Saldo Disponible']) || 0;
  const aniosAPlanear = Math.max(1, Math.min(3, Number(raw['Años a Planear']) || 1));
  const contrato = String(raw['Contrato'] ?? '').trim();
  const itemsCambianPorAnio = String(raw['Items Cambian por Año'] ?? 'No').trim().toLowerCase().startsWith('s');
  const ivaActivo = String(raw['IVA Activo'] ?? 'No').trim().toLowerCase().startsWith('s');
  const ivaPorcentaje = Number(raw['IVA %']) || 19;
  const responsableStr = String(raw['Responsable'] ?? '').trim();

  // Validaciones
  if (!idObligacion) errors.push(`Fila ${rowIdx}: "ID Obligación" es obligatorio`);
  else if (!/^[A-Z]+_\d+$/.test(idObligacion)) errors.push(`Fila ${rowIdx}: "ID Obligación" debe tener formato COMP_NN o INV_NN`);
  if (!['Compensaciones estaciones', 'Compensaciones e Inv', 'Compensaciones provisiones'].includes(lineaStr)) {
    errors.push(`Fila ${rowIdx}: "Línea Operativa" debe ser "Compensaciones estaciones", "Compensaciones e Inv" o "Compensaciones provisiones"`);
  }
  if (!fechaCreacion) errors.push(`Fila ${rowIdx}: "Fecha Creación" es obligatoria`);
  if (!actoTipo) errors.push(`Fila ${rowIdx}: "Acto - Tipo" es obligatorio`);
  if (!actoNumero) errors.push(`Fila ${rowIdx}: "Acto - Número" es obligatorio`);
  if (!actoFecha) errors.push(`Fila ${rowIdx}: "Acto - Fecha" es obligatoria`);
  if (permiso && !TIPOS_PERMISO.includes(permiso)) errors.push(`Fila ${rowIdx}: "Permiso" no está en el catálogo`);
  if (autoridad && !AUTORIDADES_AMBIENTALES.includes(autoridad)) errors.push(`Fila ${rowIdx}: "Autoridad Ambiental" no está en el catálogo`);
  if (jurisdiccionCorp && !AUTORIDADES_AMBIENTALES.includes(jurisdiccionCorp)) errors.push(`Fila ${rowIdx}: "Jurisdicción - Corporación" no está en el catálogo`);
  if (jurisdiccionDpto && !DEPARTAMENTOS_LIST.includes(jurisdiccionDpto)) errors.push(`Fila ${rowIdx}: "Jurisdicción - Departamento" no está en el catálogo`);
  if (categoria && !CATEGORIAS_COMPENSACION.includes(categoria)) errors.push(`Fila ${rowIdx}: "Categoría" no está en el catálogo`);
  if (!zona) errors.push(`Fila ${rowIdx}: "Zona" es obligatoria`);
  else if (!ZONAS_COMPENSACIONES.includes(zona)) errors.push(`Fila ${rowIdx}: "Zona" no está en el catálogo`);
  if (!Number.isFinite(anioBase) || anioBase < 2024 || anioBase > 2032) errors.push(`Fila ${rowIdx}: "Año Base" debe ser entre 2024 y 2032`);
  if (!contrato) errors.push(`Fila ${rowIdx}: "Contrato" es obligatorio`);
  else if (!CONTRATOS_COMPENSACIONES.includes(contrato)) errors.push(`Fila ${rowIdx}: "Contrato" no está en el catálogo`);
  if (asignacionRecursos && saldoDisponible <= 0) errors.push(`Fila ${rowIdx}: Si "Asignación Recursos = Sí", "Saldo Disponible" debe ser > 0`);

  // Construir programación Año 1 (mensualizado) desde detailY1
  const ivaItemsExcluidos: string[] = [];
  let totalY1 = 0;
  let primerMesActivo: string | null = null;
  const opexMeses = MESES.map((mes) => ({
    mes, precio: 0, cantidad: 0, frecuencia: 1,
    preciosIndividuales: [] as any[], total: 0,
  }));
  const itemKeysY1: string[] = [];
  for (const det of detailY1) {
    const item = String(det['Ítem'] ?? det['Item'] ?? '').trim();
    if (!item || item === '(escribe el ítem)') continue;
    const precio = Number(det['Precio Unitario']) || 0;
    const aplicaIva = String(det['Aplica IVA'] ?? 'Sí').trim().toLowerCase().startsWith('s');
    if (!aplicaIva) ivaItemsExcluidos.push(item);
    itemKeysY1.push(item);
    MESES.forEach((mes, mi) => {
      const cantidad = Number(det[`Cantidad ${mes}`]) || 0;
      const ivaFactor = (ivaActivo && aplicaIva) ? (1 + ivaPorcentaje / 100) : 1;
      const total = precio * cantidad * ivaFactor;
      if (total > 0 && !primerMesActivo) primerMesActivo = mes;
      totalY1 += total;
      opexMeses[mi].preciosIndividuales.push({
        key: item, nombre: item, precio, cantidad, frecuencia: 1, aplicaIva, total,
      });
      opexMeses[mi].precio += precio;
      opexMeses[mi].total += total;
    });
  }

  // Construir programación Año 2 / Año 3 (anualizado)
  const buildAnual = (rows: Record<string, unknown>[]) => {
    const items: { key: string; nombre: string; precio: number; cantidad: number; total: number }[] = [];
    for (const det of rows) {
      const item = String(det['Ítem'] ?? det['Item'] ?? '').trim();
      if (!item || item === '(escribe el ítem)') continue;
      const precio = Number(det['Precio Unitario']) || 0;
      const cantidad = Number(det['Cantidad']) || 0;
      const aplicaIva = String(det['Aplica IVA'] ?? 'Sí').trim().toLowerCase().startsWith('s');
      const ivaFactor = (ivaActivo && aplicaIva) ? (1 + ivaPorcentaje / 100) : 1;
      const total = precio * cantidad * ivaFactor;
      items.push({ key: item, nombre: item, precio, cantidad, total });
    }
    return items;
  };
  const programacionY2 = aniosAPlanear >= 2 ? buildAnual(detailY2) : [];
  const programacionY3 = aniosAPlanear >= 3 ? buildAnual(detailY3) : [];

  // Si itemsCambian + Año 2/3 sin filas → si tampoco hereda, error
  if (itemsCambianPorAnio && aniosAPlanear >= 2 && programacionY2.length === 0) {
    errors.push(`Fila ${rowIdx}: "Items Cambian por Año = Sí" y "Años a Planear ≥ 2" pero la hoja "Detalle Año 2" no tiene ítems para esta obligación`);
  }
  if (itemsCambianPorAnio && aniosAPlanear === 3 && programacionY3.length === 0) {
    errors.push(`Fila ${rowIdx}: "Items Cambian por Año = Sí" y "Años a Planear = 3" pero la hoja "Detalle Año 3" no tiene ítems para esta obligación`);
  }

  // Si no itemsCambian y Y2/Y3 vacíos: heredar Año 1 (precios y cantidad anual = suma)
  if (!itemsCambianPorAnio && aniosAPlanear >= 2 && programacionY2.length === 0) {
    for (const k of itemKeysY1) {
      // Heredar precio (primer mes) y cantidad anual = sum cantidades del año 1
      const firstEntry = opexMeses[0].preciosIndividuales.find((p: any) => p.key === k);
      const precio = firstEntry?.precio ?? 0;
      const cantidad = opexMeses.reduce((s, mes) => s + (mes.preciosIndividuales.find((p: any) => p.key === k)?.cantidad ?? 0), 0);
      const aplicaIva = !ivaItemsExcluidos.includes(k);
      const ivaFactor = (ivaActivo && aplicaIva) ? (1 + ivaPorcentaje / 100) : 1;
      programacionY2.push({ key: k, nombre: k, precio, cantidad, total: precio * cantidad * ivaFactor });
    }
  }
  if (!itemsCambianPorAnio && aniosAPlanear === 3 && programacionY3.length === 0) {
    for (const k of itemKeysY1) {
      const firstEntry = opexMeses[0].preciosIndividuales.find((p: any) => p.key === k);
      const precio = firstEntry?.precio ?? 0;
      const cantidad = opexMeses.reduce((s, mes) => s + (mes.preciosIndividuales.find((p: any) => p.key === k)?.cantidad ?? 0), 0);
      const aplicaIva = !ivaItemsExcluidos.includes(k);
      const ivaFactor = (ivaActivo && aplicaIva) ? (1 + ivaPorcentaje / 100) : 1;
      programacionY3.push({ key: k, nombre: k, precio, cantidad, total: precio * cantidad * ivaFactor });
    }
  }

  const totalY2 = programacionY2.reduce((s, p) => s + p.total, 0);
  const totalY3 = programacionY3.reduce((s, p) => s + p.total, 0);
  const totalCombinado = totalY1 + totalY2 + totalY3;

  // Validar tope de saldo
  if (asignacionRecursos && saldoDisponible > 0 && totalCombinado > saldoDisponible) {
    errors.push(`Fila ${rowIdx}: Total combinado (${totalCombinado.toLocaleString('es-CO')}) excede el "Saldo Disponible" (${saldoDisponible.toLocaleString('es-CO')})`);
  }

  // Construir payload
  payload.tarea = `${lineaStr || 'Compensación'} — ${idObligacion}`;
  payload.lineaOperativa = (lineaStr || 'Compensaciones provisiones') as LineaOperativa;
  payload.descripcion = permiso ? `Permiso: ${permiso} | Acto: ${actoTipo} ${actoNumero}` : '';
  payload.responsable = responsableStr.replace(/\s*\(.+\)\s*$/, '').trim() || 'Sistema';
  payload.zona = zona;
  payload.tipoLugar = 'Zona';
  payload.estacion = '';
  payload.fuentePresupuesto = (['OPEX', 'CAPEX'].includes(fuenteStr) ? fuenteStr : 'OPEX') as FuentePresupuesto;
  payload.tipoPlaneacion = (['Plan', 'Adicional', 'Emergencia'].includes(tipoPlanStr) ? tipoPlanStr : 'Plan') as TipoPlaneacion;
  payload.anioPlaneacion = Number.isFinite(anioBase) ? anioBase : (new Date().getFullYear() + 1);
  payload.fechaInicio = `${payload.anioPlaneacion}-01-01`;
  payload.fechaFin = `${payload.anioPlaneacion + aniosAPlanear - 1}-12-31`;
  payload.mes = primerMesActivo ?? MESES[0];
  payload.cuenta = payload.fuentePresupuesto === 'CAPEX' ? 'CAPEX' : 'OPEX';
  payload.contrato = contrato;
  payload.presupuestoPlan = totalCombinado;
  payload.novedades = `Obligación ${idObligacion} — ${aniosAPlanear} año(s)`;

  payload.opexDataRaw = JSON.stringify({
    meses: opexMeses,
    zona, sistema, sector,
    obligacion: {
      id: idObligacion,
      fechaCreacion,
      actoAdministrativo: { tipo: actoTipo, numero: actoNumero, fecha: actoFecha },
      permiso, autoridad,
      jurisdiccion: {
        corporacion: jurisdiccionCorp,
        departamento: jurisdiccionDpto,
        municipio: jurisdiccionMun,
        veredaPredio: jurisdiccionVer,
      },
      expediente, categoria,
    },
    fuentePresupuesto: payload.fuentePresupuesto,
    tipoPlaneacion: payload.tipoPlaneacion,
    anioPlaneacion: payload.anioPlaneacion,
    asignacionRecursos,
    saldoDisponible: asignacionRecursos ? saldoDisponible : undefined,
    aniosAPlanear,
    contratoSeleccionado: contrato,
    programacionY2: aniosAPlanear >= 2 ? programacionY2 : undefined,
    programacionY3: aniosAPlanear >= 3 ? programacionY3 : undefined,
    itemsCambianPorAnio,
    ivaGlobalActivo: ivaActivo,
    ivaGlobalPorcentaje: ivaPorcentaje,
    ivaItemsExcluidos,
  });

  // Vincular obligacionKey al ID por si en el futuro se necesita re-key
  void obligacionKey;

  return { rowIndex: rowIdx, payload, errors, isValid: errors.length === 0 };
}

// ── Generador de plantilla (ExcelJS — soporta estilos reales) ──
async function generateTemplate(): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'GreenLog';
  wb.created = new Date();

  const C = {
    blueBase: '0033A0',
    blueOpex: '1A6FBF',
    greenP: '1B5E20',
    greenQ: '33691E',
    amber: '4E342E',
    redTotal: 'B71C1C',
    white: 'FFFFFFFF',
    grayHdr: 'FF37474F',
    borderClr: 'FFB0B0B0',
  };

  const border = (color = C.borderClr): Partial<ExcelJS.Borders> => ({
    top: { style: 'thin', color: { argb: color } },
    bottom: { style: 'thin', color: { argb: color } },
    left: { style: 'thin', color: { argb: color } },
    right: { style: 'thin', color: { argb: color } },
  });
  const hdrFont = (argb = C.white): Partial<ExcelJS.Font> => ({ bold: true, color: { argb }, size: 10, name: 'Calibri' });
  const dataFont = (): Partial<ExcelJS.Font> => ({ size: 10, name: 'Calibri' });
  const fill = (argb: string): ExcelJS.Fill => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });

  // ════════════════════════════════════════════════════════
  // HOJA 1: Actividades (cabecera)
  // ════════════════════════════════════════════════════════
  const ws = wb.addWorksheet('Actividades', {
    views: [{ state: 'frozen', ySplit: 1, xSplit: 0 }],
  });

  const activityHeaders = [
    'ActividadKey', 'Tarea', 'Línea Operativa', 'Descripción', 'Responsable',
    'Zona', 'Tipo Lugar', 'Estación', 'PK', 'Fuente Presupuesto', 'Tipo Planeación', 'Año',
    'Fecha Inicio', 'Fecha Fin', 'Estado', 'Prioridad', 'Tipo Cuenta', 'Matrices Ambientales', 'Novedades',
    'Proveedor', 'Objeto del Contrato', 'No. Contrato', 'Administrador',
  ];

  ws.columns = activityHeaders.map((h, i) => ({
    width: i === 1 || i === 3 || i === 20 ? 34 : i === 17 || i === 18 ? 26 : 18,
  }));

  const hdrRow = ws.addRow(activityHeaders);
  hdrRow.height = 34;
  hdrRow.eachCell((cell, c) => {
    cell.font = hdrFont();
    cell.fill = c <= 12 ? fill('FF' + C.blueBase) : fill('FF' + C.blueOpex);
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = border('FF' + C.blueBase);
  });

  const activityExamples = [
    [
      'MON-ZONA-001', 'Monitoreos ambientales zona CLC', 'Monitoreos', '', 'Maria Ximena Puerto',
      'CLC', 'Zona', '', '', 'OPEX', 'Plan', 2027,
      '2027-01-01', '2027-12-31', 'Planeada', 'Alta', 'OPEX', 'ARD,ARnD', '',
      'Chemilab', 'Servicios de monitoreo ambiental', 'CHM-2027-001', 'Claudia Falla',
    ],
    [
      'SER-001', 'Mantenimiento zonas verdes Oriente', 'Servicios Generales', '', 'Eliana Cortes',
      'Oriente', 'Zona', '', '', 'OPEX', 'Plan', 2027,
      '2027-01-01', '2027-12-31', 'Planeada', 'Media', 'OPEX', '', '',
      'ETSA', 'Servicio general por zona', 'ETSA-2027-014', 'Eliana Cortes',
    ],
  ];

  activityExamples.forEach((rowData, idx) => {
    const row = ws.addRow(rowData);
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = dataFont();
      cell.border = border();
      cell.alignment = { vertical: 'middle', wrapText: true };
      if (idx % 2 === 1) cell.fill = fill('FFECEFF1');
    });
  });
  ws.autoFilter = { from: 'A1', to: { row: 3, column: activityHeaders.length } };

  // ════════════════════════════════════════════════════════
  // HOJA 2: Detalle (ítem/parámetro × mes)
  // ════════════════════════════════════════════════════════
  const wsDet = wb.addWorksheet('Detalle', {
    views: [{ state: 'frozen', ySplit: 1, xSplit: 0 }],
  });

  const detailHeaders = [
    'ActividadKey', 'Estación', 'Matriz', 'Ítem / Parámetro', 'Precio Unitario', 'Puntos',
    ...MESES.flatMap((mes) => [`Cantidad ${mes}`, `Frecuencia ${mes}`, `Total ${mes}`]),
    'Total Anual',
  ];

  const COL_PRECIO_UNIT = 5;
  const COL_PUNTOS = 6;
  const COL_FIRST_MONTH = 7;
  const COL_TOTAL_ANIO = detailHeaders.length;

  wsDet.columns = [
    { width: 18 }, { width: 18 }, { width: 16 }, { width: 34 }, { width: 14 }, { width: 10 },
    ...Array(MESES.length * 3).fill(null).map((_, i) => ({ width: i % 3 === 0 ? 12 : i % 3 === 1 ? 12 : 14 })),
    { width: 16 },
  ];

  const detHdr = wsDet.addRow(detailHeaders);
  detHdr.height = 34;
  detHdr.eachCell((cell, c) => {
    cell.font = hdrFont();
    if (c <= 6) cell.fill = fill('FF' + C.blueBase);
    else if (c === COL_TOTAL_ANIO) cell.fill = fill('FF' + C.redTotal);
    else if ((c - COL_FIRST_MONTH) % 3 === 0) cell.fill = fill('FF' + C.greenQ);
    else if ((c - COL_FIRST_MONTH) % 3 === 1) cell.fill = fill('FF' + C.amber);
    else cell.fill = fill('FF' + C.blueOpex);
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = border('FF' + C.blueBase);
  });

  const detailExamples = [
    { key: 'MON-ZONA-001', estacion: 'Samoré', matriz: 'ARD', nombre: 'AMONIACO', precio: 852200, puntos: 1, meses: MESES.map((_, i) => ({ c: i === 0 ? 1 : 0, f: 1 })) },
    { key: 'MON-ZONA-001', estacion: 'Samoré', matriz: 'ARD', nombre: 'ARSENICO TOTAL', precio: 111400, puntos: 7, meses: MESES.map((_, i) => ({ c: i === 1 ? 1 : 0, f: 1 })) },
    { key: 'SER-001', estacion: '', matriz: '', nombre: 'Mantenimiento zonas verdes', precio: 250000, puntos: 1, meses: MESES.map(() => ({ c: 4, f: 1 })) },
  ];

  detailExamples.forEach((ex, idx) => {
    const rowValues: (string | number)[] = [ex.key, ex.estacion, ex.matriz, ex.nombre, ex.precio, ex.puntos];
    ex.meses.forEach(({ c, f }) => {
      rowValues.push(c);
      rowValues.push(f);
      rowValues.push(0);
    });
    rowValues.push(0);

    const row = wsDet.addRow(rowValues);
    const xlRowNum = row.number;
    row.eachCell({ includeEmpty: true }, (cell, c) => {
      cell.font = dataFont();
      cell.border = border();
      cell.alignment = { vertical: 'middle' };
      if (idx % 2 === 1) cell.fill = fill('FFECEFF1');
      if (c === COL_PRECIO_UNIT || c === COL_TOTAL_ANIO || (c >= COL_FIRST_MONTH && (c - COL_FIRST_MONTH) % 3 === 2)) {
        cell.numFmt = '$#,##0';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
    });

    MESES.forEach((_mes, mi) => {
      const colCant = COL_FIRST_MONTH + mi * 3;
      const colFreq = colCant + 1;
      const colTot = colCant + 2;
      const precioAddr = wsDet.getCell(xlRowNum, COL_PRECIO_UNIT).address;
      const puntosAddr = wsDet.getCell(xlRowNum, COL_PUNTOS).address;
      const cantAddr = wsDet.getCell(xlRowNum, colCant).address;
      const freqAddr = wsDet.getCell(xlRowNum, colFreq).address;
      const totalCell = wsDet.getCell(xlRowNum, colTot);
      totalCell.value = { formula: `${precioAddr}*${puntosAddr}*${cantAddr}*${freqAddr}`, result: ex.precio * ex.puntos * ex.meses[mi].c * ex.meses[mi].f } as ExcelJS.CellFormulaValue;
      totalCell.numFmt = '$#,##0';
    });

    const totalRefs = MESES.map((_m, mi) => wsDet.getCell(xlRowNum, COL_FIRST_MONTH + mi * 3 + 2).address).join('+');
    const totalAnioCell = wsDet.getCell(xlRowNum, COL_TOTAL_ANIO);
    totalAnioCell.value = { formula: totalRefs, result: ex.meses.reduce((s, m) => s + ex.precio * ex.puntos * m.c * m.f, 0) } as ExcelJS.CellFormulaValue;
    totalAnioCell.numFmt = '$#,##0';
    totalAnioCell.font = { ...dataFont(), bold: true, color: { argb: 'FF' + C.redTotal } };
  });
  wsDet.autoFilter = { from: 'A1', to: { row: 4, column: detailHeaders.length } };

  // ════════════════════════════════════════════════════════
  // HOJA 3: Catálogos
  // ════════════════════════════════════════════════════════
  const wsRef = wb.addWorksheet('Catálogos (Referencia)', {
    views: [{ state: 'frozen', ySplit: 1, xSplit: 0 }],
  });

  const responsablesRef = RESPONSABLES.map((r) => `${r.nombre} (${r.zona})`);
  const refHeaders = [
    'Líneas Operativas', 'Zonas', 'Tipos Lugar', 'Tipos Planeación', 'Fuentes Presupuesto',
    'Responsables', 'Estados', 'Prioridades', 'Tipos Cuenta', 'Matrices Ambientales', 'Proveedores/Contratos',
  ];
  const refCols = [
    VALID_LINEAS, VALID_ZONAS, VALID_TIPOS_LUGAR, VALID_TIPOS_PLANEACION, VALID_FUENTES,
    responsablesRef, VALID_ESTADOS, VALID_PRIORIDADES, VALID_CUENTAS, VALID_MATRICES, CONTRATOS,
  ];
  const maxLen = Math.max(...refCols.map((c) => c.length));

  wsRef.columns = refHeaders.map((h) => ({ width: Math.max(h.length + 4, 24) }));
  const refHdr = wsRef.addRow(refHeaders);
  refHdr.height = 28;
  refHdr.eachCell((cell) => {
    cell.font = hdrFont();
    cell.fill = fill(C.grayHdr);
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = border();
  });

  for (let r = 0; r < maxLen; r++) {
    const row = wsRef.addRow(refCols.map((col) => col[r] ?? ''));
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = dataFont();
      cell.border = border();
      cell.alignment = { vertical: 'middle' };
      if (r % 2 === 1) cell.fill = fill('FFECEFF1');
    });
  }
  wsRef.autoFilter = { from: 'A1', to: { row: maxLen + 1, column: refHeaders.length } };

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'PlantillaCargaMasiva_GreenLog.xlsx';
  anchor.click();
  URL.revokeObjectURL(url);
}

// ════════════════════════════════════════════════════════════════
// PLANTILLA COMPENSACIONES
// ════════════════════════════════════════════════════════════════
async function generateTemplateCompensaciones(): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'GreenLog';
  wb.created = new Date();

  const C = {
    orange: 'FFE65100', // Header obligaciones (paleta naranja para distinguir de la genérica)
    amber: 'FFF57C00',
    greenP: 'FF1B5E20',
    greenQ: 'FF33691E',
    blueOpex: 'FF1A6FBF',
    redTotal: 'FFB71C1C',
    white: 'FFFFFFFF',
    grayHdr: 'FF37474F',
    borderClr: 'FFB0B0B0',
  };
  const border = (color = C.borderClr): Partial<ExcelJS.Borders> => ({
    top: { style: 'thin', color: { argb: color } },
    bottom: { style: 'thin', color: { argb: color } },
    left: { style: 'thin', color: { argb: color } },
    right: { style: 'thin', color: { argb: color } },
  });
  const hdrFont = (argb = C.white): Partial<ExcelJS.Font> => ({ bold: true, color: { argb }, size: 10, name: 'Calibri' });
  const dataFont = (): Partial<ExcelJS.Font> => ({ size: 10, name: 'Calibri' });
  const fill = (argb: string): ExcelJS.Fill => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });

  // ──────────────────────────────────────────────────────────────
  // Hoja 1: Obligaciones (1 fila por obligación)
  // ──────────────────────────────────────────────────────────────
  const ws = wb.addWorksheet('Obligaciones', { views: [{ state: 'frozen', ySplit: 1, xSplit: 0 }] });

  const obligacionesHeaders = [
    'ObligacionKey', 'ID Obligación', 'Línea Operativa', 'Fecha Creación',
    'Acto - Tipo', 'Acto - Número', 'Acto - Fecha',
    'Permiso / Tipo de obligación', 'Autoridad Ambiental',
    'Jurisdicción - Corporación', 'Jurisdicción - Departamento',
    'Jurisdicción - Municipio', 'Jurisdicción - Vereda/Predio',
    'Expediente', 'Categoría',
    'Sistema', 'Sector / Proyecto', 'Zona',
    'Fuente Presupuesto', 'Tipo Planeación', 'Año Base',
    'Asignación Recursos', 'Saldo Disponible',
    'Años a Planear', 'Contrato',
    'Items Cambian por Año', 'IVA Activo', 'IVA %',
    'Responsable',
  ];

  ws.columns = obligacionesHeaders.map((h) => ({
    width: h.length > 25 ? 28 : h.length > 14 ? 22 : 16,
  }));

  const hdrRow = ws.addRow(obligacionesHeaders);
  hdrRow.height = 36;
  hdrRow.eachCell((cell, c) => {
    cell.font = hdrFont();
    cell.fill = c <= 7 ? fill(C.orange) : fill(C.amber);
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = border(C.orange);
  });

  // Pre-cargar las primeras N obligaciones reales como ejemplos editables
  const SAMPLE_LIMIT = 30;
  const samples = OBLIGACIONES_SEED.slice(0, SAMPLE_LIMIT);

  // Mapear el ID de "Línea Operativa" según prefijo del ID (COMP_* o INV_*)
  const lineaFromId = (id: string): LineaOperativa =>
    id.startsWith('INV_') ? 'Compensaciones e Inv' : 'Compensaciones provisiones';

  samples.forEach((s, idx) => {
    const row = ws.addRow([
      s.idObligacion,                          // ObligacionKey
      s.idObligacion,                          // ID Obligación
      lineaFromId(s.idObligacion),             // Línea Operativa
      new Date().toISOString().slice(0, 10),   // Fecha Creación (hoy)
      s.actoTipo || 'Resolución',              // Acto - Tipo
      s.actoNumero,                            // Acto - Número
      s.actoFecha,                             // Acto - Fecha
      s.permiso,                               // Permiso
      s.autoridadEmite,                        // Autoridad Ambiental
      '',                                      // Jurisdicción - Corporación (a llenar)
      '',                                      // Jurisdicción - Departamento
      '',                                      // Jurisdicción - Municipio
      '',                                      // Jurisdicción - Vereda/Predio
      s.expediente,                            // Expediente
      s.categoria,                             // Categoría
      s.sistema,                               // Sistema
      s.sector,                                // Sector / Proyecto
      s.zona,                                  // Zona
      s.fuentePresupuesto,                     // Fuente Presupuesto
      'Plan',                                  // Tipo Planeación
      new Date().getFullYear() + 1,            // Año Base
      s.saldoDisponible > 0 ? 'Sí' : 'No',     // Asignación Recursos
      s.saldoDisponible || '',                 // Saldo Disponible
      1,                                       // Años a Planear
      'BQS',                                   // Contrato
      'No',                                    // Items Cambian por Año
      'No',                                    // IVA Activo
      19,                                      // IVA %
      s.responsable,                           // Responsable
    ]);
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = dataFont();
      cell.border = border();
      cell.alignment = { vertical: 'middle', wrapText: true };
      if (idx % 2 === 1) cell.fill = fill('FFFFF8E1');
    });
  });
  ws.autoFilter = { from: 'A1', to: { row: samples.length + 1, column: obligacionesHeaders.length } };

  // ──────────────────────────────────────────────────────────────
  // Hoja 2: Detalle Año 1 (mensualizado)
  // ──────────────────────────────────────────────────────────────
  const wsY1 = wb.addWorksheet('Detalle Año 1', { views: [{ state: 'frozen', ySplit: 1, xSplit: 0 }] });

  const y1Headers = [
    'ObligacionKey', 'Ítem', 'Precio Unitario', 'Aplica IVA',
    ...MESES.flatMap((m) => [`Cantidad ${m}`, `Total ${m}`]),
    'Total Anual',
  ];
  const Y1_PRECIO = 3;
  const Y1_IVA = 4;
  const Y1_FIRST = 5;
  const Y1_TOTAL = y1Headers.length;

  wsY1.columns = [
    { width: 18 }, { width: 32 }, { width: 14 }, { width: 12 },
    ...Array(MESES.length * 2).fill(null).map((_, i) => ({ width: i % 2 === 0 ? 12 : 14 })),
    { width: 16 },
  ];
  const y1Hdr = wsY1.addRow(y1Headers);
  y1Hdr.height = 34;
  y1Hdr.eachCell((cell, c) => {
    cell.font = hdrFont();
    if (c <= 4) cell.fill = fill(C.orange);
    else if (c === Y1_TOTAL) cell.fill = fill(C.redTotal);
    else if ((c - Y1_FIRST) % 2 === 0) cell.fill = fill(C.greenQ);
    else cell.fill = fill(C.blueOpex);
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = border(C.orange);
  });

  // Una fila de ejemplo por cada una de las primeras obligaciones (vacía: sin cantidades)
  samples.slice(0, 3).forEach((s, idx) => {
    const rowVals: (string | number)[] = [s.idObligacion, '(escribe el ítem)', 0, 'Sí'];
    MESES.forEach(() => { rowVals.push(0); rowVals.push(0); });
    rowVals.push(0);
    const row = wsY1.addRow(rowVals);
    const xlRow = row.number;
    row.eachCell({ includeEmpty: true }, (cell, c) => {
      cell.font = dataFont();
      cell.border = border();
      cell.alignment = { vertical: 'middle' };
      if (idx % 2 === 1) cell.fill = fill('FFFFF8E1');
      if (c === Y1_PRECIO || c === Y1_TOTAL || (c >= Y1_FIRST && (c - Y1_FIRST) % 2 === 1)) {
        cell.numFmt = '$#,##0';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
    });
    // Fórmula Total mensual = Precio * Cantidad * (1 + (IVA?19:0)/100)
    MESES.forEach((_m, mi) => {
      const colCant = Y1_FIRST + mi * 2;
      const colTot = colCant + 1;
      const precioAddr = wsY1.getCell(xlRow, Y1_PRECIO).address;
      const ivaAddr = wsY1.getCell(xlRow, Y1_IVA).address;
      const cantAddr = wsY1.getCell(xlRow, colCant).address;
      const totalCell = wsY1.getCell(xlRow, colTot);
      totalCell.value = {
        formula: `${precioAddr}*${cantAddr}*(1+IF(${ivaAddr}="Sí",0.19,0))`,
        result: 0,
      } as ExcelJS.CellFormulaValue;
      totalCell.numFmt = '$#,##0';
    });
    // Total anual
    const totalRefs = MESES.map((_m, mi) => wsY1.getCell(xlRow, Y1_FIRST + mi * 2 + 1).address).join('+');
    const totalAnioCell = wsY1.getCell(xlRow, Y1_TOTAL);
    totalAnioCell.value = { formula: totalRefs, result: 0 } as ExcelJS.CellFormulaValue;
    totalAnioCell.numFmt = '$#,##0';
    totalAnioCell.font = { ...dataFont(), bold: true, color: { argb: C.redTotal } };
  });
  wsY1.autoFilter = { from: 'A1', to: { row: 4, column: y1Headers.length } };

  // ──────────────────────────────────────────────────────────────
  // Hojas 3 y 4: Detalle Año 2 / Año 3 (anualizado)
  // ──────────────────────────────────────────────────────────────
  const buildYearlySheet = (name: string) => {
    const wsy = wb.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1, xSplit: 0 }] });
    const headers = ['ObligacionKey', 'Ítem', 'Precio Unitario', 'Cantidad', 'Aplica IVA', 'Total Anual'];
    wsy.columns = [{ width: 18 }, { width: 32 }, { width: 14 }, { width: 12 }, { width: 12 }, { width: 16 }];
    const h = wsy.addRow(headers);
    h.height = 32;
    h.eachCell((cell, c) => {
      cell.font = hdrFont();
      if (c <= 5) cell.fill = fill(C.orange);
      else cell.fill = fill(C.redTotal);
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = border(C.orange);
    });
    // Una fila vacía de ejemplo
    const r = wsy.addRow(['(opcional)', '(escribe el ítem)', 0, 0, 'Sí', 0]);
    const xlRow = r.number;
    r.eachCell({ includeEmpty: true }, (cell, c) => {
      cell.font = dataFont();
      cell.border = border();
      cell.alignment = { vertical: 'middle' };
      if (c === 3 || c === 6) {
        cell.numFmt = '$#,##0';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
    });
    // Fórmula: Total = Precio*Cantidad*(1 + (IVA?19:0)/100)
    const precioA = wsy.getCell(xlRow, 3).address;
    const cantA = wsy.getCell(xlRow, 4).address;
    const ivaA = wsy.getCell(xlRow, 5).address;
    const totalCell = wsy.getCell(xlRow, 6);
    totalCell.value = {
      formula: `${precioA}*${cantA}*(1+IF(${ivaA}="Sí",0.19,0))`,
      result: 0,
    } as ExcelJS.CellFormulaValue;
    totalCell.numFmt = '$#,##0';
    return wsy;
  };
  buildYearlySheet('Detalle Año 2');
  buildYearlySheet('Detalle Año 3');

  // ──────────────────────────────────────────────────────────────
  // Hoja 5: Catálogos (Referencia)
  // ──────────────────────────────────────────────────────────────
  const wsRef = wb.addWorksheet('Catálogos (Referencia)', { views: [{ state: 'frozen', ySplit: 1, xSplit: 0 }] });
  const responsablesRef = RESPONSABLES.map((r) => `${r.nombre} (${r.zona})`);
  const refHeaders = [
    'Líneas Compensaciones', 'Zonas', 'Sistemas', 'Tipos Acto',
    'Permisos / Tipos Obligación', 'Autoridades Ambientales', 'Departamentos',
    'Categorías', 'Contratos', 'Tipos Planeación', 'Fuentes Presupuesto', 'Responsables',
  ];
  const refCols: string[][] = [
    ['Compensaciones estaciones', 'Compensaciones e Inv', 'Compensaciones provisiones'],
    ZONAS_COMPENSACIONES,
    SISTEMAS_CENIT as string[],
    TIPOS_ACTO as string[],
    TIPOS_PERMISO as string[],
    AUTORIDADES_AMBIENTALES as string[],
    DEPARTAMENTOS_LIST,
    CATEGORIAS_COMPENSACION as string[],
    CONTRATOS_COMPENSACIONES as string[],
    TIPOS_PLANEACION.map((t) => t.value),
    FUENTES_PRESUPUESTO.map((f) => f.value),
    responsablesRef,
  ];
  const maxLen = Math.max(...refCols.map((c) => c.length));
  wsRef.columns = refHeaders.map((h) => ({ width: Math.max(h.length + 4, 26) }));
  const refHdr = wsRef.addRow(refHeaders);
  refHdr.height = 28;
  refHdr.eachCell((cell) => {
    cell.font = hdrFont();
    cell.fill = fill(C.grayHdr);
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = border();
  });
  for (let r = 0; r < maxLen; r++) {
    const row = wsRef.addRow(refCols.map((col) => col[r] ?? ''));
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = dataFont();
      cell.border = border();
      cell.alignment = { vertical: 'middle' };
      if (r % 2 === 1) cell.fill = fill('FFECEFF1');
    });
  }
  wsRef.autoFilter = { from: 'A1', to: { row: maxLen + 1, column: refHeaders.length } };

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'PlantillaCargaMasiva_Compensaciones.xlsx';
  anchor.click();
  URL.revokeObjectURL(url);
}

// ── Props ─────────────────────────────────────────────────────
interface BulkUploadPanelProps {
  open: boolean;
  onClose: () => void;
  onUpload: (payloads: NuevaActividadPayload[]) => Promise<BulkUploadResult>;
  guardando: boolean;
}

// ── Componente ────────────────────────────────────────────────
export const BulkUploadPanel: React.FC<BulkUploadPanelProps> = ({
  open, onClose, onUpload, guardando,
}) => {
  const styles = useStyles();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [results, setResults] = useState<RowResult[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [uploadDone, setUploadDone] = useState(false);
  const [uploadSummary, setUploadSummary] = useState<BulkUploadResult | null>(null);
  const [uploading, setUploading] = useState(false);

  const validRows = results.filter((r) => r.isValid);
  const invalidRows = results.filter((r) => !r.isValid);
  const allErrors = results.flatMap((r) => r.errors);

  const resetState = useCallback(() => {
    setFileName(null);
    setResults([]);
    setParseError(null);
    setUploadDone(false);
    setUploadSummary(null);
    setUploading(false);
  }, []);

  const processFile = useCallback((file: File) => {
    resetState();
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array', cellDates: false });

        // Detectar tipo de plantilla por presencia de hoja "Obligaciones"
        const sheetNamesLower = wb.SheetNames.map(n => n.toLowerCase());
        const isCompensaciones = sheetNamesLower.includes('obligaciones');

        if (isCompensaciones) {
          // ── Flujo Compensaciones ──
          const wsObl = wb.Sheets[wb.SheetNames.find(n => n.toLowerCase() === 'obligaciones')!];
          const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wsObl, { defval: '' });
          if (rows.length === 0) { setParseError('La hoja Obligaciones está vacía o no tiene encabezados válidos.'); return; }

          const findSheet = (label: string) => wb.SheetNames.find(n => n.toLowerCase() === label.toLowerCase());
          const y1Name = findSheet('Detalle Año 1');
          const y2Name = findSheet('Detalle Año 2');
          const y3Name = findSheet('Detalle Año 3');
          const readDetail = (name: string | undefined) => name
            ? XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[name], { defval: '' })
            : [];
          const y1Rows = readDetail(y1Name);
          const y2Rows = readDetail(y2Name);
          const y3Rows = readDetail(y3Name);

          const groupBy = (list: Record<string, unknown>[]) => {
            const m = new Map<string, Record<string, unknown>[]>();
            for (const r of list) {
              const k = String(r['ObligacionKey'] ?? '').trim();
              if (!k) continue;
              if (!m.has(k)) m.set(k, []);
              m.get(k)!.push(r);
            }
            return m;
          };
          const g1 = groupBy(y1Rows);
          const g2 = groupBy(y2Rows);
          const g3 = groupBy(y3Rows);

          const validated = rows.map((row, i) => {
            const key = String(row['ObligacionKey'] ?? row['ID Obligación'] ?? `OBL-${i}`).trim();
            return validateCompensacionesRow(
              row, i + 2,
              g1.get(key) ?? [],
              g2.get(key) ?? [],
              g3.get(key) ?? [],
            );
          });
          setResults(validated);
          return;
        }

        // ── Flujo genérico (Monitoreos / Servicios / etc.) ──
        const ws = wb.Sheets[wb.SheetNames[0]];
        if (!ws) { setParseError('El archivo no contiene hojas de cálculo.'); return; }

        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
        if (rows.length === 0) { setParseError('La hoja Actividades está vacía o no tiene encabezados válidos.'); return; }

        const detailSheetName = wb.SheetNames.find((name, idx) => idx > 0 && name.toLowerCase().includes('detalle'));
        const detailRows = detailSheetName
          ? XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[detailSheetName], { defval: '' })
          : [];

        const detailGroups = new Map<string, Record<string, unknown>[]>();
        for (const det of detailRows) {
          const key = String(det['ActividadKey'] ?? '').trim();
          if (!key) continue;
          if (!detailGroups.has(key)) detailGroups.set(key, []);
          detailGroups.get(key)!.push(det);
        }

        const validated = rows.map((row, i) => {
          const key = getActivityKey(row, i + 2);
          return validateRow(row, i + 2, detailGroups.get(key) ?? []);
        });

        setResults(validated);
      } catch (err) {
        setParseError(`Error al leer el archivo: ${err instanceof Error ? err.message : 'desconocido'}`);
      }
    };
    reader.readAsArrayBuffer(file);
  }, [resetState]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && /\.xlsx?$/i.test(file.name)) {
      processFile(file);
    } else {
      setParseError('Por favor selecciona un archivo .xlsx o .xls');
    }
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = ''; // Reset to allow re-selection
  }, [processFile]);

  const handleUpload = useCallback(async () => {
    if (validRows.length === 0) return;
    setUploading(true);
    setParseError(null);
    try {
      const summary = await onUpload(validRows.map((r) => r.payload));
      setUploadSummary(summary);
      setUploadDone(true);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Error al cargar las actividades. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  }, [validRows, onUpload]);

  // Preview columns
  const previewCols: TableColumnDefinition<RowResult>[] = [
    createTableColumn({
      columnId: 'status',
      renderHeaderCell: () => '',
      renderCell: (item) => item.isValid
        ? <CheckmarkCircleRegular style={{ color: '#16a34a', fontSize: '16px' }} />
        : <ErrorCircleRegular style={{ color: '#EF4444', fontSize: '16px' }} />,
    }),
    createTableColumn({
      columnId: 'fila',
      renderHeaderCell: () => '#',
      renderCell: (item) => <span style={{ fontSize: '12px' }}>{item.rowIndex}</span>,
    }),
    createTableColumn({
      columnId: 'tarea',
      renderHeaderCell: () => 'Tarea',
      renderCell: (item) => (
        <span style={{ fontSize: '12px', fontWeight: 500 }}>
          {item.payload.tarea || <em style={{ color: '#999' }}>Vacío</em>}
        </span>
      ),
    }),
    createTableColumn({
      columnId: 'zona',
      renderHeaderCell: () => 'Zona',
      renderCell: (item) => <span style={{ fontSize: '12px' }}>{item.payload.zona || '—'}</span>,
    }),
    createTableColumn({
      columnId: 'responsable',
      renderHeaderCell: () => 'Responsable',
      renderCell: (item) => <span style={{ fontSize: '12px' }}>{item.payload.responsable || '—'}</span>,
    }),
    createTableColumn({
      columnId: 'estado',
      renderHeaderCell: () => 'Estado',
      renderCell: (item) => <span style={{ fontSize: '12px' }}>{item.payload.estado}</span>,
    }),
    createTableColumn({
      columnId: 'errores',
      renderHeaderCell: () => 'Errores',
      renderCell: (item) => item.errors.length > 0
        ? <Badge appearance="tint" color="danger" shape="rounded">{item.errors.length}</Badge>
        : <span style={{ fontSize: '12px', color: '#16a34a' }}>OK</span>,
    }),
  ];

  return (
    <Dialog open={open} onOpenChange={(_, s) => { if (!s.open) { resetState(); onClose(); } }}>
      <DialogSurface className={styles.surface}>
        <DialogTitle
          action={
            <Button
              appearance="subtle"
              icon={<DismissRegular />}
              onClick={() => { resetState(); onClose(); }}
            />
          }
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <DocumentTableRegular style={{ fontSize: '24px', color: CENIT_COLORS.blueLight }} />
            <span>Carga Masiva de Actividades</span>
          </div>
        </DialogTitle>

        <DialogBody>
          <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Success state */}
            {uploadDone ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <CheckmarkCircleRegular style={{ fontSize: '64px', color: '#16a34a', display: 'block', margin: '0 auto 16px' }} />
                <Subtitle2 style={{ color: '#14532d' }}>
                  {uploadSummary?.failedCount
                    ? `Se crearon ${uploadSummary.createdCount} actividades y ${uploadSummary.failedCount} fallaron`
                    : `¡${uploadSummary?.createdCount ?? validRows.length} actividades creadas exitosamente!`}
                </Subtitle2>
                <Body2 style={{ color: '#4B5563', marginTop: '8px' }}>
                  {uploadSummary?.failedCount
                    ? 'La carga terminó con observaciones. Revisa el resumen antes de cerrar.'
                    : 'Las actividades fueron registradas en el módulo de planeación.'}
                </Body2>
                {!!uploadSummary?.failedCount && (
                  <MessageBar intent="warning" style={{ marginTop: '16px', textAlign: 'left' }}>
                    <MessageBarBody>
                      <MessageBarTitle>Carga parcial</MessageBarTitle>
                      {uploadSummary.errors.slice(0, 5).join(' ')}
                    </MessageBarBody>
                  </MessageBar>
                )}
              </div>
            ) : (
              <>
                {/* Drop zone */}
                <div
                  className={`${styles.dropZone} ${dragging ? styles.dropZoneActive : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ArrowUploadRegular className={styles.dropIcon} />
                  <Body1 style={{ fontWeight: 600, color: CENIT_COLORS.blueBrand }}>
                    Arrastra tu archivo Excel aquí
                  </Body1>
                  <Caption1 style={{ color: tokens.colorNeutralForeground3, marginTop: '4px' }}>
                    o haz clic para seleccionar · Solo archivos .xlsx
                  </Caption1>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                  />
                </div>

                {/* Template downloads */}
                <div className={styles.templateSection}>
                  <div style={{ flex: 1 }}>
                    <Body2 style={{ fontWeight: 600 }}>¿No tienes la plantilla?</Body2>
                    <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                      Elige la plantilla según el tipo de actividad. El sistema detecta automáticamente cuál subiste.
                    </Caption1>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Button
                      appearance="secondary"
                      icon={<ArrowDownloadRegular />}
                      onClick={() => { generateTemplate(); }}
                      size="small"
                      style={{ borderRadius: '10px' }}
                    >
                      Genérica (Monitoreos / Servicios)
                    </Button>
                    <Button
                      appearance="primary"
                      icon={<ArrowDownloadRegular />}
                      onClick={() => { generateTemplateCompensaciones(); }}
                      size="small"
                      style={{ borderRadius: '10px' }}
                    >
                      Compensaciones (Provisiones)
                    </Button>
                  </div>
                </div>

                {/* Parse error */}
                {parseError && (
                  <MessageBar intent="error">
                    <MessageBarBody>
                      <MessageBarTitle>Error</MessageBarTitle>
                      {parseError}
                    </MessageBarBody>
                  </MessageBar>
                )}

                {/* File loaded — show results */}
                {fileName && results.length > 0 && (
                  <>
                    <div className={styles.fileInfo}>
                      <DocumentTableRegular style={{ fontSize: '20px', color: CENIT_COLORS.blueLight }} />
                      <div style={{ flex: 1 }}>
                        <Body2 style={{ fontWeight: 600 }}>{fileName}</Body2>
                        <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                          {results.length} filas detectadas
                        </Caption1>
                      </div>
                      <Button appearance="subtle" size="small" onClick={resetState}>
                        Cambiar archivo
                      </Button>
                    </div>

                    {/* Summary */}
                    <div className={styles.summaryRow}>
                      <div className={styles.summaryCard}>
                        <CheckmarkCircleRegular style={{ color: '#16a34a' }} />
                        <span style={{ color: '#14532d' }}>{validRows.length} válidas</span>
                      </div>
                      {invalidRows.length > 0 && (
                        <div className={styles.summaryCard}>
                          <ErrorCircleRegular style={{ color: '#EF4444' }} />
                          <span style={{ color: '#991b1b' }}>{invalidRows.length} con errores</span>
                        </div>
                      )}
                    </div>

                    {/* Error details */}
                    {allErrors.length > 0 && (
                      <div className={styles.errorList}>
                        {allErrors.map((err, i) => (
                          <div key={i} style={{ marginBottom: '2px' }}>• {err}</div>
                        ))}
                      </div>
                    )}

                    {/* Preview table */}
                    <div className={styles.previewWrap}>
                      <DataGrid
                        items={results}
                        columns={previewCols}
                        getRowId={(item) => String(item.rowIndex)}
                        style={{ width: '100%' }}
                      >
                        <DataGridHeader>
                          <DataGridRow>
                            {({ renderHeaderCell }) => (
                              <DataGridHeaderCell style={{ fontWeight: 600, fontSize: '12px' }}>
                                {renderHeaderCell()}
                              </DataGridHeaderCell>
                            )}
                          </DataGridRow>
                        </DataGridHeader>
                        <DataGridBody<RowResult>>
                          {({ item, rowId }) => (
                            <DataGridRow<RowResult> key={rowId}>
                              {({ renderCell }) => (
                                <DataGridCell>{renderCell(item)}</DataGridCell>
                              )}
                            </DataGridRow>
                          )}
                        </DataGridBody>
                      </DataGrid>
                    </div>
                  </>
                )}
              </>
            )}
          </DialogContent>
        </DialogBody>

        <DialogActions style={{ padding: '16px 24px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Button
            appearance="secondary"
            onClick={() => { resetState(); onClose(); }}
            disabled={uploading || guardando}
          >
            {uploadDone ? 'Cerrar' : 'Cancelar'}
          </Button>

          {!uploadDone && validRows.length > 0 && (
            <Button
              appearance="primary"
              icon={uploading || guardando ? <Spinner size="tiny" /> : <ArrowUploadRegular />}
              disabled={uploading || guardando || validRows.length === 0}
              onClick={handleUpload}
              style={{
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
                borderRadius: '10px',
              }}
            >
              {uploading || guardando
                ? 'Cargando...'
                : `Cargar ${validRows.length} actividad${validRows.length === 1 ? '' : 'es'}`
              }
            </Button>
          )}
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};
