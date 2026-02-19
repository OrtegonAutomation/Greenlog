import React from 'react';
import { makeStyles, shorthands, Button } from '@fluentui/react-components';
import { ArrowRight16Regular } from '@fluentui/react-icons';
import { CENIT_COLORS } from '../../theme/cenitTheme';

const useStyles = makeStyles({
    card: {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        minHeight: '320px',
        ...shorthands.padding('32px'),
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: CENIT_COLORS.cardShadow,
        transition: 'transform 0.3s cubic-bezier(0.33, 1, 0.68, 1), box-shadow 0.3s ease',
        cursor: 'pointer',
        backgroundColor: 'white',
        ':hover': {
            transform: 'translateY(-8px)',
            boxShadow: CENIT_COLORS.cardHoverShadow,
            '& .bgImage': {
                transform: 'scale(1.05)',
            },
        },
    },
    bgImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        zIndex: 0,
        transition: 'transform 0.6s ease',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(to top, rgba(0, 51, 160, 0.9) 0%, rgba(0, 51, 160, 0.4) 50%, transparent 100%)',
        zIndex: 1,
    },
    content: {
        position: 'relative',
        zIndex: 2,
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        ...shorthands.gap('12px'),
    },
    title: {
        fontSize: '24px',
        fontWeight: '800',
        lineHeight: '1.2',
        maxWidth: '85%',
    },
    description: {
        fontSize: '15px',
        opacity: 0.9,
        lineHeight: '1.5',
        marginBottom: '16px',
        maxWidth: '90%',
    },
    button: {
        backgroundColor: CENIT_COLORS.green,
        color: '#0033A0', // Text color matching the brand blue for contrast on green
        fontWeight: '700',
        borderRadius: '20px',
        paddingLeft: '20px',
        paddingRight: '20px',
        border: 'none',
        ':hover': {
            backgroundColor: CENIT_COLORS.greenMid,
            color: 'white',
        },
    },
});

interface FeatureCardProps {
    title: string;
    description: string;
    imageUrl?: string;
    gradient?: string;
    actionLabel?: string;
    onClick?: () => void;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
    title,
    description,
    imageUrl,
    gradient,
    actionLabel = 'Ver más',
    onClick
}) => {
    const styles = useStyles();

    const [imgError, setImgError] = React.useState(false);

    return (
        <div className={styles.card} onClick={onClick}>
            {/* Si tenemos imagen y no ha fallado, la mostramos. Si falla, mostramos el div con gradiente */}
            {!imgError && imageUrl ? (
                <img
                    src={imageUrl}
                    className={styles.bgImage + ' bgImage'}
                    alt=""
                    onError={() => setImgError(true)}
                />
            ) : (
                <div
                    className={styles.bgImage + ' bgImage'}
                    style={{ background: gradient || 'linear-gradient(135deg, #eee 0%, #ccc 100%)' }}
                />
            )}

            {/* Overlay siempre presente para garantizar legibilidad */}
            <div className={styles.overlay} style={{ background: (!imgError && imageUrl) ? undefined : 'linear-gradient(to top, rgba(0, 51, 160, 0.6) 0%, transparent 100%)' }} />

            <div className={styles.content}>
                <span className={styles.title}>{title}</span>
                <span className={styles.description}>{description}</span>
                <Button
                    className={styles.button}
                    icon={<ArrowRight16Regular />}
                    iconPosition="after"
                >
                    {actionLabel}
                </Button>
            </div>
        </div>
    );
};
