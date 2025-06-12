// Test für localStorage Synchronisation nach Nostr Import
// Führe diesen Test in der Browser-Konsole aus

async function testLocalStorageSync() {
    console.log('🔍 Testing localStorage Synchronization after Nostr Import...');
    console.log('==========================================================');
    
    // Schritt 1: Analysiere aktuellen localStorage Zustand
    console.log('\n📊 Step 1: Analyzing current localStorage state...');
    
    const storageKeys = [
        'kanban-boards',
        'kanban_boards_v1',
        'boards'
    ];
    
    storageKeys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                console.log(`✅ Found key "${key}":`, {
                    type: Array.isArray(parsed) ? 'Array' : typeof parsed,
                    length: Array.isArray(parsed) ? parsed.length : 
                            (parsed.boards ? parsed.boards.length : 'N/A'),
                    structure: Array.isArray(parsed) ? 'Direct Array' : 
                              (parsed.boards ? 'Wrapped in boards property' : 'Other')
                });
                
                if (parsed.boards && Array.isArray(parsed.boards)) {
                    parsed.boards.forEach((board, index) => {
                        console.log(`  - Board ${index + 1}: "${board.name}" (ID: ${board.id?.substring(0, 8)}...)`);
                    });
                } else if (Array.isArray(parsed)) {
                    parsed.forEach((board, index) => {
                        console.log(`  - Board ${index + 1}: "${board.name}" (ID: ${board.id?.substring(0, 8)}...)`);
                    });
                }
            } catch (e) {
                console.log(`❌ Key "${key}" contains invalid JSON:`, e.message);
            }
        } else {
            console.log(`⚫ Key "${key}": Not found`);
        }
    });
    
    // Schritt 2: Analysiere window.boards
    console.log('\n💾 Step 2: Analyzing memory state...');
    console.log('window.boards:', {
        exists: typeof window.boards !== 'undefined',
        type: typeof window.boards,
        length: window.boards?.length || 0
    });
    
    if (window.boards && Array.isArray(window.boards)) {
        window.boards.forEach((board, index) => {
            console.log(`  - Memory Board ${index + 1}: "${board.name}" (ID: ${board.id?.substring(0, 8)}...)`);
        });
    }
    
    // Schritt 3: Teste Speicherfunktionen
    console.log('\n🔧 Step 3: Testing save functions...');
    
    // Test saveAllBoards
    if (typeof saveAllBoards === 'function') {
        console.log('✅ saveAllBoards function available');
        try {
            saveAllBoards();
            console.log('✅ saveAllBoards() executed successfully');
        } catch (e) {
            console.error('❌ saveAllBoards() failed:', e);
        }
    } else {
        console.log('❌ saveAllBoards function not available');
    }
    
    // Test KanbanStorage
    if (typeof window.KanbanStorage !== 'undefined') {
        console.log('✅ KanbanStorage available');
        if (typeof window.KanbanStorage.saveBoards === 'function') {
            console.log('✅ KanbanStorage.saveBoards available');
            try {
                await window.KanbanStorage.saveBoards(window.boards || []);
                console.log('✅ KanbanStorage.saveBoards() executed successfully');
            } catch (e) {
                console.error('❌ KanbanStorage.saveBoards() failed:', e);
            }
        } else {
            console.log('❌ KanbanStorage.saveBoards not available');
        }
    } else {
        console.log('❌ KanbanStorage not available');
    }
    
    // Schritt 4: Nach Speicherung erneut prüfen
    console.log('\n🔄 Step 4: Re-checking localStorage after save attempts...');
    
    storageKeys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                const boardCount = Array.isArray(parsed) ? parsed.length : 
                                  (parsed.boards ? parsed.boards.length : 0);
                console.log(`✅ Key "${key}" now has ${boardCount} boards`);
            } catch (e) {
                console.log(`❌ Key "${key}" still invalid`);
            }
        } else {
            console.log(`⚫ Key "${key}" still not found`);
        }
    });
    
    // Schritt 5: Empfehlungen
    console.log('\n💡 Step 5: Recommendations...');
    
    const hasV1Data = localStorage.getItem('kanban_boards_v1');
    const hasOldData = localStorage.getItem('kanban-boards');
    
    if (hasV1Data && hasOldData) {
        console.log('⚠️ Found both storage formats - recommend cleanup');
        console.log('💡 The app should use "kanban_boards_v1" as primary storage');
    } else if (hasV1Data) {
        console.log('✅ Using "kanban_boards_v1" - correct format');
    } else if (hasOldData) {
        console.log('⚠️ Using "kanban-boards" - consider migration to "kanban_boards_v1"');
    } else {
        console.log('❌ No boards found in localStorage');
    }
    
    return {
        storageKeys: storageKeys.map(key => ({
            key,
            exists: !!localStorage.getItem(key),
            boardCount: (() => {
                try {
                    const data = JSON.parse(localStorage.getItem(key) || '{}');
                    return Array.isArray(data) ? data.length : (data.boards?.length || 0);
                } catch { return 0; }
            })()
        })),
        memoryBoardCount: window.boards?.length || 0,
        functionsAvailable: {
            saveAllBoards: typeof saveAllBoards === 'function',
            kanbanStorage: typeof window.KanbanStorage !== 'undefined'
        }
    };
}

// Hilfsfunktion zum Reparieren der localStorage Synchronisation
function fixLocalStorageSync() {
    console.log('🔧 Attempting to fix localStorage synchronization...');
    
    if (!window.boards || !Array.isArray(window.boards)) {
        console.error('❌ No valid boards array in memory');
        return false;
    }
    
    // Verwende das korrekte Speicherformat
    const storageData = { boards: window.boards };
    
    try {
        // Speichere in beiden Formaten für Kompatibilität
        localStorage.setItem('kanban_boards_v1', JSON.stringify(storageData));
        localStorage.setItem('kanban-boards', JSON.stringify(window.boards)); // Fallback
        
        console.log('✅ localStorage synchronization fixed');
        console.log(`📊 Saved ${window.boards.length} boards to localStorage`);
        
        // Verifiziere
        const verification = JSON.parse(localStorage.getItem('kanban_boards_v1'));
        if (verification.boards && verification.boards.length === window.boards.length) {
            console.log('✅ Verification successful');
            return true;
        } else {
            console.error('❌ Verification failed');
            return false;
        }
    } catch (error) {
        console.error('❌ Failed to fix localStorage:', error);
        return false;
    }
}

// Export für Console-Nutzung
window.testLocalStorageSync = testLocalStorageSync;
window.fixLocalStorageSync = fixLocalStorageSync;

console.log('🔍 localStorage Sync Tester loaded!');
console.log('Commands:');
console.log('- await testLocalStorageSync() - Analyze localStorage sync issue');
console.log('- fixLocalStorageSync() - Attempt to fix sync issues');
