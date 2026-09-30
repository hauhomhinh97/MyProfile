@echo off
cd /d "%~dp0"
echo Starting MyProfile at http://127.0.0.1:5173
start "" "http://127.0.0.1:5173"
python serve.py
pause
