@echo off
title HTMLedger - Website Tools
color 0D

:MENU
cls
echo.
echo  ^<HTMLedger/^> Website Tools
echo  ================================
echo.
echo   [1]  Dev Server    (localhost:5173)
echo   [2]  Build         (production check)
echo   [3]  Deploy        (git push - Cloudflare auto-builds)
echo   [4]  Build + Deploy
echo   [0]  Exit
echo.
set /p CHOICE="  Choose: "

if "%CHOICE%"=="1" goto DEV
if "%CHOICE%"=="2" goto BUILD
if "%CHOICE%"=="3" goto DEPLOY
if "%CHOICE%"=="4" goto BUILD_DEPLOY
if "%CHOICE%"=="0" exit /b
goto MENU

:: ──────────────────────────────────────
:DEV
cls
echo.
echo  Starting dev server at http://localhost:5173
echo  Press Ctrl+C to stop.
echo.
cd /d "%~dp0Website"
npm run dev
cd /d "%~dp0"
goto MENU

:: ──────────────────────────────────────
:BUILD
cls
echo.
echo  Building for production...
echo.
cd /d "%~dp0Website"
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Build failed. Check output above.
    cd /d "%~dp0"
    pause
    goto MENU
)
echo.
echo  ================================
echo   Build complete - dist\ is ready
echo  ================================
echo.
cd /d "%~dp0"
pause
goto MENU

:: ──────────────────────────────────────
:DEPLOY
cls
echo.
set /p MSG="  Commit message: "
echo.
git remote set-url origin https://github.com/localhost-314/HTMLedger.git
git add .
git commit -m "%MSG%"
git push origin main
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Push failed. Check output above.
    pause
    goto MENU
)
echo.
echo  ================================
echo   Pushed! Cloudflare will build
echo   and deploy automatically.
echo  ================================
echo.
pause
goto MENU

:: ──────────────────────────────────────
:BUILD_DEPLOY
cls
echo.
echo  [1/2] Building for production...
echo.
cd /d "%~dp0Website"
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Build failed. Aborting.
    cd /d "%~dp0"
    pause
    goto MENU
)
echo.
echo  [OK] Build passed.
echo.
cd /d "%~dp0"
set /p MSG="  Commit message: "
echo.
echo  [2/2] Pushing to GitHub...
echo.
git remote set-url origin https://github.com/localhost-314/HTMLedger.git
git add .
git commit -m "%MSG%"
git push origin main
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Push failed. Check output above.
    pause
    goto MENU
)
echo.
echo  ================================
echo   Built + pushed! Cloudflare
echo   will publish automatically.
echo  ================================
echo.
pause
goto MENU
