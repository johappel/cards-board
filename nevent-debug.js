// Debugging-Funktionen für nevent-Probleme

// Test verschiedene nevent-Erstellungsmethoden
function testNeventCreation() {
    console.log('\n🧪 === NEVENT CREATION TEST ===');
    
    // Test Event ID (gültiger Hex-String)
    const testEventId = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    const testRelays = ['wss://relay.damus.io', 'wss://nos.lol'];
    
    console.log('📋 Test Event ID:', testEventId);
    console.log('🔗 Test Relays:', testRelays);
    
    try {
        // Test 1: Check if nostr-tools is available
        console.log('\n🔧 Testing nostr-tools availability...');
        console.log('  window.nostrTools:', !!window.nostrTools);
        if (window.nostrTools) {
            console.log('  nostr-tools.nip19:', !!window.nostrTools.nip19);
            if (window.nostrTools.nip19) {
                console.log('  Available NIP19 functions:', Object.keys(window.nostrTools.nip19));
            }
        }
        
        // Test 2: Try NIP-19 encoding
        console.log('\n🔧 Testing NIP-19 encoding...');
        if (window.nostrTools && window.nostrTools.nip19) {
            const nip19 = window.nostrTools.nip19;
            
            // Try different encoding methods
            if (nip19.neventEncode) {
                try {
                    const nevent = nip19.neventEncode({
                        id: testEventId,
                        relays: testRelays
                    });
                    console.log('  ✅ neventEncode success:', nevent.substring(0, 30) + '...');
                } catch (error) {
                    console.log('  ❌ neventEncode failed:', error.message);
                }
            }
            
            if (nip19.encode) {
                try {
                    const nevent = nip19.encode('nevent', {
                        id: testEventId,
                        relays: testRelays
                    });
                    console.log('  ✅ encode("nevent") success:', nevent.substring(0, 30) + '...');
                } catch (error) {
                    console.log('  ❌ encode("nevent") failed:', error.message);
                }
            }
        }
        
        // Test 3: Fallback encoding
        console.log('\n🔧 Testing fallback encoding...');
        const fallbackData = {
            eventId: testEventId,
            relays: testRelays
        };
        const encoded = btoa(JSON.stringify(fallbackData));
        const fallbackNevent = `nevent1${encoded}`;
        console.log('  ✅ Fallback nevent:', fallbackNevent.substring(0, 30) + '...');
        
        // Test 4: Test createNeventString function
        console.log('\n🔧 Testing createNeventString function...');
        if (typeof createNeventString === 'function') {
            try {
                const nevent = createNeventString(testEventId, testRelays);
                console.log('  ✅ createNeventString success:', nevent.substring(0, 30) + '...');
                return nevent;
            } catch (error) {
                console.log('  ❌ createNeventString failed:', error.message);
            }
        } else {
            console.log('  ❌ createNeventString function not found');
        }
        
    } catch (error) {
        console.error('❌ nevent creation test failed:', error);
    }
}

// Test nevent-Parsing mit verschiedenen Eingaben
function testNeventParsing() {
    console.log('\n🧪 === NEVENT PARSING TEST ===');
    
    // Test verschiedene nevent-Formate
    const testCases = [
        // Fallback-Format (Base64 JSON)
        {
            name: 'Fallback Format',
            nevent: 'nevent1' + btoa(JSON.stringify({
                eventId: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
                relays: ['wss://relay.damus.io']
            })),
            expected: {
                eventId: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
                relays: ['wss://relay.damus.io']
            }
        },
        // Ungültiges Format
        {
            name: 'Invalid Format',
            nevent: 'nevent1qqs2nldjnx2pcfhaatp262j',
            expected: null
        }
    ];
    
    testCases.forEach((testCase, index) => {
        console.log(`\n🔧 Test ${index + 1}: ${testCase.name}`);
        console.log('  Input:', testCase.nevent.substring(0, 30) + '...');
        
        if (typeof parseNeventString === 'function') {
            try {
                const result = parseNeventString(testCase.nevent);
                console.log('  ✅ Parse result:', {
                    eventId: result.eventId ? result.eventId.substring(0, 16) + '...' : result.eventId,
                    relays: result.relays
                });
                
                // Validate Event ID format
                if (result.eventId) {
                    const isValidHex = /^[0-9a-fA-F]{64}$/.test(result.eventId);
                    console.log('  🔍 Event ID validation:', isValidHex ? '✅ Valid' : '❌ Invalid');
                    if (!isValidHex) {
                        console.log('    Event ID details:', {
                            length: result.eventId.length,
                            isHex: /^[0-9a-fA-F]+$/.test(result.eventId),
                            nonHexChars: result.eventId.match(/[^0-9a-fA-F]/g)
                        });
                    }
                }
            } catch (error) {
                console.log('  ❌ Parse failed:', error.message);
            }
        } else {
            console.log('  ❌ parseNeventString function not found');
        }
    });
}

// Analyse eines spezifischen problematischen nevents
function analyzeProblematicNevent(nevent) {
    console.log('\n🧪 === ANALYZING PROBLEMATIC NEVENT ===');
    console.log('📋 Input nevent:', nevent);
    console.log('📏 Length:', nevent.length);
    
    // Basic format check
    if (!nevent.startsWith('nevent1')) {
        console.log('❌ Does not start with "nevent1"');
        return;
    }
    
    const encoded = nevent.substring(7);
    console.log('📋 Encoded part:', encoded.substring(0, 30) + '...');
    console.log('📏 Encoded length:', encoded.length);
    
    // Try Base64 decoding
    try {
        const decoded = atob(encoded);
        console.log('✅ Base64 decode successful');
        console.log('📋 Decoded string:', decoded.substring(0, 100) + '...');
        
        try {
            const data = JSON.parse(decoded);
            console.log('✅ JSON parse successful:', data);
            
            // Validate Event ID
            if (data.eventId) {
                const isValidHex = /^[0-9a-fA-F]{64}$/.test(data.eventId);
                console.log('🔍 Event ID validation:', isValidHex ? '✅ Valid' : '❌ Invalid');
                if (!isValidHex) {
                    console.log('  Event ID details:', {
                        length: data.eventId.length,
                        isHex: /^[0-9a-fA-F]+$/.test(data.eventId),
                        nonHexChars: data.eventId.match(/[^0-9a-fA-F]/g)
                    });
                }
            }
        } catch (jsonError) {
            console.log('❌ JSON parse failed:', jsonError.message);
        }
    } catch (base64Error) {
        console.log('❌ Base64 decode failed:', base64Error.message);
        
        // Try treating it as raw data
        console.log('🔧 Analyzing as raw data...');
        console.log('  First 32 chars:', encoded.substring(0, 32));
        console.log('  Is hex?', /^[0-9a-fA-F]+$/.test(encoded));
        console.log('  Contains:', encoded.split('').slice(0, 20).map(c => `${c}(${c.charCodeAt(0)})`).join(', '));
    }
}

// Test kompletten Workflow
function testCompleteNeventWorkflow() {
    console.log('\n🧪 === COMPLETE NEVENT WORKFLOW TEST ===');
    
    const testEventId = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    const testRelays = ['wss://relay.damus.io'];
    
    try {
        // Step 1: Create nevent
        console.log('🔧 Step 1: Creating nevent...');
        const nevent = createNeventString(testEventId, testRelays);
        console.log('✅ nevent created:', nevent);
        
        // Step 2: Parse nevent
        console.log('\n🔧 Step 2: Parsing nevent...');
        const parsed = parseNeventString(nevent);
        console.log('✅ nevent parsed:', parsed);
        
        // Step 3: Validate round-trip
        console.log('\n🔧 Step 3: Validating round-trip...');
        const eventIdMatch = parsed.eventId === testEventId;
        const relaysMatch = JSON.stringify(parsed.relays) === JSON.stringify(testRelays);
        
        console.log('Event ID match:', eventIdMatch ? '✅' : '❌');
        console.log('Relays match:', relaysMatch ? '✅' : '❌');
        
        if (eventIdMatch && relaysMatch) {
            console.log('🎉 Complete workflow test PASSED!');
            return true;
        } else {
            console.log('❌ Complete workflow test FAILED!');
            return false;
        }
    } catch (error) {
        console.log('❌ Complete workflow test ERROR:', error.message);
        return false;
    }
}

// Exportiere Funktionen global
window.testNeventCreation = testNeventCreation;
window.testNeventParsing = testNeventParsing;
window.analyzeProblematicNevent = analyzeProblematicNevent;
window.testCompleteNeventWorkflow = testCompleteNeventWorkflow;

console.log('🧪 nevent debugging functions loaded:');
console.log('  - testNeventCreation()');
console.log('  - testNeventParsing()');
console.log('  - analyzeProblematicNevent(nevent)');
console.log('  - testCompleteNeventWorkflow()');
