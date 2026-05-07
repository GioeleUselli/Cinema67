@echo off
echo ============================================
echo  Cinema67 - Avvio Completo
echo ============================================
echo.

set /p SEED="Popolare il database? (s/N): "
if /i "%SEED%"=="s" (
    echo.
    echo [*] Popolamento database in corso...
    cd /d "%~dp0backend\scripts\FilmApiSeeder"
    dotnet run
    if %ERRORLEVEL% NEQ 0 (
        echo ERRORE: Popolamento fallito
        pause
        exit /b 1
    )
    echo Database popolato con successo.
) else (
    echo Salto popolamento database.
)

echo.
echo [2/3] Avvio backend (porta 5000)...
cd /d "%~dp0backend\FilmAPI"
start "Cinema67 Backend" dotnet run
echo Backend avviato.
echo.

echo [3/3] Avvio frontend (porta 5001)...
cd /d "%~dp0frontend\CineBase.Web"
start "Cinema67 Frontend" dotnet run
echo Frontend avviato.
echo.

echo ============================================
echo  Cinema67 online!
echo  Frontend: http://localhost:5001
echo  Backend:  http://localhost:5000
echo ============================================
pause
