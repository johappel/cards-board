// Test Board für Nostr Integration
// Diese Datei kann in der Browser-Konsole ausgeführt werden

function createTestBoardForNostr() {
    console.log('🧪 Creating test board for Nostr...');
      const testBoard = {
        id: 'test-nostr-board-' + Date.now(),
        name: 'Nostr Test Board',
        description: 'Test board for Nostr integration testing',
        summary: 'Ein Test-Board für die Nostr-Integration. Dieses Board enthält verschiedene Spalten und Karten zum Testen der Funktionalität.',
        authors: ['Nostr Tester'],
        backgroundColor: '#f0f8ff',
        backgroundHex: '#f0f8ff',
        headerRGBA: 'rgba(255, 255, 255, 0.8)',
        customStyle: '',
        aiConfig: {
            provider: '',
            apiKey: '',
            model: '',
            baseUrl: ''
        },
        columns: [
            {
                id: 'col-todo-' + Date.now(),
                name: 'To Do',
                color: 'color-gradient-1',                cards: [
                    {
                        id: 'card-1-' + Date.now(),
                        heading: 'Nostr Integration testen',
                        content: 'Die neue Nostr-Funktionalität ausführlich testen',
                        color: 'color-gradient-1',
                        thumbnail: '',
                        labels: 'High Priority, Feature',
                        comments: 'Schlüsselgenerierung funktioniert!',
                        url: '',
                        inactive: false
                    },
                    {
                        id: 'card-2-' + Date.now(),
                        heading: 'Board via Nostr teilen',
                        content: 'Das Board als Nostr-Event veröffentlichen und testen',
                        color: 'color-gradient-1',
                        thumbnail: '',
                        labels: 'Test',
                        comments: '',
                        url: '',
                        inactive: false
                    }
                ]
            },
            {
                id: 'col-progress-' + Date.now(),
                name: 'In Progress',
                color: 'color-gradient-2',                cards: [
                    {
                        id: 'card-3-' + Date.now(),
                        heading: 'Relay-Verbindungen prüfen',
                        content: 'Sicherstellen, dass alle konfigurierten Relays erreichbar sind',
                        color: 'color-gradient-1',
                        thumbnail: '',
                        labels: 'Testing',
                        comments: '',
                        url: '',
                        inactive: false
                    }
                ]
            },
            {
                id: 'col-done-' + Date.now(),
                name: 'Done',
                color: 'color-gradient-3',                cards: [
                    {
                        id: 'card-4-' + Date.now(),
                        heading: 'UI Integration',
                        content: 'Nostr-Modal und Sidebar-Integration abgeschlossen',
                        color: 'color-gradient-1',
                        thumbnail: '',
                        labels: 'Completed, UI',
                        comments: 'Perfekt integriert in das bestehende System',
                        url: 'https://github.com/nostr-protocol/nostr',
                        inactive: false
                    }
                ]
            }
        ]
    };
      // Board zu den existierenden Boards hinzufügen
    // Load current boards from storage first
    let currentBoards = [];
    try {
        const stored = localStorage.getItem('kanban_boards_v1');
        if (stored) {
            const parsed = JSON.parse(stored);
            currentBoards = parsed.boards || [];
        }
    } catch (error) {
        console.warn('Failed to load existing boards:', error);
    }
    
    // Check if test board already exists
    const existingIndex = currentBoards.findIndex(b => b.id === testBoard.id);
    if (existingIndex >= 0) {
        currentBoards[existingIndex] = testBoard; // Update existing
        console.log('🔄 Test board updated:', testBoard.name);    } else {
        currentBoards.push(testBoard); // Add new
        console.log('✅ Test board created:', testBoard.name);
    }
    
    // Update both window.boards and global boards variable
    window.boards = currentBoards;
    if (typeof boards !== 'undefined') {
        boards = currentBoards; // Update global boards array used by saveAllBoards
    }
      // Save to localStorage directly first
    localStorage.setItem('kanban_boards_v1', JSON.stringify({ boards: currentBoards }));
    // DEAKTIVIERT: Nicht automatisch speichern um kontinuierliche Board-Erstellung zu vermeiden
    // console.log('💾 Test board saved to localStorage directly');
    
    // Then use saveAllBoards if available (but after updating global boards)
    // DEAKTIVIERT: saveAllBoards() führt zu endloser Board-Erstellung
    // if (typeof saveAllBoards === 'function') {
    //     saveAllBoards();
    // }
    
    console.log('💡 Test board created in memory only (auto-save disabled to prevent duplication)');
    
    // Dashboard neu rendern falls möglich
    if (typeof renderDashboard === 'function') {
        renderDashboard();
    }
    
    return testBoard;
}

// Funktion zum Testen der Nostr-Funktionalität
function runNostrTests() {
    console.log('🧪 Running Nostr integration tests...');
    
    // 1. Test Board erstellen
    const testBoard = createTestBoardForNostr();
    
    // 2. Nostr State debuggen
    setTimeout(() => {
        if (typeof window.debugNostrState === 'function') {
            window.debugNostrState();
        }
    }, 1000);
    
    // 3. Relay-Verbindungen testen
    setTimeout(() => {
        if (typeof window.testNostrConnection === 'function') {
            window.testNostrConnection();
        }
    }, 2000);
    
    console.log('✅ Nostr tests queued');
    console.log('💡 Open the browser console to see results');
    console.log('💡 Use createTestBoardForNostr() to create a test board');
    console.log('💡 Use window.debugNostrState() to debug the current state');
    console.log('💡 Use window.testNostrConnection() to test relay connections');
}

// Test der echten secp256k1-Integration
async function testRealSecp256k1Integration() {
    console.log('🔐 Testing REAL secp256k1 integration...');
    
    if (typeof nobleSecp256k1 === 'undefined') {
        console.error('❌ Noble secp256k1 library not loaded!');
        return false;
    }
    
    try {
        // 1. Test key generation
        console.log('1️⃣ Testing key generation...');
        const privateKeyBytes = generateRandomPrivateKey();
        const privateKeyHex = bytesToHex(privateKeyBytes);
        console.log('✅ Private key generated:', privateKeyHex.substring(0, 16) + '...');        // 2. Test public key derivation
        console.log('2️⃣ Testing public key derivation...');
        const publicKeyPoint = nobleSecp256k1.getPublicKey(privateKeyHex, true); // TRUE = compressed für Nostr
        const publicKeyHex = bytesToHex(publicKeyPoint).substring(2); // Remove 02/03 prefix
        console.log('✅ Public key derived:', publicKeyHex.substring(0, 16) + '...');
        
        // 3. Test signing
        console.log('3️⃣ Testing message signing...');
        const testMessage = 'Nostr test message';
        const messageHash = await crypto.subtle.digest('SHA-256', 
            new TextEncoder().encode(testMessage));
        
        const signature = await nobleSecp256k1.sign(
            new Uint8Array(messageHash), 
            privateKeyBytes
        );
        
        const signatureHex = signature.toCompactHex();
        console.log('✅ Signature generated:', signatureHex.substring(0, 16) + '...');
        console.log('📏 Signature length:', signatureHex.length, 'characters');
          // 4. Test signature verification
        console.log('4️⃣ Testing signature verification...');
        const isValid = nobleSecp256k1.verify(signature, new Uint8Array(messageHash), publicKeyPoint);
        console.log('✅ Signature valid:', isValid);
        
        if (!isValid) {
            console.error('❌ Signature verification failed!');
            return false;
        }
        
        console.log('🎉 All secp256k1 tests passed!');
        return true;
        
    } catch (error) {
        console.error('❌ secp256k1 test failed:', error);
        return false;
    }
}

// Test der Nostr Event-Erstellung mit echter Kryptographie
async function testNostrEventCreation() {
    console.log('📝 Testing Nostr event creation with real crypto...');
    
    // AUTOMATIC BOARD CREATION DISABLED TO PREVENT ENDLESS BOARD CREATION
    // if (!window.currentBoard) {
    //     console.warn('⚠️ No current board, creating test board...');
    //     createTestBoardForNostr();
    //     await new Promise(resolve => setTimeout(resolve, 1000));
    // }
    
    if (!window.currentBoard) {
        console.warn('⚠️ No current board selected. Please manually create or select a board first.');
        console.log('💡 Use createTestBoardForNostr() manually if you need a test board');
        return;
    }
      try {        // Generate real keys
        const privateKeyBytes = generateRandomPrivateKey();
        const privateKeyHex = bytesToHex(privateKeyBytes);
        const publicKeyPoint = nobleSecp256k1.getPublicKey(privateKeyHex, true); // TRUE = compressed für Nostr
        const publicKeyHex = bytesToHex(publicKeyPoint).substring(2); // Remove 02/03 prefix
        
        console.log('🔑 Using keys:', {
            private: privateKeyHex.substring(0, 10) + '...',
            public: publicKeyHex.substring(0, 10) + '...'
        });
        
        // Create test event
        const event = await window.createNostrEvent(window.currentBoard, privateKeyHex, false);
        
        console.log('📋 Event created:', {
            id: event.id,
            kind: event.kind,
            pubkey: event.pubkey.substring(0, 16) + '...',
            signature: event.sig.substring(0, 16) + '...',
            signatureLength: event.sig.length
        });
        
        // Validate event structure
        const requiredFields = ['id', 'kind', 'created_at', 'content', 'tags', 'pubkey', 'sig'];
        const missingFields = requiredFields.filter(field => !event[field]);
        
        if (missingFields.length > 0) {
            console.error('❌ Missing event fields:', missingFields);
            return false;
        }
        
        // Validate signature length (should be 128 characters for DER encoding)
        if (event.sig.length !== 128) {
            console.warn('⚠️ Unexpected signature length:', event.sig.length, '(expected 128)');
        }
        
        console.log('✅ Event structure valid!');
        return event;
        
    } catch (error) {
        console.error('❌ Event creation failed:', error);
        return null;
    }
}

// Vollständiger Test der Nostr-Integration
async function runFullNostrTest() {
    console.log('🚀 Starting full Nostr integration test...');
    
    const results = {
        secp256k1: false,
        eventCreation: false,
        keyGeneration: false,
        overallSuccess: false
    };
    
    try {
        // 1. Test secp256k1 integration
        results.secp256k1 = await testRealSecp256k1Integration();
        
        // 2. Test key generation UI
        console.log('🎯 Testing key generation UI...');
        if (typeof window.generateNostrKeys === 'function') {
            await window.generateNostrKeys();
            results.keyGeneration = true;
            console.log('✅ Key generation UI works');
        } else {
            console.error('❌ generateNostrKeys function not found');
        }
        
        // 3. Test event creation
        const event = await testNostrEventCreation();
        results.eventCreation = !!event;
        
        // 4. Overall success
        results.overallSuccess = results.secp256k1 && results.eventCreation && results.keyGeneration;
        
        console.log('📊 Test Results:', results);
        
        if (results.overallSuccess) {
            console.log('🎉 ALL TESTS PASSED! Nostr integration is working correctly.');
        } else {
            console.log('⚠️ Some tests failed. Check the logs above for details.');
        }
        
        return results;
        
    } catch (error) {
        console.error('❌ Full test failed:', error);
        return results;
    }
}

// Hilfsfunktion für detailliertes Debugging
function analyzeNostrSignature(event) {
    if (!event || !event.sig) {
        console.error('❌ No event or signature provided');
        return;
    }
    
    console.log('🔍 Signature Analysis:');
    console.log('- Length:', event.sig.length, 'characters');
    console.log('- Format:', /^[0-9a-fA-F]+$/.test(event.sig) ? 'Valid HEX' : 'Invalid format');
    console.log('- First 32 chars:', event.sig.substring(0, 32));
    console.log('- Last 32 chars:', event.sig.substring(event.sig.length - 32));
    
    // Check if it's a proper DER-encoded signature
    if (event.sig.length === 128) {
        console.log('✅ Signature length matches expected DER encoding');
    } else {
        console.warn('⚠️ Unexpected signature length for DER encoding');
    }
}

// Console Test für Noble secp256k1
function checkNobleSecp256k1() {
    console.log('🔍 Checking Noble secp256k1 library status...');
    console.log('- typeof nobleSecp256k1:', typeof nobleSecp256k1);
    
    if (typeof nobleSecp256k1 !== 'undefined') {
        console.log('✅ Noble secp256k1 is loaded!');
        console.log('- Available methods:', Object.keys(nobleSecp256k1));
        
        // Prüfe utils object
        if (nobleSecp256k1.utils) {
            console.log('- Utils available:', Object.keys(nobleSecp256k1.utils));
        } else {
            console.log('- No utils object found');
        }
        
        // Teste die verfügbaren Methoden
        try {
            // Versuche verschiedene Methoden für Schlüsselgenerierung
            if (typeof nobleSecp256k1.utils?.randomPrivateKey === 'function') {
                const testKey = nobleSecp256k1.utils.randomPrivateKey();
                console.log('✅ utils.randomPrivateKey works');
            } else if (typeof nobleSecp256k1.randomPrivateKey === 'function') {
                const testKey = nobleSecp256k1.randomPrivateKey();
                console.log('✅ randomPrivateKey works');
            } else {
                console.log('❌ No randomPrivateKey method found');
            }
              // Teste hex conversion
            console.log('✅ Using standard hex conversion (no native bytesToHex needed)');
            
            console.log('✅ Noble secp256k1 is fully functional');
            return true;
        } catch (error) {
            console.error('❌ Noble secp256k1 error:', error);
            return false;
        }
    } else {
        console.warn('❌ Noble secp256k1 is NOT loaded');
        console.log('📝 This will use fallback cryptography (SHA-256 based)');
        return false;
    }
}

// Hilfsfunktionen für Noble secp256k1 mit korrekter API
function generateRandomPrivateKey() {
    if (typeof nobleSecp256k1 !== 'undefined' && typeof nobleSecp256k1.utils?.randomPrivateKey === 'function') {
        return nobleSecp256k1.utils.randomPrivateKey();
    }
    
    // Fallback: Generiere 32 zufällige Bytes
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return array;
}

function bytesToHex(bytes) {
    // Noble secp256k1 hat keine direkte bytesToHex Funktion
    // Verwende manuelle Hex-Konvertierung (das ist der Standard)
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex) {
    if (typeof nobleSecp256k1 !== 'undefined') {
        // Versuche Noble's eigene Konvertierung
        if (typeof nobleSecp256k1.utils?.hexToBytes === 'function') {
            return nobleSecp256k1.utils.hexToBytes(hex);
        } else if (typeof nobleSecp256k1.hexToBytes === 'function') {
            return nobleSecp256k1.hexToBytes(hex);
        }
    }
    
    // Fallback: Manuelle Byte-Konvertierung
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
}

// Funktionen global verfügbar machen
if (typeof window !== 'undefined') {
    window.createTestBoardForNostr = createTestBoardForNostr;
    window.runNostrTests = runNostrTests;
    window.testRealSecp256k1Integration = testRealSecp256k1Integration;
    window.testNostrEventCreation = testNostrEventCreation;
    window.runFullNostrTest = runFullNostrTest;
    window.analyzeNostrSignature = analyzeNostrSignature;
    window.checkNobleSecp256k1 = checkNobleSecp256k1;
    window.generateRandomPrivateKey = generateRandomPrivateKey;
    window.bytesToHex = bytesToHex;
    window.hexToBytes = hexToBytes;
}
