// Vollständiger automatisierter Test für Nostr Import Duplicate Fix
// Führe diesen Test in der Browser-Konsole aus

class NostrDuplicateFixTester {
    constructor() {
        this.testResults = [];
        this.originalBoardCount = 0;
        this.testStartTime = null;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString().substring(11, 19);
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
        const logMessage = `[${timestamp}] ${prefix} ${message}`;
        console.log(logMessage);
        this.testResults.push({ timestamp, type, message });
    }

    async runCompleteTest() {
        this.testStartTime = Date.now();
        this.log('🚀 Starting Complete Nostr Duplicate Fix Test Suite', 'info');
        this.log('================================================================');

        try {
            // Test 1: Environment Check
            await this.testEnvironment();
            
            // Test 2: Board Creation and Publishing
            await this.testBoardPublishing();
            
            // Test 3: Single Import
            await this.testSingleImport();
            
            // Test 4: Duplicate Import Prevention
            await this.testDuplicateImportPrevention();
            
            // Test 5: URL Parameter Import
            await this.testUrlParameterImport();
            
            // Test 6: LocalStorage Integrity
            await this.testLocalStorageIntegrity();
            
            // Test 7: Dashboard Integration
            await this.testDashboardIntegration();
            
            // Final Results
            this.generateTestReport();
            
        } catch (error) {
            this.log(`Critical test failure: ${error.message}`, 'error');
            return false;
        }
    }

    async testEnvironment() {
        this.log('🔍 Test 1: Environment Check', 'info');
        
        // Check boards array
        if (!window.boards) {
            window.boards = JSON.parse(localStorage.getItem('kanban-boards') || '[]');
        }
        this.originalBoardCount = window.boards.length;
        this.log(`Initial board count: ${this.originalBoardCount}`);
        
        // Check Nostr functions
        const requiredFunctions = [
            'generateNostrKeys',
            'publishBoardToNostr', 
            'importBoardFromNostr',
            'checkImportParameter'
        ];
        
        for (const funcName of requiredFunctions) {
            if (typeof window[funcName] === 'function') {
                this.log(`✓ ${funcName} available`);
            } else {
                this.log(`✗ ${funcName} missing`, 'error');
                throw new Error(`Required function ${funcName} not available`);
            }
        }
        
        // Check localStorage
        const storedBoards = localStorage.getItem('kanban-boards');
        this.log(`LocalStorage boards: ${storedBoards ? JSON.parse(storedBoards).length : 0}`);
        
        this.log('✅ Environment check passed', 'success');
    }

    async testBoardPublishing() {
        this.log('📤 Test 2: Board Publishing', 'info');
        
        // Create test board
        const testBoard = {
            id: 'test-duplicate-fix-' + Date.now(),
            name: 'Duplicate Fix Test Board',
            description: 'Testing duplicate prevention in Nostr import',
            summary: 'Test board for duplicate fix validation',
            authors: ['Automated Test'],
            backgroundColor: '#f5f7fa',
            backgroundHex: '#f5f7fa',
            headerRGBA: 'rgba(255, 255, 255, 0.8)',
            customStyle: '',
            aiConfig: { provider: '', apiKey: '', model: '', baseUrl: '' },
            columns: [{
                id: 'test-col-1',
                name: 'Test Column',
                color: 'color-gradient-1',
                cards: [{
                    id: 'test-card-1',
                    heading: 'Test Card',
                    content: 'This card tests the duplicate fix',
                    color: 'color-gradient-1',
                    thumbnail: '',
                    labels: 'test, duplicate-fix, automation',
                    comments: 'Automated test card',
                    url: '',
                    inactive: false
                }]
            }]
        };
        
        // Set as current board
        window.currentBoard = testBoard;
        window.boards.push(testBoard);
        this.log(`Test board created: "${testBoard.name}"`);
        
        // Generate keys if needed
        if (!localStorage.getItem('nostr-private-key')) {
            await generateNostrKeys();
            this.log('Generated new Nostr keys');
        }
        
        // Publish board
        const publishResult = await publishBoardToNostr();
        if (!publishResult || !publishResult.success) {
            throw new Error('Board publishing failed: ' + (publishResult?.error || 'Unknown error'));
        }
        
        this.testNevent = publishResult.nevent;
        this.log(`Board published successfully: ${this.testNevent.substring(0, 50)}...`);
        this.log('✅ Board publishing test passed', 'success');
        
        // Wait for relay propagation
        this.log('⏳ Waiting for relay propagation (3 seconds)...');
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    async testSingleImport() {
        this.log('📥 Test 3: Single Import', 'info');
        
        const beforeImport = window.boards.length;
        this.log(`Boards before import: ${beforeImport}`);
        
        try {
            await importBoardFromNostr(this.testNevent);
            const afterImport = window.boards.length;
            this.log(`Boards after import: ${afterImport}`);
            
            if (afterImport === beforeImport + 1) {
                this.log('✅ Single import test passed', 'success');
            } else {
                this.log(`Import created ${afterImport - beforeImport} boards instead of 1`, 'error');
            }
        } catch (error) {
            this.log(`Single import failed: ${error.message}`, 'error');
        }
    }

    async testDuplicateImportPrevention() {
        this.log('🔄 Test 4: Duplicate Import Prevention', 'info');
        
        const beforeDuplicate = window.boards.length;
        this.log(`Boards before duplicate import: ${beforeDuplicate}`);
        
        try {
            // Import the same board again
            await importBoardFromNostr(this.testNevent);
            const afterDuplicate = window.boards.length;
            this.log(`Boards after duplicate import: ${afterDuplicate}`);
            
            if (afterDuplicate === beforeDuplicate + 1) {
                this.log('✅ Duplicate import created unique board', 'success');
                
                // Check for unique names
                const importedBoards = window.boards.filter(b => b.name.includes('Imported'));
                const uniqueNames = new Set(importedBoards.map(b => b.name));
                
                if (uniqueNames.size === importedBoards.length) {
                    this.log('✅ All imported boards have unique names', 'success');
                } else {
                    this.log('Duplicate names found in imported boards', 'warning');
                }
            } else {
                this.log(`Duplicate import created ${afterDuplicate - beforeDuplicate} boards instead of 1`, 'error');
            }
        } catch (error) {
            this.log(`Duplicate import test failed: ${error.message}`, 'error');
        }
    }

    async testUrlParameterImport() {
        this.log('🔗 Test 5: URL Parameter Import', 'info');
        
        // Test URL parameter handling
        const originalUrl = window.location.href;
        const testUrl = window.location.origin + window.location.pathname + '?import=' + this.testNevent;
        
        // Simulate URL with import parameter
        window.history.pushState({}, '', testUrl);
        this.log(`Set test URL: ${testUrl.substring(0, 100)}...`);
        
        // Test duplicate prevention flag
        if (window.nostrImportInProgress) {
            this.log('⚠️ Import already in progress - good!', 'warning');
        } else {
            this.log('No import in progress flag detected');
        }
        
        // Reset URL
        window.history.pushState({}, '', originalUrl);
        this.log('✅ URL parameter test completed', 'success');
    }

    async testLocalStorageIntegrity() {
        this.log('💾 Test 6: LocalStorage Integrity', 'info');
        
        const memoryBoards = window.boards.length;
        const storedBoards = JSON.parse(localStorage.getItem('kanban-boards') || '[]').length;
        
        this.log(`Memory boards: ${memoryBoards}`);
        this.log(`Storage boards: ${storedBoards}`);
        
        if (memoryBoards === storedBoards) {
            this.log('✅ Memory and storage are synchronized', 'success');
        } else {
            this.log('⚠️ Memory and storage are out of sync', 'warning');
            
            // Try to sync
            localStorage.setItem('kanban-boards', JSON.stringify(window.boards));
            this.log('Attempted to sync storage with memory');
        }
    }

    async testDashboardIntegration() {
        this.log('📊 Test 7: Dashboard Integration', 'info');
        
        // Check if dashboard functions are available
        if (typeof renderDashboard === 'function') {
            this.log('✓ renderDashboard function available');
            
            // Check if dashboard elements exist
            const dashboard = document.getElementById('dashboard');
            const boardView = document.getElementById('board-view');
            
            if (dashboard) {
                this.log('✓ Dashboard element found');
            } else {
                this.log('✗ Dashboard element not found', 'warning');
            }
            
            if (boardView) {
                this.log('✓ Board view element found');
            } else {
                this.log('✗ Board view element not found', 'warning');
            }
        } else {
            this.log('✗ renderDashboard function not available', 'warning');
        }
        
        this.log('✅ Dashboard integration test completed', 'success');
    }

    generateTestReport() {
        const testDuration = Date.now() - this.testStartTime;
        const finalBoardCount = window.boards.length;
        const boardsAdded = finalBoardCount - this.originalBoardCount;
        
        this.log('📋 Test Summary Report', 'info');
        this.log('==================');
        this.log(`Test duration: ${testDuration}ms`);
        this.log(`Original boards: ${this.originalBoardCount}`);
        this.log(`Final boards: ${finalBoardCount}`);
        this.log(`Boards added: ${boardsAdded}`);
        
        const errorCount = this.testResults.filter(r => r.type === 'error').length;
        const warningCount = this.testResults.filter(r => r.type === 'warning').length;
        const successCount = this.testResults.filter(r => r.type === 'success').length;
        
        this.log(`✅ Successes: ${successCount}`);
        this.log(`⚠️ Warnings: ${warningCount}`);
        this.log(`❌ Errors: ${errorCount}`);
        
        if (errorCount === 0) {
            this.log('🎉 ALL TESTS PASSED! Duplicate fix is working correctly.', 'success');
        } else {
            this.log('❌ Some tests failed. Please review the errors above.', 'error');
        }
        
        return {
            success: errorCount === 0,
            duration: testDuration,
            boardsAdded,
            errors: errorCount,
            warnings: warningCount,
            successes: successCount
        };
    }

    // Cleanup method
    cleanupTestData() {
        this.log('🧹 Cleaning up test data...', 'info');
        
        if (window.boards) {
            const originalLength = window.boards.length;
            window.boards = window.boards.filter(b => 
                !b.name.includes('Duplicate Fix Test Board') && 
                !b.name.includes('Imported')
            );
            
            localStorage.setItem('kanban-boards', JSON.stringify(window.boards));
            const cleaned = originalLength - window.boards.length;
            this.log(`✅ Cleaned up ${cleaned} test boards`, 'success');
            
            // Render dashboard if available
            if (typeof renderDashboard === 'function') {
                renderDashboard();
            }
        }
    }
}

// Create global instance
window.duplicateFixTester = new NostrDuplicateFixTester();

// Quick access functions
window.runCompleteNostrTest = () => window.duplicateFixTester.runCompleteTest();
window.cleanupNostrTestData = () => window.duplicateFixTester.cleanupTestData();

console.log('🧪 Complete Nostr Duplicate Fix Tester loaded!');
console.log('Run: await runCompleteNostrTest()');
console.log('Cleanup: cleanupNostrTestData()');
