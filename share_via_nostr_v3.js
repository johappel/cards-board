/**
 * Nostr Integration für Kanban Board - Version 3.0 mit nostr-tools
 * Verwendet die Standard nostr-tools Bibliothek für bessere Kompatibilität
 */

// Warten auf nostr-tools initialization
function waitForNostrTools() {
    return new Promise((resolve, reject) => {
        const maxWait = 10000; // 10 seconds
        const interval = 100; // 100ms
        let elapsed = 0;
        
        function check() {
            if (window.nostrTools && window.cryptoReady) {
                console.log('✅ nostr-tools ready');
                resolve();
            } else if (elapsed >= maxWait) {
                reject(new Error('nostr-tools timeout'));
            } else {
                elapsed += interval;
                setTimeout(check, interval);
            }
        }
        
        check();
    });
}

// Initialize flag to prevent multiple initialization
let nostrInitialized = false;

// Nostr Modal and Functions
let currentNostrMessage = '';

// Default Relay Servers
const defaultRelays = [
    'wss://relay.damus.io',
    'wss://relay.nostr.band',
    'wss://nos.lol',
    'wss://relay.snort.social',
    'wss://nostr-pub.wellorder.net'
];

// Generate new Nostr key pair using nostr-tools
async function generateNostrKeys() {
    try {
        await waitForNostrTools();
        
        const privateKey = window.nostrTools.generatePrivateKey();
        const publicKey = window.nostrTools.getPublicKey(privateKey);
        
        document.getElementById('nostr-private-key').value = privateKey;
        document.getElementById('nostr-public-key').value = publicKey;
        
        console.log('🔑 New Nostr keys generated with nostr-tools:', {
            private: privateKey.substring(0, 8) + '...',
            public: publicKey.substring(0, 8) + '...'
        });
        
        showNostrMessage('✅ Neue Schlüssel generiert!', 'success');
    } catch (error) {
        console.error('❌ Key generation error:', error);
        showNostrMessage('❌ Fehler beim Generieren der Schlüssel: ' + error.message, 'error');
    }
}

// Initialize Nostr functionality
function initializeNostr() {
    if (nostrInitialized) {
        console.log('🔗 Nostr already initialized');
        return;
    }
    
    console.log('🔗 Initializing Nostr functionality...');
    
    waitForNostrTools().then(() => {
        nostrInitialized = true;
        initializeNostrUI();
        console.log('✅ Nostr initialization complete');
    }).catch(error => {
        console.error('❌ Nostr initialization failed:', error);
        nostrInitialized = true; // Prevent retry loops
        initializeNostrUI(); // Continue with basic UI
    });
}

function initializeNostrUI() {
    setTimeout(() => {
        loadNostrCredentials();
        loadNostrRelays();
        
        // Validate UI elements
        const requiredElements = [
            'nostr-private-key',
            'nostr-public-key', 
            'nostr-relays',
            'remember-nostr-credentials'
        ];
        
        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        if (missingElements.length > 0) {
            console.warn('⚠️ Missing Nostr UI elements:', missingElements);
        } else {
            console.log('✅ All Nostr UI elements found');
        }
    }, 100);
}

// Nostr Credentials Management
function loadNostrCredentials() {
    const credentials = JSON.parse(localStorage.getItem('nostr-credentials') || '{}');
    
    const privateKeyInput = document.getElementById('nostr-private-key');
    const publicKeyInput = document.getElementById('nostr-public-key');
    const rememberCheckbox = document.getElementById('remember-nostr-credentials');
    
    if (privateKeyInput && credentials.nsec) {
        privateKeyInput.value = credentials.nsec;
    }
    if (publicKeyInput && credentials.npub) {
        publicKeyInput.value = credentials.npub;
    }
    if (rememberCheckbox) {
        rememberCheckbox.checked = !!credentials.nsec;
    }
}

function saveNostrCredentials() {
    const rememberCheckbox = document.getElementById('remember-nostr-credentials');
    const privateKeyInput = document.getElementById('nostr-private-key');
    const publicKeyInput = document.getElementById('nostr-public-key');
    
    if (!rememberCheckbox || !privateKeyInput || !publicKeyInput) {
        console.warn('Nostr credential inputs not found');
        return;
    }
    
    const remember = rememberCheckbox.checked;
    const nsec = privateKeyInput.value.trim();
    const npub = publicKeyInput.value.trim();
    
    if (remember && nsec) {
        localStorage.setItem('nostr-credentials', JSON.stringify({ nsec, npub }));
    } else {
        localStorage.removeItem('nostr-credentials');
    }
}

function loadNostrRelays() {
    const savedRelays = JSON.parse(localStorage.getItem('nostr-relays') || '[]');
    const relays = savedRelays.length > 0 ? savedRelays : defaultRelays;
    
    const relayTextarea = document.getElementById('nostr-relays');
    if (relayTextarea) {
        relayTextarea.value = relays.join('\n');
    }
}

function saveNostrRelays() {
    const relayText = document.getElementById('nostr-relays').value;
    const relays = relayText.split('\n')
        .map(r => r.trim())
        .filter(r => r && r.startsWith('wss://'));
    
    localStorage.setItem('nostr-relays', JSON.stringify(relays));
    return relays;
}

// Board Publishing using nostr-tools
async function publishBoardToNostr() {
    if (!currentBoard) {
        showNostrMessage('Kein Board ausgewählt zum Veröffentlichen.', 'error');
        return;
    }
    
    const nsec = document.getElementById('nostr-private-key').value.trim();
    const isDraft = document.getElementById('nostr-publish-as-draft').checked;
    
    if (!nsec) {
        showNostrMessage('Privater Schlüssel erforderlich zum Veröffentlichen.', 'error');
        return;
    }
    
    // Validate private key format (64 hex characters)
    if (nsec.length !== 64 || !/^[0-9a-fA-F]+$/i.test(nsec)) {
        showNostrMessage('Ungültiger privater Schlüssel. Muss 64 HEX-Zeichen lang sein.', 'error');
        return;
    }
    
    // UI feedback
    const publishBtn = document.querySelector('.nostr-btn.primary');
    if (!publishBtn) {
        showNostrMessage('UI-Fehler: Publish-Button nicht gefunden', 'error');
        return;
    }
    
    const originalText = publishBtn.textContent;
    publishBtn.classList.add('loading');
    publishBtn.disabled = true;
    publishBtn.textContent = 'Veröffentliche...';
    
    try {
        await waitForNostrTools();
        
        // Create Nostr event using nostr-tools
        const event = await createNostrEventWithTools(currentBoard, nsec, isDraft);
        
        // Send to relays
        const relays = saveNostrRelays();
        if (relays.length === 0) {
            throw new Error('Keine gültigen Relay-Server konfiguriert');
        }
        
        showNostrMessage(`Sende an ${relays.length} Relay(s)...`, 'info');
        const results = await publishToRelays(event, relays);
        
        if (results.success > 0) {
            const eventId = event.id;
            const nevent = createNeventString(eventId, relays.slice(0, 3));
            const importUrl = `${window.location.origin}${window.location.pathname}?import=${nevent}`;
            
            // Success UI Update
            document.getElementById('nostr-event-link').value = importUrl;
            document.getElementById('nostr-publish-success').style.display = 'block';
            
            showNostrMessage(`Board erfolgreich veröffentlicht! (${results.success}/${results.total} Relays)`, 'success');
            
            console.log('🎉 Successfully published to Nostr:', {
                eventId: eventId.substring(0, 16) + '...',
                relaysSuccessful: results.success,
                relaysTotal: results.total,
                nevent: nevent.substring(0, 20) + '...'
            });
            
        } else {
            showNostrMessage('Fehler beim Veröffentlichen: Keine Relays erreichbar.', 'error');
            if (results.errors.length > 0) {
                console.error('Relay errors:', results.errors);
            }
        }
    } catch (error) {
        console.error('Publishing error:', error);
        showNostrMessage('Fehler beim Veröffentlichen: ' + error.message, 'error');
    } finally {
        // Reset UI
        if (publishBtn) {
            publishBtn.classList.remove('loading');
            publishBtn.disabled = false;
            publishBtn.textContent = originalText;
        }
    }
}

// Create Nostr event using nostr-tools
async function createNostrEventWithTools(board, privateKeyHex, isDraft = false) {
    const kind = isDraft ? 30024 : 30023; // NIP-23 kinds
    
    // Prepare board data
    const boardData = {
        ...board,
        exportDate: new Date().toISOString(),
        nostrEvent: true
    };
    
    const content = JSON.stringify(boardData, null, 2);
    const pubkey = window.nostrTools.getPublicKey(privateKeyHex);
    
    console.log('🏗️ Creating Nostr event with nostr-tools...');
    console.log('- Kind:', kind);
    console.log('- Pubkey:', pubkey.substring(0, 16) + '...');
    console.log('- Content length:', content.length);
    
    const eventTemplate = {
        kind: kind,
        created_at: Math.floor(Date.now() / 1000),
        content: content,
        tags: [
            ['title', board.name || 'Kanban Board'],
            ['summary', board.summary || 'Kanban Board Export'],
            ['t', 'kanban'],
            ['t', 'board'],
            ['client', 'Kanban Board App']
        ],
        pubkey: pubkey
    };
    
    // Use nostr-tools to finalize the event (generates ID and signature)
    const signedEvent = window.nostrTools.finalizeEvent(eventTemplate, privateKeyHex);
    
    console.log('✅ Event created with nostr-tools:', {
        id: signedEvent.id.substring(0, 16) + '...',
        kind: signedEvent.kind,
        pubkey: signedEvent.pubkey.substring(0, 16) + '...',
        sig: signedEvent.sig.substring(0, 16) + '...',
        tags: signedEvent.tags.length,
        content_length: signedEvent.content.length
    });
    
    // Verify the signature
    const isValid = window.nostrTools.verifySignature(signedEvent);
    console.log('🔐 Signature verification:', isValid ? '✅ Valid' : '❌ Invalid');
    
    if (!isValid) {
        throw new Error('Signature verification failed');
    }
    
    return signedEvent;
}

async function publishToRelays(event, relays) {
    const results = { success: 0, total: relays.length, errors: [] };
    
    for (const relay of relays) {
        try {
            await publishToRelay(event, relay);
            results.success++;
            console.log(`✅ Published to ${relay}`);
        } catch (error) {
            results.errors.push({ relay, error: error.message });
            console.error(`❌ Failed to publish to ${relay}:`, error.message);
        }
    }
    
    return results;
}

async function publishToRelay(event, relayUrl) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(relayUrl);
        let resolved = false;
        
        const timeout = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                ws.close();
                reject(new Error('Timeout'));
            }
        }, 15000); // 15 second timeout
        
        ws.onopen = () => {
            const message = JSON.stringify(['EVENT', event]);
            console.log(`📤 Sending to ${relayUrl}:`, message.substring(0, 100) + '...');
            ws.send(message);
        };
        
        ws.onmessage = (msg) => {
            if (!resolved) {
                try {
                    const response = JSON.parse(msg.data);
                    console.log(`📨 Response from ${relayUrl}:`, response);
                    
                    if (response[0] === 'OK') {
                        if (response[2] === true) {
                            resolved = true;
                            clearTimeout(timeout);
                            ws.close();
                            resolve(response);
                        } else {
                            // Event was rejected
                            const reason = response[3] || 'Unknown error';
                            resolved = true;
                            clearTimeout(timeout);
                            ws.close();
                            reject(new Error(`Event rejected: ${reason}`));
                        }
                    } else if (response[0] === 'NOTICE') {
                        console.log(`📢 Notice from ${relayUrl}: ${response[1]}`);
                    }
                    // Ignore other message types (EOSE, etc.)
                } catch (e) {
                    console.warn(`Failed to parse message from ${relayUrl}:`, e);
                }
            }
        };
        
        ws.onerror = (error) => {
            console.error(`WebSocket error for ${relayUrl}:`, error);
            if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                reject(new Error('Connection error'));
            }
        };
        
        ws.onclose = () => {
            if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                reject(new Error('Connection closed'));
            }
        };
    });
}

// Board Import
async function importBoardFromNostr(nevent) {
    try {
        const eventData = parseNeventString(nevent);
        const relays = eventData.relays.length > 0 
            ? eventData.relays 
            : JSON.parse(localStorage.getItem('nostr-relays') || '[]').concat(defaultRelays);
        
        showNostrMessage('Suche Board-Event...', 'info');
        
        const event = await fetchEventFromRelays(eventData.eventId, relays);
        
        if (!event) {
            throw new Error('Event nicht gefunden');
        }
        
        // Verify event signature with nostr-tools
        await waitForNostrTools();
        const isValid = window.nostrTools.verifySignature(event);
        if (!isValid) {
            console.warn('⚠️ Event signature verification failed, but continuing import');
        }
        
        // Extract board data from event
        const boardData = JSON.parse(event.content);
        
        if (!boardData.nostrEvent) {
            throw new Error('Kein gültiges Board-Event');
        }
        
        // Generate new ID to avoid conflicts
        boardData.id = generateId();
        boardData.name = `${boardData.name} (Imported)`;
        delete boardData.nostrEvent;
        delete boardData.exportDate;
        
        // Import board
        if (!window.boards) window.boards = [];
        window.boards.push(boardData);
        
        if (typeof saveAllBoards === 'function') {
            saveAllBoards();
        } else if (typeof window.KanbanStorage !== 'undefined') {
            await window.KanbanStorage.saveBoards(window.boards);
        }
        
        showNostrMessage('Board erfolgreich importiert!', 'success');
        
        // Switch to dashboard
        if (typeof renderDashboard === 'function') {
            renderDashboard();
        }
        
        return boardData;
        
    } catch (error) {
        console.error('Import error:', error);
        showNostrMessage('Fehler beim Importieren: ' + error.message, 'error');
        throw error;
    }
}

async function fetchEventFromRelays(eventId, relays) {
    const promises = relays.map(relay => fetchEventFromRelay(eventId, relay));
    
    try {
        const event = await Promise.any(promises);
        return event;
    } catch (error) {
        return null;
    }
}

async function fetchEventFromRelay(eventId, relayUrl) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(relayUrl);
        let resolved = false;
        
        const timeout = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                ws.close();
                reject(new Error('Timeout'));
            }
        }, 10000);
        
        ws.onopen = () => {
            const subscription = JSON.stringify([
                'REQ', 
                'import_' + Math.random().toString(36).substring(7),
                { ids: [eventId] }
            ]);
            ws.send(subscription);
        };
        
        ws.onmessage = (msg) => {
            try {
                const data = JSON.parse(msg.data);
                
                if (data[0] === 'EVENT' && data[2] && data[2].id === eventId) {
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        ws.close();
                        resolve(data[2]);
                    }
                }
            } catch (e) {
                // Ignore parsing errors
            }
        };
        
        ws.onerror = ws.onclose = () => {
            if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                reject(new Error('Connection failed'));
            }
        };
    });
}

// URL Import Handler
function handleUrlImport() {
    const urlParams = new URLSearchParams(window.location.search);
    const importParam = urlParams.get('import');
    
    if (importParam && importParam.startsWith('nevent1')) {
        setTimeout(async () => {
            try {
                await importBoardFromNostr(importParam);
                // Remove URL parameter
                window.history.replaceState({}, document.title, window.location.pathname);
            } catch (error) {
                console.error('Auto-import failed:', error);
            }
        }, 1000);
    }
}

// Nevent String Utilities
function createNeventString(eventId, relays = []) {
    // Simplified nevent creation
    const data = {
        eventId: eventId,
        relays: relays.slice(0, 3) // Max 3 relays
    };
    
    // Base64 encode for transport
    const encoded = btoa(JSON.stringify(data));
    return `nevent1${encoded}`;
}

function parseNeventString(nevent) {
    try {
        if (!nevent.startsWith('nevent1')) {
            throw new Error('Invalid nevent format');
        }
        
        const encoded = nevent.substring(7); // Remove 'nevent1'
        const decoded = JSON.parse(atob(encoded));
        
        return {
            eventId: decoded.eventId,
            relays: decoded.relays || []
        };
    } catch (error) {
        // Fallback for simple nevent strings
        const eventId = nevent.replace('nevent1', '');
        return {
            eventId: eventId,
            relays: []
        };
    }
}

// UI Helper Functions
function openNostrModal() {
    saveNostrCredentials(); // Save current state
    loadNostrCredentials(); // Reload to show saved state
    loadNostrRelays();
    
    document.getElementById('nostr-publish-success').style.display = 'none';
    document.getElementById('nostr-event-link').value = '';
    
    // Reset message
    const messageEl = document.getElementById('nostr-message');
    if (messageEl) {
        messageEl.style.display = 'none';
    }
    
    openModal('nostr-modal');
}

function copyNostrLink() {
    const linkInput = document.getElementById('nostr-event-link');
    if (linkInput.value) {
        linkInput.select();
        linkInput.setSelectionRange(0, 99999); // For mobile devices
        
        try {
            navigator.clipboard.writeText(linkInput.value).then(() => {
                showNostrMessage('Link in Zwischenablage kopiert!', 'success');
            }).catch(() => {
                // Fallback
                document.execCommand('copy');
                showNostrMessage('Link in Zwischenablage kopiert!', 'success');
            });
        } catch (err) {
            showNostrMessage('Kopieren fehlgeschlagen. Bitte manuell auswählen.', 'error');
        }
    }
}

function copyPrivateKey() {
    const privateKeyInput = document.getElementById('nostr-private-key');
    if (privateKeyInput.value) {
        try {
            navigator.clipboard.writeText(privateKeyInput.value).then(() => {
                showNostrMessage('Privater Schlüssel kopiert!', 'success');
            }).catch(() => {
                // Fallback
                privateKeyInput.select();
                document.execCommand('copy');
                showNostrMessage('Privater Schlüssel kopiert!', 'success');
            });
        } catch (err) {
            showNostrMessage('Kopieren fehlgeschlagen.', 'error');
        }
    }
}

function copyPublicKey() {
    const publicKeyInput = document.getElementById('nostr-public-key');
    if (publicKeyInput.value) {
        try {
            navigator.clipboard.writeText(publicKeyInput.value).then(() => {
                showNostrMessage('Öffentlicher Schlüssel kopiert!', 'success');
            }).catch(() => {
                // Fallback
                publicKeyInput.select();
                document.execCommand('copy');
                showNostrMessage('Öffentlicher Schlüssel kopiert!', 'success');
            });
        } catch (err) {
            showNostrMessage('Kopieren fehlgeschlagen.', 'error');
        }
    }
}

function togglePrivateKeyVisibility() {
    const privateKeyInput = document.getElementById('nostr-private-key');
    const toggleBtn = document.querySelector('.nostr-key-toggle');
    
    if (privateKeyInput.type === 'password') {
        privateKeyInput.type = 'text';
        toggleBtn.textContent = '🙈';
        toggleBtn.title = 'Verstecken';
    } else {
        privateKeyInput.type = 'password';
        toggleBtn.textContent = '👁️';
        toggleBtn.title = 'Anzeigen';
    }
}

function showNostrMessage(message, type = 'info') {
    const messageEl = document.getElementById('nostr-message');
    if (!messageEl) return;
    
    messageEl.textContent = message;
    messageEl.className = `nostr-message ${type}`;
    messageEl.style.display = 'block';
    
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 5000);
}

// Utility function for generating IDs
function generateId() {
    return 'board-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
}

// Debug Functions
async function testNostrConnection() {
    console.log('🧪 Testing Nostr connection...');
    
    const relays = JSON.parse(localStorage.getItem('nostr-relays') || '[]');
    const testRelays = relays.length > 0 ? relays : defaultRelays;
    
    for (const relay of testRelays.slice(0, 2)) { // Test only first 2 relays
        try {
            console.log(`Testing ${relay}...`);
            const ws = new WebSocket(relay);
            
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    ws.close();
                    reject(new Error('Timeout'));
                }, 5000);
                
                ws.onopen = () => {
                    console.log(`✅ ${relay} - Connected`);
                    clearTimeout(timeout);
                    ws.close();
                    resolve();
                };
                
                ws.onerror = ws.onclose = () => {
                    console.log(`❌ ${relay} - Failed`);
                    clearTimeout(timeout);
                    reject(new Error('Connection failed'));
                };
            });
        } catch (error) {
            console.log(`❌ ${relay} - Error: ${error.message}`);
        }
    }
}

function debugNostrState() {
    console.log('🔍 Nostr Debug State (v3.0 with nostr-tools):');
    console.log('- Current Board:', window.currentBoard?.name || 'None');
    console.log('- Stored Relays:', JSON.parse(localStorage.getItem('nostr-relays') || '[]'));
    console.log('- Has Credentials:', !!localStorage.getItem('nostr-credentials'));
    console.log('- nostr-tools Available:', !!window.nostrTools);
    console.log('- Crypto Ready:', !!window.cryptoReady);
    
    // Test Modal Elements
    const elements = [
        'nostr-private-key',
        'nostr-public-key',
        'nostr-relays',
        'remember-nostr-credentials'
    ];
    
    console.log('- Modal Elements:');
    elements.forEach(id => {
        const el = document.getElementById(id);
        console.log(`  ${id}: ${el ? '✅' : '❌'}`);
    });
}

// Test function for creating a sample board
function createTestBoardForNostr() {    const testBoard = {
        id: 'test-' + Date.now(),
        name: 'Test Board for Nostr',
        description: 'Test board for Nostr integration',
        summary: 'A test board to verify Nostr integration',
        authors: ['Test User'],
        backgroundColor: '#f5f7fa',
        backgroundHex: '#f5f7fa',
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
                id: 'col-1',
                name: 'To Do',
                color: 'color-gradient-1',
                cards: [                    {
                        id: 'card-1',
                        heading: 'Test Card',
                        content: 'This is a test card for Nostr integration',
                        color: 'color-gradient-1',
                        thumbnail: '',
                        labels: 'test, nostr',
                        comments: 'Test comment for Nostr integration',
                        url: 'https://github.com/nostr-protocol/nostr',
                        inactive: false
                    }
                ]
            }
        ]
    };
    
    // Set as current board
    window.currentBoard = testBoard;
    
    // Add to boards array
    if (!window.boards) window.boards = [];
    window.boards.push(testBoard);
    
    console.log('🎯 Test board created for Nostr testing:', testBoard.name);
    console.log('💡 You can now use publishBoardToNostr() to test publishing');
    
    return testBoard;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize only once
    if (!nostrInitialized) {
        initializeNostr();
        handleUrlImport();
    }
    
    // Auto-generate public key when private key is entered
    const privateKeyInput = document.getElementById('nostr-private-key');
    const publicKeyInput = document.getElementById('nostr-public-key');
    
    if (privateKeyInput && publicKeyInput) {
        privateKeyInput.addEventListener('input', async function() {
            const privateKey = this.value.trim();
            if (privateKey.length === 64 && /^[0-9a-fA-F]+$/i.test(privateKey)) {
                try {
                    await waitForNostrTools();
                    const publicKey = window.nostrTools.getPublicKey(privateKey);
                    publicKeyInput.value = publicKey;
                    console.log('🔑 Auto-generated public key using nostr-tools');
                } catch (error) {
                    console.error('Error generating public key:', error);
                    publicKeyInput.value = '';
                }
            } else {
                publicKeyInput.value = '';
            }
        });
    }
    
    // Make functions globally available
    window.openNostrModal = openNostrModal;
    window.generateNostrKeys = generateNostrKeys;
    window.publishBoardToNostr = publishBoardToNostr;
    window.copyNostrLink = copyNostrLink;
    window.copyPrivateKey = copyPrivateKey;
    window.copyPublicKey = copyPublicKey;
    window.togglePrivateKeyVisibility = togglePrivateKeyVisibility;
    window.importBoardFromNostr = importBoardFromNostr;
    
    // Debug functions
    window.testNostrConnection = testNostrConnection;
    window.debugNostrState = debugNostrState;
    window.createTestBoardForNostr = createTestBoardForNostr;
    
    console.log('🌐 Nostr integration v3.0 loaded successfully with nostr-tools');
    
    // Help messages for developers
    setTimeout(() => {
        console.log('📝 Nostr Integration v3.0 Quick Start:');
        console.log('1. createTestBoardForNostr() - Create a test board');
        console.log('2. debugNostrState() - Check current state');
        console.log('3. testNostrConnection() - Test relay connections');
        console.log('4. Open sidebar → "Via Nostr Teilen" to use the feature');
        console.log('🔧 Now using nostr-tools for authentic cryptography!');
    }, 2000);
});

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeNostr,
        publishBoardToNostr,
        importBoardFromNostr,
        openNostrModal
    };
}
