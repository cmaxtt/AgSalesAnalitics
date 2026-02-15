@echo off
echo Requesting Administrator privileges to fix SQL Connection...
powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-ExecutionPolicy Bypass -File \"%~dp0Fix_SQL_Connection.ps1\"'"
echo Process launched. Please check for a UAC prompt.
pause
