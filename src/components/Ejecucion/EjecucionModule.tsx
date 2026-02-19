import React, { useMemo } from 'react';
import {
    makeStyles, shorthands, tokens,
    Title2, Body1, Subtitle2, Caption1,
    Button, ProgressBar, Badge,
    Avatar, Card, CardHeader,
} from '@fluentui/react-components';
import {
    CalendarLtrRegular,
    LocationRegular,
    MoreHorizontalRegular,
    TimerRegular,
    ArrowRightRegular,
} from '@fluentui/react-icons';
import { useActividades } from '../../hooks/useActividades';
import { ActividadAmbiental } from '../../types';
import { CENIT_COLORS } from '../../theme/cenitTheme';

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
        marginBottom: tokens.spacingVerticalL,
        border: '1px solid rgba(255,255,255,0.5)',
    },
    headerLeft: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('4px'),
    },
    subtitle: { color: tokens.colorNeutralForeground2 },

    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        ...shorthands.gap(tokens.spacingHorizontalL, tokens.spacingVerticalL),
    },

    // Card Styles
    card: {
        ...shorthands.padding(tokens.spacingVerticalL),
        transition: 'all 0.3s cubic-bezier(0.33, 1, 0.68, 1)',
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.6)',
        borderRadius: '16px',
        cursor: 'pointer',
        ':hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
            background: 'rgba(255,255,255,0.8)',
            border: '1px solid rgba(255,255,255,0.9)',
        },
    },
    cardTitle: {
        color: '#003057', // Cenit Blue
        fontWeight: '700',
        fontSize: '16px',
    },
    cardHeaderAction: {
        color: tokens.colorNeutralForeground3,
        ':hover': { color: CENIT_COLORS.blueBrand },
    },
    infoRow: {
        display: 'flex',
        alignItems: 'center',
        ...shorthands.gap(tokens.spacingHorizontalXS),
        color: tokens.colorNeutralForeground2,
        marginTop: '8px',
        fontSize: '13px',
    },

    // Progress
    progressContainer: {
        marginTop: '20px',
        marginBottom: '16px',
        background: 'rgba(0,0,0,0.03)',
        borderRadius: '8px',
        padding: '12px',
    },
    progressLabel: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '8px',
        fontSize: '12px',
        color: tokens.colorNeutralForeground2,
    },

    // Footer
    cardFooter: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: '1px solid rgba(0,0,0,0.05)',
    },
    userGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    badge: {
        borderRadius: '6px',
        padding: '4px 8px',
        textTransform: 'uppercase',
        fontSize: '10px',
        fontWeight: '700',
        letterSpacing: '0.5px',
    },

    // Empty State
    emptyState: {
        gridColumn: '1 / -1',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        textAlign: 'center',
        background: 'rgba(255,255,255,0.3)',
        borderRadius: '24px',
        border: '2px dashed rgba(0,0,0,0.05)',
    },
    emptyImg: {
        width: '160px',
        marginBottom: '24px',
        opacity: 0.8,
    }
});

export const EjecucionModule: React.FC = () => {
    const styles = useStyles();
    const { actividades } = useActividades();

    // Filtrar solo actividades en ejecución
    const openActivities = useMemo(() => {
        return actividades.filter(a => a.estado === 'En Ejecución');
    }, [actividades]);

    return (
        <div className={styles.root}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <Title2 style={{ color: '#003057', fontWeight: 700 }}>Ejecución y Seguimiento</Title2>
                    <Body1 className={styles.subtitle}>
                        Monitoreo en tiempo real de actividades en campo
                    </Body1>
                </div>
                <Badge appearance="tint" color="brand" shape="rounded" size="large">
                    {openActivities.length} Activas
                </Badge>
            </div>

            <div className={styles.grid} id="ejecucion-grid">
                {openActivities.map((actividad, idx) => (
                    <ActivityCard key={actividad.id} actividad={actividad} styles={styles} index={idx} />
                ))}

                {openActivities.length === 0 && (
                    <div className={styles.emptyState}>
                        <img
                            src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Clipboard/3D/clipboard_3d.png"
                            alt="Todo listo"
                            className={styles.emptyImg}
                        />
                        <Title2 style={{ color: tokens.colorNeutralForeground2, marginBottom: '8px' }}>Todo al día</Title2>
                        <Body1 style={{ color: tokens.colorNeutralForeground3, maxWidth: '400px' }}>
                            No tienes actividades en ejecución en este momento. Las actividades iniciadas desde la planeación aparecerán aquí.
                        </Body1>
                    </div>
                )}
            </div>
        </div>
    );
};

const ActivityCard: React.FC<{ actividad: ActividadAmbiental; styles: any; index: number }> = ({ actividad, styles, index }) => {
    return (
        <Card
            className={styles.card}
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <CardHeader
                header={
                    <Subtitle2 className={styles.cardTitle}>{actividad.tarea}</Subtitle2>
                }
                description={
                    <Caption1 style={{ color: CENIT_COLORS.green, fontWeight: 600 }}>{actividad.tipo.toUpperCase()}</Caption1>
                }
                action={
                    <Button appearance="transparent" icon={<MoreHorizontalRegular />} className={styles.cardHeaderAction} />
                }
            />

            <div>
                <div className={styles.infoRow}>
                    <LocationRegular fontSize={16} style={{ color: '#003057' }} />
                    <Body1>{actividad.ubicacionZona}</Body1>
                </div>
                <div className={styles.infoRow}>
                    <CalendarLtrRegular fontSize={16} style={{ color: '#003057' }} />
                    <Body1>Inicio: {actividad.fechaInicio}</Body1>
                </div>

                <div className={styles.progressContainer}>
                    <div className={styles.progressLabel}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <TimerRegular fontSize={12} />
                            <span>Progreso General</span>
                        </div>
                        <span style={{ fontWeight: '700', color: CENIT_COLORS.blueBrand }}>{actividad.porcentajeAvance}%</span>
                    </div>
                    <ProgressBar
                        value={actividad.porcentajeAvance / 100}
                        color={actividad.porcentajeAvance === 100 ? 'success' : 'brand'}
                        style={{ height: '6px', borderRadius: '3px' }}
                    />
                </div>

                <div className={styles.cardFooter}>
                    <div className={styles.userGroup}>
                        <Avatar name={actividad.responsable} size={24} color="colorful" />
                        <Caption1 style={{ fontWeight: 600, color: tokens.colorNeutralForeground2 }}>
                            {actividad.responsable.split(' ')[0]}
                        </Caption1>
                    </div>

                    <Badge
                        appearance="filled"
                        color={actividad.prioridad === 'Alta' ? 'danger' : (actividad.prioridad === 'Media' ? 'warning' : 'success')}
                        className={styles.badge}
                        icon={actividad.prioridad === 'Alta' ? <ArrowRightRegular style={{ transform: 'rotate(-45deg)' }} /> : undefined}
                    >
                        {actividad.prioridad}
                    </Badge>
                </div>
            </div>
        </Card>
    );
};

export default EjecucionModule;
