# ========================================
# KEVIN HUSSEIN TATTOO STUDIO
# Script de Inicialização (Windows)
# ========================================

param(
    [switch]$Backend,
    [switch]$Frontend,
    [switch]$All,
    [switch]$Stop
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " KEVIN HUSSEIN TATTOO STUDIO" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Stop-Servers {
    Write-Host "[STOP] Parando servidores..." -ForegroundColor Yellow
    
    Get-NetTCPConnection -LocalPort 3000, 3001 -ErrorAction SilentlyContinue | 
        ForEach-Object { 
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
        }
    
    Write-Host "[OK] Servidores parados" -ForegroundColor Green
}

function Start-Backend {
    Write-Host "[BACKEND] Iniciando servidor..." -ForegroundColor Cyan
    
    $serverPath = Join-Path $ProjectRoot "server"
    
    # Verificar se node_modules existe
    if (-not (Test-Path (Join-Path $serverPath "node_modules"))) {
        Write-Host "[BACKEND] Instalando dependências..." -ForegroundColor Yellow
        Push-Location $serverPath
        npm install
        Pop-Location
    }
    
    # Iniciar backend
    Start-Process -FilePath "node" -ArgumentList "index.new.js" -WorkingDirectory $serverPath -WindowStyle Normal
    
    Write-Host "[OK] Backend iniciado em http://localhost:3001" -ForegroundColor Green
}

function Start-Frontend {
    Write-Host "[FRONTEND] Iniciando servidor..." -ForegroundColor Cyan
    
    # Verificar se node_modules existe
    if (-not (Test-Path (Join-Path $ProjectRoot "node_modules"))) {
        Write-Host "[FRONTEND] Instalando dependências..." -ForegroundColor Yellow
        Push-Location $ProjectRoot
        npm install
        Pop-Location
    }
    
    # Iniciar frontend
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory $ProjectRoot -WindowStyle Normal
    
    Write-Host "[OK] Frontend iniciado em http://localhost:3000" -ForegroundColor Green
}

# Executar comandos baseado nos parâmetros
if ($Stop) {
    Stop-Servers
}
elseif ($Backend) {
    Stop-Servers
    Start-Backend
}
elseif ($Frontend) {
    Stop-Servers
    Start-Frontend
}
elseif ($All -or (-not $Backend -and -not $Frontend)) {
    Stop-Servers
    Start-Sleep -Seconds 2
    Start-Backend
    Start-Sleep -Seconds 3
    Start-Frontend
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host " SERVIDORES INICIADOS COM SUCESSO!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host " Backend:  http://localhost:3001" -ForegroundColor White
    Write-Host " Frontend: http://localhost:3000" -ForegroundColor White
    Write-Host " Admin:    http://localhost:3000/admin" -ForegroundColor Yellow
    Write-Host ""
    Write-Host " Usuario: kevin | Senha: 2026" -ForegroundColor Cyan
    Write-Host ""
}
