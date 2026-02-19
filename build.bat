@echo off

REM Build frontend
cd frontend
call npm run build
cd ..

REM Build backend
cd backend
call npm run build
cd ..

echo Build completed successfully!
