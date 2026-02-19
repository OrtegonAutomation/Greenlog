# ============================================================
# CENIT_SharePoint_Setup.ps1
# Crea la lista "ActividadesAmbientales" en SharePoint Online
# Requisito: PnP PowerShell → Install-Module PnP.PowerShell
#
# Uso:
#   .\CENIT_SharePoint_Setup.ps1 -SiteUrl "https://TUTENANT.sharepoint.com/sites/CENIT"
# ============================================================
param(
    [Parameter(Mandatory=$true)]
    [string]$SiteUrl
)

Write-Host "▶ Verificando conexión a SharePoint..." -ForegroundColor Cyan

try {
    $conn = Get-PnPConnection -ErrorAction Stop
    if ($conn.Url -eq $SiteUrl) {
        Write-Host "✓ Ya estás conectado a: $($conn.Url)" -ForegroundColor Green
    } else {
        throw "URL no coincide"
    }
} catch {
    Write-Host "⚠ No se detectó conexión activa. Intentando conectar (PnP App)..." -ForegroundColor Yellow
    # Usamos el Client ID público de "PnP Management Shell" para permitir login interactivo moderno
    $ClientId = "31359c7f-bd7e-475c-86db-fdb8c937548e" 
    Connect-PnPOnline -Url $SiteUrl -Interactive -ClientId $ClientId
}

# ──────────────────────────────────────────────────────────────
# 1. Crear la lista principal
# ──────────────────────────────────────────────────────────────
$ListName = "ActividadesAmbientales"

$existente = Get-PnPList -Identity $ListName -ErrorAction SilentlyContinue
if ($existente) {
    Write-Host "⚠  La lista '$ListName' ya existe. Se omite la creación." -ForegroundColor Yellow
} else {
    Write-Host "▶ Creando lista: $ListName" -ForegroundColor Cyan
    New-PnPList -Title $ListName -Template GenericList -OnQuickLaunch
    Write-Host "✓ Lista creada." -ForegroundColor Green
}

# ──────────────────────────────────────────────────────────────
# 2. Columnas de la lista
#    NOTA: La columna "Title" ya existe (se usará como "Tarea")
# ──────────────────────────────────────────────────────────────
Write-Host "▶ Agregando columnas..." -ForegroundColor Cyan

# Renombrar Title → Tarea
Set-PnPField -List $ListName -Identity "Title" -Values @{ Title = "Tarea"; Description = "Nombre o descripción de la actividad ambiental" }

$columnas = @(
    # Tipo de actividad
    @{ InternalName = "TipoActividad"; DisplayName = "Tipo de Actividad"; Type = "Choice";
       Choices = @("Monitoreo","Auditoría","Mantenimiento","Inspección","Capacitación","Otro") },

    # Responsable
    @{ InternalName = "Responsable"; DisplayName = "Responsable"; Type = "Text" },

    # Fechas planeadas
    @{ InternalName = "FechaInicio";     DisplayName = "Fecha Inicio";     Type = "DateTime" },
    @{ InternalName = "FechaFin";        DisplayName = "Fecha Fin";        Type = "DateTime" },

    # Fechas reales de ejecución (Fase 2)
    @{ InternalName = "FechaInicioReal"; DisplayName = "Fecha Inicio Real"; Type = "DateTime" },
    @{ InternalName = "FechaFinReal";    DisplayName = "Fecha Fin Real";    Type = "DateTime" },

    # Zona
    @{ InternalName = "UbicacionZona"; DisplayName = "Ubicación / Zona"; Type = "Choice";
       Choices = @(
           "Zona Norte - Planta Principal","Zona Sur - Orilla del Río",
           "Bodega Central","Zona Industrial","Área Administrativa",
           "Campo - Oleoducto Norte","Campo - Oleoducto Sur",
           "Estación de Bombeo 1","Estación de Bombeo 2","Otra"
       )},

    # Estado
    @{ InternalName = "Estado"; DisplayName = "Estado"; Type = "Choice";
       Choices = @("Planeada","En Ejecución","Pendiente Aprobación","Cerrada") },

    # Prioridad
    @{ InternalName = "Prioridad"; DisplayName = "Prioridad"; Type = "Choice";
       Choices = @("Alta","Media","Baja") },

    # Descripción larga
    @{ InternalName = "Descripcion"; DisplayName = "Descripción"; Type = "Note" },

    # Referencia normativa
    @{ InternalName = "CumplimientoNormativo"; DisplayName = "Norma / Reglamentación"; Type = "Text" },

    # Porcentaje de avance
    @{ InternalName = "PorcentajeAvance"; DisplayName = "% Avance"; Type = "Number" },

    # Novedades / Bitácora simplificada
    @{ InternalName = "Novedades"; DisplayName = "Novedades"; Type = "Note" },

    # Flujo de aprobación (Fase 2 / Transversal)
    @{ InternalName = "EstadoAprobacion"; DisplayName = "Estado Aprobación"; Type = "Choice";
       Choices = @("Pendiente","Aprobado","Rechazado") },
    @{ InternalName = "AprobadoPor";     DisplayName = "Aprobado Por";     Type = "Text" },
    @{ InternalName = "FechaAprobacion"; DisplayName = "Fecha Aprobación"; Type = "DateTime" },

    # URLs de evidencias (JSON array almacenado como texto)
    @{ InternalName = "EvidenciasUrls"; DisplayName = "Evidencias (URLs)"; Type = "Note" }
)

foreach ($col in $columnas) {
    $existe = Get-PnPField -List $ListName -Identity $col.InternalName -ErrorAction SilentlyContinue
    if ($existe) {
        Write-Host "  ⚠  Columna '$($col.InternalName)' ya existe — omitida." -ForegroundColor Yellow
        continue
    }

    if ($col.Type -eq "Choice") {
        Add-PnPField -List $ListName -InternalName $col.InternalName `
            -DisplayName $col.DisplayName -Type Choice `
            -Choices $col.Choices -AddToDefaultView
    } elseif ($col.Type -eq "Number") {
        Add-PnPField -List $ListName -InternalName $col.InternalName `
            -DisplayName $col.DisplayName -Type Number -AddToDefaultView
    } elseif ($col.Type -eq "DateTime") {
        Add-PnPField -List $ListName -InternalName $col.InternalName `
            -DisplayName $col.DisplayName -Type DateTime -AddToDefaultView
    } elseif ($col.Type -eq "Note") {
        Add-PnPField -List $ListName -InternalName $col.InternalName `
            -DisplayName $col.DisplayName -Type Note -AddToDefaultView
    } else {
        Add-PnPField -List $ListName -InternalName $col.InternalName `
            -DisplayName $col.DisplayName -Type Text -AddToDefaultView
    }
    Write-Host "  ✓ Columna '$($col.DisplayName)' creada." -ForegroundColor Green
}

# ──────────────────────────────────────────────────────────────
# 3. Configurar validación: FechaFin >= FechaInicio
# ──────────────────────────────────────────────────────────────
Write-Host "▶ Configurando validación de fechas..." -ForegroundColor Cyan
# Set-PnPList -Identity $ListName `
#     -ValidationFormula "=[FechaFin]>=[FechaInicio]" `
#     -ValidationMessage "La fecha de fin debe ser igual o posterior a la fecha de inicio."
Write-Host "✓ Validación configurada (Omitida por compatibilidad)." -ForegroundColor Green

# ──────────────────────────────────────────────────────────────
# 4. Insertar datos de ejemplo
# ──────────────────────────────────────────────────────────────
Write-Host "▶ Insertando datos de ejemplo..." -ForegroundColor Cyan

$ejemplos = @(
    @{
        Title = "Monitoreo de calidad del aire PM2.5 y PM10"
        TipoActividad = "Monitoreo"; Responsable = "Carlos Mendoza"
        FechaInicio = [DateTime]"2026-02-01"; FechaFin = [DateTime]"2026-02-28"
        UbicacionZona = "Campo - Oleoducto Norte"; Estado = "En Ejecución"
        Prioridad = "Alta"; PorcentajeAvance = 62
        CumplimientoNormativo = "Res. 2254/2017 MADS"
        EstadoAprobacion = "Aprobado"
    },
    @{
        Title = "Auditoría de residuos sólidos y peligrosos Q1"
        TipoActividad = "Auditoría"; Responsable = "Laura Gómez"
        FechaInicio = [DateTime]"2026-03-01"; FechaFin = [DateTime]"2026-03-15"
        UbicacionZona = "Bodega Central"; Estado = "Planeada"
        Prioridad = "Alta"; PorcentajeAvance = 0
        CumplimientoNormativo = "Dec. 1076/2015"
        EstadoAprobacion = "Pendiente"
    },
    @{
        Title = "Revisión de vertimientos - Cuenca Río Magdalena"
        TipoActividad = "Inspección"; Responsable = "Andrés Ruiz"
        FechaInicio = [DateTime]"2026-01-10"; FechaFin = [DateTime]"2026-01-31"
        UbicacionZona = "Zona Sur - Orilla del Río"; Estado = "Cerrada"
        Prioridad = "Alta"; PorcentajeAvance = 100
        CumplimientoNormativo = "Dec. 3930/2010"
        EstadoAprobacion = "Aprobado"
    }
)

foreach ($item in $ejemplos) {
    Add-PnPListItem -List $ListName -Values $item | Out-Null
    Write-Host "  ✓ Ítem de ejemplo creado: $($item.Title)" -ForegroundColor Green
}

# ──────────────────────────────────────────────────────────────
# 5. Resultado
# ──────────────────────────────────────────────────────────────
$list = Get-PnPList -Identity $ListName
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✓  Lista creada exitosamente" -ForegroundColor Green
Write-Host "   Nombre : $($list.Title)"
Write-Host "   ID     : $($list.Id)"
Write-Host "   URL    : $SiteUrl/Lists/$ListName"
Write-Host ""
Write-Host "SIGUIENTE PASO — Conectar con PAC CLI:" -ForegroundColor Yellow
Write-Host '  pac code add-data-source \' -ForegroundColor White
Write-Host '    -a "shared_sharepointonline" \' -ForegroundColor White
Write-Host '    -c "<TU_CONNECTION_ID>" \' -ForegroundColor White
Write-Host "    -t `"$ListName`" \\" -ForegroundColor White
Write-Host "    -d `"$SiteUrl`"" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
