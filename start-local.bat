@echo off
chcp 65001 >nul
title StockHomeTH - Next.js & yfinance Real Market Platform

echo =====================================================================
echo           StockHomeTH - Real Stock & Financial Intelligence
echo            yfinance Anti-Block Bulk Engine + Custom Stock Chart
echo =====================================================================
echo.

:: 1. Check Python & yfinance & FastAPI
echo [*] ตรวจสอบ Python, yfinance, และ FastAPI...
where py >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('py --version') do set PY_VER=%%i
    echo [✓] ตรวจพบ Python Launcher: %PY_VER%
    py -c "import yfinance, fastapi, uvicorn" 2>nul
    if %errorlevel% neq 0 (
        echo [*] กำลังติดตั้งไลบรารีที่จำเป็น (yfinance, fastapi, uvicorn)...
        py -m pip install yfinance fastapi uvicorn pandas
    )
) else (
    where python >nul 2>nul
    if %errorlevel% equ 0 (
        for /f "tokens=*" %%i in ('python --version') do set PY_VER=%%i
        echo [✓] ตรวจพบ Python: %PY_VER%
        python -c "import yfinance, fastapi, uvicorn" 2>nul
        if %errorlevel% neq 0 (
            echo [*] กำลังติดตั้งไลบรารีที่จำเป็น (yfinance, fastapi, uvicorn)...
            python -m pip install yfinance fastapi uvicorn pandas
        )
    ) else (
        echo [!] คำเตือน: ไม่พบ Python ในระบบ จะใช้โหมด Direct API Fallback
    )
)
echo.

:: 2. Check Node.js installation
echo [*] ตรวจสอบ Node.js ในระบบ...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [X] ไม่พบ Node.js ในเครื่อง กรุณาติดตั้ง Node.js v18 ขึ้นไปจาก https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [✓] ตรวจพบ Node.js เวอร์ชั่น: %NODE_VERSION%
echo.

:: 3. Check and install dependencies if needed
if not exist "node_modules\" (
    echo [*] ไม่พบโฟลเดอร์ node_modules กำลังติดตั้ง Dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [X] ติดตั้ง Dependencies ไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
        pause
        exit /b 1
    )
    echo [✓] ติดตั้ง Dependencies สำเร็จเรียบร้อย!
    echo.
)

:: 4. Check environment file
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

:: 5. Start Next.js Development Server
echo =====================================================================
echo  [🚀] กำลังเริ่มต้น Dev Server บน http://localhost:3000 ...
echo  [📊] Real-time yfinance + TradingView Live Chart พร้อมทำงาน
echo  [💡] กด Ctrl + C ในหน้าต่างนี้เพื่อหยุดการทำงาน
echo =====================================================================
echo.

:: Open browser after 2 seconds in background
start /min cmd /c "timeout /t 3 >nul && start http://localhost:3000"

:: Run Next.js Dev Server with Webpack on Windows
call npm run dev

pause
