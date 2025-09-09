// Export/Import Functions
function exportBoard() {
    const exportData = {
        ...currentBoard,
        exportDate: new Date().toISOString()
    };
    
    downloadJSON(exportData, `board-${currentBoard.name}-${Date.now()}.json`);
}

function exportAllBoards() {
    const exportData = {
        boards: boards,
        exportDate: new Date().toISOString()
    };
    
    downloadJSON(exportData, `all-boards-${Date.now()}.json`);
}

function importBoards(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.boards) {
                // Multiple boards
                boards = data.boards;
            } else {
                // Single board
                boards.push(data);
            }
            saveAllBoards();
            renderDashboard();
            alert('Import successful!');
        } catch (error) {
            alert('Error importing file: ' + error.message);
        }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
}

function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}