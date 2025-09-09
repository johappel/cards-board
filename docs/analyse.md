# Codebase-Analyse: Kanban-Board-Anwendung

## Überblick
Die Codebase ist eine Web-Anwendung für ein Kanban-Board mit Features wie Card-Management, AI-Integration, Chatbot, Nostr-Support und Paste-Funktionen. Die Anwendung basiert auf HTML, CSS und JavaScript. Die Analyse identifiziert aktive Kernkomponenten und trennt unnütze Dateien (Tests, Backups, Demos).

## Aktuelle Struktur nach Umstrukturierung
- **Root-Verzeichnis**:
  - `index.html`: Haupteinstiegspunkt der Anwendung.

- **css/**: Enthält alle Stylesheets (12 Dateien):
  - board.css, card.css, chatbot.css, colors.css, column.css, duplicate.css, markdown.css, modal.css, quilljs-plugin.css, share_via_nostr.css, sidebar.css, styles.css.

- **js/**: Kern-JavaScript-Dateien (16 Dateien):
  - ai.js, api.js, board_settings.js, board-colors.js, board.js, card.js, chatbot.js, colors.js, column.js, dashboard.js, duplicate.js, import_export.js, init.js, share_via_nostr.js, sidebar.js, storage.js, utils.js.

- **js/plugins/**: Plugin-spezifische Dateien (3 Dateien):
  - quilljs-plugin.js, onpaste.js, onpaste-url-plugin.js.

- **docs/**: Dokumentationsdateien (10 .md + 1 JSON):
  - AI-SUPPORTED-ENDPOINTS.md, BOARD-SUMMARY-IMPLEMENTATION.md, FIREFOX-BUTTON-FIX-STATUS.md, IMPLEMENTATION-COMMENTS-URLS.md, KONZEPT.md, LABELS-IMPLEMENTATION.md, NOSTR-IMPLEMENTATION-COMPLETE.md, NOSTR-INTEGRATION.md, projekt.md, QUILL-SAVE-ONLY-IMPLEMENTATION.md, SUMMARY-IMPLEMENTATION-STATUS.md, n8n_example_chatbot_endpoints.json.

- **to_delete/**: Unnütze Dateien (40+ Test-, Backup- und Demo-Dateien, inkl. .github/):
  - Alle Dateien mit "test-", "debug-", "fix-", "backup-", "-demo" in Namen, sowie .hintrc und .github/.

## Kernkomponenten (aus Code-Definitionen)
- **Board-Management**: board.js, board_settings.js, dashboard.js.
- **Card/Column**: card.js, column.js.
- **AI-Integration**: ai.js (Prompts, Generierung).
- **Chatbot**: chatbot.js (WebSocket, N8N).
- **Nostr**: Import/Export-Funktionen in import_export.js, aber Tests in to_delete/.
- **Paste-Funktionen**: In Plugins.
- **Storage**: storage.js, utils.js.

## Identifizierte Probleme/Verbesserungen
- Viele Testdateien deuten auf Entwicklungsphase hin; diese sind nun isoliert.
- Potenzielle Abhängigkeiten: Quill.js (Plugin), Sortable.js (Drag-Drop in to_delete?).
- Keine Build-Tools sichtbar; reine Frontend-Anwendung.

Diese Struktur macht den Code übersichtlicher und wartbarer.