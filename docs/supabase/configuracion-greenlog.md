# Configuracion Supabase para GreenLog

Este documento acompana la migracion `supabase/migrations/20260604154000_greenlog_base.sql`.

## Estado

La migracion crea:

- `greenlog_usuarios`: usuarios autorizados.
- `greenlog_usuario_ambitos`: permisos por rol, linea operativa y zona.
- `greenlog_actividades`: registros de planeacion y ejecucion.
- Funciones de apoyo para validar scopes con `auth.jwt()->>'email'`.
- RLS para lectura, creacion, edicion y eliminacion.
- Seed inicial del equipo ambiental usado actualmente por GreenLog.

## Seguridad

El piloto publicado en GitHub Pages usa Supabase Auth con magic link. El frontend primero valida el correo contra `equipoAmbiental`; si esta autorizado, solicita el enlace seguro a Supabase.

Las politicas RLS leen el email desde el JWT autenticado mediante `auth.jwt()->>'email'`. Ya no se usa `x-greenlog-email` como fuente de identidad.

Este modo sigue siendo temporal hasta reemplazarlo por Entra ID, pero ya protege la informacion con sesion autenticada y RLS.

Regla practica:

- `anon key`: puede ir en GitHub Pages si RLS esta activo.
- `service_role key`: nunca va en frontend, GitHub Pages ni repositorio.
- `database password`: solo para CLI o administracion local.

## Aplicar migracion

Como las credenciales no deben escribirse en el chat, crea un archivo local ignorado por git:

```powershell
@'
SUPABASE_PROJECT_REF=vcvtaycalbytuetrmgsi
SUPABASE_ACCESS_TOKEN=pega_tu_access_token
SUPABASE_DB_PASSWORD=pega_password_db
'@ | Set-Content -Path .env.supabase.local -Encoding utf8
```

Luego carga variables y aplica:

```powershell
Get-Content .env.supabase.local | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') {
    [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), 'Process')
  }
}

npx supabase link --project-ref $env:SUPABASE_PROJECT_REF
npx supabase db push --password $env:SUPABASE_DB_PASSWORD
```

## Variables para GreenLog

Para conectar la app despues:

```text
VITE_GREENLOG_DATA_SOURCE=supabase
VITE_SUPABASE_URL=https://vcvtaycalbytuetrmgsi.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_or_publishable_key>
```

Estas variables no reemplazan la migracion. Solo configuran el frontend.

## Siguiente paso de codigo

Despues de aplicar la migracion:

1. Instalar `@supabase/supabase-js`.
2. Crear `src/services/SupabaseService.ts`.
3. Cambiar `useActividades` para seleccionar `mock | supabase | dataverse`.
4. Reemplazar login temporal por Supabase Auth o magic link.
5. Configurar GitHub Actions con `VITE_GREENLOG_DATA_SOURCE=supabase`.
