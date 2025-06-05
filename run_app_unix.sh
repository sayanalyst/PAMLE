#!/bin/bash

set -e

# === CONFIGURATION ===
ENVNAME="open3d-env"
MINICONDA_URL="https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh"
MINICONDA_INSTALLER="/tmp/Miniconda3-latest-Linux-x86_64.sh"
# For macOS, you might want to use:
# MINICONDA_URL="https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-x86_64.sh"
# MINICONDA_INSTALLER="/tmp/Miniconda3-latest-MacOSX-x86_64.sh"
# =====================

# Function to check if conda command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Try to find conda in PATH or common locations
CONDAFOUND=0
if command_exists conda; then
    CONDAFOUND=1
else
    # Check common install locations
    COMMON_CONDA_PATHS=(
        "$HOME/miniconda3/bin/conda"
        "$HOME/anaconda3/bin/conda"
        "/opt/miniconda3/bin/conda"
        "/opt/anaconda3/bin/conda"
        "/usr/local/miniconda3/bin/conda"
        "/usr/local/anaconda3/bin/conda"
    )
    for path in "${COMMON_CONDA_PATHS[@]}"; do
        if [ -x "$path" ]; then
            CONDAFOUND=2
            CONDAEXE="$path"
            break
        fi
    done
fi

# If conda not found, prompt to install Miniconda
if [ $CONDAFOUND -eq 0 ]; then
    while true; do
        read -p "Conda was not found. Would you like to download and install Miniconda (y/n)? " yn
        case $yn in
            [Yy]* )
                echo "Downloading Miniconda installer..."
                curl -L "$MINICONDA_URL" -o "$MINICONDA_INSTALLER"
                echo "Installing Miniconda silently..."
                bash "$MINICONDA_INSTALLER" -b -p "$HOME/miniconda3"
                rm -f "$MINICONDA_INSTALLER"
                export PATH="$HOME/miniconda3/bin:$PATH"
                CONDAFOUND=3
                break
                ;;
            [Nn]* )
                echo "Conda is required. Exiting."
                exit 1
                ;;
            * ) echo "Please answer y or n.";;
        esac
    done
fi

# If conda found in common location, add to PATH
if [ $CONDAFOUND -eq 2 ]; then
    export PATH="$(dirname "$CONDAEXE"):$PATH"
fi

# Initialize conda for this shell session
if command_exists conda; then
    # shellcheck disable=SC1091
    source "$(conda info --base)/etc/profile.d/conda.sh"
else
    echo "Conda command not found after installation. Exiting."
    exit 1
fi

echo "Checking for environment \"$ENVNAME\"..."
if ! conda env list | grep -q "^$ENVNAME\s"; then
    echo "Creating conda environment \"$ENVNAME\"..."
    conda create -y -n "$ENVNAME" python=3.9
fi

echo "Installing dependencies..."
if ! conda install -y -n "$ENVNAME" open3d flask flask-cors flask-compress numpy shapely -c conda-forge; then
    echo "Failed to install dependencies with conda. Trying pip..."
    conda run -n "$ENVNAME" pip install flask flask-cors flask-compress numpy shapely trimesh open3d
fi

# Ensure trimesh is installed via pip
conda run -n "$ENVNAME" pip install trimesh

# Change to script directory
cd "$(dirname "$0")"

echo "Starting Flask app..."
conda run -n "$ENVNAME" python app.py &

# Wait a few seconds for the server to start
sleep 5

# Open browser to Flask app URL
if command_exists xdg-open; then
    xdg-open "http://127.0.0.1:5001"
elif command_exists open; then
    open "http://127.0.0.1:5001"
else
    echo "Please open your browser and navigate to http://127.0.0.1:5001"
fi

# Wait for user input before exiting
read -p "Press enter to exit..."
