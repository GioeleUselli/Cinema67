@echo off
echo ============================================
echo  Cinema67 - Avvio Completo
echo ============================================
echo.

echo [1/3] Popolamento database...
cd /d "%~dp0backend\scripts\FilmApiSeeder"
dotnet run
if %ERRORLEVEL% NEQ 0 (
    echo ERRORE: Popolamento fallito
    pause
    exit /b 1
)
echo Database popolato con successo.
echo.

echo [2/3] Avvio backend (porta 5000)...
cd /d "%~dp0backend\FilmAPI"
start "Cinema67 Backend" dotnet run
echo Backend avviato in una nuova finestra.
echo.

echo [3/3] Avvio frontend (porta 5001)...
cd /d "%~dp0frontend\CineBase.Web"
start "Cinema67 Frontend" dotnet run
echo Frontend avviato in una nuova finestra.
echo.

echo ============================================
echo  Cinema67 e ora online!
echo  Frontend: http://localhost:5001
echo  Backend:  http://localhost:5000
echo ============================================
pause
