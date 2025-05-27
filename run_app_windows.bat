@echo off
setlocal enabledelayedexpansion

REM === CONFIGURATION ===
set "ENVNAME=open3d-env"
set "MINICONDA_URL=https://repo.anaconda.com/miniconda/Miniconda3-latest-Windows-x86_64.exe"
set "MINICONDA_INSTALLER=%TEMP%\Miniconda3-latest-Windows-x86_64.exe"
REM =====================

REM Try to find conda in PATH
where conda >nul 2>&1
if not errorlevel 1 (
    set "CONDAFOUND=1"
)

REM If not found, search common install paths
if not defined CONDAFOUND (
    for %%A in (
        "%UserProfile%\Miniconda3\Scripts\conda.exe"
        "%UserProfile%\Anaconda3\Scripts\conda.exe"
        "C:\ProgramData\Miniconda3\Scripts\conda.exe"
        "C:\ProgramData\Anaconda3\Scripts\conda.exe"
        "C:\tools\Anaconda3\Scripts\conda.exe"
    ) do (
        if exist %%~A (
            set "CONDAPATH=%%~dpA"
            set "CONDAFOUND=2"
            set "CONDAEXE=%%~A"
            goto :found_conda
        )
    )
)

:found_conda

REM If still not found, prompt to install Miniconda (input loop for y/n)
if not defined CONDAFOUND (
    :ask_install
    set "INSTALL_CONDA="
    set /p "INSTALL_CONDA=Conda was not found. Would you like to download and install Miniconda (y/n)? "
    if /i "!INSTALL_CONDA!"=="y" (
        echo Downloading Miniconda installer...
        powershell -Command "Invoke-WebRequest '%MINICONDA_URL%' -OutFile '%MINICONDA_INSTALLER%'"
        echo Installing Miniconda silently...
        start /wait "" "%MINICONDA_INSTALLER%" /InstallationType=JustMe /AddToPath=1 /RegisterPython=0 /S /D=%UserProfile%\Miniconda3
        del "%MINICONDA_INSTALLER%"
        set "CONDAPATH=%UserProfile%\Miniconda3\Scripts\"
        set "CONDAEXE=%UserProfile%\Miniconda3\Scripts\conda.exe"
        set "CONDAFOUND=3"
        REM Add to PATH for current session
        set "PATH=%UserProfile%\Miniconda3\Scripts;%UserProfile%\Miniconda3;%PATH%"
    ) else if /i "!INSTALL_CONDA!"=="n" (
        echo Conda is required. Exiting.
        pause
        exit /b 1
    ) else (
        echo Please enter y or n.
        goto ask_install
    )
)

REM If conda was found in a common location, add it to PATH for this session
if "%CONDAFOUND%"=="2" (
    set "PATH=%CONDAPATH%;%PATH%"
)

REM Use conda run to execute in the environment, creating it if needed
echo Checking for environment "%ENVNAME%"...
conda env list | findstr /I /C:"%ENVNAME%" >nul 2>&1
if errorlevel 1 (
    echo Creating conda environment "%ENVNAME%"...
    conda create -y -n %ENVNAME% python=3.9
    if errorlevel 1 (
        echo Failed to create environment.
        pause
        exit /b 1
    )
    echo Installing dependencies...
    conda install -y -n %ENVNAME% open3d flask flask-cors flask-compress numpy shapely -c conda-forge
    if errorlevel 1 (
        echo Failed to install dependencies with conda. Trying pip...
        conda run -n %ENVNAME% pip install open3d flask flask-cors flask-compress numpy shapely trimesh
        if errorlevel 1 (
            echo Failed to install dependencies with pip.
            pause
            exit /b 1
        )
    ) else (
        conda run -n %ENVNAME% pip install trimesh
    )
)

REM Change to script directory (outside any parenthesis for safety)
cd /d "%~dp0"

REM Start the Flask app (ensure app.py uses port 5001)
echo Starting Flask app...
start "" conda run -n %ENVNAME% python app.py
if errorlevel 1 (
    echo Failed to start Flask app.
    pause
    exit /b 1
)

REM Open browser
timeout /t 5 /nobreak >nul
start http://127.0.0.1:5001

pause
endlocal
