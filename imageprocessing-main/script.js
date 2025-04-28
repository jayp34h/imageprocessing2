// Global variables
// Removed API_KEY as we'll use client-side PDF generation instead
let selectedFiles = [];

// DOM Elements
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');
const convertBtn = document.getElementById('convert-btn');
const clearBtn = document.getElementById('clear-btn');
const resultContainer = document.getElementById('result');
const loadingContainer = document.getElementById('loading');
const downloadContainer = document.getElementById('download-container');

// Utility function to load external scripts dynamically
function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

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
    convertBtn.addEventListener('click', convertToPDF);
    clearBtn.addEventListener('click', clearAllFiles);
});

// Handle file selection from input
function handleFileSelect(e) {
    const files = e.target.files;
    addFilesToList(files);
}

// Handle dropped files
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    addFilesToList(files);
}

// Add files to the list and update UI
function addFilesToList(files) {
    if (!files || files.length === 0) return;
    
    for (const file of files) {
        // Check if file is an image
        if (!file.type.match('image.*')) {
            showMessage('Only image files are allowed', 'error');
            continue;
        }
        
        // Check if file is already in the list
        if (selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
            continue;
        }
        
        selectedFiles.push(file);
        
        // Create list item
        const li = document.createElement('li');
        
        // File name span
        const nameSpan = document.createElement('span');
        nameSpan.className = 'file-name';
        nameSpan.textContent = file.name;
        
        // File size span
        const sizeSpan = document.createElement('span');
        sizeSpan.className = 'file-size';
        sizeSpan.textContent = formatFileSize(file.size);
        
        // Remove button
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '&times;';
        removeBtn.addEventListener('click', () => removeFile(file, li));
        
        // Append elements to list item
        li.appendChild(nameSpan);
        li.appendChild(sizeSpan);
        li.appendChild(removeBtn);
        
        // Append list item to file list
        fileList.appendChild(li);
    }
    
    updateButtonStates();
}

// Remove file from the list
function removeFile(file, listItem) {
    const index = selectedFiles.findIndex(f => f.name === file.name && f.size === file.size);
    if (index !== -1) {
        selectedFiles.splice(index, 1);
        listItem.remove();
        updateButtonStates();
    }
}

// Clear all files
function clearAllFiles() {
    selectedFiles = [];
    fileList.innerHTML = '';
    fileInput.value = '';
    updateButtonStates();
    hideElement(resultContainer);
}

// Update button states based on selected files
function updateButtonStates() {
    if (selectedFiles.length > 0) {
        convertBtn.disabled = false;
        clearBtn.disabled = false;
    } else {
        convertBtn.disabled = true;
        clearBtn.disabled = true;
    }
}

// Format file size for display
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Convert images to PDF using jsPDF (client-side conversion)
async function convertToPDF() {
    if (selectedFiles.length === 0) {
        showMessage('Please select at least one image', 'error');
        return;
    }
    
    showElement(loadingContainer);
    hideElement(resultContainer);
    
    try {
        // Load required libraries if not already loaded
        if (typeof jspdf === 'undefined') {
            console.log('Loading jsPDF library...');
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        }
        
        console.log('jsPDF loaded successfully');
        const { jsPDF } = window.jspdf;
        
        // Create a new PDF document
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm'
        });
        
        console.log(`Processing ${selectedFiles.length} images...`);
        
        // Process each image and add to PDF
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            console.log(`Processing image: ${file.name}`);
            
            // Convert image to data URL
            const dataUrl = await readFileAsDataURL(file);
            
            // Add a new page for each image except the first one
            if (i > 0) {
                pdf.addPage();
            }
            
            // Calculate dimensions to fit the image properly on the page
            const imgProps = await getImageDimensions(dataUrl);
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            
            // Calculate scaling to fit the image on the page with margins
            const margin = 10; // 10mm margin
            const maxWidth = pageWidth - (2 * margin);
            const maxHeight = pageHeight - (2 * margin);
            
            let imgWidth = imgProps.width;
            let imgHeight = imgProps.height;
            
            // Scale down if image is larger than page
            if (imgWidth > maxWidth || imgHeight > maxHeight) {
                const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
                imgWidth *= ratio;
                imgHeight *= ratio;
            }
            
            // Center the image on the page
            const x = (pageWidth - imgWidth) / 2;
            const y = (pageHeight - imgHeight) / 2;
            
            // Add the image to the PDF
            pdf.addImage(dataUrl, 'JPEG', x, y, imgWidth, imgHeight);
            
            console.log(`Added image ${i+1} of ${selectedFiles.length}`);
        }
        
        console.log('PDF generation completed');
        
        // Generate the PDF blob
        const pdfBlob = pdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        
        // Create download link
        downloadContainer.innerHTML = '';
        const downloadLink = document.createElement('a');
        downloadLink.href = pdfUrl;
        downloadLink.download = 'converted_images.pdf';
        downloadLink.className = 'download-btn';
        downloadLink.textContent = 'Download PDF';
        downloadContainer.appendChild(downloadLink);
        
        // Open the PDF in a new tab
        const viewLink = document.createElement('a');
        viewLink.href = pdfUrl;
        viewLink.target = '_blank';
        viewLink.className = 'view-btn';
        viewLink.textContent = 'View PDF';
        downloadContainer.appendChild(viewLink);
        
        // Show result
        hideElement(loadingContainer);
        showElement(resultContainer);
        
    } catch (error) {
        console.error('Error converting images to PDF:', error);
        hideElement(loadingContainer);
        showMessage(`Failed to convert images to PDF: ${error.message}`, 'error');
    }
}

// Helper function to read a file as data URL
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Helper function to get image dimensions
function getImageDimensions(dataUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve({
                width: img.width,
                height: img.height
            });
        };
        img.onerror = reject;
        img.src = dataUrl;
    });
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