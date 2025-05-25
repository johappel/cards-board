# Kanban Board App - Detaillierter Entwicklungsplan mit Agent-Prompts

## Phase 1: Projektinitialisierung und Entwicklungsumgebung

### Aufgabe 1.1: Projekt-Setup
**Prompt für Agent:**
```
Erstelle ein neues Svelte-Projekt für eine Kanban-Board-App mit folgenden Spezifikationen:
- Projektname: svelte-kanban-board
- Verwende Svelte 5 mit TypeScript
- Richte Vite als Build-Tool ein
- Installiere folgende Dependencies:
  - svelte-dnd-action für Drag & Drop
  - marked für Markdown-Rendering
  - @tiptap/svelte für WYSIWYG Editor
  - lucide-svelte für Icons
  - nanoid für eindeutige IDs
- Erstelle eine .gitignore Datei
- Initialisiere Git Repository
- Erstelle README.md mit Projektbeschreibung
```

### Aufgabe 1.2: Ordnerstruktur einrichten
**Prompt für Agent:**
```
Erstelle folgende Ordnerstruktur im src-Verzeichnis:
- /components
  - /board
  - /cards
  - /columns
  - /modals
  - /ui
- /stores
- /types
- /utils
- /styles
- /api

Füge in jeden Ordner eine index.ts Datei für Barrel-Exports hinzu.
```

### Aufgabe 1.3: TypeScript-Typen definieren
**Prompt für Agent:**
```
Erstelle TypeScript-Interfaces in src/types/index.ts basierend auf dem Konzept:
- Board (id, title, authors, summary, backgroundColor, customCSS, createdAt, updatedAt)
- Column (id, boardId, title, description, color, position, cards)
- Card (id, columnId, heading, content, color, isHidden, comments, position, createdAt)
- Comment (id, cardId, text, author, createdAt)
- AIConfig (provider, apiKey, baseUrl, modelName, webhookUrl)
- ExportData (version, boards, exportDate)

Verwende string für IDs (nanoid), Date-Typen für Zeitstempel.
```

## Phase 2: Datenhaltung und State Management

### Aufgabe 2.1: LocalStorage Service
**Prompt für Agent:**
```
Erstelle einen LocalStorage-Service in src/utils/storage.ts mit folgenden Funktionen:
- saveToLocalStorage<T>(key: string, data: T): void
- getFromLocalStorage<T>(key: string): T | null
- removeFromLocalStorage(key: string): void
- getAllBoards(): Board[]
- saveBoard(board: Board): void
- deleteBoard(boardId: string): void
- exportBoardsToJSON(): string
- importBoardsFromJSON(jsonString: string): void

Implementiere Fehlerbehandlung und Validierung.
```

### Aufgabe 2.2: Svelte Stores erstellen
**Prompt für Agent:**
```
Erstelle Svelte Stores in src/stores/ für:
1. boards.ts: Writable store für alle Boards
2. currentBoard.ts: Derived store für aktuelles Board
3. columns.ts: Writable store für Spalten des aktuellen Boards
4. cards.ts: Writable store für alle Karten
5. aiConfig.ts: Writable store für KI-Konfiguration
6. ui.ts: Store für UI-Zustände (modals, selectedCard, etc.)

Implementiere CRUD-Operationen als Store-Methoden.
Synchronisiere automatisch mit LocalStorage.
```

## Phase 3: UI-Komponenten - Basis

### Aufgabe 3.1: Dashboard-Komponente
**Prompt für Agent:**
```
Erstelle src/components/Dashboard.svelte mit:
- Grid-Layout für Board-Karten (responsive)
- Board-Karte zeigt: Titel, Autoren, Zusammenfassung, Erstelldatum
- Plus-Button für neues Board (fixed position, prominent)
- Hover-Effekte und Schatten für Karten
- Click-Handler zum Öffnen eines Boards
- Verwende CSS Grid mit auto-fit für responsive Layout
```

### Aufgabe 3.2: Board-Header-Komponente
**Prompt für Agent:**
```
Erstelle src/components/board/BoardHeader.svelte mit:
- Editierbarer Titel (contenteditable oder Input on click)
- Autoren-Liste mit Add/Remove Funktionalität
- Zusammenfassungs-Bereich (expandable)
- KI-Button für automatische Zusammenfassung
- Drei-Punkte-Menü für Board-Einstellungen
- Zurück-Button zum Dashboard
- Styling: Sticky header, Glassmorphism-Effekt
```

### Aufgabe 3.3: Modal-System
**Prompt für Agent:**
```
Erstelle ein wiederverwendbares Modal-System:
1. src/components/modals/Modal.svelte (Basis-Komponente)
   - Overlay mit Backdrop
   - Close on Escape/Outside click
   - Animations (fade/scale)
   - Slot für Content

2. src/components/modals/BoardModal.svelte
   - Tabs: Allgemein, Styling, Export/Import
   - Farbauswahl für Hintergrund
   - Custom CSS Editor mit Syntax-Highlighting
   - Export/Import Buttons

3. src/components/modals/CardModal.svelte
   - Heading Input
   - Tabs: Bearbeiten, KI Generator
   - WYSIWYG Markdown Editor
   - Kontext-Checkboxen für KI
   - Farbauswahl
```

## Phase 4: Spalten und Karten

### Aufgabe 4.1: Column-Komponente
**Prompt für Agent:**
```
Erstelle src/components/columns/Column.svelte mit:
- Header mit editierbarem Titel
- Drag-Handle für Spalten-Verschiebung
- Drei-Punkte-Menü mit:
  - Farbe ändern (Gradient-Palette)
  - Beschreibung bearbeiten
  - KI: Kärtchen generieren
  - Spalte exportieren
  - Spalte löschen
- Drop-Zone für Karten
- Plus-Button für neue Karte
- Verwende svelte-dnd-action für Drag & Drop
- Animierte Übergänge beim Verschieben
```

### Aufgabe 4.2: Card-Komponente
**Prompt für Agent:**
```
Erstelle src/components/cards/Card.svelte mit:
- Drag-Handle im Header
- Heading-Anzeige
- Rich-Content-Bereich (Markdown-Rendering)
- Kommentar-Icon mit Counter
- Auge-Icon für Sichtbarkeit
- Drei-Punkte-Menü
- Hover-Effekte und Schatten
- Kompakte Ansicht wenn versteckt
- Click-Handler zum Öffnen der Detailansicht
```

### Aufgabe 4.3: Drag & Drop Implementation
**Prompt für Agent:**
```
Implementiere Drag & Drop Funktionalität:
- Nutze svelte-dnd-action
- Ermögliche Karten-Verschiebung zwischen/innerhalb Spalten
- Ermögliche Spalten-Neuanordnung
- Visual feedback während des Draggings
- Auto-Scroll bei Rand-Nähe
- Touch-Support für Mobile
- Aktualisiere Positionen in Stores
- Speichere nach Drop in LocalStorage
```

## Phase 5: Editor und Kommentare

### Aufgabe 5.1: WYSIWYG Markdown Editor
**Prompt für Agent:**
```
Integriere TipTap Editor in src/components/ui/RichEditor.svelte:
- Toolbar mit: Bold, Italic, Heading, Liste, Link, Code
- Markdown Shortcuts (z.B. # für Heading)
- Live-Preview Toggle
- Image-Upload (Base64)
- Autosave mit Debouncing
- Undo/Redo Funktionalität
- Mobile-optimierte Toolbar
```

### Aufgabe 5.2: Kommentar-System
**Prompt für Agent:**
```
Erstelle src/components/cards/CommentSection.svelte:
- Thread-basierte Kommentare
- Autor und Timestamp
- Eingabefeld für neue Kommentare
- Löschen-Funktion für eigene Kommentare
- Collapsible Ansicht
- Echtzeit-Update der Kommentarzahl
- Markdown-Support in Kommentaren
```

## Phase 6: KI-Integration

### Aufgabe 6.1: KI-Service
**Prompt für Agent:**
```
Erstelle src/api/ai-service.ts mit:
- Konfigurierbare Provider (OpenAI, Custom Webhook)
- generateContent(prompt: string, context?: string[]): Promise<string>
- summarizeBoard(board: Board): Promise<string>
- generateCards(columnContext: string, count: number): Promise<Card[]>
- Error handling und Retry-Logik
- Rate limiting
- Response streaming Support
```

### Aufgabe 6.2: KI-Konfiguration UI
**Prompt für Agent:**
```
Erstelle src/components/modals/AIConfigModal.svelte:
- Provider-Auswahl (Dropdown)
- Input-Felder für API-Konfiguration
- Test-Button für Verbindung
- Speichern in verschlüsseltem LocalStorage
- Webhook-Konfiguration für n8n
- Beispiel-Prompts und Dokumentation
```

## Phase 7: Export/Import und API

### Aufgabe 7.1: Export/Import Funktionalität
**Prompt für Agent:**
```
Implementiere Export/Import in src/utils/export.ts:
- exportBoard(boardId: string): JSON mit Metadaten
- exportColumn(columnId: string): JSON
- importBoard(jsonData: string): Board
- importCards(columnId: string, cards: Card[]): void
- Validierung der Import-Daten
- Versions-Kompatibilität
- Download als .json Datei
- Drag & Drop Import
```

### Aufgabe 7.2: API-Schnittstelle
**Prompt für Agent:**
```
Erstelle src/api/board-api.ts für externe Integration:
- createCard(boardId, columnId, cardData): Promise<Card>
- updateCard(cardId, updates): Promise<Card>
- moveCard(cardId, targetColumnId, position): Promise<void>
- addColumn(boardId, columnData): Promise<Column>
- getBoardState(boardId): Promise<Board>
- Event-System für externe Updates
- API-Key Authentifizierung
```

## Phase 8: Styling und Responsive Design

### Aufgabe 8.1: Design-System
**Prompt für Agent:**
```
Erstelle src/styles/design-system.css mit:
- CSS Variablen für Farben, Spacing, Typography
- Gradient-Palette für Spalten/Karten
- Dark/Light Mode Unterstützung
- Animationen und Transitions
- Glassmorphism und Neumorphism Effekte
- Mobile-first Approach
- Print-Styles für Export
```

### Aufgabe 8.2: Responsive Optimierung
**Prompt für Agent:**
```
Optimiere alle Komponenten für Mobile:
- Touch-optimierte Drag & Drop
- Collapsible Spalten auf Mobile
- Bottom-Sheet Modals auf Mobile
- Swipe-Gesten für Navigation
- Angepasste Toolbar-Layouts
- Performance-Optimierung für Mobile
- PWA-Manifest erstellen
```

## Phase 9: Testing und Optimierung

### Aufgabe 9.1: Testing-Setup
**Prompt für Agent:**
```
Richte Testing-Umgebung ein:
- Vitest für Unit-Tests
- Playwright für E2E-Tests
- Teste kritische Funktionen:
  - LocalStorage Operationen
  - Drag & Drop
  - Import/Export
  - KI-Integration
- Coverage-Report einrichten
```

### Aufgabe 9.2: Performance-Optimierung
**Prompt für Agent:**
```
Optimiere die App-Performance:
- Lazy Loading für Modals
- Virtual Scrolling für viele Karten
- Debouncing für Autosave
- Image-Optimierung
- Bundle-Size-Analyse
- Service Worker für Offline-Support
- IndexedDB für große Datenmengen
```

## Phase 10: Deployment und Dokumentation

### Aufgabe 10.1: Build und Deployment
**Prompt für Agent:**
```
Bereite Deployment vor:
- Produktions-Build-Konfiguration
- Environment-Variablen Setup
- GitHub Actions für CI/CD
- Netlify/Vercel Deployment-Config
- Docker-Container Option
- Fehler-Tracking (Sentry)
```

### Aufgabe 10.2: Dokumentation
**Prompt für Agent:**
```
Erstelle umfassende Dokumentation:
- README.md mit Setup-Anleitung
- API-Dokumentation
- Benutzerhandbuch
- Entwickler-Dokumentation
- Beispiel-Boards als JSON
- Video-Tutorials Skripte
- Changelog pflegen
```

## Zusätzliche Überlegungen

### Sicherheit
- XSS-Schutz bei User-Input
- Content Security Policy
- API-Key Verschlüsselung
- Input-Validierung

### Accessibility
- ARIA-Labels
- Keyboard-Navigation
- Screen-Reader Support
- Kontrast-Prüfung

### Erweiterbarkeit
- Plugin-System vorbereiten
- Theming-Support
- i18n-Vorbereitung
- WebSocket-Support für Kollaboration