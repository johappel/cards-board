// Direkter Publishing-Test für Nostr Integration
// In Browser-Console ausführen

async function testDirectPublishing() {
    console.log('🚀 Starting Direct Publishing Test...');
    
    try {
        // 1. Warten auf nostr-tools
        await waitForNostrTools();
        console.log('✅ nostr-tools ready');
        
        // 2. Keys generieren
        const keys = await generateNostrKeys();
        console.log('✅ Keys generated:', {
            public: keys.publicKey,
            private: keys.privateKey.substring(0, 8) + '...',
            displayFormat: keys.displayPublicKey ? 'bech32' : 'hex'
        });
        
        // 3. Test-Board erstellen
        const testBoard = createTestBoardForNostr();
        console.log('✅ Test board created:', testBoard.name);
          // 4. Board zu Nostr publishen
        console.log('📤 Publishing to Nostr...');
        
        // Set keys in UI for publishBoardToNostr()
        document.getElementById('nostr-private-key').value = keys.privateKey;
        document.getElementById('nostr-public-key').value = keys.publicKey;
        
        // Set current board for publishing
        window.currentBoard = testBoard;
        
        const result = await publishBoardToNostr();
        
        if (!result || !result.success) {
            throw new Error('Publishing failed: ' + (result?.error || 'Unknown error'));
        }
        
        console.log('🎉 Publishing successful!', {
            eventId: result.eventId.substring(0, 16) + '...',
            relaysSuccessful: result.relaysSuccessful,
            nevent: result.nevent.substring(0, 20) + '...'
        });
        
        // 5. Test import URL generation
        const importUrl = result.importUrl;
        console.log('🔗 Import URL:', importUrl);
        
        return result;
        
    } catch (error) {
        console.error('❌ Publishing failed:', error);
        return null;
    }
}

// Schnell-Test für UI-Modal
function testNostrUI() {
    console.log('🖥️ Testing Nostr UI...');
    
    try {
        // Test Modal öffnen
        openNostrModal();
        console.log('✅ Modal opened successfully');
        
        // Test key format toggle
        setTimeout(() => {
            if (typeof toggleKeyDisplayFormat === 'function') {
                console.log('🔄 Testing key format toggle...');
                toggleKeyDisplayFormat();
                console.log('✅ Key format toggled');
            } else {
                console.warn('⚠️ toggleKeyDisplayFormat function not available');
            }
        }, 1000);
        
        // Test key generation
        setTimeout(() => {
            if (typeof generateNostrKeys === 'function') {
                console.log('🔑 Testing key generation...');
                generateNostrKeys().then(() => {
                    console.log('✅ Keys generated successfully');
                }).catch(error => {
                    console.error('❌ Key generation failed:', error);
                });
            } else {
                console.warn('⚠️ generateNostrKeys function not available');
            }
        }, 2000);
        
        return true;
    } catch (error) {
        console.error('❌ UI test failed:', error);
        return false;
    }
}

// Relay-Test einzeln
async function testSingleRelay() {
    console.log('🔌 Testing single relay connection...');
    try {
        await waitForNostrTools();
        const keys = await generateNostrKeys();
        const testBoard = createTestBoardForNostr();
        
        // Erstelle ein Test-Event
        const event = {
            kind: 30023,
            created_at: Math.floor(Date.now() / 1000),
            tags: [
                ['d', testBoard.id],
                ['title', testBoard.name],
                ['description', testBoard.description || 'Test board for Nostr integration']
            ],
            content: JSON.stringify(testBoard),
            pubkey: keys.publicKey
        };
        
        // Event signieren
        const signedEvent = window.nostrTools.finishEvent(event, keys.privateKey);
        console.log('✅ Event signed:', signedEvent.id);
        
        // Zu einem einzelnen Relay publishen
        const result = await publishToRelay(signedEvent, 'wss://relay.damus.io');
        console.log('🎉 Single relay test successful:', result);
        
    } catch (error) {
        console.error('❌ Single relay test failed:', error);
    }
}

// Umfassender Test mit Import-Verify
async function testFullWorkflow() {
    console.log('🔄 Testing complete publish→import workflow...');
      try {
        // 1. Publish a board
        console.log('🔄 Step 1: Publishing board...');
        const publishResult = await testDirectPublishing();
        
        if (!publishResult || !publishResult.success) {
            throw new Error('Publishing failed');
        }
        
        console.log('✅ Step 1 complete: Board published successfully');
        
        // 2. Test import parsing
        console.log('🔍 Step 2: Testing nevent parsing...');
        const eventData = parseNeventString(publishResult.nevent);
        console.log('✅ Step 2 complete: Parsed event data:', eventData);
        
        // 3. Generate import URL
        const importUrl = publishResult.importUrl;
        console.log('🔗 Step 3: Generated import URL:', importUrl);
        
        // 4. Suggest manual import test
        console.log('💡 Step 4: To test import, open this URL in a new tab:', importUrl);
        
        return {
            publishResult,
            eventData,
            importUrl,
            success: true
        };
        
    } catch (error) {
        console.error('❌ Full workflow test failed:', error);
        return null;
    }
}

// Enhanced test full workflow with rendering validation
async function testFullWorkflow() {
    console.log('🔄 Starting Full Workflow Test (Create → Render → Publish → Import)...');
    
    try {
        // Step 1: Test board rendering
        console.log('\n📋 Step 1: Board Rendering Test');
        const renderingSuccess = await testBoardRendering();
        if (!renderingSuccess) {
            throw new Error('Board rendering failed');
        }
        
        // Step 2: Test publishing
        console.log('\n📤 Step 2: Publishing Test');
        const publishResult = await testDirectPublishing();
        if (!publishResult || !publishResult.success) {
            throw new Error('Publishing failed');
        }
        
        // Step 3: Test import URL
        console.log('\n🔗 Step 3: Import URL Test');
        const importUrl = publishResult.importUrl;
        console.log('Generated import URL:', importUrl);
        
        // Extract nevent from URL
        const neventMatch = importUrl.match(/[?&]import=([^&]+)/);
        if (neventMatch) {
            const nevent = decodeURIComponent(neventMatch[1]);
            console.log('✅ Extracted nevent:', nevent.substring(0, 20) + '...');
            
            // Validate nevent format
            if (nevent.startsWith('nevent1')) {
                console.log('✅ nevent format is correct');
            } else {
                console.warn('⚠️ nevent format may be incorrect');
            }
        } else {
            throw new Error('Could not extract nevent from import URL');
        }
        
        console.log('\n🎉 Full workflow test completed successfully!');
        console.log('📊 Summary:', {
            rendering: '✅ Success',
            publishing: '✅ Success',
            eventId: publishResult.eventId.substring(0, 16) + '...',
            relaysSuccessful: publishResult.relaysSuccessful,
            importUrl: '✅ Generated'
        });
        
        return true;
        
    } catch (error) {
        console.error('❌ Full workflow test failed:', error);
        return false;
    }
}

// Test nevent Format
function testNeventFormat() {
    console.log('🧪 Testing nevent format...');
    
    const testEventId = 'a'.repeat(64); // 64-char hex string
    const testRelays = ['wss://relay.damus.io', 'wss://relay.nostr.band'];
    
    console.log('📝 Creating nevent with test data...');
    const nevent = createNeventString(testEventId, testRelays);
    console.log('✅ Created nevent:', nevent.substring(0, 30) + '...');
    
    console.log('🔍 Parsing nevent back...');
    const parsed = parseNeventString(nevent);
    console.log('✅ Parsed data:', parsed);
    
    // Verify data integrity
    const isValid = parsed.eventId === testEventId && 
                   parsed.relays.length === testRelays.length;
    
    console.log(isValid ? '✅ nevent format test passed!' : '❌ nevent format test failed!');
    return isValid;
}

// Debug function for event ID and nevent testing
function debugEventIdProcessing() {
    console.log('🔍 Debugging Event ID Processing...');
    
    // Test with a real 64-character event ID
    const testEventId = 'a'.repeat(64); // 64 chars
    console.log('📝 Test Event ID:', testEventId);
    console.log('📏 Test Event ID length:', testEventId.length);
    
    // Test nevent creation
    const testRelays = ['wss://relay.damus.io'];
    const nevent = createNeventString(testEventId, testRelays);
    console.log('🔧 Created nevent:', nevent);
    console.log('📏 nevent length:', nevent.length);
    
    // Test nevent parsing
    const parsed = parseNeventString(nevent);
    console.log('📋 Parsed result:', parsed);
    
    // Verify integrity
    const isValid = parsed.eventId === testEventId;
    console.log(isValid ? '✅ Event ID integrity check passed!' : '❌ Event ID integrity check failed!');
    
    return { testEventId, nevent, parsed, isValid };
}

// Test function specifically for real publishing event IDs
async function debugRealEventId() {
    console.log('🧪 Testing with real publishing event ID...');
    
    try {
        // Generate keys and test board
        await waitForNostrTools();
        const keys = await generateNostrKeys();
        const testBoard = createTestBoardForNostr();
        
        // Create event manually to get the real event ID
        const event = await createNostrEventWithTools(testBoard, keys.privateKey, false);
        console.log('📋 Real Event created:', {
            id: event.id,
            idLength: event.id.length,
            kind: event.kind,
            pubkey: event.pubkey.substring(0, 16) + '...'
        });
        
        // Test nevent with real event ID
        const nevent = createNeventString(event.id, ['wss://relay.damus.io']);
        const parsed = parseNeventString(nevent);
        
        console.log('🔍 Real Event ID test results:', {
            originalId: event.id,
            nevent: nevent,
            parsedId: parsed.eventId,
            idsMatch: event.id === parsed.eventId
        });
        
        return { event, nevent, parsed };
        
    } catch (error) {
        console.error('❌ Real event ID test failed:', error);
        return null;
    }
}

// Test board rendering validation
async function testBoardRendering() {
    console.log('🎨 Testing board rendering...');
    
    try {
        // Create test board
        const testBoard = createTestBoardForNostr();
        console.log('📋 Test board structure:', {
            id: testBoard.id,
            name: testBoard.name,
            columnsCount: testBoard.columns.length,
            totalCards: testBoard.columns.reduce((sum, col) => sum + col.cards.length, 0)
        });
        
        // Set as current board
        window.currentBoard = testBoard;
        window.boards = window.boards || [];
        
        // Ensure board exists in global boards array
        const existingIndex = window.boards.findIndex(b => b.id === testBoard.id);
        if (existingIndex >= 0) {
            window.boards[existingIndex] = testBoard;
        } else {
            window.boards.push(testBoard);
        }
        
        // Save to localStorage
        if (typeof saveAllBoards === 'function') {
            saveAllBoards();
            console.log('✅ Board saved to localStorage');
        }
        
        // Switch to board view
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('board-view').style.display = 'flex';
        
        // Update board view
        if (typeof updateBoardView === 'function') {
            updateBoardView();
            console.log('✅ Board view updated');
        }
        
        // Render columns
        if (typeof renderColumns === 'function') {
            renderColumns();
            console.log('✅ Columns rendered');
            
            // Check if columns actually appeared in DOM
            const columnElements = document.querySelectorAll('.kanban-column');
            console.log(`📊 Found ${columnElements.length} column elements in DOM`);
            
            if (columnElements.length > 0) {
                columnElements.forEach((col, index) => {
                    const columnId = col.dataset.columnId;
                    const cardElements = col.querySelectorAll('.kanban-card');
                    console.log(`  Column ${index + 1}: ${columnId ? columnId.substring(0, 8) : 'no-id'} - ${cardElements.length} cards`);
                });
            }
        }
        
        console.log('🎉 Board rendering test completed');
        return true;
        
    } catch (error) {
        console.error('❌ Board rendering test failed:', error);
        return false;
    }
}



// Test-Funktion um verfügbare Funktionen zu prüfen
window.checkNostrFunctions = function() {
    console.log('🔍 Checking available Nostr functions:');
    const funcs = [
        'openNostrModal',
        'generateNostrKeys', 
        'publishBoardToNostr',
        'debugNostrState',
        'testNostrConnection',
        'createTestBoardForNostr'
    ];
    
    funcs.forEach(funcName => {
        console.log(`  ${funcName}: ${typeof window[funcName] === 'function' ? '✅' : '❌'}`);
    });
    
    console.log('  window.nostrTools:', window.nostrTools ? '✅' : '❌');
    console.log('  window.cryptoReady:', window.cryptoReady ? '✅' : '❌');
};

// Automatischer Check nach 3 Sekunden (DEAKTIVIERT um kontinuierliche Board-Erstellung zu stoppen)
setTimeout(() => {
    console.log('🧪 Auto-checking Nostr functions...');
    window.checkNostrFunctions();
    
    // AUTOMATISCHE TESTS DEAKTIVIERT - können manuell ausgeführt werden
    console.log('⚡ Automatic tests disabled. Run manually:');
    console.log('  - quickNostrTest()');
    console.log('  - runCompleteNostrTest()');
    console.log('  - testPublishImportWorkflow()');
    
}, 3000);

console.log('🧪 Publishing test functions loaded:');
console.log('  - testDirectPublishing() - Complete publishing test');
console.log('  - testNostrUI() - Test UI modal');
console.log('  - testSingleRelay() - Test single relay connection');
console.log('  - testFullWorkflow() - Complete publish→import test');
console.log('  - testNeventFormat() - Test nevent encoding/decoding');
console.log('  - debugEventIdProcessing() - Debug event ID handling');
console.log('  - debugRealEventId() - Test with real event IDs');
console.log('');
console.log('🎯 Quick start: Run testDirectPublishing() to test everything!');
console.log('🔍 Debug: Run debugEventIdProcessing() to test nevent encoding');
console.log('💡 Note: Keys will be automatically set in UI for testing');
console.log('');

// Auto-test availability check
setTimeout(() => {
    const requiredFunctions = [
        'waitForNostrTools',
        'generateNostrKeys', 
        'createTestBoardForNostr',
        'publishBoardToNostr',
        'parseNeventString',
        'createNeventString'
    ];
    
    console.log('🔍 Checking required functions:');
    const missing = [];
    requiredFunctions.forEach(funcName => {
        const available = typeof window[funcName] === 'function';
        console.log(`  ${funcName}: ${available ? '✅' : '❌'}`);
        if (!available) missing.push(funcName);
    });
    
    if (missing.length === 0) {
        console.log('🎉 All required functions available! Ready for testing.');
    } else {
        console.warn('⚠️ Missing functions:', missing);
    }
}, 1000);

