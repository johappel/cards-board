// Paste-Funktionalität initialisieren
document.addEventListener('DOMContentLoaded', function() {
    if (typeof initPasteFunctionality === 'function') {
        initPasteFunctionality();
        console.log('🎯 Paste functionality initialized from kanban.html');
    } else {
        console.warn('❌ initPasteFunctionality function not found');
    }
    
    // URL Preview Plugin initialisieren
    if (typeof URLPreviewPlugin !== 'undefined' && URLPreviewPlugin.init) {
        URLPreviewPlugin.init();
        console.log('🔗 URL Preview Plugin initialized from kanban.html');
    } else {
        console.warn('❌ URLPreviewPlugin not found');
    }
    
    // YouTube Test-Funktion für Debugging
    window.testYouTubePreview = function() {
        console.log("🎥 Testing YouTube URL Preview...");
        
        const testUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
        const testPreview = {
            title: "Rick Astley - Never Gonna Give You Up (Official Video)",
            description: "The official video for Rick Astley's 'Never Gonna Give You Up'",
            image: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
            url: testUrl,
            isYouTube: true,
            videoId: "dQw4w9WgXcQ",
            embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            authorName: "Rick Astley"
        };
        
        const testTarget = {
            type: 'column',
            columnId: 'col-1748536608900-to-do'
        };
        
        // Test YouTube functions
        if (typeof isYouTubeUrl !== 'undefined') {
            console.log("✅ YouTube detection:", isYouTubeUrl(testUrl));
        }
        if (typeof extractYouTubeVideoId !== 'undefined') {
            console.log("✅ Video ID:", extractYouTubeVideoId(testUrl));
        }
        if (typeof showUrlPreviewModal !== 'undefined') {
            console.log("✅ Showing YouTube preview modal...");
            showUrlPreviewModal(testPreview, testTarget);
        } else {
            console.log("❌ showUrlPreviewModal not found");
        }
    };
    
    // Auto-test nach 2 Sekunden
    setTimeout(() => {
        if (window.location.search.includes('test-youtube')) {
            window.testYouTubePreview();
        }
    }, 2000);
});