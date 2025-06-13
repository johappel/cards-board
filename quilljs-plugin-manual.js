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
    autoSave: true,
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
            ['link'],
            ['clean']
        ]
    },
    placeholder: 'Card-Inhalt bearbeiten...'
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
    // Warten bis Funktionen verfügbar sind
    setTimeout(() => {
        // Auto-Save Handler abfangen
        if (typeof window.autoSaveCardHandler === 'function' && !originalAutoSaveHandler) {
            originalAutoSaveHandler = window.autoSaveCardHandler;
            
            window.autoSaveCardHandler = function(e) {
                // Blockieren wenn Quill-Editor aktiv ist
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
                // Blockieren wenn Quill-Editor für diese Karte aktiv ist
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
        Object.assign(QUILL_SETTINGS, JSON.parse(settings));
    }
    isQuillEnabled = QUILL_SETTINGS.enabled;
    
    // Konflikt-Funktionen abfangen
    interceptConflictingFunctions();
}

// Plugin-Einstellungen speichern
function saveQuillSettings() {
    localStorage.setItem('quill-editor-settings', JSON.stringify(QUILL_SETTINGS));
}

// Quill Editor für ein card-content-full Element aktivieren
async function enableQuillEditor(cardContentElement, cardId, columnId) {
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
        // Karten-Daten aus der Datenstruktur holen - neuer Ansatz mit besserer ID-Extraktion
        let cardData = null;
        let originalMarkdownContent = '';
        
        // Methode 1: data-Attribute verwenden (falls vorhanden)
        const dataCardId = cardContentElement.getAttribute('data-card-id');
        const dataColumnId = cardContentElement.getAttribute('data-column-id');
        
        if (dataCardId && dataColumnId) {
            cardData = getCardData(dataCardId, dataColumnId);
            console.log('✅ Found card via data attributes:', dataCardId, dataColumnId);
        } else {
            // Methode 2: Parameter verwenden
            cardData = getCardData(cardId, columnId);
            console.log('✅ Using provided card/column IDs:', cardId, columnId);
        }
        
        originalMarkdownContent = cardData ? cardData.content || '' : '';
        
        console.log('📖 Original Markdown Content:', originalMarkdownContent);
        console.log('🔍 Card Data:', cardData);
        
        // WICHTIG: Mit renderMarkdownToHtml wird content in <div class="markdown-content"> gewrappt
        // Wir müssen den .markdown-content container zum Editor machen, nicht .card-content-full
        
        // Schauen ob bereits ein markdown-content container existiert
        let editorContainer = cardContentElement.querySelector('.markdown-content');
        if (!editorContainer) {
            // Falls kein markdown-content container existiert, das ganze Element verwenden
            editorContainer = cardContentElement;
        }
        
        // Element für Quill vorbereiten
        const editorId = `quill-editor-${cardId || dataCardId || Date.now()}`;
        editorContainer.id = editorId;
        
        // Originale data-Attribute auf dem Editor-Container sicherstellen
        const finalCardId = dataCardId || cardId;
        const finalColumnId = dataColumnId || columnId;
        
        if (finalCardId) editorContainer.setAttribute('data-card-id', finalCardId);
        if (finalColumnId) editorContainer.setAttribute('data-column-id', finalColumnId);
        
        console.log('🏷️ Set data attributes on editor:', finalCardId, finalColumnId);
        
        // Aktuellen Inhalt für Quill vorbereiten (nur den Textinhalt, ohne HTML-Wrapper)
        let htmlContent = '';
        if (originalMarkdownContent) {
            if (window.renderMarkdownToHtml) {
                const fullHtml = window.renderMarkdownToHtml(originalMarkdownContent);
                // Extrahiere nur den Inhalt aus dem markdown-content wrapper
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = fullHtml;
                const markdownContentDiv = tempDiv.querySelector('.markdown-content');
                htmlContent = markdownContentDiv ? markdownContentDiv.innerHTML : fullHtml;
            } else {
                htmlContent = markdownToHtmlFallback(originalMarkdownContent);
            }
        }
        
        console.log('🔧 Prepared HTML for editor:', htmlContent.substring(0, 200) + '...');          // Quill Editor erstellen (auf dem richtigen Container)
        const quill = new Quill(`#${editorId}`, QUILL_CONFIG);
        
        // CSS-Klasse für aktiven Editor setzen
        const cardContentFull = cardContentElement.closest('.card-content-full');
        if (cardContentFull) {
            cardContentFull.classList.add('quill-editing');
        }
        
        // Markdown Plugin aktivieren (falls verfügbar)
        if (QUILL_SETTINGS.markdownSupport && window.QuillMarkdown) {
            new QuillMarkdown(quill);
        }
        
        // Content in Quill setzen
        if (htmlContent) {
            quill.root.innerHTML = htmlContent;
        } else {
            console.log('⚠️ No HTML content to set in editor');
        }
        
        // Turndown Service für HTML->Markdown Konvertierung
        const turndownService = new TurndownService({
            headingStyle: 'atx',
            bulletListMarker: '-',
            codeBlockStyle: 'fenced',
            emDelimiter: '*',
            strongDelimiter: '**'
        });
        
        // Auto-Save Setup
        let saveTimeout = null;
        quill.on('text-change', function(delta, oldDelta, source) {
            if (source === 'user' && QUILL_SETTINGS.autoSave) {
                if (saveTimeout) clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    saveQuillContent(quill, finalCardId, finalColumnId, turndownService);
                }, QUILL_SETTINGS.autoSaveDelay);
            }        });
        
        // Editor in Map speichern
        quillEditors.set(finalCardId, {
            quill,
            turndownService,
            element: editorContainer, // Der tatsächliche Editor-Container
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
    console.log('🔍 window.currentBoard:', window.currentBoard);
    
    if (!window.currentBoard || !window.currentBoard.columns) {
        console.log('❌ No currentBoard or columns available');
        return null;
    }
    
    console.log('🔍 Available columns:', window.currentBoard.columns.map(c => ({ id: c.id, name: c.name || c.title, cardCount: c.cards?.length || 0 })));
    
    // Zuerst in der angegebenen Spalte suchen
    let column = window.currentBoard.columns.find(c => c.id === columnId);
    let card = null;
    
    if (column) {
        card = column.cards.find(c => c.id === cardId);
        console.log('🔍 Found card in specified column:', card ? { id: card.id, heading: card.heading, contentLength: card.content?.length || 0 } : 'not found');
    }
    
    // Falls nicht gefunden, in allen Spalten suchen
    if (!card) {
        console.log('🔍 Card not found in specified column, searching all columns...');
        for (const col of window.currentBoard.columns) {
            const foundCard = col.cards.find(c => c.id === cardId);
            if (foundCard) {
                card = foundCard;
                column = col;
                console.log('🔍 Found card in column:', col.id, foundCard);
                break;
            }
        }
    }
    
    if (!card) {
        console.log('❌ Card not found anywhere:', cardId);
    }
    
    return card;
}

// Einfache Markdown-zu-HTML Konvertierung als Fallback
function markdownToHtmlFallback(markdown) {
    if (!markdown) return '';
    
    return markdown
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

// HTML-zu-Markdown Konvertierung als Fallback
function htmlToMarkdownFallback(html) {
    if (!html) return '';
    
    return html
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
        .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
        .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
        .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
        .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
        .replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gi, '```\n$1\n```\n')
        .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n')
        .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
        .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
        .replace(/<ul[^>]*>|<\/ul>/gi, '')
        .replace(/<ol[^>]*>|<\/ol>/gi, '')
        .replace(/<p[^>]*>|<\/p>/gi, '\n\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<div[^>]*>|<\/div>/gi, '\n')
        .replace(/<[^>]+>/g, '') // Entferne alle restlichen HTML-Tags
        .replace(/\n{3,}/g, '\n\n') // Reduziere mehrfache Zeilenumbrüche
        .trim();
}

// Content aus Quill Editor speichern
function saveQuillContent(quill, cardId, columnId, turndownService) {
    try {
        // HTML Content aus Quill holen
        const htmlContent = quill.getSemanticHTML();
        
        // Zu Markdown konvertieren
        const markdownContent = turndownService.turndown(htmlContent);
        
        // Karte in Daten finden und aktualisieren
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
        
        // Content aktualisieren
        card.content = markdownContent;
        
        // Speichern
        if (typeof saveAllBoards === 'function') {
            saveAllBoards();
        }
        
        // WICHTIG: updateFullCardModal NICHT aufrufen, da es den Quill-Editor zerstört!
        // Stattdessen nur die Spalten-Anzeige aktualisieren (ohne Modal zu berühren)
        if (typeof renderColumns === 'function') {
            renderColumns();
        }
        
        console.log('💾 Quill content saved for card:', cardId);
        
    } catch (error) {
        console.error('❌ Error saving Quill content:', error);
    }
}

// Quill Editor deaktivieren und zum normalen Anzeige-Modus zurückkehren
function deactivateQuillEditor(cardId) {
    const editorData = quillEditors.get(cardId);
    if (!editorData) return;
      try {
        // Content vor dem Deaktivieren speichern
        saveQuillContent(
            editorData.quill, 
            editorData.cardId, 
            editorData.columnId, 
            editorData.turndownService
        );
          // WICHTIG: Alle Quill-Elemente vollständig entfernen
        const editorContainer = editorData.element;
        
        // CSS-Klasse für aktiven Editor entfernen
        const cardContentFull = editorContainer.closest('.card-content-full') || 
                                 (editorContainer.classList.contains('card-content-full') ? editorContainer : null);
        if (cardContentFull) {
            cardContentFull.classList.remove('quill-editing');
        }
        
        // 1. Quill Editor destroy
        if (editorData.quill && editorData.quill.destroy) {
            editorData.quill.destroy();
        }
        
        // 2. Alle Quill-spezifischen Klassen und Elemente entfernen
        // Suche auch außerhalb des Containers nach verirrten Toolbars
        const modal = document.getElementById('full-card-modal');
        if (modal) {
            const allToolbars = modal.querySelectorAll('.ql-toolbar');
            allToolbars.forEach(toolbar => {
                console.log('🗑️ Removing orphaned toolbar:', toolbar);
                toolbar.remove();
            });
        }
        
        const quillContainer = editorContainer.querySelector('.ql-container');
        
        // Container-Klassen vollständig zurücksetzen
        if (quillContainer) {
            // Alle Quill-Klassen entfernen
            quillContainer.classList.remove('ql-container', 'ql-snow', 'quill-active');
            
            // ql-editor Klassen und Inhalte zurücksetzen
            const qlEditor = quillContainer.querySelector('.ql-editor');
            if (qlEditor) {
                qlEditor.classList.remove('ql-editor');
                // Alle Quill-spezifischen Attribute entfernen
                qlEditor.removeAttribute('contenteditable');
                qlEditor.removeAttribute('spellcheck');
                qlEditor.removeAttribute('role');
            }
        }
        
        // Auch auf dem editorContainer selbst prüfen
        editorContainer.classList.remove('ql-container', 'ql-snow', 'quill-active');
        
        // 3. ID zurücksetzen
        editorContainer.id = '';
        
        // 4. Originale Markdown-Content als HTML wieder anzeigen
        const cardData = getCardData(editorData.cardId, editorData.columnId);
        if (cardData && cardData.content) {
            if (window.renderMarkdownToHtml) {
                const renderedHtml = window.renderMarkdownToHtml(cardData.content);
                
                // Falls editorContainer der .markdown-content wrapper ist, parent element verwenden
                if (editorContainer.classList.contains('markdown-content')) {
                    const parentElement = editorContainer.parentElement;
                    if (parentElement && parentElement.classList.contains('card-content-full')) {
                        parentElement.innerHTML = renderedHtml;
                        // Data-Attribute wieder setzen
                        setTimeout(() => {
                            parentElement.setAttribute('data-card-id', editorData.cardId);
                            parentElement.setAttribute('data-column-id', editorData.columnId);
                            const newMarkdownContent = parentElement.querySelector('.markdown-content');
                            if (newMarkdownContent) {
                                newMarkdownContent.setAttribute('data-card-id', editorData.cardId);
                                newMarkdownContent.setAttribute('data-column-id', editorData.columnId);
                            }
                        }, 10);
                    } else {
                        editorContainer.innerHTML = renderedHtml;
                    }
                } else {
                    editorContainer.innerHTML = renderedHtml;
                }
            } else {
                editorContainer.innerHTML = markdownToHtmlFallback(cardData.content);
            }
        }
        
        // 5. Aus Map entfernen
        quillEditors.delete(cardId);
        
        console.log('✅ Quill editor deactivated for card:', cardId);
        
        // 6. Edit-Button wieder anzeigen (mit Delay um sicherzustellen dass DOM updated ist)
        setTimeout(() => {
            const cardContentFull = document.querySelector('.card-content-full');
            if (cardContentFull) {
                showEditButton(cardContentFull);
            }
        }, 100);
        
    } catch (error) {
        console.error('❌ Error deactivating Quill editor:', error);
    }
}

// Alle aktiven Quill Editoren deaktivieren
function disableAllQuillEditors() {
    const editorIds = Array.from(quillEditors.keys());
    editorIds.forEach(cardId => deactivateQuillEditor(cardId));
}

// Edit-Button zu card-content-full Elementen hinzufügen
function addEditButton(cardContentElement, cardId, columnId) {
    // Prüfen ob bereits ein Button existiert
    if (cardContentElement.querySelector('.quill-edit-button')) return;
    
    const editButton = document.createElement('button');
    editButton.className = 'quill-edit-button';
    editButton.innerHTML = '✏️ Bearbeiten';
    editButton.title = 'WYSIWYG Editor aktivieren (oder Doppelklick)';
    
    editButton.onclick = (e) => {
        e.stopPropagation();
        activateEditorForCard(cardContentElement, cardId, columnId);
    };
    
    // Button positionieren
    cardContentElement.style.position = 'relative';
    editButton.style.position = 'absolute';
    editButton.style.top = '10px';
    editButton.style.right = '10px';
    editButton.style.zIndex = '10';
    
    cardContentElement.appendChild(editButton);
    
    // Doppelklick-Handler hinzufügen
    cardContentElement.ondblclick = (e) => {
        e.stopPropagation();
        activateEditorForCard(cardContentElement, cardId, columnId);
    };
}

// Edit-Button wieder anzeigen
function showEditButton(cardContentElement) {
    const editButton = cardContentElement.querySelector('.quill-edit-button');
    if (editButton) {
        editButton.style.display = 'block';
    }
}

// Edit-Button verstecken
function hideEditButton(cardContentElement) {
    const editButton = cardContentElement.querySelector('.quill-edit-button');
    if (editButton) {
        editButton.style.display = 'none';
    }
}

// Editor für eine bestimmte Karte aktivieren
async function activateEditorForCard(cardContentElement, cardId, columnId) {
    console.log('🚀 Activating editor for card:', cardId);
    
    // Edit-Button verstecken während Editing
    hideEditButton(cardContentElement);
    
    // Editor aktivieren
    const editor = await enableQuillEditor(cardContentElement, cardId, columnId);
    
    if (editor) {
        // Fokus auf Editor setzen
        editor.focus();
        
        // ESC-Handler für Deaktivierung
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                deactivateQuillEditor(cardId);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }
}

// Card ID aus Modal extrahieren
function extractCardIdFromModal(modal) {
    console.log('🔍 Extracting card ID from modal...');
    
    try {
        // Versuche Card ID aus Button onclick-Attribut zu extrahieren
        const editButton = modal.querySelector('button[onclick*="openCardModal"]');
        if (editButton) {
            const onclickValue = editButton.getAttribute('onclick');
            console.log('🔍 Edit button onclick:', onclickValue);
            const match = onclickValue.match(/openCardModal\('([^']+)',\s*'([^']+)'\)/);
            if (match) {
                console.log('✅ Card ID extracted from edit button:', match[2]);
                return match[2]; // cardId ist der zweite Parameter
            }
        }
        
        // Fallback: Versuche aus Delete-Button
        const deleteButton = modal.querySelector('button[onclick*="deleteCard"]');
        if (deleteButton) {
            const onclickValue = deleteButton.getAttribute('onclick');
            console.log('🔍 Delete button onclick:', onclickValue);
            const match = onclickValue.match(/deleteCard\('([^']+)',\s*'([^']+)'\)/);
            if (match) {
                console.log('✅ Card ID extracted from delete button:', match[1]);
                return match[1]; // cardId ist der erste Parameter
            }
        }
        
        console.log('❌ Could not extract card ID from modal buttons');
        return null;
    } catch (error) {
        console.error('❌ Error extracting card ID from modal:', error);
        return null;
    }
}

// Column ID aus Modal extrahieren
function extractColumnIdFromModal(modal) {
    console.log('🔍 Extracting column ID from modal...');
    
    try {
        // Versuche Column ID aus Button onclick-Attribut zu extrahieren
        const editButton = modal.querySelector('button[onclick*="openCardModal"]');
        if (editButton) {
            const onclickValue = editButton.getAttribute('onclick');
            console.log('🔍 Edit button onclick:', onclickValue);
            const match = onclickValue.match(/openCardModal\('([^']+)',\s*'([^']+)'\)/);
            if (match) {
                console.log('✅ Column ID extracted from edit button:', match[1]);
                return match[1]; // columnId ist der erste Parameter
            }
        }
        
        // Fallback: Versuche aus Delete-Button
        const deleteButton = modal.querySelector('button[onclick*="deleteCard"]');
        if (deleteButton) {
            const onclickValue = deleteButton.getAttribute('onclick');
            console.log('🔍 Delete button onclick:', onclickValue);
            const match = onclickValue.match(/deleteCard\('([^']+)',\s*'([^']+)'\)/);
            if (match) {
                console.log('✅ Column ID extracted from delete button:', match[2]);
                return match[2]; // columnId ist der zweite Parameter
            }
        }
        
        console.log('❌ Could not extract column ID from modal buttons');
        return null;
    } catch (error) {
        console.error('❌ Error extracting column ID from modal:', error);
        return null;
    }
}

// Alternative ID-Ermittlung als Fallback
function extractIdsFromModalContent(modal) {
    console.log('🔍 Trying alternative ID extraction method...');
    
    try {
        // Versuche IDs aus dem Modal-Titel und URL zu extrahieren
        const modalHeader = modal.querySelector('.modal-header h2');
        const cardUrl = modal.querySelector('.card-url-link');
        
        if (cardUrl) {
            console.log('🔍 Found card URL:', cardUrl.href);
        }
        
        // Durchsuche alle currentBoard Daten nach Übereinstimmungen
        if (window.currentBoard && window.currentBoard.columns) {
            const headerText = modalHeader ? modalHeader.textContent.trim() : '';
            console.log('🔍 Modal header text:', headerText);
            
            // Suche Karte anhand des Titels
            for (const column of window.currentBoard.columns) {
                for (const card of column.cards) {
                    if (card.heading && card.heading === headerText) {
                        console.log('✅ Found card by title match:', { cardId: card.id, columnId: column.id });
                        return { cardId: card.id, columnId: column.id };
                    }
                }
            }
            
            // Fallback: Suche nach Content-Übereinstimmung
            const contentElement = modal.querySelector('.card-content-full');
            if (contentElement) {
                const displayedContent = contentElement.textContent || contentElement.innerText || '';
                console.log('🔍 Displayed content preview:', displayedContent.substring(0, 100) + '...');
                
                for (const column of window.currentBoard.columns) {
                    for (const card of column.cards) {
                        if (card.content && displayedContent.includes(card.content.substring(0, 50))) {
                            console.log('✅ Found card by content match:', { cardId: card.id, columnId: column.id });
                            return { cardId: card.id, columnId: column.id };
                        }
                    }
                }
            }
        }
        
        console.log('❌ Alternative ID extraction failed');
        return null;
    } catch (error) {
        console.error('❌ Error in alternative ID extraction:', error);
        return null;
    }
}

// Edit-Buttons zu allen card-content-full Elementen hinzufügen
function addEditButtonsToModals() {
    if (!isQuillEnabled) return;
    
    const modal = document.getElementById('full-card-modal');
    if (!modal) return;
    
    const cardContentElement = modal.querySelector('.card-content-full');
    if (!cardContentElement) return;
    
    // WICHTIGER FIX: Warten bis data-Attribute gesetzt sind
    setTimeout(() => {
        // Card ID und Column ID direkt aus data-Attributen lesen
        let cardId = cardContentElement.getAttribute('data-card-id');
        let columnId = cardContentElement.getAttribute('data-column-id');
        
        // Falls nicht auf Haupt-Element, versuche markdown-content Container
        if (!cardId || !columnId) {
            const markdownContent = cardContentElement.querySelector('.markdown-content');
            if (markdownContent) {
                cardId = markdownContent.getAttribute('data-card-id') || cardId;
                columnId = markdownContent.getAttribute('data-column-id') || columnId;
            }
        }
        
        if (cardId && columnId) {
            console.log('✅ IDs from data attributes:', { cardId, columnId });
            addEditButton(cardContentElement, cardId, columnId);
        } else {
            console.log('❌ No data attributes found, trying fallback methods...');
            
            // Fallback: Versuche die alten Methoden
            const fallbackCardId = extractCardIdFromModal(modal);
            const fallbackColumnId = extractColumnIdFromModal(modal);
            
            if (fallbackCardId && fallbackColumnId) {
                console.log('✅ IDs from fallback method:', { cardId: fallbackCardId, columnId: fallbackColumnId });
                addEditButton(cardContentElement, fallbackCardId, fallbackColumnId);
            } else {
                console.log('❌ Could not determine card/column IDs');
            }
        }
    }, 100); // Länger warten um sicherzustellen, dass data-Attribute gesetzt sind
}

// Plugin Toggle Funktion
function toggleQuillPlugin() {
    isQuillEnabled = !isQuillEnabled;
    QUILL_SETTINGS.enabled = isQuillEnabled;
    saveQuillSettings();
    
    if (!isQuillEnabled) {
        disableAllQuillEditors();
        restoreOriginalFunctions();
    } else {
        interceptConflictingFunctions();
        // Edit-Buttons zu aktuell offenen Modals hinzufügen
        setTimeout(addEditButtonsToModals, 100);
    }
    
    console.log(`🔧 Quill Editor Plugin ${isQuillEnabled ? 'enabled' : 'disabled'}`);
    
    // Settings UI aktualisieren
    updateQuillSettingsUI();
    
    return isQuillEnabled;
}

// Settings UI Update
function updateQuillSettingsUI() {
    const toggle = document.getElementById('quill-enabled-toggle');
    if (toggle) {
        toggle.checked = isQuillEnabled;
    }
    
    const status = document.getElementById('quill-status');
    if (status) {
        status.textContent = isQuillEnabled ? 'Aktiviert' : 'Deaktiviert';
        status.style.color = isQuillEnabled ? '#22c55e' : '#ef4444';
    }
}

// Modal Detection mit MutationObserver
document.addEventListener('DOMContentLoaded', function() {
    // Plugin-Einstellungen laden
    loadQuillSettings();
      // Observer für neue Modals
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1 && node.id === 'full-card-modal') {
                    // Länger warten, bis Modal vollständig geladen ist und data-Attribute gesetzt sind
                    setTimeout(() => {
                        addEditButtonsToModals();
                    }, 300); // Erhöht von 200ms auf 300ms
                }
            });
        });
    });
    
    // Observer starten
    observer.observe(document.body, {
        childList: true,
        subtree: false
    });
});

// Plugin Global verfügbar machen
window.QuillEditorPlugin = {
    toggle: toggleQuillPlugin,
    enable: () => { isQuillEnabled = true; toggleQuillPlugin(); },
    disable: () => { isQuillEnabled = false; toggleQuillPlugin(); },
    isEnabled: () => isQuillEnabled,
    updateSettingsUI: updateQuillSettingsUI,
    activateEditor: activateEditorForCard,
    deactivateEditor: deactivateQuillEditor
};

// Debug-Funktionen
window.QuillDebug = {
    editors: () => quillEditors,
    settings: () => QUILL_SETTINGS,
    isEnabled: () => isQuillEnabled,
    librariesLoaded: () => quillLibrariesLoaded,
    activateForTesting: (cardId, columnId) => {
        const modal = document.getElementById('full-card-modal');
        const cardContent = modal?.querySelector('.card-content-full');
        if (cardContent) {
            activateEditorForCard(cardContent, cardId, columnId);
        }
    },
    // Neue Debug-Funktionen für Toolbar-Probleme
    findOrphanedToolbars: () => {
        const modal = document.getElementById('full-card-modal');
        if (!modal) return [];
        const toolbars = Array.from(modal.querySelectorAll('.ql-toolbar'));
        console.log('🔍 Found toolbars:', toolbars);
        return toolbars;
    },
    cleanupOrphanedToolbars: () => {
        const toolbars = window.QuillDebug.findOrphanedToolbars();
        toolbars.forEach((toolbar, index) => {
            console.log(`🗑️ Removing orphaned toolbar ${index + 1}:`, toolbar);
            toolbar.remove();
        });
        return `Removed ${toolbars.length} orphaned toolbars`;
    },
    inspectQuillStructure: () => {
        const modal = document.getElementById('full-card-modal');
        if (!modal) return 'No modal found';
        
        const cardContent = modal.querySelector('.card-content-full');
        if (!cardContent) return 'No card-content-full found';
        
        const structure = {
            hasQuillEditing: cardContent.classList.contains('quill-editing'),
            toolbars: cardContent.querySelectorAll('.ql-toolbar').length,
            containers: cardContent.querySelectorAll('.ql-container').length,
            editors: cardContent.querySelectorAll('.ql-editor').length,
            markdownContent: cardContent.querySelectorAll('.markdown-content').length,
            innerHTML: cardContent.innerHTML.substring(0, 200) + '...'
        };
        
        console.log('🔍 Quill Structure Analysis:', structure);
        return structure;
    }
};

console.log('🚀 Quill.js Plugin (Manual Activation) loaded successfully');
