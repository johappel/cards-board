// QuillJS Plugin für direktes WYSIWYG-Bearbeiten von Card-Content
// MANUAL ACTIVATION VERSION - Editor wird nur auf Benutzeranfrage aktiviert

let quillEditors = new Map(); // Speichert aktive Quill-Instanzen
let isQuillEnabled = false;
let quillLibrariesLoaded = false;

// Auto-Save Konflikt-Handler
let originalAutoSaveHandler = null;
let originalUpdateFullCardModal = null;

// Plugin Einstellungen
const QUILL_SETTINGS = {
    enabled: false, // Standard deaktiviert
    autoSave: false, // Deaktiviert - Speichern nur bei Save-Button-Klick
    autoSaveDelay: 800,
    markdownSupport: true,
    manualActivation: true // Neue Einstellung für manuelle Aktivierung
};


// Quill Editor Konfiguration
const QUILL_CONFIG = {
    theme: 'snow',
    modules: {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['blockquote', 'code-block'],
            ['link', 'image', 'video', 'iframe'], // Iframe-Unterstützung
            ['clean']
        ]
    },
    // placeholder: 'Card-Inhalt bearbeiten...',
    // bounds: document.body,
    // scrollingContainer: null,
    formats: [
        'header', 'bold', 'italic', 'underline', 'strike', 'indent',
        'align', 'script', 'size', 'font', 'color', 'background',
        'list', 'blockquote', 'code-block', 'link', 'image', 'video',
        'iframe' // Iframe-Unterstützung -> IframeBlot
        
    ]
};

// Lade Quill.js Bibliotheken dynamisch
async function loadQuillLibraries() {
    if (quillLibrariesLoaded) return true;
    
    try {
        console.log('📚 Loading Quill.js libraries...');
        
        // CSS laden
        const quillCSS = document.createElement('link');
        quillCSS.rel = 'stylesheet';
        quillCSS.href = 'https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css';
        document.head.appendChild(quillCSS);
        
        // Quill.js Script laden
        await loadScript('https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js');
        
        // Quill Markdown Plugin laden
        await loadScript('https://cdn.jsdelivr.net/npm/quilljs-markdown@latest/dist/quilljs-markdown.js');
        
        // Quill Markdown CSS laden
        const markdownCSS = document.createElement('link');
        markdownCSS.rel = 'stylesheet';
        markdownCSS.href = 'https://cdn.jsdelivr.net/npm/quilljs-markdown@latest/dist/quilljs-markdown-common.css';
        document.head.appendChild(markdownCSS);
        
        // TurndownService für HTML->Markdown Konvertierung
        await loadScript('https://cdn.jsdelivr.net/npm/turndown@7.1.1/dist/turndown.js');
        
        quillLibrariesLoaded = true;
        console.log('✅ Quill.js libraries loaded successfully');

        return true;
    } catch (error) {
        console.error('❌ Error loading Quill.js libraries:', error);
        return false;
    }
}

// Hilfsfunktion zum Laden von Scripts
function loadScript(src) {
    return new Promise((resolve, reject) => {
        // Prüfen ob Script bereits geladen ist
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Funktionen überschreiben um Konflikte zu vermeiden
function interceptConflictingFunctions() {
    setTimeout(() => {
        // Auto-Save Handler abfangen
        if (typeof window.autoSaveCardHandler === 'function' && !originalAutoSaveHandler) {
            originalAutoSaveHandler = window.autoSaveCardHandler;
            
            window.autoSaveCardHandler = function(e) {
                if (quillEditors.size > 0) {
                    console.log('🚫 Auto-save blocked - Quill editor is active');
                    return;
                }
                return originalAutoSaveHandler.call(this, e);
            };
            console.log('✅ Intercepted autoSaveCardHandler');
        }
        
        // updateFullCardModal abfangen
        if (typeof window.updateFullCardModal === 'function' && !originalUpdateFullCardModal) {
            originalUpdateFullCardModal = window.updateFullCardModal;
            
            window.updateFullCardModal = function(cardId) {
                if (quillEditors.has(cardId)) {
                    console.log('🚫 updateFullCardModal blocked - Quill editor active for card:', cardId);
                    return;
                }
                return originalUpdateFullCardModal.call(this, cardId);
            };
            console.log('✅ Intercepted updateFullCardModal');
        }
    }, 500);
}

// Original-Funktionen wiederherstellen
function restoreOriginalFunctions() {
    if (originalAutoSaveHandler) {
        window.autoSaveCardHandler = originalAutoSaveHandler;
        originalAutoSaveHandler = null;
        console.log('✅ Restored original autoSaveCardHandler');
    }
    
    if (originalUpdateFullCardModal) {
        window.updateFullCardModal = originalUpdateFullCardModal;
        originalUpdateFullCardModal = null;
        console.log('✅ Restored original updateFullCardModal');
    }
}

// Plugin-Einstellungen laden
function loadQuillSettings() {
    const settings = localStorage.getItem('quill-editor-settings');
    if (settings) {
        try {
            Object.assign(QUILL_SETTINGS, JSON.parse(settings));
        } catch (e) {
            console.warn('⚠️ Could not parse Quill settings:', e);
        }
    }
    isQuillEnabled = QUILL_SETTINGS.enabled;
    
    console.log('📚 Quill settings loaded:', QUILL_SETTINGS);
    
    // Konflikt-Funktionen abfangen
    interceptConflictingFunctions();
}

// Plugin-Einstellungen speichern
function saveQuillSettings() {
    localStorage.setItem('quill-editor-settings', JSON.stringify(QUILL_SETTINGS));
}

// Quill Editor für ein acrd-content-full Element aktivieren
async function enableQuillEditor(cardContentElement, cardId, columnId) {
    console.log('🔄 Enabling Quill editor for card:', cardId, 'in column:', columnId);
    if (!isQuillEnabled || !cardContentElement) return false;
    
    console.log('🚀 Enabling Quill editor for card:', cardId);
    
    // Prüfen ob bereits ein Editor aktiv ist
    if (quillEditors.has(cardId)) {
        console.log('🔄 Quill editor already active for card:', cardId);
        return quillEditors.get(cardId).quill;
    }
    
    // Bibliotheken laden falls nötig
    if (!await loadQuillLibraries()) {
        console.error('❌ Could not load Quill libraries');
        return false;
    }
    
    try {
        // Karten-Daten aus der Datenstruktur holen
        let cardData = null;
        let originalMarkdownContent = '';
        
        // data-Attribute verwenden falls vorhanden
        const dataCardId = cardContentElement.getAttribute('data-card-id');
        const dataColumnId = cardContentElement.getAttribute('data-column-id');
        
        if (dataCardId && dataColumnId) {
            cardData = getCardData(dataCardId, dataColumnId);
            console.log('✅ Found card via data attributes:', dataCardId, dataColumnId);
        } else {
            cardData = getCardData(cardId, columnId);
            console.log('✅ Using provided card/column IDs:', cardId, columnId);
        }
          originalMarkdownContent = cardData ? cardData.content || '' : '';
        
        console.log('📖 Original Markdown Content:', originalMarkdownContent);
        console.log('🔍 Original Markdown Length:', originalMarkdownContent.length);
        
        // Editor-Container bestimmen
        let editorContainer = cardContentElement.querySelector('.markdown-content');
        if (!editorContainer) {
            editorContainer = cardContentElement;
        }
        
        console.log('🎯 Editor container:', editorContainer);
        console.log('🔍 Current container HTML:', editorContainer.innerHTML.substring(0, 200) + '...');
        
        // Element für Quill vorbereiten
        const editorId = `quill-editor-${cardId || dataCardId || Date.now()}`;
        editorContainer.id = editorId;
        
        // Originale data-Attribute sicherstellen
        const finalCardId = dataCardId || cardId;
        const finalColumnId = dataColumnId || columnId;
        
        if (finalCardId) editorContainer.setAttribute('data-card-id', finalCardId);
        if (finalColumnId) editorContainer.setAttribute('data-column-id', finalColumnId);
        
        console.log('🏷️ Set data attributes on editor:', finalCardId, finalColumnId);
        
        // Aktuellen Inhalt für Quill vorbereiten
        let htmlContent = '';
        if (originalMarkdownContent) {
            console.log('🔄 Converting markdown to HTML...');
            if (window.renderMarkdownToHtml) {
                const fullHtml = window.renderMarkdownToHtml(originalMarkdownContent);
                console.log('🔍 Full HTML from renderMarkdownToHtml:', fullHtml);
                
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = fullHtml;
                const markdownContentDiv = tempDiv.querySelector('.markdown-content');
                htmlContent = markdownContentDiv ? markdownContentDiv.innerHTML : fullHtml;
                console.log('🔍 Extracted HTML content:', htmlContent);
            } else {
                console.log('⚠️ Using fallback markdown conversion');
                htmlContent = markdownToHtmlFallback(originalMarkdownContent);
            }
        } else {
            console.log('⚠️ No original markdown content found');
            // Fallback: Verwende den aktuellen HTML-Inhalt des Containers
            htmlContent = editorContainer.innerHTML;
            console.log('🔄 Using current container HTML as fallback:', htmlContent);
        }
        editorContainer.innerHTML = htmlContent;

        console.log('🔧 Prepared HTML for editor:', htmlContent.substring(0, 200) + '...');
          // Quill Editor erstellen
        console.log('-> content for Quill editor:', editorContainer.innerHTML);
        
        const BlockEmbed = Quill.import('blots/block/embed');

        class IframeBlot extends BlockEmbed {
            static create(value) {
            const node = super.create();
            node.setAttribute('src', value);
            node.setAttribute('frameborder', '0');
            node.setAttribute('allowfullscreen', true);
            node.setAttribute('class', 'ql-iframe');
            return node;
            }

            static value(node) {
            return node.getAttribute('src');
            }
        }
        IframeBlot.blotName = 'iframe';
        IframeBlot.tagName = 'IFRAME';

        Quill.register('formats/iframe', IframeBlot);

        
        const quill = new Quill(`#${editorId}`, QUILL_CONFIG);
        const quillMarkdown = new QuillMarkdown(quill, {});

        console.log('-> content after Quill editor loaded:', editorContainer.innerHTML);

        // HTML-Content in den Editor laden
        if (htmlContent) {
            console.log('📥 Loading HTML content into Quill editor...');
            // HTML-Inhalt wird hier beim Laden in den Quill Editor zerstört
            // quill.root.innerHTML = htmlContent;
            console.log('✅ Content loaded into editor');
        }
          // Button zu "Speichern" umschalten (statt verstecken)
        const cardContentFull = cardContentElement.closest('.card-content-full');
        if (cardContentFull) {
            cardContentFull.classList.add('quill-editing');
            
            // Button zu "Speichern" ändern
            updateEditButton(finalCardId, true);
        }
        
        // Styling-Optimierungen für besseren Zeilenumbruch
        setTimeout(() => {
            const qlEditor = quill.root;
            qlEditor.style.whiteSpace = 'pre-wrap'; // Zeilenumbruch aktivieren
        }, 100);
        
        // Markdown Plugin aktivieren
        if (QUILL_SETTINGS.markdownSupport && window.QuillMarkdown) {
            new QuillMarkdown(quill);
        }
        
        
        // Turndown Service für HTML->Markdown Konvertierung
        const turndownService = new TurndownService({
            headingStyle: 'atx',
            bulletListMarker: '-',
            codeBlockStyle: 'fenced',
            emDelimiter: '*',
            strongDelimiter: '**',
            br: ''
        });
        turndownService.addRule('keep-iframes', {
            filter: ['iframe'],
            replacement: function (content, node) {
                // Füge Zeilenumbrüche für besseren Abstand im Markdown hinzu
                return '\n\n' + node.outerHTML + '\n\n';
            }
        });    
        // Auto-Save Setup - DEAKTIVIERT für manuelle Speicherung
        // let saveTimeout = null;
        // quill.on('text-change', function(delta, oldDelta, source) {
        //     if (source === 'user' && QUILL_SETTINGS.autoSave) {
        //         if (saveTimeout) clearTimeout(saveTimeout);
        //         saveTimeout = setTimeout(() => {
        //             saveQuillContent(quill, finalCardId, finalColumnId, turndownService);
        //         }, QUILL_SETTINGS.autoSaveDelay);
        //     }
        // });
        
        console.log('ℹ️ Auto-save deaktiviert - Speichern nur bei Save-Button-Klick');
        
        // Editor in Map speichern
        quillEditors.set(finalCardId, {
            quill,
            turndownService,
            element: editorContainer,
            cardId: finalCardId,
            columnId: finalColumnId,
            originalContent: originalMarkdownContent,
            cardData: cardData
        });
        
        console.log('✅ Quill editor activated for card:', finalCardId);
        return quill;
        
    } catch (error) {
        console.error('❌ Error creating Quill editor:', error);
        return false;
    }
}

// Karten-Daten aus der Datenstruktur holen
function getCardData(cardId, columnId) {
    console.log('🔍 getCardData called with:', { cardId, columnId });
    
    if (!cardId || !columnId) {
        console.warn('⚠️ Missing cardId or columnId:', { cardId, columnId });
        return null;
    }
    
    // Zugriff auf die globale Datenstruktur - verschiedene Fallbacks
    let boardData = null;
    
    if (typeof window.currentBoard !== 'undefined' && window.currentBoard) {
        boardData = window.currentBoard;
        console.log('✅ Using window.currentBoard');
    } else if (typeof window.kanbanData !== 'undefined' && window.kanbanData) {
        boardData = window.kanbanData;
        console.log('✅ Using window.kanbanData');
    } else {
        console.error('❌ No board data found in window.currentBoard or window.kanbanData');
        return null;
    }
    
    if (!boardData.columns) {
        console.error('❌ Board data has no columns property');
        return null;
    }
    
    const column = boardData.columns.find(col => col.id === columnId);
    if (!column) {
        console.error('❌ Column not found:', columnId);
        console.log('Available columns:', boardData.columns.map(c => c.id));
        return null;
    }
    
    const card = column.cards.find(c => c.id === cardId);
    if (!card) {
        console.error('❌ Card not found:', cardId, 'in column:', columnId);
        console.log('Available cards in column:', column.cards.map(c => c.id));
        return null;
    }
    
    console.log('✅ Found card data:', card);
    return card;
}

// Quill Content speichern
function saveQuillContent(quill, cardId, columnId, turndownService) {
    try {
        console.log('💾 Saving Quill content for card:', cardId);
        
        // HTML aus Quill holen
        const rawHtml = quill.root.innerHTML;
        
        // HTML bereinigen bevor es zu Markdown konvertiert wird
        const cleanedHtml = cleanHtmlForMarkdown(rawHtml);
        console.log('🔍 Cleaned HTML content:', cleanedHtml.substring(0, 400) + '...');
        
        // HTML zu Markdown konvertieren
        const markdownContent = turndownService.turndown(cleanedHtml);
        console.log('🔄 Converted HTML to markdown:', markdownContent.substring(0, 400) + '...');
        
        // Markdown nachbereinigen
        //const finalMarkdown = cleanupMarkdown(markdownContent);
        const finalMarkdown = turndownService.turndown(rawHtml);
        
        console.log('📝 Converted to markdown:', finalMarkdown.substring(0, 400) + '...');

        
        // In der Datenstruktur speichern
        const cardData = getCardData(cardId, columnId);
        if (cardData) {
            cardData.content = finalMarkdown;
            
            // Speichern - verschiedene Methoden versuchen
            if (typeof window.saveAllBoards === 'function') {
                window.saveAllBoards();
                console.log('✅ Content saved via saveAllBoards()');
            } else if (typeof window.currentBoard !== 'undefined') {
                // Direkt in localStorage speichern
                const allBoards = JSON.parse(localStorage.getItem('kanbanBoards') || '[]');
                const boardIndex = allBoards.findIndex(b => b.id === window.currentBoard.id);
                if (boardIndex !== -1) {
                    allBoards[boardIndex] = window.currentBoard;
                    localStorage.setItem('kanbanBoards', JSON.stringify(allBoards));
                    console.log('✅ Content saved to localStorage directly');
                }
            } else {
                console.warn('⚠️ Could not save - no save method available');
            }
            
            // UI aktualisieren falls Modal offen ist
            if (document.querySelector('.card-modal')) {
                updateCardModalContent(cardId, finalMarkdown);
            }
        } else {
            console.error('❌ Could not find card data to save');
        }
        
    } catch (error) {
        console.error('❌ Error saving Quill content:', error);
    }
}

// HTML für Markdown-Konvertierung bereinigen
function cleanHtmlForMarkdown(html) {
    let cleaned = html;
    
    // Quill-spezifische Klassen entfernen
    cleaned = cleaned.replace(/\s*class="[^"]*"/g, '');
    
    // Leere Paragraphen entfernen
    cleaned = cleaned.replace(/<p><br><\/p>/g, '');
    cleaned = cleaned.replace(/<p>\s*<\/p>/g, '');
    
    // Doppelte Leerzeichen normalisieren
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    // HTML-Entities nur außerhalb von iframes normalisieren
    if (!cleaned.includes('<iframe')) {
        cleaned = cleaned.replace(/&nbsp;/g, ' ');
        cleaned = cleaned.replace(/&amp;/g, '&');
        cleaned = cleaned.replace(/&lt;/g, '<');
        cleaned = cleaned.replace(/&gt;/g, '>');
        cleaned = cleaned.replace(/&quot;/g, '"');
    }
    
    return cleaned.trim();
}

// Markdown nachbereinigen
function cleanupMarkdown(markdown) {
    let cleaned = markdown;
    
    // Mehrfache Leerzeilen reduzieren
    cleaned = cleaned.replace(/\n\n\n+/g, '\n\n');
    
    // Leerzeichen am Zeilenende entfernen
    cleaned = cleaned.replace(/[ \t]+$/gm, '');
    
    // Leerzeichen am Anfang und Ende entfernen
    cleaned = cleaned.trim();
    
    return cleaned;
}

// Modal-Content aktualisieren
function updateCardModalContent(cardId, markdownContent) {
    const modal = document.querySelector('.card-modal');
    if (!modal) return;
    
    const cardContentElement = modal.querySelector('.card-content-full');
    if (!cardContentElement) return;
    
    // Prüfen ob das der richtige Card-Content ist
    const modalCardId = cardContentElement.getAttribute('data-card-id');
    if (modalCardId !== cardId) return;
    
    // Markdown zu HTML rendern
    if (window.renderMarkdownToHtml) {
        cardContentElement.innerHTML = window.renderMarkdownToHtml(markdownContent);
    } else {
        cardContentElement.innerHTML = markdownToHtmlFallback(markdownContent);
    }
}

// Fallback für Markdown zu HTML Konvertierung
function markdownToHtmlFallback(markdown) {
    if (!markdown) return '';
    
    let html = markdown;
    
    // Einfache Markdown-Konvertierung
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    html = html.replace(/\n/g, '<br>');
    
    // iframes und HTML-Elemente beibehalten
    return html;
}

// Hilfsfunktion: Full-Card-Modal nach Editor-Änderungen aktualisieren
function updateFullCardModalAfterEdit(cardId, columnId) {
    const modal = document.getElementById('full-card-modal');
    if (!modal || !modal.style.display || modal.style.display === 'none') {
        return; // Modal ist nicht offen
    }
    
    console.log('🔄 Updating Full-Card-Modal after edit...');
    
    try {
        // Aktuelle Karten-Daten holen
        const cardData = getCardData(cardId, columnId);
        if (!cardData) {
            console.warn('⚠️ Could not update modal - card data not found');
            return;
        }
        
        // card-content-full Element im Modal finden
        const cardContentFull = modal.querySelector('.card-content-full');
        if (!cardContentFull) {
            console.warn('⚠️ Could not find card-content-full in modal');
            return;
        }
        
        // Content mit aktuellem Markdown neu rendern
        let newContent = '';
        if (window.renderMarkdownToHtml && cardData.content) {
            newContent = window.renderMarkdownToHtml(cardData.content);
        } else if (cardData.content) {
            newContent = `<div class="markdown-content">${cardData.content.replace(/\n/g, '<br>')}</div>`;
        } else {
            newContent = '<div class="markdown-content">Kein Inhalt</div>';
        }
        
        // Content ersetzen
        cardContentFull.innerHTML = newContent;
        
        // Data-Attribute sicherstellen
        cardContentFull.setAttribute('data-card-id', cardId);
        cardContentFull.setAttribute('data-column-id', columnId);
        
        // Edit-Button wieder hinzufügen wenn Plugin aktiviert
        if (isQuillEnabled) {
            addEditButtonToCard(cardContentFull);
        }
        
        console.log('✅ Full-Card-Modal updated successfully');
        
    } catch (error) {
        console.error('❌ Error updating Full-Card-Modal:', error);
    }
}

// Quill Editor deaktivieren
function disableQuillEditor(cardId, shouldSave = true) {
    const editorData = quillEditors.get(cardId);
    if (!editorData) {
        console.log('⚠️ No active Quill editor found for card:', cardId);
        return false;
    }
    
    console.log('🔄 Disabling Quill editor for card:', cardId, shouldSave ? '(mit Speichern)' : '(ohne Speichern)');
    
    try {
        // Nur speichern wenn explizit gewünscht (Save-Button, nicht ESC)
        if (shouldSave && editorData.quill && editorData.turndownService) {
            saveQuillContent(editorData.quill, cardId, editorData.columnId, editorData.turndownService);
        }
        
        // MutationObserver bereinigen
        if (editorData.iframeObserver) {
            editorData.iframeObserver.disconnect();
            console.log('✅ MutationObserver disconnected');
        }        // Quill-Editor komplett zerstören und Struktur wiederherstellen
        if (editorData.quill) {
            console.log('🔥 Destroying Quill editor instance...');
            
            // 1. Letzten Content speichern bevor wir den Editor zerstören
            saveQuillContent(editorData.quill, cardId, editorData.columnId, editorData.turndownService);
            
            // 2. Toolbar entfernen
            const toolbarElement = document.querySelector('.ql-toolbar');
            if (toolbarElement) {
                toolbarElement.remove();
                console.log('✅ Toolbar removed');
            }
            
            // 3. Alle Quill-CSS-Klassen entfernen
            editorData.element.classList.remove('ql-editor', 'ql-container', 'ql-snow');
            
            // 4. Alle Quill-spezifischen Styles entfernen
            editorData.element.removeAttribute('style');
            editorData.element.removeAttribute('contenteditable');
            editorData.element.removeAttribute('data-gramm');
            editorData.element.removeAttribute('data-gramm_editor');
            editorData.element.removeAttribute('data-enable-grammarly');
            
            // 5. Originale Struktur komplett wiederherstellen
            const currentCardData = getCardData(cardId, editorData.columnId);
            if (currentCardData) {
                console.log('📝 Restoring original markdown structure...');
                
                // Neue markdown-content Struktur erstellen
                let newContent = '';
                if (window.renderMarkdownToHtml) {
                    newContent = window.renderMarkdownToHtml(currentCardData.content || '');
                } else {
                    // Fallback: Content in markdown-content div wrappen
                    newContent = `<div class="markdown-content">${(currentCardData.content || '').replace(/\n/g, '<br>')}</div>`;
                }
                
                // Element komplett ersetzen
                editorData.element.innerHTML = newContent;
                
                // Sicherstellen, dass data-Attribute erhalten bleiben
                editorData.element.setAttribute('data-card-id', cardId);
                editorData.element.setAttribute('data-column-id', editorData.columnId);
                
                console.log('✅ Original structure restored with data attributes');
                console.log('🔍 Restored content preview:', newContent.substring(0, 100) + '...');
            } else {
                console.error('❌ Could not restore content - card data not found');
                // Fallback: Mindestens eine leere Struktur erstellen
                editorData.element.innerHTML = '<div class="markdown-content">Content could not be restored</div>';
            }
            
            // 6. Editor-ID entfernen
            editorData.element.removeAttribute('id');
            
            // 7. Quill-Instanz nullen
            delete editorData.quill;        }
          // CSS-Klassen entfernen und UI zurücksetzen
        const cardContentFull = editorData.element.closest('.card-content-full');
        if (cardContentFull) {
            cardContentFull.classList.remove('quill-editing');
        }
        
        // Button zurück zu "Bearbeiten" ändern
        updateEditButton(cardId, false);
        
        // Aus Map entfernen
        quillEditors.delete(cardId);
        
        // Board UI aktualisieren falls verfügbar
        if (typeof window.renderColumns === 'function') {
            console.log('🔄 Updating board UI...');
            // Kleine Verzögerung damit die DOM-Änderungen vollständig sind
            setTimeout(() => {
                window.renderColumns();
                console.log('✅ Board UI updated');
            }, 150);
        }
        
        // Full-Card-Modal aktualisieren
        updateFullCardModalAfterEdit(cardId, editorData.columnId);
        
        console.log('✅ Quill editor deactivated for card:', cardId);
        return true;
        
    } catch (error) {
        console.error('❌ Error disabling Quill editor:', error);
        return false;
    }
}

// Alle aktiven Editoren deaktivieren
function disableAllQuillEditors() {
    console.log('🔄 Disabling all active Quill editors...');
    
    const activeEditors = Array.from(quillEditors.keys());
    activeEditors.forEach(cardId => {
        disableQuillEditor(cardId, false);
    });
    
    console.log('✅ All Quill editors deactivated');
}

// Plugin aktivieren/deaktivieren (bool)
function toggleQuillPluginFromUI(enabled) {
    // Wenn kein Parameter übergeben wurde, Checkbox-Status lesen
    if (typeof enabled === 'undefined') {
        const checkbox = document.getElementById('quill-enabled-toggle');
        enabled = checkbox ? checkbox.checked : false;
    }
    
    isQuillEnabled = enabled;
    QUILL_SETTINGS.enabled = enabled;
    console.log('🔄 Toggling Quill plugin:', enabled ? 'enabling' : 'disabling');
    saveQuillSettings();
    
    // UI-Status aktualisieren
    updateQuillPluginUI();
    
    if (!enabled) {
        disableAllQuillEditors();
        restoreOriginalFunctions();
    } else {
        interceptConflictingFunctions();
        // Edit-Buttons und Event-Listener hinzufügen
        setupQuillEditorActivation();
    }
    
    console.log('✅ Quill plugin', enabled ? 'enabled' : 'disabled');
}

// UI-Status für Quill Plugin aktualisieren
function updateQuillPluginUI() {
    const checkbox = document.getElementById('quill-enabled-toggle');
    const statusElement = document.getElementById('quill-status');
    
    if (checkbox) {
        checkbox.checked = isQuillEnabled;
    }
    
    if (statusElement) {
        statusElement.textContent = isQuillEnabled ? 'Aktiviert' : 'Deaktiviert';
        statusElement.style.color = isQuillEnabled ? '#059669' : '#dc2626';
    }
}

// Manuelle Aktivierung für Card-Content
function activateQuillForCard(cardElement) {
    if (!cardElement) return false;
    
    // Karten-IDs aus data-Attributen oder DOM ermitteln
    const cardId = cardElement.getAttribute('data-card-id');
    const columnId = cardElement.getAttribute('data-column-id');
    
    if (!cardId || !columnId) {
        console.error('❌ Missing card or column ID');
        return false;
    }
    
    return enableQuillEditor(cardElement, cardId, columnId);
}

// Plugin initialisieren
function initQuillPlugin() {
    console.log('🚀 Initializing Quill Plugin...');
    
    // Einstellungen laden
    loadQuillSettings();
    
    // UI-Status initial setzen
    updateQuillPluginUI();
    
    // Setup für Editor-Aktivierung wenn Plugin aktiviert ist
    if (isQuillEnabled) {
        setupQuillEditorActivation();
    }
    
    console.log('✅ Quill Plugin initialized');
}

// Setup für Editor-Aktivierung auf card-content-full Elementen
function setupQuillEditorActivation() {
    console.log('🔧 Setting up Quill editor activation...');
      // Event-Listener für Edit-Buttons (Toggle-Verhalten)
    document.addEventListener('click', function(e) {
        if (e.target.matches('.quill-edit-button') || e.target.closest('.quill-edit-button')) {
            e.preventDefault();
            e.stopPropagation();
            
            const button = e.target.matches('.quill-edit-button') ? e.target : e.target.closest('.quill-edit-button');
            const cardContent = button.closest('.card-content-full');
            const cardId = cardContent.getAttribute('data-card-id');
            
            if (cardContent) {
                // Prüfen ob Editor bereits aktiv ist
                const isEditing = quillEditors.has(cardId);
                
                if (isEditing) {
                    // Speichern und Editor schließen
                    console.log('💾 Save-Button clicked, saving and closing editor...');
                    disableQuillEditor(cardId);
                } else {
                    // Editor aktivieren
                    console.log('✏️ Edit-Button clicked, activating editor...');
                    activateQuillForCard(cardContent);
                }
            }
        }
    });
    
    // Event-Listener für Doppelklick auf markdown-content
    document.addEventListener('dblclick', function(e) {
        if (e.target.closest('.markdown-content') && e.target.closest('.card-content-full')) {
            e.preventDefault();
            const cardContent = e.target.closest('.card-content-full');
            console.log('🎯 Double-click detected, activating editor...');
            activateQuillForCard(cardContent);
        }
    });
      // ESC-Taste zum Abbrechen (ohne Speichern)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && quillEditors.size > 0) {
            console.log('🔚 ESC pressed, cancelling all editors without saving...');
            // Alle aktiven Editoren ohne Speichern schließen
            const activeEditorIds = Array.from(quillEditors.keys());
            activeEditorIds.forEach(cardId => {
                disableQuillEditor(cardId, false); // false = nicht speichern
            });
        }
    });
    
    // MutationObserver für neu hinzugefügte card-content-full Elemente
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Prüfe direkt auf card-content-full
                    if (node.classList && node.classList.contains('card-content-full')) {
                        addEditButtonToCard(node);
                    }
                    // Prüfe auf Kinder mit card-content-full
                    const cardContents = node.querySelectorAll ? node.querySelectorAll('.card-content-full') : [];
                    cardContents.forEach(cardContent => {
                        addEditButtonToCard(cardContent);
                    });
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Edit-Buttons zu bestehenden card-content-full Elementen hinzufügen
    addEditButtonsToExistingCards();
}

// Edit-Buttons zu bestehenden card-content-full Elementen hinzufügen
function addEditButtonsToExistingCards() {
    const cardContents = document.querySelectorAll('.card-content-full');
    cardContents.forEach(cardContent => {
        addEditButtonToCard(cardContent);
    });
    console.log(`✅ Added edit buttons to ${cardContents.length} existing cards`);
}

// Edit-Button zu einem card-content-full Element hinzufügen
function addEditButtonToCard(cardContentElement) {
    // Prüfen ob bereits ein Edit-Button vorhanden ist
    if (cardContentElement.querySelector('.quill-edit-button')) {
        return; // Button bereits vorhanden
    }
    
    const cardId = cardContentElement.getAttribute('data-card-id');
    const columnId = cardContentElement.getAttribute('data-column-id');
    
    if (!cardId || !columnId) {
        console.warn('⚠️ Missing data attributes for edit button:', cardContentElement);
        return;
    }
      // Button-Container oberhalb des Contents erstellen
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'quill-button-container';
    
    // Edit-Button erstellen
    const editButton = document.createElement('button');
    editButton.className = 'quill-edit-button';
    editButton.innerHTML = '✏️';
    editButton.title = 'Text mit WYSIWYG-Editor bearbeiten (oder Doppelklick)';
    
    
    buttonContainer.appendChild(editButton);
    
    // Button-Container vor dem ersten Kind einfügen
    cardContentElement.insertBefore(buttonContainer, cardContentElement.firstChild);
}

// Edit-Button zwischen "Bearbeiten" und "Speichern" umschalten
function updateEditButton(cardId, isEditing) {
    const cardContent = document.querySelector(`.card-content-full[data-card-id="${cardId}"]`);
    if (!cardContent) return;
    
    const button = cardContent.querySelector('.card-content-full .quill-edit-button');
    if (!button) return;
    
    if (isEditing) {
        // Button zu "Speichern" ändern (grün)
        button.innerHTML = '💾';
        button.title = 'Änderungen speichern und Editor schließen';
        button.style.top = '40px';
        button.style.position = 'relative';
        button.style.right = '10px';

    } else {
        // Button zu "Bearbeiten" ändern (blau)
        button.innerHTML = '✏️';
        button.title = 'Text mit WYSIWYG-Editor bearbeiten (oder Doppelklick)';
        button.style.position = 'initial';

    }
}

// Plugin-Funktionen global verfügbar machen
window.QuillPlugin = {
    enable: () => toggleQuillPluginFromUI(true),
    disable: () => toggleQuillPluginFromUI(false),
    toggle: toggleQuillPluginFromUI,
    isEnabled: () => isQuillEnabled,
    activateForCard: activateQuillForCard,
    deactivateForCard: disableQuillEditor,
    deactivateAll: disableAllQuillEditors,
    settings: QUILL_SETTINGS,
    saveSettings: saveQuillSettings,
    updateUI: updateQuillPluginUI,
    setupActivation: setupQuillEditorActivation
};

// Für Rückwärtskompatibilität auch die direkte Funktion global verfügbar machen
window.toggleQuillPluginFromUI = toggleQuillPluginFromUI;

// Auto-Initialisierung
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuillPlugin);
} else {
    initQuillPlugin();
}

console.log('📦 Quill Plugin loaded');
