@echo off
title HTMLedger - Test Lab
color 0B

echo.
echo  ^<HTMLedger/^> Test Lab
echo  ================================
echo.
echo  Launching app in dev mode...
echo  Close this window to stop.
echo.

node_modules\.bin\electron.cmd .

echo.
echo  App closed.
pause
