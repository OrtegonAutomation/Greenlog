// ============================================================
// ObligacionForm — Drawer para crear/editar provisión
// ============================================================
import React, { useState, useEffect } from 'react';
import {
  makeStyles, shorthands, tokens,
  Input, Button, Dropdown, Option, Label,
  Title3,
} from '@fluentui/react-components';
import {
  DismissRegular,
  SaveRegular,
} from '@fluentui/react-icons';
import {
  Provision, NuevaProvisionPayload,
  TIPOS_OBLIGACION, CATEGORIAS_COMPENSACION, ESTADOS_PROVISION,
  TipoObligacion, CategoriaCompensacion, EstadoProvision, TipoCuentaProvision,
} from '../../../types/provisiones';
import { CENIT_COLORS } from '../../../theme/cenitTheme';

const ZONAS = ['Occidente', 'Centro', 'Oriente', 'Llanos', 'CLC', 'Norte', 'Coveñas'];

const useStyles = makeStyles({
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.3)',
    backdropFilter: 'blur(4px)',
    zIndex: 100,
    animationName: { from: { opacity: '0' }, to: { opacity: '1' } },
    animationDuration: '0.2s',
    animationFillMode: 'both',
  },
  drawer: {
    position: 'fixed',
    top: 0, right: 0, bottom: 0,
    width: '560px',
    maxWidth: '100vw',
    background: '#fff',
    boxShadow: '-12px 0 48px rgba(0,0,0,0.12)',
    zIndex: 101,
    display: 'flex',
    flexDirection: 'column',
    animationName: { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
    animationDuration: '0.3s',
    animationTimingFunction: 'cubic-bezier(0.16,1,0.3,1)',
    animationFillMode: 'both',
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('20px', '24px'),
    ...shorthands.borderBottom('1px', 'solid', 'rgba(0,0,0,0.06)'),
    flexShrink: 0,
  },
  drawerBody: {
    flex: 1,
    overflowY: 'auto',
    ...shorthands.padding('24px'),
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: CENIT_COLORS.blueBrand,
    marginBottom: '12px',
    ...shorthands.borderBottom('2px', 'solid', CENIT_COLORS.blueBrand),
    paddingBottom: '6px',
  },
  fieldGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    ...shorthands.gap('12px'),
  },
  fieldFull: {
    gridColumn: 'span 2',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
  },
  drawerFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    ...shorthands.gap('8px'),
    ...shorthands.padding('16px', '24px'),
    ...shorthands.borderTop('1px', 'solid', 'rgba(0,0,0,0.06)'),
    flexShrink: 0,
  },
  closeBtn: {
    width: '36px', height: '36px', minWidth: '36px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '10px', cursor: 'pointer',
    transition: 'background 0.15s ease',
    color: tokens.colorNeutralForeground2,
    ':hover': { background: 'rgba(0,0,0,0.06)' },
  },
});

interface Props {
  provision?: Provision | null;
  open: boolean;
  guardando: boolean;
  onClose: () => void;
  onSave: (payload: NuevaProvisionPayload, id?: string) => void;
}

const emptyForm = (): NuevaProvisionPayload => ({
  tipoObligacion: 'Compensación Forestal',
  estadoAvance: 'Notificada',
  zona: '',
  sistema: '',
  troncal: '',
  responsable: '',
  autoridadAmbiental: '',
  jurisdiccionCAR: '',
  numeroExpediente: '',
  actoAdministrativo: { tipo: '', numero: '', fecha: '' },
  departamento: '',
  municipio: '',
  medidaCompensacion: '',
  categoria: 'Restauración',
  tipoCuenta: 'OPEX',
  contrato: 'BQS',
  ods: '',
  solped: '',
  valorProvisionTotal: 0,
  usoProvisionTotal: 0,
  saldoProvision: 0,
  anioConstitucion: new Date().getFullYear(),
  valorProvisionAnual: {},
  usoProvisionAnual: {},
  usoProyectado: {},
  costosAdminMensuales: Array(12).fill(0),
});

export const ObligacionForm: React.FC<Props> = ({ provision, open, guardando, onClose, onSave }) => {
  const styles = useStyles();
  const [form, setForm] = useState<NuevaProvisionPayload>(emptyForm());

  useEffect(() => {
    if (provision) {
      const { id, creadoEn, actualizadoEn, ...rest } = provision;
      setForm(rest as NuevaProvisionPayload);
    } else {
      setForm(emptyForm());
    }
  }, [provision, open]);

  if (!open) return null;

  const set = <K extends keyof NuevaProvisionPayload>(key: K, val: NuevaProvisionPayload[K]) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = () => {
    onSave(form, provision?.id);
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.drawer}>
        <div className={styles.drawerHeader}>
          <Title3 style={{ color: '#003057' }}>{provision ? 'Editar Obligación' : 'Nueva Obligación'}</Title3>
          <div className={styles.closeBtn} onClick={onClose}><DismissRegular /></div>
        </div>

        <div className={styles.drawerBody}>
          {/* Identificación */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Identificación</div>
            <div className={styles.fieldGrid}>
              <div className={styles.field}>
                <Label size="small">Tipo Obligación</Label>
                <Dropdown
                  value={form.tipoObligacion}
                  selectedOptions={[form.tipoObligacion]}
                  onOptionSelect={(_, d) => set('tipoObligacion', d.optionValue as TipoObligacion)}
                >
                  {TIPOS_OBLIGACION.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
                </Dropdown>
              </div>
              <div className={styles.field}>
                <Label size="small">Estado</Label>
                <Dropdown
                  value={form.estadoAvance}
                  selectedOptions={[form.estadoAvance]}
                  onOptionSelect={(_, d) => set('estadoAvance', d.optionValue as EstadoProvision)}
                >
                  {ESTADOS_PROVISION.map(e => <Option key={e.value} value={e.value}>{e.label}</Option>)}
                </Dropdown>
              </div>
              <div className={styles.field}>
                <Label size="small">Zona</Label>
                <Dropdown
                  value={form.zona}
                  selectedOptions={form.zona ? [form.zona] : []}
                  onOptionSelect={(_, d) => set('zona', d.optionValue as string)}
                >
                  {ZONAS.map(z => <Option key={z} value={z}>{z}</Option>)}
                </Dropdown>
              </div>
              <div className={styles.field}>
                <Label size="small">Responsable</Label>
                <Input value={form.responsable} onChange={(_, d) => set('responsable', d.value)} />
              </div>
              <div className={styles.field}>
                <Label size="small">Sistema</Label>
                <Input value={form.sistema} onChange={(_, d) => set('sistema', d.value)} />
              </div>
              <div className={styles.field}>
                <Label size="small">Troncal</Label>
                <Input value={form.troncal} onChange={(_, d) => set('troncal', d.value)} />
              </div>
            </div>
          </div>

          {/* Legal */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Legal</div>
            <div className={styles.fieldGrid}>
              <div className={styles.field}>
                <Label size="small">Autoridad Ambiental</Label>
                <Input value={form.autoridadAmbiental} onChange={(_, d) => set('autoridadAmbiental', d.value)} />
              </div>
              <div className={styles.field}>
                <Label size="small">Jurisdicción CAR</Label>
                <Input value={form.jurisdiccionCAR} onChange={(_, d) => set('jurisdiccionCAR', d.value)} />
              </div>
              <div className={styles.field}>
                <Label size="small">No. Expediente</Label>
                <Input value={form.numeroExpediente} onChange={(_, d) => set('numeroExpediente', d.value)} />
              </div>
              <div className={styles.field}>
                <Label size="small">Tipo Acto Admin.</Label>
                <Input
                  value={form.actoAdministrativo.tipo}
                  onChange={(_, d) => set('actoAdministrativo', { ...form.actoAdministrativo, tipo: d.value })}
                />
              </div>
              <div className={styles.field}>
                <Label size="small">No. Acto Admin.</Label>
                <Input
                  value={form.actoAdministrativo.numero}
                  onChange={(_, d) => set('actoAdministrativo', { ...form.actoAdministrativo, numero: d.value })}
                />
              </div>
              <div className={styles.field}>
                <Label size="small">Fecha Acto Admin.</Label>
                <Input
                  type="date"
                  value={form.actoAdministrativo.fecha}
                  onChange={(_, d) => set('actoAdministrativo', { ...form.actoAdministrativo, fecha: d.value })}
                />
              </div>
              <div className={styles.field}>
                <Label size="small">Departamento</Label>
                <Input value={form.departamento} onChange={(_, d) => set('departamento', d.value)} />
              </div>
              <div className={styles.field}>
                <Label size="small">Municipio</Label>
                <Input value={form.municipio} onChange={(_, d) => set('municipio', d.value)} />
              </div>
            </div>
          </div>

          {/* Compensación */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Compensación</div>
            <div className={styles.fieldGrid}>
              <div className={styles.field + ' ' + styles.fieldFull}>
                <Label size="small">Medida de Compensación</Label>
                <Input value={form.medidaCompensacion} onChange={(_, d) => set('medidaCompensacion', d.value)} />
              </div>
              <div className={styles.field}>
                <Label size="small">Categoría</Label>
                <Dropdown
                  value={form.categoria}
                  selectedOptions={[form.categoria]}
                  onOptionSelect={(_, d) => set('categoria', d.optionValue as CategoriaCompensacion)}
                >
                  {CATEGORIAS_COMPENSACION.map(c => <Option key={c.value} value={c.value}>{c.label}</Option>)}
                </Dropdown>
              </div>
            </div>
          </div>

          {/* Financiero */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Financiero</div>
            <div className={styles.fieldGrid}>
              <div className={styles.field}>
                <Label size="small">Tipo Cuenta</Label>
                <Dropdown
                  value={form.tipoCuenta}
                  selectedOptions={[form.tipoCuenta]}
                  onOptionSelect={(_, d) => set('tipoCuenta', d.optionValue as TipoCuentaProvision)}
                >
                  <Option value="OPEX">OPEX</Option>
                  <Option value="CAPEX">CAPEX</Option>
                </Dropdown>
              </div>
              <div className={styles.field}>
                <Label size="small">Contrato</Label>
                <Input value={form.contrato} onChange={(_, d) => set('contrato', d.value)} />
              </div>
              <div className={styles.field}>
                <Label size="small">ODS</Label>
                <Input value={form.ods} onChange={(_, d) => set('ods', d.value)} />
              </div>
              <div className={styles.field}>
                <Label size="small">SOLPED</Label>
                <Input value={form.solped} onChange={(_, d) => set('solped', d.value)} />
              </div>
              <div className={styles.field}>
                <Label size="small">Valor Provisión Total</Label>
                <Input
                  type="number"
                  value={String(form.valorProvisionTotal)}
                  onChange={(_, d) => set('valorProvisionTotal', Number(d.value) || 0)}
                />
              </div>
              <div className={styles.field}>
                <Label size="small">Año Constitución</Label>
                <Input
                  type="number"
                  value={String(form.anioConstitucion)}
                  onChange={(_, d) => set('anioConstitucion', Number(d.value) || 2025)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.drawerFooter}>
          <Button appearance="subtle" onClick={onClose}>Cancelar</Button>
          <Button
            appearance="primary"
            icon={<SaveRegular />}
            onClick={handleSubmit}
            disabled={guardando}
            style={{ borderRadius: '12px' }}
          >
            {guardando ? 'Guardando...' : (provision ? 'Actualizar' : 'Crear')}
          </Button>
        </div>
      </div>
    </>
  );
};
