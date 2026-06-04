import React, { useCallback, useEffect, useState } from 'react';
import {
  makeStyles, shorthands, tokens,
  Title2, Body1, Button, MessageBar, MessageBarBody, MessageBarTitle, Divider,
  Tooltip,
} from '@fluentui/react-components';
import { AddRegular, ArrowUploadRegular, DocumentArrowDownRegular } from '@fluentui/react-icons';
import { ActividadAmbiental, NuevaActividadPayload } from '../../types';
import { useActividades } from '../../hooks/useActividades';
import { ActivityTable } from './ActivityTable';
import { ActivityForm } from './ActivityForm';
import { ActivityDetailPanel } from './ActivityDetailPanel';
import { BulkUploadPanel, BulkUploadResult } from './BulkUploadPanel';
import { PlaneacionWizard, PlaneacionWizardResult, PlaneacionInitialData } from './PlaneacionWizard';
import { exportOpexToExcel, exportDetalleInternoToExcel } from '../../utils/exportOpex';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalL),
    animationName: {
      from: { opacity: '0', transform: 'translateY(8px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    },
    animationDuration: '0.35s',
    animationFillMode: 'both',
    animationTimingFunction: 'cubic-bezier(0.16,1,0.3,1)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    ...shorthands.gap(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    background: 'linear-gradient(90deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 100%)',
    backdropFilter: 'blur(10px)',
    ...shorthands.padding('24px'),
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
    marginBottom: tokens.spacingVerticalL,
    border: '1px solid rgba(255,255,255,0.5)',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
  },
  headerButtons: {
    display: 'flex',
    ...shorthands.gap('10px'),
    alignItems: 'center',
  },
  subtitle: { color: tokens.colorNeutralForeground2 },
});

export const PlaneacionModule: React.FC = () => {
  const styles = useStyles();

  const { actividades, cargando, errorCarga, guardando, recargar, crear, actualizar, eliminar } = useActividades();

  // Panel states
  const [drawerAbierto, setDrawerAbierto]       = useState(false);
  const [actividadEditar, setActividadEditar]   = useState<ActividadAmbiental | null>(null);
  const [detalleItem, setDetalleItem]            = useState<ActividadAmbiental | null>(null);
  const [detalleAbierto, setDetalleAbierto]      = useState(false);
  const [bulkAbierto, setBulkAbierto]            = useState(false);

  const [wizardAbierto, setWizardAbierto]        = useState(false);

  // Initial data para edición del wizard
  const [planeacionInitial, setPlaneacionInitial] = useState<PlaneacionInitialData | null>(null);

  // Notifications
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  const [toastOk, setToastOk]           = useState(false);
  const [toastMsg, setToastMsg]         = useState('La nueva actividad fue guardada exitosamente.');

  // Auto-ocultar toast de éxito
  useEffect(() => {
    if (!toastOk) return;
    const t = setTimeout(() => setToastOk(false), 4000);
    return () => clearTimeout(t);
  }, [toastOk]);

  // ── Handlers ──────────────────────────────────────────────
  const handleGuardar = useCallback(async (payload: NuevaActividadPayload) => {
    setErrorGuardar(null);
    try {
      if (actividadEditar) {
        await actualizar(actividadEditar.id, payload);
        setToastMsg('La actividad fue actualizada exitosamente.');
      } else {
        await crear(payload);
        setToastMsg('La nueva actividad fue guardada exitosamente.');
      }
      setDrawerAbierto(false);
      setActividadEditar(null);
      setToastOk(true);
    } catch (err) {
      setErrorGuardar(err instanceof Error ? err.message : 'Error inesperado al guardar.');
    }
  }, [crear, actualizar, actividadEditar]);

  const handleItemClick = useCallback((item: ActividadAmbiental) => {
    setDetalleItem(item);
    setDetalleAbierto(true);
  }, []);

  const handleDetailClose = useCallback(() => {
    setDetalleAbierto(false);
  }, []);

  const handleDetailEdit = useCallback((actividad: ActividadAmbiental) => {
    setDetalleAbierto(false);
    setActividadEditar(actividad);
    setErrorGuardar(null);

    // Reconstruir initialData desde opexDataRaw
    let opx: any = null;
    try { opx = actividad.opexDataRaw ? JSON.parse(actividad.opexDataRaw) : null; } catch { /* noop */ }

    if (opx?.meses) {
      // Reconstruir initial para PlaneacionWizard
      setPlaneacionInitial({
        lineaOperativa: actividad.lineaOperativa,
        zona:           actividad.zona    ?? '',
        tipoLugar:      (actividad as any).tipoLugar ?? 'Estación',
        estacion:       actividad.estacion ?? '',
        pk:             (actividad as any).pk ?? '',
        fuentePresupuesto: (actividad as any).fuentePresupuesto ?? 'OPEX',
        tipoPlaneacion:    (actividad as any).tipoPlaneacion ?? 'Plan',
        anioPlaneacion:    (actividad as any).anioPlaneacion ?? new Date().getFullYear() + 1,
        servicioEComplejidad: opx.servicioEComplejidad,
        ivaGlobalActivo: opx.ivaGlobalActivo ?? false,
        ivaGlobalPorcentaje: opx.ivaGlobalPorcentaje ?? 19,
        ivaMeses: opx.ivaMeses ?? [],
        datosAuxiliaresPresupuestales: {
          contrato:              opx.contrato     ?? actividad.contrato ?? '',
          proveedor:             opx.proveedor    ?? '',
          objeto:                opx.objeto       ?? '',
          administrador:         opx.administrador ?? actividad.responsable ?? '',
          supervisor:            opx.supervisor   ?? '',
          fechaInicio:           opx.fechaInicio  ?? actividad.fechaInicio ?? '',
          fechaFin:              opx.fechaFin     ?? actividad.fechaFin    ?? '',
          estadoContrato:        opx.estadoContrato        ?? 'VIGENTE',
          procesoAbastecimiento: opx.procesoAbastecimiento ?? 'Ejecución contractual',
          descripcionNecesidad:  opx.descripcionNecesidad  ?? '',
        },
        programacion:   opx.meses.map((m: any, i: number) => ({
          mes:               m.mes,
          mesIndex:          i,
          cantidad:          m.cantidad ?? 0,
          frecuencia:        m.frecuencia ?? 1,
          precio:            m.precio   ?? 0,
          preciosIndividuales: [],
          total:             m.total    ?? 0,
        })),
      });
      setWizardAbierto(true);
    } else {
      // Sin opexDataRaw — abrir el form manual como fallback
      setPlaneacionInitial(null);
      setDrawerAbierto(true);
    }
  }, []);

  const handleDetailDelete = useCallback(async (id: string) => {
    try {
      if(eliminar) await eliminar(id);
      setDetalleAbierto(false);
      setToastMsg('La actividad fue eliminada correctamente.');
      setToastOk(true);
    } catch (err) {
      setErrorGuardar(err instanceof Error ? err.message : 'Error al eliminar.');
    }
  }, [eliminar]);

  const handleBulkUpload = useCallback(async (payloads: NuevaActividadPayload[]): Promise<BulkUploadResult> => {
    setErrorGuardar(null);
    let createdCount = 0;
    const errors: string[] = [];

    for (const payload of payloads) {
      try {
        await crear(payload);
        createdCount += 1;
      } catch (err) {
        const label = payload.tarea || 'Actividad';
        const reason = err instanceof Error ? err.message : 'Error inesperado.';
        errors.push(`"${label}": ${reason}`);
      }
    }

    if (createdCount === 0) {
      throw new Error(errors[0] ?? 'No se pudo crear ninguna actividad de la carga masiva.');
    }

    const failedCount = payloads.length - createdCount;
    setToastMsg(
      failedCount > 0
        ? `Se cargaron ${createdCount} de ${payloads.length} actividades.`
        : `${createdCount} actividades fueron cargadas exitosamente.`
    );
    setToastOk(true);
    return { createdCount, failedCount, errors };
  }, [crear]);

  const handleWizardComplete = useCallback(async (result: PlaneacionWizardResult) => {
    setWizardAbierto(false);
    const datosAuxiliares = result.datosAuxiliaresPresupuestales;
    const mesesProg = result.programacion.filter(m => m.total > 0).map(m => m.mes);
    const isMonitoreo = result.parametrosSeleccionados.length > 0;

    const descParts: string[] = [];
    if (isMonitoreo) descParts.push(`Parámetros: ${result.parametrosSeleccionados.map(p => p.parametro).join(', ')}`);
    if (result.itemsSeleccionados.length > 0) descParts.push(`Ítems: ${result.itemsSeleccionados.map(it => it.item).join(', ')}`);

    const opexPayload = {
      ...datosAuxiliares,
      zona: result.zona,
      tipoLugar: result.tipoLugar,
      pk: result.pk,
      fuentePresupuesto: result.fuentePresupuesto,
      tipoPlaneacion: result.tipoPlaneacion,
      anioPlaneacion: result.anioPlaneacion,
      meses: result.programacion.map(m => ({
        mes: m.mes,
        precio: m.precio,
        cantidad: m.cantidad,
        frecuencia: m.frecuencia,
        total: m.total,
        preciosIndividuales: m.preciosIndividuales,
      })),
      paramTipoMuestra: result.paramTipoMuestra,
      paramCantCompuestos: result.paramCantCompuestos,
      ipcGlobalActivo: result.ipcGlobalActivo,
      ipcGlobalPorcentaje: result.ipcGlobalPorcentaje,
      ipcMeses: result.ipcMeses,
      ivaGlobalActivo: result.ivaGlobalActivo,
      ivaGlobalPorcentaje: result.ivaGlobalPorcentaje,
      ivaMeses: result.ivaMeses,
      servicioEComplejidad: result.servicioEComplejidad,
      // Compensaciones fields
      sistema: result.sistema,
      sector: result.sector,
      obligacion: result.obligacion,
      asignacionRecursos: result.asignacionRecursos,
      saldoDisponible: result.saldoDisponible,
      aniosAPlanear: result.aniosAPlanear,
      contratoSeleccionado: result.contratoSeleccionado,
      programacionY2: result.programacionY2,
      programacionY3: result.programacionY3,
      itemsCambianPorAnio: result.itemsCambianPorAnio,
      selectedItemsY2: result.selectedItemsY2,
      selectedItemsY3: result.selectedItemsY3,
    };

    const lugarLabel = result.sistema
      ? `${result.sistema}${result.sector ? ' — ' + result.sector : ''}`
      : result.tipoLugar === 'Estación' ? result.estacion
      : result.tipoLugar === 'Línea' ? `PK ${result.pk}` : result.zona;

    const payload: NuevaActividadPayload = {
      tarea: `${result.lineaOperativa} — ${lugarLabel}`,
      lineaOperativa: result.lineaOperativa,
      descripcion: descParts.join(' | ') || '',
      zona: result.zona,
      estacion: result.estacion,
      tipoLugar: result.tipoLugar,
      pk: result.pk,
      fuentePresupuesto: result.fuentePresupuesto,
      tipoPlaneacion: result.tipoPlaneacion,
      anioPlaneacion: result.anioPlaneacion,
      fechaInicio: datosAuxiliares.fechaInicio || `${result.anioPlaneacion}-01-01`,
      fechaFin: datosAuxiliares.fechaFin || `${result.anioPlaneacion}-12-31`,
      mes: mesesProg[0] || '',
      estado: 'Planeada',
      prioridad: 'Media',
      cuenta: result.fuentePresupuesto === 'CAPEX' ? 'CAPEX' : 'OPEX',
      responsable: datosAuxiliares.administrador || '',
      contrato: datosAuxiliares.contrato,
      porcentajeAvance: 0,
      estadoAprobacion: 'Pendiente',
      presupuestoPlan: result.valorTotal,
      presupuestoEjecutado: 0,
      novedades: `Proveedor: ${datosAuxiliares.proveedor} | Obj: ${datosAuxiliares.objeto}`,
      opexDataRaw: JSON.stringify(opexPayload)
    };

    try {
      if (actividadEditar) {
        // Modo edición: conservar campos que el wizard no toca
        const cambios: Partial<NuevaActividadPayload> = {
          ...payload,
          estado:            actividadEditar.estado,
          porcentajeAvance:  actividadEditar.porcentajeAvance,
          estadoAprobacion:  actividadEditar.estadoAprobacion,
          presupuestoEjecutado: actividadEditar.presupuestoEjecutado,
          matricesAplicables:   actividadEditar.matricesAplicables,
          cumplimientoNormativo: actividadEditar.cumplimientoNormativo,
        };
        await actualizar(actividadEditar.id, cambios);
        setToastMsg('La actividad fue actualizada exitosamente.');
        setActividadEditar(null);
        setPlaneacionInitial(null);
      } else {
        await crear(payload);
        setToastMsg('La planeación fue preparada y enviada correctamente.');
      }
      setToastOk(true);
    } catch (err) {
      setErrorGuardar(err instanceof Error ? err.message : 'Error al guardar la planeación.');
    }
  }, [crear, actualizar, actividadEditar]);

  return (
    <div className={styles.root}>
      {/* Cabecera */}
      <div className={styles.header} id="planeacion-header">
        <div className={styles.headerLeft}>
          <Title2 style={{ color: '#003057', fontWeight: 700 }}>Planeación Ambiental</Title2>
          <Body1 className={styles.subtitle}>
            Fase 1 · Seguimiento a la planeación de actividades ambientales
          </Body1>
        </div>
        <div className={styles.headerButtons}>
          <Tooltip content="Descargar la plantilla financiera OPEX con todas las actividades programadas" relationship="label">
            <Button
              appearance="secondary"
              icon={<DocumentArrowDownRegular />}
              size="large"
              style={{
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.1)',
                color: '#0056D2',
                fontWeight: 600,
              }}
              id="planeacion-export-financiera"
              onClick={() => exportOpexToExcel(actividades)}
            >
              Exportar Matriz Financiera
            </Button>
          </Tooltip>

          <Tooltip content="Descargar el detalle interno por zona, línea, parámetro y mes" relationship="label">
            <Button
              appearance="secondary"
              icon={<DocumentArrowDownRegular />}
              size="large"
              style={{
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.1)',
              }}
              id="planeacion-export-detalle"
              onClick={() => exportDetalleInternoToExcel(actividades)}
            >
              Detalle Interno
            </Button>
          </Tooltip>

          <Tooltip content="Cargar actividades desde un archivo Excel" relationship="label">
            <Button
              appearance="secondary"
              icon={<ArrowUploadRegular />}
              size="large"
              style={{
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.1)',
              }}
              id="planeacion-bulk-btn"
              onClick={() => setBulkAbierto(true)}
            >
              Carga Masiva
            </Button>
          </Tooltip>

          <Button
            appearance="primary"
            icon={<AddRegular />}
            size="large"
            style={{
              background: '#00B050',
              borderRadius: '12px',
              fontWeight: 600,
              boxShadow: '0 4px 10px rgba(0, 176, 80, 0.4)'
            }}
            id="planeacion-new-btn"
            onClick={() => setWizardAbierto(true)}
          >
            Nueva planeación
          </Button>


        </div>
      </div>

      <Divider />

      {/* Notificaciones */}
      {toastOk && (
        <MessageBar intent="success">
          <MessageBarBody>
            <MessageBarTitle>Operación exitosa</MessageBarTitle>
            {toastMsg}
          </MessageBarBody>
        </MessageBar>
      )}

      {errorCarga && (
        <MessageBar intent="error">
          <MessageBarBody>
            <MessageBarTitle>Error al cargar</MessageBarTitle>
            {errorCarga}&nbsp;
            <Button appearance="transparent" onClick={recargar} size="small">
              Reintentar
            </Button>
          </MessageBarBody>
        </MessageBar>
      )}

      {/* Tabla */}
      <div id="planeacion-table">
        <ActivityTable
          actividades={actividades}
          cargando={cargando}
          onNueva={() => setWizardAbierto(true)}
          onItemClick={handleItemClick}
        />
      </div>

      {/* Drawer de formulario manual / edición */}
      <ActivityForm
        open={drawerAbierto}
        onClose={() => { setDrawerAbierto(false); setActividadEditar(null); }}
        onGuardar={handleGuardar}
        guardando={guardando}
        errorGuardar={errorGuardar}
        actividadInicial={actividadEditar}
      />

      {/* Panel de detalle */}
      <ActivityDetailPanel
        actividad={detalleItem}
        open={detalleAbierto}
        onClose={handleDetailClose}
        onEdit={handleDetailEdit}
        onDelete={handleDetailDelete}
      />

      {/* Dialog de carga masiva */}
      <BulkUploadPanel
        open={bulkAbierto}
        onClose={() => setBulkAbierto(false)}
        onUpload={handleBulkUpload}
        guardando={guardando}
      />

      {/* Wizard de planeación unificado */}
      <PlaneacionWizard
        open={wizardAbierto}
        onClose={() => { setWizardAbierto(false); setPlaneacionInitial(null); setActividadEditar(null); }}
        onComplete={handleWizardComplete}
        initialData={planeacionInitial}
      />
    </div>
  );
};

export default PlaneacionModule;
