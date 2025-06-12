// Nostr Import Debug Helper
// Run in browser console to debug import issues

console.log('🔧 Nostr Import Debug Helper loaded');

// Test the latest nevent from your logs
const TEST_NEVENT = 'nevent1qqs2nldjnx2pcfhaatp262j6x0wt2rw7g0ua0h78eelrp8sexjg0e2dgpzamhxue69uhhyetvv9ujuurjd9kkzmpwdejhgtczy9pwe8a3a5t2txd9d0g8l8wg0hvyz9hjqhhwnm6j5znklvcdpqjwrqcyqqq823cqt6qy2';

// Function to test import step by step
async function stepByStepImportDebug(nevent = TEST_NEVENT) {
    console.log('🚀 Starting step-by-step import debug...');
    
    try {
        // Step 1: Parse nevent
        console.log('📋 Step 1: Parsing nevent...');
        const eventData = parseNeventString(nevent);
        console.log('✅ Parsed successfully:', eventData);
        
        // Step 2: Check relays
        console.log('📡 Step 2: Checking relay configuration...');
        const storedRelays = JSON.parse(localStorage.getItem('nostr-relays') || '[]');
        const defaultRelays = [
            'wss://relay.damus.io',
            'wss://relay.nostr.band',
            'wss://nos.lol',
            'wss://relay.snort.social',
            'wss://nostr-pub.wellorder.net'
        ];
        
        const relaysToUse = eventData.relays.length > 0 
            ? eventData.relays 
            : storedRelays.length > 0 
            ? storedRelays 
            : defaultRelays;
            
        console.log('📡 Will search these relays:', relaysToUse);
        
        // Step 3: Test relay connection
        console.log('🔗 Step 3: Testing relay connections...');
        for (const relay of relaysToUse.slice(0, 2)) {
            try {
                console.log(`Testing ${relay}...`);
                await testSingleRelay(relay);
                console.log(`✅ ${relay} is reachable`);
            } catch (error) {
                console.log(`❌ ${relay} failed: ${error.message}`);
            }
        }
        
        // Step 4: Try to fetch the event
        console.log('🔍 Step 4: Searching for event...');
        console.log('Event ID:', eventData.eventId);
        
        for (const relay of relaysToUse.slice(0, 2)) {
            console.log(`🔍 Searching on ${relay}...`);
            try {
                const event = await debugFetchEvent(eventData.eventId, relay);
                if (event) {
                    console.log(`✅ Found event on ${relay}!`, {
                        id: event.id.substring(0, 16) + '...',
                        kind: event.kind,
                        pubkey: event.pubkey.substring(0, 16) + '...',
                        created_at: new Date(event.created_at * 1000).toISOString(),
                        content_length: event.content.length
                    });
                    
                    // Try to parse the content
                    try {
                        const boardData = JSON.parse(event.content);
                        console.log('✅ Event content is valid JSON');
                        console.log('Board name:', boardData.name);
                        console.log('Has nostrEvent flag:', !!boardData.nostrEvent);
                        return event;
                    } catch (parseError) {
                        console.log('❌ Event content is not valid JSON:', parseError.message);
                    }
                } else {
                    console.log(`❌ Event not found on ${relay}`);
                }
            } catch (error) {
                console.log(`❌ Error searching ${relay}:`, error.message);
            }
        }
        
        console.log('❌ Event not found on any relay');
        
        // Step 5: Alternative search strategies
        console.log('🔄 Step 5: Trying alternative search strategies...');
        
        // Try searching by pubkey + kinds
        console.log('Trying pubkey + kinds search...');
        // This would need the pubkey from the event, which we don't have
        
        console.log('💡 Suggestions:');
        console.log('1. The event might not have propagated to relays yet');
        console.log('2. The relay might not index this kind of event');
        console.log('3. Try waiting a few minutes and retry');
        console.log('4. Check if the event was published as draft (kind 30024)');
        
    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
}

// Test single relay connection
function testSingleRelay(relayUrl) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(relayUrl);
        
        const timeout = setTimeout(() => {
            ws.close();
            reject(new Error('Connection timeout'));
        }, 5000);
        
        ws.onopen = () => {
            clearTimeout(timeout);
            ws.close();
            resolve();
        };
        
        ws.onerror = ws.onclose = (error) => {
            clearTimeout(timeout);
            reject(new Error('Connection failed'));
        };
    });
}

// Debug version of fetchEventFromRelay with more logging
function debugFetchEvent(eventId, relayUrl) {
    return new Promise((resolve, reject) => {
        console.log(`🔍 Opening connection to ${relayUrl}...`);
        const ws = new WebSocket(relayUrl);
        let resolved = false;
        
        const timeout = setTimeout(() => {
            if (!resolved) {
                console.log(`⏰ Timeout reached for ${relayUrl}`);
                resolved = true;
                ws.close();
                reject(new Error('Timeout'));
            }
        }, 15000);
        
        ws.onopen = () => {
            console.log(`✅ Connected to ${relayUrl}`);
            
            // Try multiple subscription strategies
            const subscriptions = [
                // Strategy 1: ID only
                {
                    strategy: 'ID only',
                    filter: { ids: [eventId] }
                },
                // Strategy 2: ID + kinds
                {
                    strategy: 'ID + kinds',
                    filter: { ids: [eventId], kinds: [30023, 30024] }
                },
                // Strategy 3: Just kinds (to see what's available)
                {
                    strategy: 'Recent events of kinds 30023/30024',
                    filter: { kinds: [30023, 30024], limit: 5 }
                }
            ];
            
            // Try first strategy
            const subId = 'debug_' + Math.random().toString(36).substring(7);
            const firstSub = subscriptions[0];
            const message = JSON.stringify(['REQ', subId, firstSub.filter]);
            
            console.log(`📤 Sending ${firstSub.strategy} subscription to ${relayUrl}:`, message);
            ws.send(message);
        };
        
        ws.onmessage = (msg) => {
            try {
                const data = JSON.parse(msg.data);
                console.log(`📨 Message from ${relayUrl}:`, data[0], data[1] || '');
                
                if (data[0] === 'EVENT' && data[2]) {
                    const event = data[2];
                    console.log(`📋 Event received:`, {
                        id: event.id.substring(0, 16) + '...',
                        kind: event.kind,
                        matches: event.id === eventId
                    });
                    
                    if (event.id === eventId) {
                        console.log(`🎯 Found matching event!`);
                        if (!resolved) {
                            resolved = true;
                            clearTimeout(timeout);
                            ws.close();
                            resolve(event);
                        }
                    }
                } else if (data[0] === 'EOSE') {
                    console.log(`📋 End of stored events from ${relayUrl}`);
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        ws.close();
                        resolve(null);
                    }
                } else if (data[0] === 'NOTICE') {
                    console.log(`📢 Notice from ${relayUrl}:`, data[1]);
                } else if (data[0] === 'OK') {
                    console.log(`✅ OK response from ${relayUrl}:`, data);
                }
            } catch (e) {
                console.warn(`Failed to parse message from ${relayUrl}:`, e, msg.data);
            }
        };
        
        ws.onerror = (error) => {
            console.error(`❌ WebSocket error for ${relayUrl}:`, error);
            if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                reject(new Error('Connection error'));
            }
        };
        
        ws.onclose = (event) => {
            console.log(`🔌 Connection closed for ${relayUrl}:`, event.code, event.reason);
            if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                resolve(null);
            }
        };
    });
}

// Make functions available globally
window.stepByStepImportDebug = stepByStepImportDebug;
window.debugFetchEvent = debugFetchEvent;

console.log('🧪 Import debug functions available:');
console.log('- stepByStepImportDebug() - Complete import debugging');
console.log('- stepByStepImportDebug("your_nevent_here") - Debug specific nevent');
console.log('- debugFetchEvent(eventId, relayUrl) - Test specific relay/event combo');
