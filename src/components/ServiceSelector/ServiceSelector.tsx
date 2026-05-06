import React from 'react';
import {
  makeStyles, shorthands, tokens,
  Title1, Body1, Caption1,
} from '@fluentui/react-components';
import {
  LeafOneRegular,
  DocumentBulletListRegular,
  ArrowRight24Regular,
} from '@fluentui/react-icons';
import { ServicioApp } from '../../types';
import { CENIT_COLORS } from '../../theme/cenitTheme';
import GreenLogBlanco from '../../assets/GreenLog Blanco.png';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: `linear-gradient(145deg, ${CENIT_COLORS.blueDark} 0%, ${CENIT_COLORS.blueBrand} 40%, #004b87 70%, ${CENIT_COLORS.greenDark} 100%)`,
    position: 'relative',
    overflow: 'hidden',
    ...shorthands.padding('40px', '24px'),
  },

  // Decorative background circles
  bgDecor1: {
    position: 'absolute',
    top: '-15%',
    right: '-10%',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(140,198,63,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  bgDecor2: {
    position: 'absolute',
    bottom: '-20%',
    left: '-10%',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,86,210,0.15) 0%, transparent 70%)',
    pointerEvents: 'none',
  },

  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.gap('16px'),
    marginBottom: '56px',
    position: 'relative',
    zIndex: 1,
    animationName: {
      from: { opacity: '0', transform: 'translateY(-20px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    },
    animationDuration: '0.6s',
    animationFillMode: 'both',
    animationTimingFunction: 'cubic-bezier(0.16,1,0.3,1)',
  },
  logo: {
    width: '80px',
    height: '80px',
    objectFit: 'contain',
    marginBottom: '8px',
  },
  headerTitle: {
    fontSize: '42px',
    fontWeight: '800',
    color: '#fff',
    letterSpacing: '-1px',
    lineHeight: '1.1',
    textAlign: 'center',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
  },
  headerSub: {
    fontSize: '17px',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    maxWidth: '500px',
    lineHeight: '1.5',
  },
  cenitLogo: {
    height: '36px',
    objectFit: 'contain',
    opacity: 0.85,
  },

  cardsRow: {
    display: 'flex',
    ...shorthands.gap('32px'),
    justifyContent: 'center',
    flexWrap: 'wrap',
    position: 'relative',
    zIndex: 1,
    maxWidth: '900px',
    width: '100%',
  },

  card: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '400px',
    minHeight: '420px',
    borderRadius: '28px',
    overflow: 'hidden',
    cursor: 'pointer',
    background: 'rgba(255,255,255,0.07)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.12)'),
    boxShadow: '0 20px 60px -10px rgba(0,0,0,0.35)',
    transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease, border-color 0.3s ease',
    ':hover': {
      transform: 'translateY(-12px) scale(1.02)',
      boxShadow: '0 32px 80px -10px rgba(0,0,0,0.45)',
      ...shorthands.borderColor('rgba(255,255,255,0.25)'),
    },
    animationName: {
      from: { opacity: '0', transform: 'translateY(40px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    },
    animationDuration: '0.7s',
    animationFillMode: 'both',
    animationTimingFunction: 'cubic-bezier(0.16,1,0.3,1)',
  },
  cardDelay2: {
    animationDelay: '0.15s',
  },

  cardImageArea: {
    position: 'relative',
    height: '200px',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.6s ease',
  },
  cardImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.5) 100%)',
  },
  cardIconBadge: {
    position: 'absolute',
    bottom: '-24px',
    left: '28px',
    width: '52px',
    height: '52px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '26px',
    color: '#fff',
    boxShadow: '0 8px 24px -4px rgba(0,0,0,0.3)',
    zIndex: 2,
  },

  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.padding('36px', '28px', '28px'),
    flex: 1,
    ...shorthands.gap('10px'),
  },
  cardTitle: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#fff',
    lineHeight: '1.2',
  },
  cardDesc: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.65)',
    lineHeight: '1.6',
    flex: 1,
  },
  cardAction: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    fontSize: '14px',
    fontWeight: '700',
    marginTop: '12px',
    transition: 'gap 0.2s ease',
  },
  cardActionGreen: {
    color: CENIT_COLORS.green,
  },
  cardActionBlue: {
    color: '#7CB4FF',
  },

  footer: {
    marginTop: '48px',
    position: 'relative',
    zIndex: 1,
    animationName: {
      from: { opacity: '0' },
      to: { opacity: '1' },
    },
    animationDuration: '0.8s',
    animationDelay: '0.5s',
    animationFillMode: 'both',
  },
  footerText: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
  },
});

interface ServiceSelectorProps {
  onSelect: (servicio: ServicioApp) => void;
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({ onSelect }) => {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      {/* Decorative backgrounds */}
      <div className={styles.bgDecor1} />
      <div className={styles.bgDecor2} />

      {/* Header */}
      <div className={styles.header}>
        <img
          src="https://cenit-transporte.com/wp-content/uploads/2025/10/cobranding-en-blanco.png"
          alt="CENIT Grupo Ecopetrol"
          className={styles.cenitLogo}
        />
        <img src={GreenLogBlanco} alt="GreenLog" className={styles.logo} />
        <span className={styles.headerTitle}>GREENLOG</span>
        <span className={styles.headerSub}>
          Selecciona el módulo con el que deseas trabajar
        </span>
      </div>

      {/* Service Cards */}
      <div className={styles.cardsRow}>

        {/* Planeación Ambiental */}
        <div
          className={styles.card}
          onClick={() => onSelect('planeacion_ambiental')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelect('planeacion_ambiental')}
        >
          <div className={styles.cardImageArea}>
            <img
              src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2626&auto=format&fit=crop"
              alt=""
              className={styles.cardImage}
            />
            <div className={styles.cardImageOverlay} />
            <div
              className={styles.cardIconBadge}
              style={{ background: `linear-gradient(135deg, ${CENIT_COLORS.green} 0%, ${CENIT_COLORS.greenDark} 100%)` }}
            >
              <LeafOneRegular />
            </div>
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardTitle}>Planeación Ambiental</span>
            <span className={styles.cardDesc}>
              Gestiona, planifica y ejecuta las actividades de control ambiental.
              Monitoreos, compensaciones, reportes e indicadores de cumplimiento.
            </span>
            <div className={`${styles.cardAction} ${styles.cardActionGreen}`}>
              <span>Ingresar</span>
              <ArrowRight24Regular style={{ fontSize: '18px' }} />
            </div>
          </div>
        </div>

        {/* Provisiones */}
        <div
          className={`${styles.card} ${styles.cardDelay2}`}
          onClick={() => onSelect('provisiones')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelect('provisiones')}
        >
          <div className={styles.cardImageArea}>
            <img
              src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=2626&auto=format&fit=crop"
              alt=""
              className={styles.cardImage}
            />
            <div className={styles.cardImageOverlay} />
            <div
              className={styles.cardIconBadge}
              style={{ background: `linear-gradient(135deg, ${CENIT_COLORS.blueLight} 0%, ${CENIT_COLORS.blueBrand} 100%)` }}
            >
              <DocumentBulletListRegular />
            </div>
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardTitle}>Provisiones</span>
            <span className={styles.cardDesc}>
              Gestión de provisiones ambientales, compensaciones, estimaciones
              de recursos PxQ, seguimiento presupuestal y reporte SAP.
            </span>
            <div className={`${styles.cardAction} ${styles.cardActionBlue}`}>
              <span>Ingresar</span>
              <ArrowRight24Regular style={{ fontSize: '18px' }} />
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <span className={styles.footerText}>
          CENIT Transporte y Logística de Hidrocarburos S.A.S — Control Ambiental
        </span>
      </div>
    </div>
  );
};
