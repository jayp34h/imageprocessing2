// Global variables
let selectedFile = null;
let originalWidth = 0;
let originalHeight = 0;
let aspectRatio = 0;

// DOM Elements
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const resizeBtn = document.getElementById('resize-btn');
const clearBtn = document.getElementById('clear-btn');
const resultContainer = document.getElementById('result');
const loadingContainer = document.getElementById('loading');
const downloadContainer = document.getElementById('download-container');
const originalPreview = document.getElementById('original-preview');
const processedPreview = document.getElementById('processed-preview');

// Dimension inputs
const widthInput = document.getElementById('width');
const heightInput = document.getElementById('height');
const maintainRatioCheckbox = document.getElementById('maintain-ratio');

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
    resizeBtn.addEventListener('click', resizeImage);
    clearBtn.addEventListener('click', clearAll);
    
    // Dimension input events
    widthInput.addEventListener('input', handleWidthChange);
    heightInput.addEventListener('input', handleHeightChange);
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
    
    // Create preview
    const reader = new FileReader();
    reader.onload = function(e) {
        // Create image element to get dimensions
        const img = new Image();
        img.onload = function() {
            originalWidth = img.width;
            originalHeight = img.height;
            aspectRatio = originalWidth / originalHeight;
            
            // Set initial dimensions in inputs
            widthInput.value = originalWidth;
            heightInput.value = originalHeight;
            
            // Create preview
            originalPreview.innerHTML = '';
            const previewImg = document.createElement('img');
            previewImg.src = e.target.result;
            previewImg.className = 'preview-img';
            originalPreview.appendChild(previewImg);
            
            // Show processed preview placeholder
            processedPreview.innerHTML = '<p class="placeholder-text">Resized image will appear here</p>';
            
            // Enable buttons
            resizeBtn.disabled = false;
            clearBtn.disabled = false;
            
            // Show preview container
            document.getElementById('preview-container').style.display = 'block';
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Handle width input change
function handleWidthChange() {
    if (maintainRatioCheckbox.checked && aspectRatio > 0) {
        const newWidth = parseInt(widthInput.value) || 0;
        heightInput.value = Math.round(newWidth / aspectRatio);
    }
}

// Handle height input change
function handleHeightChange() {
    if (maintainRatioCheckbox.checked && aspectRatio > 0) {
        const newHeight = parseInt(heightInput.value) || 0;
        widthInput.value = Math.round(newHeight * aspectRatio);
    }
}

// Resize the image
function resizeImage() {
    if (!selectedFile) {
        showMessage('Please select an image first', 'error');
        return;
    }
    
    const newWidth = parseInt(widthInput.value) || 0;
    const newHeight = parseInt(heightInput.value) || 0;
    
    if (newWidth <= 0 || newHeight <= 0) {
        showMessage('Width and height must be greater than 0', 'error');
        return;
    }
    
    // Show loading
    loadingContainer.classList.remove('hidden');
    resultContainer.classList.add('hidden');
    
    // Create a canvas to resize the image
    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    const ctx = canvas.getContext('2d');
    
    // Create image from file
    const img = new Image();
    img.onload = function() {
        // Draw resized image on canvas
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        
        // Get resized image data
        const resizedImageData = canvas.toDataURL('image/png');
        
        // Update processed preview
        processedPreview.innerHTML = '';
        const processedImg = document.createElement('img');
        processedImg.src = resizedImageData;
        processedImg.className = 'preview-img';
        processedPreview.appendChild(processedImg);
        
        // Create download link
        downloadContainer.innerHTML = '';
        const downloadLink = document.createElement('a');
        downloadLink.href = resizedImageData;
        downloadLink.download = `resized_${selectedFile.name.split('.')[0]}.png`;
        downloadLink.className = 'download-btn';
        downloadLink.innerHTML = 'Download Resized Image';
        downloadContainer.appendChild(downloadLink);
        
        // Hide loading and show result
        loadingContainer.classList.add('hidden');
        resultContainer.classList.remove('hidden');
    };
    
    // Load image from file
    const reader = new FileReader();
    reader.onload = function(e) {
        img.src = e.target.result;
    };
    reader.readAsDataURL(selectedFile);
}

// Clear all data and reset UI
function clearAll() {
    selectedFile = null;
    originalWidth = 0;
    originalHeight = 0;
    aspectRatio = 0;
    
    // Reset inputs
    fileInput.value = '';
    widthInput.value = '800';
    heightInput.value = '600';
    
    // Clear previews
    originalPreview.innerHTML = '';
    processedPreview.innerHTML = '';
    
    // Disable buttons
    resizeBtn.disabled = true;
    clearBtn.disabled = true;
    
    // Hide result
    resultContainer.classList.add('hidden');
    
    // Reset drop area
    dropArea.classList.remove('highlight');
}

// Show message to user
function showMessage(message, type = 'info') {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;
    
    document.querySelector('main').appendChild(messageElement);
    
    // Remove message after 3 seconds
    setTimeout(() => {
        messageElement.remove();
    }, 3000);
}