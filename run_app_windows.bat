@echo off
REM Windows batch script to create and run the app in the Open3D conda environment
setlocal enabledelayedexpansion

REM === Configuration ===
set "ENVNAME=open3d-env"
set "MINICONDA_URL=https://repo.anaconda.com/miniconda/Miniconda3-latest-Windows-x86_64.exe"
set "MINICONDA_INSTALLER=%TEMP%\Miniconda3-latest-Windows-x86_64.exe"
REM =====================

REM Check if conda is available
where conda >nul 2>&1
IF ERRORLEVEL 1 (
    echo Conda is not found in PATH.
    echo Press any key to download and install Miniconda...
    pause >nul

    REM Download Miniconda installer using powershell with wget and silent install
    echo Downloading and installing Miniconda silently...
    powershell -Command "wget '%MINICONDA_URL%' -outfile '.\\miniconda.exe'; Start-Process -FilePath '.\\miniconda.exe' -Wait; del .\\miniconda.exe"
)

REM Try to find conda in PATH again
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

REM Refresh environment variables for current session by calling activate.bat
call "%USERPROFILE%\Miniconda3\Scripts\activate.bat"

:found_conda
REM Check if conda is now available
where conda >nul 2>&1
IF ERRORLEVEL 1 (
    echo Conda installation failed or conda not found in PATH.
    pause
    exit /b 1
) ELSE (
    echo Conda installed successfully.
)

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

REM Check if the conda environment exists
conda info --envs | findstr /R /C:"^%ENVNAME%" >nul
IF ERRORLEVEL 1 (
    echo Creating conda environment "%ENVNAME%"...
    conda create -y -n %ENVNAME% python=3.9
    IF ERRORLEVEL 1 (
        echo Failed to create conda environment.
        pause
        exit /b 1
    )
    echo Installing required packages...
    call conda activate %ENVNAME%
    conda install -y flask flask-cors flask-compress numpy shapely -c conda-forge
    IF ERRORLEVEL 1 (
        echo Failed to install packages via conda. Trying pip...
        pip install flask flask-cors flask-compress numpy shapely trimesh
        IF ERRORLEVEL 1 (
            echo Failed to install packages via pip.
            pause
            exit /b 1
        )
    ) ELSE (
        pip install trimesh
    )
) ELSE (
    echo Conda environment "%ENVNAME%" already exists.
    call conda activate %ENVNAME%
)

REM Navigate to the project directory
cd /d "%~dp0"

REM Run the Flask app
echo Starting Flask app...
call conda activate %ENVNAME%
python app.py
IF ERRORLEVEL 1 (
    echo Failed to start Flask app.
    pause
    exit /b 1
)

REM Open the default browser to the Flask server URL
start http://127.0.0.1:5001

pause
endlocal
