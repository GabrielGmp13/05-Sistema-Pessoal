@echo off
setlocal EnableDelayedExpansion
title Sistema Pessoal

:: ── 1. Python disponível? ──────────────────────────────────────────────────
where python >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Python nao encontrado no PATH.
    echo Instale o Python em https://python.org e marque "Add to PATH".
    pause
    exit /b 1
)

:: ── 2. Dependências instaladas? ───────────────────────────────────────────
cd /d "%~dp0backend"
python -c "import flask, flask_cors" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Instalando dependencias...
    python -m pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERRO] Falha ao instalar dependencias.
        pause
        exit /b 1
    )
)

:: ── 3. Porta 5000 em uso? ─────────────────────────────────────────────────
netstat -ano | findstr ":5000 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo [AVISO] Porta 5000 ja esta em uso.
    echo Feche o outro processo antes de continuar.
    pause
    exit /b 1
)

:: ── 4. Inicia Flask em background e aguarda subir ─────────────────────────
echo [INFO] Iniciando servidor...
start /b python app.py > "%TEMP%\sistema_pessoal_flask.log" 2>&1

:: Aguarda até 8 tentativas (4 segundos) para o Flask subir
set "tentativas=0"
:aguarda
set /a tentativas+=1
timeout /t 1 /nobreak >nul
netstat -ano | findstr ":5000 " | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
    if !tentativas! lss 8 goto aguarda
    echo [ERRO] Servidor nao subiu em 8 segundos.
    echo Veja o log em: %TEMP%\sistema_pessoal_flask.log
    pause
    exit /b 1
)

:: ── 5. Abre o browser ─────────────────────────────────────────────────────
echo [OK] Servidor rodando em http://localhost:5000
start "" "http://localhost:5000"

echo.
echo Pressione qualquer tecla para ENCERRAR o servidor.
pause >nul

:: ── 6. Encerra Flask ao fechar a janela ───────────────────────────────────
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":5000 " ^| findstr "LISTENING"') do (
    taskkill /PID %%p /F >nul 2>&1
)
echo [OK] Servidor encerrado.
endlocal