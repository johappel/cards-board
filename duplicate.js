// Duplicate functionality with visual feedback
let duplicateHint = null;

// Visual feedback for Ctrl+Drag
function setupDuplicateVisualFeedback() {
    // Create duplicate hint element
    if (!duplicateHint) {
        duplicateHint = document.createElement('div');
        duplicateHint.className = 'duplicate-hint';
        duplicateHint.textContent = 'Strg+Drag zum Duplizieren';
        document.body.appendChild(duplicateHint);
    }
}

// Track mouse position for hint positioning
let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    if (duplicateHint) {
        duplicateHint.style.left = mouseX + 15 + 'px';
        duplicateHint.style.top = mouseY - 10 + 'px';
    }
});

// Show/hide duplicate hint based on Ctrl key
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && !duplicateHint.classList.contains('show')) {
        setupDuplicateVisualFeedback();
        duplicateHint.classList.add('show');
    }
});

document.addEventListener('keyup', function(e) {
    if (!e.ctrlKey && duplicateHint && duplicateHint.classList.contains('show')) {
        duplicateHint.classList.remove('show');
    }
});

// Add visual class during drag when Ctrl is pressed
function addDuplicateClass(element, evt) {
    if (evt.originalEvent && evt.originalEvent.ctrlKey) {
        element.classList.add('sortable-duplicate');
    }
}

function removeDuplicateClass(element) {
    element.classList.remove('sortable-duplicate');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    setupDuplicateVisualFeedback();
});

// Export functions for use in other files
window.addDuplicateClass = addDuplicateClass;
window.removeDuplicateClass = removeDuplicateClass;
