// Test Script für YouTube URL-Vorschau
console.log("🎥 Testing YouTube URL Preview Functionality...");

// Test YouTube URL
const testUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

// Test 1: YouTube URL Detection
console.log("1. Testing YouTube URL detection:");
if (typeof isYouTubeUrl === 'function') {
    console.log("✅ isYouTubeUrl function exists");
    console.log("   Result:", isYouTubeUrl(testUrl));
} else {
    console.log("❌ isYouTubeUrl function not found");
}

// Test 2: Video ID Extraction
console.log("\n2. Testing Video ID extraction:");
if (typeof extractYouTubeVideoId === 'function') {
    console.log("✅ extractYouTubeVideoId function exists");
    const videoId = extractYouTubeVideoId(testUrl);
    console.log("   Video ID:", videoId);
} else {
    console.log("❌ extractYouTubeVideoId function not found");
}

// Test 3: Thumbnail Generation
console.log("\n3. Testing Thumbnail generation:");
if (typeof getYouTubeThumbnail === 'function') {
    console.log("✅ getYouTubeThumbnail function exists");
    const videoId = extractYouTubeVideoId(testUrl);
    console.log("   Thumbnail URL:", getYouTubeThumbnail(videoId));
} else {
    console.log("❌ getYouTubeThumbnail function not found");
}

// Test 4: Embed URL Generation
console.log("\n4. Testing Embed URL generation:");
if (typeof getYouTubeEmbedUrl === 'function') {
    console.log("✅ getYouTubeEmbedUrl function exists");
    const videoId = extractYouTubeVideoId(testUrl);
    console.log("   Embed URL:", getYouTubeEmbedUrl(videoId));
} else {
    console.log("❌ getYouTubeEmbedUrl function not found");
}

// Test 5: URL Metadata Fetching
console.log("\n5. Testing URL metadata fetching:");
if (typeof fetchUrlMetadata === 'function') {
    console.log("✅ fetchUrlMetadata function exists");
    fetchUrlMetadata(testUrl).then(result => {
        console.log("   Metadata result:", result);
        if (result && result.isYouTube) {
            console.log("   ✅ YouTube metadata detected successfully!");
            console.log("   Title:", result.title);
            console.log("   Description:", result.description);
            console.log("   Video ID:", result.videoId);
            console.log("   Embed URL:", result.embedUrl);
        } else {
            console.log("   ⚠️ YouTube metadata not properly detected");
        }
    }).catch(error => {
        console.log("   ❌ Error fetching metadata:", error);
    });
} else {
    console.log("❌ fetchUrlMetadata function not found");
}

// Test 6: Manual URL Preview Modal Test
console.log("\n6. Testing URL Preview Modal:");
if (typeof showUrlPreviewModal === 'function') {
    console.log("✅ showUrlPreviewModal function exists");
    
    // Create test preview data
    const testPreview = {
        title: "Rick Astley - Never Gonna Give You Up (Official Video)",
        description: "The official video for Rick Astley's Never Gonna Give You Up",
        image: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        url: testUrl,
        isYouTube: true,
        videoId: "dQw4w9WgXcQ",
        embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        authorName: "Rick Astley"
    };
    
    const testTarget = {
        type: 'column',
        columnId: 'test-column'
    };
    
    console.log("   Creating test YouTube preview modal...");
    showUrlPreviewModal(testPreview, testTarget);
    console.log("   ✅ YouTube preview modal should be visible now!");
} else {
    console.log("❌ showUrlPreviewModal function not found");
}

console.log("\n🏁 YouTube URL Preview Test completed!");
