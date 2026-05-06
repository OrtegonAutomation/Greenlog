import React from 'react';
import {
  makeStyles, shorthands,
  Title1, Body1, Caption1, Button,
} from '@fluentui/react-components';
import {
  ArrowLeft24Regular,
  DocumentBulletListRegular,
  CheckmarkCircle24Regular,
} from '@fluentui/react-icons';
import { CENIT_COLORS } from '../../theme/cenitTheme';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: `linear-gradient(145deg, ${CENIT_COLORS.blueDark} 0%, ${CENIT_COLORS.blueBrand} 50%, #004b87 100%)`,
    ...shorthands.padding('40px', '24px'),
    position: 'relative',
    overflow: 'hidden',
  },
  bgDecor: {
    position: 'absolute',
    top: '10%',
    right: '-5%',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,86,210,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },

  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    ...shorthands.gap('24px'),
    ...shorthands.padding('60px', '48px'),
    background: 'rgba(255,255,255,0.07)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderRadius: '32px',
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.12)'),
    boxShadow: '0 20px 60px -10px rgba(0,0,0,0.35)',
    maxWidth: '560px',
    width: '100%',
    position: 'relative',
    zIndex: 1,
    animationName: {
      from: { opacity: '0', transform: 'translateY(30px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    },
    animationDuration: '0.6s',
    animationFillMode: 'both',
    animationTimingFunction: 'cubic-bezier(0.16,1,0.3,1)',
  },

  iconCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '24px',
    background: `linear-gradient(135deg, ${CENIT_COLORS.blueLight} 0%, ${CENIT_COLORS.blueBrand} 100%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '38px',
    color: '#fff',
    boxShadow: '0 12px 32px -4px rgba(0,86,210,0.4)',
  },

  title: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#fff',
    lineHeight: '1.2',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
  },
  subtitle: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.65)',
    lineHeight: '1.6',
    maxWidth: '420px',
  },

  roadmap: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
    alignItems: 'flex-start',
    width: '100%',
    ...shorthands.padding('20px', '0', '0'),
    ...shorthands.borderTop('1px', 'solid', 'rgba(255,255,255,0.08)'),
  },
  roadmapTitle: {
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: '4px',
  },
  roadmapItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('10px'),
    fontSize: '14px',
    color: 'rgba(255,255,255,0.6)',
  },
  roadmapIcon: {
    color: CENIT_COLORS.green,
    fontSize: '18px',
    flexShrink: 0,
  },

  badge: {
    ...shorthands.padding('6px', '16px'),
    borderRadius: '20px',
    background: 'rgba(140,198,63,0.15)',
    ...shorthands.border('1px', 'solid', 'rgba(140,198,63,0.25)'),
    color: CENIT_COLORS.green,
    fontSize: '13px',
    fontWeight: '700',
  },

  backButton: {
    marginTop: '8px',
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    ':hover': {
      color: '#fff',
    },
  },
});

interface ProvisionesPlaceholderProps {
  onBack: () => void;
}

const ROADMAP_ITEMS = [
  'Registro de notificaciones ambientales',
  'Estimación de zona con tarifas de contratos (PxQ)',
  'Gestión SOLPED (OPEX / CAPEX)',
  'Seguimiento a ejecución y facturación',
  'Reporte SAP y balance de provisiones',
];

export const ProvisionesPlaceholder: React.FC<ProvisionesPlaceholderProps> = ({ onBack }) => {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <div className={styles.bgDecor} />

      <div className={styles.card}>
        <div className={styles.iconCircle}>
          <DocumentBulletListRegular />
        </div>

        <span className={styles.badge}>Próximamente</span>

        <span className={styles.title}>Provisiones</span>
        <span className={styles.subtitle}>
          El módulo de gestión de provisiones ambientales, compensaciones y seguimiento
          presupuestal estará disponible en la siguiente fase del proyecto.
        </span>

        <div className={styles.roadmap}>
          <span className={styles.roadmapTitle}>Funcionalidades planeadas</span>
          {ROADMAP_ITEMS.map((item) => (
            <div key={item} className={styles.roadmapItem}>
              <CheckmarkCircle24Regular className={styles.roadmapIcon} />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <Button
          appearance="subtle"
          className={styles.backButton}
          icon={<ArrowLeft24Regular />}
          onClick={onBack}
          size="large"
        >
          Volver al inicio
        </Button>
      </div>
    </div>
  );
};
