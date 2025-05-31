# URL Preview Plugin - Funktionalitätstest

## 🎯 Testziel
Überprüfung der URL-Preview-Funktionalität im Kanban-Board, insbesondere:
- URL-Erkennung und Metadaten-Extraktion
- YouTube-spezifische Behandlung mit Video-Previews
- URL-Feld Integration im Card Settings Modal
- CORS-Proxy Fallback-Mechanismen

## 📋 Test-Checkliste

### ✅ Plugin-Integration
- [x] `onpaste-url-plugin.js` ist in `kanban.html` geladen (Zeile 475)
- [x] Plugin-Initialisierung im DOMContentLoaded Event (Zeilen 495-500)
- [x] Erweiterte `handleTextPasteEnhanced` Funktion überschreibt Basis-Implementation
- [x] Globale Funktionen für HTML-Template verfügbar gemacht

### 🔍 URL-Metadaten-Extraktion
**Zu testen:**
1. **YouTube URLs:**
   - `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
   - `https://youtu.be/dQw4w9WgXcQ`
   - Sollte YouTube oEmbed API verwenden

2. **Normale Websites:**
   - `https://github.com/microsoft/vscode`
   - `https://stackoverflow.com/questions/tagged/javascript`
   - Sollte HTML-Meta-Tags extrahieren (title, description, image)

3. **CORS-Proxy Fallbacks:**
   - api.allorigins.win
   - cors-anywhere.herokuapp.com
   - thingproxy.freeboard.io

### 🎥 YouTube-spezifische Features
**Erwartetes Verhalten:**
- Video-ID Extraktion aus verschiedenen URL-Formaten
- Thumbnail-Generierung (maxresdefault.jpg)
- Embed-URL mit YouTube-nocookie.com
- Tab-Switching zwischen Thumbnail und Video-Player
- Fallback-Handling bei Embed-Fehlern

### 🎨 Preview-Modal
**UI-Komponenten:**
- Modal mit z-index 6000 (höher als andere Modals)
- Rich-Content Display mit Thumbnail/Beschreibung
- YouTube: Tabs für Thumbnail/Video Player
- URL-Feld Integration Checkbox
- Responsive Design für Mobile

### 📱 URL-Feld Integration
**Card Settings Modal:**
- Checkbox "URL in Card-URL-Feld eintragen"
- Automatische Population des URL-Feldes
- Erhaltung bestehender Card-Daten

## 🧪 Test-Szenarien

### Szenario 1: Einzelne YouTube-URL pasten
1. Spalte auswählen (Header klicken)
2. YouTube-URL in Zwischenablage kopieren
3. Strg+V drücken
4. **Erwartet:** URL-Preview-Modal mit Video-Tabs

### Szenario 2: Text mit mehreren URLs
1. Text mit 2+ URLs kopieren
2. In Spalte pasten
3. **Erwartet:** URLs automatisch zu Markdown-Links konvertiert mit Titeln

### Szenario 3: URL-Feld Integration
1. Card Modal öffnen
2. URL pasten mit aktivierter Checkbox
3. **Erwartet:** URL sowohl im Content als auch im URL-Feld

### Szenario 4: CORS-Fallback
1. URL zu schwer erreichbarer Website
2. **Erwartet:** Automatischer Fallback zwischen Proxies
3. Bei komplettem Fehler: Einfacher Markdown-Link

## 🔧 Debug-Konsole Befehle

```javascript
// Plugin-Status prüfen
console.log('URLPreviewPlugin:', typeof URLPreviewPlugin !== 'undefined');

// YouTube-URL Test
URLPreviewPlugin.isYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

// Video-ID Extraktion
URLPreviewPlugin.extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ');

// Metadaten abrufen (async)
URLPreviewPlugin.fetchUrlMetadata('https://github.com/microsoft/vscode')
  .then(metadata => console.log('Metadata:', metadata));

// Paste-Handler testen
const mockTarget = { type: 'column', columnId: 'test-column' };
handleTextPasteEnhanced('https://www.youtube.com/watch?v=dQw4w9WgXcQ', mockTarget);
```

## 📊 Erwartete Funktionsweise

### Normale URL-Paste:
1. URL erkannt → `fetchUrlMetadata()` aufgerufen
2. CORS-Proxy versucht Metadaten zu laden
3. Bei Erfolg → Rich Preview Modal
4. Bei Fehler → Einfacher Markdown-Link

### YouTube-URL-Paste:
1. `isYouTubeUrl()` erkennt YouTube
2. `fetchYouTubeMetadata()` verwendet oEmbed API
3. Preview-Modal mit Video-Tabs
4. Embed-URL generiert mit youtube-nocookie.com

### Text mit URLs:
1. RegEx erkennt mehrere URLs
2. Jede URL einzeln verarbeitet für Titel-Extraktion
3. URLs durch `[Titel](URL)` Markdown ersetzt
4. Verarbeiteter Text normal eingefügt

## ⚠️ Bekannte Limitationen

1. **CORS-Beschränkungen:** Nicht alle Websites unterstützen Proxy-Zugriff
2. **Rate-Limiting:** Proxies können bei vielen Anfragen limitieren
3. **JavaScript-Heavy Sites:** Metadaten nur aus statischem HTML
4. **YouTube-Embed:** Kann durch Content-Security-Policy blockiert werden

## 🎯 Erfolgskriterien

- ✅ Plugin lädt ohne Fehler
- ✅ URL-Erkennung funktioniert zuverlässig
- ✅ YouTube-URLs zeigen Rich-Preview
- ✅ Normale URLs zeigen Metadaten (falls verfügbar)
- ✅ Fallback zu einfachen Links bei Fehlern
- ✅ URL-Feld Integration funktioniert
- ✅ Responsive Design auf mobilen Geräten
- ✅ Keine Konflikte mit bestehender Paste-Funktionalität

## 📝 Test-Ergebnisse

**Datum:** _[Beim Test ausfüllen]_
**Browser:** _[Chrome/Firefox/Edge]_
**Status:** _[BESTANDEN/FEHLGESCHLAGEN]_

**Getestete URLs:**
- [ ] YouTube-Video
- [ ] GitHub-Repository  
- [ ] Stack Overflow Frage
- [ ] News-Website
- [ ] Blog-Post

**Gefundene Probleme:**
_[Hier eventuelle Probleme dokumentieren]_

**Verbesserungsvorschläge:**
_[Hier Verbesserungen notieren]_
