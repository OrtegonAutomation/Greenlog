import React, { useMemo } from 'react';
import {
  makeStyles, shorthands, tokens,
  Title1, Title3, Body1, Caption1,
  Button,
} from '@fluentui/react-components';
import {
  ArrowRight24Regular,
} from '@fluentui/react-icons';
import { useActividades } from '../../hooks/useActividades';
import { CENIT_COLORS } from '../../theme/cenitTheme';
import { StatCard } from '../common/StatCard';
import { FeatureCard } from '../common/FeatureCard';
import { SeccionApp } from '../../types';

// ── Estilos ───────────────────────────────────────────────────
const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('40px'),
    animationName: {
      from: { opacity: '0' },
      to: { opacity: '1' },
    },
    animationDuration: '0.4s',
    animationFillMode: 'both',
  },

  // Hero Section
  hero: {
    position: 'relative',
    borderRadius: '24px',
    overflow: 'hidden',
    minHeight: '380px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    ...shorthands.padding('60px'),
    color: 'white',
    background: CENIT_COLORS.heroGradient,
    boxShadow: '0 20px 40px -10px rgba(0, 51, 160, 0.3)',
  },
  heroContent: {
    position: 'relative',
    zIndex: 2,
    maxWidth: '600px',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('20px'),
  },
  heroTitle: {
    fontSize: '48px',
    fontWeight: '800',
    lineHeight: '1.1',
    letterSpacing: '-1px',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
  },
  heroSubtitle: {
    fontSize: '18px',
    opacity: 0.9,
    lineHeight: '1.5',
    fontWeight: '500',
  },
  heroButton: {
    width: 'fit-content',
    marginTop: '10px',
    backgroundColor: CENIT_COLORS.green,
    color: '#0033A0',
    fontWeight: '700',
    fontSize: '16px',
    padding: '12px 24px',
    borderRadius: '30px',
    border: 'none',
    ':hover': {
      backgroundColor: CENIT_COLORS.greenMid,
      color: 'white',
    },
  },
  heroDecor: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '60%',
    background: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.1) 0%, transparent 60%)',
    zIndex: 1,
  },

  // Stats Section
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
  },

  // Modules Section
  modulesSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: CENIT_COLORS.blueBrand,
    marginBottom: '8px',
  },
  modulesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
  },

  // Footer / Certifications
  footer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    paddingTop: '40px',
    paddingBottom: '20px',
    opacity: 0.7,
  },
  certRow: {
    display: 'flex',
    gap: '30px',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  certPlaceholder: {
    height: '40px',
    background: '#ccc',
    borderRadius: '4px',
    opacity: 0.5,
    padding: '0 20px',
    display: 'flex',
    alignItems: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    color: 'white',
  }

});

interface DashboardProps {
  onNavigate: (section: SeccionApp) => void;
}

// ── Componente ────────────────────────────────────────────────
export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const styles = useStyles();
  const { actividades } = useActividades();

  const stats = useMemo(() => {
    const total = actividades.length;
    const ejecucion = actividades.filter((a) => a.estado === 'En Ejecución').length;
    const cerradas = actividades.filter((a) => a.estado === 'Cerrada').length;
    const cumplimiento = total > 0 ? Math.round((cerradas / total) * 100) : 0;
    return { total, ejecucion, cumplimiento };
  }, [actividades]);

  return (
    <div className={styles.root}>

      {/* Hero */}
      {/* Hero */}
      <div
        className={styles.hero}
        id="dashboard-hero"
        style={{
          background: `linear-gradient(90deg, rgba(0,34,102,0.9) 0%, rgba(0,51,160,0.7) 45%, rgba(0,0,0,0.1) 100%), url('https://cenit-transporte.com/wp-content/uploads/2025/10/geodesicos1.jpg') no-repeat center center`,
          backgroundSize: 'cover',
        }}
      >
        <div className={styles.heroContent}>
          <div style={{ marginBottom: '16px' }}>
            <img
              src="https://cenit-transporte.com/wp-content/uploads/2025/10/cobranding-en-blanco.png"
              alt="Cenit Grupo Ecopetrol"
              style={{ height: '48px', objectFit: 'contain' }}
            />
          </div>
          <Title1 className={styles.heroTitle}>Talento que mueve al país</Title1>
          <Body1 className={styles.heroSubtitle}>
            Gestiona, planifica y ejecuta las actividades de control ambiental con la energía que nos une.
          </Body1>
          <Button
            className={styles.heroButton}
            icon={<ArrowRight24Regular />}
            iconPosition="after"
            onClick={() => onNavigate('planeacion')}
          >
            Ir a Planeación
          </Button>
        </div>
      </div>

      {/* Stats Bar - Información útil de la app */}
      <div className={styles.statsRow} id="dashboard-kpis">
        <StatCard
          value={stats.total.toString()}
          label="Gestión Total"
          sub="Actividades ambientales registradas en el sistema"
        />
        <StatCard
          value={stats.ejecucion.toString()}
          label="En Campo"
          sub="Actividades actualmente en ejecución y seguimiento"
        />
        <StatCard
          value={`${stats.cumplimiento}%`}
          label="Efectividad"
          sub="Porcentaje de cumplimiento de actividades cerradas"
        />
      </div>

      {/* Modules Grid */}
      <div className={styles.modulesSection}>
        <Title1 className={styles.sectionTitle}>Nuestros Módulos</Title1>
        <div className={styles.modulesGrid}>
          <FeatureCard
            title="Planeación Ambiental"
            description="Gestiona y programa las actividades de mantenimiento y control ambiental."
            actionLabel="Ver Planeación"
            imageUrl="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2626&auto=format&fit=crop"
            gradient="linear-gradient(135deg, #16a34a 0%, #059669 100%)"
            onClick={() => onNavigate('planeacion')}
          />
          <FeatureCard
            title="Ejecución y Seguimiento"
            description="Monitoreo en tiempo real del avance en campo y cumplimiento de metas."
            actionLabel="Ver Ejecución"
            imageUrl="https://sinnaps.com/wp-content/uploads/2017/09/dc1pt-pxsaqkcn_.jpg-large.jpg"
            gradient="linear-gradient(135deg, #0056D2 0%, #0033A0 100%)"
            onClick={() => onNavigate('ejecucion')}
          />
          <FeatureCard
            title="Reportes e Indicadores"
            description="Análisis detallado de KPIs, cumplimiento normativo y estadísticas."
            actionLabel="Ver Reportes"
            imageUrl="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2670&auto=format&fit=crop"
            gradient="linear-gradient(135deg, #002266 0%, #172554 100%)"
            onClick={() => onNavigate('reportes')}
          />
        </div>
      </div>

      {/* Footer Certifications */}
      <div className={styles.footer}>
        <Title3 style={{ color: CENIT_COLORS.blueBrand, marginBottom: '16px' }}>Nuestras Certificaciones</Title3>
        <div className={styles.certRow}>
          <img src="https://cenit-transporte.com/wp-content/uploads/2025/08/Recurso-1Logos.png" alt="Icontec" style={{ height: '60px', objectFit: 'contain' }} />
          <img src="https://cenit-transporte.com/wp-content/uploads/2025/08/Recurso-2Logos.png" alt="Top Employer" style={{ height: '60px', objectFit: 'contain' }} />
          <img src="https://cenit-transporte.com/wp-content/uploads/2025/08/Recurso-3Logos.png" alt="Par" style={{ height: '60px', objectFit: 'contain' }} />
          <img src="https://cenit-transporte.com/wp-content/uploads/2025/08/Recurso-4Logos.png" alt="Great Place To Work" style={{ height: '60px', objectFit: 'contain' }} />
        </div>
        <Caption1>CENIT Transporte y Logística de Hidrocarburos S.A.S</Caption1>
      </div>

    </div>
  );
};
