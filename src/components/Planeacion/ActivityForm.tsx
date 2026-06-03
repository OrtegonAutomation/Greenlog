// ============================================================
// ActivityForm — Drawer lateral para crear/editar actividades
// Modelo CENIT: Línea Operativa, Zona→Estación, Contrato,
// Presupuesto, Matrices Ambientales
// ============================================================
import React, { useCallback, useMemo, useState } from 'react';
import {
  makeStyles, shorthands, tokens,
  OverlayDrawer, DrawerHeader, DrawerHeaderTitle, DrawerBody,
  Button, Field, Input, Select, Textarea, Slider, Checkbox,
  Caption1Strong, Divider, MessageBar, MessageBarBody, MessageBarTitle,
  Spinner, Badge,
} from '@fluentui/react-components';
import { DismissRegular, SaveRegular } from '@fluentui/react-icons';
import {
  NuevaActividadPayload, FORM_INICIAL, ESTADOS_ACTIVIDAD,
  PRIORIDADES, LINEAS_OPERATIVAS, ZONAS, ZONAS_ESTACIONES,
  CONTRATOS, MESES, TIPOS_CUENTA, RESPONSABLES,
  MATRICES_AMBIENTALES, MatrizAmbiental, ActividadAmbiental,
} from '../../types';

// ── Estilos ───────────────────────────────────────────────────
const useStyles = makeStyles({
  body: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalL),
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalL),
    overflowY: 'auto',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalM),
  },
  sectionLabel: {
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    fontSize: '11px',
    letterSpacing: '0.06em',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    ...shorthands.gap(tokens.spacingVerticalM, tokens.spacingHorizontalM),
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    ...shorthands.gap(tokens.spacingVerticalM, tokens.spacingHorizontalM),
  },
  sliderRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalM),
  },
  sliderValue: {
    minWidth: '38px',
    textAlign: 'right',
    fontWeight: '600',
    color: tokens.colorBrandForeground1,
    fontSize: '14px',
  },
  matricesGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    ...shorthands.gap('4px', tokens.spacingHorizontalM),
  },
  matricesBadges: {
    display: 'flex',
    flexWrap: 'wrap',
    ...shorthands.gap('6px'),
    marginTop: '8px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    ...shorthands.gap(tokens.spacingHorizontalM),
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalL),
    ...shorthands.borderTop('1px', 'solid', tokens.colorNeutralStroke2),
    backgroundColor: tokens.colorNeutralBackground2,
    marginTop: 'auto',
    position: 'sticky',
    bottom: 0,
  },
});

// ── Validación ────────────────────────────────────────────────
type Errores = Partial<Record<keyof NuevaActividadPayload, string>>;

function validar(form: NuevaActividadPayload): Errores {
  const e: Errores = {};
  if (!form.tarea.trim())       e.tarea       = 'Campo obligatorio.';
  if (!form.responsable.trim()) e.responsable = 'Campo obligatorio.';
  if (!form.fechaInicio)        e.fechaInicio = 'Campo obligatorio.';
  if (!form.fechaFin)           e.fechaFin    = 'Campo obligatorio.';
  if (form.fechaInicio && form.fechaFin && form.fechaFin < form.fechaInicio)
    e.fechaFin = 'La fecha de fin debe ser posterior al inicio.';
  if (!form.zona)               e.zona        = 'Selecciona una zona.';
  if (!form.mes)                e.mes         = 'Selecciona un mes.';
  return e;
}

// ── Props ─────────────────────────────────────────────────────
interface ActivityFormProps {
  open: boolean;
  onClose: () => void;
  onGuardar: (payload: NuevaActividadPayload) => Promise<void>;
  guardando: boolean;
  errorGuardar: string | null;
  actividadInicial?: ActividadAmbiental | null;
}

// ── Componente ────────────────────────────────────────────────
export const ActivityForm: React.FC<ActivityFormProps> = ({
  open, onClose, onGuardar, guardando, errorGuardar, actividadInicial,
}) => {
  const styles = useStyles();
  const modoEdicion = !!actividadInicial;

  const formInicial = useMemo<NuevaActividadPayload>(() => {
    if (!actividadInicial) return FORM_INICIAL;
    const { id: _id, creadoEn: _c, actualizadoEn: _a, ...rest } = actividadInicial as any;
    return { ...FORM_INICIAL, ...rest };
  }, [actividadInicial]);

  const [form, setForm]     = useState<NuevaActividadPayload>(formInicial);
  const [errores, setErrores] = useState<Errores>({});

  // Sincronizar cuando cambia la actividad a editar
  React.useEffect(() => {
    if (open) {
      setForm(formInicial);
      setErrores({});
    }
  }, [open, formInicial]);

  const set = useCallback(<K extends keyof NuevaActividadPayload>(
    campo: K, valor: NuevaActividadPayload[K]
  ) => {
    setForm((p) => ({ ...p, [campo]: valor }));
    setErrores((p) => ({ ...p, [campo]: undefined }));
  }, []);

  // Estaciones filtradas por zona seleccionada
  const estacionesZona = useMemo(
    () => form.zona ? (ZONAS_ESTACIONES[form.zona] ?? []) : [],
    [form.zona],
  );

  // Responsables filtrados por zona
  const responsablesZona = useMemo(
    () => form.zona
      ? RESPONSABLES.filter((r) => r.zona === form.zona || r.zona === 'Transversal')
      : RESPONSABLES,
    [form.zona],
  );

  // Toggle de matrices
  const toggleMatriz = useCallback((m: MatrizAmbiental) => {
    setForm((p) => {
      const current = p.matricesAplicables ?? [];
      return {
        ...p,
        matricesAplicables: current.includes(m)
          ? current.filter((x) => x !== m)
          : [...current, m],
      };
    });
  }, []);

  const handleCerrar = () => {
    setForm(FORM_INICIAL);
    setErrores({});
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const e2 = validar(form);
    if (Object.keys(e2).length) { setErrores(e2); return; }
    await onGuardar(form);
    setForm(FORM_INICIAL);
    setErrores({});
  };

  return (
    <OverlayDrawer
      position="end"
      size="large"
      open={open}
      onOpenChange={(_, s) => { if (!s.open) handleCerrar(); }}
    >
      <DrawerHeader>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              aria-label="Cerrar"
              icon={<DismissRegular />}
              onClick={handleCerrar}
              disabled={guardando}
            />
          }
        >
          {modoEdicion ? 'Editar Actividad' : 'Nueva Actividad Ambiental'}
        </DrawerHeaderTitle>
      </DrawerHeader>

      <form
        id="form-actividad"
        onSubmit={handleSubmit}
        noValidate
        style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
      >
        <DrawerBody className={styles.body}>
          {/* Error de guardar */}
          {errorGuardar && (
            <MessageBar intent="error">
              <MessageBarBody>
                <MessageBarTitle>Error al guardar</MessageBarTitle>
                {errorGuardar}
              </MessageBarBody>
            </MessageBar>
          )}

          {/* ── Sección 1: Información básica ── */}
          <div className={styles.section}>
            <Caption1Strong className={styles.sectionLabel}>Información básica</Caption1Strong>
            <Divider />

            <Field label="Tarea / Actividad" required validationState={errores.tarea ? 'error' : 'none'} validationMessage={errores.tarea}>
              <Input placeholder="Describe la actividad ambiental..." value={form.tarea} onChange={(_, d) => set('tarea', d.value)} disabled={guardando} />
            </Field>

            <div className={styles.grid2}>
              <Field label="Línea Operativa">
                <Select value={form.lineaOperativa} onChange={(_, d) => set('lineaOperativa', d.value as typeof form.lineaOperativa)} disabled={guardando}>
                  {LINEAS_OPERATIVAS.map((lo) => <option key={lo.value} value={lo.value}>{lo.label}</option>)}
                </Select>
              </Field>
              <Field label="Contrato">
                <Select value={form.contrato ?? ''} onChange={(_, d) => set('contrato', d.value)} disabled={guardando}>
                  <option value="">-- Sin contrato --</option>
                  {CONTRATOS.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </Field>
            </div>

            <div className={styles.grid2}>
              <Field label="Prioridad">
                <Select value={form.prioridad} onChange={(_, d) => set('prioridad', d.value as typeof form.prioridad)} disabled={guardando}>
                  {PRIORIDADES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </Select>
              </Field>
              <Field label="Tipo de Cuenta">
                <Select value={form.cuenta} onChange={(_, d) => set('cuenta', d.value as typeof form.cuenta)} disabled={guardando}>
                  {TIPOS_CUENTA.map((tc) => <option key={tc.value} value={tc.value}>{tc.label}</option>)}
                </Select>
              </Field>
            </div>

            <Field label="Descripción">
              <Textarea
                placeholder="Detalles de la actividad, objetivos, metodología..."
                value={form.descripcion ?? ''}
                onChange={(_, d) => set('descripcion', d.value)}
                disabled={guardando}
                rows={3}
                resize="vertical"
              />
            </Field>
          </div>

          {/* ── Sección 2: Planificación temporal ── */}
          <div className={styles.section}>
            <Caption1Strong className={styles.sectionLabel}>Planificación temporal</Caption1Strong>
            <Divider />
            <div className={styles.grid3}>
              <Field label="Mes presupuestal" required validationState={errores.mes ? 'error' : 'none'} validationMessage={errores.mes}>
                <Select value={form.mes} onChange={(_, d) => set('mes', d.value)} disabled={guardando}>
                  <option value="">-- Mes --</option>
                  {MESES.map((m) => <option key={m} value={m}>{m}</option>)}
                </Select>
              </Field>
              <Field label="Fecha de inicio" required validationState={errores.fechaInicio ? 'error' : 'none'} validationMessage={errores.fechaInicio}>
                <Input type="date" value={form.fechaInicio} onChange={(_, d) => set('fechaInicio', d.value)} disabled={guardando} />
              </Field>
              <Field label="Fecha de fin" required validationState={errores.fechaFin ? 'error' : 'none'} validationMessage={errores.fechaFin}>
                <Input type="date" value={form.fechaFin} min={form.fechaInicio || undefined} onChange={(_, d) => set('fechaFin', d.value)} disabled={guardando} />
              </Field>
            </div>
          </div>

          {/* ── Sección 3: Ubicación y Responsable ── */}
          <div className={styles.section}>
            <Caption1Strong className={styles.sectionLabel}>Ubicación y Responsable</Caption1Strong>
            <Divider />

            <div className={styles.grid2}>
              <Field label="Zona CENIT" required validationState={errores.zona ? 'error' : 'none'} validationMessage={errores.zona}>
                <Select
                  value={form.zona}
                  onChange={(_, d) => {
                    set('zona', d.value);
                    setForm((p) => ({ ...p, estacion: '', zona: d.value }));
                  }}
                  disabled={guardando}
                >
                  <option value="">-- Selecciona una zona --</option>
                  {ZONAS.map((z) => <option key={z} value={z}>{z}</option>)}
                </Select>
              </Field>
              <Field label="Estación">
                <Select
                  value={form.estacion ?? ''}
                  onChange={(_, d) => set('estacion', d.value)}
                  disabled={guardando || estacionesZona.length === 0}
                >
                  <option value="">-- {estacionesZona.length ? 'Selecciona estación' : 'Selecciona zona primero'} --</option>
                  {estacionesZona.map((est) => <option key={est} value={est}>{est}</option>)}
                </Select>
              </Field>
            </div>

            <Field label="Responsable" required validationState={errores.responsable ? 'error' : 'none'} validationMessage={errores.responsable}>
              <Select
                value={form.responsable}
                onChange={(_, d) => set('responsable', d.value)}
                disabled={guardando}
              >
                <option value="">-- Selecciona responsable --</option>
                {responsablesZona.map((r) => (
                  <option key={r.nombre} value={r.nombre}>
                    {r.nombre} ({r.zona})
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {/* ── Sección 4: Presupuesto ── */}
          <div className={styles.section}>
            <Caption1Strong className={styles.sectionLabel}>Presupuesto (COP)</Caption1Strong>
            <Divider />
            <div className={styles.grid3}>
              <Field label="Plan">
                <Input
                  type="number"
                  placeholder="0"
                  value={String(form.presupuestoPlan ?? 0)}
                  onChange={(_, d) => set('presupuestoPlan', Number(d.value) || 0)}
                  disabled={guardando}
                  contentBefore={<span style={{ fontSize: 12, color: '#888' }}>$</span>}
                />
              </Field>
              <Field label="Ejecutado">
                <Input
                  type="number"
                  placeholder="0"
                  value={String(form.presupuestoEjecutado ?? 0)}
                  onChange={(_, d) => set('presupuestoEjecutado', Number(d.value) || 0)}
                  disabled={guardando}
                  contentBefore={<span style={{ fontSize: 12, color: '#888' }}>$</span>}
                />
              </Field>
            </div>
          </div>

          {/* ── Sección 5: Matrices Ambientales ── */}
          <div className={styles.section}>
            <Caption1Strong className={styles.sectionLabel}>Matrices Ambientales Aplicables</Caption1Strong>
            <Divider />
            <div className={styles.matricesGrid}>
              {MATRICES_AMBIENTALES.map((ma) => (
                <Checkbox
                  key={ma.value}
                  label={ma.label}
                  checked={(form.matricesAplicables ?? []).includes(ma.value)}
                  onChange={() => toggleMatriz(ma.value)}
                  disabled={guardando}
                />
              ))}
            </div>
            {(form.matricesAplicables?.length ?? 0) > 0 && (
              <div className={styles.matricesBadges}>
                {form.matricesAplicables!.map((m) => (
                  <Badge key={m} appearance="tint" color="informative" shape="rounded">{m}</Badge>
                ))}
              </div>
            )}
          </div>

          {/* ── Sección 6: Estado y cumplimiento ── */}
          <div className={styles.section}>
            <Caption1Strong className={styles.sectionLabel}>Estado y normatividad</Caption1Strong>
            <Divider />

            <div className={styles.grid2}>
              <Field label="Estado inicial">
                <Select value={form.estado} onChange={(_, d) => set('estado', d.value as typeof form.estado)} disabled={guardando}>
                  {ESTADOS_ACTIVIDAD.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                </Select>
              </Field>
              <Field label="Norma / Reglamentación">
                <Input placeholder="Ej: Res. 2254/2017" value={form.cumplimientoNormativo ?? ''} onChange={(_, d) => set('cumplimientoNormativo', d.value)} disabled={guardando} />
              </Field>
            </div>

            <Field label={`Porcentaje de avance: ${form.porcentajeAvance}%`}>
              <div className={styles.sliderRow}>
                <Slider
                  min={0} max={100} step={5}
                  value={form.porcentajeAvance}
                  onChange={(_, d) => set('porcentajeAvance', d.value)}
                  disabled={guardando}
                  style={{ flex: 1 }}
                />
                <span className={styles.sliderValue}>{form.porcentajeAvance}%</span>
              </div>
            </Field>

            <Field label="Novedades / Observaciones">
              <Textarea
                placeholder="Registro de novedades o información adicional..."
                value={form.novedades ?? ''}
                onChange={(_, d) => set('novedades', d.value)}
                disabled={guardando}
                rows={2}
              />
            </Field>
          </div>
        </DrawerBody>

        {/* Footer pegajoso */}
        <div className={styles.footer}>
          <Button appearance="secondary" icon={<DismissRegular />} onClick={handleCerrar} disabled={guardando}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-actividad"
            appearance="primary"
            icon={guardando ? <Spinner size="tiny" /> : <SaveRegular />}
            disabled={guardando}
          >
            {guardando ? 'Guardando...' : modoEdicion ? 'Guardar cambios' : 'Guardar actividad'}
          </Button>
        </div>
      </form>
    </OverlayDrawer>
  );
};
