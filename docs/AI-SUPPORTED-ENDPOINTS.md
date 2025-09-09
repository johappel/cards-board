# AI-Supported Endpoints - Dokumentation

**Version:** 1.0  
**Letzte Aktualisierung:** 15. Juni 2025  
**Kompatibilität:** Kanban Board System v2.0+

Dieses Dokument beschreibt die AI-unterstützten HTTP-Endpoints und WebSocket-Response-Formate für das Kanban Board System. Für grundlegende Konzepte siehe [[KONZEPT|KONZEPT.md]]. Wichtige Formate und Strukturen werden in [[AGENTS|AGENTS.md]] detailliert erklärt.

## Inhaltsverzeichnis
- [[Übersicht|#übersicht]]
- [[Endpoint-Konfiguration|#endpoint-konfiguration]]
- [[1. Chatbot Endpoint|#1-chatbot-endpoint]]
- [[2. Column AI Endpoint|#2-column-ai-endpoint]]
- [[3. Card AI Endpoint|#3-card-ai-endpoint]]
- [[4. Call2Actions|#4-call2actions-dynamische-aktionen-auf-karten]]
- [[5. WebSocket-Verbindung|#websocket-verbindung]]
- [[6. Fehlerbehandlung|#fehlerbehandlung]]
- [[7. Implementierungshinweise|#implementierungshinweise]]
- [[8. Best Practices|#best-practices]]
- [[9. Debugging|#debugging]]

## Übersicht

Das System unterstützt drei Haupttypen von AI-Operationen:
1. **Chatbot-Interaktionen** - Allgemeine Konversation und Board-Verwaltung
2. **Column AI** - Verarbeitung ganzer Spalten mit mehreren Karten
3. **Card AI** - Verarbeitung einzelner Karten

Für eine detaillierte Projektanalyse siehe [[Codebase-Analyse|analyse.md]].

## Endpoint-Konfiguration

Die AI-Endpoints werden in den globalen Einstellungen konfiguriert:
- `ai_websocketUrl` - WebSocket-Verbindung für Antworten (z.B. server.js)
- `ai_n8nAgentWebhookUrl` - Chatbot-Endpoint für allgemeine Interaktionen
- `ai_columnsUrl` - Column AI-Endpoint für Spalten-Verarbeitung
- `ai_cardsUrl` - Card AI-Endpoint für Karten-Verarbeitung

Der **n8n_example_chatbot_endpoint.json Workflow** zeigt, wie der AI-Support über n8n realisiert werden kann. Siehe [[Nostr-Integration|NOSTR-INTEGRATION.md]] für dezentrale Aspekte.

## 1. Chatbot Endpoint

### Request Format
**URL:** `ai_n8nAgentWebhookUrl`  
**Method:** `POST`  
**Content-Type:** `application/json`

Beispiel (gekürzt):
```json
{
  "chatInput": "Benutzer-Nachricht",
  "boardId": "board-123",
  "connectionId": "ws-connection-456",
  "boardData": {
    "id": "board-123",
    "name": "Projekt Alpha",
    "summary": "Board-Zusammenfassung",
    "columns": [...]  // Vollständige Board-Struktur, siehe AGENTS.md
  },
  "timestamp": "2025-06-15T12:34:56.789Z"
}
```

### WebSocket Response Optionen
#### 1. Textantwort
```json
{
  "type": "final_answer",
  "text": "Antwort des AI-Assistenten"
}
```

#### 2. Vorschläge
```json
{
  "type": "suggestions",
  "suggestions": ["Vorschlag 1", "Vorschlag 2"]
}
```

#### 3. Denkprozess
```json
{
  "type": "thinking",
  "message": "AI denkt..."
}
```

#### 4. Neue Spalte mit Karten
```json
{
  "type": "column",
  "column": "Neue Spalte",
  "cards": [...]  // Card-Struktur, siehe AGENTS.md
}
```

#### 5. Karten zu Spalte hinzufügen
```json
{
  "type": "cards",
  "column": "Bestehende Spalte",
  "cards": [...]
}
```

#### 6. Board-Summary aktualisieren
```json
{
  "type": "summary",
  "text": "Neue Board-Zusammenfassung"
}
```

## 2. Column AI Endpoint

### Request Format
**URL:** `ai_columnsUrl`  
**Method:** `POST`

Beispiel (gekürzt):
```json
{
  "type": "column-ai-request",
  "connectionId": "ws-connection-456",
  "columnName": "In Bearbeitung",
  "chatInput": "Ergänze Details",
  "cards": [...],  // Array von Cards
  "boardContext": {
    "name": "Projekt Alpha",
    "summary": "Entwicklung einer Website"
  }
}
```

### WebSocket Response
```json
{
  "type": "update-cards",
  "columnName": "In Bearbeitung",
  "cards": [...]  // Aktualisierte Cards
}
```

Optionale Felder: `boardContext` für Kontext.

## 3. Card AI Endpoint

### Request Format
**URL:** `ai_cardsUrl`  
**Method:** `POST`

Beispiel (gekürzt):
```json
{
  "type": "card-ai-request",
  "boardId": "board-123",
  "connectionId": "ws-connection-456",
  "cardId": "card-456",
  "chatInput": "Erstelle To-Do-Liste",
  "card": {...},  // Einzelne Card
  "columnCards": [...],  // Karten in Spalte
  "boardContext": {...}
}
```

### WebSocket Response
```json
{
  "type": "update-card",
  "cardId": "card-456",
  "card": {...}  // Aktualisierte Card
}
```

Optionale Felder: `columnCards`, `boardContext`.

## 4. Call2Actions (Dynamische Aktionen auf Karten)

Das System unterstützt dynamische Call-to-Action-Buttons auf Karten, die vom AI-Server über WebSocket gesetzt werden.

### Funktionsweise
1. AI-Server fügt `call2Actions` zu Cards hinzu.
2. Buttons im Card-Footer angezeigt.
3. Klick sendet spezielle Request an `ai_cardsUrl`.
4. Server verarbeitet und antwortet via WebSocket.

### Call2Actions in Card-Updates
```json
{
  "type": "update-card",
  "card": {
    "id": "card-123",
    "heading": "Überarbeitete Karte",
    "call2Actions": [
      {
        "action": "approve",
        "label": "✅ Genehmigen",
        "description": "Änderungen genehmigen"
      }
    ]
  }
}
```

### Request Format für Actions
```json
{
  "type": "card-action-request",
  "cardId": "card-123",
  "action": {
    "action": "approve",
    "params": {...}
  }
}
```

### Response
```json
{
  "type": "update-card",
  "card": {...}  // Aktualisierte Card
}
```

### Best Practices
- Max. 3-4 Buttons pro Karte.
- Aussagekräftige Labels mit Emojis.
- Params für Kontext.
- Buttons nach Action entfernen.

Für detaillierte Implementierung siehe [[Labels Implementation|LABELS-IMPLEMENTATION.md]] und [[Kommentare & URLs|IMPLEMENTATION-COMMENTS-URLS.md]].

### Beispiel-Workflow: Approval-Prozess
1. AI erstellt Card mit Buttons.
2. User klickt → Request gesendet.
3. Server updated Card.

## 5. WebSocket-Verbindung

### Verbindungsaufbau
Automatische Verbindung zu `ai_websocketUrl`. Server sendet:
```json
{
  "type": "welcome",
  "connectionId": "unique-id"
}
```

### Connection-ID
Wird in allen Requests mitgesendet. Ohne gültige ID keine Responses.

### Heartbeat & Wiederverbindung
- Ping alle 30s.
- Automatische Reconnect nach 3s.

## 6. Fehlerbehandlung

### HTTP-Fehler
UI zeigt Fehlermeldungen.

### WebSocket-Fehler
```json
{
  "type": "error",
  "message": "Fehlerbeschreibung",
  "code": "ERROR_CODE"
}
```

Unbekannte Nachrichten als System-Messages im Chatbot.

## 7. Implementierungshinweise

### Kartenstruktur (TypeScript)
```typescript
interface Card {
  id: string;
  heading: string;
  content: string;
  color: string;
  thumbnail?: string;
  comments?: string;
  url?: string;
  labels?: string;
  inactive?: boolean;
  expanded?: boolean;
  call2Actions?: Array<{action: string; label: string; description: string; params?: object}>;
}
```

### Board-Kontext
```typescript
interface BoardContext {
  name: string;
  summary: string;
}
```

### Spaltenstruktur
```typescript
interface Column {
  id: string;
  name: string;
  cards: Card[];
  color?: string;
}
```

Siehe [[AGENTS|AGENTS.md]] für vollständige Formate.

### Beispiel-Implementierung (Node.js/n8n)
```javascript
// Column AI Webhook
const { type, connectionId, columnName, cards } = $input.json;
if (type === 'column-ai-request') {
  const processedCards = await processCardsWithAI(cards);
  await sendWebSocketMessage(connectionId, {
    type: 'update-cards',
    columnName,
    cards: processedCards
  });
}
```

## 8. Best Practices
1. Eindeutige IDs für boardId, cardId, columnId.
2. Timestamps für Reihenfolge.
3. Graceful Degradation bei Fehlern.
4. Validation aller Payloads.
5. Rate Limiting.
6. Logging aller Operationen.

## 9. Debugging

### Client-seitig
- Browser-Konsole für WebSocket-Nachrichten.
- Network-Tab für HTTP-Requests.

### Server-seitig
- server.js für WebSocket-Server.
- n8n_example_chatbot_endpoint.json als Einstieg.
- Logge Requests mit Timestamps.

Für weitere Implementierungsdetails siehe [[Board Summary|BOARD-SUMMARY-IMPLEMENTATION.md]] und [[Quill Implementation|QUILL-SAVE-ONLY-IMPLEMENTATION.md]].

---
*Überarbeitet für Wiki-Struktur: Gekürzt, mit Inhaltsverzeichnis und Links. Vollständige Beispiele in AGENTS.md verweisen.*
