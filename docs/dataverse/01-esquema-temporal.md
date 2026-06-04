# Esquema temporal Dataverse

## Convenciones

- Prefijo de solucion/publicador: `gl`.
- Nombres visibles en espanol.
- Nombres logicos sugeridos en minuscula, sin espacios.
- Choices simples al inicio; se pueden convertir en tablas catalogo si el gobierno de datos lo exige.
- Fechas en columnas `Date only` salvo que se necesite hora.
- Valores monetarios en `Currency`.
- JSON en texto multilinea para mantener compatibilidad con el wizard actual.

## Tabla principal: Actividad Ambiental

Nombre visible: `Actividad Ambiental`
Nombre logico sugerido: `gl_actividadambiental`
Columna primaria: `gl_tarea`

| Columna visible | Nombre logico | Tipo Dataverse | Obligatorio | Notas |
| --- | --- | --- | --- | --- |
| Tarea | `gl_tarea` | Text | Si | Equivale a `tarea`. Ej: `ICAs - Oriente`. |
| Linea operativa | `gl_lineaoperativa` | Choice o Text | Si | Debe aceptar las lineas actuales, incluida `Compensaciones provisiones`. |
| Descripcion | `gl_descripcion` | Multiple lines of text | No | Resumen visible de items/parametros. |
| Responsable | `gl_responsable` | Text | No | Temporalmente texto; despues puede ser lookup a usuario. |
| Contrato | `gl_contrato` | Text | No | Numero de contrato. |
| Zona | `gl_zona` | Text | Si | Zona seleccionada. |
| Tipo lugar | `gl_tipolugar` | Choice | No | `Estación`, `Línea`, `Zona`. |
| Estacion | `gl_estacion` | Text | No | Solo aplica si tipo lugar es estacion. |
| PK | `gl_pk` | Text | No | Solo aplica si tipo lugar es linea. |
| Fuente presupuesto | `gl_fuentepresupuesto` | Choice | No | `OPEX`, `CAPEX`. |
| Tipo planeacion | `gl_tipoplaneacion` | Choice | No | `Plan`, `Adicional`, `Emergencia`. |
| Anio planeacion | `gl_anioplaneacion` | Whole number | No | Ej: 2026. |
| Fecha inicio | `gl_fechainicio` | Date only | Si | Desde datos auxiliares o inicio de anio. |
| Fecha fin | `gl_fechafin` | Date only | Si | Desde datos auxiliares o fin de anio. |
| Fecha inicio real | `gl_fechainicioreal` | Date only | No | Para ejecucion. |
| Fecha fin real | `gl_fechafinreal` | Date only | No | Para ejecucion. |
| Mes | `gl_mes` | Choice o Text | No | Primer mes programado con valor. |
| Estado | `gl_estado` | Choice | Si | `Planeada`, `En Ejecución`, `Cerrada`, `Pendiente Aprobación`. |
| Prioridad | `gl_prioridad` | Choice | Si | `Alta`, `Media`, `Baja`. |
| Cuenta | `gl_cuenta` | Choice | Si | `OPEX`, `CAPEX`, `PROVISIÓN`, etc. |
| Cumplimiento normativo | `gl_cumplimientonormativo` | Multiple lines of text | No | Campo operativo existente. |
| Novedades | `gl_novedades` | Multiple lines of text | No | Hoy guarda proveedor y objeto parcial. |
| Porcentaje avance | `gl_porcentajeavance` | Decimal number | Si | Default 0. |
| Estado aprobacion | `gl_estadoaprobacion` | Choice | Si | `Pendiente`, `Aprobado`, `Rechazado`. |
| Aprobado por | `gl_aprobadopor` | Text | No | Temporalmente texto. |
| Fecha aprobacion | `gl_fechaaprobacion` | Date only | No | Para aprobacion. |
| Presupuesto plan | `gl_presupuestoplan` | Currency | No | Total planeado. |
| Presupuesto ejecutado | `gl_presupuestoejecutado` | Currency | No | Default 0. |
| Presupuesto forecast | `gl_presupuestoforecast` | Currency | No | Conservar por compatibilidad historica, no mostrar en UI actual. |
| Matrices aplicables | `gl_matricesaplicables` | Multiple lines of text | No | JSON/texto para matrices. |
| Opex data raw | `gl_opexdataraw` | Multiple lines of text | No | JSON completo del wizard. Debe soportar texto largo. |

## Datos auxiliares dentro de `gl_opexDataRaw`

El JSON debe conservar estos campos porque alimentan edicion y exportaciones:

| Campo JSON | Origen |
| --- | --- |
| `procesoAbastecimiento` | Datos auxiliares presupuestales |
| `contrato` | Datos auxiliares presupuestales |
| `objeto` | Objeto del contrato |
| `proveedor` | Datos auxiliares presupuestales |
| `fechaInicio` | Datos auxiliares presupuestales |
| `fechaFin` | Datos auxiliares presupuestales |
| `administrador` | Datos auxiliares presupuestales |
| `supervisor` | Datos auxiliares presupuestales |
| `estadoContrato` | Datos auxiliares presupuestales |
| `descripcionNecesidad` | Descripcion de la necesidad |
| `meses` | Programacion mensual completa |
| `ipcMeses` | Meses donde aplica IPC |
| `ivaMeses` | Meses donde aplica IVA |
| `servicioEComplejidad` | Complejidad elegida para Servicios E |

## Tablas opcionales para fase siguiente

No son necesarias para la base temporal, pero conviene reservar el diseno:

| Tabla | Uso futuro | Relacion |
| --- | --- | --- |
| `gl_actividadmensual` | Un registro por actividad y mes. | N:1 hacia `gl_actividadambiental`. |
| `gl_actividaditemmensual` | Item/precio/cantidad/frecuencia por mes. | N:1 hacia `gl_actividadmensual`. |
| `gl_catalogolinea` | Catalogos reales por linea operativa. | 1:N hacia items. |
| `gl_itemlinea` | Items ICAs, Servicios E, BQS u otros. | N:1 hacia catalogo/linea. |

## Choices sugeridos

### Linea operativa

- `Monitoreos`
- `ICAs`
- `Pagos`
- `S.Cumplimiento`
- `S. Contigencias`
- `S. Viabilidad`
- `S. Proyectos`
- `Servicios E`
- `Compensaciones estaciones`
- `Compensaciones e Inv`
- `Compensaciones provisiones`
- `Estudios Ambientales`
- `Servicios Generales`
- `Hojas de Ruta Sostenibilidad Ambiental`
- `Residuos peligrosos`
- `Herramienta Digital`
- `Inversion Ambiental Voluntaria`
- `Obras por Impuestos`

### Tipo lugar

- `Estación`
- `Línea`
- `Zona`

### Fuente presupuesto

- `OPEX`
- `CAPEX`

### Estado

- `Planeada`
- `En Ejecución`
- `Cerrada`
- `Pendiente Aprobación`

## Criterio de aceptacion

La tabla temporal es suficiente si la app puede:

- crear una actividad desde el wizard;
- editarla y reconstruir el wizard desde `gl_opexdataraw`;
- exportar financiera y detalle interno;
- conservar objeto del contrato y descripcion de necesidad;
- conservar IVA mensual e IPC mensual;
- mantener compatibilidad con actividades historicas que tengan forecast.
