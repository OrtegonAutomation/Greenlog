# CENIT Canvas App - Guía rápida

## 1️⃣ Verificar lista SharePoint

La lista `ActividadesAmbientales` ya debe existir en:
```
https://strategycolombia.sharepoint.com/sites/PatiodeAutomatizacinCamilo
```

**Si NO existe**, ejecuta el script de setup:
```powershell
cd sharepoint
./CENIT_SharePoint_Setup.ps1 -SiteUrl "https://strategycolombia.sharepoint.com/sites/PatiodeAutomatizacinCamilo"
```

---

## 2️⃣ Importar app en Power Apps

### Opción A: Crear desde cero con los YAML

1. Ve a https://make.powerapps.com
2. **Apps** → **+ New app** → **Canvas app** (Phone layout: 640x1136)
3. Una vez en el editor, abre la consola (F12)
4. Copia el contenido de cada `.fx.yaml` y pégalo en Power Apps Studio

**O mejor**, espera a que Power Apps soporte importación directa de YAML en futuras actualizaciones.

### Opción B: Compilar a .msapp (alternativo)

```bash
# Instala power-platform CLI moderno
npm install -g @microsoft/powerapps-cli

# Crea una solución
pac solution create --publisher-name GREENLOG --publisher-prefix cenit

# Agrega la app canvas
pac solution add-reference --path ./CENIT_CanvasApp

# Compila
pac solution build

# Resultado: bin/cenit_1_0_0_0.zip (importar en https://make.powerapps.com)
```

---

## 3️⃣ Configurar la conexión SharePoint

1. En Power Apps Studio:
   - **Insert** → **Data** → **Add data**
   - Busca **SharePoint Online**
   - Selecciona el sitio: `PatiodeAutomatizacinCamilo`
   - Selecciona la lista: `ActividadesAmbientales`

2. La app detectará automáticamente los campos y los formularios funcionarán.

---

## 4️⃣ Publicar para usuarios

1. **File** → **Save** (nombraste como "CENIT")
2. **Publish** (solo creador puede publicar inicialmente)
3. **Share** → Agrega usuarios/grupos de tu organización
4. Los usuarios acceden desde: https://make.powerapps.com → **Apps** → Buscan "CENIT"

---

## 📱 Características principales

| Pantalla | Qué hace |
|----------|----------|
| **Dashboard** | KPIs: total, en ejecución, cerradas, avance promedio |
| **Planeación** | Galería de actividades con buscador y filtros por estado |
| **Ejecución** | Actividades activas mostrando barra de progreso |
| **Reportes** | Gráficas por estado y prioridad |
| **Detalle** | Edición completa de una actividad |
| **Nueva** | Formulario para crear nueva actividad |

---

## 🎨 Colores corporativos

```
Azul primario:    #0033A0  (botones, headers, acentos)
Azul oscuro:      #002266  (header)
Verde CENIT:      #8CC63F  (completadas, éxito)
Naranja:          #F59E0B  (en ejecución)
Morado:           #8B5CF6  (pendiente aprobación)
Rojo:             #EF4444  (alta prioridad)
```

---

## 💡 Tips

- **Sincronización**: Todos los cambios se guardan automáticamente en SharePoint
- **Offline**: La app funciona offline si está en caché; sincroniza cuando hay conexión
- **Permisos**: Los usuarios verán solo lo que pueden acceder en SharePoint
- **Campos obligatorios**: Tarea, Responsable, Fechas, Zona (marcados con *)

---

## ❓ Problemas comunes

### "No puedo conectar a SharePoint"
→ Verifica que tu cuenta tenga acceso al sitio

### "No aparece la lista de actividades"
→ Ejecuta `CENIT_SharePoint_Setup.ps1` para crear la lista

### "La app va lenta"
→ Limita a 10-20 filas con filtros en la galería

### "Necesito agregar más campos"
→ Edita la lista en SharePoint y actualiza los dropdowns en Power Apps

---

**¿Necesitas ayuda?** Revisa [README.md](README.md) para detalles técnicos.
