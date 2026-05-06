// ============================================================
// CompensacionesModule — Orchestrator
// ============================================================
import React, { useState } from 'react';
import {
  makeStyles, shorthands, tokens,
  Title2, Body1,
} from '@fluentui/react-components';
import { useCompensaciones } from '../../../hooks/useCompensaciones';
import { CompensacionesTable } from './CompensacionesTable';
import { CompensacionDetailPanel } from './CompensacionDetailPanel';
import { Compensacion } from '../../../types/provisiones';

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

export const CompensacionesModule: React.FC = () => {
  const styles = useStyles();
  const { compensaciones, cargando } = useCompensaciones();
  const [detailTarget, setDetailTarget] = useState<Compensacion | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleView = (c: Compensacion) => { setDetailTarget(c); setDetailOpen(true); };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Title2 style={{ color: '#003057', fontWeight: 700 }}>Compensaciones Ambientales</Title2>
          <Body1 className={styles.subtitle}>
            Seguimiento físico de áreas, árboles e informes de mantenimiento
          </Body1>
        </div>
      </div>

      <CompensacionesTable
        compensaciones={compensaciones}
        cargando={cargando}
        onView={handleView}
      />

      <CompensacionDetailPanel
        compensacion={detailTarget}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailTarget(null); }}
      />
    </div>
  );
};
