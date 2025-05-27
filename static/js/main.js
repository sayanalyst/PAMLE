import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class MeshViewer {
    constructor(containerId, toggleButtonId, fullscreenButtonId, toggleLabelingId, labelInputContainerId, labelInputId, saveLabelButtonId) {
        this.container = document.getElementById(containerId);
        this.toggleButton = document.getElementById(toggleButtonId);
        this.fullscreenButton = document.getElementById(fullscreenButtonId);

        this.toggleLabelingButton = document.getElementById(toggleLabelingId);
        this.labelInputContainer = document.getElementById(labelInputContainerId);
        this.labelInput = document.getElementById(labelInputId);
        this.saveLabelButton = document.getElementById(saveLabelButtonId);

        // New property to store flagged points and their marker meshes
        this.flaggedPoints = [];

        // Add event listener for orbit controls toggle icon
        const orbitControlsIcon = document.getElementById('toggle-orbitcontrols-icon');
        if (orbitControlsIcon) {
            // Hide icon initially
            orbitControlsIcon.style.display = 'none';

            // Set icon innerHTML to four-direction plus SVG
            orbitControlsIcon.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;">
                    <path d="M12 2V22M2 12H22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
            orbitControlsIcon.style.cursor = 'pointer';
            orbitControlsIcon.title = 'Enable Orbit Controls';

orbitControlsIcon.addEventListener('click', () => {
    if (!this.labelingMode) return; // Only toggle in labeling mode
    this.orbitControlsEnabledInLabeling = !this.orbitControlsEnabledInLabeling;
    this.controls.enabled = this.orbitControlsEnabledInLabeling;
    this.controls.enableRotate = this.orbitControlsEnabledInLabeling;
    this.controls.enablePan = this.orbitControlsEnabledInLabeling;
    this.controls.enableZoom = this.orbitControlsEnabledInLabeling;
    this.updateOrbitControlsIcon();
    // Removed alert calls to prevent fullscreen toggle off
    /*
    if (this.orbitControlsEnabledInLabeling) {
        alert('Orbit controls enabled.');
    } else {
        alert('Orbit controls disabled.');
    }
    */
});
        }

        this.currentMeshURL = null; // Store currently loaded mesh URL

        // Assign label input container element
        this.labelInputContainer = document.getElementById('label-input-container');

        // Add mark feature mode property
        this.markFeatureMode = false;

        // Initialize selectionFinalized flag to false
        this.selectionFinalized = false;

        // Assign existing Mark Feature button from HTML
        this.markFeatureButton = document.getElementById('mark-feature-button');
        console.log('Mark Feature button element:', this.markFeatureButton);
        if (!this.markFeatureButton) {
            console.warn('Mark Feature button element with id "mark-feature-button" not found.');
        }

        // Assign labelListDropdown element
        this.labelListDropdown = document.getElementById('label-list-dropdown');
        if (!this.labelListDropdown) {
            console.warn('Label list dropdown element with id "label-list-dropdown" not found.');
        }

        // Initialize toggledLabels set to track toggled on labels
        this.toggledLabels = new Set();

        // Assign annotate button and modal elements
        this.annotateButton = document.getElementById('annotate-button');
        this.annotationModal = document.getElementById('annotation-modal');
        this.annotationForm = document.getElementById('annotation-form');
        this.annotationLabelName = document.getElementById('annotation-label-name');

        // Annotation data structure: map label to annotation object
        this.annotations = {};


this.originalAnnotationImageUrls = null; // Store original ImageUrls for restoration on cancel

// Show annotation modal for a given label
this.showAnnotationModal = function(label) {
    this.annotationLabelName.textContent = label;
    const annotation = this.annotations[label] || {};

    // Store a deep copy of original ImageUrls for restoration on cancel
    this.originalAnnotationImageUrls = annotation.ImageUrls ? [...annotation.ImageUrls] : [];

    this.annotationForm.FindCode.value = annotation.FindCode || '';
    this.annotationForm.Description.value = annotation.Description || '';
    this.annotationForm.Condition.value = annotation.Condition || '';
    this.annotationForm.Remarks.value = annotation.Remarks || '';
    this.annotationForm.Dating.value = annotation.Dating || '';
    this.annotationForm.Supervisor.value = annotation.Supervisor || '';
    this.annotationForm.Date.value = annotation.Date || '';
    this.annotationForm.Photo_done.value = annotation.Photo_done || 'yes';
    if (this.annotationForm.SiteName) {
        this.annotationForm.SiteName.value = annotation.SiteName || '';
    }
    if (this.annotationForm.Phase) {
        this.annotationForm.Phase.value = annotation.Phase || '';
    }
    // Populate feature dimensions fields
    if (this.annotationForm.DimL) {
        this.annotationForm.DimL.value = annotation.DimL || '';
    }
    if (this.annotationForm.DimW) {
        this.annotationForm.DimW.value = annotation.DimW || '';
    }
    if (this.annotationForm.DimH) {
        this.annotationForm.DimH.value = annotation.DimH || '';
    }
// Populate webpage address input fields
const webpageAddressInputsContainer = document.getElementById('webpage-address-inputs-container');
if (webpageAddressInputsContainer) {
    webpageAddressInputsContainer.innerHTML = '';
    let urls = [];
    if (annotation.WebpageAddress && Array.isArray(annotation.WebpageAddress)) {
        urls = annotation.WebpageAddress;
    } else if (typeof annotation.WebpageAddress === 'string' && annotation.WebpageAddress.trim() !== '') {
        urls = annotation.WebpageAddress.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    }

    urls.forEach(url => {
        const wrapper = document.createElement('div');
        wrapper.className = 'webpage-address-input-wrapper';
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.marginBottom = '4px';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'webpage-address-input';
        input.placeholder = 'https://example.com';
        input.style.flexGrow = '1';
        input.style.marginRight = '8px';
        input.value = url;

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'remove-webpage-address-input';
        removeButton.title = 'Remove URL';
        removeButton.style.backgroundColor = '#c0392b';
        removeButton.style.color = 'white';
        removeButton.style.border = 'none';
        removeButton.style.borderRadius = '4px';
        removeButton.style.cursor = 'pointer';
        removeButton.style.padding = '2px 6px';
        removeButton.textContent = '×';

        removeButton.addEventListener('click', () => {
            wrapper.remove();
        });

        wrapper.appendChild(input);
        wrapper.appendChild(removeButton);
        webpageAddressInputsContainer.appendChild(wrapper);
    });
}

this.annotationModal.style.display = 'block';

// Update webpage address links and multiple image previews
const webpageAddressLinksContainer = document.getElementById('webpage-address-links');
const webpageImagePreviewsContainer = document.getElementById('webpage-image-previews-container');
const removeWebpageImagesButton = document.getElementById('remove-webpage-image-previews');

if (webpageAddressLinksContainer) {
    webpageAddressLinksContainer.innerHTML = '';
    if (webpageImagePreviewsContainer) {
        webpageImagePreviewsContainer.innerHTML = '';
    }
    let urls = [];
    const webpageAddressInputs = document.querySelectorAll('.webpage-address-input');
    webpageAddressInputs.forEach(input => {
        const val = input.value.trim();
        if (val.length > 0) {
            urls.push(val);
        }
    });

    urls.forEach(url => {
        try {
            new URL(url);
            // Create clickable link
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = url;
            link.style.display = 'block';
            link.style.color = '#0af';
            link.style.marginBottom = '4px';
            link.style.fontSize = '8px';
            link.style.wordBreak = 'break-word';
            webpageAddressLinksContainer.appendChild(link);

            // Create image preview for each URL
            if (webpageImagePreviewsContainer) {
                const img = document.createElement('img');
                img.src = url;
                img.alt = 'Webpage Image Preview';
                img.style.maxWidth = '100px';
                img.style.maxHeight = '100px';
                img.style.marginRight = '8px';
                img.style.marginBottom = '8px';
                img.style.border = '1px solid #555';
                img.style.borderRadius = '4px';
                img.style.cursor = 'pointer';

                // Add click event to enlarge image in modal
                img.addEventListener('click', () => {
                    let modal = document.getElementById('webpage-preview-modal');
                    if (!modal) {
                        modal = document.createElement('div');
                        modal.id = 'webpage-preview-modal';
                        modal.style.position = 'fixed';
                        modal.style.top = '0';
                        modal.style.left = '0';
                        modal.style.width = '100vw';
                        modal.style.height = '100vh';
                        modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
                        modal.style.display = 'flex';
                        modal.style.justifyContent = 'center';
                        modal.style.alignItems = 'center';
                        modal.style.zIndex = '20000';

                        const closeButton = document.createElement('span');
                        closeButton.id = 'webpage-preview-close';
                        closeButton.textContent = '×';
                        closeButton.style.position = 'absolute';
                        closeButton.style.top = '20px';
                        closeButton.style.right = '30px';
                        closeButton.style.fontSize = '40px';
                        closeButton.style.fontWeight = 'bold';
                        closeButton.style.color = 'white';
                        closeButton.style.cursor = 'pointer';
                        closeButton.style.userSelect = 'none';
                        modal.appendChild(closeButton);

                        const modalImage = document.createElement('img');
                        modalImage.id = 'webpage-preview-modal-image';
                        modalImage.style.maxWidth = '90%';
                        modalImage.style.maxHeight = '90%';
                        modalImage.style.boxShadow = '0 0 20px white';
                        modalImage.style.borderRadius = '8px';
                        modal.appendChild(modalImage);

                        closeButton.addEventListener('click', () => {
                            modal.style.display = 'none';
                        });

                        modal.addEventListener('click', (event) => {
                            if (event.target === modal) {
                                modal.style.display = 'none';
                            }
                        });

                        document.body.appendChild(modal);
                    }
                    const modalImage = document.getElementById('webpage-preview-modal-image');
                    modalImage.src = img.src;
                    modal.style.display = 'flex';
                });

                webpageImagePreviewsContainer.appendChild(img);
            }
        } catch (e) {
            // Invalid URL, skip
        }
    });

    // Show or hide remove all button based on previews count
    if (removeWebpageImagesButton) {
        if (urls.length > 0) {
            removeWebpageImagesButton.style.display = 'inline-block';
        } else {
            removeWebpageImagesButton.style.display = 'none';
        }
    }
}

// Hide single webpage image preview when multiple previews are shown
const webpageImagePreview = document.getElementById('webpage-image-preview');
if (webpageImagePreview) {
    webpageImagePreview.src = '';
    webpageImagePreview.style.display = 'none';
}

// Update multiple image previews based on annotation.ImageUrls
const imagePreviewsContainer = document.getElementById('annotation-image-previews');
if (imagePreviewsContainer) {
    imagePreviewsContainer.innerHTML = '';
    if (annotation.ImageUrls && Array.isArray(annotation.ImageUrls)) {
        const self = this;
        annotation.ImageUrls.forEach((url) => {
            const currentUrl = url; // Capture current url in local variable
            const wrapper = document.createElement('div');
            wrapper.style.position = 'relative';
            wrapper.style.display = 'inline-block';
            wrapper.style.marginRight = '8px';

            const img = document.createElement('img');
            img.src = currentUrl;
            img.style.maxWidth = '100px';
            img.style.maxHeight = '100px';
            img.style.cursor = 'pointer';

            img.addEventListener('click', () => {
                const modal = document.getElementById('image-view-modal');
                const modalImage = document.getElementById('image-view-content');
                if (modal && modalImage) {
                    modalImage.src = img.src;
                    modal.style.display = 'flex';
                }
            });

            const removeBtn = document.createElement('button');
            removeBtn.textContent = '×';
            removeBtn.title = 'Delete image';
            removeBtn.style.position = 'absolute';
            removeBtn.style.top = '2px';
            removeBtn.style.right = '2px';
            removeBtn.style.backgroundColor = 'rgba(192, 57, 43, 0.8)';
            removeBtn.style.color = 'white';
            removeBtn.style.border = 'none';
            removeBtn.style.borderRadius = '50%';
            removeBtn.style.width = '20px';
            removeBtn.style.height = '20px';
            removeBtn.style.cursor = 'pointer';
            removeBtn.style.fontWeight = 'bold';
            removeBtn.style.lineHeight = '18px';
            removeBtn.style.padding = '0';
            removeBtn.style.textAlign = 'center';

            removeBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                // Remove image preview from UI
                wrapper.remove();

                // Remove image URL from annotation.ImageUrls array in memory only (no backend call)
                const label = self.annotationLabelName.textContent;
                if (label && self.annotations && self.annotations[label] && Array.isArray(self.annotations[label].ImageUrls)) {
                    self.annotations[label].ImageUrls = self.annotations[label].ImageUrls.filter(u => u !== currentUrl);
                }

                // Hide remove all images button if no images left
                if (imagePreviewsContainer.children.length === 0) {
                    const removeAllImagesButton = document.getElementById('remove-annotation-images');
                    if (removeAllImagesButton) {
                        removeAllImagesButton.style.display = 'none';
                    }
                }
            });

            wrapper.appendChild(img);
            wrapper.appendChild(removeBtn);
            imagePreviewsContainer.appendChild(wrapper);
        });
        const removeAllImagesButton = document.getElementById('remove-annotation-images');
        if (removeAllImagesButton) {
            removeAllImagesButton.style.display = 'inline-block';
        }
    }
}
};

// Hide annotation modal
this.hideAnnotationModal = function() {
    // Restore original ImageUrls if modal is closed without saving
    const label = this.annotationLabelName.textContent;
    if (label && this.annotations && this.originalAnnotationImageUrls) {
        this.annotations[label].ImageUrls = [...this.originalAnnotationImageUrls];
    }

    // Restore image previews UI to match restored ImageUrls
    const annotation = this.annotations[label] || {};
    const imagePreviewsContainer = document.getElementById('annotation-image-previews');
    if (imagePreviewsContainer) {
        imagePreviewsContainer.innerHTML = '';
        if (annotation.ImageUrls && Array.isArray(annotation.ImageUrls)) {
            const self = this;
            annotation.ImageUrls.forEach((url) => {
                const currentUrl = url; // Capture current url in local variable
                const wrapper = document.createElement('div');
                wrapper.style.position = 'relative';
                wrapper.style.display = 'inline-block';
                wrapper.style.marginRight = '8px';

                const img = document.createElement('img');
                img.src = currentUrl;
                img.style.maxWidth = '100px';
                img.style.maxHeight = '100px';
                img.style.cursor = 'pointer';

                img.addEventListener('click', () => {
                    const modal = document.getElementById('image-view-modal');
                    const modalImage = document.getElementById('image-view-content');
                    if (modal && modalImage) {
                        modalImage.src = img.src;
                        modal.style.display = 'flex';
                    }
                });

                const removeBtn = document.createElement('button');
                removeBtn.textContent = '×';
                removeBtn.title = 'Delete image';
                removeBtn.style.position = 'absolute';
                removeBtn.style.top = '2px';
                removeBtn.style.right = '2px';
                removeBtn.style.backgroundColor = 'rgba(192, 57, 43, 0.8)';
                removeBtn.style.color = 'white';
                removeBtn.style.border = 'none';
                removeBtn.style.borderRadius = '50%';
                removeBtn.style.width = '20px';
                removeBtn.style.height = '20px';
                removeBtn.style.cursor = 'pointer';
                removeBtn.style.fontWeight = 'bold';
                removeBtn.style.lineHeight = '18px';
                removeBtn.style.padding = '0';
                removeBtn.style.textAlign = 'center';

                removeBtn.addEventListener('click', (event) => {
                    event.stopPropagation();
                    // Remove image preview from UI
                    wrapper.remove();

                    // Remove image URL from annotation.ImageUrls array in memory only (no backend call)
                    if (label && self.annotations && self.annotations[label] && Array.isArray(self.annotations[label].ImageUrls)) {
                        self.annotations[label].ImageUrls = self.annotations[label].ImageUrls.filter(u => u !== currentUrl);
                    }

                    // Hide remove all images button if no images left
                    if (imagePreviewsContainer.children.length === 0) {
                        const removeAllImagesButton = document.getElementById('remove-annotation-images');
                        if (removeAllImagesButton) {
                            removeAllImagesButton.style.display = 'none';
                        }
                    }
                });

                wrapper.appendChild(img);
                wrapper.appendChild(removeBtn);
                imagePreviewsContainer.appendChild(wrapper);
            });
            const removeAllImagesButton = document.getElementById('remove-annotation-images');
            if (removeAllImagesButton) {
                removeAllImagesButton.style.display = 'inline-block';
            }
        }
    }

    this.annotationModal.style.display = 'none';
};

// Save annotation from form inputs
this.saveAnnotationFromForm = async function() {
    const label = this.annotationLabelName.textContent;
    const imageInput = document.getElementById('annotation-image');
    let imageUrls = [];

    // Upload images if selected
    if (imageInput && imageInput.files && imageInput.files.length > 0) {
        for (const file of imageInput.files) {
            const formData = new FormData();
            formData.append('image', file);

            try {
                const uploadResponse = await fetch('/upload_annotation_image', {
                    method: 'POST',
                    body: formData
                });
                if (uploadResponse.ok) {
                    const uploadData = await uploadResponse.json();
                    imageUrls.push(uploadData.url);
                } else {
                    const errorData = await uploadResponse.json();
                    alert('Failed to upload image: ' + (errorData.error || 'Unknown error'));
                    return;
                }
            } catch (error) {
                alert('Error uploading image: ' + error.message);
                return;
            }
        }
    }

    // Collect webpage URLs from multiple input fields
    const webpageAddressInputs = document.querySelectorAll('.webpage-address-input');
    const webpageUrls = [];
    webpageAddressInputs.forEach(input => {
        const val = input.value.trim();
        if (val.length > 0) {
            webpageUrls.push(val);
        }
    });

    // Determine images to delete from backend (those removed from annotation.ImageUrls)
    const originalImageUrls = this.originalAnnotationImageUrls || [];

    // Collect current image URLs from image previews container
    const imagePreviewsContainer = document.getElementById('annotation-image-previews');
    let currentImageUrls = [];
    if (imagePreviewsContainer) {
        currentImageUrls = Array.from(imagePreviewsContainer.querySelectorAll('img')).map(img => img.src);
    } else {
        currentImageUrls = this.annotations[label] ? this.annotations[label].ImageUrls : [];
    }

    const imagesToDelete = originalImageUrls.filter(url => !currentImageUrls.includes(url));

    // Delete removed images from backend
    for (const url of imagesToDelete) {
        try {
            const parts = url.split('/');
            const filename = parts[parts.length - 1];
            const response = await fetch('/delete_annotation_image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ filename })
            });
            if (!response.ok) {
                console.error('Failed to delete image file during save:', filename);
            } else {
                console.log('Deleted image file during save:', filename);
            }
        } catch (error) {
            console.error('Error deleting image file during save:', error);
        }
    }

    const annotation = {
        FindCode: this.annotationForm.FindCode.value.trim(),
        Description: this.annotationForm.Description.value.trim(),
        Condition: this.annotationForm.Condition.value.trim(),
        Remarks: this.annotationForm.Remarks.value.trim(),
        Dating: this.annotationForm.Dating.value.trim(),
        Supervisor: this.annotationForm.Supervisor.value.trim(),
        Date: this.annotationForm.Date.value,
        Photo_done: this.annotationForm.Photo_done.value,
        SiteName: this.annotationForm.SiteName.value.trim(),
        Phase: this.annotationForm.Phase.value.trim(),
        CoordX: this.annotationForm['CoordX'] ? this.annotationForm['CoordX'].value.trim() : '',
        CoordY: this.annotationForm['CoordY'] ? this.annotationForm['CoordY'].value.trim() : '',
        CoordZ: this.annotationForm['CoordZ'] ? this.annotationForm['CoordZ'].value.trim() : '',
        DimL: this.annotationForm.DimL ? this.annotationForm.DimL.value.trim() : '',
        DimW: this.annotationForm.DimW ? this.annotationForm.DimW.value.trim() : '',
        DimH: this.annotationForm.DimH ? this.annotationForm.DimH.value.trim() : '',
        WebpageAddress: webpageUrls,
        ImageUrls: currentImageUrls
    };
    this.annotations[label] = annotation;
    try {
        const response = await fetch('/save_annotations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(this.annotations)
        });
    if (response.ok) {
        alert('Annotation saved successfully.');
        // Update originalAnnotationImageUrls to reflect saved state
        this.originalAnnotationImageUrls = annotation.ImageUrls ? [...annotation.ImageUrls] : [];
        this.hideAnnotationModal();
        // Clear image input and previews after save
        if (imageInput) imageInput.value = '';
        const imagePreviewsContainer = document.getElementById('annotation-image-previews');
        const removeAllImagesButton = document.getElementById('remove-annotation-images');
        if (imagePreviewsContainer) {
            imagePreviewsContainer.innerHTML = '';
        }
        if (removeAllImagesButton) removeAllImagesButton.style.display = 'none';

        // Clear webpage address input fields after save
        const webpageAddressInputsContainer = document.getElementById('webpage-address-inputs-container');
        if (webpageAddressInputsContainer) {
            webpageAddressInputsContainer.innerHTML = '';
            // Add one empty input field after clearing
            const wrapper = document.createElement('div');
            wrapper.className = 'webpage-address-input-wrapper';
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.marginBottom = '4px';

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'webpage-address-input';
            input.placeholder = 'https://example.com';
            input.style.flexGrow = '1';
            input.style.marginRight = '8px';

            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = 'remove-webpage-address-input';
            removeButton.title = 'Remove URL';
            removeButton.style.backgroundColor = '#c0392b';
            removeButton.style.color = 'white';
            removeButton.style.border = 'none';
            removeButton.style.borderRadius = '4px';
            removeButton.style.cursor = 'pointer';
            removeButton.style.padding = '2px 6px';
            removeButton.textContent = '×';

            removeButton.addEventListener('click', () => {
                wrapper.remove();
            });

            wrapper.appendChild(input);
            wrapper.appendChild(removeButton);
            webpageAddressInputsContainer.appendChild(wrapper);
        }

        if (this.annotationForm.DimL) {
            this.annotationForm.DimL.value = '';
        }
        if (this.annotationForm.DimW) {
            this.annotationForm.DimW.value = '';
        }
        if (this.annotationForm.DimH) {
            this.annotationForm.DimH.value = '';
        }
    } else {
                const errorData = await response.json();
                alert('Failed to save annotation: ' + (errorData.error || 'Unknown error'));
            }
        } catch (error) {
            alert('Error saving annotation: ' + error.message);
        }
    };

        // Handle image file input change
        const imageInput = document.getElementById('annotation-image');
        const imagePreview = document.getElementById('annotation-image-preview');
        const removeButton = document.getElementById('remove-annotation-image');
        const imagePreviewsContainer = document.getElementById('annotation-image-previews');
        const removeAllImagesButton = document.getElementById('remove-annotation-images');

        // Add click event listener to image preview once during initialization
        if (imagePreview) {
            imagePreview.style.cursor = 'pointer';
            imagePreview.addEventListener('click', () => {
                console.log('Image preview clicked');
                const modal = document.getElementById('image-view-modal');
                const modalImage = document.getElementById('image-view-content');
                if (modal && modalImage) {
                    console.log('Showing modal');
                    modalImage.src = imagePreview.src;
                    modal.style.display = 'flex';
                } else {
                    console.log('Modal or modal image element not found');
                }
            });
        }

        // Add event listeners to close modal on close button click or outside click
        const modal = document.getElementById('image-view-modal');
        const modalClose = document.getElementById('image-view-close');
        if (modal && modalClose) {
            modalClose.addEventListener('click', () => {
                console.log('Modal close button clicked');
                modal.style.display = 'none';
            });
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    console.log('Modal background clicked');
                    modal.style.display = 'none';
                }
            });
        }

        if (imageInput) {
            imageInput.addEventListener('change', (event) => {
                const files = event.target.files;
                if (!files || files.length === 0) return;

                // Clear previous previews and data
                this.annotationImageDataArray = [];
                if (imagePreviewsContainer) {
                    imagePreviewsContainer.innerHTML = '';
                }

                const allowedTypes = ['image/jpeg', 'image/bmp', 'image/png', 'image/tiff'];

                Array.from(files).forEach((file) => {
                    if (!allowedTypes.includes(file.type)) {
                        alert('Unsupported image format. Please upload JPEG, BMP, PNG, or TIFF images.');
                        imageInput.value = '';
                        return;
                    }

                    if (file.type === 'image/tiff') {
                        alert('Preview for TIFF images is not supported in this browser, but the image will be uploaded.');
                        // Do not add preview for TIFF
                    } else {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            this.annotationImageDataArray.push(e.target.result);
                            if (imagePreviewsContainer) {
                                const img = document.createElement('img');
                                img.src = e.target.result;
                                img.style.maxWidth = '100px';
                                img.style.maxHeight = '100px';
                                img.style.marginRight = '8px';
                                img.style.cursor = 'pointer';
                                img.addEventListener('click', () => {
                                    const modal = document.getElementById('image-view-modal');
                                    const modalImage = document.getElementById('image-view-content');
                                    if (modal && modalImage) {
                                        modalImage.src = img.src;
                                        modal.style.display = 'flex';
                                    }
                                });
                                imagePreviewsContainer.appendChild(img);
                            }
                        };
                        reader.readAsDataURL(file);
                    }
                });

                if (removeAllImagesButton) {
                    removeAllImagesButton.style.display = 'inline-block';
                }
            });
        }

if (removeAllImagesButton) {
    removeAllImagesButton.addEventListener('click', async () => {
        // Delete all uploaded images associated with current annotation label from backend
        const label = this.annotationLabelName.textContent;
        if (label && this.annotations && this.annotations[label] && Array.isArray(this.annotations[label].ImageUrls)) {
            for (const url of this.annotations[label].ImageUrls) {
                try {
                    const parts = url.split('/');
                    const filename = parts[parts.length - 1];
                    const response = await fetch('/delete_annotation_image', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ filename })
                    });
                    if (!response.ok) {
                        console.error('Failed to delete image file:', filename);
                    } else {
                        console.log('Image file deleted:', filename);
                    }
                } catch (error) {
                    console.error('Error deleting image file:', error);
                }
            }
            // Clear ImageUrls array after deletion
            this.annotations[label].ImageUrls = [];
        }
        this.annotationImageDataArray = [];
        if (imageInput) imageInput.value = '';
        if (imagePreviewsContainer) {
            imagePreviewsContainer.innerHTML = '';
        }
        removeAllImagesButton.style.display = 'none';
    });
}

        if (removeButton) {
            removeButton.addEventListener('click', () => {
                this.annotationImageData = null;
                if (imageInput) imageInput.value = '';
                if (imagePreview) {
                    imagePreview.src = '';
                    imagePreview.style.display = 'none';
                }
                removeButton.style.display = 'none';
            });
        }

        // Update showAnnotationModal to display image if present
        const originalShowAnnotationModal = this.showAnnotationModal;
        this.showAnnotationModal = function(label) {
            originalShowAnnotationModal.call(this, label);
            const annotation = this.annotations[label] || {};
            this.annotationImageData = annotation.ImageUrl || null;
            this.updateAnnotationImagePreview();
        };

        // New method to update annotation image preview element and remove button visibility
        this.updateAnnotationImagePreview = function() {
            if (this.annotationImageData && imagePreview) {
                imagePreview.src = this.annotationImageData;
                imagePreview.style.display = 'block';
                if (removeButton) removeButton.style.display = 'inline-block';
            } else {
                if (imagePreview) {
                    imagePreview.src = '';
                    imagePreview.style.display = 'none';
                }
                if (removeButton) removeButton.style.display = 'none';
            }
        };

        // Modify loadAnnotations to update image preview if annotation modal is open
        const originalLoadAnnotations = this.loadAnnotations;
        this.loadAnnotations = async function() {
            await originalLoadAnnotations.call(this);
            // If annotation modal is open and label is set, update image preview
        if (this.annotationModal.style.display === 'block') {
            const label = this.annotationLabelName.textContent;
            const annotation = this.annotations[label] || {};
            this.annotationImageData = annotation.ImageUrl || null;
            this.updateAnnotationImagePreview();

            // Update webpage image preview based on webpage address
            const webpageImagePreview = document.getElementById('webpage-image-preview');
            if (webpageImagePreview) {
                const url = annotation.WebpageAddress || '';
                if (url) {
                    try {
                        new URL(url);
                        webpageImagePreview.src = url;
                        webpageImagePreview.style.display = 'block';
                    } catch (e) {
                        webpageImagePreview.src = '';
                        webpageImagePreview.style.display = 'none';
                    }
                } else {
                    webpageImagePreview.src = '';
                    webpageImagePreview.style.display = 'none';
                }
            }
        }
    };

        // Modify loadMesh to update image preview if annotation modal is open after mesh reload
        const originalLoadMesh = this.loadMesh;
        this.loadMesh = async function(url) {
            await originalLoadMesh.call(this, url);
            if (this.annotationModal.style.display === 'block') {
                const label = this.annotationLabelName.textContent;
                const annotation = this.annotations[label] || {};
                this.annotationImageData = annotation.ImageUrl || null;
                this.updateAnnotationImagePreview();

                // Update webpage image preview based on webpage address
                const webpageImagePreview = document.getElementById('webpage-image-preview');
                if (webpageImagePreview) {
                    const url = annotation.WebpageAddress || '';
                    if (url) {
                        try {
                            new URL(url);
                            webpageImagePreview.src = url;
                            webpageImagePreview.style.display = 'block';
                        } catch (e) {
                            webpageImagePreview.src = '';
                            webpageImagePreview.style.display = 'none';
                        }
                    } else {
                        webpageImagePreview.src = '';
                        webpageImagePreview.style.display = 'none';
                    }
                }
            }
        };

        // Load annotations from backend
        this.loadAnnotations = async function() {
            try {
                const response = await fetch('/load_annotations');
                if (!response.ok) {
                    console.warn('No annotations found or failed to load annotations.');
                    this.annotations = {};
                    return;
                }
                const data = await response.json();
                this.annotations = data;
                console.log('Loaded annotations:', this.annotations);
            } catch (error) {
                console.error('Error loading annotations:', error);
                this.annotations = {};
            }
        };

        // Initialize currentlyHighlightedLabel for toggle behavior
        this.currentlyHighlightedLabel = null;

        // Create and add assign label button dynamically to label input container
        this.assignLabelButton = document.createElement('button');
        this.assignLabelButton.id = 'assign-label';
        this.assignLabelButton.textContent = 'Assign Label';
        this.assignLabelButton.style.marginLeft = '0.2rem';
        // Insert assign label button between annotate and save buttons
        const annotateButton = document.getElementById('annotate-button');
        const saveButton = document.getElementById('save-label');
        if (annotateButton && saveButton) {
            this.labelInputContainer.insertBefore(this.assignLabelButton, saveButton);
        } else {
            this.labelInputContainer.appendChild(this.assignLabelButton);
        }

        // Create progress bar element
        this.progressBar = document.createElement('div');
        this.progressBar.style.position = 'fixed';
        this.progressBar.style.top = '10px';
        this.progressBar.style.left = '50%';
        this.progressBar.style.transform = 'translateX(-50%)';
        this.progressBar.style.width = '300px';
        this.progressBar.style.height = '20px';
        this.progressBar.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.progressBar.style.color = 'white';
        this.progressBar.style.fontSize = '14px';
        this.progressBar.style.textAlign = 'center';
        this.progressBar.style.lineHeight = '20px';
        this.progressBar.style.borderRadius = '5px';
        this.progressBar.style.zIndex = '10000';
        this.progressBar.style.display = 'none';
        this.progressBar.textContent = 'Processing...';
        document.body.appendChild(this.progressBar);

        this.finalizedSelectedFaces = new Set();
        this.labeledFacesMap = new Map();

        if (!this.toggleButton || !this.fullscreenButton || !this.toggleLabelingButton || !this.labelInputContainer || !this.labelInput || !this.saveLabelButton) {
            console.error('One or more DOM elements not found. Please check element IDs in HTML.');
            return;
        }

        this.crsMetadataDiv = document.getElementById('crs-metadata');

        // Create and append version label dynamically
        this.versionLabel = document.createElement('div');
        this.versionLabel.id = 'version-label';
        this.versionLabel.textContent = 'Mesh-Loader V1.0';
        this.container.appendChild(this.versionLabel);

        // Remove vertical color index bar container and labels if exist
        if (this.colorIndexBar) {
            this.colorIndexBar.remove();
            this.colorIndexBar = null;
        }
        if (this.zValueLabelsContainer) {
            this.zValueLabelsContainer.remove();
            this.zValueLabelsContainer = null;
        }

        // Use existing heatmap bar element
        this.colorIndexBar = document.getElementById('color-index-bar');
        if (!this.colorIndexBar) {
            console.warn('Existing heatmap bar element with id "color-index-bar" not found.');
        }

        // Create z value labels container aligned next to existing heatmap bar
        this.zValueLabelsContainer = document.createElement('div');
        this.zValueLabelsContainer.style.position = 'absolute';
        this.zValueLabelsContainer.style.top = this.colorIndexBar ? this.colorIndexBar.offsetTop + 'px' : '50px';
        this.zValueLabelsContainer.style.left = this.colorIndexBar ? (this.colorIndexBar.offsetLeft + this.colorIndexBar.offsetWidth + 5) + 'px' : '35px';
        this.zValueLabelsContainer.style.height = this.colorIndexBar ? this.colorIndexBar.offsetHeight + 'px' : (this.container.clientHeight - 100) + 'px';
        this.zValueLabelsContainer.style.display = 'flex';
        this.zValueLabelsContainer.style.flexDirection = 'column';
        this.zValueLabelsContainer.style.justifyContent = 'space-between';
        this.zValueLabelsContainer.style.color = 'white';
        this.zValueLabelsContainer.style.fontSize = '12px';
        this.zValueLabelsContainer.style.fontFamily = 'Arial, sans-serif';
        this.zValueLabelsContainer.style.zIndex = '10';
        this.container.appendChild(this.zValueLabelsContainer);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(45, this.container.clientWidth / this.container.clientHeight, 1, 1000);
        this.camera.position.set(0, 0, 60);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 0, 0);
        this.controls.update();

        this.ambientLight = new THREE.AmbientLight(0xffffff, 3.5);
        this.scene.add(this.ambientLight);

        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.7);
        this.directionalLight.position.set(10, 10, 10);
        this.directionalLight.castShadow = true;
        this.scene.add(this.directionalLight);

        this.directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.7);
        this.directionalLight2.position.set(-10, -10, -10);
        this.scene.add(this.directionalLight2);

        this.directionalLight3 = new THREE.DirectionalLight(0xffffff, 1.5);
        this.directionalLight3.position.set(0, 10, -10);
        this.scene.add(this.directionalLight3);

        this.directionalLight4 = new THREE.DirectionalLight(0xffffff, 1.5);
        this.directionalLight4.position.set(10, -10, -10);
        this.scene.add(this.directionalLight4);

        this.hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 3.0);
        this.hemisphereLight.position.set(0, 20, 0);
        this.scene.add(this.hemisphereLight);

        this.loader = new GLTFLoader();

        this.mesh = null;
        this.pivot = null;
        this.originalMaterials = new Map();
        this.originalVertexColors = new Map();
        this.heatmapEnabled = false;
        this.globalMinZ = Infinity;
        this.globalMaxZ = -Infinity;

        this.isRotatingOnHover = false;
        this.isRotationPaused = false;

        this.isAutoRotate = false; // Flag for auto rotation

        // Variables for manual mesh rotation
        this.isDraggingMesh = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.meshRotationSensitivity = 0.005;

        // Add mouse event listeners for mesh rotation
        this.renderer.domElement.addEventListener('mousedown', (event) => {
            if (this.labelingMode) return;
            // Start drag for left or right mouse button
            if (event.button === 0 || event.button === 2) {
                this.isDraggingMesh = true;
                this.dragButton = event.button; // 0 = left, 2 = right
                this.previousMousePosition.x = event.clientX;
                this.previousMousePosition.y = event.clientY;
                this.isDragging = false; // Reset dragging flag on mouse down
                // Disable OrbitControls rotation while dragging mesh
                this.controls.enableRotate = false;
            }
        });

        this.renderer.domElement.addEventListener('mousemove', (event) => {
            if (this.labelingMode) return;
            if (!this.isDraggingMesh) return;

            const deltaX = event.clientX - this.previousMousePosition.x;
            const deltaY = event.clientY - this.previousMousePosition.y;

            this.previousMousePosition.x = event.clientX;
            this.previousMousePosition.y = event.clientY;

            if (this.pivot) {
                if (this.dragButton === 0) {
                    // Left button drag: rotate pivot around Y and X axes
                    this.pivot.rotation.y += deltaX * this.meshRotationSensitivity;
                    this.pivot.rotation.x += deltaY * this.meshRotationSensitivity;

                    // Clamp X rotation to avoid flipping (between -90 and 90 degrees)
                    const maxXRotation = Math.PI / 2;
                    const minXRotation = -Math.PI / 2;
                    this.pivot.rotation.x = Math.max(minXRotation, Math.min(maxXRotation, this.pivot.rotation.x));
                } else if (this.dragButton === 2) {
                    // Right button drag: rotate pivot around Z axis by horizontal movement
                    this.pivot.rotation.z += deltaX * this.meshRotationSensitivity;
                }
            }
        });

        this.renderer.domElement.addEventListener('mouseup', (event) => {
            if (this.labelingMode) return;
            if (event.button === 0 || event.button === 2) {
                this.isDraggingMesh = false;
                this.dragButton = null;
                this.isDragging = false; // Reset dragging flag on mouse up
                // Re-enable OrbitControls rotation after dragging mesh
                this.controls.enableRotate = true;
            }
        });

        this.renderer.domElement.addEventListener('mouseleave', () => {
            if (this.labelingMode) return;
            this.isDraggingMesh = false;
            this.dragButton = null;
            this.isDragging = false; // Reset dragging flag on mouse leave
            this.controls.enableRotate = true;
        });

        // Prevent pan in labeling mode by disabling controls.enablePan and intercepting mouse events
        this.renderer.domElement.addEventListener('wheel', (event) => {
            if (this.labelingMode) {
                // Allow zoom but prevent pan on wheel if needed
                // Do nothing here to allow zoom
            }
        });

        this.renderer.domElement.addEventListener('pointerdown', (event) => {
            if (this.labelingMode) {
                // Disable pan start on pointer down in labeling mode
                event.stopPropagation();
            }
        });

        this.renderer.domElement.addEventListener('pointermove', (event) => {
            if (this.labelingMode) {
                // Disable pan move on pointer move in labeling mode
                event.stopPropagation();
            }
        });

        this.renderer.domElement.addEventListener('pointerup', (event) => {
            if (this.labelingMode) {
                // Disable pan end on pointer up in labeling mode
                event.stopPropagation();
            }
        });

    }

    showProgressBar() {
        if (this.progressBar) {
            this.progressBar.style.display = 'block';
            this.progressBar.style.width = '0%';
            this.progressBar.textContent = '0%';
        }
    }

    setupSaveLabelListener() {
        if (!this.saveLabelButton) {
            console.error('Save label button not found.');
            return;
        }
        this.saveLabelButton.addEventListener('click', async () => {
            if (!this.labels || this.labels.length === 0) {
                alert('No labels to save.');
                return;
            }
            // Use stored original mesh filename if available
            let baseName = 'default';
            if (this.currentMeshFilename) {
                baseName = this.currentMeshFilename;
            } else if (this.currentMeshURL) {
                // Fallback: extract from currentMeshURL
                const urlParts = this.currentMeshURL.split('/');
                const meshFilename = urlParts[urlParts.length - 1];
                const dotIndex = meshFilename.lastIndexOf('.');
                baseName = dotIndex !== -1 ? meshFilename.substring(0, dotIndex) : meshFilename;
            }
            try {
                // Save combined object with labels and markedFeatures
                const markedFeaturesData = this.flaggedPoints.map(fp => {
                    // Save position relative to pivot local coordinates
                    let localPos = fp.mesh.position.clone();
                    if (this.pivot) {
                        localPos = fp.mesh.position.clone();
                    }
                    return {
                        label: fp.label,
                        position: { x: localPos.x, y: localPos.y, z: localPos.z }
                    };
                });
                const combinedData = {
                    labels: this.labels,
                    markedFeatures: markedFeaturesData
                };
                const response = await fetch(`/save_label/${baseName}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(combinedData),
                });
                if (!response.ok) {
                    console.warn('Failed to save labels and marked features:', response.statusText);
                } else {
                    console.log('Labels and marked features saved successfully.');
                    alert('Labels saved successfully.');
                }
            } catch (error) {
                console.error('Error saving labels and marked features:', error);
            }
        });
    }

    setupAssignLabelListener() {
        if (!this.assignLabelButton || !this.labelInput) {
            console.error('Assign label button or label input not found.');
            return;
        }
        this.assignLabelButton.addEventListener('click', () => {
            console.log('assignLabelButton click handler start');
            try {
                if (this.assignLabelInProgress) {
                    console.warn('Assign label already in progress, ignoring duplicate click.');
                    return;
                }
                this.assignLabelInProgress = true;

                const labelText = this.labelInput.value.trim();
                if (!labelText) {
                    alert('Please enter a label.');
                    this.assignLabelInProgress = false;
                    console.log('assignLabelButton click handler end (early return: no label)');
                    return;
                }
                if (this.selectedFaces.size === 0) {
                    alert('No faces selected to label.');
                    this.assignLabelInProgress = false;
                    console.log('assignLabelButton click handler end (early return: no faces selected)');
                    return;
                }

                console.log('Before removing selected faces from existing labels');
                // Remove selected faces from any existing label entries
                for (const labelEntry of this.labels) {
                    labelEntry.faces = labelEntry.faces.filter(faceIndex => !this.selectedFaces.has(faceIndex));
                }
                console.log('After removing selected faces from existing labels');

                console.log('Before removing empty label entries');
                // Remove empty label entries
                this.labels = this.labels.filter(labelEntry => labelEntry.faces.length > 0);
                console.log('After removing empty label entries');

                console.log('Before adding or updating label entry');
                // Add or update label entry
                let labelEntry = this.labels.find(l => l.label === labelText);
                if (!labelEntry) {
                    labelEntry = { label: labelText, faces: [] };
                    this.labels.push(labelEntry);
                }
                console.log('After adding or updating label entry');

                console.log('Before avoiding duplicates in faces array');
                // Avoid duplicates in faces array
                const newFaces = Array.from(this.selectedFaces).filter(faceIndex => !labelEntry.faces.includes(faceIndex));
                console.log('newFaces length:', newFaces.length);
                // Batch push newFaces to labelEntry.faces to avoid stack overflow
                const batchSize = 1000;
                for (let i = 0; i < newFaces.length; i += batchSize) {
                    const batch = newFaces.slice(i, i + batchSize);
                    labelEntry.faces.push(...batch);
                }
                console.log('After avoiding duplicates in faces array');

                console.log('Before updating labeledFacesMap');
                // Update labeledFacesMap
                for (const faceIndex of this.selectedFaces) {
                    this.labeledFacesMap.set(faceIndex, labelText);
                }
                console.log('After updating labeledFacesMap');

                console.log('Before clearing selection and input');
                // Clear selection and input
                this.selectedFaces.clear();
                this.labelInput.value = '';
                console.log('After clearing selection and input');

                console.log('Before updating UI');
                // Update UI
                this.highlightSelectedFaces();
                this.populateLabelList();
                console.log('After updating UI');

                console.log('Assigned label:', labelText);
                console.log('Faces assigned:', labelEntry.faces);

                alert(`Label "${labelText}" assigned to selected faces.`);

                this.assignLabelInProgress = false;
                console.log('assignLabelButton click handler end');
            } catch (error) {
                console.error('Error in assignLabelButton click handler:', error);
                this.assignLabelInProgress = false;
            }
        });
    }

    updateProgressBar(percent) {
        if (this.progressBar) {
            this.progressBar.style.width = percent + '%';
            this.progressBar.textContent = percent + '%';
        }
    }

    hideProgressBar() {
        if (this.progressBar) {
            this.progressBar.style.display = 'none';
        }
    }
    
    applyVertexColorHeatmap(mesh) {
        if (!mesh) return;

        mesh.traverse((child) => {
            if (child.isMesh) {
                const geometry = child.geometry;
                if (!geometry.attributes.position) return;

                const position = geometry.attributes.position;
                const count = position.count;

                // Create color attribute
                const colors = new Float32Array(count * 3);

                for (let i = 0; i < count; i++) {
                    const z = position.getZ(i);
                    // Normalize z between globalMinZ and globalMaxZ
                    const t = (z - this.globalMinZ) / (this.globalMaxZ - this.globalMinZ);
                    // Map t to color gradient (blue to red)
                    const color = new THREE.Color();
                    color.setHSL((1 - t) * 0.7, 1.0, 0.5); // 0.7 is blue, 0 is red

                    colors[i * 3] = color.r;
                    colors[i * 3 + 1] = color.g;
                    colors[i * 3 + 2] = color.b;
                }

                geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
                geometry.attributes.color.needsUpdate = true;

                if (child.material) {
                    child.material.dispose();
                    child.material = new THREE.MeshBasicMaterial({
                        vertexColors: true,
                        transparent: false,
                        opacity: 1.0
                    });
                    child.material.needsUpdate = true;
                }
            }
        });
    }

    removeVertexColorHeatmap(mesh) {
        if (!mesh) return;

        mesh.traverse((child) => {
            if (child.isMesh && this.originalMaterials.has(child)) {
                child.material.dispose();
                child.material = this.originalMaterials.get(child);
                child.material.vertexColors = false;
                child.material.transparent = false;
                child.material.opacity = 1.0;
                child.material.needsUpdate = true;
            }
        });

        this.fadeInProgress = false;
        this.fadeInDuration = 1000; // in milliseconds
        this.fadeInStartTime = 0;

        // Labeling mode state
        this.labelingMode = false;
        this.selectionPolygon = [];
        this.selectedFaces = new Set();

        this.polygonLine = null; // Three.js Line object for polygon visual
        this.polygonFillMesh = null; // Three.js Mesh for filled polygon highlight

        this.init();
    }

    updateZValueLabels() {
        if (!this.globalMinZ || !this.globalMaxZ) return;

        // Clear previous labels
        while (this.zValueLabelsContainer.firstChild) {
            this.zValueLabelsContainer.removeChild(this.zValueLabelsContainer.firstChild);
        }

        // Create labels for five equal intervals: min, 1/4, mid, 3/4, max
        const intervalCount = 4;
        const labels = [];
        for (let i = 0; i <= intervalCount; i++) {
            const value = this.globalMinZ + (i / intervalCount) * (this.globalMaxZ - this.globalMinZ);
            const label = document.createElement('div');
            // Show units only if heatmap is enabled
            label.textContent = value.toFixed(2) + (this.heatmapEnabled && this.zUnits ? ' ' + this.zUnits : '');
            labels.push(label);
        }

        // Append labels from min to max to align with heatmap bar in opposite order
        for (let i = 0; i < labels.length; i++) {
            this.zValueLabelsContainer.appendChild(labels[i]);
        }
    }

    setupLoadingUI() {
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.loadingPercentage = document.getElementById('loading-percentage');
        if (!this.loadingOverlay || !this.loadingPercentage) {
            console.warn('Loading overlay or percentage elements not found in DOM.');
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.fadeInProgress && this.mesh) {
            const elapsed = performance.now() - this.fadeInStartTime;
            const progress = Math.min(elapsed / this.fadeInDuration, 1);

            this.mesh.traverse((child) => {
                if (child.isMesh && child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            mat.opacity = progress;
                            mat.transparent = progress < 1;
                            mat.needsUpdate = true;
                        });
                    } else {
                        child.material.opacity = progress;
                        child.material.transparent = progress < 1;
                        child.material.needsUpdate = true;
                    }
                }
            });

            if (progress >= 1) {
                this.fadeInProgress = false;
            }
        }

        // Auto rotate the pivot if enabled
        if (this.isAutoRotate && this.pivot) {
            this.pivot.rotation.y += 0.01; // Rotate around Y axis
        }

        // Ensure controls update on each frame
        if (this.controls) {
            this.controls.update();
        }

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        if (!this.container) return;
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.controls.update();
    }

    async init() {
        // Show welcome screen and animate camera zoom out before normal init
        const welcomeScreen = document.getElementById('welcome-screen');
        if (welcomeScreen) {
            // Set initial camera position close for zoom out effect
            const initialZ = 10;
            const targetZ = 60;
            this.camera.position.z = initialZ;
            this.controls.target.set(0, 0, 0);
            this.controls.update();

            // Animate camera zoom out with easing over 2 seconds
            await this.animateCameraZoomOut(initialZ, targetZ, 2000);

            // Fade out welcome screen
            welcomeScreen.style.transition = 'opacity 1s ease';
            welcomeScreen.style.opacity = '0';
            await new Promise(resolve => setTimeout(resolve, 1000));
            welcomeScreen.style.display = 'none';

            // Set camera to target position finally
            this.camera.position.z = targetZ;
            this.controls.update();
        }

        this.setupLoadingUI();
        // Ensure loading overlay is hidden on startup
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = 'none';
        }
        // Do not load default mesh immediately; wait for user upload
        // await this.loadMesh('/static/data/mesh_12.gltf');
        // Removed initial call to loadAndDisplayCRSMetadata to show meta.json info only after mesh load
        // await this.loadAndDisplayCRSMetadata('/static/data/meta.json');
        // Removed loadLabels call here to defer label loading until after mesh load
        this.setupEventListeners();

        // Setup upload mesh input and load button event listeners
        const meshUploadInput = document.getElementById('mesh-upload-input');
        const loadMeshButton = document.getElementById('load-mesh-button');
        const uploadMeshContainer = document.getElementById('upload-mesh-container');

        let selectedMeshURL = null;

        if (meshUploadInput && loadMeshButton && uploadMeshContainer) {
            meshUploadInput.addEventListener('change', (event) => {
                if (meshUploadInput.files && meshUploadInput.files.length > 0) {
                    loadMeshButton.disabled = false;
                    // Revoke previous object URL if any
                    if (this.currentMeshURL) {
                        URL.revokeObjectURL(this.currentMeshURL);
                        this.currentMeshURL = null;
                    }
                    this.currentMeshURL = URL.createObjectURL(meshUploadInput.files[0]);
                    // Store original filename without extension
                    const originalFilename = meshUploadInput.files[0].name;
                    const dotIndex = originalFilename.lastIndexOf('.');
                    this.currentMeshFilename = dotIndex !== -1 ? originalFilename.substring(0, dotIndex) : originalFilename;
                } else {
                    loadMeshButton.disabled = true;
                    if (this.currentMeshURL) {
                        URL.revokeObjectURL(this.currentMeshURL);
                        this.currentMeshURL = null;
                    }
                    this.currentMeshFilename = null;
                }
            });

            loadMeshButton.addEventListener('click', async () => {
                if (!this.currentMeshURL) {
                    alert('Please select a mesh file first.');
                    return;
                }
                try {
                    await this.uploadAndConvertMesh(meshUploadInput.files[0], uploadMeshContainer, meshUploadInput, loadMeshButton);
                } catch (error) {
                    console.error('Error uploading and converting mesh:', error);
                    alert('Failed to upload and convert the selected mesh file.');
                }
            });
        }

        // Add event listeners for window resize and fullscreen change
        window.addEventListener('resize', () => {
            this.onWindowResize();
        });

        document.addEventListener('fullscreenchange', () => {
            this.onWindowResize();
        });
        document.addEventListener('webkitfullscreenchange', () => {
            this.onWindowResize();
        });
        document.addEventListener('mozfullscreenchange', () => {
            this.onWindowResize();
        });
        document.addEventListener('MSFullscreenChange', () => {
            this.onWindowResize();
        });

        this.animate();

        // Add keydown event listener for Escape key to restart polygonal selection labeling
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' || event.key === 'Esc') {
                // Clear polygonal selection points and selected faces
                this.selectionPolygon = [];
                this.selectionPolygon3D = [];
                this.selectedFaces.clear();

                // Reset selectionFinalized flag to allow new selections
                this.selectionFinalized = false;

                // Remove polygon line and fill mesh from scene and dispose
                if (this.polygonLine) {
                    this.scene.remove(this.polygonLine);
                    this.polygonLine.geometry.dispose();
                    this.polygonLine.material.dispose();
                    this.polygonLine = null;
                }
                if (this.polygonFillMesh) {
                    this.scene.remove(this.polygonFillMesh);
                    this.polygonFillMesh.geometry.dispose();
                    this.polygonFillMesh.material.dispose();
                    this.polygonFillMesh = null;
                }

                // Clear face highlights
                this.clearSelectionHighlight();

                // Keep labeling mode active and label input visible
                if (this.labelingMode) {
                    this.controls.enabled = true;
                    // Do not disable labeling mode or hide label input container
                    // this.labelingMode = false;
                    // this.toggleLabelingButton.classList.remove('active');
                    // this.labelInputContainer.style.display = 'none';
                }
            }
        });
    }

    async uploadAndConvertMesh(file, uploadMeshContainer, meshUploadInput, loadMeshButton) {
        if (!file) {
            alert('No mesh file selected.');
            return;
        }

        if (!this.loadingOverlay || !this.loadingPercentage) {
            console.warn('Loading overlay or loading percentage element not found.');
            return;
        }

        this.loadingPercentage.innerText = '0%';
        this.loadingOverlay.style.display = 'flex';

        const formData = new FormData();
        formData.append('meshfile', file);

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/upload_mesh_and_convert', true);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    this.loadingPercentage.innerText = percentComplete + '%';
                }
            };

            xhr.onload = async () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        const convertedUrl = data.converted_url;

                        if (!convertedUrl) {
                            throw new Error('No converted mesh URL returned from server');
                        }

                        // Load the converted mesh using existing loadMesh method
                        await this.loadMesh(convertedUrl);

                        // Load meta.json info after mesh is loaded
                        await this.loadAndDisplayCRSMetadata('/static/data/meta.json');

                        // Load labels after mesh is loaded
                        await this.loadLabels();

                        this.controls.update();
                        this.renderer.render(this.scene, this.camera);

                        // Hide upload container and file input and load button after loading mesh
                        if (uploadMeshContainer) uploadMeshContainer.style.display = 'none';
                        if (meshUploadInput) meshUploadInput.style.display = 'none';
                        if (loadMeshButton) loadMeshButton.style.display = 'none';

                        resolve();
                    } catch (error) {
                        console.error('Error processing response:', error);
                        alert('Error processing server response: ' + error.message);
                        reject(error);
                    }
                } else {
                    try {
                        const errorData = JSON.parse(xhr.responseText);
                        alert('Error uploading or converting mesh: ' + (errorData.error || 'Unknown error'));
                    } catch {
                        alert('Error uploading or converting mesh: Unknown error');
                    }
                    reject(new Error('Upload failed with status ' + xhr.status));
                }
                if (this.loadingOverlay) {
                    this.loadingOverlay.style.display = 'none';
                }
            };

            xhr.onerror = () => {
                alert('Network error during mesh upload.');
                if (this.loadingOverlay) {
                    this.loadingOverlay.style.display = 'none';
                }
                reject(new Error('Network error during mesh upload'));
            };

            xhr.send(formData);
        });
    }

    async animateCameraZoomOut(startZ, endZ, duration) {
        return new Promise((resolve) => {
            const startTime = performance.now();
            const animate = (time) => {
                const elapsed = time - startTime;
                const t = Math.min(elapsed / duration, 1);
                // Ease out cubic
                const easeT = 1 - Math.pow(1 - t, 3);
                this.camera.position.z = startZ + (endZ - startZ) * easeT;
                this.controls.update();
                this.renderer.render(this.scene, this.camera);
                if (t < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            requestAnimationFrame(animate);
        });
    }

    async loadMesh(url) {
        return new Promise((resolve, reject) => {
            this.loader.load(url, (gltf) => {
                // Remove previous mesh and pivot from scene if they exist
                if (this.mesh) {
                    this.scene.remove(this.mesh);
                    this.mesh.traverse((child) => {
                        if (child.isMesh) {
                            child.geometry.dispose();
                            if (child.material) {
                                if (Array.isArray(child.material)) {
                                    child.material.forEach(mat => mat.dispose());
                                } else {
                                    child.material.dispose();
                                }
                            }
                        }
                    });
                    this.mesh = null;
                }
                if (this.pivot) {
                    this.scene.remove(this.pivot);
                    this.pivot = null;
                }

                this.mesh = gltf.scene;

                const box = new THREE.Box3().setFromObject(this.mesh);
                this.globalMinZ = box.min.z;
                this.globalMaxZ = box.max.z;

                this.updateZValueLabels();

                // Clear originalMaterials map before repopulating
                // Only clear if this is the first load or heatmap is off
                if (!this.heatmapEnabled) {
                    this.originalMaterials.clear();
                    this.originalVertexColors.clear();
                }

                this.mesh.traverse((child) => {
                    if (child.isMesh || child.isPoints) {
                        if (child.isMesh) {
                            child.geometry.computeVertexNormals();
                        }
                        // Only set originalMaterials if heatmap is off
                        if (!this.heatmapEnabled) {
                            this.originalMaterials.set(child, child.material);
                            // Store original vertex colors if present
                            if (child.geometry && child.geometry.attributes && child.geometry.attributes.color) {
                                const colorAttr = child.geometry.attributes.color;
                                // Copy color array to avoid mutation
                                const colorArrayCopy = new Float32Array(colorAttr.array.length);
                                colorArrayCopy.set(colorAttr.array);
                                this.originalVertexColors.set(child, colorArrayCopy);
                            } else {
                                // If no color attribute, store null or empty array
                                this.originalVertexColors.set(child, null);
                            }
                        }

                        // Set material transparent and opacity 0 for fade-in
                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(mat => {
                                    mat.transparent = true;
                                    mat.opacity = 0;
                                    mat.needsUpdate = true;
                                });
                            } else {
                                child.material.transparent = true;
                                child.material.opacity = 0;
                                child.material.needsUpdate = true;
                            }
                        }
                    }
                });

                const center = box.getCenter(new THREE.Vector3());
                this.controls.target.copy(center);
                this.controls.update();

                this.pivot = new THREE.Object3D();
                this.pivot.position.copy(center);
                this.scene.add(this.pivot);

                this.mesh.position.sub(center);
                // Removed vertical offset shift to avoid compensation complexity
                //this.mesh.position.y += 2;  // Move mesh upwards by 2 points
                this.pivot.add(this.mesh);

                console.log('Mesh position after centering:', this.mesh.position);
                console.log('Pivot position:', this.pivot.position);
                console.log('Camera position:', this.camera.position);

                // Temporarily set material opacity to 1 for visibility test
                this.mesh.traverse((child) => {
                    if (child.isMesh && child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(mat => {
                                mat.opacity = 1.0;
                                mat.transparent = false;
                                mat.needsUpdate = true;
                            });
                        } else {
                            child.material.opacity = 1.0;
                            child.material.transparent = false;
                            child.material.needsUpdate = true;
                        }
                    }
                });

                if (this.loadingOverlay) {
                    this.loadingOverlay.style.display = 'none';
                }

                // Start fade-in animation
                this.fadeInProgress = true;
                this.fadeInStartTime = performance.now();

                console.log('Mesh loaded successfully:', url);

                resolve();
            }, (xhr) => {
                if (this.loadingPercentage && xhr.lengthComputable) {
                    const percentComplete = Math.round((xhr.loaded / xhr.total) * 100);
                    this.loadingPercentage.innerText = ' ' + percentComplete + '%';
                }
            }, (error) => {
                console.error('Error loading mesh:', error);
                if (this.loadingOverlay) {
                    this.loadingOverlay.style.display = 'none';
                }
                reject(error);
            });
        });
    }

    async loadLabels() {
        try {
            // Use stored original mesh filename if available
            let baseName = 'default';
            if (this.currentMeshFilename) {
                baseName = this.currentMeshFilename;
            } else if (this.currentMeshURL) {
                // Fallback: extract from currentMeshURL
                const urlParts = this.currentMeshURL.split('/');
                const meshFilename = urlParts[urlParts.length - 1];
                const dotIndex = meshFilename.lastIndexOf('.');
                baseName = dotIndex !== -1 ? meshFilename.substring(0, dotIndex) : meshFilename;
            }

            // Construct label file path based on baseName
            let labelFilePath = `/static/data/${baseName}.json`;

            // Try to fetch label file for the mesh
            let response = await fetch(labelFilePath);
            if (!response.ok) {
                // Fallback to default label.json if specific file not found
                console.warn(`Label file ${labelFilePath} not found, falling back to default label.json`);
                response = await fetch('/static/data/label.json');
                if (!response.ok) {
                    console.warn('Default label.json not found or failed to load labels.');
                    this.labels = [];
                    this.labeledFacesMap = new Map();
                    this.populateLabelList();
                    return;
                }
            }

            const data = await response.json();

            if (Array.isArray(data)) {
                // Old format: data is array of labels
                this.labels = data;
                this.flaggedPoints.forEach(fp => {
                    if (fp.mesh) {
                        if (this.pivot) {
                            this.pivot.remove(fp.mesh);
                        } else {
                            this.scene.remove(fp.mesh);
                        }
                    }
                });
                this.flaggedPoints = [];
            } else if (typeof data === 'object' && data !== null) {
                // New format: object with labels and markedFeatures keys
                if (Array.isArray(data.labels)) {
                    this.labels = data.labels;
                } else {
                    this.labels = [];
                }

                // Clear existing flaggedPoints
                this.flaggedPoints.forEach(fp => {
                    if (fp.mesh) {
                        if (this.pivot) {
                            this.pivot.remove(fp.mesh);
                        } else {
                            this.scene.remove(fp.mesh);
                        }
                    }
                });
            this.flaggedPoints = [];

            if (Array.isArray(data.markedFeatures)) {
                data.markedFeatures.forEach(feature => {
                    const diamondGeometry = new THREE.OctahedronGeometry(0.2);
                    const diamondMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
                    const diamondMesh = new THREE.Mesh(diamondGeometry, diamondMaterial);
                    if (this.pivot) {
                        // Set position directly in pivot local coordinates
                        diamondMesh.position.set(feature.position.x, feature.position.y, feature.position.z);
                        this.pivot.add(diamondMesh);
                    } else {
                        diamondMesh.position.set(feature.position.x, feature.position.y, feature.position.z);
                        this.scene.add(diamondMesh);
                    }
                    this.flaggedPoints.push({ mesh: diamondMesh, label: feature.label });
                });
            }

            // Clear toggledLabels to prevent premature marker display on first load
            this.toggledLabels.clear();

            // Update marker visibility based on toggledLabels (none toggled initially)
            this.highlightMarkersByLabel();

            // If any toggled labels exist, highlight faces for the first toggled label
            if (this.toggledLabels.size > 0) {
                const firstLabel = this.toggledLabels.values().next().value;
                this.highlightFacesByLabel(firstLabel);
            }
            } else {
                this.labels = [];
                this.flaggedPoints = [];
            }

            console.log('Loaded labels:', this.labels);
            this.labeledFacesMap = new Map();
            for (const labelEntry of this.labels) {
                for (const faceIndex of labelEntry.faces) {
                    this.labeledFacesMap.set(faceIndex, labelEntry.label);
                }
            }
            console.log('Labeled faces map:', this.labeledFacesMap);

            // Populate label dropdown after loading labels
            this.populateLabelList();
        } catch (error) {
            console.error('Error loading labels:', error);
            this.labels = [];
            this.labeledFacesMap = new Map();
            this.flaggedPoints = [];
        }
    }

    onMouseMove(event) {
        // This function is replaced by click event handler for showing annotation on click
    }

    highlightLabeledFace(faceIndex) {
        if (this.currentHighlightedFace === faceIndex) return;
        this.currentHighlightedFace = faceIndex;

        console.log('Highlighting face:', faceIndex);

        this.mesh.traverse((child) => {
            if (child.isMesh) {
                const geometry = child.geometry;
                if (!geometry.index) return;

                const position = geometry.attributes.position;
                const index = geometry.index;

                const colors = new Float32Array(position.count * 3);
                for (let i = 0; i < position.count; i++) {
                    colors[i * 3] = 1.0; // default white
                    colors[i * 3 + 1] = 1.0;
                    colors[i * 3 + 2] = 1.0;
                }

                // Highlight the labeled face in white transparent color
                for (const [labelFaceIndex, label] of this.labeledFacesMap.entries()) {
                    if (labelFaceIndex === faceIndex) {
                        const a = index.getX(labelFaceIndex * 3);
                        const b = index.getX(labelFaceIndex * 3 + 1);
                        const c = index.getX(labelFaceIndex * 3 + 2);

                        colors[a * 3] = 1.0;
                        colors[a * 3 + 1] = 1.0;
                        colors[a * 3 + 2] = 1.0;

                        colors[b * 3] = 1.0;
                        colors[b * 3 + 1] = 1.0;
                        colors[b * 3 + 2] = 1.0;

                        colors[c * 3] = 1.0;
                        colors[c * 3 + 1] = 1.0;
                        colors[c * 3 + 2] = 1.0;
                    }
                }

                geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
                geometry.attributes.color.needsUpdate = true;

                if (child.material) {
                    child.material.vertexColors = true;
                    child.material.transparent = true;
                    child.material.opacity = 0.5;
                    child.material.needsUpdate = true;
                }
            }
        });
    }

    clearLabeledFaceHighlight() {
        if (this.currentHighlightedFace === null) return;
        this.currentHighlightedFace = null;

        this.mesh.traverse((child) => {
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

    async loadAndDisplayCRSMetadata(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const meta = await response.json();
            this.zUnits = meta.z_units || '';
            const crsText = 
                `CRS: ${meta.crs}\n` +
                `Type: ${meta.type || 'N/A'}\n` +
                `Origin: [${meta.origin.join(', ')}]\n` +
                `Z Units: ${this.zUnits}\n` +
                `Spatial Index: ${meta.spatial_index}`;
            if (this.crsMetadataDiv) {
                this.crsMetadataDiv.innerText = crsText;
            } else {
                console.warn('CRS metadata div not found');
            }
        } catch (error) {
            console.error('Failed to load CRS metadata:', error);
        }
    }

    setupEventListeners() {
        // Add event listener for Mark Feature button to toggle marking mode
        if (this.markFeatureButton) {
            console.log('Adding click event listener to Mark Feature button');
            this.markFeatureButton.addEventListener('click', () => {
                console.log('Mark Feature button clicked');
                this.markFeatureMode = !this.markFeatureMode;
                if (this.markFeatureMode) {
                    this.markFeatureButton.classList.add('active');
                    alert('Mark Feature mode activated. Click on the mesh to add green diamond markers.');
                } else {
                    this.markFeatureButton.classList.remove('active');
                    alert('Mark Feature mode deactivated.');
                }
            });
        }

        this.toggleButton.addEventListener('click', async () => {
            if (this.heatmapEnabled) {
                this.heatmapEnabled = false;
                this.toggleButton.classList.remove('active');
                this.originalMaterials.clear();
                if (this.loadingOverlay) {
                    this.loadingOverlay.style.display = 'flex';
                    this.loadingOverlay.style.justifyContent = 'center';
                    this.loadingOverlay.style.alignItems = 'center';
                    this.loadingOverlay.style.position = 'fixed';
                    this.loadingOverlay.style.top = '0';
                    this.loadingOverlay.style.left = '0';
                    this.loadingOverlay.style.width = '100vw';
                    this.loadingOverlay.style.height = '100vh';
                    this.loadingOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                    this.loadingOverlay.style.zIndex = '9999';
                }
                try {
                    await this.loadMesh(this.currentMeshURL || '/static/data/mesh_12.gltf');
                    this.controls.update();
                    this.renderer.render(this.scene, this.camera);
                } catch (error) {
                    console.error('Error reloading mesh:', error);
                } finally {
                    if (this.loadingOverlay) {
                        this.loadingOverlay.style.display = 'none';
                    }
                }
            } else {
                if (this.mesh) {
                    this.originalMaterials.clear();
                    this.mesh.traverse((child) => {
                        if (child.isMesh) {
                            this.originalMaterials.set(child, child.material);
                        }
                    });
                }
                this.applyVertexColorHeatmap(this.mesh);
                this.toggleButton.classList.add('active');
                this.heatmapEnabled = true;
            }
        });

        this.toggleLabelingButton.addEventListener('click', async () => {
            this.labelingMode = !this.labelingMode;
            const orbitControlsIcon = document.getElementById('toggle-orbitcontrols-icon');
            if (this.labelingMode) {
                this.toggleLabelingButton.classList.add('active');
                this.labelInputContainer.style.display = 'block';
                if (orbitControlsIcon) orbitControlsIcon.style.display = 'inline-block';
                this.selectionPolygon = [];
                this.selectedFaces.clear();
                this.clearSelectionHighlight();
                this.controls.enabled = false;
                this.controls.enabled = true;
                this.controls.enableZoom = true;
                this.controls.enableRotate = false;
                this.controls.enablePan = false;
                this.orbitControlsEnabledInLabeling = false; // Initialize orbit controls toggle state
                // Clear toggledLabels to prevent automatic showing of marked features
                this.toggledLabels.clear();
                // Reset showFeaturesActive to false to keep button state consistent
                this.showFeaturesActive = false;
                this.updateOrbitControlsIcon = () => {
                    const icon = document.getElementById('toggle-orbitcontrols-icon');
                    if (!icon) return;
                    if (this.orbitControlsEnabledInLabeling) {
                        icon.style.color = '#4CAF50'; // Green when enabled
                        icon.title = 'Disable Orbit Controls';
                    } else {
                        icon.style.color = '#eee'; // Default color when disabled
                        icon.title = 'Enable Orbit Controls';
                    }
                };
                this.updateOrbitControlsIcon();

                // Show spinner and reload mesh after toggling on labeling mode
                if (this.loadingOverlay) {
                    this.loadingOverlay.style.display = 'flex';
                    this.loadingOverlay.style.justifyContent = 'center';
                    this.loadingOverlay.style.alignItems = 'center';
                    this.loadingOverlay.style.position = 'fixed';
                    this.loadingOverlay.style.top = '0';
                    this.loadingOverlay.style.left = '0';
                    this.loadingOverlay.style.width = '100vw';
                    this.loadingOverlay.style.height = '100vh';
                    this.loadingOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                    this.loadingOverlay.style.zIndex = '9999';
                }
                try {
                    await this.loadMesh(this.currentMeshURL || '/static/data/mesh_12.gltf');
                    console.log('Pivot position after mesh reload:', this.pivot ? this.pivot.position.toArray() : 'No pivot');
                    console.log('Mesh position after mesh reload:', this.mesh ? this.mesh.position.toArray() : 'No mesh');
                    // Recreate diamond markers after mesh reload
                    if (this.pivot) {
                        // Store old flaggedPoints data
                        const oldFlaggedPoints = this.flaggedPoints.map(({ mesh, label }) => {
                            console.log(`Flagged point before reload - label: ${label}, position: ${mesh.position.toArray()}, parent: ${mesh.parent ? mesh.parent.type : 'none'}, material opacity: ${mesh.material.opacity}, transparent: ${mesh.material.transparent}`);
                            // Store position relative to pivot local coordinates
                            return { position: mesh.position.clone(), label };
                        });
                        // Remove old marker meshes from scene
                        this.flaggedPoints.forEach(({ mesh }) => {
                            if (mesh.parent) {
                                mesh.parent.remove(mesh);
                            }
                        });
                        // Clear flaggedPoints array
                        this.flaggedPoints = [];
                        // Recreate marker meshes and add to pivot and flaggedPoints
                        oldFlaggedPoints.forEach(({ position, label }) => {
                            const diamondGeometry = new THREE.OctahedronGeometry(0.2);
                            const diamondMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
                            const diamondMesh = new THREE.Mesh(diamondGeometry, diamondMaterial);
                            diamondMesh.position.copy(position);
                            this.pivot.add(diamondMesh);
                            this.flaggedPoints.push({ mesh: diamondMesh, label });
                        });
                    }
            // Update marker visibility based on toggledLabels
            // Call highlightMarkersByLabel once after clearing toggledLabels to update marker visibility
            this.highlightMarkersByLabel();
                    this.controls.update();
                    this.renderer.render(this.scene, this.camera);
                } catch (error) {
                    console.error('Error reloading mesh:', error);
                } finally {
                    if (this.loadingOverlay) {
                        this.loadingOverlay.style.display = 'none';
                    }
                }
            } else {
                this.toggleLabelingButton.classList.remove('active');
                this.labelInputContainer.style.display = 'none';
                if (orbitControlsIcon) orbitControlsIcon.style.display = 'none';
                this.selectionPolygon = [];
                this.selectedFaces.clear();
                this.clearSelectionHighlight();

                // Exit mark feature mode when labeling mode is toggled off
                this.markFeatureMode = false;
                if (this.markFeatureButton) {
                    this.markFeatureButton.classList.remove('active');
                }

                this.controls.enabled = true;
                this.controls.enabled = true;
                this.controls.enableZoom = true;
                this.controls.enableRotate = false;
                this.controls.enablePan = false;

                // Remove event listeners for pan key toggling
                if (this._panKeyDownListener) {
                    window.removeEventListener('keydown', this._panKeyDownListener);
                    this._panKeyDownListener = null;
                }
                if (this._panKeyUpListener) {
                    window.removeEventListener('keyup', this._panKeyUpListener);
                    this._panKeyUpListener = null;
                }

                // Show spinner and reload mesh after toggling off labeling mode
                if (this.loadingOverlay) {
                    this.loadingOverlay.style.display = 'flex';
                    this.loadingOverlay.style.justifyContent = 'center';
                    this.loadingOverlay.style.alignItems = 'center';
                    this.loadingOverlay.style.position = 'fixed';
                    this.loadingOverlay.style.top = '0';
                    this.loadingOverlay.style.left = '0';
                    this.loadingOverlay.style.width = '100vw';
                    this.loadingOverlay.style.height = '100vh';
                    this.loadingOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                    this.loadingOverlay.style.zIndex = '9999';
                }
                try {
                    await this.loadMesh(this.currentMeshURL || '/static/data/mesh_12.gltf');
                    // Re-add diamond markers after mesh reload
                    if (this.pivot) {
                        this.flaggedPoints.forEach(({ mesh }) => {
                            this.pivot.add(mesh);
                        });
                    }
                    this.controls.update();
                    this.renderer.render(this.scene, this.camera);
                } catch (error) {
                    console.error('Error reloading mesh:', error);
                } finally {
                    if (this.loadingOverlay) {
                        this.loadingOverlay.style.display = 'none';
                    }
                }
            }
        });

        this.fullscreenButton.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                this.container.requestFullscreen().catch((err) => {
                    console.error('Error attempting to enable fullscreen mode:', err);
                });
            } else {
                document.exitFullscreen();
            }
        });

// Add event listener for label list button to toggle dropdown visibility
const labelListButton = document.getElementById('label-list-button');
if (labelListButton && this.labelListDropdown) {
    labelListButton.addEventListener('click', () => {
        if (this.labelListDropdown.style.display === 'block') {
            this.labelListDropdown.style.display = 'none';
            // Hide export selected mesh button when dropdown is hidden
            const exportSelectedMeshButton = document.getElementById('export-selected-mesh');
            if (exportSelectedMeshButton) {
                exportSelectedMeshButton.style.display = 'none';
            }
        } else {
            this.labelListDropdown.style.display = 'block';
            // If currentlyHighlightedLabel is null but toggledLabels has entries, set it and update button visibility
            if (!this.currentlyHighlightedLabel && this.toggledLabels.size > 0) {
                this.currentlyHighlightedLabel = this.toggledLabels.values().next().value;
                this.updateExportSelectedMeshButtonVisibility();
            }
        }
    });
}

        this.selectionPolygon = [];
        this.selectionPolygon3D = [];
        this.selectedFaces = new Set();

        // Create 2D overlay canvas for polygon drawing
        this.overlayCanvas = document.createElement('canvas');
        this.overlayCanvas.style.position = 'absolute';
        this.overlayCanvas.style.top = '0';
        this.overlayCanvas.style.left = '0';
        this.overlayCanvas.style.pointerEvents = 'none'; // Allow clicks to pass through
        this.overlayCanvas.width = this.container.clientWidth;
        this.overlayCanvas.height = this.container.clientHeight;
        this.container.appendChild(this.overlayCanvas);
        this.overlayCtx = this.overlayCanvas.getContext('2d');

        // Removed redundant click event listener to prevent duplicate polygon point addition
        /*
        this.renderer.domElement.addEventListener('click', (event) => {
            if (!this.labelingMode) return;
            this.addPolygonPoint(event);
        });
        */

this.renderer.domElement.addEventListener('contextmenu', (event) => {
            if (!this.labelingMode) return;
            if (this.orbitControlsEnabledInLabeling) return; // suspend polygon selection in orbit controls mode
            event.preventDefault();
            this.sendPolygonToBackendForSelection();
        });

        // Add event listener for mouse click to add green diamond marker when markFeatureMode is active
this.renderer.domElement.addEventListener('click', (event) => {
            if (this.markFeatureMode) {
                event.preventDefault();

                console.log('Mark Feature mode active: adding green diamond marker.');

                const rect = this.renderer.domElement.getBoundingClientRect();
                const mouse = new THREE.Vector2(
                    ((event.clientX - rect.left) / rect.width) * 2 - 1,
                    -((event.clientY - rect.top) / rect.height) * 2 + 1
                );

                const raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(mouse, this.camera);

                const intersects = raycaster.intersectObject(this.mesh, true);
                if (intersects.length > 0) {
                    const intersectPoint = intersects[0].point;

                    // Create green diamond marker mesh
                    const diamondGeometry = new THREE.OctahedronGeometry(0.2);
                    const diamondMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
                    const diamondMesh = new THREE.Mesh(diamondGeometry, diamondMaterial);

                    if (this.pivot) {
                        const localPos = this.pivot.worldToLocal(intersectPoint.clone());
                        console.log('Intersect point:', intersectPoint);
                        console.log('Local position before offset:', localPos);
                        // Removed y offset for better precision
                        // localPos.y += 3;
                        diamondMesh.position.copy(localPos);
                        console.log('Diamond marker position:', diamondMesh.position);
                        this.pivot.add(diamondMesh);
                    } else {
                        diamondMesh.position.copy(intersectPoint);
                        // diamondMesh.position.y += 3;
                        this.scene.add(diamondMesh);
                    }

                    // Prompt user for feature name
                    let featureName = prompt('Enter name for this feature:', 'Feature');
                    if (featureName === null) {
                        // User clicked cancel, do not add marker
                        if (this.pivot) {
                            this.pivot.remove(diamondMesh);
                        } else {
                            this.scene.remove(diamondMesh);
                        }
                        return;
                    }
                    if (featureName.trim() === '') {
                        featureName = 'Feature';
                    }
                    featureName = featureName.trim();

                    // Add to flaggedPoints array with feature name as label
                    this.flaggedPoints.push({ mesh: diamondMesh, label: featureName });

            // Add label entry if not already present
            if (!this.labels.some(l => l.label === featureName)) {
                this.labels.push({ label: featureName, faces: [] });
            }
            // Add featureName to toggledLabels so marker shows by default
            this.toggledLabels.add(featureName);
            // Update or create annotation for this feature with Condition "In Phase"
            if (!this.annotations[featureName]) {
                this.annotations[featureName] = {
                    Condition: 'In Phase',
                    FindCode: '',
                    Description: '',
                    Remarks: '',
                    Dating: '',
                    Supervisor: '',
                    Date: '',
                    Photo_done: 'yes',
                    SiteName: '',
                    Phase: '',
                    CoordX: '',
                    CoordY: '',
                    CoordZ: '',
                    DimL: '',
                    DimW: '',
                    DimH: '',
                    WebpageAddress: [],
                    ImageUrls: []
                };
            } else {
                this.annotations[featureName].Condition = 'In Phase';
            }
            this.populateLabelList();

            // Highlight markers for the new feature label
            this.highlightMarkersByLabel(featureName);

                    alert(`Green diamond feature marker added and label "${featureName}" updated.`);

                    // Optionally deactivate marking mode after one placement
                    // this.markFeatureMode = false;
                    // this.markFeatureButton.classList.remove('active');
                }
                } else if (this.toggledLabels.size > 0) {
                    // Check if a diamond marker was clicked when show features is toggled on
                    event.preventDefault();

                    const rect = this.renderer.domElement.getBoundingClientRect();
                    const mouse = new THREE.Vector2(
                        ((event.clientX - rect.left) / rect.width) * 2 - 1,
                        -((event.clientY - rect.top) / rect.height) * 2 + 1
                    );

                    const raycaster = new THREE.Raycaster();
                    raycaster.setFromCamera(mouse, this.camera);

                    // Raycast against diamond marker meshes
                    const markerMeshes = this.flaggedPoints.map(fp => fp.mesh);
                    const intersects = raycaster.intersectObjects(markerMeshes, true);

                    if (intersects.length > 0) {
                        const intersectedMesh = intersects[0].object;
                        // Find the label for the intersected marker mesh
                        const flaggedPoint = this.flaggedPoints.find(fp => fp.mesh === intersectedMesh);
                        if (flaggedPoint) {
                            console.log('Diamond marker clicked:', flaggedPoint.label);
                            this.showAnnotationModal(flaggedPoint.label);
                        }
                    }
                } else {
                    // Polygonal selection click behavior
                    if (!this.labelingMode) return;
                    if (this.orbitControlsEnabledInLabeling) {
                        // Suspend polygon selection when orbit controls are enabled
                        return;
                    }
                    if (this.selectionFinalized) {
                        if (!this.assignLabelDialogShown && this.selectedFaces.size > 0) {
                            this.assignLabelDialogShown = true;
                            this.showAssignLabelModal();
                        }
                    } else {
                        this.addPolygonPoint(event);
                    }
                }
            });
    }

    sendPolygonToBackendForSelection() {
        if (this.selectionPolygon.length < 3) {
            alert('Select at least 3 points to form a polygon.');
            this.selectionPolygon = [];
            if (this.polygonLine) {
                this.scene.remove(this.polygonLine);
                this.polygonLine.geometry.dispose();
                this.polygonLine.material.dispose();
                this.polygonLine = null;
            }
            return;
        }

        // Show progress bar when points are selected and processing starts
        this.showProgressBar();
        this.updateProgressBar(0);

        // Perform polygon face selection locally
        const polygonPoints = this.selectionPolygon.map(p => ({x: p.x, y: p.y}));

        this.selectedFaces.clear();

        let totalFaces = 0;
        let batchSize = 0;
        let processedFaces = 0;

        const processBatch = () => {
            const start = processedFaces;
            const end = Math.min(processedFaces + batchSize, totalFaces);

            for (let faceIndex = start; faceIndex < end; faceIndex++) {
                for (const child of this.mesh.children) {
                    if (!child.isMesh) continue;
                    const geometry = child.geometry;
                    if (!geometry || !geometry.index) continue;

                    const position = geometry.attributes.position;
                    const index = geometry.index;

                    if (faceIndex >= index.count / 3) {
                        faceIndex -= index.count / 3;
                        continue;
                    }

                    const a = index.getX(faceIndex * 3);
                    const b = index.getX(faceIndex * 3 + 1);
                    const c = index.getX(faceIndex * 3 + 2);

                    const vA = new THREE.Vector3().fromBufferAttribute(position, a);
                    const vB = new THREE.Vector3().fromBufferAttribute(position, b);
                    const vC = new THREE.Vector3().fromBufferAttribute(position, c);

                    // Project vertices to screen space
                    const screenA = vA.clone().project(this.camera);
                    const screenB = vB.clone().project(this.camera);
                    const screenC = vC.clone().project(this.camera);

                    // Convert to 2D points
                    const pA = {x: screenA.x, y: screenA.y};
                    const pB = {x: screenB.x, y: screenB.y};
                    const pC = {x: screenC.x, y: screenC.y};

                    // Check if triangle centroid is inside polygon using pointInPolygon helper
                    const centroid = {
                        x: (pA.x + pB.x + pC.x) / 3,
                        y: (pA.y + pB.y + pC.y) / 3
                    };

                    if (this.pointInPolygon(centroid, polygonPoints)) {
                        this.selectedFaces.add(faceIndex);
                    }
                }
            }

            processedFaces = end;
            const progress = Math.floor((processedFaces / totalFaces) * 100);
            this.updateProgressBar(progress);

            if (processedFaces < totalFaces) {
                setTimeout(processBatch, 10);
            } else {
                // Add selected faces to finalizedSelectedFaces to keep highlight
                for (const faceIndex of this.selectedFaces) {
                    this.finalizedSelectedFaces.add(faceIndex);
                }
                this.highlightSelectedFaces();
                this.selectionPolygon = [];
                if (this.polygonLine) {
                    this.scene.remove(this.polygonLine);
                    this.polygonLine.geometry.dispose();
                    this.polygonLine.material.dispose();
                    this.polygonLine = null;
                }
                this.hideProgressBar();
                this.finalizeSelection();
            }
        };

        // Calculate totalFaces and batchSize before starting
        totalFaces = 0;
        for (const child of this.mesh.children) {
            if (!child.isMesh) continue;
            const geometry = child.geometry;
            if (!geometry || !geometry.index) continue;
            totalFaces += geometry.index.count / 3;
        }
        batchSize = Math.max(1, Math.floor(totalFaces / 20));

        processBatch();
    }

    addPolygonPoint(event) {
        console.log('addPolygonPoint called. selectionFinalized:', this.selectionFinalized);
        if (this.selectionFinalized) {
            console.log('Selection is finalized. Ignoring addPolygonPoint call.');
            // Prevent adding points after selection is finalized
            return;
        }
        const rect = this.renderer.domElement.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Check if point is inside mesh screen bounding box
        if (!this.meshScreenBoundingBox) {
            this.computeMeshScreenBoundingBox();
        }
        if (!this.isPointInsideBoundingBox(x, y, this.meshScreenBoundingBox)) {
            // Ignore points outside mesh area
            return;
        }

        // Add original point to 2D polygon array
        this.selectionPolygon.push(new THREE.Vector2(x, y));

        // Convert screen point to 3D pivot local coordinates and add to selectionPolygon3D
        const ndcVector = new THREE.Vector3(x, y, 0);
        ndcVector.unproject(this.camera);
        let localPoint = ndcVector;
        if (this.pivot) {
            localPoint = this.pivot.worldToLocal(ndcVector.clone());
        }
        this.selectionPolygon3D.push(localPoint);

        // Cache raycast intersection point for this polygon point
        if (!this.raycastCache) {
            this.raycastCache = new Map();
        }
        const key = `${x.toFixed(5)},${y.toFixed(5)}`;
        if (!this.raycastCache.has(key)) {
            const raycaster = new THREE.Raycaster();
            const ndc = new THREE.Vector3(x, y, 0);
            raycaster.setFromCamera(new THREE.Vector2(ndc.x, ndc.y), this.camera);
            const intersects = raycaster.intersectObject(this.mesh, true);
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

        // Update 3D polygon fill mesh and outline line
        this.update3DPolygonFillMesh();
        this.update3DPolygonOutlineLine();

        this.highlightSelectionPolygon();
    }

    update3DPolygonFillMesh() {
        if (this.selectionPolygon3D.length < 3) {
            if (this.polygonFillMesh) {
                this.scene.remove(this.polygonFillMesh);
                this.polygonFillMesh.geometry.dispose();
                this.polygonFillMesh.material.dispose();
                this.polygonFillMesh = null;
            }
            return;
        }

        // Polygon fill mesh disabled as per user request to remove fill from polygon selection
        if (this.polygonFillMesh) {
            this.scene.remove(this.polygonFillMesh);
            this.polygonFillMesh.geometry.dispose();
            this.polygonFillMesh.material.dispose();
            this.polygonFillMesh = null;
        }
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

    computeMeshScreenBoundingBox() {
        if (!this.mesh) return;

        const box = new THREE.Box3().setFromObject(this.mesh);
        const vertices = [
            new THREE.Vector3(box.min.x, box.min.y, box.min.z),
            new THREE.Vector3(box.min.x, box.min.y, box.max.z),
            new THREE.Vector3(box.min.x, box.max.y, box.min.z),
            new THREE.Vector3(box.min.x, box.max.y, box.max.z),
            new THREE.Vector3(box.max.x, box.min.y, box.min.z),
            new THREE.Vector3(box.max.x, box.min.y, box.max.z),
            new THREE.Vector3(box.max.x, box.max.y, box.min.z),
            new THREE.Vector3(box.max.x, box.max.y, box.max.z),
        ];

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        for (const v of vertices) {
            const projected = v.clone().project(this.camera);
            if (projected.x < minX) minX = projected.x;
            if (projected.x > maxX) maxX = projected.x;
            if (projected.y < minY) minY = projected.y;
            if (projected.y > maxY) maxY = projected.y;
        }

        this.meshScreenBoundingBox = { minX, maxX, minY, maxY };
    }

    isPointInsideBoundingBox(x, y, box) {
        return x >= box.minX && x <= box.maxX && y >= box.minY && y <= box.maxY;
    }

    highlightSelectionPolygon() {
        // Disabled 2D overlay polygon outline as per user request to remove 2D overlay visualization
    }

    update3DPolygonOutlineLine() {
        if (this.selectionPolygon3D.length < 2) {
            if (this.polygonOutlineLine) {
                if (this.pivot) {
                    this.pivot.remove(this.polygonOutlineLine);
                } else {
                    this.scene.remove(this.polygonOutlineLine);
                }
                this.polygonOutlineLine.geometry.dispose();
                this.polygonOutlineLine.material.dispose();
                this.polygonOutlineLine = null;
            }
            return;
        }

        // Create array of points for line geometry, closing the loop
        const points = this.selectionPolygon3D.map(p => new THREE.Vector3(p.x, p.y, p.z));
        points.push(points[0].clone()); // Close the loop

        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        const material = new THREE.LineBasicMaterial({
            color: 0xff0000,
            linewidth: 2
        });

        const line = new THREE.Line(geometry, material);
        line.renderOrder = 10000;

        if (this.pivot) {
            this.pivot.add(line);
        } else {
            this.scene.add(line);
        }

        if (this.polygonOutlineLine) {
            if (this.pivot) {
                this.pivot.remove(this.polygonOutlineLine);
            } else {
                this.scene.remove(this.polygonOutlineLine);
            }
            this.polygonOutlineLine.geometry.dispose();
            this.polygonOutlineLine.material.dispose();
        }
        this.polygonOutlineLine = line;
    }

    finalizeSelection() {
        if (this.selectionPolygon3D.length < 3) {
            alert('Select at least 3 points to form a polygon.');
            this.selectionPolygon3D = [];
            if (this.polygonFillMesh) {
                this.scene.remove(this.polygonFillMesh);
                this.polygonFillMesh.geometry.dispose();
                this.polygonFillMesh.material.dispose();
                this.polygonFillMesh = null;
            }
            return;
        }
        // Remove 2D selection overlay
        if (this.selectionLineCanvas) {
            this.selectionLineCtx.clearRect(0, 0, this.selectionLineCanvas.width, this.selectionLineCanvas.height);
            this.selectionLineCanvas.style.display = 'none';
        }

        // Polygon fill mesh disabled as per user request to remove fill from polygon selection
        if (this.polygonFillMesh) {
            this.scene.remove(this.polygonFillMesh);
            this.polygonFillMesh.geometry.dispose();
            this.polygonFillMesh.material.dispose();
            this.polygonFillMesh = null;
        }

        // Remove polygon outline line after finalization
        if (this.polygonOutlineLine) {
            if (this.pivot) {
                this.pivot.remove(this.polygonOutlineLine);
            } else {
                this.scene.remove(this.polygonOutlineLine);
            }
            this.polygonOutlineLine.geometry.dispose();
            this.polygonOutlineLine.material.dispose();
            this.polygonOutlineLine = null;
        }

        // Clear polygon selection arrays to restart fresh after finalization
        this.selectionPolygon = [];
        this.selectionPolygon3D = [];

        // Remove only the 2D polygon outline canvas after showing finalized selection
        if (this.selectionLineCanvas) {
            this.selectionLineCtx.clearRect(0, 0, this.selectionLineCanvas.width, this.selectionLineCanvas.height);
            this.selectionLineCanvas.style.display = 'none';
        }

        // Set selectionFinalized flag to true to prevent further point additions
        this.selectionFinalized = true;
    }

    orderPolygonPointsClockwise(points) {
        // Calculate centroid
        let centroid = { x: 0, y: 0 };
        points.forEach(p => {
            centroid.x += p.x;
            centroid.y += p.y;
        });
        centroid.x /= points.length;
        centroid.y /= points.length;

        // Sort points by angle from centroid
        points.sort((a, b) => {
            const angleA = Math.atan2(a.y - centroid.y, a.x - centroid.x);
            const angleB = Math.atan2(b.y - centroid.y, b.x - centroid.x);
            return angleA - angleB;
        });

        return points;
    }

    updateSelectedFaces() {
        if (!this.mesh) return;

        this.selectedFaces.clear();

        const rect = this.renderer.domElement.getBoundingClientRect();
        const polygonScreenPoints = this.selectionPolygon3D.map(p3d => {
            const ndc = p3d.clone().applyMatrix4(this.pivot.matrixWorld).project(this.camera);
            return {
                x: ((ndc.x + 1) / 2) * rect.width,
                y: ((1 - ndc.y) / 2) * rect.height
            };
        });

        // Helper function to check polygon intersection using Separating Axis Theorem (SAT)
        function polygonsIntersect(poly1, poly2) {
            const polygons = [poly1, poly2];
            for (let i = 0; i < polygons.length; i++) {
                const polygon = polygons[i];
                for (let i1 = 0; i1 < polygon.length; i1++) {
                    const i2 = (i1 + 1) % polygon.length;
                    const p1 = polygon[i1];
                    const p2 = polygon[i2];

                    // Calculate the normal to the edge
                    const normal = { x: p2.y - p1.y, y: p1.x - p2.x };

                    // Project both polygons onto the normal
                    let minA = null, maxA = null;
                    for (const p of poly1) {
                        const projected = normal.x * p.x + normal.y * p.y;
                        if (minA === null || projected < minA) minA = projected;
                        if (maxA === null || projected > maxA) maxA = projected;
                    }

                    let minB = null, maxB = null;
                    for (const p of poly2) {
                        const projected = normal.x * p.x + normal.y * p.y;
                        if (minB === null || projected < minB) minB = projected;
                        if (maxB === null || projected > maxB) maxB = projected;
                    }

                    // Check for gap
                    if (maxA < minB || maxB < minA) {
                        return false; // No intersection
                    }
                }
            }
            return true; // Polygons intersect
        }

        this.mesh.traverse((child) => {
            if (child.isMesh) {
                const geometry = child.geometry;
                if (!geometry.index) return;

                const position = geometry.attributes.position;
                const index = geometry.index;

                for (let faceIndex = 0; faceIndex < index.count / 3; faceIndex++) {
                    const a = index.getX(faceIndex * 3);
                    const b = index.getX(faceIndex * 3 + 1);
                    const c = index.getX(faceIndex * 3 + 2);

                    const vA = new THREE.Vector3().fromBufferAttribute(position, a);
                    const vB = new THREE.Vector3().fromBufferAttribute(position, b);
                    const vC = new THREE.Vector3().fromBufferAttribute(position, c);

                    if (this.pivot) {
                        vA.applyMatrix4(this.pivot.matrixWorld);
                        vB.applyMatrix4(this.pivot.matrixWorld);
                        vC.applyMatrix4(this.pivot.matrixWorld);
                    }

                    const screenA_NDC = vA.clone().project(this.camera);
                    const screenB_NDC = vB.clone().project(this.camera);
                    const screenC_NDC = vC.clone().project(this.camera);

                    const facePolygon = [
                        {
                            x: ((screenA_NDC.x + 1) / 2) * rect.width,
                            y: ((1 - screenA_NDC.y) / 2) * rect.height
                        },
                        {
                            x: ((screenB_NDC.x + 1) / 2) * rect.width,
                            y: ((1 - screenB_NDC.y) / 2) * rect.height
                        },
                        {
                            x: ((screenC_NDC.x + 1) / 2) * rect.width,
                            y: ((1 - screenC_NDC.y) / 2) * rect.height
                        }
                    ];

                    if (polygonsIntersect(facePolygon, polygonScreenPoints)) {
                        this.selectedFaces.add(faceIndex);
                    }
                }
            }
        });

        this.highlightSelectedFaces();
    }

    pointInPolygon(point, polygon) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;

            const intersect = ((yi > point.y) !== (yj > point.y)) &&
                (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    highlightSelectedFaces() {
        this.mesh.traverse((child) => {
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

                // Combine transient and finalized selected faces for highlighting
                const combinedSelectedFaces = new Set([...this.selectedFaces, ...this.finalizedSelectedFaces]);

                // Save original colors before modifying
                const originalColors = this.originalVertexColors.get(child);
                if (!originalColors) {
                    this.originalVertexColors.set(child, new Float32Array(colors));
                }

                for (const faceIndex of combinedSelectedFaces) {
                    const a = index.getX(faceIndex * 3);
                    const b = index.getX(faceIndex * 3 + 1);
                    const c = index.getX(faceIndex * 3 + 2);

                    // Determine color based on label's Condition
                    const label = this.labeledFacesMap.get(faceIndex);
                    let r = 1.0, g = 0.0, bColor = 0.0; // default red
                    if (label && this.annotations[label] && this.annotations[label].Condition) {
                        if (this.annotations[label].Condition === 'In Phase') {
                            r = 0.0; g = 1.0; bColor = 0.0; // green
                        } else if (this.annotations[label].Condition === 'Not in Phase') {
                            r = 1.0; g = 0.0; bColor = 0.0; // red
                        }
                    }

                    colors[a * 3] = r;
                    colors[a * 3 + 1] = g;
                    colors[a * 3 + 2] = bColor;

                    colors[b * 3] = r;
                    colors[b * 3 + 1] = g;
                    colors[b * 3 + 2] = bColor;

                    colors[c * 3] = r;
                    colors[c * 3 + 1] = g;
                    colors[c * 3 + 2] = bColor;
                }

                geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
                geometry.attributes.color.needsUpdate = true;

                if (child.material) {
                    // Reuse original material to preserve appearance
                    if (this.originalMaterials.has(child)) {
                        child.material.dispose();
                        child.material = this.originalMaterials.get(child);
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
        this.mesh.traverse((child) => {
            if (child.isMesh) {
                const geometry = child.geometry;
                if (!geometry.attributes.position) return;

                // Restore original vertex colors if available
                if (this.originalVertexColors.has(child)) {
                    const originalColors = this.originalVertexColors.get(child);
                    if (originalColors) {
                        geometry.setAttribute('color', new THREE.BufferAttribute(originalColors, 3));
                    } else {
                        if (geometry.hasAttribute('color')) {
                            geometry.deleteAttribute('color');
                        }
                    }
                    geometry.attributes.color.needsUpdate = true;
                } else {
                    if (geometry.hasAttribute('color')) {
                        geometry.deleteAttribute('color');
                    }
                }

                if (child.material) {
                    child.material.vertexColors = !!this.originalVertexColors.get(child);
                    child.material.transparent = false;
                    child.material.opacity = 1.0;
                    child.material.needsUpdate = true;
                }
            }
        });
    }

    populateLabelList() {
        // Clear existing dropdown items
        this.labelListDropdown.innerHTML = '';

        // Get set of marked feature labels from flaggedPoints
        const markedFeatureLabels = new Set(this.flaggedPoints.map(fp => fp.label));

        // Create dropdown items for each label ID excluding marked feature labels
        for (const labelEntry of this.labels) {
            if (markedFeatureLabels.has(labelEntry.label)) {
                continue; // Skip marked feature labels
            }
            const item = document.createElement('div');
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.alignItems = 'center';
            item.style.padding = '5px 10px';
            item.style.cursor = 'pointer';

            // Create toggle checkbox for label
            const toggleCheckbox = document.createElement('input');
            toggleCheckbox.type = 'checkbox';
            toggleCheckbox.style.marginRight = '8px';
            toggleCheckbox.checked = this.toggledLabels.has(labelEntry.label);

toggleCheckbox.addEventListener('click', (event) => {
    event.stopPropagation();
    if (toggleCheckbox.checked) {
        this.toggledLabels.add(labelEntry.label);
        this.currentlyHighlightedLabel = labelEntry.label;  // Set currentlyHighlightedLabel to toggled label
        this.highlightMarkersByLabel();
        this.highlightFacesByLabels();
        this.updateExportSelectedMeshButtonVisibility();
    } else {
        this.toggledLabels.delete(labelEntry.label);
        // Clear highlight for this label immediately when toggled off
        this.clearHighlightForLabel(labelEntry.label);
        // If no toggled labels remain, clear currentlyHighlightedLabel, else set to first toggled label
        if (this.toggledLabels.size === 0) {
            this.currentlyHighlightedLabel = null;
        } else {
            this.currentlyHighlightedLabel = this.toggledLabels.values().next().value;
        }
        this.highlightMarkersByLabel();
        this.highlightFacesByLabels();
        this.updateExportSelectedMeshButtonVisibility();
    }
});

this.clearHighlightForLabel = function(label) {
    if (!this.mesh || !this.labels) return;
    const labelEntry = this.labels.find(l => l.label === label);
    if (!labelEntry) return;

    this.mesh.traverse((child) => {
        if (!child.isMesh) return;
        const geometry = child.geometry;
        if (!geometry || !geometry.index || !geometry.attributes.color) return;

        const index = geometry.index;
        const colorAttr = geometry.attributes.color;

        // Calculate face index offset for this child
        let faceIndexOffset = 0;
        for (const sibling of this.mesh.children) {
            if (sibling === child) break;
            if (sibling.geometry && sibling.geometry.index) {
                faceIndexOffset += sibling.geometry.index.count / 3;
            }
        }

        if (!this.originalVertexColors.has(child)) return;
        const originalColors = this.originalVertexColors.get(child);
        if (!originalColors) return;

        for (const globalFaceIndex of labelEntry.faces) {
            const localFaceIndex = globalFaceIndex - faceIndexOffset;
            if (localFaceIndex < 0 || localFaceIndex * 3 + 2 >= index.count) continue;

            const a = index.getX(localFaceIndex * 3);
            const b = index.getX(localFaceIndex * 3 + 1);
            const c = index.getX(localFaceIndex * 3 + 2);

            // Restore original colors for vertices a,b,c
            colorAttr.setXYZ(a,
                originalColors[a * 3],
                originalColors[a * 3 + 1],
                originalColors[a * 3 + 2]
            );
            colorAttr.setXYZ(b,
                originalColors[b * 3],
                originalColors[b * 3 + 1],
                originalColors[b * 3 + 2]
            );
            colorAttr.setXYZ(c,
                originalColors[c * 3],
                originalColors[c * 3 + 1],
                originalColors[c * 3 + 2]
            );
        }
        colorAttr.needsUpdate = true;
    });
}

            const labelText = document.createElement('span');
            labelText.textContent = labelEntry.label;
            labelText.style.flexGrow = '1';

            // Set label color based on Condition annotation
            const annotation = this.annotations[labelEntry.label];
            if (annotation && annotation.Condition) {
                if (annotation.Condition === 'In Phase') {
                    labelText.style.color = 'green';
                } else if (annotation.Condition === 'Not in Phase') {
                    labelText.style.color = 'red';
                }
            }

            // Removed click event listener on labelText to disable toggling label on label text click
            // labelText.addEventListener('click', () => {
            //     if (this.toggledLabels.has(labelEntry.label)) {
            //         this.toggledLabels.delete(labelEntry.label);
            //         this.highlightMarkersByLabel();
            //         this.highlightFacesByLabels();
            //     } else {
            //         this.toggledLabels.add(labelEntry.label);
            //         this.highlightMarkersByLabel();
            //         this.highlightFacesByLabels();
            //     }
            // });

            const deleteButton = document.createElement('button');
            deleteButton.textContent = '×';
            deleteButton.style.background = 'transparent';
            deleteButton.style.border = 'none';
            deleteButton.style.color = '#f00';
            deleteButton.style.cursor = 'pointer';
            deleteButton.style.fontWeight = 'bold';
            deleteButton.style.marginLeft = '10px';
            deleteButton.style.fontSize = '16px';
            deleteButton.title = 'Delete label';

            deleteButton.addEventListener('click', (event) => {
                event.stopPropagation();
                this.deleteLabel(labelEntry.label);
            });

            const annotationButton = document.createElement('button');
            annotationButton.textContent = 'Annotation';
            annotationButton.style.background = 'transparent';
            annotationButton.style.border = 'none';
            annotationButton.style.color = '#0af';
            annotationButton.style.cursor = 'pointer';
            annotationButton.style.fontWeight = 'normal';
            annotationButton.style.marginLeft = '10px';
            annotationButton.style.fontSize = '11px';
            annotationButton.title = 'Show annotation';

            annotationButton.addEventListener('click', (event) => {
                event.stopPropagation();
                this.showAnnotationModal(labelEntry.label);
            });

            item.appendChild(toggleCheckbox);
            item.appendChild(labelText);
            item.appendChild(deleteButton);
            item.appendChild(annotationButton);

            this.labelListDropdown.appendChild(item);
        }

        // Add a "Show features" button to toggle all marked feature labels
        const showFeaturesButton = document.createElement('button');
        showFeaturesButton.textContent = 'Show features';
        showFeaturesButton.style.margin = '5px 10px';
        showFeaturesButton.style.padding = '5px 10px';
        showFeaturesButton.style.cursor = 'pointer';
        showFeaturesButton.title = 'Toggle all marked feature labels';

        // Manage showFeaturesActive as a property of this (MeshViewer) to keep state consistent
        this.showFeaturesActive = false;

        showFeaturesButton.addEventListener('click', () => {
            this.showFeaturesActive = !this.showFeaturesActive;
            if (this.showFeaturesActive) {
                // Add all marked feature labels to toggledLabels
                markedFeatureLabels.forEach(label => this.toggledLabels.add(label));
            } else {
                // Remove all marked feature labels from toggledLabels
                markedFeatureLabels.forEach(label => this.toggledLabels.delete(label));
            }
            this.highlightMarkersByLabel();
            this.highlightFacesByLabels();
        });

        this.labelListDropdown.appendChild(showFeaturesButton);

        // Add a "Clear selection" option
        const clearItem = document.createElement('div');
        clearItem.textContent = 'Clear selection';
        clearItem.style.padding = '5px 10px';
        clearItem.style.cursor = 'pointer';
        clearItem.style.borderTop = '1px solid #444';
        clearItem.style.color = '#ccc';

        clearItem.addEventListener('click', async () => {
            this.selectedFaces.clear();
            this.clearSelectionHighlight();

            if (this.loadingOverlay) {
                this.loadingOverlay.style.display = 'flex';
                this.loadingOverlay.style.justifyContent = 'center';
                this.loadingOverlay.style.alignItems = 'center';
                this.loadingOverlay.style.position = 'fixed';
                this.loadingOverlay.style.top = '0';
                this.loadingOverlay.style.left = '0';
                this.loadingOverlay.style.width = '100vw';
                this.loadingOverlay.style.height = '100vh';
                this.loadingOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                this.loadingOverlay.style.zIndex = '9999';
            }

            try {
                await this.loadMesh(this.currentMeshURL || '/static/data/mesh_12.gltf');
                this.controls.update();
                this.renderer.render(this.scene, this.camera);
            } catch (error) {
                console.error('Error reloading mesh:', error);
            } finally {
                if (this.loadingOverlay) {
                    this.loadingOverlay.style.display = 'none';
                }
            }
        });

        this.labelListDropdown.appendChild(clearItem);
    }

    exportAnnotationsAsCSV() {
        if (!this.annotations || Object.keys(this.annotations).length === 0) {
            alert('No annotations available to export.');
            return;
        }

        // Filter annotations to only include labels present in current this.labels
        const currentLabelsSet = new Set(this.labels.map(labelEntry => labelEntry.label));
        const filteredAnnotations = {};
        for (const [label, annotation] of Object.entries(this.annotations)) {
            if (currentLabelsSet.has(label)) {
                filteredAnnotations[label] = annotation;
            }
        }

        // Define CSV headers
        const headers = [
            'SiteName',
            'Phase',
            'Label',
            'FindCode',
            'Description',
            'Condition',
            'Remarks',
            'Dating',
            'Supervisor',
            'Date',
            'Photo_done',
            'CoordX',
            'CoordY',
            'CoordZ',
            'DimL',
            'DimW',
            'DimH',
            'WebpageAddress',
            'ImageUrls'
        ];

        // Convert filtered annotations object to array of rows
        const rows = Object.entries(filteredAnnotations).map(([label, annotation]) => {
            // Join WebpageAddress array or string into a single string separated by semicolons
            let webpageAddressStr = '';
            if (annotation.WebpageAddress) {
                if (Array.isArray(annotation.WebpageAddress)) {
                    webpageAddressStr = annotation.WebpageAddress.join('; ');
                } else if (typeof annotation.WebpageAddress === 'string') {
                    webpageAddressStr = annotation.WebpageAddress;
                }
            }

            // Join ImageUrls array into a single string separated by semicolons
            let imageUrlsStr = '';
            if (annotation.ImageUrls && Array.isArray(annotation.ImageUrls)) {
                imageUrlsStr = annotation.ImageUrls.join('; ');
            }

            return [
                annotation.SiteName,
                annotation.Phase || '',
                label || '',
                annotation.FindCode || '',
                annotation.Description || '',
                annotation.Condition || '',
                annotation.Remarks || '',
                annotation.Dating || '',
                annotation.Supervisor || '',
                annotation.Date || '',
                annotation.Photo_done || '',
                annotation.CoordX || '',
                annotation.CoordY || '',
                annotation.CoordZ || '',
                annotation.DimL || '',
                annotation.DimW || '',
                annotation.DimH || '',
                webpageAddressStr,
                imageUrlsStr
            ];
        });

        // Create CSV content
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        ].join('\r\n');

        // Create a Blob and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Use current mesh filename for download filename if available
        let filename = 'annotations.csv';
        if (this.currentMeshFilename) {
            filename = `${this.currentMeshFilename}_annotations.csv`;
        }
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    updateExportSelectedMeshButtonVisibility() {
        const exportButton = document.getElementById('export-selected-mesh');
        if (!exportButton) return;

        // Show export button if at least one label is toggled
        if (this.toggledLabels && this.toggledLabels.size > 0) {
            exportButton.style.display = 'inline-block';
        } else {
            exportButton.style.display = 'none';
        }
    }

    exportSelectedMeshAsPLY() {
        this.showProgressBar();
        this.updateProgressBar(0);

        if (!this.labels || this.labels.length === 0) {
            alert('No labels available for export.');
            this.hideProgressBar();
            return;
        }

        // Aggregate all faces from toggled labels only
        const allFaces = new Set();
        for (const labelEntry of this.labels) {
            if (this.toggledLabels.has(labelEntry.label)) {
                for (const faceIndex of labelEntry.faces) {
                    allFaces.add(faceIndex);
                }
            }
        }

        if (allFaces.size === 0) {
            alert('No faces found for export.');
            this.hideProgressBar();
            return;
        }

        // Collect vertices, faces, and vertex colors for all faces in allFaces
        let vertices = [];
        let faces = [];
        let vertexColors = [];
        let vertexMap = new Map(); // Map original vertex index to new index
        let vertexCount = 0;

        // Traverse mesh children to collect geometry data
        this.mesh.traverse((child) => {
            if (!child.isMesh) return;
            const geometry = child.geometry;
            if (!geometry || !geometry.index || !geometry.attributes.position) return;

            const position = geometry.attributes.position;
            const index = geometry.index;
            const colorAttr = geometry.attributes.color;

            // Calculate face index offset for this child
            let faceIndexOffset = 0;
            for (const sibling of this.mesh.children) {
                if (sibling === child) break;
                if (sibling.geometry && sibling.geometry.index) {
                    faceIndexOffset += sibling.geometry.index.count / 3;
                }
            }

            // For each face in allFaces, collect vertices, faces, and colors
            for (const globalFaceIndex of allFaces) {
                const localFaceIndex = globalFaceIndex - faceIndexOffset;
                if (localFaceIndex < 0 || localFaceIndex * 3 + 2 >= index.count) continue;

                const a = index.getX(localFaceIndex * 3);
                const b = index.getX(localFaceIndex * 3 + 1);
                const c = index.getX(localFaceIndex * 3 + 2);

                // Map vertices to new indices and collect colors
                const indices = [a, b, c].map((origIndex) => {
                    if (!vertexMap.has(origIndex)) {
                        const vx = position.getX(origIndex);
                        const vy = position.getY(origIndex);
                        const vz = position.getZ(origIndex);
                        vertices.push([vx, vy, vz]);

                        // Use original vertex colors if available, else material color, else white
                        let colorToUse = [255, 255, 255];
                        if (this.originalVertexColors.has(child) && this.originalVertexColors.get(child)) {
                            const originalColors = this.originalVertexColors.get(child);
                            colorToUse = [
                                Math.floor(originalColors[origIndex * 3] * 255),
                                Math.floor(originalColors[origIndex * 3 + 1] * 255),
                                Math.floor(originalColors[origIndex * 3 + 2] * 255)
                            ];
                        } else if (this.originalMaterials.has(child)) {
                            const mat = this.originalMaterials.get(child);
                            if (mat.color) {
                                colorToUse = [
                                    Math.floor(mat.color.r * 255),
                                    Math.floor(mat.color.g * 255),
                                    Math.floor(mat.color.b * 255)
                                ];
                            }
                        } else if (colorAttr) {
                            colorToUse = [
                                Math.floor(colorAttr.getX(origIndex) * 255),
                                Math.floor(colorAttr.getY(origIndex) * 255),
                                Math.floor(colorAttr.getZ(origIndex) * 255)
                            ];
                        }

                        vertexColors.push(colorToUse);

                        vertexMap.set(origIndex, vertexCount);
                        vertexCount++;
                    }
                    return vertexMap.get(origIndex);
                });

                faces.push(indices);
            }
        });

        if (vertices.length === 0 || faces.length === 0) {
            alert('No geometry data found for export.');
            this.hideProgressBar();
            return;
        }

        // Build PLY file content with vertex colors
        let plyContent = '';
        plyContent += 'ply\n';
        plyContent += 'format ascii 1.0\n';
        plyContent += `element vertex ${vertices.length}\n`;
        plyContent += 'property float x\n';
        plyContent += 'property float y\n';
        plyContent += 'property float z\n';
        plyContent += 'property uchar red\n';
        plyContent += 'property uchar green\n';
        plyContent += 'property uchar blue\n';
        plyContent += `element face ${faces.length}\n`;
        plyContent += 'property list uchar int vertex_indices\n';
        plyContent += 'end_header\n';

        for (let i = 0; i < vertices.length; i++) {
            const v = vertices[i];
            const color = vertexColors[i] || [255, 255, 255];
            plyContent += `${v[0]} ${v[1]} ${v[2]} ${color[0]} ${color[1]} ${color[2]}\n`;
        }

        for (const f of faces) {
            plyContent += `3 ${f[0]} ${f[1]} ${f[2]}\n`;
        }

        // Trigger download
        const blob = new Blob([plyContent], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `selected_toggled_labels_export.ply`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.updateProgressBar(100);
        this.hideProgressBar();
        alert('Mesh Successfully Exported');
    }

highlightFacesByLabels() {
        if (!this.mesh || !this.labels) return;

        // Clear previous selection to highlight only toggled labels' faces
        this.selectedFaces.clear();
        this.finalizedSelectedFaces.clear();

        if (this.toggledLabels.size === 0) {
            // No toggled labels, clear highlights and return
            this.clearSelectionHighlight();
            this.currentlyHighlightedLabel = null;
            this.updateExportSelectedMeshButtonVisibility();
            return;
        }

        // Add faces of all toggled labels to finalizedSelectedFaces set for finalized selection color
        for (const label of this.toggledLabels) {
            const labelEntry = this.labels.find(l => l.label === label);
            if (!labelEntry) continue;
            for (const faceIndex of labelEntry.faces) {
                this.finalizedSelectedFaces.add(faceIndex);
            }
        }

        // Highlight selected faces
        this.highlightSelectedFaces();

        // Set currentlyHighlightedLabel to first toggled label if any toggled labels exist
        if (this.toggledLabels.size === 1) {
            this.currentlyHighlightedLabel = this.toggledLabels.values().next().value;
        } else {
            this.currentlyHighlightedLabel = null;
        }
        this.updateExportSelectedMeshButtonVisibility();
    }

    deleteLabel(label) {
        console.log('deleteLabel called with label:', label);

        // Delete associated image file if present
        if (this.annotations && this.annotations.hasOwnProperty(label)) {
            const annotation = this.annotations[label];
            if (annotation.ImageUrl) {
                // Extract filename from ImageUrl (assumed format: /static/uploads/annotations/filename)
                const parts = annotation.ImageUrl.split('/');
                const filename = parts[parts.length - 1];
                fetch('/delete_annotation_image', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ filename })
                }).then(response => {
                    if (!response.ok) {
                        console.error('Failed to delete image file:', filename);
                    } else {
                        console.log('Image file deleted:', filename);
                    }
                }).catch(error => {
                    console.error('Error deleting image file:', error);
                });
            }
        }

        // Remove label entry from labels array
        this.labels = this.labels.filter(l => l.label !== label);
        console.log('Updated labels array after deletion:', this.labels);

        // Remove faces associated with this label from labeledFacesMap
        for (const [faceIndex, faceLabel] of this.labeledFacesMap.entries()) {
            if (faceLabel === label) {
                this.labeledFacesMap.delete(faceIndex);
            }
        }
        console.log('Updated labeledFacesMap after deletion:', this.labeledFacesMap);

        // Remove annotation for the deleted label
        if (this.annotations && this.annotations.hasOwnProperty(label)) {
            delete this.annotations[label];
            // Save updated annotations to backend
            fetch('/save_annotations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.annotations)
            }).then(response => {
                if (!response.ok) {
                    throw new Error('Failed to save annotations after label deletion');
                }
                return response.json();
            }).then(data => {
                console.log('Annotations saved after label deletion:', data);
            }).catch(error => {
                console.error('Error saving annotations after label deletion:', error);
            });
        }

        // If the deleted label was currently highlighted, clear highlight
        if (this.currentlyHighlightedLabel === label) {
            this.selectedFaces.clear();
            this.finalizedSelectedFaces.clear();
            this.clearSelectionHighlight();
            this.currentlyHighlightedLabel = null;
            console.log('Cleared highlights for deleted label');
        }

        // Update the label dropdown UI
        this.populateLabelList();
        console.log('Updated label dropdown UI after deletion');

        // Save updated labels to backend
        console.log('Sending updated labels to backend:', this.labels);
        let baseName = 'default';
        if (this.currentMeshFilename) {
            baseName = this.currentMeshFilename;
        } else if (this.currentMeshURL) {
            const urlParts = this.currentMeshURL.split('/');
            const meshFilename = urlParts[urlParts.length - 1];
            const dotIndex = meshFilename.lastIndexOf('.');
            baseName = dotIndex !== -1 ? meshFilename.substring(0, dotIndex) : meshFilename;
        }
        fetch(`/save_label/${baseName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(this.labels)
        }).then(response => {
            if (!response.ok) {
                throw new Error('Failed to save labels');
            }
            return response.json();
        }).then(async data => {
            console.log('Labels saved after deletion:', data);
            // Reload mesh after label deletion
            if (this.loadingOverlay) {
                this.loadingOverlay.style.display = 'flex';
                this.loadingOverlay.style.justifyContent = 'center';
                this.loadingOverlay.style.alignItems = 'center';
                this.loadingOverlay.style.position = 'fixed';
                this.loadingOverlay.style.top = '0';
                this.loadingOverlay.style.left = '0';
                this.loadingOverlay.style.width = '100vw';
                this.loadingOverlay.style.height = '100vh';
                this.loadingOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                this.loadingOverlay.style.zIndex = '9999';
            }
            try {
                await this.loadMesh(this.currentMeshURL || '/static/data/mesh_12.gltf');
                this.controls.update();
                this.renderer.render(this.scene, this.camera);
            } catch (error) {
                console.error('Error reloading mesh after label deletion:', error);
            } finally {
                if (this.loadingOverlay) {
                    this.loadingOverlay.style.display = 'none';
                }
            }
        }).catch(error => {
            console.error('Error saving labels after deletion:', error);
        });

        console.log(`Label "${label}" deleted.`);
    }
highlightMarkersByLabel() {
        const highlightedLabel = this.currentlyHighlightedLabel;
        console.log('highlightMarkersByLabel called. Currently highlighted label:', highlightedLabel);

        // Show or hide markers based on toggledLabels set
        this.flaggedPoints.forEach(({ mesh, label: markerLabel }) => {
            if (this.toggledLabels.has(markerLabel)) {
                if (markerLabel === highlightedLabel) {
                    console.log(`Highlighting marker for label ${markerLabel} in yellow`);
                    mesh.material.color.set(0xffff00); // highlight yellow
                    mesh.scale.set(1.5, 1.5, 1.5);
                    mesh.visible = true;
                } else {
                    console.log(`Setting marker for label ${markerLabel} to default green`);
                    mesh.material.color.set(0x00ff00); // default green
                    mesh.scale.set(1, 1, 1);
                    mesh.visible = true;
                }
                console.log(`Marker position: ${mesh.position.toArray()}, visible: ${mesh.visible}`);

                // Add hover event listeners for showing delete cross
                if (!mesh.userData.deleteCrossElement) {
                    // Create delete cross element
                    const deleteCross = document.createElement('div');
                    deleteCross.textContent = '×';
                    deleteCross.style.position = 'absolute';
                    deleteCross.style.backgroundColor = 'rgba(192, 57, 43, 0.8)';
                    deleteCross.style.color = 'white';
                    deleteCross.style.borderRadius = '50%';
                    deleteCross.style.width = '20px';
                    deleteCross.style.height = '20px';
                    deleteCross.style.display = 'none';
                    deleteCross.style.justifyContent = 'center';
                    deleteCross.style.alignItems = 'center';
                    deleteCross.style.cursor = 'pointer';
                    deleteCross.style.fontWeight = 'bold';
                    deleteCross.style.fontSize = '16px';
                    deleteCross.style.zIndex = '10000';
                    deleteCross.style.userSelect = 'none';

                    document.body.appendChild(deleteCross);
                    mesh.userData.deleteCrossElement = deleteCross;

                    // Mouse enter event to show delete cross
                    mesh.userData.onPointerOver = (event) => {
                        // Calculate screen position of marker mesh
                        const vector = mesh.position.clone();
                        if (this.pivot) {
                            mesh.getWorldPosition(vector);
                        }
                        vector.project(this.camera);

                        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
                        const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;

                        deleteCross.style.left = `${x}px`;
                        deleteCross.style.top = `${y}px`;
                        deleteCross.style.display = 'flex';

                        // Cancel any pending hide timeout to keep delete cross visible
                        if (mesh.userData.hideTimeout) {
                            clearTimeout(mesh.userData.hideTimeout);
                            mesh.userData.hideTimeout = null;
                        }
                    };

                    // Mouse leave event to hide delete cross after 5 seconds
                    mesh.userData.onPointerOut = (event) => {
                        // Start a 5-second timer to hide the delete cross
                        if (mesh.userData.hideTimeout) {
                            clearTimeout(mesh.userData.hideTimeout);
                        }
                        mesh.userData.hideTimeout = setTimeout(() => {
                            deleteCross.style.display = 'none';
                            mesh.userData.hideTimeout = null;
                        }, 1000);
                    };

                    // Click event on delete cross to delete marker
                    deleteCross.addEventListener('click', (e) => {
                        e.stopPropagation();
                        // Call deleteMarkedFeature method (to be implemented)
                        if (window.viewer) {
                            window.viewer.deleteMarkedFeature(markerLabel, mesh);
                        }
                    });

                    // Add event listeners to mesh for pointer events
                    mesh.userData.domElement = this.renderer.domElement;
                    mesh.userData.onPointerOverHandler = (event) => {
                        mesh.userData.onPointerOver(event);
                    };
                    mesh.userData.onPointerOutHandler = (event) => {
                        mesh.userData.onPointerOut(event);
                    };

                    // Add event listeners to renderer domElement for pointermove to detect hover
                    this.renderer.domElement.addEventListener('pointermove', (event) => {
                        const rect = this.renderer.domElement.getBoundingClientRect();
                        const mouse = new THREE.Vector2(
                            ((event.clientX - rect.left) / rect.width) * 2 - 1,
                            -((event.clientY - rect.top) / rect.height) * 2 + 1
                        );
                        const raycaster = new THREE.Raycaster();
                        raycaster.setFromCamera(mouse, this.camera);
                        const intersects = raycaster.intersectObject(mesh, true);
                        if (intersects.length > 0) {
                            mesh.userData.onPointerOverHandler(event);
                        } else {
                            mesh.userData.onPointerOutHandler(event);
                        }
                    });
                } else {
                    // Ensure delete cross is hidden initially
                    mesh.userData.deleteCrossElement.style.display = 'none';
                }
            } else {
                console.log(`Hiding marker for label ${markerLabel}`);
                mesh.visible = false;
                console.log(`Marker position: ${mesh.position.toArray()}, visible: ${mesh.visible}`);

                // Hide delete cross if exists
                if (mesh.userData.deleteCrossElement) {
                    mesh.userData.deleteCrossElement.style.display = 'none';
                }
            }
        });

        // Additional: Immediately hide all delete crosses when show features button is toggled off
        if (!this.showFeaturesActive) {
            this.flaggedPoints.forEach(({ mesh }) => {
                if (mesh.userData.deleteCrossElement) {
                    mesh.userData.deleteCrossElement.style.display = 'none';
                }
            });
        }
    }

    deleteMarkedFeature(label, mesh) {
        console.log('deleteMarkedFeature called for label:', label);

        // Remove marker mesh from scene and flaggedPoints array
        if (mesh.parent) {
            mesh.parent.remove(mesh);
        }
        this.flaggedPoints = this.flaggedPoints.filter(fp => fp.mesh !== mesh);

        // Remove label entry from labels array if it exists and has no faces
        const labelIndex = this.labels.findIndex(l => l.label === label);
        if (labelIndex !== -1) {
            // Check if label has faces
            if (this.labels[labelIndex].faces.length === 0) {
                this.labels.splice(labelIndex, 1);
            }
        }

        // Remove label from toggledLabels set
        this.toggledLabels.delete(label);

        // Remove annotation for the deleted marked feature label
        if (this.annotations && this.annotations.hasOwnProperty(label)) {
            delete this.annotations[label];
        }

        // Save updated labels and marked features to backend
        let baseName = 'default';
        if (this.currentMeshFilename) {
            baseName = this.currentMeshFilename;
        } else if (this.currentMeshURL) {
            const urlParts = this.currentMeshURL.split('/');
            const meshFilename = urlParts[urlParts.length - 1];
            const dotIndex = meshFilename.lastIndexOf('.');
            baseName = dotIndex !== -1 ? meshFilename.substring(0, dotIndex) : meshFilename;
        }

        const markedFeaturesData = this.flaggedPoints.map(fp => {
            const pos = fp.mesh.position;
            return {
                label: fp.label,
                position: { x: pos.x, y: pos.y, z: pos.z }
            };
        });

        const combinedData = {
            labels: this.labels,
            markedFeatures: markedFeaturesData
        };

        fetch(`/save_label/${baseName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(combinedData),
        }).then(response => {
            if (!response.ok) {
                console.warn('Failed to save labels and marked features after deletion:', response.statusText);
            } else {
                console.log('Labels and marked features saved successfully after deletion.');
            }
        }).catch(error => {
            console.error('Error saving labels and marked features after deletion:', error);
        });

        // Update UI
        this.populateLabelList();
        this.highlightMarkersByLabel();
        this.highlightFacesByLabel();

        alert(`Marked feature "${label}" deleted.`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.viewer = new MeshViewer(
        'viewer-container',
        'toggle-heatmap',
        'fullscreen-toggle',
        'toggle-labeling',
        'label-input-container',
        'label-input',
        'save-label'
    );
    window.viewer.init();
    window.viewer.setupSaveLabelListener();
    window.viewer.setupAssignLabelListener();

    // Setup export annotations CSV button click listener
    const exportButton = document.getElementById('export-annotations-csv');
    if (exportButton) {
        exportButton.addEventListener('click', () => {
            window.viewer.exportAnnotationsAsCSV();
        });
    }

    // Setup export selected mesh button click listener
    const exportSelectedMeshButton = document.getElementById('export-selected-mesh');
    if (exportSelectedMeshButton) {
        exportSelectedMeshButton.addEventListener('click', () => {
            console.log('Export Selected Mesh button clicked');
            window.viewer.exportSelectedMeshAsPLY();
        });
    }

    // Setup annotation button click listener
    window.viewer.annotateButton.addEventListener('click', () => {
        if (!window.viewer.labels || window.viewer.labels.length === 0) {
            alert('No labels available to annotate.');
            return;
        }
        // Get current label input value or first label if empty
        let currentLabel = window.viewer.labelInput.value.trim();
        if (!currentLabel) {
            if (window.viewer.labels.length > 0) {
                currentLabel = window.viewer.labels[0].label;
            } else {
                alert('No label selected or available.');
                return;
            }
        }
        // Show annotation modal
        window.viewer.showAnnotationModal(currentLabel);
    });

    // Setup annotation form submit listener
    window.viewer.annotationForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        await window.viewer.saveAnnotationFromForm();
    });

    // Setup annotation modal close button
    document.getElementById('close-annotation-modal').addEventListener('click', () => {
        window.viewer.hideAnnotationModal();
    });

    // Load annotations on startup
    window.viewer.loadAnnotations();

    // Remove override of highlightFacesByLabel to avoid calling non-existent method
    // The old highlightFacesByLabel method was replaced by highlightFacesByLabels
    // So remove this override to prevent runtime errors

    // Add event listener for "end session" button
    const endSessionButton = document.getElementById('end-session-button');
    if (endSessionButton) {
        endSessionButton.addEventListener('click', () => {
            // Refresh the window to show choose file page
            window.location.reload();
            console.log('End session button clicked - page reloaded');
        });
    }

    // Add event listener for "Remove All Webpage Images" button
    const removeWebpageImagesButton = document.getElementById('remove-webpage-image-previews');
    if (removeWebpageImagesButton) {
        removeWebpageImagesButton.addEventListener('click', () => {
            const webpageAddressInputsContainer = document.getElementById('webpage-address-inputs-container');
            if (!webpageAddressInputsContainer) return;

            // Remove all webpage URL input wrappers
            while (webpageAddressInputsContainer.firstChild) {
                webpageAddressInputsContainer.removeChild(webpageAddressInputsContainer.firstChild);
            }
            // Add one empty input field after clearing
            const wrapper = document.createElement('div');
            wrapper.className = 'webpage-address-input-wrapper';
            wrapper.style.display = 'flex';
            wrapper.style.flexDirection = 'column';
            wrapper.style.marginBottom = '8px';

            const inputRow = document.createElement('div');
            inputRow.style.display = 'flex';
            inputRow.style.alignItems = 'center';

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'webpage-address-input';
            input.placeholder = 'https://example.com';
            input.style.flexGrow = '1';
            input.style.marginRight = '8px';

            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = 'remove-webpage-address-input';
            removeButton.title = 'Remove URL';
            removeButton.style.backgroundColor = '#c0392b';
            removeButton.style.color = 'white';
            removeButton.style.border = 'none';
            removeButton.style.borderRadius = '4px';
            removeButton.style.cursor = 'pointer';
            removeButton.style.padding = '2px 6px';
            removeButton.textContent = '×';

            removeButton.addEventListener('click', () => {
                wrapper.remove();
            });

            inputRow.appendChild(input);
            inputRow.appendChild(removeButton);
            wrapper.appendChild(inputRow);
            webpageAddressInputsContainer.appendChild(wrapper);

            // Hide the remove all button after clearing
            removeWebpageImagesButton.style.display = 'none';
        });
    }

    // Add event listener for "Add URL" button to add new webpage address input field
    const addWebpageAddressInputButton = document.getElementById('add-webpage-address-input');
    const webpageAddressInputsContainer = document.getElementById('webpage-address-inputs-container');

    if (addWebpageAddressInputButton && webpageAddressInputsContainer) {
        addWebpageAddressInputButton.addEventListener('click', () => {
            const wrapper = document.createElement('div');
            wrapper.className = 'webpage-address-input-wrapper';
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.marginBottom = '4px';

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'webpage-address-input';
            input.placeholder = 'https://example.com';
            input.style.flexGrow = '1';
            input.style.marginRight = '8px';

            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = 'remove-webpage-address-input';
            removeButton.title = 'Remove URL';
            removeButton.style.backgroundColor = '#c0392b';
            removeButton.style.color = 'white';
            removeButton.style.border = 'none';
            removeButton.style.borderRadius = '4px';
            removeButton.style.cursor = 'pointer';
            removeButton.style.padding = '2px 6px';
            removeButton.textContent = '×';

            removeButton.addEventListener('click', () => {
                wrapper.remove();
            });

            wrapper.appendChild(input);
            wrapper.appendChild(removeButton);
            webpageAddressInputsContainer.appendChild(wrapper);
        });
    }

    // Add event listener for webpage address input to update webpage preview image
    const webpageAddressInput = document.getElementById('webpage-address');
    const webpageImagePreview = document.getElementById('webpage-image-preview');
    if (webpageAddressInput && webpageImagePreview) {
        webpageAddressInput.addEventListener('input', () => {
            const url = webpageAddressInput.value.trim();
            if (url) {
                // Basic URL validation
                try {
                    new URL(url);
                    webpageImagePreview.src = url;
                    webpageImagePreview.style.display = 'block';
                } catch (e) {
                    // Invalid URL, hide preview
                    webpageImagePreview.src = '';
                    webpageImagePreview.style.display = 'none';
                }
            } else {
                webpageImagePreview.src = '';
                webpageImagePreview.style.display = 'none';
            }
        });

        // Add click event listener to enlarge preview image in modal
        webpageImagePreview.style.cursor = 'pointer';
        webpageImagePreview.addEventListener('click', () => {
            console.log('webpageImagePreview clicked');
            // Create modal if not exists
            let modal = document.getElementById('webpage-preview-modal');
            if (!modal) {
                console.log('Creating modal for webpage preview');
                modal = document.createElement('div');
                modal.id = 'webpage-preview-modal';
                modal.style.position = 'fixed';
                modal.style.top = '0';
                modal.style.left = '0';
                modal.style.width = '100vw';
                modal.style.height = '100vh';
                modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                modal.style.display = 'flex';
                modal.style.justifyContent = 'center';
                modal.style.alignItems = 'center';
                modal.style.zIndex = '20000';  // Increased z-index to overlay annotation form

                // Create close button for modal
                const closeButton = document.createElement('span');
                closeButton.id = 'webpage-preview-close';
                closeButton.textContent = '×';
                closeButton.style.position = 'absolute';
                closeButton.style.top = '20px';
                closeButton.style.right = '30px';
                closeButton.style.fontSize = '40px';
                closeButton.style.fontWeight = 'bold';
                closeButton.style.color = 'white';
                closeButton.style.cursor = 'pointer';
                closeButton.style.userSelect = 'none';
                modal.appendChild(closeButton);

                const img = document.createElement('img');
                img.id = 'webpage-preview-modal-image';
                img.style.maxWidth = '90%';
                img.style.maxHeight = '90%';
                img.style.boxShadow = '0 0 20px white';
                img.style.borderRadius = '8px';
                modal.appendChild(img);

                // Close modal on click outside image
                modal.addEventListener('click', (event) => {
                    if (event.target === modal) {
                        modal.style.display = 'none';
                    }
                });

                // Close modal on close button click
                closeButton.addEventListener('click', () => {
                    modal.style.display = 'none';
                });

                document.body.appendChild(modal);
            }

            const modalImage = document.getElementById('webpage-preview-modal-image');
            modalImage.src = webpageImagePreview.src;
            modal.style.display = 'flex';
        });
    
    // Code to detect browser/tab close and send shutdown request
    window.addEventListener('beforeunload', async (event) => {
        try {
            await fetch('/shutdown', { method: 'POST', keepalive: true });
        } catch (error) {
            console.error('Error sending shutdown request:', error);
        }
    });
    }
});

// Add new methods to MeshViewer prototype for modal dialog and label assignment

MeshViewer.prototype.showAssignLabelModal = function() {
    if (document.getElementById('assign-label-modal')) {
        return;
    }

    const modal = document.createElement('div');
    modal.id = 'assign-label-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '10000';

    const dialog = document.createElement('div');
    dialog.style.backgroundColor = '#f0f0f0';
    dialog.style.padding = '25px';
    dialog.style.borderRadius = '10px';
    dialog.style.boxShadow = '0 4px 15px rgba(0,0,0,0.4)';
    dialog.style.textAlign = 'center';
    dialog.style.minWidth = '256px';

    const message = document.createElement('p');
    message.textContent = 'Assign Label?';
    message.style.marginBottom = '40px';
    message.style.fontSize = '20px';
    message.style.fontWeight = '700';
    message.style.color = '#333';

    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.display = 'flex';
    buttonsDiv.style.justifyContent = 'space-around';

    const yesButton = document.createElement('button');
    yesButton.textContent = 'Yes';
    yesButton.style.padding = '10px 20px';
    yesButton.style.fontSize = '18px';
    yesButton.style.cursor = 'pointer';
    yesButton.style.backgroundColor = '#28a745';
    yesButton.style.color = 'white';
    yesButton.style.border = 'none';
    yesButton.style.borderRadius = '5px';
    yesButton.style.transition = 'background-color 0.3s ease';

    yesButton.addEventListener('mouseenter', () => {
        yesButton.style.backgroundColor = '#218838';
    });
    yesButton.addEventListener('mouseleave', () => {
        yesButton.style.backgroundColor = '#28a745';
    });

    const noButton = document.createElement('button');
    noButton.textContent = 'No';
    noButton.style.padding = '10px 20px';
    noButton.style.fontSize = '18px';
    noButton.style.cursor = 'pointer';
    noButton.style.backgroundColor = '#dc3545';
    noButton.style.color = 'white';
    noButton.style.border = 'none';
    noButton.style.borderRadius = '5px';
    noButton.style.transition = 'background-color 0.3s ease';

    noButton.addEventListener('mouseenter', () => {
        noButton.style.backgroundColor = '#c82333';
    });
    noButton.addEventListener('mouseleave', () => {
        noButton.style.backgroundColor = '#dc3545';
    });

    buttonsDiv.appendChild(yesButton);
    buttonsDiv.appendChild(noButton);
    dialog.appendChild(message);
    dialog.appendChild(buttonsDiv);
    modal.appendChild(dialog);
    document.body.appendChild(modal);

    const cleanup = () => {
        this.assignLabelDialogShown = false;
        if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    };

    yesButton.addEventListener('click', () => {
        cleanup();
        this.showAssignLabelDialog();
    });

    noButton.addEventListener('click', () => {
        cleanup();
        this.clearSelectionAndReset();
    });
};

MeshViewer.prototype.showAssignLabelDialog = function() {
    let labelName = prompt('Enter label name:');
    if (labelName !== null) {
        labelName = labelName.trim();
        if (labelName.length > 0) {
            if (this.selectedFaces.size === 0) {
                alert('No faces selected to label.');
                return;
            }

            for (const labelEntry of this.labels) {
                labelEntry.faces = labelEntry.faces.filter(faceIndex => !this.selectedFaces.has(faceIndex));
            }

            this.labels = this.labels.filter(labelEntry => labelEntry.faces.length > 0);

            let labelEntry = this.labels.find(l => l.label === labelName);
            if (!labelEntry) {
                labelEntry = { label: labelName, faces: [] };
                this.labels.push(labelEntry);
            }

            const newFaces = Array.from(this.selectedFaces).filter(faceIndex => !labelEntry.faces.includes(faceIndex));
            const batchSize = 1000;
            for (let i = 0; i < newFaces.length; i += batchSize) {
                const batch = newFaces.slice(i, i + batchSize);
                labelEntry.faces.push(...batch);
            }

            for (const faceIndex of this.selectedFaces) {
                this.labeledFacesMap.set(faceIndex, labelName);
            }

            this.selectedFaces.clear();
            this.labelInput.value = '';

            this.highlightSelectedFaces();
            this.populateLabelList();

            alert(`Label "${labelName}" assigned to selected faces.`);
            this.clearSelectionAndReset();
        } else {
            this.clearSelectionAndReset();
        }
    } else {
        this.clearSelectionAndReset();
    }
};

MeshViewer.prototype.clearSelectionAndReset = function() {
    this.selectedFaces.clear();
    this.finalizedSelectedFaces.clear();
    this.clearSelectionHighlight();
    this.selectionFinalized = false;
    this.assignLabelDialogShown = false;
    this.labelInput.value = '';
};