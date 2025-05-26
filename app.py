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

from flask import Flask, request, jsonify, make_response, send_from_directory, send_file
import os
import time
import json
import logging
import trimesh
import numpy as np
from shapely.geometry import Polygon, Point
from flask_cors import CORS
from flask_compress import Compress

app = Flask(__name__)
Compress(app)
CORS(app, origins="*")

def no_cache(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route('/static/<path:filename>')
def custom_static(filename):
    response = make_response(send_from_directory(os.path.join(app.root_path, 'static'), filename))
    return no_cache(response)

@app.route('/templates/<path:filename>')
def serve_templates(filename):
    response = make_response(send_from_directory(os.path.join(app.root_path, 'templates'), filename))
    return no_cache(response)

@app.route('/')
def index():
    response = make_response(send_from_directory(os.path.join(app.root_path, 'templates'), 'index.html'))
    return no_cache(response)

@app.route('/save_label', methods=['POST'])
def save_label():
    label_data = request.get_json()
    print('Received labels to save:', label_data)  # Log to terminal
    if not label_data or not isinstance(label_data, list):
        return jsonify({'error': 'No label data provided or invalid format'}), 400
    label_file_path = os.path.join(app.root_path, 'static', 'data', 'label.json')
    try:
        # Overwrite label.json with incoming labels directly to allow deletions
        with open(label_file_path, 'w', encoding='utf-8') as f:
            json.dump(label_data, f, ensure_ascii=False, indent=2)

        print('Labels saved to static/data/label.json')  # Log to terminal
        # Log faces arrays info
        for label in label_data:
            label_name = label.get('label', 'Unnamed')
            faces_count = len(label.get('faces', [])) if isinstance(label.get('faces'), list) else 0
            print(f"Label '{label_name}' has {faces_count} faces assigned.")
        return jsonify({'message': 'Label data saved successfully'}), 200
    except Exception as e:
        print('Error saving labels:', e)  # Log to terminal
        return jsonify({'error': str(e)}), 500

@app.route('/save_label/<meshname>', methods=['POST'])
def save_label_for_mesh(meshname):
    label_data = request.get_json()
    app.logger.info(f'Received labels to save for mesh {meshname}: {label_data}')
    if not label_data:
        return jsonify({'error': 'No label data provided'}), 400

    safe_meshname = ''.join(c for c in meshname if c.isalnum() or c in ('_', '-'))
    label_dir = os.path.join(app.root_path, 'static', 'data')
    os.makedirs(label_dir, exist_ok=True)
    label_file_path = os.path.join(label_dir, f'{safe_meshname}.json')

    try:
        # Check if label_data is a list (old format) or dict (new format)
        if isinstance(label_data, list):
            # Old format: list of labels
            with open(label_file_path, 'w', encoding='utf-8') as f:
                json.dump(label_data, f, ensure_ascii=False, indent=2)

            app.logger.info(f'Labels saved to {label_file_path}')
            for label in label_data:
                label_name = label.get('label', 'Unnamed')
                faces_count = len(label.get('faces', [])) if isinstance(label.get('faces'), list) else 0
                app.logger.info(f"Label '{label_name}' has {faces_count} faces assigned.")
        elif isinstance(label_data, dict):
            # New format: dict with keys "labels" and "markedFeatures"
            with open(label_file_path, 'w', encoding='utf-8') as f:
                json.dump(label_data, f, ensure_ascii=False, indent=2)
            app.logger.info(f'Combined labels and marked features saved to {label_file_path}')
        else:
            return jsonify({'error': 'Invalid label data format'}), 400

        return jsonify({'message': f'Label data saved successfully for mesh {meshname}'}), 200
    except Exception as e:
        app.logger.error(f'Error saving labels for mesh {meshname}: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/load_label/<meshname>', methods=['GET'])
def load_label_for_mesh(meshname):
    safe_meshname = ''.join(c for c in meshname if c.isalnum() or c in ('_', '-'))
    label_file_path = os.path.join(app.root_path, 'static', 'data', f'{safe_meshname}.json')
    default_label_file_path = os.path.join(app.root_path, 'static', 'data', 'label.json')

    print(f"Requested meshname: {meshname}")
    print(f"Sanitized meshname: {safe_meshname}")
    print(f"Label file path: {label_file_path}")
    print(f"Default label file path: {default_label_file_path}")
    print(f"Label file exists: {os.path.exists(label_file_path)}")
    print(f"Default label file exists: {os.path.exists(default_label_file_path)}")

    if os.path.exists(label_file_path):
        try:
            return send_file(label_file_path, mimetype='application/json')
        except Exception as e:
            print(f'Error sending label file {label_file_path}:', e)
            return jsonify({'error': str(e)}), 500
    elif os.path.exists(default_label_file_path):
        try:
            return send_file(default_label_file_path, mimetype='application/json')
        except Exception as e:
            print(f'Error sending default label file {default_label_file_path}:', e)
            return jsonify({'error': str(e)}), 500
    else:
        return jsonify({'error': 'No label file found'}), 404

@app.route('/load_annotations', methods=['GET'])
def load_annotations():
    annotation_file_path = os.path.join(app.root_path, 'static', 'data', 'annotations.json')
    if not os.path.exists(annotation_file_path):
        return jsonify({}), 200
    try:
        with open(annotation_file_path, 'r') as f:
            data = json.load(f)
        return jsonify(data), 200
    except Exception as e:
        print('Error loading annotations:', e)
        return jsonify({'error': str(e)}), 500

@app.route('/save_annotations', methods=['POST'])
def save_annotations():
    annotation_data = request.get_json()
    print('Received annotations to save:', annotation_data)
    if not annotation_data:
        return jsonify({'error': 'No annotation data provided'}), 400
    annotation_file_path = os.path.join(app.root_path, 'static', 'data', 'annotations.json')
    try:
        with open(annotation_file_path, 'w') as f:
            json.dump(annotation_data, f, indent=2)
        print('Annotations saved to static/data/annotations.json')
        return jsonify({'message': 'Annotation data saved successfully'}), 200
    except Exception as e:
        print('Error saving annotations:', e)
        return jsonify({'error': str(e)}), 500

@app.route('/upload_annotation_image', methods=['POST'])
def upload_annotation_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file part in the request'}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    allowed_extensions = {'jpeg', 'jpg', 'bmp', 'png', 'tif', 'tiff'}
    def allowed_file(filename):
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

    if not allowed_file(file.filename):
        return jsonify({'error': 'Unsupported file extension'}), 400

    upload_folder = os.path.join(app.root_path, 'static', 'uploads', 'annotations')
    os.makedirs(upload_folder, exist_ok=True)

    filename = file.filename
    # To avoid filename conflicts, prepend timestamp
    timestamp = int(time.time())
    filename = f"{timestamp}_{filename}"
    file_path = os.path.join(upload_folder, filename)
    try:
        file.save(file_path)
        file_url = f"/static/uploads/annotations/{filename}"
        print(f"Image uploaded and saved to {file_path}")
        return jsonify({'message': 'Image uploaded successfully', 'url': file_url}), 200
    except Exception as e:
        print('Error saving uploaded image:', e)
        return jsonify({'error': str(e)}), 500

# Removed polygon face selection endpoint as polygon processing will be done in frontend

# @app.route('/select_faces_stream', methods=['POST'])
# def select_faces_stream():
#     data = request.get_json()
#     if not data or 'polygon' not in data:
#         return jsonify({'error': 'No polygon data provided'}), 400

#     polygon_points = data['polygon']  
#     mesh_path = os.path.join(app.root_path, 'static', 'data', 'mesh_12.gltf')
#     if not os.path.exists(mesh_path):
#         return jsonify({'error': 'Mesh file not found on server'}), 404

#     mesh = trimesh.load(mesh_path, force='scene')
#     if hasattr(mesh, 'geometry') and isinstance(mesh.geometry, dict):
#         combined = trimesh.util.concatenate(tuple(mesh.geometry.values()))
#         mesh = combined

#     polygon = Polygon(polygon_points)
#     selected_faces = []
#     total_faces = len(mesh.faces)

#     for i, face in enumerate(mesh.faces):
#         if polygon.contains(Point(mesh.vertices[face].mean(axis=0)[:2])):
#             selected_faces.append(i)

#     return jsonify({'selected_faces': selected_faces})

import os
from flask import request, jsonify

@app.route('/delete_annotation_image', methods=['POST'])
def delete_annotation_image():
    data = request.get_json()
    if not data or 'filename' not in data:
        return jsonify({'error': 'No filename provided'}), 400

    filename = data['filename']
    upload_folder = os.path.join(app.root_path, 'static', 'uploads', 'annotations')
    file_path = os.path.join(upload_folder, filename)

    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404

    try:
        os.remove(file_path)
        return jsonify({'message': f'File {filename} deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/save_updated_mesh', methods=['POST'])
def save_updated_mesh():
    try:
        data = request.get_json()
        if not data or 'gltfContent' not in data or 'filename' not in data:
            return jsonify({'error': 'Invalid data'}), 400

        gltf_content = data['gltfContent']
        filename = data['filename']

        # Ensure the save directory exists
        save_dir = os.path.join(app.root_path, 'static', 'data', 'saved_meshes')
        os.makedirs(save_dir, exist_ok=True)

        file_path = os.path.join(save_dir, filename)

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(gltf_content)

        return jsonify({'message': f'Mesh saved successfully as {filename}'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

import threading
from flask import request

def shutdown_server():
    func = request.environ.get('werkzeug.server.shutdown')
    if func is None:
        raise RuntimeError('Not running with the Werkzeug Server')
    func()

@app.route('/shutdown', methods=['POST'])
def shutdown():
    shutdown_server()
    return 'Server shutting down...', 200

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    app.run(host='127.0.0.1', port=5001, debug=True)
