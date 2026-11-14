@echo off
rem Runs "npm run migrate:latest" and then "npm run seed:run" against DATABASE_URL in .env.
rem The seed creates the admin account (ADMIN_* in .env) if it does not exist yet.
rem Usage: migrate-all-tenants.bat [--no-pause]

setlocal
cd /d "%~dp0"

call npm run migrate:latest
if errorlevel 1 (
  echo [FAILED] Migrations failed, so seeds were not run.
  set "exitCode=1"
  goto finish
)

call npm run seed:run
if errorlevel 1 (
  echo [FAILED] Seeds failed.
  set "exitCode=1"
  goto finish
)

echo [OK] Database is migrated and seeded.
set "exitCode=0"

:finish
if /i not "%~1"=="--no-pause" pause
exit /b %exitCode%
