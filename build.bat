@echo off
title HTMLedger - Full Build
color 0D

echo.
echo  ^<HTMLedger/^> Full Build
echo  ================================
echo.

set /p MSG=" Commit message: "
echo.

:: Step 1 - Build EXE
echo  [1/2] Building EXE installer...
echo.
call node_modules\.bin\electron-builder.cmd --win --x64

if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] EXE build failed. Aborting.
    pause
    exit /b 1
)

echo.
echo  [OK] EXE built successfully.
echo.

:: Step 2 - Push to Git
echo  [2/2] Pushing source to GitHub...
echo.
git add .
git commit -m "%MSG%"
git push

if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Git push failed. Check output above.
    pause
    exit /b 1
)

echo.
echo  ================================
echo   All done!
echo   EXE  ->  dist\
echo   Code ->  GitHub
echo  ================================
echo.
pause
