@echo off
REM Script to auto-start PostgreSQL Portable if not running

REM Path to PostgreSQL Portable Root
set PG_HOME=E:\Portsql

REM Check Status using pg_ctl (Returns 0 if running, non-zero if stopped)
"%PG_HOME%\bin\pg_ctl.exe" -D "%PG_HOME%\data" status >NUL 2>&1
if "%ERRORLEVEL%"=="0" (
    echo PostgreSQL is already running.
    exit /b 0
)

echo PostgreSQL is NOT running. Starting now...
start "" /B "%PG_HOME%\bin\pg_ctl.exe" -D "%PG_HOME%\data" -l "%PG_HOME%\data\server.log" start

REM Wait a bit for DB to warm up
timeout /t 3 /nobreak > NUL
echo PostgreSQL started.
exit /b 0
