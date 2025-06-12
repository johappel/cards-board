/**
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
        
        // Try to encode in bech32 format if available
        let displayPrivateKey = privateKey;
        let displayPublicKey = publicKey;
        
        if (window.nostrTools.nip19) {
            try {
                displayPrivateKey = window.nostrTools.nip19.nsecEncode(privateKey);
                displayPublicKey = window.nostrTools.nip19.npubEncode(publicKey);
                console.log('✅ Keys encoded in bech32 format');
            } catch (error) {
                console.warn('⚠️ Failed to encode keys in bech32 format, using HEX:', error);
            }
        }
          // Store raw hex keys for actual use
        document.getElementById('nostr-private-key').dataset.hex = privateKey;
        document.getElementById('nostr-private-key').dataset.bech32 = displayPrivateKey;
        
        document.getElementById('nostr-public-key').dataset.hex = publicKey;
        document.getElementById('nostr-public-key').dataset.bech32 = displayPublicKey;
        
        // Update display format
        updateKeyDisplayFormat();
        
        // Auto-save if remember checkbox is checked
        const rememberCheckbox = document.getElementById('remember-nostr-credentials');
        if (rememberCheckbox && rememberCheckbox.checked) {
            saveNostrCredentials();
        }
        
        console.log('🔑 New Nostr keys generated with nostr-tools:', {
            private: privateKey.substring(0, 8) + '...',
            public: publicKey.substring(0, 8) + '...',
            privateDisplay: displayPrivateKey.substring(0, 12) + '...',
            publicDisplay: displayPublicKey.substring(0, 12) + '...'
        });
        
        showNostrMessage('✅ Neue Schlüssel generiert!', 'success');
        
        return { privateKey, publicKey, displayPrivateKey, displayPublicKey };
    } catch (error) {
        console.error('❌ Key generation error:', error);
        showNostrMessage('❌ Fehler beim Generieren der Schlüssel: ' + error.message, 'error');
    }
}

// Initialize Nostr functionality when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔗 DOM loaded, initializing Nostr...');
    
    // Initialize Nostr after a short delay to ensure all scripts are loaded
    setTimeout(() => {
        initializeNostr();
        checkImportParameter(); // Check for nevent import URLs
    }, 500);
});

// Also initialize when called directly
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
            
            // Add event listeners for automatic saving
            const rememberCheckbox = document.getElementById('remember-nostr-credentials');
            const privateKeyInput = document.getElementById('nostr-private-key');
            const publicKeyInput = document.getElementById('nostr-public-key');
            
            if (rememberCheckbox) {
                rememberCheckbox.addEventListener('change', function() {
                    saveNostrCredentials();
                });
            }
            
            // Auto-save when keys change (with debounce)
            let saveTimeout;
            function debouncedSave() {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    if (rememberCheckbox && rememberCheckbox.checked) {
                        saveNostrCredentials();
                    }
                }, 1000); // Save 1 second after user stops typing
            }
            
            if (privateKeyInput) {
                privateKeyInput.addEventListener('input', debouncedSave);
                privateKeyInput.addEventListener('paste', debouncedSave);
            }
            
            if (publicKeyInput) {
                publicKeyInput.addEventListener('input', debouncedSave);
                publicKeyInput.addEventListener('paste', debouncedSave);
            }
            
            console.log('✅ Nostr auto-save event listeners added');
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
        // Store both formats in dataset
        privateKeyInput.dataset.hex = credentials.nsec;
        privateKeyInput.dataset.bech32 = credentials.nsecBech32 || credentials.nsec;
        
        // Load the preferred display format
        updateKeyDisplayFormat();
    }
    if (publicKeyInput && credentials.npub) {
        // Store both formats in dataset
        publicKeyInput.dataset.hex = credentials.npub;
        publicKeyInput.dataset.bech32 = credentials.npubBech32 || credentials.npub;
        
        // Load the preferred display format
        updateKeyDisplayFormat();
    }
    if (rememberCheckbox) {
        rememberCheckbox.checked = !!credentials.nsec;
    }
    
    if (credentials.nsec) {
        console.log('✅ Nostr credentials loaded from localStorage', {
            saved: credentials.saved,
            hasKeys: true
        });
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
    
    // Use hex values for storage (internal format)
    const nsecHex = privateKeyInput.dataset.hex || privateKeyInput.value.trim();
    const npubHex = publicKeyInput.dataset.hex || publicKeyInput.value.trim();
    
    // Also store bech32 format for display
    const nsecBech32 = privateKeyInput.dataset.bech32 || '';
    const npubBech32 = publicKeyInput.dataset.bech32 || '';
    
    if (remember && nsecHex) {
        const credentials = {
            nsec: nsecHex,
            npub: npubHex,
            nsecBech32: nsecBech32,
            npubBech32: npubBech32,
            saved: new Date().toISOString()
        };
        localStorage.setItem('nostr-credentials', JSON.stringify(credentials));
        console.log('✅ Nostr credentials saved to localStorage');
        showNostrMessage('✅ Schlüssel im Browser gespeichert!', 'success');
    } else {
        localStorage.removeItem('nostr-credentials');
        console.log('🗑️ Nostr credentials removed from localStorage');
        if (!remember) {
            showNostrMessage('🗑️ Schlüssel aus Browser entfernt', 'info');
        }
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
            
            // Store published board link persistently
            const publishedEvent = {
                boardId: currentBoard.id,
                boardName: currentBoard.name,
                eventId: eventId,
                nevent: nevent,
                importUrl: importUrl,
                timestamp: new Date().toISOString(),
                isDraft: isDraft,
                relays: relays.slice(0, 3)
            };
            
            // Save to localStorage for persistent access
            let publishedEvents = JSON.parse(localStorage.getItem('nostr-published-events') || '[]');
            
            // Remove any existing entry for this board to avoid duplicates
            publishedEvents = publishedEvents.filter(event => event.boardId !== currentBoard.id);
            
            // Add new entry
            publishedEvents.unshift(publishedEvent); // Add to beginning for newest first
            
            // Keep only last 10 published events to prevent localStorage bloat
            publishedEvents = publishedEvents.slice(0, 10);
              localStorage.setItem('nostr-published-events', JSON.stringify(publishedEvents));
            
            console.log('💾 Published board link saved persistently:', {
                boardName: publishedEvent.boardName,
                eventId: eventId.substring(0, 16) + '...',
                timestamp: publishedEvent.timestamp
            });
            
            // Update the published boards history display if modal is open
            if (document.getElementById('nostr-modal').classList.contains('show')) {
                loadPublishedBoardsHistory();
            }
            
            console.log('🎉 Successfully published to Nostr:', {
                eventId: eventId.substring(0, 16) + '...',
                relaysSuccessful: results.success,
                relaysTotal: results.total,
                nevent: nevent.substring(0, 20) + '...'
            });
            
            // Return result object for programmatic use
            return {
                eventId: eventId,
                relaysSuccessful: results.success,
                relaysTotal: results.total,
                nevent: nevent,
                importUrl: importUrl,
                success: true
            };
            
        } else {
            const errorResult = {
                success: false,
                relaysSuccessful: 0,
                relaysTotal: results.total,
                errors: results.errors
            };
            
            showNostrMessage('Fehler beim Veröffentlichen: Keine Relays erreichbar.', 'error');
            if (results.errors.length > 0) {
                console.error('Relay errors:', results.errors);
            }
            
            return errorResult;
        }    } catch (error) {
        console.error('Publishing error:', error);
        showNostrMessage('Fehler beim Veröffentlichen: ' + error.message, 'error');
        
        // Return error result for programmatic use
        return {
            success: false,
            error: error.message,
            relaysSuccessful: 0,
            relaysTotal: 0
        };
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
    
    // Use nostr-tools finishEvent instead of finalizeEvent
    const signedEvent = window.nostrTools.finalizeEvent 
        ? window.nostrTools.finalizeEvent(eventTemplate, privateKeyHex)
        : window.nostrTools.finishEvent
        ? window.nostrTools.finishEvent(eventTemplate, privateKeyHex)
        : await window.nostrTools.signEvent(eventTemplate, privateKeyHex);
    
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
        console.warn('⚠️ Signature verification failed, but continuing with event');
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
          console.log('🔍 Searching for event ID:', eventData.eventId);
        console.log('📡 Using relays:', relays);
        
        const event = await fetchEventFromRelays(eventData.eventId, relays);
        
        if (!event) {
            console.error('❌ Event not found in any relay');
            throw new Error('Event nicht gefunden auf den konfigurierten Relays');
        }
        
        console.log('✅ Event found:', {
            id: event.id.substring(0, 16) + '...',
            kind: event.kind,
            pubkey: event.pubkey.substring(0, 16) + '...',
            created_at: event.created_at,
            content_length: event.content.length
        });
        
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
          // Clean up board data
        delete boardData.nostrEvent;
        delete boardData.exportDate;
        
        // Generate new ID to avoid conflicts
        boardData.id = generateId();
        
        // Import board - FIX: Robust duplicate prevention and synchronization
        console.log('📋 Before import - boards state:');
        console.log('- window.boards length:', window.boards?.length || 0);
        console.log('- global boards length:', typeof boards !== 'undefined' ? boards.length : 'undefined');
          // Ensure we have the correct boards array
        let boardsArray = window.boards || (typeof boards !== 'undefined' ? boards : []);
        
        // Create user-friendly unique name - much better than long timestamps!
        const originalName = boardData.name;
        
        // Check if board with this name already exists
        const existingNames = boardsArray.map(b => b.name);
        let finalName = originalName;
        
        // If original name exists, add simple (Imported) suffix
        if (existingNames.includes(originalName)) {
            finalName = `${originalName} (Imported)`;
        }
        
        // If even (Imported) version exists, add numbers: (Imported 2), (Imported 3), etc.
        let counter = 2;
        while (existingNames.includes(finalName)) {
            finalName = `${originalName} (Imported ${counter})`;
            counter++;
        }
        
        boardData.name = finalName;
        console.log('✅ Generated user-friendly board name:', boardData.name);
          // Add the board to the array
        boardsArray.push(boardData);
        
        // Update both references to ensure consistency
        window.boards = boardsArray;
        if (typeof boards !== 'undefined') {
            boards = boardsArray;
        }
        
        console.log('📋 After import - boards state:');
        console.log('- window.boards length:', window.boards.length);
        console.log('- global boards length:', typeof boards !== 'undefined' ? boards.length : 'undefined');
        console.log('- Added board:', boardData.name);
          // Save the boards - Use proper application storage mechanism
        try {
            console.log('💾 Saving imported board through application storage...');
            
            // First: Use the application's proper save function
            if (typeof saveAllBoards === 'function') {
                saveAllBoards();
                console.log('✅ Saved via saveAllBoards()');
            } else if (typeof window.KanbanStorage !== 'undefined' && typeof window.KanbanStorage.saveBoards === 'function') {
                await window.KanbanStorage.saveBoards(boardsArray);
                console.log('✅ Saved via KanbanStorage.saveBoards()');
            } else {
                // Fallback: Use the correct localStorage key that the application uses
                // Check what storage key the app actually uses
                const existingData = localStorage.getItem('kanban_boards_v1') || localStorage.getItem('kanban-boards');
                const storageKey = localStorage.getItem('kanban_boards_v1') ? 'kanban_boards_v1' : 'kanban-boards';
                
                const storageData = { boards: boardsArray };
                localStorage.setItem(storageKey, JSON.stringify(storageData));
                console.log(`✅ Saved to localStorage with key: ${storageKey}`);
            }
            
            // Verify the save worked
            setTimeout(() => {
                const verifyData = localStorage.getItem('kanban_boards_v1') || localStorage.getItem('kanban-boards');
                if (verifyData) {
                    const parsed = JSON.parse(verifyData);
                    const savedBoards = parsed.boards || parsed;
                    const importedBoard = savedBoards.find(b => b.name === boardData.name);
                    if (importedBoard) {
                        console.log('✅ Import verified: Board successfully saved to storage');
                    } else {
                        console.warn('⚠️ Import verification failed: Board not found in storage');
                    }
                } else {
                    console.warn('⚠️ No data found in localStorage after save');
                }
            }, 100);
            
        } catch (saveError) {
            console.error('❌ Error saving boards:', saveError);
            // Show error but don't fail the import completely
            showNostrMessage('Board importiert, aber möglicherweise nicht gespeichert: ' + saveError.message, 'warning');
        }
        
        showNostrMessage('Board erfolgreich importiert!', 'success');
        
        // Force switch to dashboard to show imported board
        console.log('🔄 Switching to dashboard to show imported board...');
        
        // Hide board view if currently shown
        const boardView = document.getElementById('board-view');
        if (boardView) {
            boardView.style.display = 'none';
        }
        
        // Show dashboard
        const dashboard = document.getElementById('dashboard');
        if (dashboard) {
            dashboard.style.display = 'block';
        }
        
        // Update URL to dashboard
        window.history.pushState({}, document.title, window.location.pathname);
        
        // Clear current board
        window.currentBoard = null;
        if (typeof currentBoard !== 'undefined') {
            currentBoard = null;
        }
          // Render dashboard with new board
        if (typeof renderDashboard === 'function') {
            renderDashboard();
            console.log('✅ Dashboard rendered with imported board');
            
            // Highlight the newly imported board for better visibility
            setTimeout(() => {
                const boardCards = document.querySelectorAll('.board-card');
                const importedBoard = Array.from(boardCards).find(card => 
                    card.querySelector('h3')?.textContent?.includes(boardData.name)
                );
                
                if (importedBoard) {
                    importedBoard.style.border = '3px solid #4CAF50';
                    importedBoard.style.boxShadow = '0 0 15px rgba(76, 175, 80, 0.5)';
                    
                    // Add "NEW IMPORT" badge
                    const badge = document.createElement('div');
                    badge.innerHTML = '🌐 IMPORTED';
                    badge.style.cssText = `
                        position: absolute;
                        top: 10px;
                        right: 10px;
                        background: #4CAF50;
                        color: white;
                        padding: 4px 8px;
                        border-radius: 12px;
                        font-size: 0.7rem;
                        font-weight: bold;
                        z-index: 10;
                    `;
                    importedBoard.style.position = 'relative';
                    importedBoard.appendChild(badge);
                    
                    // Remove highlight after 10 seconds
                    setTimeout(() => {
                        importedBoard.style.border = '';
                        importedBoard.style.boxShadow = '';
                        if (badge.parentNode) {
                            badge.parentNode.removeChild(badge);
                        }
                    }, 10000);
                    
                    console.log('✨ Imported board highlighted in dashboard');
                }
            }, 500);
        } else {
            console.warn('⚠️ renderDashboard function not available');
            // Fallback: Force page refresh to show the imported board
            setTimeout(() => {
                if (confirm('Board wurde importiert! Seite neu laden um das Board zu sehen?')) {
                    window.location.reload();
                }
            }, 1000);
        }
        
        // Notify chatbot about board change if applicable
        if (typeof window.handleBoardChange === 'function') {
            window.handleBoardChange(null);
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
            // Enhanced subscription for Replaceable Events (kinds 30023/30024)
            const subscription = JSON.stringify([
                'REQ', 
                'import_' + Math.random().toString(36).substring(7),
                { 
                    ids: [eventId],
                    kinds: [30023, 30024] // Include both live and draft kinds
                }
            ]);
            console.log(`📤 Sending subscription to ${relayUrl}:`, subscription);
            ws.send(subscription);
        };
          ws.onmessage = (msg) => {
            try {
                const data = JSON.parse(msg.data);
                console.log(`📨 Message from ${relayUrl}:`, data);
                
                if (data[0] === 'EVENT' && data[2] && data[2].id === eventId) {
                    console.log(`✅ Found matching event from ${relayUrl}`);
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        ws.close();
                        resolve(data[2]);
                    }
                } else if (data[0] === 'EOSE') {
                    console.log(`📋 End of stored events from ${relayUrl} - no matching event found`);
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        ws.close();
                        reject(new Error('Event not found'));
                    }
                } else if (data[0] === 'NOTICE') {
                    console.log(`📢 Notice from ${relayUrl}:`, data[1]);
                }
            } catch (e) {
                console.warn(`Failed to parse message from ${relayUrl}:`, e, msg.data);
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

// Nevent String Utilities
function createNeventString(eventId, relays = []) {
    console.log('🔍 Creating nevent for Event ID:', eventId.substring(0, 16) + '...');
    console.log('📏 Event ID length:', eventId.length);
    console.log('🔗 Relays:', relays);
    
    // Validate eventId format first
    if (!eventId || typeof eventId !== 'string' || !/^[0-9a-fA-F]{64}$/.test(eventId)) {
        console.error('❌ Invalid eventId format for nevent creation:', {
            eventId: eventId,
            type: typeof eventId,
            length: eventId ? eventId.length : 0,
            isHex: eventId ? /^[0-9a-fA-F]+$/.test(eventId) : false
        });
        throw new Error('Invalid eventId: must be 64 hex characters');
    }
    
    // Use NIP-19 nevent format if nostr-tools is available
    try {
        if (window.nostrTools && window.nostrTools.nip19) {
            console.log('🔧 Available NIP-19 functions:', Object.keys(window.nostrTools.nip19));
            
            // Try different method names that might be available
            const encodeFunction = window.nostrTools.nip19.neventEncode || 
                                   window.nostrTools.nip19.encodeNevent ||
                                   window.nostrTools.nip19.encode;
            
            if (encodeFunction) {
                const neventData = {
                    id: eventId,
                    relays: relays.slice(0, 3) // Max 3 relays for compatibility
                };
                
                console.log('🔧 nevent data for encoding:', neventData);
                
                let encoded;
                if (window.nostrTools.nip19.neventEncode) {
                    encoded = window.nostrTools.nip19.neventEncode(neventData);
                } else if (window.nostrTools.nip19.encode) {
                    encoded = window.nostrTools.nip19.encode('nevent', neventData);
                } else {
                    encoded = encodeFunction(neventData);
                }
                
                console.log('✅ NIP-19 nevent encoded:', encoded.substring(0, 30) + '...');
                
                // Validate the encoded nevent
                if (encoded && encoded.startsWith('nevent1') && encoded.length > 20) {
                    return encoded;
                } else {
                    console.warn('⚠️ Invalid nevent encoding result:', encoded);
                    throw new Error('Invalid nevent encoding result');
                }
            } else {
                console.warn('⚠️ No nevent encoding function found in NIP-19');
            }
        } else {
            console.warn('⚠️ nostr-tools or NIP-19 not available');
        }
    } catch (error) {
        console.warn('❌ Failed to use NIP-19 nevent encoding:', error);
    }
    
    // Fallback: simple nevent format with validation
    console.log('🔄 Using fallback nevent encoding');
    const data = {
        eventId: eventId,
        relays: relays.slice(0, 3) // Max 3 relays
    };
    
    try {
        // Base64 encode for transport
        const encoded = btoa(JSON.stringify(data));
        const fallbackNevent = `nevent1${encoded}`;
        console.log('✅ Fallback nevent created:', fallbackNevent.substring(0, 30) + '...');
        
        // Validate fallback nevent can be parsed
        try {
            const testParse = JSON.parse(atob(encoded));
            if (testParse.eventId === eventId) {
                return fallbackNevent;
            } else {
                throw new Error('Fallback nevent validation failed');
            }
        } catch (parseError) {
            console.error('❌ Fallback nevent validation failed:', parseError);
            throw parseError;
        }    } catch (error) {
                console.error('❌ Fallback nevent creation failed:', error);
        throw new Error('Failed to create nevent string');
    }
}

function parseNeventString(nevent) {
    console.log('🔍 Parsing nevent string:', nevent.substring(0, 30) + '...');
    console.log('📏 nevent length:', nevent.length);
    
    try {
        // Try NIP-19 decoding first
        if (window.nostrTools && window.nostrTools.nip19 && window.nostrTools.nip19.decode) {
            console.log('🔧 Attempting NIP-19 decoding...');
            const decoded = window.nostrTools.nip19.decode(nevent);
            console.log('✅ NIP-19 decoded:', decoded);
            
            if (decoded.type === 'nevent') {
                const result = {
                    eventId: decoded.data.id,
                    relays: decoded.data.relays || []
                };
                console.log('📋 Extracted event data:', result);
                return result;
            }
        }
    } catch (error) {
        console.warn('❌ NIP-19 decoding failed, trying fallback:', error);
    }
    
    try {
        // Fallback for our custom format
        console.log('🔄 Using fallback nevent parsing...');
        if (!nevent.startsWith('nevent1')) {
            throw new Error('Invalid nevent format');
        }
        
        const encoded = nevent.substring(7); // Remove 'nevent1'
        const decoded = JSON.parse(atob(encoded));
        console.log('✅ Fallback parsed:', decoded);
        
        // Validate that eventId is hex
        if (decoded.eventId && /^[0-9a-fA-F]{64}$/.test(decoded.eventId)) {
            return {
                eventId: decoded.eventId,
                relays: decoded.relays || []
            };
        } else {
            throw new Error('Invalid eventId format in fallback data');
        }
    } catch (error) {
        console.warn('❌ Fallback parsing failed:', error);
        
        // Final fallback - but validate hex format
        const rawEventId = nevent.replace('nevent1', '');
        console.log('🆘 Attempting final fallback extraction...');
        
        // Check if it's a valid 64-character hex string
        if (/^[0-9a-fA-F]{64}$/.test(rawEventId)) {
            console.log('✅ Valid hex eventId found:', rawEventId.substring(0, 16) + '...');
            return {
                eventId: rawEventId,
                relays: []
            };
        } else {
            console.error('❌ Invalid eventId format - not 64 hex characters:', rawEventId.substring(0, 16) + '...');
            console.error('❌ Character analysis:', {
                length: rawEventId.length,
                isHex: /^[0-9a-fA-F]+$/.test(rawEventId),
                first16: rawEventId.substring(0, 16),
                containsNonHex: rawEventId.match(/[^0-9a-fA-F]/g)
            });
            throw new Error('Cannot extract valid eventId from nevent - invalid format');
        }
    }
}

// UI Helper Functions
function openNostrModal() {
    saveNostrCredentials(); // Save current state
    loadNostrCredentials(); // Reload to show saved state
    loadNostrRelays();
    loadPublishedBoardsHistory(); // Load published boards history
    
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

// Key display format management
function updateKeyDisplayFormat() {
    const privateKeyInput = document.getElementById('nostr-private-key');
    const publicKeyInput = document.getElementById('nostr-public-key');
    
    if (!privateKeyInput || !publicKeyInput) return;
    
    // Check if we should show bech32 format
    const showBech32 = localStorage.getItem('nostr-show-bech32') === 'true';
    
    if (showBech32 && privateKeyInput.dataset.bech32) {
        privateKeyInput.value = privateKeyInput.dataset.bech32;
        publicKeyInput.value = publicKeyInput.dataset.bech32;
    } else if (privateKeyInput.dataset.hex) {
        privateKeyInput.value = privateKeyInput.dataset.hex;
        publicKeyInput.value = publicKeyInput.dataset.hex;
    }
}

function toggleKeyDisplayFormat() {
    const currentFormat = localStorage.getItem('nostr-show-bech32') === 'true';
    localStorage.setItem('nostr-show-bech32', (!currentFormat).toString());
    updateKeyDisplayFormat();
    
    const format = !currentFormat ? 'bech32 (nsec/npub)' : 'hex';
    showNostrMessage(`🔄 Key format switched to ${format}`, 'info');
}

function clearKeyDatasets() {
    const privateKeyInput = document.getElementById('nostr-private-key');
    const publicKeyInput = document.getElementById('nostr-public-key');
    
    if (privateKeyInput) {
        delete privateKeyInput.dataset.hex;
        delete privateKeyInput.dataset.bech32;
    }
    
    if (publicKeyInput) {
        delete publicKeyInput.dataset.hex;
        delete publicKeyInput.dataset.bech32;
    }
}

// Published Boards History Management
function loadPublishedBoardsHistory() {
    const publishedEvents = JSON.parse(localStorage.getItem('nostr-published-events') || '[]');
    const container = document.getElementById('nostr-published-boards');
    const noHistoryDiv = document.getElementById('nostr-no-history');
    
    if (!container) return;
    
    // Clear existing content except no-history div
    const boardElements = container.querySelectorAll('.nostr-published-board');
    boardElements.forEach(el => el.remove());
    
    if (publishedEvents.length === 0) {
        noHistoryDiv.style.display = 'block';
        return;
    }
    
    noHistoryDiv.style.display = 'none';
    
    // Create board entries
    publishedEvents.forEach((event, index) => {
        const boardElement = createPublishedBoardElement(event, index);
        container.appendChild(boardElement);
    });
    
    console.log(`📚 Loaded ${publishedEvents.length} published board(s) from history`);
}

function createPublishedBoardElement(event, index) {
    const div = document.createElement('div');
    div.className = 'nostr-published-board';
    
    const publishDate = new Date(event.timestamp).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const shortEventId = event.eventId ? event.eventId.substring(0, 8) + '...' : 'N/A';
    const relayCount = event.relays ? event.relays.length : 0;
    
    div.innerHTML = `
        <div class="nostr-published-board-header">
            <div class="nostr-published-board-name" title="${event.boardName}">
                ${event.boardName || 'Unbenanntes Board'}
            </div>
            <div class="nostr-published-board-type ${event.isDraft ? 'draft' : ''}">
                ${event.isDraft ? 'Entwurf' : 'Live'}
            </div>
        </div>
        <div class="nostr-published-board-meta">
            📅 ${publishDate} • 🆔 ${shortEventId} • 🌐 ${relayCount} Relays
        </div>
        <div class="nostr-published-board-actions">
            <button class="nostr-mini-btn copy" onclick="copyPublishedBoardLink('${index}')" title="Link kopieren">
                📋 Kopieren
            </button>
            <button class="nostr-mini-btn" onclick="openPublishedBoardLink('${index}')" title="Board öffnen">
                🔗 Öffnen
            </button>
            <button class="nostr-mini-btn delete" onclick="deletePublishedBoard('${index}')" title="Aus Historie entfernen">
                🗑️ Entfernen
            </button>
        </div>
    `;
    
    return div;
}

function copyPublishedBoardLink(index) {
    const publishedEvents = JSON.parse(localStorage.getItem('nostr-published-events') || '[]');
    const event = publishedEvents[index];
    
    if (!event || !event.importUrl) {
        showNostrMessage('❌ Link nicht verfügbar', 'error');
        return;
    }
    
    try {
        navigator.clipboard.writeText(event.importUrl).then(() => {
            showNostrMessage('✅ Link kopiert!', 'success');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = event.importUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showNostrMessage('✅ Link kopiert!', 'success');
        });
    } catch (err) {
        showNostrMessage('❌ Kopieren fehlgeschlagen', 'error');
        console.error('Copy failed:', err);
    }
}

function openPublishedBoardLink(index) {
    const publishedEvents = JSON.parse(localStorage.getItem('nostr-published-events') || '[]');
    const event = publishedEvents[index];
    
    if (!event || !event.importUrl) {
        showNostrMessage('❌ Link nicht verfügbar', 'error');
        return;
    }
    
    // Close modal first
    closeModal('nostr-modal');
    
    // Open link in new tab
    window.open(event.importUrl, '_blank');
    showNostrMessage('🔗 Board-Link geöffnet', 'info');
}

function deletePublishedBoard(index) {
    const publishedEvents = JSON.parse(localStorage.getItem('nostr-published-events') || '[]');
    
    if (index < 0 || index >= publishedEvents.length) return;
    
    const event = publishedEvents[index];
    const boardName = event.boardName || 'Unbenanntes Board';
    
    if (confirm(`Board "${boardName}" aus der Historie entfernen?\n\nDas Board bleibt auf Nostr verfügbar, wird aber nicht mehr in dieser Liste angezeigt.`)) {
        publishedEvents.splice(index, 1);
        localStorage.setItem('nostr-published-events', JSON.stringify(publishedEvents));
        
        // Reload the history display
        loadPublishedBoardsHistory();
        
        showNostrMessage(`🗑️ "${boardName}" aus Historie entfernt`, 'info');
        console.log(`🗑️ Removed published board from history: ${boardName}`);
    }
}

// Check for import parameter on page load
function checkImportParameter() {
    const urlParams = new URLSearchParams(window.location.search);
    const importParam = urlParams.get('import');
    
    if (importParam && importParam.startsWith('nevent1')) {
        console.log('🔗 Found Nostr import parameter:', importParam.substring(0, 20) + '...');
        
        // Prevent duplicate imports
        if (window.nostrImportInProgress) {
            console.log('⚠️ Import already in progress, ignoring duplicate request');
            return;
        }
        
        window.nostrImportInProgress = true;
        
        // Remove URL parameter immediately to prevent duplicate imports
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Show loading message
        if (typeof showNostrMessage === 'function') {
            showNostrMessage('Importiere Board von Nostr...', 'info');
        }
        
        setTimeout(async () => {
            try {
                await importBoardFromNostr(importParam);
                console.log('✅ Auto-import completed successfully');
            } catch (error) {
                console.error('❌ Auto-import failed:', error);
                if (typeof showNostrMessage === 'function') {
                    showNostrMessage('Import fehlgeschlagen: ' + error.message, 'error');
                }
            } finally {
                // Reset flag after import attempt
                window.nostrImportInProgress = false;
            }
        }, 1000); // Give time for the page to load
    }
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

// Test function for complete publish-import workflow
async function testPublishImportWorkflow() {
    console.log('🚀 Testing complete Publish-Import workflow...');
    
    try {
        // 1. Create test board
        const testBoard = createTestBoardForNostr();
        console.log('✅ Step 1: Test board created');
        
        // 2. Generate keys
        const keys = await generateNostrKeys();
        console.log('✅ Step 2: Keys generated');
        
        // 3. Publish board
        console.log('📤 Step 3: Publishing board...');
        const publishResult = await publishBoardToNostr();
        
        if (!publishResult || !publishResult.success) {
            throw new Error('Publishing failed: ' + (publishResult?.error || 'Unknown error'));
        }
        
        console.log('✅ Step 3: Board published successfully');
        console.log('🔗 nevent:', publishResult.nevent.substring(0, 30) + '...');
        
        // 4. Wait a moment for relay propagation
        console.log('⏳ Step 4: Waiting for relay propagation (3 seconds)...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 5. Test import
        console.log('📥 Step 5: Testing import...');
        const importResult = await importBoardFromNostr(publishResult.nevent);
        
        console.log('✅ Step 5: Import successful');
        console.log('🎉 Complete workflow test passed!');
        
        return {
            success: true,
            publishResult,
            importResult,
            message: 'Complete publish-import workflow successful'
        };
          } catch (error) {
        console.error('❌ Workflow test failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Debug function specifically for import issues
async function debugImportIssue(nevent) {
    console.log('🔍 Debugging import issue for nevent:', nevent.substring(0, 30) + '...');
    
    try {
        // 1. Parse nevent
        const eventData = parseNeventString(nevent);
        console.log('✅ Parsed nevent:', eventData);
        
        // 2. Get relays
        const relays = eventData.relays.length > 0 
            ? eventData.relays 
            : JSON.parse(localStorage.getItem('nostr-relays') || '[]').concat(defaultRelays);
        console.log('📡 Will search these relays:', relays);
        
        // 3. Test each relay manually
        for (const relay of relays.slice(0, 2)) { // Test first 2 relays
            console.log(`🔍 Testing ${relay}...`);
            
            try {
                const event = await fetchEventFromRelay(eventData.eventId, relay);
                if (event) {
                    console.log(`✅ Found event on ${relay}:`, {
                        id: event.id.substring(0, 16) + '...',
                        kind: event.kind,
                        pubkey: event.pubkey.substring(0, 16) + '...',
                        created_at: new Date(event.created_at * 1000).toISOString(),
                        content_preview: event.content.substring(0, 100) + '...'
                    });
                    
                    // 4. Test board creation from event
                    console.log('🧪 Testing board creation from event...');
                    try {
                        const boardData = JSON.parse(event.content);
                        console.log('✅ Board data parsed:', {
                            name: boardData.name,
                            columns: boardData.columns?.length || 0,
                            cards: boardData.columns?.reduce((sum, col) => sum + (col.cards?.length || 0), 0) || 0
                        });
                        
                        // Test if dashboard functions are available
                        console.log('🔧 Checking dashboard functions...');
                        console.log('- window.boards:', Array.isArray(window.boards) ? `Array[${window.boards.length}]` : typeof window.boards);
                        console.log('- saveAllBoards:', typeof saveAllBoards);
                        console.log('- renderDashboard:', typeof renderDashboard);
                        console.log('- currentBoard:', window.currentBoard?.name || 'null');
                        
                        return event;
                    } catch (parseError) {
                        console.error('❌ Failed to parse board data:', parseError);
                    }
                } else {
                    console.log(`❌ Event not found on ${relay}`);
                }
            } catch (error) {
                console.log(`❌ Error with ${relay}:`, error.message);
            }
        }
        
        console.log('❌ Event not found on any tested relay');
        return null;
        
    } catch (error) {
        console.error('❌ Debug failed:', error);
        return null;
    }
}

// Test the complete import workflow
async function testImportWorkflow(nevent) {
    console.log('🧪 Testing complete import workflow...');
    console.log('📋 Initial state:');
    console.log('- Boards count:', window.boards?.length || 0);
    console.log('- Current view:', document.getElementById('board-view').style.display !== 'none' ? 'board' : 'dashboard');
    
    try {
        const result = await importBoardFromNostr(nevent);
        console.log('✅ Import completed');
        console.log('📋 Final state:');
        console.log('- Boards count:', window.boards?.length || 0);
        console.log('- Current view:', document.getElementById('board-view').style.display !== 'none' ? 'board' : 'dashboard');
        console.log('- Dashboard visible:', document.getElementById('dashboard').style.display !== 'none');
        return result;
    } catch (error) {
        console.error('❌ Import workflow failed:', error);
        return null;
    }
}

// Test function for creating a sample board
function createTestBoardForNostr() {
    const testBoard = {
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
        checkImportParameter(); // Check for nevent import URLs
    }
    
    // Auto-generate public key when private key is entered
    const privateKeyInput = document.getElementById('nostr-private-key');
    const publicKeyInput = document.getElementById('nostr-public-key');
    
    if (privateKeyInput && publicKeyInput) {        privateKeyInput.addEventListener('input', async function() {
            const inputValue = this.value.trim();
            
            if (!inputValue) {
                // Clear everything if input is empty
                publicKeyInput.value = '';
                clearKeyDatasets();
                return;
            }
            
            try {
                await waitForNostrTools();
                let privateKeyHex = null;
                
                // Handle different input formats
                if (inputValue.startsWith('nsec1')) {
                    // Bech32 format nsec
                    try {
                        const decoded = window.nostrTools.nip19.decode(inputValue);
                        if (decoded.type === 'nsec') {
                            privateKeyHex = decoded.data;
                        }
                    } catch (e) {
                        console.warn('Invalid nsec format:', e);
                        publicKeyInput.value = '';
                        return;
                    }
                } else if (inputValue.length === 64 && /^[0-9a-fA-F]+$/i.test(inputValue)) {
                    // HEX format
                    privateKeyHex = inputValue;
                } else {
                    // Invalid format - clear public key but don't throw error yet (user might still be typing)
                    if (inputValue.length > 10) { // Only clear if they've typed enough to indicate intent
                        publicKeyInput.value = '';
                    }
                    return;
                }
                
                if (privateKeyHex) {
                    // Generate public key
                    const publicKeyHex = window.nostrTools.getPublicKey(privateKeyHex);
                    
                    // Generate bech32 formats
                    const nsecBech32 = window.nostrTools.nip19.nsecEncode(privateKeyHex);
                    const npubBech32 = window.nostrTools.nip19.npubEncode(publicKeyHex);
                    
                    // Store both formats in datasets
                    privateKeyInput.dataset.hex = privateKeyHex;
                    privateKeyInput.dataset.bech32 = nsecBech32;
                    publicKeyInput.dataset.hex = publicKeyHex;
                    publicKeyInput.dataset.bech32 = npubBech32;
                    
                    // Update display based on current format preference
                    const showBech32 = localStorage.getItem('nostr-show-bech32') === 'true';
                    if (showBech32) {
                        if (!inputValue.startsWith('nsec1')) {
                            // User entered HEX, show bech32
                            privateKeyInput.value = nsecBech32;
                        }
                        publicKeyInput.value = npubBech32;
                    } else {
                        if (inputValue.startsWith('nsec1')) {
                            // User entered bech32, show HEX
                            privateKeyInput.value = privateKeyHex;
                        }
                        publicKeyInput.value = publicKeyHex;
                    }
                    
                    // Auto-save if remember is checked
                    const rememberCheckbox = document.getElementById('nostr-remember-keys');
                    if (rememberCheckbox && rememberCheckbox.checked) {
                        saveNostrCredentials();
                    }
                    
                    console.log('🔑 Auto-generated key pair from manual entry');
                }
                
            } catch (error) {
                console.error('Error processing private key input:', error);
                publicKeyInput.value = '';
                clearKeyDatasets();
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
    window.importBoardFromNostr = importBoardFromNostr;    // Debug functions
    window.testNostrConnection = testNostrConnection;
    window.debugNostrState = debugNostrState;
    window.createTestBoardForNostr = createTestBoardForNostr;
    window.testPublishImportWorkflow = testPublishImportWorkflow;
    window.debugImportIssue = debugImportIssue;
    window.testImportWorkflow = testImportWorkflow;
      console.log('🌐 Nostr integration v3.0 loaded successfully with nostr-tools');
    
    // Help messages for developers
    setTimeout(() => {
        console.log('📝 Nostr Integration v3.0 Quick Start:');
        console.log('1. createTestBoardForNostr() - Create a test board');
        console.log('2. debugNostrState() - Check current state');
        console.log('3. testNostrConnection() - Test relay connections');
        console.log('4. testPublishImportWorkflow() - Test complete workflow');
        console.log('5. debugImportIssue(nevent) - Debug import problems');
        console.log('6. testImportWorkflow(nevent) - Test complete import process');
        console.log('7. Open sidebar → "Via Nostr Teilen" to use the feature');
        console.log('🔧 Now using nostr-tools for authentic cryptography!');
        console.log('🔄 Fixed: Board import now correctly switches to dashboard view');
    }, 2000);
});

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeNostr,
        publishBoardToNostr,
        importBoardFromNostr,
        openNostrModal    };
}
