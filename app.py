# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_compress import Compress
from werkzeug.utils import secure_filename
import open3d as o3d

# ---------------------------
# Configuration
# ---------------------------

ALLOWED_EXTENSIONS = {'obj', 'ply', 'stl', 'off', 'gltf'}
UPLOAD_FOLDER = 'static/uploads/meshes'
CONVERTED_FOLDER = 'static/data'

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CONVERTED_FOLDER, exist_ok=True)

# ---------------------------
# Flask App Initialization
# ---------------------------

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
CORS(app)
Compress(app)

# ---------------------------
# Helpers
# ---------------------------

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ---------------------------
# Routes
# ---------------------------

@app.route('/')
def index():
    return jsonify({'message': '3D Mesh Conversion API is running.'})

@app.route('/upload_mesh_and_convert', methods=['POST'])
def upload_mesh_and_convert():
    if 'meshfile' not in request.files:
        return jsonify({'error': 'No mesh file part in the request'}), 400
    file = request.files['meshfile']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if not allowed_file(file.filename):
        return jsonify({'error': 'Unsupported file extension'}), 400

    original_filename = secure_filename(file.filename)
    saved_filepath = os.path.join(app.config['UPLOAD_FOLDER'], original_filename)

    try:
        file.save(saved_filepath)
    except Exception as e:
        return jsonify({'error': f'Failed to save uploaded file: {str(e)}'}), 500

    # If already GLTF, no conversion needed
    if saved_filepath.lower().endswith('.gltf'):
        converted_url = f"/{saved_filepath.replace(os.sep, '/')}"
        return jsonify({'message': 'No conversion needed for .gltf file', 'converted_url': converted_url}), 200

    # Prepare output GLTF filename
    base_name, _ = os.path.splitext(original_filename)
    output_filename = f"{base_name}_converted.gltf"
    output_filepath = os.path.join(CONVERTED_FOLDER, output_filename)

    try:
        # Load mesh using Open3D
        mesh = o3d.io.read_triangle_mesh(saved_filepath)

        # If mesh has no faces, try point cloud reconstruction
        if len(mesh.triangles) == 0:
            pcd = o3d.io.read_point_cloud(saved_filepath)
            mesh = o3d.geometry.TriangleMesh.create_from_point_cloud_ball_pivoting(
                pcd,
                o3d.utility.DoubleVector([0.005, 0.01, 0.02])
            )

        # Simplify mesh
        if len(mesh.triangles) > 0:
            mesh = mesh.simplify_quadric_decimation(target_number_of_triangles=int(len(mesh.triangles)*0.5))

        # Recompute normals
        mesh.compute_vertex_normals()

        # Save as GLTF
        o3d.io.write_triangle_mesh(output_filepath, mesh)

        converted_url = f"/{output_filepath.replace(os.sep, '/')}"
        return jsonify({'message': 'Conversion successful', 'converted_url': converted_url}), 200

    except Exception as e:
        return jsonify({'error': f'Conversion failed: {str(e)}'}), 500

# ---------------------------
# Serve Static Files
# ---------------------------

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

# ---------------------------
# Run Server
# ---------------------------

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
