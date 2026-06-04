# Dataverse temporal para GreenLog

Esta carpeta define una configuracion temporal de Dataverse para mover GreenLog desde datos mock/SharePoint hacia una base administrada sin redisenar todavia el frontend.

## Objetivo

- Tener una base temporal para planeaciones ambientales.
- Mantener compatibilidad con el modelo actual de la app: `ActividadAmbiental`, `NuevaActividadPayload` y `opexDataRaw`.
- Permitir pruebas con OPEX, CAPEX, ICAs, Servicios E, Compensaciones provisiones y exportaciones.
- Dejar un camino claro para normalizar datos despues.

## Documentos

- [01-esquema-temporal.md](./01-esquema-temporal.md): tablas, columnas y decisiones de modelado.
- [02-configuracion-y-carga.md](./02-configuracion-y-carga.md): pasos para crear ambiente, solucion, tablas, seguridad y carga inicial.

## Decision temporal

La version temporal debe iniciar con una tabla principal `gl_ActividadAmbiental` que guarde los campos consultados por la aplicacion y un campo largo `gl_opexDataRaw` con el JSON del wizard.

Esto evita partir ahora la programacion mensual en varias tablas y reduce el riesgo de romper:

- edicion de planeaciones existentes;
- exportacion financiera;
- detalle interno;
- IVA mensual;
- IPC mensual;
- items manuales y catalogos especiales.

Cuando la captura y los reportes esten estabilizados, se puede normalizar `opexDataRaw` en tablas hijas.

## Fuentes Microsoft Learn

Referencias oficiales usadas para alinear la guia:

- Crear y editar columnas en Dataverse: https://learn.microsoft.com/power-apps/maker/data-platform/create-edit-field-portal
- Crear columnas nuevas en Dataverse: https://learn.microsoft.com/power-apps/maker/data-platform/fields-overview#create-a-table-column
- Relaciones 1:N/N:1 en Dataverse: https://learn.microsoft.com/power-apps/maker/data-platform/create-edit-1n-relationships
- Permisos para crear tablas en Dataverse: https://learn.microsoft.com/power-apps/maker/canvas-apps/create-edit-tables
