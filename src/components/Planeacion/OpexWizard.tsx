import React, { useState } from 'react';
import {
  makeStyles, shorthands, tokens, Portal,
  Title2, Title3, Body1, Body2, Caption1,
  Button, Input, Dropdown, Option, Textarea,
} from '@fluentui/react-components';
import {
  DismissRegular, ArrowRightRegular, CalendarRegular,
  OrganizationRegular, CheckmarkRegular, DocumentTextRegular
} from '@fluentui/react-icons';
import { MonitoreoWizardResult } from './MonitoreosWizard';
import { CENIT_COLORS } from '../../theme/cenitTheme';

export interface OpexFormData {
  procesoAbastecimiento: string;
  contrato: string;
  objeto: string;
  proveedor: string;
  fechaInicio: string;
  fechaFin: string;
  administrador: string;
  supervisor: string;
  estadoContrato: string;
  descripcionNecesidad: string;
}

interface OpexWizardProps {
  open: boolean;
  onClose: () => void;
  monitoreoPayload: MonitoreoWizardResult | null;
  onComplete: (opexData: OpexFormData) => void;
  initialOpexData?: Partial<OpexFormData> | null;
}

const useStyles = makeStyles({
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,12,36,0.5)', backdropFilter: 'blur(8px)',
    zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
    animationName: { from: { opacity: '0' }, to: { opacity: '1' } },
    animationDuration: '0.2s', animationFillMode: 'both',
  },
  wizard: {
    width: '600px', maxWidth: '95vw', maxHeight: '90vh',
    background: '#fff', borderRadius: '20px',
    boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    ...shorthands.padding('24px'),
    ...shorthands.borderBottom('1px', 'solid', 'rgba(0,0,0,0.06)'),
    background: '#f8fafc',
  },
  content: {
    flex: 1, overflowY: 'auto',
    ...shorthands.padding('24px'),
    display: 'flex', flexDirection: 'column', ...shorthands.gap('20px'),
  },
  footer: {
    display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
    ...shorthands.gap('12px'), ...shorthands.padding('20px', '24px'),
    ...shorthands.borderTop('1px', 'solid', 'rgba(0,0,0,0.06)'),
  },
  formGrid: {
    display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr)',
    gridAutoFlow: 'row', gap: '16px',
  },
  fieldGroup: {
    display: 'flex', flexDirection: 'column', ...shorthands.gap('4px'),
  },
  fieldLabel: {
    fontWeight: 600, fontSize: '13px', color: '#003057', display: 'block',
  },
  fullWidth: { gridColumn: '1 / -1' }
});

const DEFAULT_FORM: OpexFormData = {
  procesoAbastecimiento: 'Ejecución contractual',
  contrato: '',
  objeto: '',
  proveedor: '',
  fechaInicio: '',
  fechaFin: '',
  administrador: '',
  supervisor: '',
  estadoContrato: 'VIGENTE',
  descripcionNecesidad: '',
};

export const OpexWizard: React.FC<OpexWizardProps> = ({ open, onClose, monitoreoPayload, onComplete, initialOpexData }) => {
  const styles = useStyles();
  const [formData, setFormData] = useState<OpexFormData>({ ...DEFAULT_FORM });

  // Pre-llenar con datos existentes al abrir en modo edición
  React.useEffect(() => {
    if (open) {
      if (initialOpexData) {
        setFormData({ ...DEFAULT_FORM, ...initialOpexData });
      } else if (monitoreoPayload) {
        const desc = `Monitoreo en ${monitoreoPayload.zona} - Estación ${monitoreoPayload.estacion} (Evaluando ${monitoreoPayload.parametrosSeleccionados.length} parámetros)`;
        setFormData({ ...DEFAULT_FORM, descripcionNecesidad: desc });
      } else {
        setFormData({ ...DEFAULT_FORM });
      }
    }
  }, [open, monitoreoPayload, initialOpexData]);

  if (!open) return null;

  const handleChange = (field: keyof OpexFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFinish = () => {
    onComplete(formData);
  };

  return (
    <Portal>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.wizard} onClick={e => e.stopPropagation()}>
          <div className={styles.header}>
            <div>
              <Title3 style={{ color: '#003057', display: 'block' }}>Completar Datos OPEX</Title3>
              <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Ingresa los detalles del contrato para asociar la planeación al presupuesto.</Caption1>
            </div>
            <Button appearance="subtle" icon={<DismissRegular />} onClick={onClose} aria-label="Cerrar" />
          </div>

          <div className={styles.content}>
             
            <div className={styles.formGrid}>
               <div className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Proceso de Abastecimiento</span>
                  <Dropdown
                    placeholder="Seleccione"
                    value={formData.procesoAbastecimiento}
                    onOptionSelect={(e, d) => handleChange('procesoAbastecimiento', d.optionValue || '')}
                  >
                    <Option value="Ejecución contractual">Ejecución contractual</Option>
                    <Option value="Pre-contractual">Pre-contractual</Option>
                  </Dropdown>
               </div>
               
               <div className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Estado del Contrato</span>
                  <Dropdown
                    placeholder="Seleccione"
                    value={formData.estadoContrato}
                    onOptionSelect={(e, d) => handleChange('estadoContrato', d.optionValue || '')}
                  >
                    <Option value="VIGENTE">VIGENTE</Option>
                    <Option value="CERRADO">CERRADO</Option>
                  </Dropdown>
               </div>

               <div className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>No. de contrato</span>
                  <Input 
                    value={formData.contrato} 
                    onChange={(e, d) => handleChange('contrato', d.value)} 
                    placeholder="Ej. 8000008649" 
                    contentBefore={<DocumentTextRegular />}
                  />
               </div>

               <div className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Proveedor</span>
                  <Input 
                    value={formData.proveedor} 
                    onChange={(e, d) => handleChange('proveedor', d.value)} 
                    placeholder="Ej. ESTUDIOS TECNICOS SAS" 
                    contentBefore={<OrganizationRegular />}
                  />
               </div>

               <div className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Fecha Inicio</span>
                  <Input 
                    type="date"
                    value={formData.fechaInicio} 
                    onChange={(e, d) => handleChange('fechaInicio', d.value)} 
                  />
               </div>

               <div className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Fecha Fin</span>
                  <Input 
                    type="date"
                    value={formData.fechaFin} 
                    onChange={(e, d) => handleChange('fechaFin', d.value)} 
                  />
               </div>

               <div className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Administrador</span>
                  <Input 
                    value={formData.administrador} 
                    onChange={(e, d) => handleChange('administrador', d.value)} 
                  />
               </div>

               <div className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Supervisor Técnico</span>
                  <Input 
                    value={formData.supervisor} 
                    onChange={(e, d) => handleChange('supervisor', d.value)} 
                  />
               </div>

               <div className={styles.fieldGroup} style={{ gridColumn: '1 / -1' }}>
                  <span className={styles.fieldLabel}>Objeto del Contrato</span>
                  <Textarea 
                    value={formData.objeto} 
                    onChange={(e, d) => handleChange('objeto', d.value)} 
                    placeholder="Descripción resumida del objeto contractual..."
                    resize="vertical"
                  />
               </div>

               <div className={styles.fieldGroup} style={{ gridColumn: '1 / -1' }}>
                  <span className={styles.fieldLabel}>Descripción de la Necesidad (Resumen)</span>
                  <Textarea 
                    value={formData.descripcionNecesidad} 
                    onChange={(e, d) => handleChange('descripcionNecesidad', d.value)}
                    resize="vertical"
                  />
               </div>

            </div>
          </div>

          <div className={styles.footer}>
            <Button appearance="outline" onClick={onClose}>Cancelar</Button>
            <Button 
                appearance="primary" 
                icon={<CheckmarkRegular />} 
                onClick={handleFinish}
                style={{ background: CENIT_COLORS.green, border: 'none' }}
                disabled={!formData.contrato || !formData.proveedor}
            >
              Generar Pre-Carga OPEX
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  );
};
