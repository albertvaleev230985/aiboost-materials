@echo off
rem neovida-transcribe: video and audio to Russian text, locally (GigaAM v3). NEOVIDA, AI Tseh.
rem Lives in %USERPROFILE%\.local\bin. Runs the script with its own Python from
rem %USERPROFILE%\.neovida-transcribe\venv, so it works offline and inside the agent sandbox.
setlocal
set "NT_DIR=%USERPROFILE%\.neovida-transcribe"
if not exist "%NT_DIR%\venv\Scripts\python.exe" (
  echo Error: neovida-transcribe is not fully installed. Setup: https://materials.neovida.ai/ai-tseh/potok-4/transcribe/SETUP.md 1>&2
  exit /b 1
)
"%NT_DIR%\venv\Scripts\python.exe" "%NT_DIR%\neovida_transcribe.py" %*
exit /b %ERRORLEVEL%
