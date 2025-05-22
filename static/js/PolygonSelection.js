import * as THREE from 'three';

export class PolygonSelection {
    constructor(viewer) {
        this.viewer = viewer;

        this.selectionPolygon = [];
        this.selectedFaces = new Set();

        this.polygonLine = null; // Three.js Line object for polygon visual
        this.polygonFillMesh = null; // Three.js Mesh for filled polygon highlight

        this.raycastCache = new Map();

        // Create 2D overlay canvas for polygon drawing
        this.overlayCanvas = document.createElement('canvas');
        this.overlayCanvas.style.position = 'absolute';
        this.overlayCanvas.style.top = '0';
        this.overlayCanvas.style.left = '0';
        this.overlayCanvas.style.pointerEvents = 'none'; // Allow clicks to pass through
        this.overlayCanvas.width = this.viewer.container.clientWidth;
        this.overlayCanvas.height = this.viewer.container.clientHeight;
        this.viewer.container.appendChild(this.overlayCanvas);
        this.overlayCtx = this.overlayCanvas.getContext('2d');

        // Bind event listeners for polygon selection
        this.viewer.renderer.domElement.addEventListener('click', (event) => {
            if (!this.viewer.labelingMode) return;
            this.addPolygonPoint(event);
        });

        this.viewer.renderer.domElement.addEventListener('contextmenu', (event) => {
            if (!this.viewer.labelingMode) return;
            event.preventDefault();
            this.sendPolygonToBackendForSelection();
        });
    }

    addPolygonPoint(event) {
        const rect = this.viewer.renderer.domElement.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Check if point is inside mesh screen bounding box
        if (!this.viewer.meshScreenBoundingBox) {
            this.viewer.computeMeshScreenBoundingBox();
        }
        if (!this.isPointInsideBoundingBox(x, y, this.viewer.meshScreenBoundingBox)) {
            // Ignore points outside mesh area
            return;
        }

        // Add original point
        this.selectionPolygon.push(new THREE.Vector2(x, y));

        // Cache raycast intersection point for this polygon point
        const key = `${x.toFixed(5)},${y.toFixed(5)}`;
        if (!this.raycastCache.has(key)) {
            const raycaster = new THREE.Raycaster();
            const ndc = new THREE.Vector3(x, y, 0);
            raycaster.setFromCamera(new THREE.Vector2(ndc.x, ndc.y), this.viewer.camera);
            const intersects = raycaster.intersectObject(this.viewer.mesh, true);
            if (intersects.length > 0) {
                this.raycastCache.set(key, intersects[0].point.clone());
            } else {
                this.raycastCache.set(key, null);
            }
        }

        // Add intermediate points between last two points for smoother polygon
        if (this.selectionPolygon.length > 1) {
            const lastIndex = this.selectionPolygon.length - 1;
            const p1 = this.selectionPolygon[lastIndex - 1];
            const p2 = this.selectionPolygon[lastIndex];
            const intermediatePoints = this.interpolatePoints(p1, p2, 5);
            // Insert intermediate points before the last point
            this.selectionPolygon.splice(lastIndex, 0, ...intermediatePoints);
        }

        this.highlightSelectionPolygon();
    }

    sendPolygonToBackendForSelection() {
        if (this.selectionPolygon.length < 3) {
            alert('Select at least 3 points to form a polygon.');
            this.selectionPolygon = [];
            if (this.polygonLine) {
                this.viewer.scene.remove(this.polygonLine);
                this.polygonLine.geometry.dispose();
                this.polygonLine.material.dispose();
                this.polygonLine = null;
            }
            return;
        }

        // Convert selectionPolygon points to plain array of [x, y]
        const polygonPoints = this.selectionPolygon.map(p => [p.x, p.y]);

        fetch('http://localhost:5001/select_faces', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ polygon: polygonPoints })
        })
        .then(response => response.json())
        .then(data => {
            if (data.selected_faces) {
                this.selectedFaces = new Set(data.selected_faces);
                this.highlightSelectedFaces();
                this.selectionPolygon = [];
                if (this.polygonLine) {
                    this.viewer.scene.remove(this.polygonLine);
                    this.polygonLine.geometry.dispose();
                    this.polygonLine.material.dispose();
                    this.polygonLine = null;
                }
            } else if (data.error) {
                alert('Error selecting faces: ' + data.error);
            }
        })
        .catch(error => {
            alert('Error selecting faces: ' + error);
        });
    }

    highlightSelectedFaces() {
        this.viewer.mesh.traverse((child) => {
            if (child.isMesh) {
                const geometry = child.geometry;
                if (!geometry.index) return;

                const position = geometry.attributes.position;
                const index = geometry.index;

                // Preserve existing colors if present, else default to white
                let colors;
                if (geometry.hasAttribute('color')) {
                    colors = geometry.attributes.color.array.slice();
                } else {
                    colors = new Float32Array(position.count * 3);
                    for (let i = 0; i < position.count; i++) {
                        colors[i * 3] = 1.0; // default white
                        colors[i * 3 + 1] = 1.0;
                        colors[i * 3 + 2] = 1.0;
                    }
                }

                for (const faceIndex of this.selectedFaces) {
                    const a = index.getX(faceIndex * 3);
                    const b = index.getX(faceIndex * 3 + 1);
                    const c = index.getX(faceIndex * 3 + 2);

                    colors[a * 3] = 1.0;
                    colors[a * 3 + 1] = 0.0;
                    colors[a * 3 + 2] = 0.0;

                    colors[b * 3] = 1.0;
                    colors[b * 3 + 1] = 0.0;
                    colors[b * 3 + 2] = 0.0;

                    colors[c * 3] = 1.0;
                    colors[c * 3 + 1] = 0.0;
                    colors[c * 3 + 2] = 0.0;
                }

                geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
                geometry.attributes.color.needsUpdate = true;

                if (child.material) {
                    // Reuse original material to preserve appearance
                    if (this.viewer.originalMaterials.has(child)) {
                        child.material.dispose();
                        child.material = this.viewer.originalMaterials.get(child);
                        child.material.vertexColors = true;
                        child.material.transparent = true;
                        child.material.opacity = 0.5;
                        child.material.needsUpdate = true;
                    }
                }
            }
        });
    }

    clearSelectionHighlight() {
        this.viewer.mesh.traverse((child) => {
            if (child.isMesh) {
                const geometry = child.geometry;
                if (!geometry.attributes.position) return;

                if (geometry.hasAttribute('color')) {
                    geometry.deleteAttribute('color');
                }
                if (geometry.attributes.color) {
                    geometry.attributes.color.needsUpdate = true;
                }
                if (child.material) {
                    child.material.vertexColors = false;
                    child.material.transparent = false;
                    child.material.opacity = 1.0;
                    child.material.needsUpdate = true;
                }
            }
        });
    }

    highlightSelectionPolygon() {
        if (this.selectionPolygon.length < 2) return;

        // Create polygon line (outline) as 2D overlay for performance
        if (!this.selectionLineCanvas) {
            this.selectionLineCanvas = document.createElement('canvas');
            this.selectionLineCanvas.style.position = 'absolute';
            this.selectionLineCanvas.style.top = '0';
            this.selectionLineCanvas.style.left = '0';
            this.selectionLineCanvas.style.pointerEvents = 'none';
            this.selectionLineCanvas.width = this.viewer.container.clientWidth;
            this.selectionLineCanvas.height = this.viewer.container.clientHeight;
            this.viewer.container.appendChild(this.selectionLineCanvas);
            this.selectionLineCtx = this.selectionLineCanvas.getContext('2d');
        }
        const ctx = this.selectionLineCtx;
        ctx.clearRect(0, 0, this.selectionLineCanvas.width, this.selectionLineCanvas.height);

        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const rect = this.selectionLineCanvas.getBoundingClientRect();

        for (let i = 0; i < this.selectionPolygon.length; i++) {
            const p = this.selectionPolygon[i];
            const x = ((p.x + 1) / 2) * rect.width;
            const y = ((1 - p.y) / 2) * rect.height;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        if (this.selectionPolygon.length > 2) {
            const p0 = this.selectionPolygon[0];
            const x0 = ((p0.x + 1) / 2) * rect.width;
            const y0 = ((1 - p0.y) / 2) * rect.height;
            ctx.lineTo(x0, y0);
        }
        ctx.stroke();
    }

    interpolatePoints(p1, p2, numPoints) {
        const points = [];
        for (let i = 1; i <= numPoints; i++) {
            const t = i / (numPoints + 1);
            const x = p1.x + t * (p2.x - p1.x);
            const y = p1.y + t * (p2.y - p1.y);
            points.push(new THREE.Vector2(x, y));
        }
        return points;
    }

    isPointInsideBoundingBox(x, y, box) {
        return x >= box.minX && x <= box.maxX && y >= box.minY && y <= box.maxY;
    }
}
