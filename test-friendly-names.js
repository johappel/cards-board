// Test für benutzerfreundliche Board-Namen beim Import
// Führe diesen Test in der Browser-Konsole aus

async function testUserFriendlyNames() {
    console.log('🧪 Testing User-Friendly Import Names...');
    console.log('==========================================');
    
    // Simuliere mehrere Importe desselben Boards
    const testBoard = {
        id: 'test-friendly-names',
        name: 'My Awesome Project',
        description: 'Testing user-friendly naming',
        summary: 'Test board for name demonstration',
        authors: ['Test User'],
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
                content: 'Testing friendly names',
                color: 'color-gradient-1',
                thumbnail: '',
                labels: 'test, friendly-names',
                comments: 'Test comment',
                url: '',
                inactive: false
            }]
        }]
    };
    
    // Backup aktuelle Boards
    const originalBoards = [...(window.boards || [])];
    
    // Simuliere Board-Array mit existierenden Namen
    const mockBoards = [
        { id: '1', name: 'My Awesome Project' },
        { id: '2', name: 'My Awesome Project (Imported)' },
        { id: '3', name: 'Another Board' }
    ];
    
    // Teste die Namenslogik
    function generateFriendlyName(originalName, existingNames) {
        let finalName = originalName;
        
        if (existingNames.includes(originalName)) {
            finalName = `${originalName} (Imported)`;
        }
        
        let counter = 2;
        while (existingNames.includes(finalName)) {
            finalName = `${originalName} (Imported ${counter})`;
            counter++;
        }
        
        return finalName;
    }
    
    console.log('📋 Testing name generation scenarios:');
    console.log('====================================');
    
    // Szenario 1: Originalname verfügbar
    let existingNames = ['Another Board', 'Different Project'];
    let result1 = generateFriendlyName('My Awesome Project', existingNames);
    console.log(`✅ Scenario 1 - Original available: "${result1}"`);
    
    // Szenario 2: Original existiert, aber (Imported) verfügbar
    existingNames = ['My Awesome Project', 'Another Board'];
    let result2 = generateFriendlyName('My Awesome Project', existingNames);
    console.log(`✅ Scenario 2 - Need (Imported): "${result2}"`);
    
    // Szenario 3: Original und (Imported) existieren
    existingNames = ['My Awesome Project', 'My Awesome Project (Imported)', 'Another Board'];
    let result3 = generateFriendlyName('My Awesome Project', existingNames);
    console.log(`✅ Scenario 3 - Need numbering: "${result3}"`);
    
    // Szenario 4: Mehrere Importe
    existingNames = [
        'My Awesome Project', 
        'My Awesome Project (Imported)', 
        'My Awesome Project (Imported 2)',
        'My Awesome Project (Imported 3)'
    ];
    let result4 = generateFriendlyName('My Awesome Project', existingNames);
    console.log(`✅ Scenario 4 - Multiple imports: "${result4}"`);
    
    console.log('\n🎨 Name Examples Comparison:');
    console.log('============================');
    console.log('❌ Old (ugly): "My Project (Imported 1749721901779)"');
    console.log('✅ New (clean): "My Project (Imported)"');
    console.log('✅ New (numbered): "My Project (Imported 2)"');
    console.log('✅ New (multiple): "My Project (Imported 3)"');
    
    console.log('\n📊 Benefits of new naming:');
    console.log('=========================');
    console.log('✅ Human readable');
    console.log('✅ Short and clean');
    console.log('✅ Clear numbering sequence');
    console.log('✅ Professional appearance');
    console.log('✅ Easy to manage');
    
    return {
        scenario1: result1,
        scenario2: result2,
        scenario3: result3,
        scenario4: result4
    };
}

// Teste auch mit echten Boards (wenn verfügbar)
async function testRealImportNaming() {
    if (!window.boards) {
        console.log('⚠️ No boards array found, skipping real test');
        return;
    }
    
    console.log('\n🔄 Testing with real boards array...');
    const existingNames = window.boards.map(b => b.name);
    console.log('📋 Existing board names:', existingNames);
    
    // Simuliere Import-Namen für verschiedene Szenarien
    const testNames = [
        'Project Alpha',
        'Daily Tasks',
        existingNames[0] || 'Test Board' // Verwende existierenden Namen falls vorhanden
    ];
    
    testNames.forEach((testName, index) => {
        const mockBoard = { name: testName };
        
        // Simuliere die neue Namenslogik
        let finalName = testName;
        
        if (existingNames.includes(testName)) {
            finalName = `${testName} (Imported)`;
        }
        
        let counter = 2;
        while (existingNames.includes(finalName)) {
            finalName = `${testName} (Imported ${counter})`;
            counter++;
        }
        
        console.log(`🎯 Test ${index + 1}: "${testName}" → "${finalName}"`);
    });
}

// Export für Console-Nutzung
window.testUserFriendlyNames = testUserFriendlyNames;
window.testRealImportNaming = testRealImportNaming;

console.log('🎨 User-Friendly Names Tester loaded!');
console.log('Commands:');
console.log('- testUserFriendlyNames() - Test naming scenarios');  
console.log('- testRealImportNaming() - Test with real boards');
