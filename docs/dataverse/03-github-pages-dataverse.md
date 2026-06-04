# GitHub Pages conectado a Dataverse

Esta guia define que se necesita para que GreenLog publicado en GitHub Pages lea y escriba actividades en Dataverse.

## Decision tecnica

GitHub Pages solo hospeda archivos estaticos. Por eso GreenLog debe conectarse a Dataverse desde el navegador usando Microsoft Entra ID y MSAL, sin backend propio y sin secretos de cliente.

Flujo recomendado:

1. El usuario abre `https://ortegonautomation.github.io/Greenlog/`.
2. GreenLog redirige o abre login con Microsoft Entra ID.
3. MSAL obtiene un token delegado para Dataverse.
4. `DataverseService` usa el token en llamadas `fetch` al Web API de Dataverse.
5. Dataverse aplica permisos con roles de seguridad del ambiente.
6. La app mantiene los permisos funcionales de GreenLog: planeador, revisor y admin.

## Lo que necesito para implementarlo

### 1. Datos del ambiente Dataverse

- URL del ambiente, por ejemplo `https://<org>.crm.dynamics.com`.
- Nombre del ambiente de Power Platform.
- Confirmacion de que Dataverse ya esta provisionado.
- Confirmacion del prefijo de publicador, recomendado `gl`.
- Confirmacion de la solucion donde se crearan las tablas: `GreenLog Temporal Dataverse`.

### 2. App registration en Microsoft Entra ID

Necesito uno de estos dos caminos:

- Que CENIT cree el registro de aplicacion y me entregue los IDs.
- O que me den permisos temporales para crearlo.

Datos necesarios:

- `Application (client) ID`.
- `Directory (tenant) ID`.
- Tipo de aplicacion: `Single-page application (SPA)`.
- Redirect URI de produccion:
  - `https://ortegonautomation.github.io/Greenlog/`
- Redirect URI de desarrollo:
  - `http://localhost:5173/`

Permiso API requerido:

- API: `Dataverse`.
- Permiso delegado: `user_impersonation`.

No se debe crear ni usar `client secret` para GitHub Pages. Todo lo que va en una SPA queda visible en el navegador.

### 3. Seguridad y usuarios

Necesito que definan o confirmen:

- Quienes tendran rol `GreenLog Admin`.
- Quienes tendran rol `GreenLog Planeador`.
- Quienes tendran rol `GreenLog Revisor`.
- Si los permisos se controlaran solo con roles Dataverse o con doble control:
  - Dataverse para acceso real a tabla.
  - Catalogo `equipoAmbiental` de GreenLog para filtrar linea/zona y acciones UI.

Recomendacion para piloto:

- Usar Entra ID para login real.
- Mantener `equipoAmbiental` para reglas funcionales por linea/zona.
- Usar roles Dataverse para impedir acceso a usuarios no autorizados.

### 4. Tablas y columnas

Necesito que la tabla principal exista con los nombres logicos definidos en:

- `docs/dataverse/01-esquema-temporal.md`
- `docs/dataverse/02-configuracion-y-carga.md`

Tabla principal esperada:

- Display name: `Actividad Ambiental`
- Nombre logico sugerido: `gl_actividadambiental`

Columna critica:

- `gl_opexdataraw`: texto multilinea amplio.

Esta columna guarda el JSON completo del wizard y es necesaria para:

- editar planeaciones sin perder items;
- conservar IPC/IVA mensual;
- conservar datos auxiliares presupuestales;
- conservar campos especiales de compensaciones;
- conservar items manuales;
- exportar detalle interno y matriz financiera.

### 5. Configuracion en GitHub

Como Vite incrusta las variables `VITE_*` dentro del bundle publico, estas variables no son secretos. Se pueden manejar como GitHub Actions variables o como env directo en el workflow.

Variables requeridas:

```text
VITE_GREENLOG_DATA_SOURCE=dataverse
VITE_DATAVERSE_URL=https://<org>.crm.dynamics.com
VITE_ENTRA_TENANT_ID=<tenant-id>
VITE_ENTRA_CLIENT_ID=<client-id-spa>
VITE_DATAVERSE_API_VERSION=v9.2
```

Cambio esperado en `.github/workflows/deploy-pages.yml`:

```yaml
- name: Build (Vite)
  run: npm run build
  env:
    GREENLOG_GITHUB_PAGES: 'true'
    VITE_GREENLOG_DATA_SOURCE: dataverse
    VITE_DATAVERSE_URL: ${{ vars.VITE_DATAVERSE_URL }}
    VITE_ENTRA_TENANT_ID: ${{ vars.VITE_ENTRA_TENANT_ID }}
    VITE_ENTRA_CLIENT_ID: ${{ vars.VITE_ENTRA_CLIENT_ID }}
    VITE_DATAVERSE_API_VERSION: v9.2
```

## Cambios de codigo necesarios

### 1. Instalar MSAL

```powershell
npm install @azure/msal-browser @azure/msal-react
```

### 2. Reemplazar login temporal

El `LoginGate` actual pide correo manualmente. Para Dataverse debe cambiar a:

- login con Microsoft Entra ID;
- lectura del correo desde el token/cuenta MSAL;
- validacion contra `equipoAmbiental`;
- cierre de sesion con MSAL.

La regla temporal de roles puede seguir igual, pero el correo ya no lo escribe el usuario: llega autenticado.

### 3. Crear `DataverseService`

Crear `src/services/DataverseService.ts` con estas operaciones:

- `getAll()`
- `create(payload)`
- `update(id, cambios)`
- `delete(id)`

La base de URL sera:

```text
{VITE_DATAVERSE_URL}/api/data/{VITE_DATAVERSE_API_VERSION}
```

Todas las llamadas deben enviar:

```text
Authorization: Bearer <access_token>
Accept: application/json
Content-Type: application/json
OData-MaxVersion: 4.0
OData-Version: 4.0
```

### 4. Cambiar selector de servicio

Actualmente `useActividades.ts` decide entre mock y SharePoint con un booleano local:

```ts
const USE_REAL_DATA = false;
const ActividadesService = USE_REAL_DATA ? SharePointService : MockService;
```

Debe cambiar a algo basado en ambiente:

```ts
const DATA_SOURCE = import.meta.env.VITE_GREENLOG_DATA_SOURCE ?? 'mock';
```

Y seleccionar:

- `mock` para desarrollo sin login;
- `dataverse` para GitHub Pages;
- `sharepoint` solo si se mantiene como compatibilidad.

### 5. Mapeo de campos

El mapper debe convertir entre `ActividadAmbiental` y Dataverse.

Ejemplo:

| GreenLog | Dataverse |
| --- | --- |
| `id` | `gl_actividadambientalid` |
| `tarea` | `gl_tarea` |
| `lineaOperativa` | `gl_lineaoperativa` |
| `descripcion` | `gl_descripcion` |
| `zona` | `gl_zona` |
| `estacion` | `gl_estacion` |
| `fuentePresupuesto` | `gl_fuentepresupuesto` |
| `tipoPlaneacion` | `gl_tipoplaneacion` |
| `anioPlaneacion` | `gl_anioplaneacion` |
| `estadoAprobacion` | `gl_estadoaprobacion` |
| `presupuestoPlan` | `gl_presupuestoplan` |
| `presupuestoEjecutado` | `gl_presupuestoejecutado` |
| `opexDataRaw` | `gl_opexdataraw` |

## Orden recomendado de implementacion

1. Crear/validar ambiente Dataverse.
2. Crear app registration SPA en Entra ID.
3. Crear roles Dataverse y asignar usuarios piloto.
4. Crear tabla `Actividad Ambiental` y columnas.
5. Instalar MSAL en GreenLog.
6. Cambiar `LoginGate` a Entra ID.
7. Crear `DataverseService`.
8. Cambiar `useActividades` para seleccionar `dataverse`.
9. Configurar variables de GitHub Actions.
10. Publicar en `main`.
11. Validar en GitHub Pages.

## Pruebas minimas

### Autenticacion

- Usuario CENIT autorizado entra con Entra ID.
- Usuario no autorizado no puede entrar.
- `camilo.ortegonc@outlook.com` entra solo si esta invitado/autorizado en el tenant o se define flujo externo.
- Logout cierra sesion MSAL.

### Datos

- Crear planeacion OPEX.
- Crear planeacion CAPEX.
- Crear ICAs y editarla sin duplicar items.
- Crear Servicios E y editar complejidad.
- Crear Compensaciones provisiones con item manual.
- Aprobar/rechazar como revisor.
- Exportar financiera y detalle interno.

### Seguridad

- Planeador no ve ni edita actividades fuera de su alcance.
- Revisor puede aprobar/rechazar, pero no crear si no es planeador.
- Admin puede ver, editar, eliminar y exportar todo.
- Un usuario sin rol Dataverse recibe 401/403 y la app muestra error claro.

## Riesgos y decisiones pendientes

- GitHub Pages no puede proteger secretos. Solo se permiten datos publicos como tenant ID, client ID y URL del ambiente.
- Si CENIT requiere ocultar reglas, llaves o integraciones privadas, se necesita backend o Azure Function.
- Si `gl_opexdataraw` queda corto, se pierde la capacidad de editar el wizard completo.
- Si se usan choices estrictos en Dataverse, los valores deben coincidir exactamente con los textos del frontend o se debe crear un mapper.
- Si `camilo.ortegonc@outlook.com` no pertenece al tenant CENIT, debe ser invitado como B2B o se debe habilitar un flujo externo.

## Referencias oficiales

- Autenticacion Dataverse Web API: https://learn.microsoft.com/power-apps/developer/data-platform/webapi/authenticate-web-api
- Quickstart SPA JavaScript con Dataverse Web API: https://learn.microsoft.com/power-apps/developer/data-platform/webapi/quick-start-js-spa
- OAuth con Dataverse: https://learn.microsoft.com/power-apps/developer/data-platform/authenticate-oauth
- Redirect URI en Microsoft Entra ID: https://learn.microsoft.com/entra/identity-platform/how-to-add-redirect-uri
