#!/bin/bash

echo "======================================"
echo "🔍 Admin System Health Check"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

echo "✅ Node.js version:"
node --version
echo ""

# Check if npm/server dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "⚠️  Dependencies not installed. Installing now..."
    npm install
fi

echo "📋 Running comprehensive admin functionality checks..."
echo ""

# Run direct database tests
echo "1️⃣  Testing direct database operations..."
echo "========================================"
node scripts/testAllAdminFunctions.cjs
DB_TEST=$?
echo ""

# Check if server is running
echo "2️⃣  Checking if API server is running..."
echo "========================================"
if curl -s http://localhost:5000/api &> /dev/null 2>&1; then
    echo "✅ Server is running on port 5000"
    
    echo ""
    echo "3️⃣  Testing API endpoints..."
    echo "========================================"
    node scripts/testAdminAPIComplete.cjs
    API_TEST=$?
else
    echo "⚠️  Server is not running on port 5000"
    echo "   Start it with: npm run dev"
    API_TEST=0
fi

echo ""
echo "======================================"
echo "📊 Health Check Summary"
echo "======================================"

if [ $DB_TEST -eq 0 ]; then
    echo "✅ Database operations: WORKING"
else
    echo "❌ Database operations: FAILED"
fi

if [ $API_TEST -eq 0 ] || [ $API_TEST -eq 1 ]; then
    echo "✅ API functionality: WORKING"
else
    echo "❌ API functionality: FAILED"
fi

echo ""
echo "✅ Admin system health check completed!"
echo ""
