// ============================================================
// ObligacionesModule — Orchestrator
// ============================================================
import React, { useState } from 'react';
import {
  makeStyles, shorthands, tokens,
  Title2, Body1,
} from '@fluentui/react-components';
import { useProvisiones } from '../../../hooks/useProvisiones';
import { ObligacionesTable } from './ObligacionesTable';
import { ObligacionForm } from './ObligacionForm';
import { ObligacionDetailPanel } from './ObligacionDetailPanel';
import { Provision, NuevaProvisionPayload } from '../../../types/provisiones';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalL),
    animationName: {
      from: { opacity: '0', transform: 'translateY(10px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    },
    animationDuration: '0.4s',
    animationFillMode: 'both',
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
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.5)'),
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
  },
  subtitle: {
    color: tokens.colorNeutralForeground2,
  },
});

export const ObligacionesModule: React.FC = () => {
  const styles = useStyles();
  const { provisiones, cargando, guardando, crear, actualizar, eliminar } = useProvisiones();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Provision | null>(null);
  const [detailTarget, setDetailTarget] = useState<Provision | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleCreate = () => { setEditTarget(null); setFormOpen(true); };
  const handleEdit = (p: Provision) => { setEditTarget(p); setFormOpen(true); };
  const handleView = (p: Provision) => { setDetailTarget(p); setDetailOpen(true); };
  const handleDelete = async (id: string) => { if (window.confirm('¿Eliminar esta obligación?')) await eliminar(id); };

  const handleSave = async (payload: NuevaProvisionPayload, id?: string) => {
    if (id) {
      await actualizar(id, payload);
    } else {
      await crear(payload);
    }
    setFormOpen(false);
    setEditTarget(null);
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Title2 style={{ color: '#003057', fontWeight: 700 }}>Registro de Obligaciones</Title2>
          <Body1 className={styles.subtitle}>
            Control completo de provisiones ambientales — CRUD con pipeline de estados
          </Body1>
        </div>
      </div>

      <ObligacionesTable
        provisiones={provisiones}
        cargando={cargando}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
      />

      <ObligacionForm
        provision={editTarget}
        open={formOpen}
        guardando={guardando}
        onClose={() => { setFormOpen(false); setEditTarget(null); }}
        onSave={handleSave}
      />

      <ObligacionDetailPanel
        provision={detailTarget}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailTarget(null); }}
      />
    </div>
  );
};
