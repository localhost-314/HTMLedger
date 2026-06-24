@echo off
title HTMLedger - Git Push
color 0A

echo.
echo  ^<HTMLedger/^> Git Push
echo  ================================
echo.

set /p MSG=" Commit message: "
echo.

git add .
git commit -m "%MSG%"
git push

if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Push failed. Check output above.
    pause
    exit /b 1
)

echo.
echo  ================================
echo   Code pushed to GitHub!
echo  ================================
echo.
pause
