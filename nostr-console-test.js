// 🧪 Nostr Integration Test Script
// Führe diesen Code in der Browser-Console aus

console.log('🧪 Starting Nostr Integration Test...');

// 1. Test Board erstellen
console.log('\n1️⃣ Creating test board...');
const testBoard = createTestBoardForNostr();
console.log('Test board created:', testBoard.name);

// 2. Debug State prüfen
console.log('\n2️⃣ Checking Nostr state...');
debugNostrState();

// 3. Relay Verbindungen testen
console.log('\n3️⃣ Testing relay connections...');
testNostrConnection();

// 4. Nostr Modal öffnen (optional)
console.log('\n4️⃣ Opening Nostr modal...');
// openNostrModal(); // Uncomment to open modal

// 5. Vollständiger Funktionstest
console.log('\n5️⃣ Running full function availability test...');
window.checkNostrFunctions();

console.log('\n✅ Nostr Integration Test Complete!');
console.log('💡 You can now:');
console.log('  - Open sidebar → "Via Nostr Teilen"');
console.log('  - Generate keys with generateNostrKeys()');
console.log('  - Publish board with publishBoardToNostr()');
