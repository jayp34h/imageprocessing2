// Global variables
let selectedFile = null;
const API_KEY = ''; // PicsArt API key

// Enhancement settings
let enhancementSettings = {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    sharpness: 0
};

// DOM Elements
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const enhanceBtn = document.getElementById('enhance-btn');
const clearBtn = document.getElementById('clear-btn');
const resultContainer = document.getElementById('result');
const loadingContainer = document.getElementById('loading');
const downloadContainer = document.getElementById('download-container');
const originalPreview = document.getElementById('original-preview');
const processedPreview = document.getElementById('processed-preview');

// Slider elements
const brightnessSlider = document.getElementById('brightness');
const contrastSlider = document.getElementById('contrast');
const saturationSlider = document.getElementById('saturation');
const sharpnessSlider = document.getElementById('sharpness');

// Value display elements
const brightnessValue = document.getElementById('brightness-value');
const contrastValue = document.getElementById('contrast-value');
const saturationValue = document.getElementById('saturation-value');
const sharpnessValue = document.getElementById('sharpness-value');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // File input change event
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('highlight');
    }
    
    function unhighlight() {
        dropArea.classList.remove('highlight');
    }
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    // Button events
    enhanceBtn.addEventListener('click', enhanceImage);
    clearBtn.addEventListener('click', clearAll);
    
    // Slider events
    brightnessSlider.addEventListener('input', updateBrightness);
    contrastSlider.addEventListener('input', updateContrast);
    saturationSlider.addEventListener('input', updateSaturation);
    sharpnessSlider.addEventListener('input', updateSharpness);
});

// Handle file selection from input
function handleFileSelect(e) {
    const files = e.target.files;
    if (files && files.length > 0) {
        setSelectedFile(files[0]);
    }
}

// Handle dropped files
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
        setSelectedFile(files[0]);
    }
}

// Set the selected file and update UI
function setSelectedFile(file) {
    // Check if file is an image
    if (!file.type.match('image.*')) {
        showMessage('Only image files are allowed', 'error');
        return;
    }
    
    selectedFile = file;
    
    // Display original image preview
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.className = 'preview-img';
        originalPreview.innerHTML = '';
        originalPreview.appendChild(img);
    };
    reader.readAsDataURL(file);
    
    // Clear processed preview
    processedPreview.innerHTML = '';
    
    // Update button states
    updateButtonStates();
    
    // Hide result container if visible
    hideElement(resultContainer);
}

// Update button states based on selected file
function updateButtonStates() {
    if (selectedFile) {
        enhanceBtn.disabled = false;
        clearBtn.disabled = false;
    } else {
        enhanceBtn.disabled = true;
        clearBtn.disabled = true;
    }
}

// Clear all
function clearAll() {
    selectedFile = null;
    fileInput.value = '';
    originalPreview.innerHTML = '';
    processedPreview.innerHTML = '';
    resetSliders();
    updateButtonStates();
    hideElement(resultContainer);
}

// Reset all sliders to default values
function resetSliders() {
    brightnessSlider.value = 0;
    contrastSlider.value = 0;
    saturationSlider.value = 0;
    sharpnessSlider.value = 0;
    
    brightnessValue.textContent = '0';
    contrastValue.textContent = '0';
    saturationValue.textContent = '0';
    sharpnessValue.textContent = '0';
    
    enhancementSettings = {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        sharpness: 0
    };
}

// Update brightness value
function updateBrightness(e) {
    enhancementSettings.brightness = parseInt(e.target.value);
    brightnessValue.textContent = e.target.value;
}

// Update contrast value
function updateContrast(e) {
    enhancementSettings.contrast = parseInt(e.target.value);
    contrastValue.textContent = e.target.value;
}

// Update saturation value
function updateSaturation(e) {
    enhancementSettings.saturation = parseInt(e.target.value);
    saturationValue.textContent = e.target.value;
}

// Update sharpness value
function updateSharpness(e) {
    enhancementSettings.sharpness = parseInt(e.target.value);
    sharpnessValue.textContent = e.target.value;
}

// Enhance image using PicsArt API
async function enhanceImage() {
    if (!selectedFile) {
        showMessage('Please select an image', 'error');
        return;
    }
    
    showElement(loadingContainer);
    hideElement(resultContainer);
    
    try {
        const formData = new FormData();
        formData.append('image', selectedFile);
        
        // Add enhancement parameters
        formData.append('brightness', enhancementSettings.brightness);
        formData.append('contrast', enhancementSettings.contrast);
        formData.append('saturation', enhancementSettings.saturation);
        formData.append('sharpen', enhancementSettings.sharpness);
        
        // Using the edit endpoint for image enhancement
        const response = await fetch('https://api.picsart.io/tools/1.0/edit', {
            method: 'POST',
            headers: {
                'X-Picsart-API-Key': API_KEY
            },
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to enhance image');
        }
        
        const data = await response.json();
        const processedImageUrl = data.data.url;
        
        // Display processed image
        const img = document.createElement('img');
        img.src = processedImageUrl;
        img.className = 'preview-img';
        img.onload = function() {
            processedPreview.innerHTML = '';
            processedPreview.appendChild(img);
            
            // Create download link
            downloadContainer.innerHTML = '';
            const downloadLink = document.createElement('a');
            downloadLink.href = processedImageUrl;
            downloadLink.download = `${selectedFile.name.split('.')[0]}_enhanced.jpg`;
            downloadLink.className = 'download-btn';
            downloadLink.textContent = 'Download Enhanced Image';
            downloadContainer.appendChild(downloadLink);
            
            // Show result
            hideElement(loadingContainer);
            showElement(resultContainer);
        };
        
        img.onerror = function() {
            hideElement(loadingContainer);
            showMessage('Failed to load enhanced image', 'error');
        };
        
    } catch (error) {
        console.error('Error enhancing image:', error);
        hideElement(loadingContainer);
        showMessage(`Failed to enhance image: ${error.message}`, 'error');
    }
}

// Show message to user
function showMessage(message, type = 'info') {
    alert(message); // Simple alert for now, could be improved with a toast notification
}

// Show element
function showElement(element) {
    element.classList.remove('hidden');
}

// Hide element
function hideElement(element) {
    element.classList.add('hidden');
}
