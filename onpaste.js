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

function handlePaste(event) {
    event.preventDefault();
    
    const clipboardData = event.clipboardData || window.clipboardData;
    const items = clipboardData.items;
    
    if (!items) return;

    // Bestimme Ziel: ausgewählte Karte oder Spalte
    const target = determineCurrentPasteTarget();
    
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
    
    // 2. Prüfe ob eine Karte ausgewählt ist
    if (selectedCardData) {
        return { 
            type: 'card', 
            cardId: selectedCardData.cardId, 
            columnId: selectedCardData.columnId 
        };
    }
    
    // 3. Prüfe ob eine Spalte ausgewählt ist (oder nutze erste Spalte)
    if (selectedColumnForPaste) {
        return { type: 'column', columnId: selectedColumnForPaste };
    }
    
    // 4. Fallback: Erste verfügbare Spalte
    if (currentBoard && currentBoard.columns.length > 0) {
        return { type: 'column', columnId: currentBoard.columns[0].id };
    }
    
    return null;
}

function handleTextPaste(text, target) {
    // Verwende die erweiterte URL-Behandlung
    handleTextPasteEnhanced(text, target);
}

function handleHtmlPaste(html, target) {
    if (!target) return;
    
    // HTML zu Markdown konvertieren (einfache Konvertierung)
    let markdown = htmlToMarkdown(html);
    
    handleTextPaste(markdown, target);
}

function handleImagePaste(item, target) {
    if (!target) return;
    
    const file = item.getAsFile();
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Data = e.target.result;
        const markdown = `![Eingefügtes Bild](${base64Data})`;
        
        handleTextPaste(markdown, target);
    };
    reader.readAsDataURL(file);
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

function appendToCard(cardId, columnId, text) {
    const column = currentBoard.columns.find(c => c.id === columnId);
    if (!column) return;
    
    const card = column.cards.find(c => c.id === cardId);
    if (!card) return;
    
    // Text an bestehenden Content anhängen
    card.content = (card.content || '') + '\n\n' + text;
    
    saveAllBoards();
    renderColumns();
    
    // Falls Full Card Modal offen ist, aktualisieren
    updateFullCardModal(cardId);
    
    // Feedback
    showPasteNotification('Inhalt zur Karte hinzugefügt!');
}

function createCardFromPaste(columnId, text) {
    const column = currentBoard.columns.find(c => c.id === columnId);
    if (!column) return;
    
    // Versuche Titel aus erstem Zeile zu extrahieren
    const lines = text.split('\n');
    let heading = 'Eingefügter Inhalt';
    let content = text;
    
    if (lines.length > 0 && lines[0].trim().length > 0 && lines[0].trim().length < 100) {
        heading = lines[0].trim();
        content = lines.slice(1).join('\n').trim();
    }
      // Neue Karte erstellen
    const newCard = {
        id: generateId(),
        heading: heading,
        content: content,
        color: 'color-gradient-1',
        thumbnail: '',
        comments: '',
        url: '',
        inactive: false
    };
    
    column.cards.push(newCard);
    saveAllBoards();
    renderColumns();
    
    // Feedback
    showPasteNotification(`Neue Karte "${heading}" erstellt!`);
}

function showPasteNotification(message) {
    // Einfache Benachrichtigung erstellen
    const notification = document.createElement('div');
    notification.className = 'paste-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        z-index: 10000;
        font-size: 14px;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Nach 3 Sekunden entfernen
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Paste Help Modal
function showPasteHelp() {
    const helpModal = document.createElement('div');
    helpModal.className = 'modal show';
    helpModal.id = 'paste-help-modal';
    helpModal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h2>📋 Paste-Funktionalität</h2>
                <button class="close-btn" onclick="closePasteHelp()">&times;</button>
            </div>
            <div class="modal-body">
                <h3>🎯 Einfügen in Karten und Spalten</h3>
                <p>Sie können Inhalte aus der Zwischenablage direkt in Ihr Kanban-Board einfügen:</p>
                
                <h4>📝 Unterstützte Inhalte:</h4>
                <ul>
                    <li><strong>Text/Markdown:</strong> Wird direkt eingefügt</li>
                    <li><strong>HTML:</strong> Wird automatisch zu Markdown konvertiert</li>
                    <li><strong>Bilder:</strong> Screenshots werden als Base64 eingefügt</li>
                    <li><strong>URLs:</strong> Werden zu Markdown-Links konvertiert</li>
                </ul>
                
                <h4>🎮 Verwendung:</h4>
                <ol>
                    <li><strong>In Card Modal:</strong> Strg+V im Textbereich einfügen</li>
                    <li><strong>In bestehende Karte:</strong> Karte anklicken → Strg+V</li>
                    <li><strong>Neue Karte erstellen:</strong> Spalten-Header anklicken → Strg+V</li>
                </ol>
                
                <h4>💡 Tipps:</h4>
                <ul>
                    <li>Klicken Sie auf eine Spalten-Überschrift, um sie für Paste auszuwählen</li>
                    <li>Ausgewählte Spalten werden blau umrandet</li>
                    <li>Screenshots aus der Zwischenablage werden automatisch eingefügt</li>
                    <li>HTML von Webseiten wird zu Markdown konvertiert</li>
                </ul>
                
                <div class="paste-hint">
                    🚀 Probieren Sie es aus: Kopieren Sie Text, ein Bild oder eine URL und drücken Sie Strg+V!
                </div>
            </div>
        </div>
    `;
    
    helpModal.onclick = function(e) {
        if (e.target === helpModal) closePasteHelp();
    };
    
    document.body.appendChild(helpModal);
}

function closePasteHelp() {
    const modal = document.getElementById('paste-help-modal');
    if (modal) {
        modal.remove();
    }
}

// Event Listener für Spalten-Auswahl
function selectColumnForPaste(columnId) {
    selectedColumnForPaste = columnId;
    
    // Debugging-Ausgabe
    console.log('🎯 Column selected for paste:', columnId);
    
    // Visuelle Hervorhebung der ausgewählten Spalte
    document.querySelectorAll('.kanban-column').forEach(col => {
        col.classList.remove('selected-for-paste');
    });
    
    const columnElement = document.querySelector(`[data-column-id="${columnId}"]`);
    if (columnElement) {
        columnElement.classList.add('selected-for-paste');
        console.log('✅ Column visual selection applied to:', columnElement);
        
        // Erzwinge Stil-Update
        columnElement.style.setProperty('box-shadow', '0 0 0 3px #2196F3', 'important');
        
        // Feedback-Nachricht mit Spalten-Namen - nur bei Paste-Aktion
        // showPasteNotification entfernt - wird nur bei echtem Paste aufgerufen
    } else {
        console.warn('❌ Column element not found for ID:', columnId);
    }
}

// Initialisierung der Paste-Funktionalität
function initPasteFunctionality() {
    // Globaler Paste Event Listener
    document.addEventListener('paste', handlePaste);
      // Spalten-Klick für Auswahl (mehrere Selektoren)
    document.addEventListener('click', function(event) {
        // Ignoriere Klicks auf Menu-Dots und andere Buttons
        if (event.target.closest('.menu-dots') || 
            event.target.closest('button') || 
            event.target.closest('.dropdown-menu') ||
            event.target.closest('.column-actions')) {
            return; // Lass diese Events normal durch
        }
        
        // Mehrere Wege, um Spalten-Klicks zu erkennen
        const columnHeader = event.target.closest('.column-header');
        const columnTitle = event.target.closest('.column-title');
        const kanbanColumn = event.target.closest('.kanban-column');
        
        let columnElement = null;
        let columnId = null;
        
        if (columnHeader) {
            columnElement = columnHeader.closest('.kanban-column');
        } else if (columnTitle) {
            columnElement = columnTitle.closest('.kanban-column');
        } else if (kanbanColumn && !event.target.closest('.kanban-card')) {
            // Klick direkt auf die Spalte, aber nicht auf eine Karte
            columnElement = kanbanColumn;
        }
        
        if (columnElement) {
            columnId = columnElement.dataset.columnId;
            if (columnId) {
                event.preventDefault(); // Verhindere andere Event-Handler
                event.stopPropagation();
                selectColumnForPaste(columnId);
            }
        }
    }, true); // useCapture = true für höhere Priorität
    
    // CSS für Paste-Animationen hinzufügen
    if (!document.getElementById('paste-styles')) {
        const style = document.createElement('style');
        style.id = 'paste-styles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }            .kanban-column.selected-for-paste {
                box-shadow: 0 0 0 3px #2196F3 !important;
                border-radius: 8px !important;
                transition: box-shadow 0.2s ease !important;
                position: relative !important;
            }
            
        `;
        document.head.appendChild(style);
    }
    
    console.log('✅ Paste functionality initialized with enhanced column selection');
}

// URL Preview Funktionalität
async function fetchUrlPreview(url) {
    try {
        // Verschiedene Ansätze für URL-Metadaten
        const preview = await fetchUrlMetadata(url);
        return preview;
    } catch (error) {
        console.warn('URL Preview failed:', error);
        return null;
    }
}

async function fetchUrlMetadata(url) {
    // Spezielle Behandlung für YouTube-URLs
    if (isYouTubeUrl(url)) {
        return await fetchYouTubeMetadata(url);
    }
    
    const corsProxies = [
        'https://api.allorigins.win/get?url=',
        'https://cors-anywhere.herokuapp.com/',
        'https://thingproxy.freeboard.io/fetch/'
    ];
    
    // Option 1: AllOrigins (bevorzugt für Metadaten)
    try {
        const response = await fetch(`${corsProxies[0]}${encodeURIComponent(url)}`);
        if (response.ok) {
            const data = await response.json();
            if (data.contents) {
                return parseHtmlForMetadata(data.contents, url);
            }
        }
    } catch (error) {
        console.warn('AllOrigins failed:', error.message);
    }
    
    // Option 2: ThingProxy als Fallback
    try {
        const response = await fetch(`${corsProxies[2]}${url}`, {
            method: 'GET',
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (response.ok) {
            const html = await response.text();
            return parseHtmlForMetadata(html, url);
        }
    } catch (error) {
        console.warn('ThingProxy failed:', error.message);
    }
    
    // Option 3: Direkte Anfrage (falls CORS erlaubt)
    try {
        const response = await fetch(url, {
            method: 'HEAD', // Erst HEAD-Request für Schnelligkeit
            mode: 'cors'
        });
        
        if (response.ok) {
            // Falls HEAD erfolgreich, hole vollständige Antwort
            const fullResponse = await fetch(url, { 
                method: 'GET',
                mode: 'cors'
            });
            if (fullResponse.ok) {
                const html = await fullResponse.text();
                return parseHtmlForMetadata(html, url);
            }
        }
    } catch (error) {
        console.warn('Direct fetch failed (CORS blocked):', error.message);
    }
    
    // Fallback: Basic URL Info basierend auf der Domain
    const domain = extractDomainFromUrl(url);
    return {
        title: domain.replace('www.', '').split('.')[0],
        description: `Webseite von ${domain}`,
        image: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
        url: url
    };
}

async function fetchYouTubeMetadata(url) {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
        return null;
    }
    
    try {
        // Versuche YouTube oEmbed API für Metadaten
        const oembed = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
        if (oembed.ok) {
            const data = await oembed.json();
            return {
                title: data.title || 'YouTube Video',
                description: `Video von ${data.author_name || 'YouTube'} • ${data.width}x${data.height}`,
                image: getYouTubeThumbnail(videoId, 'maxresdefault'),
                url: url,
                isYouTube: true,
                videoId: videoId,
                embedUrl: getYouTubeEmbedUrl(videoId),
                authorName: data.author_name,
                duration: data.duration || null
            };
        }
    } catch (error) {
        console.warn('YouTube oEmbed failed:', error);
    }
    
    // Fallback: Grundlegende YouTube-Daten
    return {
        title: 'YouTube Video',
        description: 'Video auf YouTube',
        image: getYouTubeThumbnail(videoId, 'maxresdefault'),
        url: url,
        isYouTube: true,
        videoId: videoId,
        embedUrl: getYouTubeEmbedUrl(videoId)
    };
}

function parseHtmlForMetadata(html, url) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Meta-Tags extrahieren
    const getMetaContent = (property) => {
        const meta = doc.querySelector(`meta[property="${property}"]`) || 
                     doc.querySelector(`meta[name="${property}"]`) ||
                     doc.querySelector(`meta[itemprop="${property}"]`);
        return meta ? meta.getAttribute('content') : null;
    };
    
    // Titel ermitteln (verschiedene Quellen)
    let title = getMetaContent('og:title') || 
                getMetaContent('twitter:title') || 
                doc.querySelector('title')?.textContent ||
                doc.querySelector('h1')?.textContent ||
                extractDomainFromUrl(url);
    
    // Beschreibung ermitteln
    let description = getMetaContent('og:description') || 
                     getMetaContent('twitter:description') || 
                     getMetaContent('description') ||
                     doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
                     getFirstParagraphText(doc) ||
                     `Webseite von ${extractDomainFromUrl(url)}`;
    
    // Bild ermitteln (verschiedene Quellen)
    let image = getMetaContent('og:image') || 
                getMetaContent('twitter:image') ||
                getMetaContent('twitter:image:src') ||
                doc.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href') ||
                doc.querySelector('link[rel="icon"]')?.getAttribute('href') ||
                doc.querySelector('img')?.getAttribute('src');
    
    // Relative URLs zu absoluten URLs konvertieren
    let absoluteImage = null;
    if (image) {
        try {
            if (image.startsWith('http')) {
                absoluteImage = image;
            } else if (image.startsWith('//')) {
                absoluteImage = 'https:' + image;
            } else if (image.startsWith('/')) {
                const domain = new URL(url).origin;
                absoluteImage = domain + image;
            } else {
                const basePath = url.substring(0, url.lastIndexOf('/') + 1);
                absoluteImage = basePath + image;
            }
        } catch (error) {
            console.warn('Error processing image URL:', error);
            absoluteImage = null;
        }
    }
    
    // Fallback Favicon wenn kein Bild gefunden
    if (!absoluteImage) {
        const domain = extractDomainFromUrl(url);
        absoluteImage = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    }
    
    return {
        title: cleanText(title).substring(0, 100),
        description: cleanText(description).substring(0, 300),
        image: absoluteImage,
        url: url
    };
}

// Hilfsfunktion: Ersten Paragraph-Text extrahieren
function getFirstParagraphText(doc) {
    const paragraph = doc.querySelector('p');
    if (paragraph && paragraph.textContent.trim().length > 20) {
        return paragraph.textContent.trim();
    }
    return null;
}

// Hilfsfunktion: Text bereinigen
function cleanText(text) {
    if (!text) return '';
    return text
        .replace(/\s+/g, ' ')
        .replace(/[\n\r]/g, ' ')
        .trim();
}

function extractDomainFromUrl(url) {
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
}

// YouTube-spezifische Funktionen
function isYouTubeUrl(url) {
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    return youtubeRegex.test(url);
}

function extractYouTubeVideoId(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function getYouTubeEmbedUrl(videoId) {
    // Verwende youtube-nocookie.com für bessere Privatsphäre und Kompatibilität
    // Erweiterte Parameter für bessere Kompatibilität
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&fs=1&cc_load_policy=0&iv_load_policy=3&autohide=0`;
}

function getYouTubeThumbnail(videoId, quality = 'maxresdefault') {
    // Verfügbare Qualitäten: maxresdefault, hqdefault, mqdefault, sddefault, default
    return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

// Erweiterte URL-Text Behandlung
async function handleTextPasteEnhanced(text, target) {
    if (!target) return;
    
    // URL-Erkennung
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex);
    
    if (urls && urls.length === 1 && text.trim() === urls[0]) {
        // Einzelne URL - zeige Preview
        await showUrlPreviewAndPaste(urls[0], target);
    } else if (urls) {
        // Text mit URLs - konvertiere URLs zu Markdown mit verbesserter Titel-Erkennung
        let processedText = text;
        for (const url of urls) {
            try {
                const preview = await fetchUrlPreview(url);
                if (preview && preview.title !== extractDomainFromUrl(url)) {
                    processedText = processedText.replace(url, `[${preview.title}](${url})`);
                } else {
                    processedText = processedText.replace(url, `[${url}](${url})`);
                }
            } catch (error) {
                // Fallback für einzelne URL-Fehler
                processedText = processedText.replace(url, `[${url}](${url})`);
            }
        }
        
        // Verwende die normale Paste-Behandlung für verarbeiteten Text
        handleTextPasteBasic(processedText, target);
        showPasteNotification('📋 Text mit Links eingefügt!');
    } else {
        // Kein URL - normale Behandlung
        handleTextPasteBasic(text, target);
        showPasteNotification('📋 Text eingefügt!');
    }
}

// Basis-Implementierung für Text-Paste (ohne URL-Vorschau)
function handleTextPasteBasic(text, target) {
    if (!target) return;
    
    if (target.type === 'modal') {
        insertIntoTextarea(target.element, text);
    } else if (target.type === 'card') {
        appendToCard(target.cardId, target.columnId, text);
    } else if (target.type === 'column') {
        createCardFromPaste(target.columnId, text);
    }
}

async function showUrlPreviewAndPaste(url, target) {
    // Zeige Loading-Nachricht
    const loadingNotification = showPasteNotification('🔍 Lade URL-Vorschau...', 0);
    
    try {
        const preview = await fetchUrlPreview(url);
        
        // Entferne Loading-Nachricht
        if (loadingNotification && loadingNotification.parentNode) {
            loadingNotification.parentNode.removeChild(loadingNotification);
        }
        
        if (preview) {
            showUrlPreviewModal(preview, target);
        } else {
            // Fallback bei fehlschlagender Preview
            handleTextPaste(`[${url}](${url})`, target);
            showPasteNotification('⚠️ Konnte keine Vorschau laden - URL als Link eingefügt');
        }
    } catch (error) {
        console.error('URL Preview Error:', error);
        // Entferne Loading-Nachricht
        if (loadingNotification && loadingNotification.parentNode) {
            loadingNotification.parentNode.removeChild(loadingNotification);
        }
        
        // Fallback
        handleTextPaste(`[${url}](${url})`, target);
        showPasteNotification('⚠️ URL-Vorschau fehlgeschlagen - Link eingefügt');
    }
}

function showUrlPreviewModal(preview, target) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'url-preview-modal';
    
    // Generiere besseren Standardinhalt basierend auf Ziel
    let defaultContent;
    if (preview.description && preview.description.length > 10) {
        defaultContent = `# ${preview.title}

${preview.description}

[🔗 Zur Webseite](${preview.url})`;
    } else {
        defaultContent = `# ${preview.title}

[🔗 ${preview.url}](${preview.url})`;
    }

    // YouTube-spezifische Inhalte
    const isYouTube = preview.isYouTube;
    const videoTabs = isYouTube ? `
        <div class="video-tabs">
            <button class="tab-btn active" onclick="showVideoTab('thumbnail')" data-tab="thumbnail">
                🖼️ Thumbnail
            </button>
            <button class="tab-btn" onclick="showVideoTab('player')" data-tab="player">
                ▶️ Video Player
            </button>
        </div>
    ` : '';

    const thumbnailContent = `
        <div class="url-preview-image">
            <img src="${preview.image}" alt="Preview" onerror="this.style.display='none'; this.parentElement.style.display='none';" 
                 onload="this.style.opacity='1';" style="opacity: 0; transition: opacity 0.3s;">
        </div>
    `;    const playerContent = isYouTube ? `
        <div class="youtube-video-container" id="video-player-tab" style="display: none;">
            <iframe 
                id="youtube-iframe-${preview.videoId}"
                src="${preview.embedUrl}" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowfullscreen
                loading="lazy"
                referrerpolicy="strict-origin-when-cross-origin"
                title="YouTube Video Player"
                onload="console.log('✅ YouTube Video geladen:', '${preview.videoId}')"
                onerror="handleYouTubeEmbedError('${preview.videoId}', '${preview.url}')">
            </iframe>
            <div id="youtube-fallback-${preview.videoId}" style="display: none; padding: 1.5rem; text-align: center; background: #f8f9fa; border-radius: 8px; margin: 1rem 0; border: 2px dashed #dee2e6;">
                <p style="margin: 0 0 1rem 0; color: #666; font-size: 1.1rem;">⚠️ Video kann nicht eingebettet werden</p>
                <div style="margin: 1rem 0;">
                    <button onclick="retryYouTubeEmbed('${preview.videoId}', '${preview.url}')" 
                            style="background: #28a745; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; margin: 0 0.5rem;">
                        🔄 Nochmal versuchen
                    </button>
                    <a href="${preview.url}" target="_blank" 
                       style="background: #007bff; color: white; text-decoration: none; padding: 0.5rem 1rem; border-radius: 4px; display: inline-block; margin: 0 0.5rem;">
                        🔗 Auf YouTube öffnen
                    </a>
                </div>
                <small style="color: #999;">Manche Videos erlauben kein Embedding aufgrund von Urheberrechtseinstellungen.</small>
            </div>
        </div>
    ` : '';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 650px;">
            <div class="modal-header">
                <h2>${isYouTube ? '🎥' : '🔗'} ${isYouTube ? 'YouTube Video' : 'URL-Vorschau'}</h2>
                <button class="close-btn" onclick="closeUrlPreviewModal()">&times;</button>
            </div>
            <div class="modal-body">
                ${videoTabs}
                <div class="url-preview-container">
                    <div id="thumbnail-tab" class="tab-content active">
                        ${preview.image ? thumbnailContent : ''}
                    </div>
                    ${playerContent}
                    <div class="url-preview-content">
                        <h3 class="url-preview-title">${preview.title}</h3>
                        <p class="url-preview-description">${preview.description}</p>
                        <small class="url-preview-url">${isYouTube ? '🎥' : '🌐'} ${preview.url}</small>
                        ${isYouTube && preview.authorName ? `<br><small style="color: #666;">📺 Kanal: ${preview.authorName}</small>` : ''}
                    </div>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="use-as-thumbnail" ${preview.image ? 'checked' : 'disabled'}>
                        <span>${isYouTube ? 'Video-Thumbnail als Karten-Thumbnail verwenden' : 'Bild als Karten-Thumbnail verwenden'}</span>
                        ${!preview.image ? '<small style="color: #999;"> (Kein Bild verfügbar)</small>' : ''}
                    </label>
                </div>
                
                <div class="form-group">
                    <label for="preview-card-title">Karten-Titel:</label>
                    <input type="text" id="preview-card-title" value="${preview.title}" maxlength="100" 
                           placeholder="Titel für die Karte eingeben...">
                </div>
                
                <div class="form-group">
                    <label for="preview-content">Inhalt (Markdown):</label>
                    <textarea id="preview-content" rows="6" placeholder="Markdown-Inhalt für die Karte...">${defaultContent}</textarea>
                    <small style="color: #666; font-size: 0.85rem;">
                        💡 Sie können den Inhalt bearbeiten. Markdown wird unterstützt.
                    </small>
                </div>
                  <div class="modal-actions">
                    <button class="btn btn-primary" onclick="confirmUrlPreviewPaste()">
                        ${isYouTube ? '🎥 Mit Video-Player einfügen' : '📝 ' + (target.type === 'column' ? 'Neue Karte erstellen' : 'Einfügen')}
                    </button>
                    ${isYouTube ? `<button class="btn btn-secondary" onclick="pasteYouTubeAsLink()">
                        🔗 Nur als Link einfügen
                    </button>` : `<button class="btn btn-secondary" onclick="pasteUrlAsSimpleLink()">
                        🔗 Als einfacher Link
                    </button>`}
                    <button class="btn btn-secondary" onclick="closeUrlPreviewModal()">
                        ❌ Abbrechen
                    </button>
                </div>
                
                <div style="margin-top: 1rem; padding: 0.75rem; background: #f8f9fa; border-radius: 4px; font-size: 0.85rem; color: #666;">
                    <strong>Ziel:</strong> 
                    ${target.type === 'modal' ? '📝 Card Modal (aktuell geöffnet)' :
                      target.type === 'card' ? '📋 Bestehende Karte (wird erweitert)' :
                      target.type === 'column' ? '➕ Neue Karte in Spalte' : 'Unbekannt'}
                </div>
            </div>
        </div>
    `;
    
    // Daten für Confirm-Funktion speichern
    modal.dataset.targetType = target.type;
    modal.dataset.targetData = JSON.stringify(target);
    modal.dataset.originalUrl = preview.url;
    modal.dataset.previewImage = preview.image || '';
    
    modal.onclick = function(e) {
        if (e.target === modal) closeUrlPreviewModal();
    };
    
    document.body.appendChild(modal);
    
    // Fokus auf Titel-Input setzen
    setTimeout(() => {
        const titleInput = document.getElementById('preview-card-title');
        if (titleInput) {
            titleInput.focus();
            titleInput.select();
        }
    }, 100);
}

// YouTube Video Tab-Switching Funktionalität
function showVideoTab(tabName) {
    // Tab-Buttons aktualisieren
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Tab-Inhalte umschalten
    const thumbnailTab = document.getElementById('thumbnail-tab');
    const playerTab = document.getElementById('video-player-tab');
    
    if (tabName === 'thumbnail') {
        if (thumbnailTab) {
            thumbnailTab.style.display = 'block';
            thumbnailTab.classList.add('active');
        }
        if (playerTab) {
            playerTab.style.display = 'none';
            playerTab.classList.remove('active');
        }
    } else if (tabName === 'player') {
        if (thumbnailTab) {
            thumbnailTab.style.display = 'none';
            thumbnailTab.classList.remove('active');
        }
        if (playerTab) {
            playerTab.style.display = 'block';
            playerTab.classList.add('active');
        }
    }
}

// Globale Funktion für Tab-Switching verfügbar machen
window.showVideoTab = showVideoTab;

function closeUrlPreviewModal() {
    const modal = document.getElementById('url-preview-modal');
    if (modal) {
        modal.remove();
    }
}

// YouTube Video Tab-Switching Funktionalität
function showVideoTab(tabName) {
    // Tab-Buttons aktualisieren
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Tab-Inhalte umschalten
    const thumbnailTab = document.getElementById('thumbnail-tab');
    const playerTab = document.getElementById('video-player-tab');
    
    if (tabName === 'thumbnail') {
        if (thumbnailTab) {
            thumbnailTab.style.display = 'block';
            thumbnailTab.classList.add('active');
        }
        if (playerTab) {
            playerTab.style.display = 'none';
            playerTab.classList.remove('active');
        }
    } else if (tabName === 'player') {
        if (thumbnailTab) {
            thumbnailTab.style.display = 'none';
            thumbnailTab.classList.remove('active');
        }
        if (playerTab) {
            playerTab.style.display = 'block';
            playerTab.classList.add('active');
        }
    }
}

// Globale Funktion für Tab-Switching verfügbar machen
window.showVideoTab = showVideoTab;

function confirmUrlPreviewPaste() {
    const modal = document.getElementById('url-preview-modal');
    if (!modal) return;
    
    const target = JSON.parse(modal.dataset.targetData);
    const title = document.getElementById('preview-card-title').value;
    let content = document.getElementById('preview-content').value;
    const useAsThumbnail = document.getElementById('use-as-thumbnail').checked;
    const thumbnailUrl = useAsThumbnail ? modal.dataset.previewImage : '';
    const originalUrl = modal.dataset.originalUrl;
    
    // Prüfe ob es sich um ein YouTube-Video handelt und erweitere den Inhalt
    if (isYouTubeUrl(originalUrl)) {
        const videoId = extractYouTubeVideoId(originalUrl);
        if (videoId) {
            const embedUrl = getYouTubeEmbedUrl(videoId);
            
            // Erstelle erweiterten YouTube-Inhalt mit eingebettetem Player
            content = `# ${title}

## 🎥 Video Player
<div class="youtube-embed" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; background: #000; border-radius: 8px; margin: 1rem 0;">
<iframe 
    src="${embedUrl}" 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" 
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
    allowfullscreen
    title="YouTube Video: ${title}">
</iframe>
</div>
---
[🔗 Auf YouTube öffnen](${originalUrl})

`;
        }
    }
    
    if (target.type === 'modal') {
        // In offenes Card Modal einfügen
        document.getElementById('card-heading').value = title;
        insertIntoTextarea('card-content', content);
        if (thumbnailUrl) {
            document.getElementById('card-thumbnail').value = thumbnailUrl;
        }
    } else if (target.type === 'card') {
        // An bestehende Karte anhängen
        appendToCard(target.cardId, target.columnId, content);
    } else if (target.type === 'column') {
        // Neue Karte mit allen Daten erstellen
        createEnhancedCardFromPaste(target.columnId, title, content, thumbnailUrl);
    }
    
    closeUrlPreviewModal();
    showPasteNotification('✅ URL-Vorschau eingefügt!');
}

function pasteUrlAsSimpleLink() {
    const modal = document.getElementById('url-preview-modal');
    if (!modal) return;
    
    const target = JSON.parse(modal.dataset.targetData);
    const url = modal.dataset.originalUrl;
    
    handleTextPaste(`[${url}](${url})`, target);
    closeUrlPreviewModal();
    showPasteNotification('🔗 URL als einfacher Link eingefügt');
}

function pasteYouTubeAsLink() {
    const modal = document.getElementById('url-preview-modal');
    if (!modal) return;
    
    const target = JSON.parse(modal.dataset.targetData);
    const title = document.getElementById('preview-card-title').value;
    const originalUrl = modal.dataset.originalUrl;
    const useAsThumbnail = document.getElementById('use-as-thumbnail').checked;
    const thumbnailUrl = useAsThumbnail ? modal.dataset.previewImage : '';
    
    // Erstelle einfachen Link-Inhalt für YouTube
    const content = `# ${title}

[🎥 Video auf YouTube ansehen](${originalUrl})

---
*YouTube-Link eingefügt*`;
    
    if (target.type === 'modal') {
        document.getElementById('card-heading').value = title;
        insertIntoTextarea('card-content', content);
        if (thumbnailUrl) {
            document.getElementById('card-thumbnail').value = thumbnailUrl;
        }
    } else if (target.type === 'card') {
        appendToCard(target.cardId, target.columnId, content);
    } else if (target.type === 'column') {
        createEnhancedCardFromPaste(target.columnId, title, content, thumbnailUrl);
    }
    
    closeUrlPreviewModal();
    showPasteNotification('🔗 YouTube-Video als Link eingefügt!');
}

function createEnhancedCardFromPaste(columnId, title, content, thumbnailUrl = '') {
    const column = currentBoard.columns.find(c => c.id === columnId);
    if (!column) return;
      // Neue Karte mit erweiterten Daten erstellen
    const newCard = {
        id: generateId(),
        heading: title || 'Eingefügter Inhalt',
        content: content,
        color: 'color-gradient-1',
        thumbnail: thumbnailUrl,
        comments: '',
        url: '',
        inactive: false
    };
    
    column.cards.push(newCard);
    saveAllBoards();
    renderColumns();
}

// showPasteNotification erweitern für dauerhafte Anzeige
function showPasteNotification(message, duration = 3000) {
    const notification = document.createElement('div');
    notification.className = 'paste-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        z-index: 10000;
        font-size: 14px;
        animation: slideInRight 0.3s ease;
    `;
      document.body.appendChild(notification);
    
    if (duration > 0) {
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
    
    return notification;
}

// Erweiterte YouTube-Embedding-Funktionen
function handleYouTubeEmbedError(videoId, originalUrl) {
    console.warn('❌ YouTube Embed fehlgeschlagen für Video:', videoId);
    const iframe = document.getElementById(`youtube-iframe-${videoId}`);
    const fallback = document.getElementById(`youtube-fallback-${videoId}`);
    
    if (iframe) {
        iframe.style.display = 'none';
    }
    if (fallback) {
        fallback.style.display = 'block';
    }
}

function retryYouTubeEmbed(videoId, originalUrl) {
    console.log('🔄 Retry YouTube Embed für Video:', videoId);
    const iframe = document.getElementById(`youtube-iframe-${videoId}`);
    const fallback = document.getElementById(`youtube-fallback-${videoId}`);
    
    if (!iframe) return;
    
    // Verstecke Fallback und zeige Iframe
    if (fallback) fallback.style.display = 'none';
    iframe.style.display = 'block';
    
    // Versuche verschiedene Embedding-URLs
    const embedUrls = [
        `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&fs=1`,
        `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`,
        `https://www.youtube-nocookie.com/embed/${videoId}`,
        `https://www.youtube.com/embed/${videoId}`
    ];
    
    let currentTry = 0;
    
    function tryNextUrl() {
        if (currentTry >= embedUrls.length) {
            console.warn('❌ Alle YouTube Embed URLs fehlgeschlagen für:', videoId);
            handleYouTubeEmbedError(videoId, originalUrl);
            return;
        }
        
        const url = embedUrls[currentTry];
        console.log(`🔄 Versuche URL ${currentTry + 1}/${embedUrls.length}:`, url);
        
        iframe.src = url;
        iframe.onload = function() {
            console.log('✅ YouTube Embed erfolgreich mit URL:', url);
        };
        iframe.onerror = function() {
            currentTry++;
            setTimeout(tryNextUrl, 1000); // Warte 1 Sekunde zwischen Versuchen
        };
    }
    
    tryNextUrl();
}

// Globale Funktionen verfügbar machen
window.handleYouTubeEmbedError = handleYouTubeEmbedError;
window.retryYouTubeEmbed = retryYouTubeEmbed;
window.pasteYouTubeAsLink = pasteYouTubeAsLink;

// Export für globale Nutzung
window.PasteFunctionality = {
    handlePaste,
    initPasteFunctionality,
    selectColumnForPaste,
    handleTextPaste,
    handleImagePaste,
    showUrlPreviewModal,
    fetchUrlMetadata,
    isYouTubeUrl,
    extractYouTubeVideoId,
    getYouTubeThumbnail,
    getYouTubeEmbedUrl,
    pasteYouTubeAsLink
};