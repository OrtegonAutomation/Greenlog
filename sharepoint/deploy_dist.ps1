[CmdletBinding()]
param (
    [Parameter(Mandatory = $false)]
    [string]$SiteUrl = "https://strategycolombia.sharepoint.com/sites/PatiodeAutomatizacinCamilo",
    
    [Parameter(Mandatory = $false)]
    [string]$DistPath = "..\dist",

    [Parameter(Mandatory = $false)]
    [string]$LibraryName = "GreenLogApp"
)

# Configuración Visual
$host.UI.RawUI.WindowTitle = "Despliegue GreenLog a SharePoint"
Clear-Host
Write-Host "=============================================" -ForegroundColor Green
Write-Host "   DESPLIEGUE GREENLOG A SHAREPOINT (STATIC) " -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# 1. Verificar Build
# Resolver ruta relativa al script, no al CWD
$ScriptRoot = $PSScriptRoot
if (-not $ScriptRoot) { $ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition }
$DistFolder = Join-Path $ScriptRoot "..\dist"
if (Test-Path $DistFolder) {
    $FullPathDist = (Resolve-Path $DistFolder).Path
} else {
    $FullPathDist = $null
}

if (-not $FullPathDist) {
    Write-Error "No se encuentra la carpeta 'dist' en: $DistFolder. Ejecuta 'npm run build' primero desde la raiz del proyecto."
    exit
}
Write-Host "✓ Carpeta de build encontrada: $FullPathDist" -ForegroundColor Gray

# 2. Conexión
Write-Host "▶ Conectando a SharePoint..." -ForegroundColor Cyan
try {
    $conn = Get-PnPConnection -ErrorAction Stop
    if ($conn.Url -eq $SiteUrl) {
        Write-Host "✓ Ya estás conectado." -ForegroundColor Green
    } else {
        throw "URL distinta"
    }
} catch {
    # Usamos el Client ID conocido de PnP Management Shell
    $ClientId = "31359c7f-bd7e-475c-86db-fdb8c937548e"
    Write-Host "   Iniciando login interactivo..." -ForegroundColor Yellow
    Connect-PnPOnline -Url $SiteUrl -Interactive -ClientId $ClientId
}

# 3. Crear Biblioteca (si no existe)
Write-Host "▶ Verificando biblioteca '$LibraryName'..." -ForegroundColor Cyan
try {
    $list = Get-PnPList -Identity $LibraryName -ErrorAction SilentlyContinue
    if (-not $list) {
        Write-Host "   Creando biblioteca..." -ForegroundColor Yellow
        New-PnPList -Title $LibraryName -Template DocumentLibrary | Out-Null
        Write-Host "✓ Biblioteca creada." -ForegroundColor Green
    } else {
        Write-Host "✓ La biblioteca ya existe." -ForegroundColor Green
    }
} catch {
    Write-Error "Error verificando/creando biblioteca: $_"
    exit
}

# 4. Subir Archivos
Write-Host "▶ Subiendo archivos..." -ForegroundColor Cyan
$files = Get-ChildItem -Path $FullPathDist -Recurse -File

foreach ($file in $files) {
    # Calcular ruta relativa para mantener estructura de carpetas (assets/, etc.)
    $relativePath = $file.FullName.Substring($FullPathDist.Path.Length + 1)
    $targetFolder = "$LibraryName/" + ([System.IO.Path]::GetDirectoryName($relativePath) -replace "\\", "/")
    
    # Limpiar ruta si está en raíz
    if ($targetFolder -eq "$LibraryName/") { $targetFolder = $LibraryName }

    Write-Host "   Subiendo: $relativePath" -ForegroundColor Gray
    
    # Check if folder exists, create if not (PnP handles this usually but good to be safe)
    # Upload
    Add-PnPFile -Path $file.FullName -Folder $targetFolder -ErrorAction Stop | Out-Null
}

Write-Host "✓ Carga completa." -ForegroundColor Green

# 5. Resultado
$PageUrl = "$SiteUrl/$LibraryName/index.html"
Write-Host "=============================================" -ForegroundColor Green
Write-Host "   ¡DESPLIEGUE EXITOSO! 🚀" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Tu App está disponible en:" -ForegroundColor Cyan
Write-Host "$PageUrl" -ForegroundColor White
Write-Host ""
Write-Host "Comparte este link con tu equipo." -ForegroundColor Gray
