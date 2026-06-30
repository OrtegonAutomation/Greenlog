// ============================================================
// NecesidadesAdminDialog — gestión del catálogo Necesidad/Subnecesidad
// (solo administradores): eliminar con confirmación, descargar y cargar
// la plantilla de carga masiva.
// ============================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions,
  Button, Spinner, Caption1, Divider, MessageBar, MessageBarBody,
  makeStyles, shorthands, tokens,
} from '@fluentui/react-components';
import {
  DeleteRegular, ArrowDownloadRegular, ArrowUploadRegular, AddRegular,
} from '@fluentui/react-icons';
import * as XLSX from 'xlsx';
import { NecesidadesService } from '../../services/NecesidadesService';
import { CatalogoNecesidades } from '../../data/necesidades';

const useStyles = makeStyles({
  grupo: {
    ...shorthands.padding('8px', '0'),
    ...shorthands.borderBottom('1px', 'solid', 'rgba(0,0,0,0.06)'),
  },
  grupoHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...shorthands.gap('8px') },
  necesidad: { fontWeight: 700, fontSize: '13px', color: '#003057' },
  sub: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    ...shorthands.padding('3px', '0', '3px', '14px'), ...shorthands.gap('8px'),
  },
  subTxt: { fontSize: '13px', color: '#323130' },
  toolbar: { display: 'flex', ...shorthands.gap('8px'), flexWrap: 'wrap', marginBottom: '10px' },
  lista: { maxHeight: '46vh', overflowY: 'auto', ...shorthands.padding('0', '2px') },
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NecesidadesAdminDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const styles = useStyles();
  const [cat, setCat] = useState<CatalogoNecesidades>({});
  const [cargando, setCargando] = useState(false);
  const [msg, setMsg] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    try {
      NecesidadesService.invalidate();
      setCat(await NecesidadesService.getCatalogo());
    } finally { setCargando(false); }
  }, []);

  useEffect(() => { if (open) { setMsg(''); void recargar(); } }, [open, recargar]);

  const eliminarSub = async (necesidad: string, sub: string) => {
    if (!window.confirm(`¿Eliminar la subnecesidad "${sub}"?`)) return;
    setCargando(true);
    try { await NecesidadesService.eliminarSubnecesidad(necesidad, sub); await recargar(); setMsg(`Subnecesidad eliminada.`); }
    catch (e) { setMsg(e instanceof Error ? e.message : 'Error al eliminar.'); }
    finally { setCargando(false); }
  };

  const eliminarNec = async (necesidad: string) => {
    const n = (cat[necesidad] ?? []).length;
    if (!window.confirm(`¿Eliminar la necesidad padre "${necesidad}" y sus ${n} subnecesidad(es)? Esta acción no se puede deshacer.`)) return;
    setCargando(true);
    try { await NecesidadesService.eliminarNecesidad(necesidad); await recargar(); setMsg(`Necesidad "${necesidad}" eliminada.`); }
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
      await recargar();
      setMsg(`Cargados ${n} par(es) necesidad/subnecesidad.`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error al cargar la plantilla.');
    } finally {
      setCargando(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const necesidades = Object.keys(cat).sort((a, b) => a.localeCompare(b, 'es'));

  return (
    <Dialog open={open} onOpenChange={(_, d) => onOpenChange(d.open)}>
      <DialogSurface style={{ maxWidth: '640px' }}>
        <DialogBody>
          <DialogTitle>Gestionar necesidades y subnecesidades</DialogTitle>
          <DialogContent>
            <div className={styles.toolbar}>
              <Button size="small" icon={<ArrowDownloadRegular />} onClick={() => void descargarPlantilla()}>
                Descargar plantilla
              </Button>
              <Button size="small" appearance="primary" icon={<ArrowUploadRegular />}
                onClick={() => fileRef.current?.click()}>
                Cargar plantilla
              </Button>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) void cargarPlantilla(f); }} />
            </div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
              Descarga la plantilla con el catálogo actual, agrega filas (Necesidad / Subnecesidad) y cárgala.
              La carga solo agrega; para quitar elementos usa la papelera.
            </Caption1>

            {msg && <MessageBar intent="info" style={{ marginTop: '10px' }}><MessageBarBody>{msg}</MessageBarBody></MessageBar>}

            <Divider style={{ margin: '12px 0' }} />

            {cargando ? (
              <Spinner size="small" label="Procesando…" />
            ) : necesidades.length === 0 ? (
              <Caption1>No hay necesidades en el catálogo.</Caption1>
            ) : (
              <div className={styles.lista}>
                {necesidades.map(nec => (
                  <div key={nec} className={styles.grupo}>
                    <div className={styles.grupoHead}>
                      <span className={styles.necesidad}>{nec}</span>
                      <Button size="small" appearance="subtle" icon={<DeleteRegular />}
                        title="Eliminar necesidad padre y sus subnecesidades"
                        onClick={() => void eliminarNec(nec)} />
                    </div>
                    {(cat[nec] ?? []).map(sub => (
                      <div key={sub} className={styles.sub}>
                        <span className={styles.subTxt}>• {sub}</span>
                        <Button size="small" appearance="subtle" icon={<DeleteRegular />}
                          title="Eliminar subnecesidad"
                          onClick={() => void eliminarSub(nec, sub)} />
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
