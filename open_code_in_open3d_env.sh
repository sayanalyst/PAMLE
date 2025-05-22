#!/bin/bash
# This script activates the conda environment "open3d-env", runs the Flask app in the background, and opens the server webpage

# Set PATH to include conda and VSCode binaries
export PATH="/opt/homebrew/Caskroom/miniconda/base/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

# Source conda.sh to enable conda commands
source "/opt/homebrew/Caskroom/miniconda/base/etc/profile.d/conda.sh"

# Activate the conda environment
conda activate open3d-env

# Navigate to project directory
cd /Users/sayandas/mesh-viewer

# Log current working directory and python interpreter path for debugging
echo "Current directory: $(pwd)" > flask_server.log
echo "Using python interpreter: $(conda run -n open3d-env which python)" >> flask_server.log
echo "Environment variables:" >> flask_server.log
env >> flask_server.log

# Run Flask app in background, redirect output to a log file
# Use python interpreter from conda environment explicitly to avoid environment activation issues
CONDA_PYTHON=$(conda run -n open3d-env which python)
nohup $CONDA_PYTHON app.py >> flask_server.log 2>&1 &

FLASK_PID=$!

# Open the default browser to the Flask server URL
open "http://127.0.0.1:5001"

# Wait for the Flask process to exit naturally (e.g., after shutdown request)
wait $FLASK_PID

# After process exits, log and exit script
echo "Flask process $FLASK_PID has exited." >> flask_server.log
