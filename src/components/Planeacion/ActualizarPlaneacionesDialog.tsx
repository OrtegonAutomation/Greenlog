// ============================================================
// ActualizarPlaneacionesDialog — actualización masiva (admin) de planeaciones
// ya creadas: backfill de Necesidad, Subnecesidad y los 3 campos de ajuste
// tarifario, mediante una plantilla Excel descargable y cargable.
// Uso poco frecuente; la plantilla es explicativa.
// ============================================================
import React, { useRef, useState } from 'react';
import {
  Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions,
  Button, Spinner, Caption1, MessageBar, MessageBarBody, Divider,
} from '@fluentui/react-components';
import { ArrowDownloadRegular, ArrowUploadRegular } from '@fluentui/react-icons';
import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import { ActividadAmbiental, NuevaActividadPayload } from '../../types';
import { NecesidadesService } from '../../services/NecesidadesService';

// Columnas de contexto (no editar) + columnas a completar (al final).
const COL_CONTEXTO = ['ID', 'Línea Operativa', 'Zona', 'Lugar', 'Tarea', 'Contrato', 'Año'];
const COL_NECESIDAD = 'Necesidad';
const COL_SUBNECESIDAD = 'Subnecesidad';
const COL_AJUSTE = 'Aplica Ajuste Tarifario (SI/NO)';
const COL_FECHA = 'Fecha del Ajuste Tarifario (AAAA-MM-DD)';
const COL_REAJUSTE = 'Aplica Reajuste tablas salariales (SI/NO)';
const COL_EDITABLES = [COL_NECESIDAD, COL_SUBNECESIDAD, COL_AJUSTE, COL_FECHA, COL_REAJUSTE];
const HEADERS = [...COL_CONTEXTO, ...COL_EDITABLES];

const parseOpex = (raw?: string): any => { try { return raw ? JSON.parse(raw) : {}; } catch { return {}; } };
const toFecha = (v: unknown): string => {
  if (!v) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).trim();
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actividades: ActividadAmbiental[];
  actualizar: (id: string, cambios: Partial<NuevaActividadPayload>) => Promise<unknown>;
}

export const ActualizarPlaneacionesDialog: React.FC<Props> = ({ open, onOpenChange, actividades, actualizar }) => {
  const [cargando, setCargando] = useState(false);
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const descargar = async () => {
    setCargando(true); setMsg('');
    try {
      const catalogo = await NecesidadesService.getCatalogo();
      const necesidades = Object.keys(catalogo).sort((a, b) => a.localeCompare(b, 'es'));
      const wb = new ExcelJS.Workbook();

      // ---- Hoja Instrucciones ----
      const wsI = wb.addWorksheet('Instrucciones');
      wsI.getColumn(1).width = 110;
      const instr = [
        'ACTUALIZACIÓN MASIVA DE PLANEACIONES — Necesidad, Subnecesidad y Ajuste Tarifario',
        '',
        '1. En la hoja "Planeaciones" tienes una fila por cada planeación ya creada, con su información actual.',
        '2. NO modifiques las columnas grises (ID, Línea, Zona, Lugar, Tarea, Contrato, Año). El "ID" se usa para identificar la planeación.',
        '3. Completa solo las columnas VERDES del final:',
        '     • Necesidad y Subnecesidad (usa la hoja "Referencia" para ver las opciones válidas).',
        '     • Aplica Ajuste Tarifario: escribe SI o NO.',
        '     • Fecha del Ajuste Tarifario: solo si marcaste SI (formato AAAA-MM-DD).',
        '     • Aplica Reajuste tablas salariales: SI o NO.',
        '4. Si dejas una celda verde vacía, esa planeación NO se cambia en ese campo (se conserva lo que ya tenía).',
        '5. Guarda el archivo y cárgalo con el botón "Cargar plantilla".',
      ];
      instr.forEach((t, i) => {
        const r = wsI.addRow([t]);
        if (i === 0) r.getCell(1).font = { bold: true, size: 12, color: { argb: 'FF003057' } };
        r.getCell(1).alignment = { wrapText: true };
      });

      // ---- Hoja Referencia (catálogo) ----
      const wsR = wb.addWorksheet('Referencia');
      wsR.columns = [{ width: 34 }, { width: 48 }];
      const rh = wsR.addRow(['Necesidad', 'Subnecesidad']);
      rh.eachCell(c => { c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003057' } }; });
      for (const nec of necesidades) for (const sub of catalogo[nec]) wsR.addRow([nec, sub]);

      // ---- Hoja Planeaciones ----
      const ws = wb.addWorksheet('Planeaciones', { views: [{ state: 'frozen', ySplit: 1, xSplit: 1 }] });
      ws.columns = HEADERS.map((h) => ({ width: h === 'ID' ? 36 : h === 'Tarea' ? 34 : COL_EDITABLES.includes(h) ? 26 : 18 }));
      const hdr = ws.addRow(HEADERS);
      hdr.height = 32;
      hdr.eachCell((cell, c) => {
        const editable = c > COL_CONTEXTO.length;
        cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: editable ? 'FF1F7A3D' : 'FF6B6B6B' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      });

      const ordenadas = [...actividades].sort((a, b) =>
        (a.lineaOperativa || '').localeCompare(b.lineaOperativa || '', 'es') || (a.zona || '').localeCompare(b.zona || '', 'es'));
      ordenadas.forEach((a) => {
        const opx = parseOpex(a.opexDataRaw);
        const row = ws.addRow([
          a.id,
          a.lineaOperativa || '',
          a.zona || '',
          a.estacion || opx.pk || '',
          a.tarea || '',
          opx.contrato || a.contrato || '',
          opx.anioPlaneacion || (a as any).anioPlaneacion || '',
          opx.necesidad || '',
          opx.subnecesidad || '',
          opx.aplicaAjusteTarifario || '',
          opx.fechaAjusteTarifario || '',
          opx.aplicaReajusteTablasSalariales || '',
        ]);
        row.eachCell({ includeEmpty: true }, (cell, c) => {
          cell.font = { size: 10 };
          if (c <= COL_CONTEXTO.length) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
        });
      });

      // Validaciones (dropdowns) en las columnas editables.
      const lastRow = ws.rowCount;
      const colIdx = (name: string) => HEADERS.indexOf(name) + 1;
      const listaNec = `"${necesidades.join(',')}"`;
      for (let r = 2; r <= lastRow; r++) {
        ws.getCell(r, colIdx(COL_NECESIDAD)).dataValidation = { type: 'list', allowBlank: true, formulae: [listaNec] };
        ws.getCell(r, colIdx(COL_AJUSTE)).dataValidation = { type: 'list', allowBlank: true, formulae: ['"SI,NO"'] };
        ws.getCell(r, colIdx(COL_REAJUSTE)).dataValidation = { type: 'list', allowBlank: true, formulae: ['"SI,NO"'] };
      }

      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'ActualizarPlaneaciones_NecesidadAjuste.xlsx';
      a.click(); URL.revokeObjectURL(a.href);
      setMsg(`Plantilla generada con ${ordenadas.length} planeación(es).`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error generando la plantilla.');
    } finally { setCargando(false); }
  };

  const cargar = async (file: File) => {
    setCargando(true); setMsg('');
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array', cellDates: true });
      const ws = wb.Sheets['Planeaciones'] || wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
      const porId = new Map(actividades.map(a => [a.id, a]));
      let actualizadas = 0, sinId = 0, errores = 0;
      for (const row of rows) {
        const id = String(row['ID'] ?? '').trim();
        if (!id) continue;
        const act = porId.get(id);
        if (!act) { sinId++; continue; }
        const nec = String(row[COL_NECESIDAD] ?? '').trim();
        const sub = String(row[COL_SUBNECESIDAD] ?? '').trim();
        const aj = String(row[COL_AJUSTE] ?? '').trim().toUpperCase();
        const fecha = toFecha(row[COL_FECHA]);
        const re = String(row[COL_REAJUSTE] ?? '').trim().toUpperCase();
        if (!nec && !sub && !aj && !fecha && !re) continue; // nada que cambiar
        const opx = parseOpex(act.opexDataRaw);
        if (nec) opx.necesidad = nec;
        if (sub) opx.subnecesidad = sub;
        if (aj) opx.aplicaAjusteTarifario = aj === 'SI' ? 'SI' : 'NO';
        if (fecha) opx.fechaAjusteTarifario = fecha;
        if (re) opx.aplicaReajusteTablasSalariales = re === 'SI' ? 'SI' : 'NO';
        try {
          await actualizar(id, { opexDataRaw: JSON.stringify(opx) });
          actualizadas++;
        } catch { errores++; }
      }
      setMsg(`Actualizadas: ${actualizadas}. ${sinId ? `Sin coincidencia de ID: ${sinId}. ` : ''}${errores ? `Errores: ${errores}.` : ''}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error al cargar la plantilla.');
    } finally {
      setCargando(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, d) => onOpenChange(d.open)}>
      <DialogSurface style={{ maxWidth: '560px' }}>
        <DialogBody>
          <DialogTitle>Actualizar planeaciones existentes</DialogTitle>
          <DialogContent>
            <Caption1>
              Herramienta para completar de forma masiva, en las planeaciones ya creadas, la
              <b> Necesidad</b>, <b>Subnecesidad</b> y los campos de <b>Ajuste Tarifario</b>. Descarga la
              plantilla (trae todas las planeaciones con su información), complétala en Excel y cárgala.
            </Caption1>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', margin: '16px 0' }}>
              <Button appearance="secondary" icon={<ArrowDownloadRegular />} disabled={cargando} onClick={() => void descargar()}>
                Descargar plantilla
              </Button>
              <Button appearance="primary" icon={<ArrowUploadRegular />} disabled={cargando} onClick={() => fileRef.current?.click()}>
                Cargar plantilla
              </Button>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) void cargar(f); }} />
            </div>

            {cargando && <Spinner size="small" label="Procesando…" />}
            {msg && <MessageBar intent="info"><MessageBarBody>{msg}</MessageBarBody></MessageBar>}

            <Divider style={{ margin: '12px 0' }} />
            <Caption1 style={{ color: '#888' }}>
              Solo se modifican las planeaciones cuyas celdas verdes completes; las celdas vacías conservan
              su valor actual. Disponible para administradores.
            </Caption1>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => onOpenChange(false)}>Cerrar</Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
