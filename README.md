# Running the Mesh Viewer App on Windows

This guide provides step-by-step instructions to run the Mesh Viewer app on a Windows machine using the provided `run_app_windows.bat` script.

## Prerequisites

- Windows OS
- Internet connection (for downloading Miniconda and packages if not already installed)

## Steps to Run the App

1. **Open Command Prompt**
   - Press `Win + R`, type `cmd`, and press Enter.

2. **Navigate to the Project Directory**
   - Use the `cd` command to navigate to the directory where the project is located.
   - Example:
     ```
     cd path\to\mesh-viewer
     ```

3. **Run the Batch Script**
   - Execute the batch file by typing:
     ```
     run_app_windows.bat
     ```
   - This script will:
     - Check if Conda is installed and available in your PATH.
     - If Conda is not found, it will prompt to download and install Miniconda silently.
     - After installation, it will initialize Conda in the current session.
     - Check if the Conda environment `open3d-env` exists; if not, it will create it and install required packages.
     - Activate the `open3d-env` environment.
     - Start the Flask app.
     - Open your default browser to the app URL: [http://127.0.0.1:5001](http://127.0.0.1:5001)
     - Pause the terminal window so you can see any messages or errors.

4. **Using the App**
   - Once the browser opens, you can interact with the Mesh Viewer app.
   - The terminal window will remain open until you press any key, allowing you to see logs or errors.

5. **Stopping the App**
   - To stop the Flask app, go to the terminal window and press `Ctrl + C`.
   - Close the terminal window if desired.

## Troubleshooting

- If the batch script reports that Conda is not found even after installation, ensure that Miniconda is installed in the default location (`%USERPROFILE%\Miniconda3`).
- If the terminal window closes immediately on errors, run the batch file from an already open Command Prompt window to see error messages.
- Make sure you have a stable internet connection for downloading Miniconda and Python packages.

## Notes

- The batch script handles environment setup automatically, so you do not need to manually install Python or packages.
- The Conda environment used is named `open3d-env`.
- The Flask app runs on port 5001 by default.

---

This completes the setup and running instructions for the Mesh Viewer app on Windows.
