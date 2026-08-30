@echo off
echo Starting development environment...
echo.

REM Start first cmd window - Run Go main program
start "Go Main App" cmd /k "go run main.go"

REM Wait 1 second for first window to start
timeout /t 1 /nobreak >nul

REM Start second cmd window - Run React frontend dev server
start "React Frontend" cmd /k "cd web && npm start"