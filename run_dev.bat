@echo off
echo Starting development environment...
echo.

REM Start first cmd window - Run Node.js API service
start "Cambridge Dictionary API" cmd /k "cd utils/cambridge-dictionary-api && node index.js"

REM Wait 1 second for first window to start
timeout /t 1 /nobreak >nul

REM Start second cmd window - Run Go main program
start "Go Main App" cmd /k "go run main.go"