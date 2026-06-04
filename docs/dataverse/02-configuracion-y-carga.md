# Configuracion y carga inicial en Dataverse

## Prerrequisitos

- Ambiente de Power Platform con Dataverse provisionado.
- Permiso `System Administrator` o `System Customizer` en el ambiente.
- Acceso a https://make.powerapps.com.
- Definir si el ambiente sera `Developer`, `Sandbox` o temporal de pruebas.
- Prefijo de publicador recomendado: `gl`.

Microsoft Learn indica que para crear tablas se requiere base Dataverse provisionada y permisos de administrador o personalizador del sistema en el ambiente.

## 1. Crear solucion

1. Entrar a https://make.powerapps.com.
2. Seleccionar el ambiente temporal.
3. Ir a `Solutions`.
4. Crear solucion:
   - Display name: `GreenLog Temporal Dataverse`
   - Name: `GreenLogTemporalDataverse`
   - Publisher: `GreenLog` o el publicador corporativo autorizado
   - Version: `0.1.0.0`

Todo lo que se cree para esta base temporal debe quedar dentro de esta solucion.

## 2. Crear tabla principal

1. Dentro de la solucion, seleccionar `New > Table > Table (advanced properties)`.
2. Crear:
   - Display name: `Actividad Ambiental`
   - Plural name: `Actividades Ambientales`
   - Primary column display name: `Tarea`
   - Primary column schema name sugerido: `gl_tarea`
3. Agregar las columnas de [01-esquema-temporal.md](./01-esquema-temporal.md).
4. Guardar y publicar personalizaciones.

## 3. Reglas de columna importantes

- `gl_opexdataraw` debe ser `Multiple lines of text` y permitir longitud amplia.
- Los montos deben ser `Currency`.
- `gl_porcentajeavance` puede ser `Decimal number`.
- Choices deben aceptar exactamente los valores que maneja el frontend.
- No cambiar tipos despues de guardar si ya hay datos cargados; Dataverse puede restringir cambios de tipo.

## 4. Seguridad temporal

Crear o reutilizar roles de seguridad segun el piloto:

| Rol | Permiso minimo |
| --- | --- |
| GreenLog Admin | Crear, leer, escribir, eliminar y compartir registros de `Actividad Ambiental`. |
| GreenLog Planeador | Crear, leer y escribir registros propios o de unidad de negocio. |
| GreenLog Consulta | Solo lectura. |

Para piloto interno, iniciar con permisos de tabla completos para `GreenLog Admin` y lectura/escritura para `GreenLog Planeador`. Ajustar por unidad de negocio cuando se defina gobierno real.

## 5. Carga inicial recomendada

Para la base temporal no se recomienda importar primero todos los catalogos. Se recomienda este orden:

1. Crear tabla `Actividad Ambiental`.
2. Cargar 5 registros manuales de prueba:
   - OPEX Monitoreos.
   - CAPEX ICAs.
   - Servicios E.
   - Compensaciones provisiones.
   - Compensaciones estaciones.
3. Validar que cada registro tenga `gl_opexdataraw` con JSON completo.
4. Conectar el frontend a Dataverse.
5. Migrar registros reales cuando crear/editar/exportar este estable.

## 6. Mapeo desde la app actual

| App `NuevaActividadPayload` | Dataverse |
| --- | --- |
| `tarea` | `gl_tarea` |
| `lineaOperativa` | `gl_lineaoperativa` |
| `descripcion` | `gl_descripcion` |
| `responsable` | `gl_responsable` |
| `contrato` | `gl_contrato` |
| `zona` | `gl_zona` |
| `tipoLugar` | `gl_tipolugar` |
| `estacion` | `gl_estacion` |
| `pk` | `gl_pk` |
| `fuentePresupuesto` | `gl_fuentepresupuesto` |
| `tipoPlaneacion` | `gl_tipoplaneacion` |
| `anioPlaneacion` | `gl_anioplaneacion` |
| `fechaInicio` | `gl_fechainicio` |
| `fechaFin` | `gl_fechafin` |
| `mes` | `gl_mes` |
| `estado` | `gl_estado` |
| `prioridad` | `gl_prioridad` |
| `cuenta` | `gl_cuenta` |
| `cumplimientoNormativo` | `gl_cumplimientonormativo` |
| `novedades` | `gl_novedades` |
| `porcentajeAvance` | `gl_porcentajeavance` |
| `estadoAprobacion` | `gl_estadoaprobacion` |
| `presupuestoPlan` | `gl_presupuestoplan` |
| `presupuestoEjecutado` | `gl_presupuestoejecutado` |
| `presupuestoForecast` | `gl_presupuestoforecast` |
| `matricesAplicables` | `gl_matricesaplicables` |
| `opexDataRaw` | `gl_opexdataraw` |

## 7. Validacion de piloto

Despues de conectar la app:

- Crear una planeacion OPEX y otra CAPEX.
- Crear `ICAs` y confirmar items consolidados.
- Crear `Servicios E` y validar complejidad.
- Crear `Compensaciones provisiones` y confirmar flujo tipo ICAs con items manuales.
- Marcar IVA por mes e IPC por mes.
- Editar cada actividad y confirmar precargue.
- Exportar financiera y detalle interno.
- Verificar que `Objeto del contrato` y `Descripcion de la necesidad` viajen en `gl_opexdataraw`.

## 8. Riesgos conocidos

- Si `gl_opexdataraw` queda corto, la edicion del wizard falla o pierde detalle mensual.
- Si los choices no coinciden con los textos del frontend, se debe mapear o usar columnas texto temporalmente.
- Si se activa seguridad estricta antes del piloto, pueden aparecer errores 403/401 similares a SharePoint.
- Si se normalizan tablas hijas antes de estabilizar el wizard, aumenta el esfuerzo de migracion.

## 9. Siguiente paso tecnico

Crear un `DataverseService` separado del `SharePointService`, con un toggle explicito:

- `MockService` para desarrollo local sin autenticacion.
- `DataverseService` para piloto.
- `SharePointService` solo si se mantiene como compatibilidad temporal.

La app no debe intentar conectarse a Dataverse/SharePoint cuando el toggle este en mock.
