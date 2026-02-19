// ============================================================
// PlaneacionModule — Módulo de Planeación Ambiental (Fase 1)
// ============================================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  makeStyles, shorthands, tokens,
  Title2, Body1, Button, MessageBar, MessageBarBody, MessageBarTitle, Divider,
} from '@fluentui/react-components';
import { AddRegular } from '@fluentui/react-icons';
import { NuevaActividadPayload } from '../../types';
import { useActividades } from '../../hooks/useActividades';
import { ActivityTable } from './ActivityTable';
import { ActivityForm } from './ActivityForm';

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
  subtitle: { color: tokens.colorNeutralForeground2 },
});

export const PlaneacionModule: React.FC = () => {
  const styles = useStyles();

  const { actividades, cargando, errorCarga, guardando, recargar, crear } = useActividades();

  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  const [toastOk, setToastOk] = useState(false);

  // Auto-ocultar toast de éxito
  useEffect(() => {
    if (!toastOk) return;
    const t = setTimeout(() => setToastOk(false), 4000);
    return () => clearTimeout(t);
  }, [toastOk]);

  const handleGuardar = useCallback(async (payload: NuevaActividadPayload) => {
    setErrorGuardar(null);
    try {
      await crear(payload);
      setDrawerAbierto(false);
      setToastOk(true);
    } catch (err) {
      setErrorGuardar(err instanceof Error ? err.message : 'Error inesperado al guardar.');
    }
  }, [crear]);

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
        <Button
          id="planeacion-new-btn"
          appearance="primary"
          icon={<AddRegular />}
          size="large"
          style={{
            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
            border: 'none',
            boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
            borderRadius: '12px',
            paddingLeft: '24px',
            paddingRight: '24px'
          }}
          onClick={() => { setDrawerAbierto(true); setErrorGuardar(null); }}
        >
          Nueva actividad
        </Button>
      </div>

      <Divider />

      {/* Notificaciones */}
      {toastOk && (
        <MessageBar intent="success">
          <MessageBarBody>
            <MessageBarTitle>Actividad registrada</MessageBarTitle>
            La nueva actividad fue guardada exitosamente.
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
      <ActivityTable
        actividades={actividades}
        cargando={cargando}
        onNueva={() => setDrawerAbierto(true)}
      />

      {/* Drawer de formulario */}
      <ActivityForm
        open={drawerAbierto}
        onClose={() => setDrawerAbierto(false)}
        onGuardar={handleGuardar}
        guardando={guardando}
        errorGuardar={errorGuardar}
      />
    </div>
  );
};

export default PlaneacionModule;
