@echo off
title HTMLedger - Build EXE
color 0E

echo.
echo  ^<HTMLedger/^> EXE Build
echo  ================================
echo.
echo  Building installer... this may take a minute.
echo.

call node_modules\.bin\electron-builder.cmd --win --x64

if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Build failed. Check output above.
    pause
    exit /b 1
)

echo.
echo  ================================
echo   Build complete!
echo   Installer is in: dist\
echo  ================================
echo.
pause
