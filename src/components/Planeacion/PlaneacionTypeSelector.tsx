import React from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Button,
  makeStyles,
  tokens,
  shorthands
} from '@fluentui/react-components';
import { BeakerRegular, DocumentBriefcaseRegular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  optionsContainer: {
    display: 'flex',
    gap: '16px',
    marginTop: '20px',
    marginBottom: '20px'
  },
  optionCard: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: tokens.colorNeutralBackground1,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      ...shorthands.borderColor(tokens.colorBrandBackground),
      transform: 'translateY(-2px)',
      boxShadow: tokens.shadow4,
    }
  },
  optionIcon: {
    fontSize: '48px',
    color: tokens.colorBrandForeground1,
    marginBottom: '16px'
  },
  optionTitle: {
    fontWeight: 'bold',
    fontSize: '16px',
    marginBottom: '8px',
    textAlign: 'center'
  },
  optionDesc: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
    textAlign: 'center'
  }
});

interface PlaneacionTypeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectType: (type: 'monitoreo' | 'servicio') => void;
}

export const PlaneacionTypeSelector: React.FC<PlaneacionTypeSelectorProps> = ({
  open,
  onOpenChange,
  onSelectType
}) => {
  const styles = useStyles();

  return (
    <Dialog open={open} onOpenChange={(e, data) => onOpenChange(data.open)}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>¿Qué tipo de planeación deseas crear?</DialogTitle>
          <DialogContent>
            <div className={styles.optionsContainer}>
              <div 
                className={styles.optionCard}
                onClick={() => {
                  onOpenChange(false);
                  onSelectType('monitoreo');
                }}
              >
                <BeakerRegular className={styles.optionIcon} />
                <div className={styles.optionTitle}>Monitoreos Ambientales</div>
                <div className={styles.optionDesc}>
                  Puntos de muestreo, parámetros (ICA, Vertimientos, etc.)
                </div>
              </div>

              <div 
                className={styles.optionCard}
                onClick={() => {
                  onOpenChange(false);
                  onSelectType('servicio');
                }}
              >
                <DocumentBriefcaseRegular className={styles.optionIcon} />
                <div className={styles.optionTitle}>Servicios Generales</div>
                <div className={styles.optionDesc}>
                  Gestiones, honorarios, seguros y otras actividades sin muestreo
                </div>
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Cancelar</Button>
            </DialogTrigger>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
