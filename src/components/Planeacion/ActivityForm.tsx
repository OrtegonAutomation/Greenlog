// ============================================================
// ActivityForm — Drawer lateral para crear/editar actividades
// Usa OverlayDrawer de Fluent UI v9 (desliza desde la derecha)
// ============================================================
import React, { useCallback, useState } from 'react';
import {
  makeStyles, shorthands, tokens,
  OverlayDrawer, DrawerHeader, DrawerHeaderTitle, DrawerBody,
  Button, Field, Input, Select, Textarea, Slider,
  Caption1Strong, Divider, MessageBar, MessageBarBody, MessageBarTitle,
  Spinner,
} from '@fluentui/react-components';
import { DismissRegular, CheckmarkRegular, SaveRegular } from '@fluentui/react-icons';
import {
  NuevaActividadPayload, FORM_INICIAL, ESTADOS_ACTIVIDAD,
  PRIORIDADES, TIPOS_ACTIVIDAD, ZONAS,
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
  if (!form.ubicacionZona)      e.ubicacionZona = 'Selecciona una zona.';
  return e;
}

// ── Props ─────────────────────────────────────────────────────
interface ActivityFormProps {
  open: boolean;
  onClose: () => void;
  onGuardar: (payload: NuevaActividadPayload) => Promise<void>;
  guardando: boolean;
  errorGuardar: string | null;
}

// ── Componente ────────────────────────────────────────────────
export const ActivityForm: React.FC<ActivityFormProps> = ({
  open, onClose, onGuardar, guardando, errorGuardar,
}) => {
  const styles = useStyles();
  const [form, setForm]     = useState<NuevaActividadPayload>(FORM_INICIAL);
  const [errores, setErrores] = useState<Errores>({});

  const set = useCallback(<K extends keyof NuevaActividadPayload>(
    campo: K, valor: NuevaActividadPayload[K]
  ) => {
    setForm((p) => ({ ...p, [campo]: valor }));
    setErrores((p) => ({ ...p, [campo]: undefined }));
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
      size="medium"
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
          Nueva Actividad Ambiental
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
              <Field label="Tipo de actividad">
                <Select value={form.tipo} onChange={(_, d) => set('tipo', d.value as typeof form.tipo)} disabled={guardando}>
                  {TIPOS_ACTIVIDAD.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
              </Field>
              <Field label="Prioridad">
                <Select value={form.prioridad} onChange={(_, d) => set('prioridad', d.value as typeof form.prioridad)} disabled={guardando}>
                  {PRIORIDADES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
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

          {/* ── Sección 2: Fechas ── */}
          <div className={styles.section}>
            <Caption1Strong className={styles.sectionLabel}>Planificación temporal</Caption1Strong>
            <Divider />
            <div className={styles.grid2}>
              <Field label="Fecha de inicio" required validationState={errores.fechaInicio ? 'error' : 'none'} validationMessage={errores.fechaInicio}>
                <Input type="date" value={form.fechaInicio} onChange={(_, d) => set('fechaInicio', d.value)} disabled={guardando} />
              </Field>
              <Field label="Fecha de fin" required validationState={errores.fechaFin ? 'error' : 'none'} validationMessage={errores.fechaFin}>
                <Input type="date" value={form.fechaFin} min={form.fechaInicio || undefined} onChange={(_, d) => set('fechaFin', d.value)} disabled={guardando} />
              </Field>
            </div>
          </div>

          {/* ── Sección 3: Responsabilidad y ubicación ── */}
          <div className={styles.section}>
            <Caption1Strong className={styles.sectionLabel}>Responsabilidad y ubicación</Caption1Strong>
            <Divider />

            <Field label="Responsable" required validationState={errores.responsable ? 'error' : 'none'} validationMessage={errores.responsable}>
              <Input placeholder="Nombre del responsable de la actividad" value={form.responsable} onChange={(_, d) => set('responsable', d.value)} disabled={guardando} />
            </Field>

            <Field label="Ubicación / Zona" required validationState={errores.ubicacionZona ? 'error' : 'none'} validationMessage={errores.ubicacionZona}>
              <Select value={form.ubicacionZona} onChange={(_, d) => set('ubicacionZona', d.value)} disabled={guardando}>
                <option value="">-- Selecciona una zona --</option>
                {ZONAS.map((z) => <option key={z} value={z}>{z}</option>)}
              </Select>
            </Field>
          </div>

          {/* ── Sección 4: Estado y cumplimiento ── */}
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
            {guardando ? 'Guardando...' : 'Guardar actividad'}
          </Button>
        </div>
      </form>
    </OverlayDrawer>
  );
};
