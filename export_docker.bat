@echo off
setlocal

:: Set the destination directory name
set "DEST_DIR=docker"

:: If the directory exists, remove it and all its contents
if exist "%DEST_DIR%" (
    echo Cleaning existing directory: %DEST_DIR%
    rmdir /s /q "%DEST_DIR%"
)

:: Create a fresh destination directory
echo Creating fresh directory: %DEST_DIR%
mkdir "%DEST_DIR%"

:: Execute Robocopy
:: /E   : Copies subdirectories, including empty ones.
:: /XD  : Excludes directories matching these names/paths.
:: /XF  : Excludes files matching these names/patterns.
:: /R:1 /W:1 : Retries once on failure with a 1-second wait.

robocopy "./" "%DEST_DIR%" /E ^
    /XD .git .github dist node_modules "%DEST_DIR%" ^
    /XF .gitignore README.md *.bat *.log *_test.go .env

:: Note: Robocopy returns exit codes. 1 means files were copied successfully.
if %ERRORLEVEL% LEQ 1 (
    echo.
    echo Process complete! Files have been refreshed in: %DEST_DIR%/
) else (
    echo.
    echo Robocopy finished with issues. Please check the output above.
)

pause