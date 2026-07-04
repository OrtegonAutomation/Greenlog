// ============================================================
// AdminModule — Administración (solo administradores):
//  1. Congelar / descongelar la matriz financiera (presupuesto).
//  2. Gestión de usuarios: listar, crear y activar/desactivar.
//
// Los usuarios creados aquí quedan en greenlog_usuarios (allowlist
// de la BD). Su cuenta se activa en el primer ingreso: escriben su
// correo + la contraseña temporal que se les comunique y el sistema
// crea la cuenta con esa contraseña.
// ============================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  makeStyles, shorthands, tokens,
  Title2, Title3, Body1, Caption1, Card, Button, Switch, Input, Checkbox,
  MessageBar, MessageBarBody, MessageBarTitle, Spinner, Badge,
} from '@fluentui/react-components';
import {
  LockClosedRegular, LockOpenRegular, PersonAddRegular, PeopleTeamRegular,
} from '@fluentui/react-icons';
import { getSupabaseClient, isSupabaseEnabled } from '../../services/supabaseClient';
import { ConfigService, usePresupuestoCongelado } from '../../services/ConfigService';
import { MSG_MATRIZ_ENVIADA } from '../../config/presupuesto';
import { MEDIA } from '../../hooks/useResponsive';

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

  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);

  // Form nuevo usuario
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoAlcance, setNuevoAlcance] = useState('Consulta Reportes');
  const [nuevoVisor, setNuevoVisor] = useState(true);
  const [nuevoAdmin, setNuevoAdmin] = useState(false);

  const cargarUsuarios = useCallback(async () => {
    if (!supabaseOk) { setCargandoUsuarios(false); return; }
    setCargandoUsuarios(true);
    const { data, error } = await getSupabaseClient()
      .from('greenlog_usuarios')
      .select('id, email, nombre, alcance, admin, visor, activo')
      .order('nombre');
    if (!error && data) setUsuarios(data as UsuarioRow[]);
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

  const crearUsuario = useCallback(async () => {
    const email = nuevoEmail.trim().toLowerCase();
    if (!nuevoNombre.trim() || !email.includes('@')) {
      setMensaje({ ok: false, texto: 'Completa nombre y un correo válido.' });
      return;
    }
    setGuardando(true);
    setMensaje(null);
    try {
      const { error } = await getSupabaseClient().from('greenlog_usuarios').insert({
        email, nombre: nuevoNombre.trim(), alcance: nuevoAlcance.trim(),
        base_trabajo: 'Bogota', zona_base: 'Transversal',
        admin: nuevoAdmin, visor: nuevoVisor, activo: true,
      });
      if (error) throw new Error(error.message);
      setMensaje({
        ok: true,
        texto: `Usuario ${email} creado. Entrégale una contraseña temporal: al ingresar por primera vez con su correo y esa contraseña, la cuenta se activa automáticamente.`,
      });
      setNuevoNombre(''); setNuevoEmail('');
      await cargarUsuarios();
    } catch (e: any) {
      setMensaje({ ok: false, texto: `No se pudo crear el usuario: ${e.message}` });
    } finally {
      setGuardando(false);
    }
  }, [nuevoNombre, nuevoEmail, nuevoAlcance, nuevoAdmin, nuevoVisor, cargarUsuarios]);

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

  const resumen = useMemo(() => ({
    total: usuarios.length,
    admins: usuarios.filter(u => u.admin).length,
    visores: usuarios.filter(u => u.visor && !u.admin).length,
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

      {/* 2. Nuevo usuario */}
      <Card className={styles.card}>
        <Title3 style={{ color: '#003057' }}><PersonAddRegular style={{ marginRight: 8 }} />Añadir usuario</Title3>
        <div className={styles.formGrid}>
          <Input placeholder="Nombre completo" value={nuevoNombre} onChange={(_, d) => setNuevoNombre(d.value)} />
          <Input placeholder="correo@cenit-transporte.com" type="email" value={nuevoEmail} onChange={(_, d) => setNuevoEmail(d.value)} />
          <Input placeholder="Alcance (ej. Consulta Reportes)" value={nuevoAlcance} onChange={(_, d) => setNuevoAlcance(d.value)} />
        </div>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <Checkbox checked={nuevoVisor} onChange={(_, d) => setNuevoVisor(!!d.checked)} label="Visor (solo consulta de Reportes)" />
          <Checkbox checked={nuevoAdmin} onChange={(_, d) => setNuevoAdmin(!!d.checked)} label="Administrador" />
          <Button appearance="primary" icon={<PersonAddRegular />} disabled={guardando || !supabaseOk} onClick={crearUsuario}>
            Crear usuario
          </Button>
        </div>
        <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
          Tras crearlo, comunícale una contraseña temporal: en su primer ingreso el sistema crea la cuenta con esa contraseña.
          Para permisos de planeación por zona/línea, solicita el ajuste de ámbitos en la base de datos.
        </Caption1>
      </Card>

      {/* 3. Usuarios */}
      <Card className={styles.card}>
        <Title3 style={{ color: '#003057' }}>
          <PeopleTeamRegular style={{ marginRight: 8 }} />
          Usuarios ({resumen.total} · {resumen.admins} admins · {resumen.visores} visores)
        </Title3>
        {cargandoUsuarios ? <Spinner label="Cargando usuarios…" /> : (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.tabla}>
              <thead>
                <tr>
                  <th className={styles.th}>Nombre</th>
                  <th className={styles.th}>Correo</th>
                  <th className={styles.th}>Alcance</th>
                  <th className={styles.th}>Rol</th>
                  <th className={styles.th}>Estado</th>
                  <th className={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id}>
                    <td className={styles.td} style={{ fontWeight: 600 }}>{u.nombre}</td>
                    <td className={styles.td}>{u.email}</td>
                    <td className={styles.td}>{u.alcance}</td>
                    <td className={styles.td}>
                      {u.admin ? <Badge color="brand">Admin</Badge>
                        : u.visor ? <Badge color="informative">Visor</Badge>
                          : <Badge color="subtle">Equipo</Badge>}
                    </td>
                    <td className={styles.td}>
                      <Badge appearance="tint" color={u.activo ? 'success' : 'danger'}>{u.activo ? 'Activo' : 'Inactivo'}</Badge>
                    </td>
                    <td className={styles.td}>
                      <Button size="small" appearance="subtle" disabled={guardando} onClick={() => toggleActivo(u)}>
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminModule;
