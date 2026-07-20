// ============================================================
// AdminModule — Administración (solo administradores):
//  1. Congelar / descongelar la matriz financiera (presupuesto).
//  2. Gestión de usuarios con 3 roles:
//     - Admin: control total.
//     - Planeador: planea las líneas de gestión ambiental en su
//       zona (la zona se puede cambiar desde aquí).
//     - Revisor: solo consulta el módulo de Reportes.
//
// Los usuarios creados aquí quedan en greenlog_usuarios (allowlist
// de la BD). Su cuenta se activa en el primer ingreso: escriben su
// correo + la contraseña temporal que se les comunique y el sistema
// crea la cuenta con esa contraseña.
// ============================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  makeStyles, shorthands, tokens,
  Title2, Title3, Body1, Caption1, Card, Button, Switch, Input, Select,
  Radio, RadioGroup, MessageBar, MessageBarBody, MessageBarTitle, Spinner, Badge,
  Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions, Checkbox,
} from '@fluentui/react-components';
import {
  LockClosedRegular, LockOpenRegular, PersonAddRegular, PeopleTeamRegular, GridRegular,
  CopyRegular, DeleteRegular, KeyRegular, CalendarLockRegular,
} from '@fluentui/react-icons';
import { useAuth } from '../../auth/AuthContext';
import { getSupabaseClient, isSupabaseEnabled } from '../../services/supabaseClient';
import { ConfigService, usePresupuestoCongelado } from '../../services/ConfigService';
import { SnapshotService, SnapshotAnual } from '../../services/SnapshotService';
import { useActividades } from '../../hooks/useActividades';
import { aniosDisponibles, anioVigente, baseVivaAnio, actividadesEnAnio, fmtB } from '../../utils/reportesAggregations';
import { MSG_MATRIZ_ENVIADA } from '../../config/presupuesto';
import { LINEAS_GESTION_AMBIENTAL, TODAS_LINEAS_AMBIENTALES } from '../../data/equipoAmbiental';
import { MEDIA } from '../../hooks/useResponsive';

// Zonas operativas asignables a un planeador (como las usan las actividades).
const ZONAS_PLANEACION = ['Occidente', 'Centro', 'CLC', 'Oriente', 'Llanos', 'Norte', 'Coveñas', 'Transversal'];

type RolNuevo = 'admin' | 'planeador' | 'revisor';

/** Contraseña temporal con el formato estándar (22 caracteres con # y !). */
const generarContrasena = (): string => {
  const abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const rnd = new Uint32Array(20);
  crypto.getRandomValues(rnd);
  const chars = [...rnd].map(n => abc[n % abc.length]);
  const pos = [4 + (rnd[0] % 10), 12 + (rnd[1] % 6)];
  chars.splice(pos[0], 0, '#');
  chars.splice(pos[1], 0, '!');
  return chars.join('');
};

const useStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column', ...shorthands.gap('20px') },
  header: {
    display: 'flex', flexDirection: 'column', ...shorthands.gap('4px'),
    ...shorthands.padding('24px'), borderRadius: '16px',
    background: 'linear-gradient(90deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 100%)',
    border: '1px solid rgba(255,255,255,0.5)',
  },
  card: {
    ...shorthands.padding('20px'), borderRadius: '16px',
    background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.7)',
    display: 'flex', flexDirection: 'column', ...shorthands.gap('12px'),
  },
  filaCongelar: { display: 'flex', alignItems: 'center', ...shorthands.gap('14px'), flexWrap: 'wrap' },
  formGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', ...shorthands.gap('10px'),
    [MEDIA.mobile]: { gridTemplateColumns: '1fr' },
  },
  tabla: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: { textAlign: 'left', padding: '8px 10px', color: '#003057', fontWeight: 700, borderBottom: '1px solid rgba(0,0,0,0.08)' },
  td: { padding: '8px 10px', borderBottom: '1px solid rgba(0,0,0,0.05)' },
});

interface UsuarioRow {
  id: string;
  email: string;
  nombre: string;
  alcance: string;
  admin: boolean;
  visor: boolean;
  activo: boolean;
}

export const AdminModule: React.FC = () => {
  const styles = useStyles();
  const supabaseOk = isSupabaseEnabled();
  const { congelado, cargando: cargandoConfig, setCongelado } = usePresupuestoCongelado();

  const { currentUser } = useAuth();
  const { actividadesGlobal } = useActividades();
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [credencial, setCredencial] = useState<{ email: string; pwd: string } | null>(null);
  // Zonas de planeación por usuario (derivadas de greenlog_usuario_ambitos).
  const [zonasPorUsuario, setZonasPorUsuario] = useState<Record<string, string[]>>({});
  const [cargandoUsuarios, setCargandoUsuarios] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);

  // Form nuevo usuario
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoRol, setNuevoRol] = useState<RolNuevo>('revisor');
  const [nuevaZona, setNuevaZona] = useState(ZONAS_PLANEACION[0]);

  const cargarUsuarios = useCallback(async () => {
    if (!supabaseOk) { setCargandoUsuarios(false); return; }
    setCargandoUsuarios(true);
    const supabase = getSupabaseClient();
    const [{ data: users }, { data: ambitos }] = await Promise.all([
      supabase.from('greenlog_usuarios').select('id, email, nombre, alcance, admin, visor, activo').order('nombre'),
      supabase.from('greenlog_usuario_ambitos').select('usuario_id, tipo, zona').eq('tipo', 'planeador'),
    ]);
    if (users) setUsuarios(users as UsuarioRow[]);
    const porUsuario: Record<string, Set<string>> = {};
    for (const a of (ambitos ?? []) as { usuario_id: string; zona: string }[]) {
      (porUsuario[a.usuario_id] ??= new Set()).add(a.zona);
    }
    setZonasPorUsuario(Object.fromEntries(Object.entries(porUsuario).map(([k, v]) => [k, [...v].sort()])));
    setCargandoUsuarios(false);
  }, [supabaseOk]);

  useEffect(() => { void cargarUsuarios(); }, [cargarUsuarios]);

  const toggleCongelado = useCallback(async (valor: boolean) => {
    setGuardando(true);
    setMensaje(null);
    try {
      await ConfigService.setPresupuestoCongelado(valor);
      setCongelado(valor);
      setMensaje({ ok: true, texto: valor ? 'Presupuesto congelado: nadie (excepto admins) puede editar planeaciones.' : 'Presupuesto abierto: el equipo puede volver a planear y editar.' });
    } catch (e: any) {
      setMensaje({ ok: false, texto: `No se pudo actualizar el estado: ${e.message}` });
    } finally {
      setGuardando(false);
    }
  }, [setCongelado]);

  // ── Snapshots anuales ("Bloquear año") ──
  // Congela el agregado Zona×Línea de lo planeado tipo "Plan" del año elegido;
  // Reportes lo usa como base de comparación de años siguientes.
  const aniosSnapshot = useMemo(() => {
    const anios = aniosDisponibles(actividadesGlobal);
    return anios.length > 0 ? anios : [anioVigente(actividadesGlobal)];
  }, [actividadesGlobal]);
  const [anioSnapshot, setAnioSnapshot] = useState<number | null>(null);
  const anioSnapshotEf = anioSnapshot ?? aniosSnapshot[aniosSnapshot.length - 1];
  const [snapshotActual, setSnapshotActual] = useState<SnapshotAnual | null>(null);
  const [cargandoSnapshot, setCargandoSnapshot] = useState(false);
  const [dialogoBloquear, setDialogoBloquear] = useState(false);
  const [dialogoDesbloquear, setDialogoDesbloquear] = useState(false);

  const refrescarSnapshot = useCallback(async (anio: number) => {
    setCargandoSnapshot(true);
    try { setSnapshotActual(await SnapshotService.getSnapshot(anio)); }
    finally { setCargandoSnapshot(false); }
  }, []);
  useEffect(() => { void refrescarSnapshot(anioSnapshotEf); }, [anioSnapshotEf, refrescarSnapshot]);

  // Lo que se congelaría hoy para el año elegido (solo tipo Plan).
  const previaSnapshot = useMemo(() => {
    const celdas = baseVivaAnio(actividadesGlobal, anioSnapshotEf);
    const total = celdas.reduce((s, c) => s + c.valor, 0);
    const nActividades = actividadesEnAnio(actividadesGlobal, anioSnapshotEf)
      .filter(a => ((a.tipoPlaneacion as string) ?? 'Plan') === 'Plan').length;
    return { celdas, total, nActividades };
  }, [actividadesGlobal, anioSnapshotEf]);

  const bloquearAnio = useCallback(async () => {
    setGuardando(true);
    setMensaje(null);
    try {
      await SnapshotService.congelarAnio(anioSnapshotEf, previaSnapshot.celdas, previaSnapshot.total, previaSnapshot.nActividades, currentUser?.email);
      setMensaje({ ok: true, texto: `Año ${anioSnapshotEf} bloqueado: Reportes lo usará como base de comparación (${fmtB(previaSnapshot.total)} tipo Plan).` });
      setDialogoBloquear(false);
      await refrescarSnapshot(anioSnapshotEf);
    } catch (e: any) {
      setMensaje({ ok: false, texto: `No se pudo bloquear el año: ${e.message}` });
    } finally {
      setGuardando(false);
    }
  }, [anioSnapshotEf, previaSnapshot, currentUser?.email, refrescarSnapshot]);

  const desbloquearAnio = useCallback(async () => {
    setGuardando(true);
    setMensaje(null);
    try {
      await SnapshotService.descongelarAnio(anioSnapshotEf);
      setMensaje({ ok: true, texto: `Año ${anioSnapshotEf} desbloqueado: Reportes volverá a usar la base en vivo (tipo Plan).` });
      setDialogoDesbloquear(false);
      await refrescarSnapshot(anioSnapshotEf);
    } catch (e: any) {
      setMensaje({ ok: false, texto: `No se pudo desbloquear el año: ${e.message}` });
    } finally {
      setGuardando(false);
    }
  }, [anioSnapshotEf, refrescarSnapshot]);

  /** Reemplaza los ámbitos de planeador de un usuario por las líneas de gestión en la zona dada. */
  const asignarZonaPlaneador = useCallback(async (usuarioId: string, zona: string) => {
    const supabase = getSupabaseClient();
    const { error: delError } = await supabase
      .from('greenlog_usuario_ambitos')
      .delete()
      .eq('usuario_id', usuarioId)
      .eq('tipo', 'planeador');
    if (delError) throw new Error(delError.message);
    const filas = LINEAS_GESTION_AMBIENTAL.map(linea => ({
      usuario_id: usuarioId, tipo: 'planeador', linea_operativa: linea, zona, global: false,
    }));
    const { error: insError } = await supabase.from('greenlog_usuario_ambitos').insert(filas);
    if (insError) throw new Error(insError.message);
  }, []);

  const crearUsuario = useCallback(async () => {
    const email = nuevoEmail.trim().toLowerCase();
    if (!nuevoNombre.trim() || !email.includes('@')) {
      setMensaje({ ok: false, texto: 'Completa nombre y un correo válido.' });
      return;
    }
    setGuardando(true);
    setMensaje(null);
    try {
      const supabase = getSupabaseClient();
      const alcance = nuevoRol === 'admin' ? 'Administrador'
        : nuevoRol === 'planeador' ? `Planeador ${nuevaZona}`
          : 'Revisor — Consulta Reportes';
      const { data: creado, error } = await supabase.from('greenlog_usuarios').insert({
        email, nombre: nuevoNombre.trim(), alcance,
        base_trabajo: 'Bogota',
        zona_base: nuevoRol === 'planeador' ? nuevaZona : 'Transversal',
        admin: nuevoRol === 'admin', visor: nuevoRol === 'revisor', activo: true,
      }).select('id').single();
      if (error) throw new Error(error.message);
      if (nuevoRol === 'planeador' && creado?.id) {
        await asignarZonaPlaneador(creado.id, nuevaZona);
      }
      const pwd = generarContrasena();
      setCredencial({ email, pwd });
      setMensaje({ ok: true, texto: `Usuario ${email} creado como ${alcance}.` });
      setNuevoNombre(''); setNuevoEmail('');
      await cargarUsuarios();
    } catch (e: any) {
      setMensaje({ ok: false, texto: `No se pudo crear el usuario: ${e.message}` });
    } finally {
      setGuardando(false);
    }
  }, [nuevoNombre, nuevoEmail, nuevoRol, nuevaZona, asignarZonaPlaneador, cargarUsuarios]);

  const cambiarZona = useCallback(async (u: UsuarioRow, zona: string) => {
    setGuardando(true);
    setMensaje(null);
    try {
      await asignarZonaPlaneador(u.id, zona);
      await getSupabaseClient().from('greenlog_usuarios')
        .update({ zona_base: zona, alcance: `Planeador ${zona}` }).eq('id', u.id);
      setMensaje({ ok: true, texto: `${u.nombre} ahora planea en la zona ${zona}.` });
      await cargarUsuarios();
    } catch (e: any) {
      setMensaje({ ok: false, texto: `No se pudo cambiar la zona: ${e.message}` });
    } finally {
      setGuardando(false);
    }
  }, [asignarZonaPlaneador, cargarUsuarios]);

  // ── Editor de permisos línea × zona por usuario ──
  const [permisosUsuario, setPermisosUsuario] = useState<UsuarioRow | null>(null);
  const [matriz, setMatriz] = useState<Set<string>>(new Set());
  const [cargandoMatriz, setCargandoMatriz] = useState(false);
  const clave = (linea: string, zona: string) => `${linea}|${zona}`;

  const abrirPermisos = useCallback(async (u: UsuarioRow) => {
    setPermisosUsuario(u);
    setCargandoMatriz(true);
    const { data } = await getSupabaseClient()
      .from('greenlog_usuario_ambitos')
      .select('linea_operativa, zona')
      .eq('usuario_id', u.id)
      .eq('tipo', 'planeador');
    const set = new Set<string>();
    for (const a of (data ?? []) as { linea_operativa: string; zona: string }[]) {
      set.add(clave(a.linea_operativa, a.zona));
    }
    setMatriz(set);
    setCargandoMatriz(false);
  }, []);

  const toggleCelda = useCallback((linea: string, zona: string) => {
    setMatriz(prev => {
      const next = new Set(prev);
      const k = clave(linea, zona);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });
  }, []);

  const toggleZonaCompleta = useCallback((zona: string) => {
    setMatriz(prev => {
      const next = new Set(prev);
      const todasMarcadas = TODAS_LINEAS_AMBIENTALES.every(l => next.has(clave(l, zona)));
      for (const l of TODAS_LINEAS_AMBIENTALES) {
        if (todasMarcadas) next.delete(clave(l, zona)); else next.add(clave(l, zona));
      }
      return next;
    });
  }, []);

  const guardarPermisos = useCallback(async () => {
    if (!permisosUsuario) return;
    setGuardando(true);
    setMensaje(null);
    try {
      const supabase = getSupabaseClient();
      const { error: delError } = await supabase
        .from('greenlog_usuario_ambitos')
        .delete()
        .eq('usuario_id', permisosUsuario.id)
        .eq('tipo', 'planeador');
      if (delError) throw new Error(delError.message);
      const filas = [...matriz].map(k => {
        const [linea, zona] = k.split('|');
        return { usuario_id: permisosUsuario.id, tipo: 'planeador', linea_operativa: linea, zona, global: false };
      });
      if (filas.length > 0) {
        const { error: insError } = await supabase.from('greenlog_usuario_ambitos').insert(filas);
        if (insError) throw new Error(insError.message);
      }
      setMensaje({ ok: true, texto: `Permisos de ${permisosUsuario.nombre} actualizados (${filas.length} combinaciones línea × zona).` });
      setPermisosUsuario(null);
      await cargarUsuarios();
    } catch (e: any) {
      setMensaje({ ok: false, texto: `No se pudieron guardar los permisos: ${e.message}` });
    } finally {
      setGuardando(false);
    }
  }, [permisosUsuario, matriz, cargarUsuarios]);

  const eliminarUsuario = useCallback(async (u: UsuarioRow) => {
    if (currentUser?.email && u.email.toLowerCase() === currentUser.email.toLowerCase()) {
      setMensaje({ ok: false, texto: 'No puedes eliminar tu propia cuenta.' });
      return;
    }
    if (!window.confirm(`¿Eliminar definitivamente a ${u.nombre} (${u.email})? Se borran también sus permisos. Esta acción no se puede deshacer.`)) return;
    setGuardando(true);
    setMensaje(null);
    try {
      const { error } = await getSupabaseClient().from('greenlog_usuarios').delete().eq('id', u.id);
      if (error) throw new Error(error.message);
      setMensaje({ ok: true, texto: `${u.nombre} fue eliminado (sus permisos se borraron en cascada).` });
      await cargarUsuarios();
    } catch (e: any) {
      setMensaje({ ok: false, texto: `No se pudo eliminar: ${e.message}` });
    } finally {
      setGuardando(false);
    }
  }, [cargarUsuarios, currentUser]);

  const toggleActivo = useCallback(async (u: UsuarioRow) => {
    setGuardando(true);
    try {
      const { error } = await getSupabaseClient()
        .from('greenlog_usuarios')
        .update({ activo: !u.activo })
        .eq('id', u.id);
      if (error) throw new Error(error.message);
      await cargarUsuarios();
    } catch (e: any) {
      setMensaje({ ok: false, texto: `No se pudo actualizar: ${e.message}` });
    } finally {
      setGuardando(false);
    }
  }, [cargarUsuarios]);

  const rolDe = useCallback((u: UsuarioRow): { label: string; esPlaneador: boolean } => {
    if (u.admin) return { label: 'Admin', esPlaneador: false };
    if (u.visor) return { label: 'Revisor', esPlaneador: false };
    return { label: 'Planeador', esPlaneador: true };
  }, []);

  const resumen = useMemo(() => ({
    total: usuarios.length,
    admins: usuarios.filter(u => u.admin).length,
    revisores: usuarios.filter(u => u.visor && !u.admin).length,
    planeadores: usuarios.filter(u => !u.admin && !u.visor).length,
  }), [usuarios]);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <Title2 style={{ color: '#003057', fontWeight: 700 }}>Administración</Title2>
        <Body1 style={{ color: tokens.colorNeutralForeground2 }}>
          Control del ciclo presupuestal y gestión de usuarios de GreenLog.
        </Body1>
      </div>

      {mensaje && (
        <MessageBar intent={mensaje.ok ? 'success' : 'error'}>
          <MessageBarBody>
            <MessageBarTitle>{mensaje.ok ? 'Listo' : 'Error'}</MessageBarTitle>
            {mensaje.texto}
          </MessageBarBody>
        </MessageBar>
      )}

      {/* Credenciales del usuario recién creado */}
      {credencial && (
        <Card className={styles.card} style={{ background: '#ebf6f0', border: '1px solid rgba(72,148,110,0.35)' }}>
          <Title3 style={{ color: '#0f5132' }}><KeyRegular style={{ marginRight: 8 }} />Contraseña generada para {credencial.email}</Title3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <code style={{ fontSize: 18, fontWeight: 700, background: '#fff', padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)', letterSpacing: 0.5 }}>
              {credencial.pwd}
            </code>
            <Button icon={<CopyRegular />} appearance="secondary"
              onClick={() => { navigator.clipboard.writeText(`${credencial.email}	${credencial.pwd}`); setMensaje({ ok: true, texto: 'Credenciales copiadas al portapapeles.' }); }}>
              Copiar
            </Button>
            <Button appearance="subtle" onClick={() => setCredencial(null)}>Cerrar</Button>
          </div>
          <Caption1 style={{ color: '#0f5132' }}>
            Guárdala ahora: no se volverá a mostrar. Entrégasela al usuario por un canal seguro; en su <b>primer ingreso</b> con su correo y esta contraseña, la cuenta se activa automáticamente con ella.
          </Caption1>
        </Card>
      )}

      {/* 1. Matriz financiera */}
      <Card className={styles.card}>
        <Title3 style={{ color: '#003057' }}>
          {congelado ? <LockClosedRegular style={{ marginRight: 8 }} /> : <LockOpenRegular style={{ marginRight: 8 }} />}
          Matriz financiera
        </Title3>
        <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
          Al congelar, nadie (excepto administradores) puede crear, editar ni eliminar planeaciones — ni desde la app ni desde la API (bloqueo RLS). Se muestra el aviso "{MSG_MATRIZ_ENVIADA}"
        </Caption1>
        <div className={styles.filaCongelar}>
          {cargandoConfig ? <Spinner size="tiny" /> : (
            <>
              <Switch
                checked={congelado}
                disabled={guardando || !supabaseOk}
                onChange={(_, d) => toggleCongelado(d.checked)}
                label={congelado ? 'Presupuesto CONGELADO (matriz enviada)' : 'Presupuesto abierto (edición habilitada)'}
              />
              <Badge appearance="filled" color={congelado ? 'danger' : 'success'}>
                {congelado ? 'Congelado' : 'Abierto'}
              </Badge>
            </>
          )}
        </div>
        {!supabaseOk && <Caption1 style={{ color: '#c05a1e' }}>Modo mock: el estado se controla con la constante local del código.</Caption1>}
      </Card>

      {/* 1b. Bloquear año (snapshot de base para Reportes) */}
      <Card className={styles.card}>
        <Title3 style={{ color: '#003057' }}>
          <CalendarLockRegular style={{ marginRight: 8 }} />
          Base de comparación por año
        </Title3>
        <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
          Al bloquear un año se congela lo planeado tipo <b>Plan</b> (sin Adicional ni Emergencia) como base de
          comparación en Reportes. Si un año no está bloqueado, Reportes compara contra lo planeado en vivo.
          La base 2026 es la matriz estática de la Plantilla OPEX y no requiere bloqueo.
        </Caption1>
        <div className={styles.filaCongelar}>
          <Caption1 style={{ fontWeight: 600 }}>Año:</Caption1>
          <Select value={String(anioSnapshotEf)} onChange={(_, d) => setAnioSnapshot(Number(d.value))} disabled={guardando}>
            {aniosSnapshot.map(y => <option key={y} value={y}>{y}</option>)}
          </Select>
          {cargandoSnapshot ? <Spinner size="tiny" /> : snapshotActual ? (
            <Badge appearance="filled" color="danger">
              Bloqueado{snapshotActual.creadoEn ? ` el ${new Date(snapshotActual.creadoEn).toLocaleDateString('es-CO')}` : ''} — {fmtB(snapshotActual.total)}
            </Badge>
          ) : (
            <Badge appearance="filled" color="success">Sin bloquear (base en vivo)</Badge>
          )}
          <Button appearance="primary" icon={<CalendarLockRegular />}
            disabled={guardando || !supabaseOk || previaSnapshot.total <= 0}
            onClick={() => setDialogoBloquear(true)}>
            {snapshotActual ? `Reemplazar bloqueo de ${anioSnapshotEf}` : `Bloquear año ${anioSnapshotEf}`}
          </Button>
          {snapshotActual && (
            <Button appearance="secondary" disabled={guardando || !supabaseOk} onClick={() => setDialogoDesbloquear(true)}>
              Desbloquear
            </Button>
          )}
        </div>
        <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
          Se congelaría hoy: {fmtB(previaSnapshot.total)} en {previaSnapshot.nActividades} actividades tipo Plan de {anioSnapshotEf}.
        </Caption1>
        {!supabaseOk && <Caption1 style={{ color: '#c05a1e' }}>Modo mock: los snapshots requieren Supabase.</Caption1>}
      </Card>

      {/* Diálogo de confirmación: bloquear año */}
      <Dialog open={dialogoBloquear} onOpenChange={(_, d) => setDialogoBloquear(d.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Bloquear año {anioSnapshotEf}</DialogTitle>
            <DialogContent>
              <Body1 style={{ display: 'block', marginBottom: 8 }}>
                Se congelará como base de comparación: <b>{fmtB(previaSnapshot.total)}</b> en{' '}
                <b>{previaSnapshot.nActividades}</b> actividades tipo Plan de {anioSnapshotEf}.
              </Body1>
              {snapshotActual && (
                <Caption1 style={{ color: '#c05a1e' }}>
                  Ya existe un bloqueo del {snapshotActual.creadoEn ? new Date(snapshotActual.creadoEn).toLocaleDateString('es-CO') : '—'} ({fmtB(snapshotActual.total)}): será reemplazado.
                </Caption1>
              )}
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setDialogoBloquear(false)}>Cancelar</Button>
              <Button appearance="primary" disabled={guardando} onClick={() => void bloquearAnio()}>
                {guardando ? <Spinner size="tiny" /> : 'Bloquear'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Diálogo de confirmación: desbloquear año */}
      <Dialog open={dialogoDesbloquear} onOpenChange={(_, d) => setDialogoDesbloquear(d.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Desbloquear año {anioSnapshotEf}</DialogTitle>
            <DialogContent>
              <Body1>
                Se eliminará el snapshot congelado y Reportes volverá a comparar contra lo planeado en vivo (tipo Plan) de {anioSnapshotEf}.
              </Body1>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setDialogoDesbloquear(false)}>Cancelar</Button>
              <Button appearance="primary" disabled={guardando} onClick={() => void desbloquearAnio()}>
                {guardando ? <Spinner size="tiny" /> : 'Desbloquear'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* 2. Nuevo usuario */}
      <Card className={styles.card}>
        <Title3 style={{ color: '#003057' }}><PersonAddRegular style={{ marginRight: 8 }} />Añadir usuario</Title3>
        <div className={styles.formGrid}>
          <Input placeholder="Nombre completo" value={nuevoNombre} onChange={(_, d) => setNuevoNombre(d.value)} />
          <Input placeholder="correo@cenit-transporte.com" type="email" value={nuevoEmail} onChange={(_, d) => setNuevoEmail(d.value)} />
        </div>
        <RadioGroup layout="horizontal" value={nuevoRol} onChange={(_, d) => setNuevoRol(d.value as RolNuevo)}>
          <Radio value="revisor" label="Revisor — solo consulta Reportes" />
          <Radio value="planeador" label="Planeador — planea en su zona" />
          <Radio value="admin" label="Administrador" />
        </RadioGroup>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          {nuevoRol === 'planeador' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Caption1 style={{ fontWeight: 600 }}>Zona:</Caption1>
              <Select value={nuevaZona} onChange={(_, d) => setNuevaZona(d.value)}>
                {ZONAS_PLANEACION.map(z => <option key={z} value={z}>{z}</option>)}
              </Select>
            </div>
          )}
          <Button appearance="primary" icon={<PersonAddRegular />} disabled={guardando || !supabaseOk} onClick={crearUsuario}>
            Crear usuario
          </Button>
        </div>
        <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
          El planeador recibe las líneas de gestión ambiental (Monitoreos, ICAs, Pagos, Estudios, Compensaciones, Residuos, Servicios E, Hojas de Ruta) en la zona elegida.
          Tras crearlo, comunícale una contraseña temporal: en su primer ingreso el sistema crea la cuenta con esa contraseña.
        </Caption1>
      </Card>

      {/* 3. Usuarios */}
      <Card className={styles.card}>
        <Title3 style={{ color: '#003057' }}>
          <PeopleTeamRegular style={{ marginRight: 8 }} />
          Usuarios ({resumen.total} · {resumen.admins} admins · {resumen.planeadores} planeadores · {resumen.revisores} revisores)
        </Title3>
        {cargandoUsuarios ? <Spinner label="Cargando usuarios…" /> : (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.tabla}>
              <thead>
                <tr>
                  <th className={styles.th}>Nombre</th>
                  <th className={styles.th}>Correo</th>
                  <th className={styles.th}>Rol</th>
                  <th className={styles.th}>Zona de planeación</th>
                  <th className={styles.th}>Estado</th>
                  <th className={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => {
                  const rol = rolDe(u);
                  const zonas = zonasPorUsuario[u.id] ?? [];
                  return (
                    <tr key={u.id}>
                      <td className={styles.td} style={{ fontWeight: 600 }}>{u.nombre}</td>
                      <td className={styles.td}>{u.email}</td>
                      <td className={styles.td}>
                        <Badge color={rol.label === 'Admin' ? 'brand' : rol.label === 'Revisor' ? 'informative' : 'success'}>{rol.label}</Badge>
                      </td>
                      <td className={styles.td}>
                        {rol.esPlaneador ? (
                          zonas.length > 1 || zonas.includes('*') ? (
                            <Caption1>{zonas.join(', ')}</Caption1>
                          ) : (
                            <Select size="small" value={zonas[0] ?? ''} disabled={guardando}
                              onChange={(_, d) => d.value && cambiarZona(u, d.value)}>
                              {!zonas[0] && <option value="">— asignar —</option>}
                              {ZONAS_PLANEACION.map(z => <option key={z} value={z}>{z}</option>)}
                            </Select>
                          )
                        ) : (
                          <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>—</Caption1>
                        )}
                      </td>
                      <td className={styles.td}>
                        <Badge appearance="tint" color={u.activo ? 'success' : 'danger'}>{u.activo ? 'Activo' : 'Inactivo'}</Badge>
                      </td>
                      <td className={styles.td}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {!u.admin && !u.visor && (
                            <Button size="small" appearance="subtle" icon={<GridRegular />} disabled={guardando} onClick={() => abrirPermisos(u)}>
                              Permisos
                            </Button>
                          )}
                          <Button size="small" appearance="subtle" disabled={guardando} onClick={() => toggleActivo(u)}>
                            {u.activo ? 'Desactivar' : 'Activar'}
                          </Button>
                          <Button size="small" appearance="subtle" icon={<DeleteRegular />} disabled={guardando}
                            style={{ color: '#d64545' }} title="Eliminar usuario definitivamente"
                            onClick={() => eliminarUsuario(u)} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Editor de permisos línea operativa × zona */}
      <Dialog open={!!permisosUsuario} onOpenChange={(_, d) => { if (!d.open) setPermisosUsuario(null); }}>
        <DialogSurface style={{ maxWidth: 940 }}>
          <DialogBody>
            <DialogTitle>Permisos de {permisosUsuario?.nombre}</DialogTitle>
            <DialogContent>
              <Caption1 style={{ color: tokens.colorNeutralForeground3, display: 'block', marginBottom: 10 }}>
                Marca qué líneas operativas puede ver y planear este usuario en cada zona.
                El encabezado de cada zona marca/desmarca la columna completa.
              </Caption1>
              {cargandoMatriz ? <Spinner label="Cargando permisos…" /> : (
                <div style={{ overflowX: 'auto', maxHeight: 480, overflowY: 'auto' }}>
                  <table className={styles.tabla}>
                    <thead>
                      <tr>
                        <th className={styles.th} style={{ position: 'sticky', top: 0, background: '#fff' }}>Línea operativa</th>
                        {ZONAS_PLANEACION.map(z => (
                          <th key={z} className={styles.th}
                            style={{ textAlign: 'center', cursor: 'pointer', position: 'sticky', top: 0, background: '#fff' }}
                            title={`Marcar/desmarcar toda la zona ${z}`}
                            onClick={() => toggleZonaCompleta(z)}>
                            {z}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {TODAS_LINEAS_AMBIENTALES.map(linea => (
                        <tr key={linea}>
                          <td className={styles.td} style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{linea}</td>
                          {ZONAS_PLANEACION.map(z => (
                            <td key={z} className={styles.td} style={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={matriz.has(`${linea}|${z}`)}
                                onChange={() => toggleCelda(linea, z)}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setPermisosUsuario(null)}>Cancelar</Button>
              <Button appearance="primary" disabled={guardando || cargandoMatriz} onClick={guardarPermisos}>
                Guardar permisos
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default AdminModule;
