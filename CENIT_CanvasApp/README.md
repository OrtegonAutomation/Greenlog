# CENIT - Canvas App (Power Apps)
**Sistema de Control Ambiental · GREENLOG**

App generada en formato YAML (Power Fx) para Power Apps Canvas.

**👉 [VER GUÍA RÁPIDA](QUICKSTART.md) para empezar en 5 minutos**

---

## Estructura del proyecto

```
CENIT_CanvasApp/
├── src/
│   ├── App.fx.yaml                  ← Variables globales y colores corporativos
│   ├── Pantalla_Dashboard.fx.yaml   ← KPIs y actividades recientes
│   ├── Pantalla_Planeacion.fx.yaml  ← Galería con filtros por estado
│   ├── Pantalla_Ejecucion.fx.yaml   ← Control de avance por actividad
│   ├── Pantalla_Reportes.fx.yaml    ← Estadísticas y distribuciones
│   ├── Pantalla_Detalle.fx.yaml     ← Ver / editar actividad completa
│   └── Pantalla_Nueva.fx.yaml       ← Crear nueva actividad ambiental
├── DataSources/
│   └── ActividadesAmbientales.json  ← Definición de la lista SharePoint
├── Other/
│   ├── Header.json
│   ├── Properties.json
│   └── PublishInfo.json
└── Entropy/
    └── Entropy.json
```

---

## Opciones para usar la app

### ⭐ Opción 1: Importar directamente en Power Apps (RECOMENDADO)

**Nota**: El comando `pac canvas pack` es deprecado. En su lugar, usa la UI moderna de Power Apps:

1. Accede a https://make.powerapps.com
2. **Apps** → **+ New app** → **Canvas app** → **Tablet/Phone**
3. Una vez dentro del editor, ve a **File** → **Open**
4. Busca y abre cualquier `.msapp` o usa la opción **Import YAML**
5. Pega manualmente el contenido de `src/*.fx.yaml` en el editor Power Apps

**Alternativamente**, si quieres mantener el código en YAML versionado en Git:
- Copia el contenido de `CENIT_CanvasApp/src/`
- En Power Apps → **File** → **Sources** → Pega los .fx.yaml

### Opción 2: Compilar con pac (para expertos)

Si insistes en compilar a .msapp, necesitas:
- `pac solution create --publisher-name GREENLOG --publisher-prefix cenit`
- Luego usar `pac solution add-reference --path ./CENIT_CanvasApp`
- Finalmente: `pac solution build` para generar el `.msapp`

(El comando `pac canvas pack` es deprecated y tiene requisitos estrictos con formato antiguo)

---

## Configurar la conexión SharePoint

Antes de compilar, actualiza `DataSources/ActividadesAmbientales.json`:

| Campo | Valor |
|-------|-------|
| `Dataset` | `https://strategycolombia.sharepoint.com/sites/PatiodeAutomatizacinCamilo` ✅ (ya configurado) |
| `ConnectionId` | Obtener en make.powerapps.com → Conexiones → SharePoint |

### Obtener el ConnectionId:
1. Ve a https://make.powerapps.com
2. Conexiones → Nueva conexión → SharePoint Online
3. Copia el ID de la URL: `.../connections/`**tu_id_aqui**`/permissions`

---

## Lista SharePoint requerida

La lista `ActividadesAmbientales` ya existe en tu sitio. Columnas:

| Nombre interno | Tipo | Valores |
|----------------|------|---------|
| `Title` | Text | Nombre de la actividad (campo "Tarea") |
| `TipoActividad` | Choice | Monitoreo, Auditoría, Mantenimiento, Inspección, Capacitación, Otro |
| `Responsable` | Text | Nombre del responsable |
| `FechaInicio` | DateTime | Fecha inicio planeada |
| `FechaFin` | DateTime | Fecha fin planeada |
| `UbicacionZona` | Choice | 10 zonas definidas |
| `Estado` | Choice | Planeada, En Ejecución, Pendiente Aprobación, Cerrada |
| `Prioridad` | Choice | Alta, Media, Baja |
| `PorcentajeAvance` | Number | 0 - 100 |
| `Descripcion` | Note | Texto largo |
| `CumplimientoNormativo` | Text | Norma aplicable |
| `Novedades` | Note | Bitácora de avances |
| `EstadoAprobacion` | Choice | Pendiente, Aprobado, Rechazado |

> Si la lista no existe, ejecuta: `sharepoint/CENIT_SharePoint_Setup.ps1`

---

## Pantallas de la app

| Pantalla | Función |
|----------|---------|
| **Dashboard** | KPIs totales, avance promedio, actividades recientes |
| **Planeación** | Galería con buscador y filtros por estado. Botón "Nueva" |
| **Ejecución** | Actividades activas con barra de progreso visual |
| **Reportes** | Gráficas de barras por estado y prioridad |
| **Detalle** | Formulario completo de edición (todos los campos) |
| **Nueva** | Formulario de creación con validación de campos |

---

## Colores corporativos CENIT

| Token | Color | Uso |
|-------|-------|-----|
| `gblColor_AzulPrimario` | #0033A0 | Botones, header, acentos |
| `gblColor_AzulOscuro` | #002266 | Header/sidebar |
| `gblColor_VerdeCENIT` | #8CC63F | KPIs positivos, badge cerrada |
| `gblColor_Naranja` | #F59E0B | En Ejecución |
| `gblColor_Morado` | #8B5CF6 | Pendiente Aprobación |
| `gblColor_Rojo` | #EF4444 | Alta prioridad / errores |

---

## Cuentas compatibles (free)

- Microsoft 365 Personal/Business Basic — incluye SharePoint Online ✅
- Power Apps Developer Plan (gratuito para desarrollo) ✅
- Microsoft Teams (incluye Dataverse for Teams si se prefiere) ✅

> Esta app usa **solo SharePoint Online** como fuente de datos, que está incluido en planes Microsoft 365 gratuitos o de bajo costo. No requiere licencia Premium de Power Apps.
