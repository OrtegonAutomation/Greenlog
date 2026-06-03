import React from 'react';
import {
  makeStyles, shorthands, tokens,
  Caption1, Dropdown, Input, Option, Textarea,
} from '@fluentui/react-components';
import {
  DocumentTextRegular,
  OrganizationRegular,
} from '@fluentui/react-icons';

export interface DatosAuxiliaresPresupuestales {
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

export const DEFAULT_DATOS_AUXILIARES: DatosAuxiliaresPresupuestales = {
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

interface Props {
  value: DatosAuxiliaresPresupuestales;
  onChange: (value: DatosAuxiliaresPresupuestales) => void;
}

const useStyles = makeStyles({
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(200px, 1fr))',
    gridAutoFlow: 'row',
    ...shorthands.gap('16px'),
    '@media (max-width: 640px)': {
      gridTemplateColumns: '1fr',
    },
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
    minWidth: 0,
  },
  fieldLabel: {
    fontWeight: 600,
    fontSize: '13px',
    color: '#003057',
    display: 'block',
  },
  fullWidth: {
    gridColumn: '1 / -1',
  },
});

export const DatosAuxiliaresPresupuestalesForm: React.FC<Props> = ({ value, onChange }) => {
  const styles = useStyles();

  const handleChange = (field: keyof DatosAuxiliaresPresupuestales, nextValue: string) => {
    onChange({ ...value, [field]: nextValue });
  };

  return (
    <div className={styles.formGrid}>
      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Proceso de Abastecimiento</span>
        <Dropdown
          placeholder="Seleccione"
          value={value.procesoAbastecimiento}
          selectedOptions={[value.procesoAbastecimiento]}
          onOptionSelect={(_, data) => handleChange('procesoAbastecimiento', data.optionValue || '')}
        >
          <Option value="Ejecución contractual">Ejecución contractual</Option>
          <Option value="Pre-contractual">Pre-contractual</Option>
        </Dropdown>
      </div>

      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Estado del Contrato</span>
        <Dropdown
          placeholder="Seleccione"
          value={value.estadoContrato}
          selectedOptions={[value.estadoContrato]}
          onOptionSelect={(_, data) => handleChange('estadoContrato', data.optionValue || '')}
        >
          <Option value="VIGENTE">VIGENTE</Option>
          <Option value="CERRADO">CERRADO</Option>
        </Dropdown>
      </div>

      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>No. de contrato <span style={{ color: '#e00' }}>*</span></span>
        <Input
          value={value.contrato}
          onChange={(_, data) => handleChange('contrato', data.value)}
          placeholder="Ej. 8000008649"
          contentBefore={<DocumentTextRegular />}
        />
      </div>

      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Proveedor <span style={{ color: '#e00' }}>*</span></span>
        <Input
          value={value.proveedor}
          onChange={(_, data) => handleChange('proveedor', data.value)}
          placeholder="Ej. ESTUDIOS TECNICOS SAS"
          contentBefore={<OrganizationRegular />}
        />
      </div>

      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Fecha Inicio</span>
        <Input
          type="date"
          value={value.fechaInicio}
          onChange={(_, data) => handleChange('fechaInicio', data.value)}
        />
      </div>

      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Fecha Fin</span>
        <Input
          type="date"
          value={value.fechaFin}
          onChange={(_, data) => handleChange('fechaFin', data.value)}
        />
      </div>

      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Administrador</span>
        <Input
          value={value.administrador}
          onChange={(_, data) => handleChange('administrador', data.value)}
        />
      </div>

      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Supervisor Técnico</span>
        <Input
          value={value.supervisor}
          onChange={(_, data) => handleChange('supervisor', data.value)}
        />
      </div>

      <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
        <span className={styles.fieldLabel}>Objeto del Contrato</span>
        <Textarea
          value={value.objeto}
          onChange={(_, data) => handleChange('objeto', data.value)}
          placeholder="Descripción resumida del objeto contractual..."
          resize="vertical"
        />
      </div>

      <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
        <span className={styles.fieldLabel}>Descripción de la Necesidad (Resumen)</span>
        <Textarea
          value={value.descripcionNecesidad}
          onChange={(_, data) => handleChange('descripcionNecesidad', data.value)}
          resize="vertical"
        />
        <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
          Esta información se incluirá en la exportación presupuestal.
        </Caption1>
      </div>
    </div>
  );
};
