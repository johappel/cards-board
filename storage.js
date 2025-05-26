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
    if (await storageHealth()) {
        // Server-API speichern
        await fetch(`${API_BASE}/${STORAGE_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ boards })
        });
    } else {
        // LocalStorage speichern
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ boards }));
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
