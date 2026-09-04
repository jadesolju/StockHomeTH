@echo off
cd /d "%~dp0"
chcp 65001 >nul
title StockHomeTH - Next.js & yfinance Real Market Platform

echo =====================================================================
echo           StockHomeTH - Real Stock & Financial Intelligence
echo            yfinance Anti-Block Bulk Engine + Custom Stock Chart
echo =====================================================================
echo.

:: 1. Free port 3000 if occupied by previous session
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo [*] ตรวจพบการใช้งาน Port 3000 (PID: %%a) กำลังเคลียร์พอร์ต...
    taskkill /f /pid %%a >nul 2>&1
)

:: 2. Set memory optimization for Node.js
set NODE_OPTIONS=--max-old-space-size=4096

:: 3. Safe Python & FastAPI Check (Optional Engine)
echo [*] ตรวจสอบสภาพแวดล้อม Python...
where py >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('py --version 2^>nul') do set PY_VER=%%i
    echo [✓] ตรวจพบ Python Launcher: %PY_VER%
) else (
    where python >nul 2>nul
    if %errorlevel% equ 0 (
        python --version >nul 2>&1
        if %errorlevel% equ 0 (
            for /f "tokens=*" %%i in ('python --version 2^>nul') do set PY_VER=%%i
            echo [✓] ตรวจพบ Python: %PY_VER%
        ) else (
            echo [i] ใช้โหมด Direct Node.js API (Built-in Web Scraping ^& Yahoo Finance)
        )
    ) else (
        echo [i] ใช้โหมด Direct Node.js API (Built-in Web Scraping ^& Yahoo Finance)
    )
)
echo.

:: 4. Check Node.js installation
echo [*] ตรวจสอบ Node.js ในระบบ...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [X] ไม่พบ Node.js ในเครื่อง กรุณาติดตั้ง Node.js จาก https://nodejs.org
    echo.
    pause
    cmd /k
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v 2^>nul') do set NODE_VERSION=%%i
echo [✓] ตรวจพบ Node.js เวอร์ชั่น: %NODE_VERSION%
echo.

:: 5. Check and install dependencies if needed
if not exist "node_modules\" (
    echo [*] ไม่พบโฟลเดอร์ node_modules กำลังติดตั้ง Dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [X] ติดตั้ง Dependencies ไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
        echo.
        pause
        cmd /k
        exit /b 1
    )
    echo [✓] ติดตั้ง Dependencies สำเร็จเรียบร้อย!
    echo.
)

:: 6. Check environment file
if not exist ".env" (
    echo [*] กำลังสร้างไฟล์ .env พื้นฐาน...
    (
        echo # Google Gemini API Key ^(Optional - for live AI summary^)
        echo GEMINI_API_KEY=
        echo PORT=3000
    ) > .env
    echo [✓] สร้างไฟล์ .env เรียบร้อยแล้ว (สามารถใส่ GEMINI_API_KEY ได้ภายหลัง)
    echo.
)

:: 7. Open browser after short delay in background
start /min cmd /c "timeout /t 4 >nul && start http://localhost:3000"

:: 8. Run Server Loop (Never closes abruptly)
:run_server
echo =====================================================================
echo  [🚀] กำลังเริ่มต้น Dev Server บน http://localhost:3000 ...
echo  [📊] Real-time yfinance + TradingView Live Chart พร้อมทำงาน
echo  [💡] กด Ctrl + C เพื่อหยุด Dev Server (หน้าต่าง CMD จะเปิดค้างไว้เสมอ)
echo =====================================================================
echo.

call npm run dev

echo.
echo =====================================================================
echo  [!] Dev Server หยุดทำงานแล้ว (Exit Code: %errorlevel%)
echo =====================================================================
echo  [1 / R] เริ่มต้น Next.js Dev Server ใหม่
echo  [2] รัน Market Ingestion Pipeline (SET & US -> SQLite DB)
echo  [3] ตรวจสอบสถิติข้อมูลในฐานข้อมูล SQLite (Pipeline Summary)
echo  [4] Export ข้อมูลล่าสุดจาก SQLite เข้า Web App (JSON Snapshot)
echo  [Q] ปิดโปรแกรม
echo.
set /p USER_CHOICE="กรุณาเลือกตัวเลือก (1-4 หรือ Q, ค่าเริ่มต้น: 1): "
if "%USER_CHOICE%"=="" goto :run_server
if /i "%USER_CHOICE%"=="1" goto :run_server
if /i "%USER_CHOICE%"=="R" goto :run_server
if /i "%USER_CHOICE%"=="r" goto :run_server
if /i "%USER_CHOICE%"=="2" (
    echo.
    echo [*] กำลังรัน Market Ingestion Pipeline...
    py -3.11 market_ingestion_pipeline.py
    echo.
    pause
    goto :run_server
)
if /i "%USER_CHOICE%"=="3" (
    echo.
    echo [*] กำลังตรวจสอบสถานะฐานข้อมูล SQLite...
    py -3.11 market_ingestion_pipeline.py --status
    echo.
    pause
    goto :run_server
)
if /i "%USER_CHOICE%"=="4" (
    echo.
    echo [*] กำลัง Export ข้อมูลสู่เว็บแอป...
    py -3.11 market_ingestion_pipeline.py --export
    echo.
    pause
    goto :run_server
)
if /i "%USER_CHOICE%"=="Q" exit /b 0
if /i "%USER_CHOICE%"=="q" exit /b 0

:: Keep CMD prompt open so it never closes automatically
cmd /k
