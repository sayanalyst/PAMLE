@echo off
REM Windows batch script to create and run the app in the Open3D conda environment

REM Check if conda is available
where conda >nul 2>&1
IF ERRORLEVEL 1 (
    echo Conda is not found in PATH.
    echo Press any key to download and install Miniconda...
    pause >nul

    REM Set Miniconda installer URL (latest version for Windows 64-bit)
    set "MINICONDA_URL=https://repo.anaconda.com/miniconda/Miniconda3-latest-Windows-x86_64.exe"
    set "MINICONDA_INSTALLER=%TEMP%\Miniconda3-latest-Windows-x86_64.exe"

    REM Download Miniconda installer using powershell
    echo Downloading Miniconda installer...
    powershell -Command "Invoke-WebRequest -Uri '%MINICONDA_URL%' -OutFile '%MINICONDA_INSTALLER%'"

    REM Run Miniconda installer silently
    echo Installing Miniconda...
    start /wait "" "%MINICONDA_INSTALLER%" /InstallationType=JustMe /AddToPath=1 /RegisterPython=0 /S /D=%USERPROFILE%\Miniconda3

    REM Remove installer
    del "%MINICONDA_INSTALLER%"

    REM Refresh environment variables for current session
    set "PATH=%USERPROFILE%\Miniconda3;%USERPROFILE%\Miniconda3\Scripts;%USERPROFILE%\Miniconda3\Library\bin;%PATH%"

    REM Check if conda is now available
    where conda >nul 2>&1
    IF ERRORLEVEL 1 (
        echo Conda installation failed or conda not found in PATH.
        pause
        exit /b 1
    ) ELSE (
        echo Conda installed successfully.
    )
)

REM Check if the conda environment "open3d-env" exists
conda info --envs | findstr /R /C:"^open3d-env" >nul
IF ERRORLEVEL 1 (
    echo Creating conda environment "open3d-env"...
    conda create -y -n open3d-env python=3.9
    IF ERRORLEVEL 1 (
        echo Failed to create conda environment.
        pause
        exit /b 1
    )
    echo Installing required packages...
    call conda activate open3d-env
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
    echo Conda environment "open3d-env" already exists.
    call conda activate open3d-env
)

REM Navigate to the project directory
cd /d %~dp0

REM Run the Flask app
echo Starting Flask app...
python app.py

REM Open the default browser to the Flask server URL
start http://127.0.0.1:5001

pause
