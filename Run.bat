@echo off
echo Starting GLPal Health Tracker...
echo.

:: Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo Failed to install dependencies. Please check your npm installation.
        pause
        exit /b 1
    )
)


echo Starting in Electron mode...
call npm run electron-dev
