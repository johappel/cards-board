// Board Color Selection JavaScript
// Define predefined color palette for boards
const BOARD_COLORS = [
    { name: 'Light Blue', hex: '#f0f9ff', rgb: '240, 249, 255' },
    { name: 'Light Green', hex: '#f0fdf4', rgb: '240, 253, 244' },
    { name: 'Light Yellow', hex: '#fefce8', rgb: '254, 252, 232' },
    { name: 'Light Pink', hex: '#fdf2f8', rgb: '253, 242, 248' },
    { name: 'Light Purple', hex: '#faf5ff', rgb: '250, 245, 255' },
    { name: 'Light Gray', hex: '#f9fafb', rgb: '249, 250, 251' },
    
    { name: 'Sky Blue', hex: '#e0f2fe', rgb: '224, 242, 254' },
    { name: 'Mint Green', hex: '#dcfce7', rgb: '220, 252, 231' },
    { name: 'Warm Yellow', hex: '#fef3c7', rgb: '254, 243, 199' },
    { name: 'Rose Pink', hex: '#fce7f3', rgb: '252, 231, 243' },
    { name: 'Lavender', hex: '#f3e8ff', rgb: '243, 232, 255' },
    { name: 'Cool Gray', hex: '#f1f5f9', rgb: '241, 245, 249' },
    
    { name: 'Ocean Blue', hex: '#bae6fd', rgb: '186, 230, 253' },
    { name: 'Forest Green', hex: '#bbf7d0', rgb: '187, 247, 208' },
    { name: 'Sunset Orange', hex: '#fed7aa', rgb: '254, 215, 170' },
    { name: 'Coral Pink', hex: '#fbcfe8', rgb: '251, 207, 232' },
    { name: 'Amethyst', hex: '#ddd6fe', rgb: '221, 214, 254' },
    { name: 'Slate Gray', hex: '#e2e8f0', rgb: '226, 232, 240' },
    
    { name: 'Deep Blue', hex: '#93c5fd', rgb: '147, 197, 253' },
    { name: 'Emerald', hex: '#86efac', rgb: '134, 239, 172' },
    { name: 'Amber', hex: '#fbbf24', rgb: '251, 191, 36' },
    { name: 'Fuchsia', hex: '#f472b6', rgb: '244, 114, 182' },
    { name: 'Violet', hex: '#c084fc', rgb: '192, 132, 252' },
    { name: 'Dark Gray', hex: '#cbd5e1', rgb: '203, 213, 225' },
];

let selectedBoardColor = { hex: '#f5f7fa', rgb: '245, 247, 250' };
let boardTransparency = 80;

// Initialize board color selection
function initBoardColorSelection() {
    const palette = document.getElementById('board-color-palette');
    if (!palette) return;
    
    // Clear existing colors
    palette.innerHTML = '';
    
    // Add color options
    BOARD_COLORS.forEach((color, index) => {
        const colorOption = document.createElement('div');
        colorOption.className = 'board-color-option';
        colorOption.style.backgroundColor = color.hex;
        colorOption.dataset.hex = color.hex;
        colorOption.dataset.rgb = color.rgb;
        colorOption.title = color.name;
        
        colorOption.addEventListener('click', () => selectBoardColor(color, colorOption));
        palette.appendChild(colorOption);
    });
    
    // Initialize transparency slider
    const transparencySlider = document.getElementById('transparency-slider');
    const transparencyValue = document.getElementById('transparency-value');
    
    if (transparencySlider && transparencyValue) {
        transparencySlider.addEventListener('input', (e) => {
            boardTransparency = parseInt(e.target.value);
            transparencyValue.textContent = boardTransparency + '%';
            updateColorPreview();
        });
    }
    
    // Set default selection
    const defaultColor = BOARD_COLORS[5]; // Light Gray
    selectBoardColor(defaultColor, palette.children[5]);
}

// Select a board color
function selectBoardColor(color, element) {
    selectedBoardColor = color;
    
    // Update visual selection
    document.querySelectorAll('.board-color-option').forEach(option => {
        option.classList.remove('selected');
    });
    element.classList.add('selected');
    
    // Update hidden field for compatibility
    const hiddenColorField = document.getElementById('board-bg-color');
    if (hiddenColorField) {
        hiddenColorField.value = color.hex;
    }
    
    updateColorPreview();
}

// Update color preview
function updateColorPreview() {
    const previewSample = document.getElementById('color-preview-sample');
    const previewText = document.getElementById('color-preview-text');
    
    if (previewSample && previewText) {
        // Preview shows header transparency (white with transparency over board color)
        const headerAlpha = boardTransparency / 100;
        const headerRGBA = `rgba(255, 255, 255, ${headerAlpha})`;
        
        // Create layered preview: board color behind white transparent header
        previewSample.style.background = `linear-gradient(${headerRGBA}, ${headerRGBA}), ${selectedBoardColor.hex}`;
        previewText.textContent = `Header: ${headerRGBA} über Board: ${selectedBoardColor.hex}`;
    }
    
    // Update hidden transparency field
    const hiddenTransparencyField = document.getElementById('board-transparency');
    if (hiddenTransparencyField) {
        hiddenTransparencyField.value = boardTransparency;
    }
}

// Get current board background as RGBA (for board background)
function getCurrentBoardBackgroundRGBA() {
    const alpha = boardTransparency / 100;
    return `rgba(${selectedBoardColor.rgb}, ${alpha})`;
}

// Get current header background as white with transparency
function getCurrentHeaderRGBA() {
    const alpha = boardTransparency / 100;
    return `rgba(255, 255, 255, ${alpha})`;
}

// Get current board background hex (for backward compatibility)
function getCurrentBoardBackgroundHex() {
    return selectedBoardColor.hex;
}

// Load board color settings from board data
function loadBoardColorSettings(board) {
    if (!board) return;
    
    // Load background color
    if (board.backgroundColor) {
        // Try to find matching color in palette
        const matchingColor = BOARD_COLORS.find(color => color.hex === board.backgroundColor);
        if (matchingColor) {
            selectedBoardColor = matchingColor;
            const palette = document.getElementById('board-color-palette');
            if (palette) {
                const colorOption = Array.from(palette.children).find(option => 
                    option.dataset.hex === matchingColor.hex
                );
                if (colorOption) {
                    selectBoardColor(matchingColor, colorOption);
                }
            }
        }
    }
    
    // Load transparency
    if (board.backgroundTransparency !== undefined) {
        boardTransparency = board.backgroundTransparency;
        const transparencySlider = document.getElementById('transparency-slider');
        const transparencyValue = document.getElementById('transparency-value');
        
        if (transparencySlider) transparencySlider.value = boardTransparency;
        if (transparencyValue) transparencyValue.textContent = boardTransparency + '%';
    }
    
    updateColorPreview();
}

// Save board color settings to board data
function saveBoardColorSettings(board) {
    if (!board) return;
    
    board.backgroundColor = selectedBoardColor.hex;
    board.backgroundTransparency = boardTransparency;
    board.backgroundHex = selectedBoardColor.hex; // Full color for board background
    board.headerRGBA = getCurrentHeaderRGBA(); // White with transparency for header
}

// Apply board background style
function applyBoardBackgroundStyle() {
    const boardHeader = document.querySelector('.board-header');
    const boardView = document.getElementById('board-view');
    
    if (boardHeader) {
        // Header uses white with transparency to let board color show through
        boardHeader.style.backgroundColor = getCurrentHeaderRGBA();
    }
    
    if (boardView) {
        // Board background uses full color without transparency
        boardView.style.backgroundColor = selectedBoardColor.hex;
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize color selection when board settings modal is opened
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const modal = document.getElementById('board-settings-modal');
                if (modal && modal.classList.contains('show')) {
                    setTimeout(initBoardColorSelection, 100);
                }
            }
        });
    });
    
    const boardSettingsModal = document.getElementById('board-settings-modal');
    if (boardSettingsModal) {
        observer.observe(boardSettingsModal, { attributes: true });
    }
    
    console.log('🎨 Board color selection initialized');
});

// Make functions globally available
window.initBoardColorSelection = initBoardColorSelection;
window.loadBoardColorSettings = loadBoardColorSettings;
window.saveBoardColorSettings = saveBoardColorSettings;
window.applyBoardBackgroundStyle = applyBoardBackgroundStyle;
window.getCurrentBoardBackgroundRGBA = getCurrentBoardBackgroundRGBA;
window.getCurrentBoardBackgroundHex = getCurrentBoardBackgroundHex;
