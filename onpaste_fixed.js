/**
 * functions to handle paste events 
 * target: paste content inside of  the selected card 
 *        or gcreateCard with the pasted conten in the selected column
 * event: paste event
 * possible contents: 
 * - text/markdown: paste as is
 * - html: convert to markdown
 * - image (screenshots, etc.): convert to base64 src
 * - urls (links): convert to markdown link
 * 
**/

// Globale Variablen für Paste-Funktionalität
let selectedColumnForPaste = null;
let selectedCardForPaste = null;

// Smart Paste Modal Funktionalität
let smartPasteContent = null;
let smartPasteProcessedContent = null;

function handlePaste(event) {
    // Prüfe ob wir in einem Formular-Feld sind
    if (isInFormField(event.target)) {
        // Normales Paste-Verhalten in Formular-Feldern erlauben
        return;
    }
    
    event.preventDefault();
    
    const clipboardData = event.clipboardData || window.clipboardData;
    const items = clipboardData.items;
    
    if (!items) return;    
    
    // Bestimme Ziel: ausgewählte Karte oder Spalte
    const target = determineCurrentPasteTarget();
    
    // Kein Ziel verfügbar - informiere Benutzer
    if (!target) {
        showPasteNotification('💡 Klicken Sie erst auf einen Spalten-Header um Inhalt einzufügen!', 4000);
        return;
    }
    
    // Verarbeite verschiedene Clipboard-Inhalte
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        if (item.kind === 'file' && item.type.startsWith('image/')) {
            // Bild aus Zwischenablage (Screenshot, etc.)
            handleImagePaste(item, target);
            return;
        } else if (item.kind === 'string') {
            if (item.type === 'text/html') {
                // HTML-Inhalt
                item.getAsString(html => handleHtmlPaste(html, target));
                return;
            } else if (item.type === 'text/plain') {
                // Einfacher Text/Markdown
                item.getAsString(text => handleTextPaste(text, target));
                return;
            }
        }
    }
}

function determineCurrentPasteTarget() {
    // 1. Prüfe ob ein Card Modal offen ist
    if (document.getElementById('card-modal').classList.contains('show')) {
        return { type: 'modal', element: 'card-content' };
    }
    
    // 2. Prüfe ob eine Karte ausgewählt ist - NICHT mehr automatisch in Spalte pasten
    if (selectedCardData) {
        // Karte ist ausgewählt, aber wir pasten NICHT automatisch in die Spalte
        return null;
    }
    
    // 3. Prüfe ob eine Spalte ausgewählt ist (explizit vom Benutzer)
    if (selectedColumnForPaste) {
        return { type: 'column', columnId: selectedColumnForPaste };
    }
    
    // 4. KEIN automatischer Fallback auf erste Spalte
    return null;
}

// Hilfsfunktion: Prüft ob wir in einem Formular-Feld sind
function isInFormField(target) {
    if (!target) return false;
    
    // Prüfe Element-Typ
    const tagName = target.tagName.toLowerCase();
    if (['input', 'textarea', 'select'].includes(tagName)) {
        return true;
    }
    
    // Prüfe contenteditable
    if (target.contentEditable === 'true') {
        return true;
    }
    
    // Prüfe ob Element in einem Formular ist
    if (target.closest('form') || target.closest('.modal')) {
        return true;
    }
    
    return false;
}

// Smart Paste Modal Funktionalität
function openSmartPasteModal() {
    document.getElementById('smart-paste-modal').classList.add('show');
    
    // Focus auf das Textarea setzen
    setTimeout(() => {
        const textarea = document.getElementById('smart-paste-input');
        textarea.focus();
        
        // Event Listener für Paste im Smart Paste Modal
        textarea.addEventListener('paste', handleSmartPaste);
        
        // Event Listener für manuelle Eingabe
        textarea.addEventListener('input', handleSmartPasteInput);
    }, 100);
    
    resetSmartPasteModal();
}

function resetSmartPasteModal() {
    document.getElementById('smart-paste-input').value = '';
    document.getElementById('paste-preview-area').style.display = 'none';
    document.getElementById('apply-smart-paste-btn').disabled = true;
    smartPasteContent = null;
    smartPasteProcessedContent = null;
}

function handleSmartPaste(event) {
    event.preventDefault();
    
    const clipboardData = event.clipboardData || window.clipboardData;
    const items = clipboardData.items;
    
    if (!items) return;
    
    // Verarbeite verschiedene Clipboard-Inhalte
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        if (item.kind === 'file' && item.type.startsWith('image/')) {
            // Bild aus Zwischenablage
            handleSmartPasteImage(item);
            return;
        } else if (item.kind === 'string') {
            if (item.type === 'text/html') {
                // HTML-Inhalt
                item.getAsString(html => handleSmartPasteHtml(html));
                return;
            } else if (item.type === 'text/plain') {
                // Einfacher Text
                item.getAsString(text => handleSmartPasteText(text));
                return;
            }
        }
    }
}

function handleSmartPasteInput(event) {
    const text = event.target.value;
    if (text.trim()) {
        handleSmartPasteText(text);
    } else {
        resetSmartPastePreview();
    }
}

function handleSmartPasteText(text) {
    smartPasteContent = text;
    document.getElementById('smart-paste-input').value = text;
    
    // URL-Erkennung und Verarbeitung
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const urls = text.match(urlRegex);
    
    if (urls && urls.length > 0) {
        // Erste URL verarbeiten
        const url = urls[0];
        processUrlForSmartPaste(url, text);
    } else {
        // Einfacher Text
        smartPasteProcessedContent = text;
        showSmartPastePreview(text, 'text');
    }
}

function handleSmartPasteHtml(html) {
    smartPasteContent = html;
    const markdown = htmlToMarkdown(html);
    smartPasteProcessedContent = markdown;
    
    document.getElementById('smart-paste-input').value = markdown;
    showSmartPastePreview(markdown, 'html');
}

function handleSmartPasteImage(item) {
    const file = item.getAsFile();
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Data = e.target.result;
        const markdown = `![Eingefügtes Bild](${base64Data})`;
        
        smartPasteContent = file;
        smartPasteProcessedContent = markdown;
        
        document.getElementById('smart-paste-input').value = markdown;
        showSmartPastePreview(markdown, 'image');
    };
    reader.readAsDataURL(file);
}

function processUrlForSmartPaste(url, fullText) {
    console.log('🔗 Processing URL for Smart Paste:', url);
    
    // YouTube URL spezielle Behandlung
    if (isYouTubeUrl(url)) {
        const embedUrl = convertToYouTubeEmbed(url);
        const videoId = getYouTubeVideoId(url);
        const markdown = `[![YouTube Video](https://img.youtube.com/vi/${videoId}/maxresdefault.jpg)](${url})\n\n${embedUrl}`;
        smartPasteProcessedContent = markdown;
        showSmartPastePreview(markdown, 'youtube');
        return;
    }
    
    // Für andere URLs - einfach als Link formatieren
    let processedText = fullText;
    if (fullText.trim() === url) {
        // Nur URL eingefügt - als Link formatieren
        processedText = `[${url}](${url})`;
    } else {
        // URL in Text - bestehende URLs durch Markdown-Links ersetzen
        processedText = fullText.replace(/(https?:\/\/[^\s]+)/gi, '[$1]($1)');
    }
    
    smartPasteProcessedContent = processedText;
    showSmartPastePreview(processedText, 'url');
}

function showSmartPastePreview(content, type) {
    const previewArea = document.getElementById('paste-preview-area');
    const previewContent = document.getElementById('paste-preview-content');
    
    // Markdown zu HTML für Vorschau rendern
    let htmlContent = renderMarkdownToHtml(content);
    
    // Typ-spezifische Hinweise hinzufügen
    let typeIndicator = '';
    switch (type) {
        case 'youtube':
            typeIndicator = '<div style="color: #ff0000; font-weight: bold; margin-bottom: 10px;">🎥 YouTube Video erkannt</div>';
            break;
        case 'url':
            typeIndicator = '<div style="color: #007acc; font-weight: bold; margin-bottom: 10px;">🔗 URL als Link formatiert</div>';
            break;
        case 'image':
            typeIndicator = '<div style="color: #28a745; font-weight: bold; margin-bottom: 10px;">🖼️ Bild eingefügt</div>';
            break;
        case 'html':
            typeIndicator = '<div style="color: #6f42c1; font-weight: bold; margin-bottom: 10px;">📄 HTML zu Markdown konvertiert</div>';
            break;
        case 'text':
            typeIndicator = '<div style="color: #666; font-weight: bold; margin-bottom: 10px;">📝 Text eingefügt</div>';
            break;
    }
    
    previewContent.innerHTML = typeIndicator + htmlContent;
    previewArea.style.display = 'block';
    
    // Apply-Button aktivieren
    document.getElementById('apply-smart-paste-btn').disabled = false;
}

function resetSmartPastePreview() {
    document.getElementById('paste-preview-area').style.display = 'none';
    document.getElementById('apply-smart-paste-btn').disabled = true;
    smartPasteProcessedContent = null;
}

function triggerManualPaste() {
    // Versuche, programmatisch paste zu triggern
    const textarea = document.getElementById('smart-paste-input');
    textarea.focus();
    
    // Fallback: Benutzer informieren
    showPasteNotification('💡 Bitte drücken Sie Strg+V um Inhalt einzufügen', 3000);
}

function applySmartPaste() {
    if (!smartPasteProcessedContent) {
        showPasteNotification('❌ Kein Inhalt zum Einfügen verfügbar', 3000);
        return;
    }
    
    // Inhalt in das card-content Feld einfügen
    const cardContentTextarea = document.getElementById('card-content');
    if (cardContentTextarea) {
        const currentValue = cardContentTextarea.value;
        const newValue = currentValue ? currentValue + '\n\n' + smartPasteProcessedContent : smartPasteProcessedContent;
        cardContentTextarea.value = newValue;
        
        // Auto-Save triggern falls aktiviert
        if (typeof autoSaveCardHandler === 'function') {
            autoSaveCardHandler({ target: cardContentTextarea });
        }
        
        showPasteNotification('✅ Inhalt erfolgreich eingefügt!', 2000);
        closeModal('smart-paste-modal');
    } else {
        showPasteNotification('❌ Ziel-Feld nicht gefunden', 3000);
    }
}

function renderMarkdownToHtml(markdown) {
    // Einfache Markdown zu HTML Konvertierung für Vorschau
    let html = markdown
        // Bilder
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;">')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
        // Fett
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        // Kursiv
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        // Überschriften
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        // Zeilenumbrüche
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
    
    // In Paragraphen wrappen wenn nicht bereits HTML-Tags vorhanden
    if (!html.includes('<h') && !html.includes('<p>')) {
        html = '<p>' + html + '</p>';
    }
    
    return html;
}

// Hilfsfunktionen für URL-Verarbeitung
function isYouTubeUrl(url) {
    return url.includes('youtube.com/watch') || url.includes('youtu.be/');
}

function getYouTubeVideoId(url) {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : '';
}

function convertToYouTubeEmbed(url) {
    const videoId = getYouTubeVideoId(url);
    return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
}

function htmlToMarkdown(html) {
    // Einfache HTML zu Markdown Konvertierung
    let markdown = html
        // Überschriften
        .replace(/<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi, (match, level, text) => {
            return '#'.repeat(parseInt(level)) + ' ' + text.trim() + '\n\n';
        })
        // Fett
        .replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, '**$2**')
        // Kursiv
        .replace(/<(em|i)[^>]*>(.*?)<\/(em|i)>/gi, '*$2*')
        // Links
        .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
        // Listen
        .replace(/<ul[^>]*>(.*?)<\/ul>/gis, '$1\n')
        .replace(/<ol[^>]*>(.*?)<\/ol>/gis, '$1\n')
        .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
        // Absätze
        .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
        // Zeilenumbrüche
        .replace(/<br\s*\/?>/gi, '\n')
        // Alle anderen HTML-Tags entfernen
        .replace(/<[^>]*>/g, '')
        // HTML-Entities dekodieren
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        // Mehrfache Leerzeilen reduzieren
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .trim();
    
    return markdown;
}

// Test-Funktionen für Smart Paste
window.testSmartPaste = function() {
    console.log('🧪 Testing Smart Paste functionality...');
    
    // Test mit einer YouTube URL
    const testYouTubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    console.log('Testing YouTube URL:', testYouTubeUrl);
    
    // Smart Paste Modal öffnen
    openSmartPasteModal();
    
    // Warte kurz und simuliere dann Paste
    setTimeout(() => {
        handleSmartPasteText(testYouTubeUrl);
    }, 500);
};

window.testSmartPasteWithLink = function() {
    console.log('🔗 Testing Smart Paste with regular URL...');
    
    const testUrl = 'https://github.com/microsoft/vscode';
    console.log('Testing regular URL:', testUrl);
    
    openSmartPasteModal();
    
    setTimeout(() => {
        handleSmartPasteText(testUrl);
    }, 500);
};

window.testSmartPasteWithHTML = function() {
    console.log('📄 Testing Smart Paste with HTML content...');
    
    const testHtml = '<h2>Test Überschrift</h2><p>Das ist ein <strong>Test</strong> mit <em>HTML</em> Inhalt. <a href="https://example.com">Link zu Example</a></p>';
    console.log('Testing HTML:', testHtml);
    
    openSmartPasteModal();
    
    setTimeout(() => {
        handleSmartPasteHtml(testHtml);
    }, 500);
};

// Demo-Funktion für Smart Paste
window.demoSmartPaste = function() {
    console.log('🎭 Starting Smart Paste Demo...');
    
    // Schritt 1: Board öffnen falls noch im Dashboard
    if (document.getElementById('dashboard').style.display !== 'none') {
        const firstBoard = document.querySelector('.board-card');
        if (firstBoard) {
            firstBoard.click();
            console.log('📋 Board geöffnet');
        }
    }
    
    // Schritt 2: Warten und dann Card Modal öffnen
    setTimeout(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const addCardButton = buttons.find(btn => btn.textContent.includes('Add Card'));
        if (addCardButton) {
            addCardButton.click();
            console.log('➕ Card Modal geöffnet');
            
            // Schritt 3: Smart Paste Modal öffnen
            setTimeout(() => {
                const smartPasteBtn = document.getElementById('smart-paste-btn');
                if (smartPasteBtn) {
                    smartPasteBtn.click();
                    console.log('📋 Smart Paste Modal geöffnet');
                    
                    // Schritt 4: Demo mit YouTube URL
                    setTimeout(() => {
                        console.log('🎥 Teste YouTube URL...');
                        handleSmartPasteText('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
                    }, 1000);
                    
                } else {
                    console.error('❌ Smart Paste Button nicht gefunden');
                }
            }, 1000);
            
        } else {
            console.error('❌ Add Card Button nicht gefunden');
        }
    }, 1000);
};

// Hilfsfunktion für Debugging
window.debugSmartPaste = function() {
    console.log('🔍 Smart Paste Debug Info:');
    console.log('Card Modal:', document.getElementById('card-modal'));
    console.log('Smart Paste Modal:', document.getElementById('smart-paste-modal'));
    console.log('Smart Paste Button:', document.getElementById('smart-paste-btn'));
    console.log('Smart Paste Input:', document.getElementById('smart-paste-input'));
    console.log('Paste Preview Area:', document.getElementById('paste-preview-area'));
};

// Weitere bestehende Funktionen (von der ursprünglichen onpaste.js)
function handleTextPaste(text, target) {
    handleTextPasteEnhanced(text, target);
}

function handleTextPasteEnhanced(text, target) {
    if (!target) return;
    
    // URL-Erkennung
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const urls = text.match(urlRegex);
    
    if (urls && urls.length > 0) {
        const url = urls[0];
        
        // Spezielle URL-Behandlung
        if (isYouTubeUrl(url)) {
            handleYouTubePaste(url, text, target);
            return;
        }
        
        // Normale URL als Markdown-Link
        let processedText = text.replace(urlRegex, '[$1]($1)');
        processTextContent(processedText, target);
    } else {
        // Einfacher Text
        processTextContent(text, target);
    }
}

function handleYouTubePaste(url, fullText, target) {
    const videoId = getYouTubeVideoId(url);
    const embedHtml = convertToYouTubeEmbed(url);
    const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    
    const markdown = `[![YouTube Video](${thumbnail})](${url})\n\n${embedHtml}`;
    
    processTextContent(markdown, target);
}

function processTextContent(text, target) {
    if (target.type === 'modal') {
        // In Modal einfügen
        insertIntoTextarea(target.element, text);
    } else if (target.type === 'column') {
        // Neue Karte in Spalte erstellen
        createCardWithContent(target.columnId, text);
    }
}

function insertIntoTextarea(elementId, text) {
    const textarea = document.getElementById(elementId);
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = textarea.value;
    
    // Text an Cursor-Position einfügen
    const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
    textarea.value = newValue;
    
    // Cursor nach eingefügtem Text positionieren
    const newCursorPos = start + text.length;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    textarea.focus();
    
    // Auto-Save triggern falls aktiviert
    if (typeof autoSaveCardHandler === 'function') {
        autoSaveCardHandler({ target: textarea });
    }
}

function createCardWithContent(columnId, content) {
    // Vereinfachte Karten-Erstellung mit eingefügtem Inhalt
    if (typeof openCardModal === 'function') {
        openCardModal(columnId);
        
        setTimeout(() => {
            const contentField = document.getElementById('card-content');
            if (contentField) {
                contentField.value = content;
            }
        }, 100);
    }
}

function handleImagePaste(item, target) {
    if (!target) return;
    
    const file = item.getAsFile();
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Data = e.target.result;
        const markdown = `![Eingefügtes Bild](${base64Data})`;
        
        processTextContent(markdown, target);
    };
    reader.readAsDataURL(file);
}

function handleHtmlPaste(html, target) {
    if (!target) return;
    
    // HTML zu Markdown konvertieren
    let markdown = htmlToMarkdown(html);
    
    processTextContent(markdown, target);
}

// Paste-Benachrichtigungen
function showPasteNotification(message, duration = 3000) {
    // Bestehende Notification entfernen
    const existing = document.querySelector('.paste-notification');
    if (existing) {
        existing.remove();
    }
    
    // Neue Notification erstellen
    const notification = document.createElement('div');
    notification.className = 'paste-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #333;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-size: 14px;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Nach Ablauf entfernen
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }, duration);
}

// CSS für Animationen hinzufügen
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
