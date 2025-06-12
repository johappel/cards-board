// Master-Test für kompletten No        // Test 3: Board-Struktur-Validierung testen
        console.log('\n🔧 Step 3: Testing board structure validation...');
        if (typeof validateBoardStructure === 'function') {
            try {
                // DEAKTIVIERT: Automatische Board-Erstellung vermeiden
                // const testBoard = createTestBoardForNostr();
                
                // Verwende Mock-Board für Validierung
                const mockBoard = {
                    title: 'Mock Test Board',
                    name: 'Mock Test Board', 
                    columns: [
                        { id: 'col1', name: 'Column 1', cards: [] }
                    ]
                };
                
                results.boardStructure = validateBoardStructure(mockBoard);
                console.log(`Result: ${results.boardStructure ? '✅ PASS' : '❌ FAIL'}`);
            } catch (error) {
                console.log(`Result: ❌ FAIL (${error.message})`);
            }
        }

async function runCompleteNostrTest() {
    console.log('🎯 === COMPLETE NOSTR WORKFLOW TEST ===');
    console.log('This test validates the entire publish-import workflow\n');
    
    const results = {
        neventCreation: false,
        neventParsing: false,
        boardStructure: false,
        importWorkflow: false,
        scenarios: false,
        overall: false
    };
    
    try {
        // Schritt 1: nevent-Erstellung und -Parsing testen
        console.log('🔧 Step 1: Testing nevent creation and parsing...');
        if (typeof testCompleteNeventWorkflow === 'function') {
            results.neventCreation = testCompleteNeventWorkflow();
            console.log(`Result: ${results.neventCreation ? '✅ PASS' : '❌ FAIL'}`);
        }
        
        // Schritt 2: nevent-Szenarien testen
        console.log('\n🔧 Step 2: Testing various nevent scenarios...');
        if (typeof testNeventScenarios === 'function') {
            const scenarioResults = await testNeventScenarios();
            const passCount = scenarioResults.filter(r => r.success).length;
            results.scenarios = passCount === scenarioResults.length;
            console.log(`Result: ${results.scenarios ? '✅ PASS' : '❌ FAIL'} (${passCount}/${scenarioResults.length})`);
        }
        
        // Schritt 3: Board-Struktur-Validierung testen
        console.log('\n🔧 Step 3: Testing board structure validation...');
        if (typeof createTestBoardForNostr === 'function' && typeof validateBoardStructure === 'function') {
            try {
                const testBoard = createTestBoardForNostr();
                results.boardStructure = validateBoardStructure(testBoard);
                console.log(`Result: ${results.boardStructure ? '✅ PASS' : '❌ FAIL'}`);
            } catch (error) {
                console.log(`Result: ❌ FAIL (${error.message})`);
            }
        }
        
        // Schritt 4: Verbesserter Import-Workflow
        console.log('\n🔧 Step 4: Testing improved import workflow...');
        if (typeof improvedImportWorkflow === 'function') {
            const workflowResult = await improvedImportWorkflow();
            results.importWorkflow = workflowResult.success;
            console.log(`Result: ${results.importWorkflow ? '✅ PASS' : '❌ FAIL'}`);
            
            if (!workflowResult.success && workflowResult.error) {
                console.log(`Error: ${workflowResult.error}`);
            }
        }
        
        // Schritt 5: Gesamtergebnis
        console.log('\n📋 === FINAL RESULTS ===');
        console.log(`1. nevent Creation/Parsing: ${results.neventCreation ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`2. nevent Scenarios: ${results.scenarios ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`3. Board Structure: ${results.boardStructure ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`4. Import Workflow: ${results.importWorkflow ? '✅ PASS' : '❌ FAIL'}`);
        
        // Gesamtbewertung
        const passedTests = Object.values(results).filter(Boolean).length;
        const totalTests = Object.keys(results).length - 1; // Exclude 'overall'
        results.overall = passedTests === totalTests;
        
        console.log(`\n🎯 OVERALL RESULT: ${results.overall ? '🎉 ALL TESTS PASSED!' : '⚠️ SOME TESTS FAILED'}`);
        console.log(`Passed: ${passedTests}/${totalTests} tests`);
        
        if (results.overall) {
            console.log('\n🚀 SUCCESS: Nostr integration is working correctly!');
            console.log('✅ nevent creation and parsing works');
            console.log('✅ Board structure validation works');
            console.log('✅ Import workflow is functional');
            console.log('✅ All test scenarios pass');
            console.log('\nYou can now:');
            console.log('1. Publish boards to Nostr relays');
            console.log('2. Import boards via nevent URLs');
            console.log('3. Share boards with other users');
        } else {
            console.log('\n❌ Some issues remain:');
            if (!results.neventCreation) console.log('- nevent creation/parsing needs fixing');
            if (!results.scenarios) console.log('- Some nevent scenarios fail');
            if (!results.boardStructure) console.log('- Board structure validation issues');
            if (!results.importWorkflow) console.log('- Import workflow has problems');
        }
        
        return results;
        
    } catch (error) {
        console.error('❌ Complete test failed:', error);
        return { ...results, overall: false, error: error.message };
    }
}

// Quick-Test für sofortige Validierung
function quickNostrTest() {
    console.log('⚡ === QUICK NOSTR TEST ===');
    
    try {
        // Test 1: Basis-Funktionen verfügbar?
        const functions = [
            'createNeventString',
            'parseNeventString', 
            'createTestBoardForNostr',
            'validateBoardStructure'
        ];
        
        const availableFunctions = functions.filter(fname => typeof window[fname] === 'function');
        console.log(`📋 Available functions: ${availableFunctions.length}/${functions.length}`);
        availableFunctions.forEach(fname => console.log(`  ✅ ${fname}`));
        
        const missingFunctions = functions.filter(fname => typeof window[fname] !== 'function');
        if (missingFunctions.length > 0) {
            console.log('❌ Missing functions:');
            missingFunctions.forEach(fname => console.log(`  ❌ ${fname}`));
        }
        
        // Test 2: nostr-tools verfügbar?
        console.log(`\n📋 nostr-tools available: ${window.nostrTools ? '✅' : '❌'}`);
        if (window.nostrTools) {
            console.log(`📋 cryptoReady: ${window.cryptoReady ? '✅' : '❌'}`);
            if (window.nostrTools.nip19) {
                console.log('📋 NIP-19 functions:', Object.keys(window.nostrTools.nip19));
            }
        }
        
        // Test 3: Schneller nevent-Test
        if (availableFunctions.includes('createNeventString') && availableFunctions.includes('parseNeventString')) {
            console.log('\n🔧 Quick nevent test...');
            
            const testId = 'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321';
            const testRelays = ['wss://test.relay'];
            
            try {
                const nevent = createNeventString(testId, testRelays);
                const parsed = parseNeventString(nevent);
                const roundTripOk = parsed.eventId === testId;
                
                console.log(`✅ Quick nevent test: ${roundTripOk ? 'PASS' : 'FAIL'}`);
                return roundTripOk;
            } catch (error) {
                console.log(`❌ Quick nevent test failed: ${error.message}`);
                return false;
            }
        }
        
        return availableFunctions.length === functions.length;
        
    } catch (error) {
        console.error('❌ Quick test failed:', error);
        return false;
    }
}

// Hilfsfunktion für manuelle Tests
function testSpecificNevent(neventString) {
    console.log('\n🔍 === TESTING SPECIFIC NEVENT ===');
    console.log('Input:', neventString);
    
    if (typeof analyzeProblematicNevent === 'function') {
        analyzeProblematicNevent(neventString);
    }
    
    if (typeof parseNeventString === 'function') {
        try {
            const result = parseNeventString(neventString);
            console.log('✅ Parse result:', result);
            return result;
        } catch (error) {
            console.log('❌ Parse failed:', error.message);
            return null;
        }
    }
}

// Exportiere Funktionen
window.runCompleteNostrTest = runCompleteNostrTest;
window.quickNostrTest = quickNostrTest;
window.testSpecificNevent = testSpecificNevent;

console.log('🎯 Master test functions loaded:');
console.log('  - runCompleteNostrTest() // Vollständiger Test aller Komponenten');
console.log('  - quickNostrTest() // Schneller Basis-Test');
console.log('  - testSpecificNevent(neventString) // Test eines spezifischen nevents');
