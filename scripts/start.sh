#!/bin/bash
# ========================================
# KEVIN HUSSEIN TATTOO STUDIO
# Script de Inicialização (Linux/Mac)
# ========================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "========================================"
echo " KEVIN HUSSEIN TATTOO STUDIO"
echo "========================================"
echo ""

stop_servers() {
    echo "[STOP] Parando servidores..."
    
    # Matar processos nas portas 3000 e 3001
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    
    echo "[OK] Servidores parados"
}

start_backend() {
    echo "[BACKEND] Iniciando servidor..."
    
    cd "$PROJECT_ROOT/server"
    
    # Verificar se node_modules existe
    if [ ! -d "node_modules" ]; then
        echo "[BACKEND] Instalando dependências..."
        npm install
    fi
    
    # Iniciar backend em background
    nohup node index.new.js > /dev/null 2>&1 &
    
    echo "[OK] Backend iniciado em http://localhost:3001"
}

start_frontend() {
    echo "[FRONTEND] Iniciando servidor..."
    
    cd "$PROJECT_ROOT"
    
    # Verificar se node_modules existe
    if [ ! -d "node_modules" ]; then
        echo "[FRONTEND] Instalando dependências..."
        npm install
    fi
    
    # Iniciar frontend em background
    nohup npm run dev > /dev/null 2>&1 &
    
    echo "[OK] Frontend iniciado em http://localhost:3000"
}

# Parse argumentos
case "${1:-all}" in
    stop)
        stop_servers
        ;;
    backend)
        stop_servers
        start_backend
        ;;
    frontend)
        stop_servers
        start_frontend
        ;;
    all|*)
        stop_servers
        sleep 2
        start_backend
        sleep 3
        start_frontend
        
        echo ""
        echo "========================================"
        echo " SERVIDORES INICIADOS COM SUCESSO!"
        echo "========================================"
        echo ""
        echo " Backend:  http://localhost:3001"
        echo " Frontend: http://localhost:3000"
        echo " Admin:    http://localhost:3000/admin"
        echo ""
        echo " Usuario: kevin | Senha: 2026"
        echo ""
        ;;
esac
