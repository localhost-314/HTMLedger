@echo off
title HTMLedger - Release Tool
color 0D

cls
echo.
echo  ^<HTMLedger/^> Release Tool
echo  ================================
echo.
echo  Steps this will handle:
echo    1. Bump version in package.json
echo    2. Build the EXE + latest.yml
echo    3. Update website download link
echo    4. Commit and push everything
echo    5. Open GitHub + dist folder
echo.
set /p NEW_VERSION="  New version (e.g. 1.0.1): "
if "%NEW_VERSION%"=="" goto CANCEL
echo.

:: ── Step 1: Bump version ──────────────────────────────────
echo  [1/5] Bumping version to v%NEW_VERSION%...
cd /d "%~dp0"
call npm version %NEW_VERSION% --no-git-tag-version >nul 2>&1
if %errorlevel% neq 0 (
  echo  [ERROR] Could not set version. Is %NEW_VERSION% a valid semver?
  pause & exit /b 1
)
echo  Done.
echo.

:: ── Step 2: Build EXE ────────────────────────────────────
echo  [2/5] Building EXE installer...
call node_modules\.bin\electron-builder.cmd --win --x64
if %errorlevel% neq 0 (
  echo.
  echo  [ERROR] Build failed. Check output above.
  pause & exit /b 1
)
echo.
echo  Build complete.
echo.

:: ── Step 3: Update website ────────────────────────────────
echo  [3/5] Updating website version to v%NEW_VERSION%...
powershell -NoProfile -Command ^
  "$f = '%~dp0Website\src\pages\Download.tsx';" ^
  "$c = Get-Content $f -Raw;" ^
  "$c = $c -replace \"const VERSION = '.*?'\", \"const VERSION = '%NEW_VERSION%'\";" ^
  "$c = $c -replace 'HTMLedger\.Setup\.\d+\.\d+\.\d+\.exe', 'HTMLedger.Setup.%NEW_VERSION%.exe';" ^
  "Set-Content $f $c -NoNewline;"
echo  Done.
echo.

:: ── Step 4: Commit and push ───────────────────────────────
echo  [4/5] Pushing to GitHub...
git add package.json package-lock.json Website/src/pages/Download.tsx
git commit -m "Release v%NEW_VERSION%"
git push
if %errorlevel% neq 0 (
  echo.
  echo  [ERROR] Push failed. Check output above.
  pause & exit /b 1
)
echo  Done.
echo.

:: ── Step 5: Open GitHub + dist ───────────────────────────
echo  [5/5] Opening GitHub Releases page and dist folder...
start "" "https://github.com/localhost314/HTMLedger/releases/new"
start "" "%~dp0dist"
echo.
echo  ================================
echo   Upload these two files to the
echo   GitHub release you just opened:
echo.
echo     HTMLedger Setup %NEW_VERSION%.exe
echo     latest.yml
echo.
echo   Set tag to: v%NEW_VERSION%
echo  ================================
echo.
pause
exit /b 0

:CANCEL
echo  Cancelled.
pause
