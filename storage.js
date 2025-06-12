// Flexibles Storage-Modul für Boards, Columns und Cards
// Unterstützt LocalStorage und optionalen Server-API-Storage

const STORAGE_KEY = 'kanban_boards_v1';
const API_BASE = '/storage';

async function storageHealth() {
    try {
        const res = await fetch(`${API_BASE}/health`);
        return res.ok;
    } catch {
        return false;
    }
}

async function saveBoards(boards) {
    console.log('💾 KanbanStorage.saveBoards() called with', boards?.length, 'boards');
    
    try {
        // Try server-API first but with shorter timeout
        const isServerAvailable = await Promise.race([
            storageHealth(),
            new Promise(resolve => setTimeout(() => resolve(false), 500)) // 500ms timeout
        ]);
        
        if (isServerAvailable) {
            // Server-API speichern
            await fetch(`${API_BASE}/${STORAGE_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ boards })
            });
            console.log('✅ Boards saved to server');
        } else {
            throw new Error('Server not available, using localStorage');
        }
    } catch (error) {
        // LocalStorage speichern (primary fallback)
        console.log('💾 Falling back to localStorage:', error.message);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ boards }));
        console.log('✅ Boards saved to localStorage');
    }
}

async function loadBoards() {
    if (await storageHealth()) {
        // Server-API laden
        const res = await fetch(`${API_BASE}/${STORAGE_KEY}`);
        if (res.ok) {
            const data = await res.json();
            return data.boards || [];
        }
    } else {
        // LocalStorage laden
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            try {
                const data = JSON.parse(raw);
                return data.boards || [];
            } catch {
                return [];
            }
        }
    }
    return [];
}

// Board per ID aus Storage laden
async function loadBoardById(boardId) {
    const boards = await loadBoards();
    return boards.find(b => b.id === boardId) || null;
}

// Export für globale Nutzung
window.KanbanStorage = {
    saveBoards,
    loadBoards,
    loadBoardById,
    storageHealth
};
