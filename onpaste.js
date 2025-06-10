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
    
    // Board speichern und rendern
    saveAllBoards();
    renderColumns();
    
    showPasteNotification('✅ Content zu Karte hinzugefügt', 2000);
}

function createNewCardWithContent(columnId, text) {
    console.log('🔍 createNewCardWithContent called with:', { columnId, text: text.substring(0, 50) + '...' });
    console.log('🔍 currentBoard:', currentBoard);
    console.log('🔍 currentBoard.columns:', currentBoard?.columns);
    
    if (!currentBoard) {
        console.error('❌ currentBoard is not defined');
        showPasteNotification('❌ Board nicht verfügbar', 3000);
        return;
    }
    
    if (!currentBoard.columns) {
        console.error('❌ currentBoard.columns is not defined');
        showPasteNotification('❌ Spalten nicht verfügbar', 3000);
        return;
    }
    
    const column = currentBoard.columns.find(c => c.id === columnId);
    if (!column) {
        console.error('❌ Target column not found:', columnId);
        console.log('🔍 Available columns:', currentBoard.columns.map(c => ({ id: c.id, title: c.title })));
        showPasteNotification(`❌ Spalte nicht gefunden: ${columnId}`, 3000);
        return;
    }
    
    console.log('✅ Target column found:', { id: column.id, title: column.title });
    
    // Titel aus Content extrahieren mit Debugging
    const extractedTitle = extractTitleFromContent(text);
    console.log('📝 Title extraction:', { 
        originalText: text.substring(0, 100) + '...', 
        extractedTitle: extractedTitle 
    });
    
    // Neue Karte erstellen
    const newCard = {
        id: generateId(),
        heading: extractedTitle,
        content: text,
        color: 'color-gradient-1',
        thumbnail: '',
        comments: '',
        url: '',
        labels: '',
        inactive: false
    };
    
    console.log('📝 Created new card:', { id: newCard.id, heading: newCard.heading });
    
    column.cards.push(newCard);
    
    // Board speichern und rendern
    saveAllBoards();
    renderColumns();
    
    showPasteNotification('✅ Neue Karte erstellt', 2000);
    console.log('✅ Card successfully added to column');
}

function createNewCardWithContentAndUrl(columnId, text, url) {
    console.log('🔍 createNewCardWithContentAndUrl called with:', { 
        columnId, 
        text: text.substring(0, 50) + '...', 
        url: url 
    });
    
    if (!currentBoard) {
        console.error('❌ currentBoard is not defined');
        showPasteNotification('❌ Board nicht verfügbar', 3000);
        return;
    }
    
    if (!currentBoard.columns) {
        console.error('❌ currentBoard.columns is not defined');
        showPasteNotification('❌ Spalten nicht verfügbar', 3000);
        return;
    }
    
    const column = currentBoard.columns.find(c => c.id === columnId);
    if (!column) {
        console.error('❌ Target column not found:', columnId);
        console.log('🔍 Available columns:', currentBoard.columns.map(c => ({ id: c.id, title: c.title })));
        showPasteNotification(`❌ Spalte nicht gefunden: ${columnId}`, 3000);
        return;
    }
    
    console.log('✅ Target column found:', { id: column.id, title: column.title });
    
    // Titel aus Content extrahieren mit Debugging
    const extractedTitle = extractTitleFromContent(text);
    console.log('📝 Title extraction:', { 
        originalText: text.substring(0, 100) + '...', 
        extractedTitle: extractedTitle 
    });
    
    // Neue Karte erstellen mit URL
    const newCard = {
        id: generateId(),
        heading: extractedTitle,
        content: text,
        color: 'color-gradient-1',
        thumbnail: '',
        comments: '',
        url: url || '',
        labels: '',
        inactive: false
    };
    
    console.log('📝 Created new card with URL:', { 
        id: newCard.id, 
        heading: newCard.heading, 
        url: newCard.url 
    });
    
    column.cards.push(newCard);
    
    // Board speichern und rendern
    saveAllBoards();
    renderColumns();
    
    const message = url ? '✅ Neue Karte mit URL erstellt' : '✅ Neue Karte erstellt';
    showPasteNotification(message, 2000);
    console.log('✅ Card successfully added to column with URL');
}

function appendToCardWithUrl(cardId, columnId, text, url) {
    console.log('🔍 appendToCardWithUrl called with:', { cardId, columnId, text: text.substring(0, 50) + '...', url });
    
    const column = currentBoard.columns.find(c => c.id === columnId);
    if (!column) {
        console.error('❌ Column not found:', columnId);
        return;
    }
    
    const card = column.cards.find(c => c.id === cardId);
    if (!card) {
        console.error('❌ Card not found:', cardId);
        return;
    }
    
    // Text an bestehenden Content anhängen
    card.content = (card.content || '') + '\n\n' + text;
    
    // URL setzen falls noch nicht vorhanden
    if (url && !card.url) {
        card.url = url;
        console.log('🔗 URL added to existing card:', url);
    }
    
    // Board speichern und rendern
    saveAllBoards();
    renderColumns();
    
    const message = url && !card.url ? '✅ Content und URL zu Karte hinzugefügt' : '✅ Content zu Karte hinzugefügt';
    showPasteNotification(message, 2000);
}

function extractTitleFromContent(content) {
    // Versuche Titel aus Content zu extrahieren
    const lines = content.trim().split('\n');
    let title = '';
    
    // Spezielle Behandlung für verschiedene Content-Typen
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Überspringe leere Zeilen
        if (!line) continue;
        
        // Überspringe Markdown-Bilder
        if (line.startsWith('![') && line.includes('](')) {
            // Extrahiere Alt-Text aus Bild-Markdown
            const altTextMatch = line.match(/!\[([^\]]*)\]/);
            if (altTextMatch && altTextMatch[1]) {
                title = altTextMatch[1];
                break;
            }
            continue;
        }
        
        // Überspringe HTML-Tags (iframes, etc.)
        if (line.startsWith('<') && line.includes('>')) {
            continue;
        }
        
        // Überspringe YouTube-Thumbnails
        if (line.startsWith('[![') && line.includes('youtube')) {
            title = 'YouTube Video';
            break;
        }
          // Überspringe reine URLs
        if (line.match(/^https?:\/\//)) {
            // Spezielle Behandlung für Bild-URLs
            if (isImageUrl(line)) {
                try {
                    const url = new URL(line);
                    const filename = url.pathname.split('/').pop();
                    const extension = getImageExtensionFromUrl(line);
                    title = filename || `Bild.${extension}` || 'Bild';
                    break;
                } catch {
                    title = 'Bild';
                    break;
                }
            } else {
                // Normale URL - extrahiere Domain als Titel
                try {
                    const url = new URL(line);
                    title = url.hostname.replace('www.', '');
                    break;
                } catch {
                    title = 'Link';
                    break;
                }
            }
        }
        
        // Überspringe Markdown-Links und extrahiere Link-Text
        const linkMatch = line.match(/\[([^\]]+)\]\([^\)]+\)/);
        if (linkMatch && linkMatch[1]) {
            title = linkMatch[1];
            break;
        }
        
        // Behandle Markdown-Überschriften
        const headingMatch = line.match(/^#+\s*(.+)$/);
        if (headingMatch && headingMatch[1]) {
            title = headingMatch[1];
            break;
        }
        
        // Verwende erste sinnvolle Textzeile
        if (line.length > 0) {
            title = line;
            break;
        }
    }
      // Falls kein Titel gefunden, verwende intelligente Defaults basierend auf Content
    if (!title.trim()) {
        if (content.includes('![') && content.includes('data:image/')) {
            title = 'Eingefügtes Bild';
        } else if (content.includes('![') && content.match(/https?:\/\/.*\.(jpg|jpeg|png|gif|webp|bmp|svg)/i)) {
            title = 'Bild (URL)';
        } else if (content.includes('youtube.com') || content.includes('youtu.be')) {
            title = 'YouTube Video';
        } else if (content.match(/https?:\/\/.*\.(jpg|jpeg|png|gif|webp|bmp|svg)/i)) {
            title = 'Bild-Link';
        } else if (content.match(/https?:\/\//)) {
            title = 'Link';
        } else if (content.includes('<iframe')) {
            title = 'Eingebetteter Inhalt';
        } else {
            title = 'Neue Karte';
        }
    }
    
    // Falls Titel zu lang ist, kürze ihn intelligent
    if (title.length > 50) {
        // Versuche an Wortgrenzen zu kürzen
        const words = title.split(' ');
        let shortTitle = '';
        
        for (const word of words) {
            if ((shortTitle + ' ' + word).length <= 47) {
                shortTitle += (shortTitle ? ' ' : '') + word;
            } else {
                break;
            }
        }
        
        title = shortTitle || title.substring(0, 47);
        title += '...';
    }
    
    return title;
}

// Erweiterte URL-Text Behandlung
async function handleTextPasteEnhanced(text, target) {
    if (!target) return;
    
    // URL-Erkennung
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex);
    
    if (urls && urls.length === 1 && text.trim() === urls[0]) {
        // Einzelne URL - prüfe ob es ein Bild ist
        const url = urls[0];
        
        if (isImageUrl(url)) {
            // Bild-URL - erstelle img-tag und speichere URL
            const imageMarkdown = `![Bild](${url})`;
            finalizePasteActionWithUrl(imageMarkdown, url, target);
        } else {
            // Normale URL - zeige Preview
            await showUrlPreviewAndPaste(url, target);
        }
    } else if (urls) {
        // Text mit URLs - URLs durch entsprechende Markdown ersetzen
        let processedText = text;
        let extractedUrl = null;
        
        urls.forEach(url => {
            if (isImageUrl(url)) {
                // Bild-URL als img-tag
                const imageMarkdown = `![Bild](${url})`;
                processedText = processedText.replace(url, imageMarkdown);
            } else {
                // Normale URL als Link
                const linkText = url.replace(/https?:\/\//, '');
                processedText = processedText.replace(url, `[${linkText}](${url})`);
            }
            
            // Erste URL als Karten-URL verwenden
            if (!extractedUrl) {
                extractedUrl = url;
            }
        });
        
        finalizePasteActionWithUrl(processedText, extractedUrl, target);
    } else {
        // Einfacher Text ohne URLs
        finalizePasteAction(text, target);
    }
}

async function showUrlPreviewAndPaste(url, target) {
    try {
        // Zeige Lade-Notification
        showPasteNotification('🔄 Lade URL-Vorschau...', 2000);
        
        // Versuche URL-Metadaten zu laden
        const preview = await fetchUrlPreview(url);
        
        if (preview && preview.title) {
            // Markdown mit Titel erstellen
            const markdownLink = `[${preview.title}](${url})`;
            finalizePasteActionWithUrl(markdownLink, url, target);
        } else {
            // Fallback: Einfacher Link
            const simpleLink = `[${url.replace(/https?:\/\//, '')}](${url})`;
            finalizePasteActionWithUrl(simpleLink, url, target);
        }
    } catch (error) {
        console.warn('URL Preview failed:', error);
        // Fallback: Einfacher Link
        const simpleLink = `[${url.replace(/https?:\/\//, '')}](${url})`;
        finalizePasteActionWithUrl(simpleLink, url, target);
    }
}

function finalizePasteAction(text, target) {
    if (target.type === 'modal') {
        // In Modal einfügen
        insertIntoTextarea(target.element, text);
    } else if (target.type === 'column') {
        // Neue Karte in Spalte erstellen
        createNewCardWithContent(target.columnId, text);
    } else if (target.type === 'card') {
        // Text zu bestehender Karte hinzufügen
        appendToCard(target.cardId, target.columnId, text);
    }
}

function finalizePasteActionWithUrl(text, url, target) {
    if (target.type === 'modal') {
        // In Modal einfügen
        insertIntoTextarea(target.element, text);
        
        // URL im Modal-Formular setzen falls verfügbar
        const urlField = document.getElementById('card-url');
        if (urlField && url) {
            urlField.value = url;
            console.log('🔗 URL saved to modal field:', url);
        }
    } else if (target.type === 'column') {
        // Neue Karte in Spalte erstellen mit URL
        createNewCardWithContentAndUrl(target.columnId, text, url);
    } else if (target.type === 'card') {
        // Text zu bestehender Karte hinzufügen mit URL
        appendToCardWithUrl(target.cardId, target.columnId, text, url);
    }
}

// Notification-System
function showPasteNotification(message, duration = 3000) {
    // Entferne existierende Notifications
    const existing = document.querySelector('.paste-notification');
    if (existing) existing.remove();
    
    // Erstelle neue Notification
    const notification = document.createElement('div');
    notification.className = 'paste-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2196F3;
        color: white;
        padding: 12px 24px;
        border-radius: 6px;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease;
        max-width: 400px;
        word-wrap: break-word;
    `;
    
    document.body.appendChild(notification);
    
    // Auto-Hide
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, duration);
}

// Event Listener für Spalten-Auswahl
function selectColumnForPaste(columnId) {
    console.log('🎯 selectColumnForPaste called with:', columnId);
    console.log('🔍 Previous selectedColumnForPaste:', selectedColumnForPaste);
    
    selectedColumnForPaste = columnId;
    
    // WICHTIG: Alle Karten deselektieren wenn Spalte ausgewählt wird
    if (typeof selectedCardData !== 'undefined' && selectedCardData !== null) {
        console.log('🔄 Deselecting card:', selectedCardData);
        selectedCardData = null;
        
        // Visuelle Deselektierung aller Karten
        document.querySelectorAll('.kanban-card').forEach(card => {
            card.classList.remove('selected');
        });
    }
    
    // Debugging-Ausgabe
    console.log('🎯 Column selected for paste:', columnId);
    console.log('🔍 Current board columns:', currentBoard?.columns?.map(c => ({ id: c.id, title: c.title })));
    
    // Visuelle Hervorhebung der ausgewählten Spalte
    document.querySelectorAll('.kanban-column').forEach(col => {
        col.classList.remove('selected-for-paste');
    });
    
    const columnElement = document.querySelector(`[data-column-id="${columnId}"]`);
    if (columnElement) {
        columnElement.classList.add('selected-for-paste');
        console.log('✅ Column visual selection applied to:', columnElement);
    } else {
        console.warn('❌ Column element not found for ID:', columnId);
        console.log('🔍 Available column elements:', 
            Array.from(document.querySelectorAll('.kanban-column')).map(el => el.dataset.columnId));
    }
}

// Initialisierung der Paste-Funktionalität
function initPasteFunctionality() {
    // Globaler Paste Event Listener
    document.addEventListener('paste', handlePaste);
    
    // Spalten-Klick für Auswahl (nur für Spalten-Header)
    document.addEventListener('click', function(event) {
        // Ignoriere Klicks auf Menu-Dots und andere Buttons
        if (event.target.closest('.menu-dots') || 
            event.target.closest('button') || 
            event.target.closest('.dropdown-menu') ||
            event.target.closest('.column-actions') ||
            event.target.closest('.kanban-card')) { // Wichtig: Klicks auf Karten ignorieren
            return; // Lass diese Events normal durch
        }
        
        // Nur auf Spalten-Header und leere Spalten-Bereiche reagieren
        const columnHeader = event.target.closest('.column-header');
        const columnTitle = event.target.closest('.column-title');
        
        let columnElement = null;
        let columnId = null;
        
        if (columnHeader) {
            columnElement = columnHeader.closest('.kanban-column');
        } else if (columnTitle) {
            columnElement = columnTitle.closest('.kanban-column');
        } else {
            // Prüfe ob Klick in leerem Bereich einer Spalte (column-content ohne Karte)
            const columnContent = event.target.closest('.column-content');
            if (columnContent && !event.target.closest('.kanban-card')) {
                columnElement = columnContent.closest('.kanban-column');
            }
        }
        
        if (columnElement) {
            columnId = columnElement.dataset.columnId;
            if (columnId) {
                console.log('🎯 Column header clicked for paste selection:', columnId);
                event.preventDefault(); // Verhindere andere Event-Handler
                event.stopPropagation();
                selectColumnForPaste(columnId);
            }
        }
    }, true); // useCapture = true für höhere Priorität
      // Keyboard Shortcut für Smart Paste Modal (Ctrl+Shift+V)
    document.addEventListener('keydown', function(event) {
        // Ctrl+Shift+V für Smart Paste Modal
        if (event.ctrlKey && event.shiftKey && event.key === 'V') {
            event.preventDefault();
            event.stopPropagation();
            
            // Prüfe ob eine Spalte ausgewählt ist
            if (selectedColumnForPaste) {
                console.log('⌨️ Smart Paste Modal opened via shortcut for column:', selectedColumnForPaste);
                openSmartPasteModal();
            } else {
                // Zeige Hinweis, dass erst eine Spalte ausgewählt werden muss
                showPasteNotification('💡 Bitte wählen Sie zuerst eine Spalte aus (Klick auf Spalten-Header)', 4000);
                console.log('⌨️ Smart Paste shortcut triggered but no column selected');
            }
        }
    });
    
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
            }
            
            .kanban-column.selected-for-paste {
                box-shadow: 0 0 0 3px #2196F3 !important;
                border-radius: 8px !important;
                transition: box-shadow 0.2s ease !important;
                position: relative !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    console.log('✅ Paste functionality initialized with enhanced column selection and keyboard shortcuts');
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

function extractDomainFromUrl(url) {
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
}

// URL-Typ Erkennung
function isImageUrl(url) {
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg|ico)(\?.*)?$/i;
    return imageExtensions.test(url);
}

function getImageExtensionFromUrl(url) {
    const match = url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg|ico)(\?.*)?$/i);
    return match ? match[1].toLowerCase() : null;
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

// Smart Paste Modal Funktionalität
function openSmartPasteModal() {
    document.getElementById('smart-paste-modal').classList.add('show');
    
    // Zeige die aktuell ausgewählte Spalte an
    showSelectedColumnInModal();
    
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

function showSelectedColumnInModal() {
    // Zeige Information über die ausgewählte Spalte
    let selectedInfo = '';
    
    if (selectedColumnForPaste) {
        // Finde die Spalte im aktuellen Board
        const column = currentBoard && currentBoard.columns ? 
            currentBoard.columns.find(c => c.id === selectedColumnForPaste) : null;
        
        if (column) {
            selectedInfo = `🎯 Ziel-Spalte: "${column.title}"`;
        } else {
            selectedInfo = `🎯 Ziel-Spalte: ${selectedColumnForPaste} (nicht gefunden)`;
        }
    } else {
        selectedInfo = '💡 Keine Spalte ausgewählt - bitte zuerst eine Spalte anklicken';
    }
    
    // Zeige die Information in einer Notification oder im Modal
    console.log('Smart Paste Modal opened:', selectedInfo);
    
    // Optional: Zeige die Info als temporäre Notification
    showPasteNotification(selectedInfo, 3000);
    
    // Zeige auch Shortcut-Hinweis beim ersten Öffnen
    const modalHeader = document.querySelector('#smart-paste-modal .modal-header h2');
    if (modalHeader && selectedColumnForPaste) {
        const shortcutHint = modalHeader.querySelector('.shortcut-hint');
        if (!shortcutHint) {
            const hint = document.createElement('small');
            hint.className = 'shortcut-hint';
            hint.style.cssText = 'display: block; font-weight: normal; color: #666; font-size: 0.8em; margin-top: 5px;';
            hint.textContent = '💡 Tipp: Verwenden Sie Ctrl+Shift+V um dieses Modal schnell zu öffnen';
            modalHeader.appendChild(hint);
        }
    }
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
    
    // Bild-URL spezielle Behandlung
    if (isImageUrl(url)) {
        const imageMarkdown = `![Bild](${url})`;
        smartPasteProcessedContent = imageMarkdown;
        showSmartPastePreview(imageMarkdown, 'image-url');
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
        case 'image-url':
            typeIndicator = '<div style="color: #28a745; font-weight: bold; margin-bottom: 10px;">🖼️ Bild-URL erkannt</div>';
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
    
    // Extrahiere URLs aus dem verarbeiteten Content
    const urlRegex = /(https?:\/\/[^\s\)]+)/g;
    const urls = smartPasteProcessedContent.match(urlRegex);
    const extractedUrl = urls && urls.length > 0 ? urls[0] : null;
    
    console.log('🔗 Extracted URL from smart paste content:', extractedUrl);
    
    // Bestimme das Ziel wie bei normalem Paste
    const target = determineCurrentPasteTarget();
    
    if (!target) {
        // Fallback: Verwende die zuletzt ausgewählte Spalte
        if (selectedColumnForPaste) {
            console.log('🎯 Using selected column for smart paste:', selectedColumnForPaste);
            if (extractedUrl) {
                finalizePasteActionWithUrl(smartPasteProcessedContent, extractedUrl, { type: 'column', columnId: selectedColumnForPaste });
            } else {
                finalizePasteAction(smartPasteProcessedContent, { type: 'column', columnId: selectedColumnForPaste });
            }
            closeModal('smart-paste-modal');
            return;
        } else {
            showPasteNotification('💡 Bitte wählen Sie erst eine Spalte aus!', 4000);
            return;
        }
    }
    
    // Verwende das bestimmte Ziel
    console.log('🎯 Smart paste target determined:', target);
    if (extractedUrl) {
        finalizePasteActionWithUrl(smartPasteProcessedContent, extractedUrl, target);
    } else {
        finalizePasteAction(smartPasteProcessedContent, target);
    }
    closeModal('smart-paste-modal');
}

function renderMarkdownToHtml(markdown) {
    // Einfache Markdown zu HTML Konvertierung für Preview
    let html = markdown
        // Überschriften
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Fett
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/__(.*?)__/gim, '<strong>$1</strong>')
        // Kursiv
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/_(.*?)_/gim, '<em>$1</em>')
        // Links
        .replace(/\[([^\]]+)\]\(([^\)]+)\)/gim, '<a href="$2" target="_blank">$1</a>')
        // Bilder
        .replace(/!\[([^\]]*)\]\(([^\)]+)\)/gim, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;">')
        // Zeilenumbrüche
        .replace(/\n\n/gim, '</p><p>')
        .replace(/\n/gim, '<br>');
    
    // In Paragraphen wrappen
    html = '<p>' + html + '</p>';
    
    return html;
}

// Hilfsfunktionen für URL-Verarbeitung
function isYouTubeUrl(url) {
    return /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i.test(url);
}

function getYouTubeVideoId(url) {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    return match ? match[1] : null;
}

function convertToYouTubeEmbed(url) {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>` : url;
}