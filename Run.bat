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

:: Check if this is Electron or web
choice /C EW /M "Run with (E)lectron or (W)eb browser?" /T 10 /D E
if errorlevel 2 goto :web
if errorlevel 1 goto :electron

:electron
echo.
echo Starting in Electron mode...
call npm run electron-dev
goto :end

:web
echo.
echo Starting in web browser mode...
call npm start
goto :end

:end
if errorlevel 1 (
    echo.
    echo Application exited with an error.
) else (
    echo.
    echo Application closed successfully.
)
pause