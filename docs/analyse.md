# Codebase-Analyse: Kanban-Board-Anwendung

**Letzte Aktualisierung:** 2025-09-09

Dieses Dokument analysiert die Codebase der Kanban-Board-Anwendung. Für eine Übersicht siehe [[Projektbeschreibung|projekt.md]] und [[KONZEPT|KONZEPT.md]]. Die Analyse trennt aktive Komponenten von unnötigen Dateien und identifiziert Kernstrukturen. Wichtige Formate siehe [[AGENTS|AGENTS.md]].

## Inhaltsverzeichnis
- [[Überblick|#überblick]]
- [[Aktuelle Struktur nach Umstrukturierung|#aktuelle-struktur-nach-umstrukturierung]]
- [[Kernkomponenten (aus Code-Definitionen)|#kernkomponenten-aus-code-definitionen]]
- [[Identifizierte Probleme/Verbesserungen|#identifizierte-problemeverbesserungen]]

## Überblick

Die Codebase ist eine Web-Anwendung für ein Kanban-Board mit Features wie Card-Management, AI-Integration, Chatbot, Nostr-Support und Paste-Funktionen. Die Anwendung basiert auf HTML, CSS und JavaScript (Vanilla JS). Die Analyse identifiziert aktive Kernkomponenten und trennt unnütze Dateien (Tests, Backups, Demos).

Für AI-spezifische Endpoints siehe [[AI-Supported Endpoints|AI-SUPPORTED-ENDPOINTS.md]].

## Aktuelle Struktur nach Umstrukturierung

### Root-Verzeichnis
- `index.html`: Haupteinstiegspunkt der Anwendung.

### css/
Enthält alle Stylesheets (12 Dateien):
- board.css, card.css, chatbot.css, colors.css, column.css, duplicate.css, markdown.css, modal.css, quilljs-plugin.css, share_via_nostr.css, sidebar.css, styles.css.

### js/
Kern-JavaScript-Dateien (16 Dateien):
- ai.js, api.js, board_settings.js, board-colors.js, board.js, card.js, chatbot.js, colors.js, column.js, dashboard.js, duplicate.js, import_export.js, init.js, share_via_nostr.js, sidebar.js, storage.js, utils.js.

### js/plugins/
Plugin-spezifische Dateien (2 Dateien):
- quilljs-plugin.js, onpaste-url-plugin.js.

### docs/
Dokumentationsdateien (11 .md + 1 JSON):
- AI-SUPPORTED-ENDPOINTS.md, BOARD-SUMMARY-IMPLEMENTATION.md, FIREFOX-BUTTON-FIX-STATUS.md, IMPLEMENTATION-COMMENTS-URLS.md, KONZEPT.md, LABELS-IMPLEMENTATION.md, NOSTR-IMPLEMENTATION-COMPLETE.md, NOSTR-INTEGRATION.md, projekt.md, QUILL-SAVE-ONLY-IMPLEMENTATION.md, SUMMARY-IMPLEMENTATION-STATUS.md, n8n_example_chatbot_endpoints.json.

### to_delete/
Unnütze Dateien (40+ Test-, Backup- und Demo-Dateien, inkl. .github/):
- Alle Dateien mit "test-", "debug-", "fix-", "backup-", "-demo" in Namen, sowie .hintrc und .github/.

## Kernkomponenten (aus Code-Definitionen)

- **Board-Management**: board.js, board_settings.js, dashboard.js. Siehe [[Board Summary Implementation|BOARD-SUMMARY-IMPLEMENTATION.md]].
- **Card/Column**: card.js, column.js. Erweiterungen in [[Labels Implementation|LABELS-IMPLEMENTATION.md]] und [[Kommentare & URLs|IMPLEMENTATION-COMMENTS-URLS.md]].
- **AI-Integration**: ai.js (Prompts, Generierung). Details in [[AI-Supported Endpoints|AI-SUPPORTED-ENDPOINTS.md]].
- **Chatbot**: chatbot.js (WebSocket, N8N).
- **Nostr**: Import/Export-Funktionen in import_export.js. Vollständig in [[Nostr Integration|NOSTR-INTEGRATION.md]] und [[Nostr Implementation Complete|NOSTR-IMPLEMENTATION-COMPLETE.md]].
- **Paste-Funktionen**: In Plugins (onpaste-url-plugin.js) und in /js (onpaste.js, onpaste-init.js).
- **Storage**: storage.js, utils.js.

Für Nostr-spezifische Fixes siehe [[Firefox Button Fix|FIREFOX-BUTTON-FIX-STATUS.md]].

## Identifizierte Probleme/Verbesserungen

- Viele Testdateien deuten auf Entwicklungsphase hin; diese sind nun isoliert in to_delete/.
- Potenzielle Abhängigkeiten: Quill.js (Plugin), Sortable.js (Drag-Drop, falls in to_delete).
- Keine Build-Tools sichtbar; reine Frontend-Anwendung.
- Empfehlung: Erweiterung um [[Quill Save-Only Implementation|QUILL-SAVE-ONLY-IMPLEMENTATION.md]] für bessere Editor-Integration.
- Zukünftige Features: Automatische Summary-Generierung, siehe [[Summary Implementation Status|SUMMARY-IMPLEMENTATION-STATUS.md]].

Diese Struktur macht den Code übersichtlicher und wartbarer. Für Regeln zur Weiterarbeit siehe [[Agents|AGENTS.md]].

---
*Überarbeitet für Wiki: Hinzugefügtes Inhaltsverzeichnis, Links zu anderen Docs, konsistente Struktur.*