@echo off
REM Admin System Health Check Script for Windows

echo.
echo ======================================
echo. 🔍 Admin System Health Check
echo ======================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed
    exit /b 1
)

echo ✅ Node.js version:
node --version
echo.

REM Check if npm/server dependencies are installed
if not exist "node_modules" (
    echo ⚠️  Dependencies not installed. Installing now...
    call npm install
)

echo 📋 Running comprehensive admin functionality checks...
echo.

REM Run direct database tests
echo 1️⃣  Testing direct database operations...
echo ======================================
node scripts/testAllAdminFunctions.cjs
set DB_TEST=%errorlevel%
echo.

REM Check if server is running
echo 2️⃣  Checking if API server is running...
echo ======================================
timeout /t 1 /nobreak >nul
curl -s http://localhost:5000/api >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Server is running on port 5000
    
    echo.
    echo 3️⃣  Testing API endpoints...
    echo ======================================
    node scripts/testAdminAPIComplete.cjs
    set API_TEST=%errorlevel%
) else (
    echo ⚠️  Server is not running on port 5000
    echo    Start it with: npm run dev
    set API_TEST=0
)

echo.
echo ======================================
echo 📊 Health Check Summary
echo ======================================

if %DB_TEST% equ 0 (
    echo ✅ Database operations: WORKING
) else (
    echo ❌ Database operations: FAILED
)

if %API_TEST% equ 0 (
    echo ✅ API functionality: WORKING
) else (
    echo ❌ API functionality: FAILED
)

echo.
echo ✅ Admin system health check completed!
echo.

pause
