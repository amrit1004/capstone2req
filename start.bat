@echo off
echo Starting Medical Insights Engine...
echo.

:: Start backend in new window
start "Backend Server" cmd /k "cd /d %~dp0backend && python main.py"

:: Wait for backend to start
timeout /t 3 /nobreak > nul

:: Start frontend in new window
start "Frontend Server" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Servers starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
pause
