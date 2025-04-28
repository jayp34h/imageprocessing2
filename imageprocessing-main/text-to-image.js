// Global variables
let generatedImageUrl = null;
const API_TOKEN = ''; // Hugging Face API token

// Generation settings
let generationSettings = {
    model: 'stabilityai/stable-diffusion-xl-base-1.0',
    steps: 30,
    guidanceScale: 7.5
};

// DOM Elements
const promptInput = document.getElementById('prompt-input');
const modelSelect = document.getElementById('model-select');
const stepsSlider = document.getElementById('num-steps');
const guidanceSlider = document.getElementById('guidance-scale');
const generateBtn = document.getElementById('generate-btn');
const clearBtn = document.getElementById('clear-btn');
const resultContainer = document.getElementById('result');
const loadingContainer = document.getElementById('loading');
const downloadContainer = document.getElementById('download-container');
const imagePreview = document.getElementById('image-preview');
const stepsValue = document.getElementById('steps-value');
const guidanceValue = document.getElementById('guidance-value');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Button events
    generateBtn.addEventListener('click', generateImage);
    clearBtn.addEventListener('click', clearAll);
    
    // Slider events
    stepsSlider.addEventListener('input', updateSteps);
    guidanceSlider.addEventListener('input', updateGuidance);
    
    // Model selection event
    modelSelect.addEventListener('change', updateModel);
});

// Update steps value
function updateSteps(e) {
    generationSettings.steps = parseInt(e.target.value);
    stepsValue.textContent = e.target.value;
}

// Update guidance scale value
function updateGuidance(e) {
    generationSettings.guidanceScale = parseFloat(e.target.value);
    guidanceValue.textContent = e.target.value;
}

// Update model selection
function updateModel(e) {
    generationSettings.model = e.target.value;
}

// Clear all
function clearAll() {
    promptInput.value = '';
    imagePreview.innerHTML = '<p class="placeholder-text">Your generated image will appear here</p>';
    generatedImageUrl = null;
    hideElement(resultContainer);
    
    // Reset sliders to default
    stepsSlider.value = 30;
    guidanceSlider.value = 7.5;
    modelSelect.value = 'stabilityai/stable-diffusion-xl-base-1.0';
    
    stepsValue.textContent = '30';
    guidanceValue.textContent = '7.5';
    
    generationSettings = {
        model: 'stabilityai/stable-diffusion-xl-base-1.0',
        steps: 30,
        guidanceScale: 7.5
    };
}

// Generate image using Hugging Face API
async function generateImage() {
    const prompt = promptInput.value.trim();
    
    if (!prompt) {
        showMessage('Please enter a text description', 'error');
        return;
    }
    
    showElement(loadingContainer);
    hideElement(resultContainer);
    
    try {
        // Prepare the API request based on the selected model
        const apiUrl = `https://api-inference.huggingface.co/models/${generationSettings.model}`;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    num_inference_steps: generationSettings.steps,
                    guidance_scale: generationSettings.guidanceScale
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        // Get the image as a blob
        const imageBlob = await response.blob();
        generatedImageUrl = URL.createObjectURL(imageBlob);
        
        // Display the generated image
        imagePreview.innerHTML = '';
        const img = document.createElement('img');
        img.src = generatedImageUrl;
        img.className = 'preview-img';
        imagePreview.appendChild(img);
        
        // Create download link
        downloadContainer.innerHTML = '';
        const downloadLink = document.createElement('a');
        downloadLink.href = generatedImageUrl;
        downloadLink.download = 'generated-image.png';
        downloadLink.className = 'download-btn';
        downloadLink.textContent = 'Download Image';
        downloadContainer.appendChild(downloadLink);
        
        // Show result
        hideElement(loadingContainer);
        showElement(resultContainer);
        
    } catch (error) {
        console.error('Error generating image:', error);
        hideElement(loadingContainer);
        showMessage(`Failed to generate image: ${error.message}`, 'error');
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
