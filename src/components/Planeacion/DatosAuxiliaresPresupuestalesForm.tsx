import React, { useEffect, useMemo, useState } from 'react';
import {
  makeStyles, shorthands, tokens,
  Caption1, Dropdown, Input, Option, Textarea,
  Combobox, OptionGroup, Badge,
} from '@fluentui/react-components';
import {
  DocumentTextRegular,
  OrganizationRegular,
} from '@fluentui/react-icons';
import {
  contratosPorTipo, getContratoByNo,
  TIPO_CONTRATO_LABEL,
} from '../../data/contratosAmbientales';
import { NecesidadesService } from '../../services/NecesidadesService';
import { CatalogoNecesidades, NECESIDADES_DEFAULT } from '../../data/necesidades';

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
  necesidad: string;
  subnecesidad: string;
  /** Notas libres (antes "Descripción de la necesidad"); se exportan como "Observaciones". */
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
  necesidad: '',
  subnecesidad: '',
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
  selectorCard: {
    gridColumn: '1 / -1',
    ...shorthands.padding('14px', '16px'),
    borderRadius: '12px',
    background: 'rgba(0,51,160,0.04)',
    ...shorthands.border('1px', 'solid', 'rgba(0,51,160,0.12)'),
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('6px'),
  },
  selectorChip: {
    marginTop: '2px',
  },
});

const OTRO = '__OTRO__';

// Deriva el estado del contrato a partir de las fechas del maestro.
const estadoDesdeContrato = (fechaFin: string): string => {
  if (!fechaFin) return 'POR FIRMAR ACTA DE INICIO';
  return new Date(fechaFin) >= new Date() ? 'VIGENTE' : 'CERRADO';
};

export const DatosAuxiliaresPresupuestalesForm: React.FC<Props> = ({ value, onChange }) => {
  const styles = useStyles();
  const grupos = useMemo(() => contratosPorTipo(), []);

  // Si los datos actuales coinciden con un contrato del maestro, lo marcamos.
  const contratoActual = useMemo(() => getContratoByNo(value.contrato), [value.contrato]);
  const [seleccion, setSeleccion] = useState<string>(contratoActual ? value.contrato : '');

  // Catálogo de Necesidad → Subnecesidad (Supabase + bundle base).
  const [catalogo, setCatalogo] = useState<CatalogoNecesidades>(NECESIDADES_DEFAULT);
  useEffect(() => {
    let cancel = false;
    NecesidadesService.getCatalogo().then(c => { if (!cancel) setCatalogo(c); }).catch(() => {});
    return () => { cancel = true; };
  }, []);
  const necesidades = useMemo(() => Object.keys(catalogo).sort((a, b) => a.localeCompare(b, 'es')), [catalogo]);
  const subnecesidades = useMemo(
    () => (value.necesidad && catalogo[value.necesidad]) ? catalogo[value.necesidad] : [],
    [catalogo, value.necesidad],
  );

  const handleChange = (field: keyof DatosAuxiliaresPresupuestales, nextValue: string) => {
    onChange({ ...value, [field]: nextValue });
  };

  // Necesidad: al cambiar (incluida una nueva), resetea la subnecesidad.
  const setNecesidad = (n: string) => {
    onChange({ ...value, necesidad: n, subnecesidad: '' });
  };
  // Subnecesidad: al fijarla, persiste el par en el catálogo (cualquier planeador).
  const setSubnecesidad = (s: string) => {
    onChange({ ...value, subnecesidad: s });
    const n = value.necesidad.trim();
    if (n && s.trim() && !(catalogo[n]?.includes(s.trim()))) {
      setCatalogo(prev => ({ ...prev, [n]: [...(prev[n] ?? []), s.trim()].sort((a, b) => a.localeCompare(b, 'es')) }));
      void NecesidadesService.crearPar(n, s.trim());
    }
  };

  const handleSeleccionContrato = (optionValue?: string) => {
    if (!optionValue) return;
    if (optionValue === OTRO) {
      // Modo manual: no borra lo ya escrito, solo deja los campos libres.
      setSeleccion(OTRO);
      return;
    }
    const c = getContratoByNo(optionValue);
    if (!c) return;
    setSeleccion(c.noContrato);
    onChange({
      ...value,
      contrato: c.noContrato,
      proveedor: c.contratista,
      administrador: c.administrador,
      supervisor: c.supervisor,
      objeto: c.objeto,
      fechaInicio: c.fechaInicio,
      fechaFin: c.fechaFin,
      estadoContrato: estadoDesdeContrato(c.fechaFin),
    });
  };

  const comboText = seleccion === OTRO
    ? 'Otro / ingresar manualmente'
    : contratoActual
      ? `${contratoActual.noContrato} — ${contratoActual.contratista}`
      : '';

  return (
    <div className={styles.formGrid}>
      {/* Selector de contrato predefinido (autocompleta los campos) */}
      <div className={styles.selectorCard}>
        <span className={styles.fieldLabel}>Seleccionar contrato (autocompleta)</span>
        <Combobox
          placeholder="Busca por No. de contrato o contratista…"
          value={comboText}
          selectedOptions={seleccion ? [seleccion] : []}
          onOptionSelect={(_, data) => handleSeleccionContrato(data.optionValue)}
          clearable
          freeform={false}
        >
          {grupos.map(g => (
            <OptionGroup key={g.tipo} label={TIPO_CONTRATO_LABEL[g.tipo]}>
              {g.contratos.map(c => (
                <Option key={c.noContrato} value={c.noContrato} text={`${c.noContrato} ${c.contratista}`}>
                  {`${c.noContrato} — ${c.contratista}`}
                </Option>
              ))}
            </OptionGroup>
          ))}
          <OptionGroup label="Sin contrato del listado">
            <Option value={OTRO} text="Otro / ingresar manualmente">Otro / ingresar manualmente</Option>
          </OptionGroup>
        </Combobox>
        {contratoActual && seleccion !== OTRO ? (
          <Badge className={styles.selectorChip} appearance="tint" color="brand" icon={<DocumentTextRegular />}>
            {TIPO_CONTRATO_LABEL[contratoActual.tipo]} · Sup.: {contratoActual.supervisor || '—'}
          </Badge>
        ) : (
          <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
            Elige un contrato para autocompletar proveedor, administrador, supervisor, objeto y fechas. Puedes ajustarlos abajo.
          </Caption1>
        )}
      </div>

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
          <Option value="POR FIRMAR ACTA DE INICIO">POR FIRMAR ACTA DE INICIO</Option>
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

      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Necesidad <span style={{ color: '#e00' }}>*</span></span>
        <Combobox
          placeholder="Elige o escribe una nueva necesidad…"
          freeform
          value={value.necesidad}
          selectedOptions={value.necesidad ? [value.necesidad] : []}
          onOptionSelect={(_, data) => setNecesidad(data.optionValue || '')}
          onChange={(e) => setNecesidad((e.target as HTMLInputElement).value)}
        >
          {necesidades.map(n => <Option key={n} value={n} text={n}>{n}</Option>)}
        </Combobox>
        <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
          Escribe una nueva para crearla; quedará disponible para todos.
        </Caption1>
      </div>

      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Subnecesidad <span style={{ color: '#e00' }}>*</span></span>
        <Combobox
          placeholder={value.necesidad ? 'Elige o escribe una nueva subnecesidad…' : 'Selecciona primero la necesidad'}
          freeform
          disabled={!value.necesidad.trim()}
          value={value.subnecesidad}
          selectedOptions={value.subnecesidad ? [value.subnecesidad] : []}
          onOptionSelect={(_, data) => setSubnecesidad(data.optionValue || '')}
          onChange={(e) => handleChange('subnecesidad', (e.target as HTMLInputElement).value)}
          onBlur={(e) => setSubnecesidad((e.target as HTMLInputElement).value)}
        >
          {subnecesidades.map(s => <Option key={s} value={s} text={s}>{s}</Option>)}
        </Combobox>
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
        <span className={styles.fieldLabel}>Observaciones</span>
        <Textarea
          value={value.descripcionNecesidad}
          onChange={(_, data) => handleChange('descripcionNecesidad', data.value)}
          placeholder="Notas u observaciones de la actividad…"
          resize="vertical"
        />
        <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
          Se incluye al final de la exportación presupuestal como "Observaciones".
        </Caption1>
      </div>
    </div>
  );
};
