// ============================================================
// NecesidadesAdminDialog — gestión del catálogo Necesidad/Subnecesidad.
// Agregar (cualquier planeador): formulario con Necesidad + Subnecesidad.
// Eliminar y plantilla de carga masiva: solo administradores.
// ============================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions,
  Button, Spinner, Caption1, Divider, MessageBar, MessageBarBody,
  Combobox, Option, Input, Field,
  makeStyles, shorthands, tokens,
} from '@fluentui/react-components';
import {
  DeleteRegular, ArrowDownloadRegular, ArrowUploadRegular, AddRegular,
} from '@fluentui/react-icons';
import * as XLSX from 'xlsx';
import { NecesidadesService } from '../../services/NecesidadesService';
import { CatalogoNecesidades } from '../../data/necesidades';

const useStyles = makeStyles({
  addCard: {
    ...shorthands.padding('14px'),
    borderRadius: '12px',
    background: 'rgba(0,176,80,0.06)',
    ...shorthands.border('1px', 'solid', 'rgba(0,176,80,0.18)'),
    display: 'flex', flexDirection: 'column', ...shorthands.gap('10px'),
  },
  addRow: { display: 'flex', ...shorthands.gap('10px'), flexWrap: 'wrap' },
  addCol: { display: 'flex', flexDirection: 'column', ...shorthands.gap('4px'), flex: '1 1 220px', minWidth: 0 },
  grupo: { ...shorthands.padding('8px', '0'), ...shorthands.borderBottom('1px', 'solid', 'rgba(0,0,0,0.06)') },
  grupoHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...shorthands.gap('8px') },
  necesidad: { fontWeight: 700, fontSize: '13px', color: '#003057' },
  sub: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...shorthands.padding('3px', '0', '3px', '14px'), ...shorthands.gap('8px') },
  subTxt: { fontSize: '13px', color: '#323130' },
  toolbar: { display: 'flex', ...shorthands.gap('8px'), flexWrap: 'wrap', margin: '12px 0 4px' },
  lista: { maxHeight: '38vh', overflowY: 'auto', ...shorthands.padding('0', '2px') },
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin?: boolean;
  /** Se invoca cuando el catálogo cambió (agregar/eliminar/cargar). */
  onChanged?: () => void;
}

export const NecesidadesAdminDialog: React.FC<Props> = ({ open, onOpenChange, isAdmin = false, onChanged }) => {
  const styles = useStyles();
  const [cat, setCat] = useState<CatalogoNecesidades>({});
  const [cargando, setCargando] = useState(false);
  const [msg, setMsg] = useState('');
  const [nuevaNec, setNuevaNec] = useState('');
  const [nuevaSub, setNuevaSub] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    try { NecesidadesService.invalidate(); setCat(await NecesidadesService.getCatalogo()); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => {
    if (open) { setMsg(''); setNuevaNec(''); setNuevaSub(''); void recargar(); }
  }, [open, recargar]);

  const necesidades = Object.keys(cat).sort((a, b) => a.localeCompare(b, 'es'));

  const agregar = async () => {
    const n = nuevaNec.trim(); const s = nuevaSub.trim();
    if (!n || !s) { setMsg('Escribe la necesidad y la subnecesidad.'); return; }
    setCargando(true); setMsg('');
    try {
      await NecesidadesService.crearPar(n, s);
      await recargar(); onChanged?.();
      setNuevaSub('');
      setMsg(`Agregado: ${n} → ${s}`);
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Error al agregar.'); }
    finally { setCargando(false); }
  };

  const eliminarSub = async (necesidad: string, sub: string) => {
    if (!window.confirm(`¿Eliminar la subnecesidad "${sub}"?`)) return;
    setCargando(true);
    try { await NecesidadesService.eliminarSubnecesidad(necesidad, sub); await recargar(); onChanged?.(); setMsg('Subnecesidad eliminada.'); }
    catch (e) { setMsg(e instanceof Error ? e.message : 'Error al eliminar.'); }
    finally { setCargando(false); }
  };

  const eliminarNec = async (necesidad: string) => {
    const n = (cat[necesidad] ?? []).length;
    if (!window.confirm(`¿Eliminar la necesidad "${necesidad}" y sus ${n} subnecesidad(es)? Esta acción no se puede deshacer.`)) return;
    setCargando(true);
    try { await NecesidadesService.eliminarNecesidad(necesidad); await recargar(); onChanged?.(); setMsg(`Necesidad "${necesidad}" eliminada.`); }
    catch (e) { setMsg(e instanceof Error ? e.message : 'Error al eliminar.'); }
    finally { setCargando(false); }
  };

  const descargarPlantilla = async () => {
    const pares = await NecesidadesService.getPares();
    const data = pares.length > 0 ? pares : [{ necesidad: '', subnecesidad: '' }];
    const ws = XLSX.utils.json_to_sheet(data, { header: ['necesidad', 'subnecesidad'] });
    ws['A1'].v = 'Necesidad'; ws['B1'].v = 'Subnecesidad';
    ws['!cols'] = [{ wch: 34 }, { wch: 46 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Necesidades');
    XLSX.writeFile(wb, 'PlantillaCargaMasiva_Necesidades.xlsx');
  };

  const cargarPlantilla = async (file: File) => {
    setCargando(true); setMsg('');
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
      const pares = rows.map(r => ({
        necesidad: String((r as any)['Necesidad'] ?? (r as any)['necesidad'] ?? '').trim(),
        subnecesidad: String((r as any)['Subnecesidad'] ?? (r as any)['subnecesidad'] ?? '').trim(),
      })).filter(p => p.necesidad && p.subnecesidad);
      const n = await NecesidadesService.importarPares(pares);
      await recargar(); onChanged?.();
      setMsg(`Cargados ${n} par(es) necesidad/subnecesidad.`);
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Error al cargar la plantilla.'); }
    finally { setCargando(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  return (
    <Dialog open={open} onOpenChange={(_, d) => onOpenChange(d.open)}>
      <DialogSurface style={{ maxWidth: '640px' }}>
        <DialogBody>
          <DialogTitle>Necesidades y subnecesidades</DialogTitle>
          <DialogContent>
            {/* Agregar (cualquier planeador) */}
            <div className={styles.addCard}>
              <span style={{ fontWeight: 700, fontSize: '13px', color: '#003057' }}>Agregar necesidad / subnecesidad</span>
              <div className={styles.addRow}>
                <div className={styles.addCol}>
                  <Field label="Necesidad (padre)">
                    <Combobox
                      placeholder="Elige una existente o escribe una nueva…"
                      freeform
                      value={nuevaNec}
                      selectedOptions={nuevaNec ? [nuevaNec] : []}
                      onOptionSelect={(_, data) => setNuevaNec(data.optionValue || '')}
                      onChange={(e) => setNuevaNec((e.target as HTMLInputElement).value)}
                    >
                      {necesidades.map(n => <Option key={n} value={n} text={n}>{n}</Option>)}
                    </Combobox>
                  </Field>
                </div>
                <div className={styles.addCol}>
                  <Field label="Subnecesidad (dentro de esa)">
                    <Input
                      placeholder="Nombre de la subnecesidad…"
                      value={nuevaSub}
                      onChange={(_, d) => setNuevaSub(d.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') void agregar(); }}
                    />
                  </Field>
                </div>
              </div>
              <div>
                <Button appearance="primary" icon={<AddRegular />} disabled={cargando || !nuevaNec.trim() || !nuevaSub.trim()} onClick={() => void agregar()}>
                  Agregar
                </Button>
              </div>
            </div>

            {/* Plantilla de carga masiva (admin) */}
            {isAdmin && (
              <div className={styles.toolbar}>
                <Button size="small" icon={<ArrowDownloadRegular />} onClick={() => void descargarPlantilla()}>
                  Descargar plantilla
                </Button>
                <Button size="small" appearance="secondary" icon={<ArrowUploadRegular />} onClick={() => fileRef.current?.click()}>
                  Cargar plantilla
                </Button>
                <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) void cargarPlantilla(f); }} />
              </div>
            )}

            {msg && <MessageBar intent="info" style={{ marginTop: '10px' }}><MessageBarBody>{msg}</MessageBarBody></MessageBar>}

            <Divider style={{ margin: '12px 0' }} />
            <span style={{ fontWeight: 600, fontSize: '12px', color: tokens.colorNeutralForeground2 }}>Catálogo actual</span>

            {cargando ? (
              <Spinner size="small" label="Procesando…" style={{ marginTop: '10px' }} />
            ) : necesidades.length === 0 ? (
              <Caption1>No hay necesidades en el catálogo.</Caption1>
            ) : (
              <div className={styles.lista}>
                {necesidades.map(nec => (
                  <div key={nec} className={styles.grupo}>
                    <div className={styles.grupoHead}>
                      <span className={styles.necesidad}>{nec}</span>
                      {isAdmin && (
                        <Button size="small" appearance="subtle" icon={<DeleteRegular />}
                          title="Eliminar necesidad y sus subnecesidades" onClick={() => void eliminarNec(nec)} />
                      )}
                    </div>
                    {(cat[nec] ?? []).map(sub => (
                      <div key={sub} className={styles.sub}>
                        <span className={styles.subTxt}>• {sub}</span>
                        {isAdmin && (
                          <Button size="small" appearance="subtle" icon={<DeleteRegular />}
                            title="Eliminar subnecesidad" onClick={() => void eliminarSub(nec, sub)} />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => onOpenChange(false)}>Cerrar</Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
