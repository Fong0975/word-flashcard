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
:: Excluding: Git files, build artifacts, dependencies, IDE configs, linting configs, and cache files.

robocopy "./" "%DEST_DIR%" /E ^
    /XD .git .github dist node_modules .vscode .idea .claude coverage .cache "%DEST_DIR%" ^
    /XF .gitignore README.md *.bat *.log *_test.go .env ^
    .eslintrc.json .prettierrc.json .prettierignore .eslintcache ^
    *.tsbuildinfo *.code-workspace npm-debug.log* yarn-debug.log* yarn-error.log* ^
    *.json.example

:: Note: Robocopy returns exit codes. 1 means files were copied successfully.
if %ERRORLEVEL% LEQ 1 (
    echo.
    echo Files have been refreshed in: %DEST_DIR%/

    :: Check for environment configuration files and rename them
    echo Checking for environment configuration files...

    if exist "%DEST_DIR%\.env.production.backend" (
        echo Found .env.production.backend, renaming to .env in %DEST_DIR%/
        move "%DEST_DIR%\.env.production.backend" "%DEST_DIR%\.env"
    )

    if exist "%DEST_DIR%\.env.production.frontend" (
        echo Found .env.production.frontend, renaming to .env in %DEST_DIR%/web/
        if not exist "%DEST_DIR%\web" (
            mkdir "%DEST_DIR%\web"
        )
        move "%DEST_DIR%\.env.production.frontend" "%DEST_DIR%\web\.env"
    )

    echo.
    echo Process complete!
) else (
    echo.
    echo Robocopy finished with issues. Please check the output above.
)

pause