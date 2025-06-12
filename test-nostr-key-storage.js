// Test Script for Nostr Key Storage and Published Board Links
// Run in browser console after loading the Kanban app

class NostrKeyStorageTester {
    constructor() {
        this.results = [];
        this.testBoard = null;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString().substring(11, 19);
        const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
        const logMessage = `[${timestamp}] ${emoji} ${message}`;
        console.log(logMessage);
        this.results.push({ timestamp, type, message });
    }

    async waitForElements() {
        return new Promise((resolve) => {
            const checkElements = () => {
                const elements = [
                    'nostr-private-key',
                    'nostr-public-key',
                    'remember-nostr-credentials',
                    'nostr-published-boards'
                ].map(id => document.getElementById(id));

                if (elements.every(el => el !== null)) {
                    resolve(elements);
                } else {
                    setTimeout(checkElements, 100);
                }
            };
            checkElements();
        });
    }

    async testKeyStorage() {
        this.log('🔑 Testing Nostr Key Storage Functionality...');

        try {
            // Wait for elements to be available
            await this.waitForElements();
            this.log('✅ All required UI elements found');

            // Clear any existing credentials
            localStorage.removeItem('nostr-credentials');
            this.log('🧹 Cleared existing credentials');

            // Open Nostr modal
            openNostrModal();
            this.log('📂 Opened Nostr modal');

            // Test 1: Generate new keys
            this.log('🔑 Test 1: Generating new keys...');
            await generateNostrKeys();
            
            const privateKeyInput = document.getElementById('nostr-private-key');
            const publicKeyInput = document.getElementById('nostr-public-key');
            const rememberCheckbox = document.getElementById('remember-nostr-credentials');

            if (privateKeyInput.value && publicKeyInput.value) {
                this.log('✅ Keys generated successfully');
                this.log(`Private key format: ${privateKeyInput.value.startsWith('nsec') ? 'bech32' : 'hex'}`);
                this.log(`Public key format: ${publicKeyInput.value.startsWith('npub') ? 'bech32' : 'hex'}`);
            } else {
                this.log('❌ Key generation failed', 'error');
                return false;
            }

            // Test 2: Test checkbox functionality
            this.log('☑️ Test 2: Testing remember checkbox...');
            rememberCheckbox.checked = true;
            rememberCheckbox.dispatchEvent(new Event('change'));
            
            // Wait a moment for the event to be processed
            await new Promise(resolve => setTimeout(resolve, 500));

            const savedCredentials = localStorage.getItem('nostr-credentials');
            if (savedCredentials) {
                const creds = JSON.parse(savedCredentials);
                this.log('✅ Credentials saved to localStorage');
                this.log(`Saved format: ${creds.nsecBech32 ? 'Has bech32' : 'Hex only'}`);
            } else {
                this.log('❌ Credentials not saved to localStorage', 'error');
                return false;
            }

            // Test 3: Test key format switching
            this.log('🔄 Test 3: Testing key format switching...');
            toggleKeyDisplayFormat();
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const newFormat = privateKeyInput.value.startsWith('nsec') ? 'bech32' : 'hex';
            this.log(`✅ Key format switched to: ${newFormat}`);

            // Test 4: Test credential persistence
            this.log('💾 Test 4: Testing credential persistence...');
            closeModal('nostr-modal');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            openNostrModal();
            await new Promise(resolve => setTimeout(resolve, 500));

            if (privateKeyInput.value && publicKeyInput.value && rememberCheckbox.checked) {
                this.log('✅ Credentials persisted correctly');
            } else {
                this.log('❌ Credential persistence failed', 'error');
                return false;
            }

            // Test 5: Test unchecking remember
            this.log('🔓 Test 5: Testing credential removal...');
            rememberCheckbox.checked = false;
            rememberCheckbox.dispatchEvent(new Event('change'));
            await new Promise(resolve => setTimeout(resolve, 500));

            const removedCredentials = localStorage.getItem('nostr-credentials');
            if (!removedCredentials) {
                this.log('✅ Credentials removed when unchecked');
            } else {
                this.log('⚠️ Credentials still present after unchecking', 'warning');
            }

            this.log('🎉 Key storage tests completed successfully!', 'success');
            return true;

        } catch (error) {
            this.log(`❌ Key storage test failed: ${error.message}`, 'error');
            return false;
        }
    }

    async testManualKeyEntry() {
        this.log('📝 Testing Manual Key Entry with Auto-Generation...');

        try {
            // Ensure modal is open
            openNostrModal();
            await new Promise(resolve => setTimeout(resolve, 500));

            const privateKeyInput = document.getElementById('nostr-private-key');
            const publicKeyInput = document.getElementById('nostr-public-key');
            const rememberCheckbox = document.getElementById('nostr-remember-keys');

            if (!privateKeyInput || !publicKeyInput) {
                throw new Error('Key input elements not found');
            }

            // Test 1: HEX private key input
            this.log('Test 1: HEX private key auto-generation...');
            const testHexKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
            
            // Clear fields first
            privateKeyInput.value = '';
            publicKeyInput.value = '';
            
            // Simulate user typing HEX key
            privateKeyInput.value = testHexKey;
            privateKeyInput.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Wait for auto-generation
            await new Promise(resolve => setTimeout(resolve, 300));
            
            if (publicKeyInput.value && publicKeyInput.value.length === 64) {
                this.log('✅ HEX key auto-generation successful');
                
                // Check if datasets are populated
                if (privateKeyInput.dataset.hex && privateKeyInput.dataset.bech32) {
                    this.log('✅ Key datasets populated correctly');
                } else {
                    this.log('⚠️ Key datasets not populated properly');
                }
            } else {
                this.log('❌ HEX key auto-generation failed');
            }

            // Test 2: bech32 nsec input
            this.log('Test 2: bech32 nsec auto-generation...');
            
            // Generate a valid nsec for testing
            await new Promise(resolve => setTimeout(resolve, 100));
            generateNostrKeys(); // Generate new keys first
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Get the generated nsec from the field (should be in bech32 if format is set)
            const currentFormat = localStorage.getItem('nostr-show-bech32') === 'true';
            let testNsec;
            
            if (privateKeyInput.dataset.bech32) {
                testNsec = privateKeyInput.dataset.bech32;
            } else {
                // If no bech32 in dataset, convert current value
                if (privateKeyInput.value.length === 64) {
                    testNsec = window.nostrTools.nip19.nsecEncode(privateKeyInput.value);
                }
            }
            
            if (testNsec && testNsec.startsWith('nsec1')) {
                // Clear fields
                privateKeyInput.value = '';
                publicKeyInput.value = '';
                delete privateKeyInput.dataset.hex;
                delete privateKeyInput.dataset.bech32;
                delete publicKeyInput.dataset.hex;
                delete publicKeyInput.dataset.bech32;
                
                // Input the nsec
                privateKeyInput.value = testNsec;
                privateKeyInput.dispatchEvent(new Event('input', { bubbles: true }));
                
                // Wait for auto-generation
                await new Promise(resolve => setTimeout(resolve, 300));
                
                if (publicKeyInput.value && (publicKeyInput.value.length === 64 || publicKeyInput.value.startsWith('npub1'))) {
                    this.log('✅ bech32 nsec auto-generation successful');
                    
                    // Verify both formats are stored
                    if (privateKeyInput.dataset.hex && privateKeyInput.dataset.bech32 && 
                        publicKeyInput.dataset.hex && publicKeyInput.dataset.bech32) {
                        this.log('✅ Both HEX and bech32 formats stored correctly');
                    } else {
                        this.log('⚠️ Format storage incomplete');
                    }
                } else {
                    this.log('❌ bech32 nsec auto-generation failed');
                }
            } else {
                this.log('⚠️ Could not generate valid nsec for testing');
            }

            // Test 3: Format switching
            this.log('Test 3: Format switching functionality...');
            
            const currentShowBech32 = localStorage.getItem('nostr-show-bech32') === 'true';
            
            // Toggle format
            if (window.toggleKeyDisplayFormat) {
                toggleKeyDisplayFormat();
                await new Promise(resolve => setTimeout(resolve, 200));
                
                const newShowBech32 = localStorage.getItem('nostr-show-bech32') === 'true';
                if (newShowBech32 !== currentShowBech32) {
                    this.log('✅ Format toggle successful');
                    
                    // Check if display updated
                    const expectedFormat = newShowBech32 ? 'bech32' : 'hex';
                    const actualFormat = privateKeyInput.value.startsWith('nsec1') ? 'bech32' : 'hex';
                    
                    if (actualFormat === expectedFormat) {
                        this.log('✅ Display format updated correctly');
                    } else {
                        this.log('⚠️ Display format may not have updated properly');
                    }
                } else {
                    this.log('❌ Format toggle failed');
                }
            } else {
                this.log('⚠️ toggleKeyDisplayFormat function not available');
            }

            // Test 4: Auto-save functionality
            this.log('Test 4: Auto-save with remember checkbox...');
            
            if (rememberCheckbox) {
                // Clear storage first
                localStorage.removeItem('nostr-credentials');
                
                // Check remember checkbox
                rememberCheckbox.checked = true;
                
                // Enter a key to trigger auto-save
                const testKey2 = 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';
                privateKeyInput.value = testKey2;
                privateKeyInput.dispatchEvent(new Event('input', { bubbles: true }));
                
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Check if credentials were saved
                const savedCreds = localStorage.getItem('nostr-credentials');
                if (savedCreds) {
                    this.log('✅ Auto-save functionality working');
                    
                    try {
                        const parsed = JSON.parse(savedCreds);
                        if (parsed.privateKey && parsed.publicKey) {
                            this.log('✅ Saved credentials contain both keys');
                        } else {
                            this.log('⚠️ Saved credentials incomplete');
                        }
                    } catch (e) {
                        this.log('⚠️ Saved credentials format invalid');
                    }
                } else {
                    this.log('❌ Auto-save not triggered');
                }
            } else {
                this.log('⚠️ Remember checkbox not found');
            }

            this.log('✅ Manual key entry tests completed');

        } catch (error) {
            this.log(`❌ Manual key entry test failed: ${error.message}`, 'error');
        }
    }

    async testPublishedBoardsHistory() {
        this.log('📚 Testing Published Boards History Functionality...');

        try {
            // Clear existing published events
            localStorage.removeItem('nostr-published-events');
            this.log('🧹 Cleared existing published events');

            // Create a test board
            this.testBoard = createTestBoardForNostr();
            this.log(`📋 Created test board: ${this.testBoard.name}`);

            // Generate keys for testing
            const keys = await generateNostrKeys();
            this.log('🔑 Generated test keys');

            // Simulate a published event
            const mockPublishedEvent = {
                boardId: this.testBoard.id,
                boardName: this.testBoard.name,
                eventId: 'a'.repeat(64), // Mock 64-char event ID
                nevent: 'nevent1test123456789',
                importUrl: `${window.location.origin}${window.location.pathname}?import=nevent1test123456789`,
                timestamp: new Date().toISOString(),
                isDraft: false,
                relays: ['wss://relay.damus.io', 'wss://relay.nostr.band']
            };

            // Save to localStorage
            const publishedEvents = [mockPublishedEvent];
            localStorage.setItem('nostr-published-events', JSON.stringify(publishedEvents));
            this.log('💾 Saved mock published event');

            // Open modal and check if history loads
            openNostrModal();
            await new Promise(resolve => setTimeout(resolve, 500));

            const historyContainer = document.getElementById('nostr-published-boards');
            const noHistoryDiv = document.getElementById('nostr-no-history');
            const boardElements = historyContainer.querySelectorAll('.nostr-published-board');

            if (boardElements.length > 0 && noHistoryDiv.style.display === 'none') {
                this.log('✅ Published boards history loaded correctly');
                this.log(`📊 Found ${boardElements.length} published board(s)`);
            } else {
                this.log('❌ Published boards history not loaded', 'error');
                return false;
            }

            // Test copy functionality
            this.log('📋 Testing copy functionality...');
            try {
                copyPublishedBoardLink('0');
                this.log('✅ Copy function executed without errors');
            } catch (error) {
                this.log(`⚠️ Copy function error: ${error.message}`, 'warning');
            }

            // Test delete functionality
            this.log('🗑️ Testing delete functionality...');
            const initialCount = JSON.parse(localStorage.getItem('nostr-published-events') || '[]').length;
            
            // Mock confirm dialog
            const originalConfirm = window.confirm;
            window.confirm = () => true;
            
            deletePublishedBoard('0');
            
            // Restore confirm
            window.confirm = originalConfirm;

            const finalCount = JSON.parse(localStorage.getItem('nostr-published-events') || '[]').length;
            
            if (finalCount < initialCount) {
                this.log('✅ Delete functionality works correctly');
            } else {
                this.log('❌ Delete functionality failed', 'error');
                return false;
            }

            this.log('🎉 Published boards history tests completed successfully!', 'success');
            return true;

        } catch (error) {
            this.log(`❌ Published boards history test failed: ${error.message}`, 'error');
            return false;
        }
    }

    async runAllTests() {
        this.log('🚀 Starting comprehensive Nostr functionality tests...');
        this.log('='.repeat(60));

        const keyStorageResult = await this.testKeyStorage();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const manualEntryResult = await this.testManualKeyEntry();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const historyResult = await this.testPublishedBoardsHistory();

        this.log('='.repeat(60));
        this.log('📊 Test Results Summary:');
        this.log(`🔑 Key Storage: ${keyStorageResult ? '✅ PASSED' : '❌ FAILED'}`);
        this.log(`⌨️ Manual Key Entry: ${manualEntryResult ? '✅ PASSED' : '❌ FAILED'}`);
        this.log(`📚 Published History: ${historyResult ? '✅ PASSED' : '❌ FAILED'}`);
        
        const overallResult = keyStorageResult && manualEntryResult && historyResult;
        this.log(`🎯 Overall Result: ${overallResult ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`, overallResult ? 'success' : 'error');

        return {
            keyStorage: keyStorageResult,
            manualEntry: manualEntryResult,
            publishedHistory: historyResult,
            overall: overallResult,
            details: this.results
        };
    }

    generateReport() {
        const successCount = this.results.filter(r => r.type === 'success').length;
        const errorCount = this.results.filter(r => r.type === 'error').length;
        const warningCount = this.results.filter(r => r.type === 'warning').length;

        return {
            summary: {
                total: this.results.length,
                success: successCount,
                errors: errorCount,
                warnings: warningCount
            },
            results: this.results
        };
    }
}

// Global test functions
async function testNostrKeyStorage() {
    const tester = new NostrKeyStorageTester();
    return await tester.testKeyStorage();
}

async function testPublishedBoardsHistory() {
    const tester = new NostrKeyStorageTester();
    return await tester.testPublishedBoardsHistory();
}

async function testAllNostrImprovements() {
    const tester = new NostrKeyStorageTester();
    const results = await tester.runAllTests();
    
    console.log('\n📋 Detailed Report:');
    console.table(tester.generateReport().summary);
    
    return results;
}

// Export for manual testing
window.testNostrKeyStorage = testNostrKeyStorage;
window.testPublishedBoardsHistory = testPublishedBoardsHistory;
window.testAllNostrImprovements = testAllNostrImprovements;

console.log('🧪 Nostr Key Storage & Published Boards Tests loaded!');
console.log('📝 Available test functions:');
console.log('  - testNostrKeyStorage() - Test key storage functionality');
console.log('  - testPublishedBoardsHistory() - Test published boards history');
console.log('  - testAllNostrImprovements() - Run all tests');
console.log('');
console.log('🚀 Quick start: Run testAllNostrImprovements() to test everything!');
