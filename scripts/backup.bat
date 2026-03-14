@echo off
REM MongoDB Atlas backup script for Windows
REM Requires: mongodump (MongoDB Database Tools)
REM Download: https://www.mongodb.com/try/download/database-tools

REM Load MONGO_URI from server/.env
for /f "tokens=1,2 delims==" %%a in ('findstr "MONGO_URI" "%~dp0..\server\.env"') do set %%a=%%b

if "%MONGO_URI%"=="" (
    echo Error: MONGO_URI not set. Check server\.env
    exit /b 1
)

set TIMESTAMP=%date:~-4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_PATH=%~dp0..\backups\backup_%TIMESTAMP%

mkdir "%BACKUP_PATH%" 2>nul

echo Starting backup...
echo Output: %BACKUP_PATH%

mongodump --uri="%MONGO_URI%" --out="%BACKUP_PATH%"

if %ERRORLEVEL% equ 0 (
    echo Backup completed: %BACKUP_PATH%
    echo.
    echo To restore, run:
    echo   mongorestore --uri="%%MONGO_URI%%" --drop %BACKUP_PATH%
) else (
    echo Backup failed!
    exit /b 1
)
