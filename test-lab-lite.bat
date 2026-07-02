@echo off
title HTMLedger Lite - Test Lab
color 0B

echo.
echo  ^<HTMLedger Lite/^> Test Lab
echo  ================================
echo.
echo  Launching app in dev mode...
echo  Close this window to stop.
echo.

cd /d "%~dp0HTMLedger Lite"
call node_modules\.bin\esbuild.cmd renderer\cm-entry.js --bundle --minify --outfile=renderer\cm-bundle.js --format=iife
node_modules\.bin\electron.cmd .

echo.
echo  App closed.
pause
