
// Color Palette Selection Functions
function initializeColorPalettes() {
    // Initialize card color palette
    const cardPalette = document.getElementById('card-color-palette');
    if (cardPalette) {
        cardPalette.addEventListener('click', function(e) {
            if (e.target.classList.contains('color-option')) {
                selectColor(cardPalette, e.target, 'card-color');
            }
        });
    }

    // Initialize column color palette
    const columnPalette = document.getElementById('column-color-palette');
    if (columnPalette) {
        columnPalette.addEventListener('click', function(e) {
            if (e.target.classList.contains('color-option')) {
                selectColor(columnPalette, e.target, 'column-color');
            }
        });
    }
}

function selectColor(palette, selectedOption, hiddenInputId) {
    // Remove selected class from all options in this palette
    palette.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Add selected class to clicked option
    selectedOption.classList.add('selected');
    
    // Update hidden input value
    const hiddenInput = document.getElementById(hiddenInputId);
    if (hiddenInput) {
        hiddenInput.value = selectedOption.dataset.color;
    }
}

function setSelectedColor(paletteId, colorClass) {
    const palette = document.getElementById(paletteId);
    if (palette) {
        palette.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.color === colorClass) {
                option.classList.add('selected');
            }
        });
    }
}