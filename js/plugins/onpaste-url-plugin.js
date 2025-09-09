/**
 * URL Preview Plugin für Paste-Funktionalität
 * Erweitert die Basis-Paste-Funktionalität um:
 * - URL-Preview-Modals mit Rich-Content
 * - YouTube-spezifische Funktionen mit Video Player
 * - Automatische URL-Feld Integration im Card Modal
 * - Verbesserte Metadaten-Extraktion
 */

// Plugin Namespace
const URLPreviewPlugin = {
    // Plugin-spezifische Konfiguration
    config: {
        corsProxies: [
            'https://api.allorigins.win/get?url=',
            'https://cors-anywhere.herokuapp.com/',
            'https://thingproxy.freeboard.io/fetch/'
        ],
        youtubeOembedApi: 'https://www.youtube.com/oembed?url=',
        googleFaviconApi: 'https://www.google.com/s2/favicons?domain=',
        fallbackDuration: 5000 // 5 Sekunden für Proxy-Timeouts
    },

    // Initialisierung des Plugins
    init() {
        console.log('🔗 URL Preview Plugin wird initialisiert...');
        this.addStyles();
        this.extendPasteHandlers();
        this.setupGlobalFunctions();
        console.log('✅ URL Preview Plugin erfolgreich initialisiert');
    },

    // CSS-Styles für das Plugin hinzufügen
    addStyles() {
        if (document.getElementById('url-preview-plugin-styles')) return;

        const style = document.createElement('style');
        style.id = 'url-preview-plugin-styles';
        style.textContent = `
            /* URL Preview Modal Styles */
            #url-preview-modal {
                z-index: 6000; /* Höher als Card Modal (4000) und Smart Paste Modal (5000) */
            }

            .url-preview-container {
                margin: 1rem 0;
            }

            .url-preview-image {
                text-align: center;
                margin: 1rem 0;
                max-height: 300px;
                overflow: hidden;
                border-radius: 8px;
                background: #f8f9fa;
            }

            .url-preview-image img {
                max-width: 100%;
                height: auto;
                max-height: 300px;
                object-fit: cover;
                border-radius: 8px;
                transition: opacity 0.3s ease;
            }

            .url-preview-content {
                padding: 1rem;
                background: #f8f9fa;
                border-radius: 8px;
                margin: 1rem 0;
            }

            .url-preview-title {
                font-size: 1.2rem;
                font-weight: bold;
                color: #333;
                margin: 0 0 0.5rem 0;
                line-height: 1.3;
            }

            .url-preview-description {
                color: #666;
                font-size: 0.95rem;
                line-height: 1.4;
                margin: 0 0 0.75rem 0;
            }

            .url-preview-url {
                color: #007acc;
                font-size: 0.85rem;
                word-break: break-all;
                text-decoration: none;
                font-weight: 500;
            }

            .url-preview-url:hover {
                text-decoration: underline;
            }

            /* YouTube Video Tabs */
            .video-tabs {
                display: flex;
                gap: 0.5rem;
                margin: 1rem 0;
                border-bottom: 1px solid #e0e0e0;
                padding-bottom: 0.5rem;
            }

            .tab-btn {
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 6px 6px 0 0;
                padding: 0.5rem 1rem;
                cursor: pointer;
                font-size: 0.9rem;
                transition: all 0.2s ease;
                border-bottom: none;
            }

            .tab-btn:hover {
                background: #e9ecef;
            }

            .tab-btn.active {
                background: #007acc;
                color: white;
                border-color: #007acc;
            }

            .tab-content {
                display: none;
            }

            .tab-content.active {
                display: block;
            }

            /* YouTube Player Container */
            .youtube-video-container {
                margin: 1rem 0;
            }

            .youtube-video-container iframe {
                width: 100%;
                height: 315px;
                border-radius: 8px;
                border: none;
            }

            /* YouTube Fallback */
            .youtube-fallback {
                padding: 1.5rem;
                text-align: center;
                background: #f8f9fa;
                border-radius: 8px;
                margin: 1rem 0;
                border: 2px dashed #dee2e6;
            }

            .youtube-fallback p {
                margin: 0 0 1rem 0;
                color: #666;
                font-size: 1.1rem;
            }

            .youtube-fallback button,
            .youtube-fallback a {
                background: #28a745;
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                cursor: pointer;
                margin: 0 0.5rem;
                text-decoration: none;
                display: inline-block;
            }

            .youtube-fallback a {
                background: #007bff;
            }

            .youtube-fallback button:hover,
            .youtube-fallback a:hover {
                opacity: 0.9;
            }

            .youtube-fallback small {
                color: #999;
                font-size: 0.85rem;
            }

            /* Form Styling in URL Preview Modal */
            #url-preview-modal .form-group {
                margin: 1rem 0;
            }

            #url-preview-modal .form-group label {
                display: block;
                margin-bottom: 0.5rem;
                font-weight: 500;
                color: #333;
            }

            #url-preview-modal .form-group input[type="text"],
            #url-preview-modal .form-group textarea {
                width: 100%;
                padding: 0.5rem;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 0.9rem;
                box-sizing: border-box;
            }

            #url-preview-modal .form-group input[type="checkbox"] {
                margin-right: 0.5rem;
            }

            #url-preview-modal .form-group small {
                display: block;
                margin-top: 0.25rem;
                color: #666;
                font-size: 0.8rem;
            }

            /* Target Info Box */
            .paste-target-info {
                margin-top: 1rem;
                padding: 0.75rem;
                background: #f8f9fa;
                border-radius: 4px;
                font-size: 0.85rem;
                color: #666;
                border-left: 4px solid #007acc;
            }

            /* Loading Animation */
            .url-preview-loading {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 2rem;
                color: #666;
            }

            .loading-spinner {
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 2px solid #e3e3e3;
                border-radius: 50%;
                border-top-color: #007acc;
                animation: spin 1s ease-in-out infinite;
                margin-right: 0.5rem;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            /* Enhanced Button Styling */
            #url-preview-modal .modal-actions {
                display: flex;
                gap: 0.5rem;
                flex-wrap: wrap;
                margin-top: 1.5rem;
                padding-top: 1rem;
                border-top: 1px solid #e0e0e0;
            }

            #url-preview-modal .modal-actions .btn {
                flex: 1;
                min-width: 120px;
                text-align: center;
            }

            @media (max-width: 600px) {
                #url-preview-modal .modal-actions .btn {
                    flex: 1 0 100%;
                    margin-bottom: 0.5rem;
                }
                
                .video-tabs {
                    flex-direction: column;
                }
                
                .tab-btn {
                    border-radius: 6px;
                    margin-bottom: 0.25rem;
                }
            }
        `;
        document.head.appendChild(style);
    },

    // Erweiterte Paste-Handler registrieren
    extendPasteHandlers() {
        // Überschreibe die handleTextPasteEnhanced Funktion
        const originalHandler = window.handleTextPasteEnhanced;
        
        window.handleTextPasteEnhanced = async (text, target) => {
            if (!target) return;
            
            // URL-Erkennung
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const urls = text.match(urlRegex);
            
            if (urls && urls.length === 1 && text.trim() === urls[0]) {
                // Einzelne URL - zeige erweiterte Preview
                await this.showEnhancedUrlPreview(urls[0], target);
            } else if (urls) {
                // Text mit URLs - konvertiere URLs zu Markdown mit Titel-Erkennung
                let processedText = text;
                for (const url of urls) {
                    try {
                        const preview = await this.fetchUrlMetadata(url);
                        if (preview && preview.title && preview.title !== this.extractDomainFromUrl(url)) {
                            processedText = processedText.replace(url, `[${preview.title}](${url})`);
                        } else {
                            processedText = processedText.replace(url, `[${url}](${url})`);
                        }
                    } catch (error) {
                        // Fallback für einzelne URL-Fehler
                        processedText = processedText.replace(url, `[${url}](${url})`);
                    }
                }
                this.finalizePasteAction(processedText, target);
                showPasteNotification('📋 Text mit Links eingefügt!');
            } else {
                // Kein URL - normale Behandlung mit fallback zum ursprünglichen Handler
                if (originalHandler) {
                    await originalHandler(text, target);
                } else {
                    this.finalizePasteAction(text, target);
                    showPasteNotification('📋 Text eingefügt!');
                }
            }
        };
    },

    // Setup globale Funktionen
    setupGlobalFunctions() {
        // Globale Funktionen für HTML-Template verfügbar machen
        window.URLPreviewPlugin = this;
        window.showVideoTab = this.showVideoTab.bind(this);
        window.closeUrlPreviewModal = this.closeUrlPreviewModal.bind(this);
        window.confirmUrlPreviewPaste = this.confirmUrlPreviewPaste.bind(this);
        window.pasteUrlAsSimpleLink = this.pasteUrlAsSimpleLink.bind(this);
        window.pasteYouTubeAsLink = this.pasteYouTubeAsLink.bind(this);
        window.handleYouTubeEmbedError = this.handleYouTubeEmbedError.bind(this);
        window.retryYouTubeEmbed = this.retryYouTubeEmbed.bind(this);
    },

    // Hauptfunktion: Erweiterte URL-Preview anzeigen
    async showEnhancedUrlPreview(url, target) {
        // Zeige Loading-Notification
        const loadingNotification = showPasteNotification('🔍 Lade URL-Vorschau...', 0);
        
        try {
            const preview = await this.fetchUrlMetadata(url);
            
            // Entferne Loading-Notification
            if (loadingNotification && loadingNotification.parentNode) {
                loadingNotification.parentNode.removeChild(loadingNotification);
            }
            
            if (preview) {
                this.showUrlPreviewModal(preview, target);
            } else {
                // Fallback bei fehlschlagender Preview
                this.finalizePasteAction(`[${url}](${url})`, target);
                showPasteNotification('⚠️ Konnte keine Vorschau laden - URL als Link eingefügt');
            }
        } catch (error) {
            console.error('URL Preview Error:', error);
            
            // Entferne Loading-Notification
            if (loadingNotification && loadingNotification.parentNode) {
                loadingNotification.parentNode.removeChild(loadingNotification);
            }
            
            // Fallback
            this.finalizePasteAction(`[${url}](${url})`, target);
            showPasteNotification('⚠️ URL-Vorschau fehlgeschlagen - Link eingefügt');
        }
    },

    // URL-Metadaten abrufen
    async fetchUrlMetadata(url) {
        // Spezielle Behandlung für YouTube-URLs
        if (this.isYouTubeUrl(url)) {
            return await this.fetchYouTubeMetadata(url);
        }
        
        // Versuche verschiedene CORS-Proxies
        for (const proxy of this.config.corsProxies) {
            try {
                console.log(`🔄 Versuche URL-Metadaten über ${proxy}...`);
                const response = await this.fetchWithTimeout(`${proxy}${encodeURIComponent(url)}`, this.config.fallbackDuration);
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.contents) {
                        const metadata = this.parseHtmlForMetadata(data.contents, url);
                        if (metadata) {
                            console.log('✅ URL-Metadaten erfolgreich geladen:', metadata);
                            return metadata;
                        }
                    }
                }
            } catch (error) {
                console.warn(`❌ ${proxy} fehlgeschlagen:`, error.message);
                continue;
            }
        }
        
        // Direkte Anfrage als letzter Versuch
        try {
            console.log('🔄 Versuche direkte URL-Anfrage...');
            const response = await this.fetchWithTimeout(url, this.config.fallbackDuration);
            if (response.ok) {
                const html = await response.text();
                const metadata = this.parseHtmlForMetadata(html, url);
                if (metadata) {
                    console.log('✅ Direkte URL-Metadaten erfolgreich:', metadata);
                    return metadata;
                }
            }
        } catch (error) {
            console.warn('❌ Direkte URL-Anfrage fehlgeschlagen (CORS):', error.message);
        }
        
        // Fallback: Basic URL Info
        console.log('🔄 Verwende Fallback-Metadaten für:', url);
        const domain = this.extractDomainFromUrl(url);
        return {
            title: domain.replace('www.', '').split('.')[0],
            description: `Webseite von ${domain}`,
            image: `${this.config.googleFaviconApi}${domain}&sz=128`,
            url: url,
            isYouTube: false
        };
    },

    // YouTube-spezifische Metadaten
    async fetchYouTubeMetadata(url) {
        const videoId = this.extractYouTubeVideoId(url);
        if (!videoId) return null;
        
        try {
            console.log('🎥 Lade YouTube-Metadaten für Video:', videoId);
            const oembed = await this.fetchWithTimeout(`${this.config.youtubeOembedApi}${encodeURIComponent(url)}&format=json`, 5000);
            
            if (oembed.ok) {
                const data = await oembed.json();
                return {
                    title: data.title || 'YouTube Video',
                    description: `Video von ${data.author_name || 'YouTube'} • ${data.width}x${data.height}`,
                    image: this.getYouTubeThumbnail(videoId, 'maxresdefault'),
                    url: url,
                    isYouTube: true,
                    videoId: videoId,
                    embedUrl: this.getYouTubeEmbedUrl(videoId),
                    authorName: data.author_name,
                    duration: data.duration || null
                };
            }
        } catch (error) {
            console.warn('❌ YouTube oEmbed fehlgeschlagen:', error);
        }
        
        // Fallback: Grundlegende YouTube-Daten
        return {
            title: 'YouTube Video',
            description: 'Video auf YouTube',
            image: this.getYouTubeThumbnail(videoId, 'maxresdefault'),
            url: url,
            isYouTube: true,
            videoId: videoId,
            embedUrl: this.getYouTubeEmbedUrl(videoId)
        };
    },

    // Fetch mit Timeout
    async fetchWithTimeout(url, timeout = 5000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    },

    // HTML-Parsing für Metadaten
    parseHtmlForMetadata(html, url) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Meta-Tags extrahieren
            const getMetaContent = (property) => {
                const meta = doc.querySelector(`meta[property="${property}"]`) || 
                             doc.querySelector(`meta[name="${property}"]`) ||
                             doc.querySelector(`meta[itemprop="${property}"]`);
                return meta ? meta.getAttribute('content') : null;
            };
            
            // Titel ermitteln
            let title = getMetaContent('og:title') || 
                        getMetaContent('twitter:title') || 
                        doc.querySelector('title')?.textContent ||
                        doc.querySelector('h1')?.textContent ||
                        this.extractDomainFromUrl(url);
            
            // Beschreibung ermitteln
            let description = getMetaContent('og:description') || 
                             getMetaContent('twitter:description') || 
                             getMetaContent('description') ||
                             doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
                             this.getFirstParagraphText(doc) ||
                             `Webseite von ${this.extractDomainFromUrl(url)}`;
            
            // Bild ermitteln
            let image = getMetaContent('og:image') || 
                        getMetaContent('twitter:image') ||
                        getMetaContent('twitter:image:src') ||
                        doc.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href') ||
                        doc.querySelector('link[rel="icon"]')?.getAttribute('href') ||
                        doc.querySelector('img')?.getAttribute('src');
            
            // Relative URLs zu absoluten URLs konvertieren
            let absoluteImage = this.makeAbsoluteUrl(image, url);
            
            return {
                title: this.cleanText(title).substring(0, 100),
                description: this.cleanText(description).substring(0, 300),
                image: absoluteImage,
                url: url
            };
        } catch (error) {
            console.warn('❌ HTML-Parsing fehlgeschlagen:', error);
            return null;
        }
    },

    // URL Preview Modal anzeigen
    showUrlPreviewModal(preview, target) {
        // Entferne existierendes Modal
        this.closeUrlPreviewModal();
        
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.id = 'url-preview-modal';
        
        const isYouTube = preview.isYouTube;
        
        // Generiere Standard-Content
        let defaultContent = this.generateDefaultContent(preview);
        
        // Video-Tabs für YouTube
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

        // Thumbnail Content
        const thumbnailContent = preview.image ? `
            <div class="url-preview-image">
                <img src="${preview.image}" alt="Preview" 
                     onerror="this.style.display='none'; this.parentElement.style.display='none';" 
                     onload="this.style.opacity='1';" 
                     style="opacity: 0; transition: opacity 0.3s;">
            </div>
        ` : '';

        // Player Content für YouTube
        const playerContent = isYouTube ? `
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
                <div id="youtube-fallback-${preview.videoId}" class="youtube-fallback" style="display: none;">
                    <p>⚠️ Video kann nicht eingebettet werden</p>
                    <div>
                        <button onclick="retryYouTubeEmbed('${preview.videoId}', '${preview.url}')">
                            🔄 Nochmal versuchen
                        </button>
                        <a href="${preview.url}" target="_blank">
                            🔗 Auf YouTube öffnen
                        </a>
                    </div>
                    <small>Manche Videos erlauben kein Embedding aufgrund von Urheberrechtseinstellungen.</small>
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
                            ${thumbnailContent}
                        </div>
                        ${playerContent}
                        <div class="url-preview-content">
                            <h3 class="url-preview-title">${preview.title}</h3>
                            <p class="url-preview-description">${preview.description}</p>
                            <a class="url-preview-url" href="${preview.url}" target="_blank">
                                ${isYouTube ? '🎥' : '🌐'} ${preview.url}
                            </a>
                            ${isYouTube && preview.authorName ? `<br><small style="color: #666;">📺 Kanal: ${preview.authorName}</small>` : ''}
                        </div>                    </div>
                    
                    <div class="form-group">
                        ${isYouTube ? `
                        <label>
                            <input type="checkbox" id="use-as-thumbnail" disabled>
                            <span>Video-Thumbnail als Karten-Thumbnail verwenden</span>
                            <small style="color: #999;"> (Für YouTube-Videos deaktiviert - URL wird stattdessen verwendet)</small>
                        </label>
                        ` : `
                        <label>
                            <input type="checkbox" id="use-as-thumbnail" ${preview.image ? 'checked' : 'disabled'}>
                            <span>Bild als Karten-Thumbnail verwenden</span>
                            ${!preview.image ? '<small style="color: #999;"> (Kein Bild verfügbar)</small>' : ''}
                        </label>
                        `}
                    </div>
                    
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="use-as-url-field" checked>
                            <span>${isYouTube ? 'YouTube-URL im URL-Feld der Karte speichern' : 'URL im URL-Feld der Karte speichern'}</span>
                        </label>
                        <small>${isYouTube ? 'Die YouTube-URL wird automatisch im Card Settings Modal angezeigt' : 'Wird im Card Settings Modal im URL-Feld angezeigt'}</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="preview-card-title">Karten-Titel:</label>
                        <input type="text" id="preview-card-title" value="${preview.title}" maxlength="100" 
                               placeholder="Titel für die Karte eingeben...">
                    </div>
                    
                    <div class="form-group">
                        <label for="preview-content">Inhalt (Markdown):</label>
                        <textarea id="preview-content" rows="6" placeholder="Markdown-Inhalt für die Karte...">${defaultContent}</textarea>
                        <small>💡 Sie können den Inhalt bearbeiten. Markdown wird unterstützt.</small>
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
                    
                    <div class="paste-target-info">
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
        modal.dataset.isYouTube = isYouTube.toString();
        modal.dataset.videoId = preview.videoId || '';
        
        modal.onclick = (e) => {
            if (e.target === modal) this.closeUrlPreviewModal();
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
    },

    // Standard-Content generieren
    generateDefaultContent(preview) {
        if (preview.description && preview.description.length > 10) {
            return `# ${preview.title}

${preview.description}

[🔗 Zur Webseite](${preview.url})`;
        } else {
            return `# ${preview.title}

[🔗 ${preview.url}](${preview.url})`;
        }
    },

    // Video Tab-Switching
    showVideoTab(tabName) {
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
    },

    // Modal schließen
    closeUrlPreviewModal() {
        const modal = document.getElementById('url-preview-modal');
        if (modal) {
            modal.remove();
        }
    },    // URL Preview Paste bestätigen
    confirmUrlPreviewPaste() {
        const modal = document.getElementById('url-preview-modal');
        if (!modal) return;
        
        const target = JSON.parse(modal.dataset.targetData);
        const title = document.getElementById('preview-card-title').value;
        let content = document.getElementById('preview-content').value;
        const useAsThumbnail = document.getElementById('use-as-thumbnail').checked;
        const useAsUrlField = document.getElementById('use-as-url-field').checked;
        const originalUrl = modal.dataset.originalUrl;
        const isYouTube = modal.dataset.isYouTube === 'true';
        const videoId = modal.dataset.videoId;
        
        // Für YouTube: Kein Thumbnail verwenden, sondern nur URL
        let thumbnailUrl = '';
        let cardUrl = '';
        
        if (isYouTube) {
            // YouTube: Immer die Original-URL als Card-URL verwenden, kein Thumbnail
            cardUrl = originalUrl;
            thumbnailUrl = ''; // Kein Thumbnail für YouTube
            
            // YouTube-spezifische Inhalte mit eingebettetem Video
            if (videoId) {
                const embedUrl = this.getYouTubeEmbedUrl(videoId);
                content = `
<div class="youtube-embed" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; background: #000; border-radius: 8px; margin: 1rem 0;">
<iframe 
    src="${embedUrl}" 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" 
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
    allowfullscreen
    title="YouTube Video: ${title}">
</iframe>
</div>
`;
            }
        } else {
            // Für normale URLs: Standard-Verhalten
            thumbnailUrl = useAsThumbnail ? modal.dataset.previewImage : '';
            cardUrl = useAsUrlField ? originalUrl : '';
        }
        
        // Paste-Aktion basierend auf Ziel-Typ
        if (target.type === 'modal') {
            // In offenes Card Modal einfügen
            this.insertIntoCardModal(title, content, thumbnailUrl, cardUrl);
        } else if (target.type === 'card') {
            // An bestehende Karte anhängen
            this.appendToCard(target.cardId, target.columnId, content);
        } else if (target.type === 'column') {
            // Neue Karte erstellen
            this.createEnhancedCardFromPaste(target.columnId, title, content, thumbnailUrl, cardUrl);
        }
        
        this.closeUrlPreviewModal();
        const message = isYouTube ? '✅ YouTube-Video eingefügt!' : '✅ URL-Vorschau eingefügt!';
        showPasteNotification(message);
    },

    // Als einfacher Link einfügen
    pasteUrlAsSimpleLink() {
        const modal = document.getElementById('url-preview-modal');
        if (!modal) return;
        
        const target = JSON.parse(modal.dataset.targetData);
        const url = modal.dataset.originalUrl;
        
        this.finalizePasteAction(`[${url}](${url})`, target);
        this.closeUrlPreviewModal();
        showPasteNotification('🔗 URL als einfacher Link eingefügt');
    },    // YouTube als Link einfügen
    pasteYouTubeAsLink() {
        const modal = document.getElementById('url-preview-modal');
        if (!modal) return;
        
        const target = JSON.parse(modal.dataset.targetData);
        const title = document.getElementById('preview-card-title').value;
        const originalUrl = modal.dataset.originalUrl;
        
        // Für YouTube-Links: Kein Thumbnail, aber URL als Card-URL
        const content = `# ${title}

[🎥 Video auf YouTube ansehen](${originalUrl})

---
*YouTube-Link eingefügt*`;
        
        if (target.type === 'modal') {
            this.insertIntoCardModal(title, content, '', originalUrl); // Kein Thumbnail, aber URL
        } else if (target.type === 'card') {
            this.appendToCard(target.cardId, target.columnId, content);
        } else if (target.type === 'column') {
            this.createEnhancedCardFromPaste(target.columnId, title, content, '', originalUrl); // Kein Thumbnail, aber URL
        }
        
        this.closeUrlPreviewModal();
        showPasteNotification('🔗 YouTube-Video als Link eingefügt!');
    },

    // In Card Modal einfügen
    insertIntoCardModal(title, content, thumbnailUrl = '', urlField = '') {
        const headingField = document.getElementById('card-heading');
        const contentField = document.getElementById('card-content');
        const thumbnailField = document.getElementById('card-thumbnail');
        const urlFieldElement = document.getElementById('card-url');
        
        if (headingField) headingField.value = title;
        if (contentField) {
            const currentValue = contentField.value;
            const newValue = currentValue ? currentValue + '\n\n' + content : content;
            contentField.value = newValue;
        }
        if (thumbnailField && thumbnailUrl) thumbnailField.value = thumbnailUrl;
        if (urlFieldElement && urlField) urlFieldElement.value = urlField;
        
        // Auto-Save triggern falls aktiviert
        if (typeof autoSaveCardHandler === 'function' && contentField) {
            autoSaveCardHandler({ target: contentField });
        }
    },

    // Erweiterte Karte erstellen
    createEnhancedCardFromPaste(columnId, title, content, thumbnailUrl = '', urlField = '') {
        if (typeof createNewCardWithContent === 'function') {
            // Verwende bestehende Funktion und erweitere sie
            const newCard = {
                id: typeof generateId === 'function' ? generateId() : 'card-' + Date.now(),
                heading: title || 'Eingefügter Inhalt',
                content: content,
                color: 'color-gradient-1',
                thumbnail: thumbnailUrl,
                comments: '',
                url: urlField,
                inactive: false
            };
            
            // Finde die Spalte und füge die Karte hinzu
            if (typeof currentBoard !== 'undefined' && currentBoard && currentBoard.columns) {
                const column = currentBoard.columns.find(c => c.id === columnId);
                if (column) {
                    column.cards.push(newCard);
                    if (typeof saveAllBoards === 'function') saveAllBoards();
                    if (typeof renderColumns === 'function') renderColumns();
                }
            }
        }
    },

    // Basis-Paste-Aktion
    finalizePasteAction(text, target) {
        if (target.type === 'modal') {
            const contentField = document.getElementById('card-content');
            if (contentField) {
                const currentValue = contentField.value;
                const newValue = currentValue ? currentValue + '\n\n' + text : text;
                contentField.value = newValue;
            }
        } else if (target.type === 'card') {
            this.appendToCard(target.cardId, target.columnId, text);
        } else if (target.type === 'column') {
            if (typeof createNewCardWithContent === 'function') {
                createNewCardWithContent(target.columnId, text);
            }
        }
    },

    // An Karte anhängen
    appendToCard(cardId, columnId, text) {
        if (typeof currentBoard !== 'undefined' && currentBoard && currentBoard.columns) {
            const column = currentBoard.columns.find(c => c.id === columnId);
            if (column) {
                const card = column.cards.find(c => c.id === cardId);
                if (card) {
                    card.content = (card.content || '') + '\n\n' + text;
                    if (typeof saveAllBoards === 'function') saveAllBoards();
                    if (typeof renderColumns === 'function') renderColumns();
                }
            }
        }
    },

    // YouTube Error Handling
    handleYouTubeEmbedError(videoId, originalUrl) {
        console.warn('❌ YouTube Embed fehlgeschlagen für Video:', videoId);
        const iframe = document.getElementById(`youtube-iframe-${videoId}`);
        const fallback = document.getElementById(`youtube-fallback-${videoId}`);
        
        if (iframe) iframe.style.display = 'none';
        if (fallback) fallback.style.display = 'block';
    },

    // YouTube Embed Retry
    retryYouTubeEmbed(videoId, originalUrl) {
        console.log('🔄 Retry YouTube Embed für Video:', videoId);
        const iframe = document.getElementById(`youtube-iframe-${videoId}`);
        const fallback = document.getElementById(`youtube-fallback-${videoId}`);
        
        if (!iframe) return;
        
        if (fallback) fallback.style.display = 'none';
        iframe.style.display = 'block';
        
        // Versuche verschiedene Embedding-URLs
        const embedUrls = [
            `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&fs=1`,
            `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`,
            `https://www.youtube-nocookie.com/embed/${videoId}`,
            `https://www.youtube.com/embed/${videoId}`
        ];
        
        let currentIndex = 0;
        const tryNextUrl = () => {
            if (currentIndex < embedUrls.length) {
                iframe.src = embedUrls[currentIndex];
                currentIndex++;
                setTimeout(tryNextUrl, 2000); // Warte 2 Sekunden zwischen den Versuchen
            }
        };
        
        tryNextUrl();
    },

    // Hilfsfunktionen
    isYouTubeUrl(url) {
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
        return youtubeRegex.test(url);
    },

    extractYouTubeVideoId(url) {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
        const match = url.match(regex);
        return match ? match[1] : null;
    },

    getYouTubeEmbedUrl(videoId) {
        return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&fs=1&cc_load_policy=0&iv_load_policy=3&autohide=0`;
    },

    getYouTubeThumbnail(videoId, quality = 'maxresdefault') {
        return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
    },

    extractDomainFromUrl(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return url;
        }
    },

    getFirstParagraphText(doc) {
        const paragraph = doc.querySelector('p');
        if (paragraph && paragraph.textContent.trim().length > 20) {
            return paragraph.textContent.trim();
        }
        return null;
    },

    cleanText(text) {
        if (!text) return '';
        return text
            .replace(/\s+/g, ' ')
            .replace(/[\n\r]/g, ' ')
            .trim();
    },

    makeAbsoluteUrl(relativeUrl, baseUrl) {
        if (!relativeUrl) {
            const domain = this.extractDomainFromUrl(baseUrl);
            return `${this.config.googleFaviconApi}${domain}&sz=128`;
        }
        
        try {
            if (relativeUrl.startsWith('http')) {
                return relativeUrl;
            } else if (relativeUrl.startsWith('//')) {
                return 'https:' + relativeUrl;
            } else if (relativeUrl.startsWith('/')) {
                const domain = new URL(baseUrl).origin;
                return domain + relativeUrl;
            } else {
                const basePath = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
                return basePath + relativeUrl;
            }
        } catch (error) {
            console.warn('Error making absolute URL:', error);
            const domain = this.extractDomainFromUrl(baseUrl);
            return `${this.config.googleFaviconApi}${domain}&sz=128`;
        }
    }
};

// Plugin automatisch initialisieren wenn DOM bereit ist
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => URLPreviewPlugin.init());
} else {
    URLPreviewPlugin.init();
}

// Plugin global verfügbar machen
window.URLPreviewPlugin = URLPreviewPlugin;
