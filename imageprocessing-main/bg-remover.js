// Global variables
let selectedFile = null;
const API_KEY = ''; // RemoveBG API key

// DOM Elements
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const removeBgBtn = document.getElementById('remove-bg-btn');
const clearBtn = document.getElementById('clear-btn');
const resultContainer = document.getElementById('result');
const loadingContainer = document.getElementById('loading');
const downloadContainer = document.getElementById('download-container');
const originalPreview = document.getElementById('original-preview');
const processedPreview = document.getElementById('processed-preview');

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
    removeBgBtn.addEventListener('click', removeBackground);
    clearBtn.addEventListener('click', clearAll);
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
        removeBgBtn.disabled = false;
        clearBtn.disabled = false;
    } else {
        removeBgBtn.disabled = true;
        clearBtn.disabled = true;
    }
}

// Clear all
function clearAll() {
    selectedFile = null;
    fileInput.value = '';
    originalPreview.innerHTML = '';
    processedPreview.innerHTML = '';
    updateButtonStates();
    hideElement(resultContainer);
}

// Remove background from image
async function removeBackground() {
    if (!selectedFile) {
        showMessage('Please select an image', 'error');
        return;
    }
    
    showElement(loadingContainer);
    hideElement(resultContainer);
    
    try {
        const formData = new FormData();
        formData.append('image_file', selectedFile);
        
        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: {
                'X-Api-Key': API_KEY
            },
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.errors[0].title || 'Failed to remove background');
        }
        
        const blob = await response.blob();
        const processedImageUrl = URL.createObjectURL(blob);
        
        // Display processed image
        const img = document.createElement('img');
        img.src = processedImageUrl;
        img.className = 'preview-img';
        processedPreview.innerHTML = '';
        processedPreview.appendChild(img);
        
        // Create download link
        downloadContainer.innerHTML = '';
        const downloadLink = document.createElement('a');
        downloadLink.href = processedImageUrl;
        downloadLink.download = `${selectedFile.name.split('.')[0]}_nobg.png`;
        downloadLink.className = 'download-btn';
        downloadLink.textContent = 'Download Image';
        downloadContainer.appendChild(downloadLink);
        
        // Show result
        hideElement(loadingContainer);
        showElement(resultContainer);
        
    } catch (error) {
        console.error('Error removing background:', error);
        hideElement(loadingContainer);
        showMessage(`Failed to remove background: ${error.message}`, 'error');
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
