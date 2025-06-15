# AI-Supported Endpoints Documentation

Dieses Dokument beschreibt die AI-unterstützten HTTP-Endpoints und WebSocket-Response-Formate für das Kanban Board System.

## Übersicht

Das System unterstützt drei Haupttypen von AI-Operationen:
1. **Chatbot-Interaktionen** - Allgemeine Konversation und Board-Verwaltung
2. **Column AI** - Verarbeitung ganzer Spalten mit mehreren Karten
3. **Card AI** - Verarbeitung einzelner Karten

## Endpoint-Konfiguration

Die AI Endpoints für den AI Support werden in den globalen Einstellungen konfiguriert:
- `ai_websocketUrl` - WebSocket-Verbindung für Antworten (server.js als Beispiel)
- `ai_n8nAgentWebhookUrl` - Chatbot-Endpoint für allgemeine Interaktionen
- `ai_columnsUrl` - Column AI-Endpoint für Spalten-Verarbeitung
- `ai_cardsUrl` - Card AI-Endpoint für Karten-Verarbeitung
Der **n8n_example_chatbot_endpoint.json Workflow** zeigt, wie der AI-Support über n8n einfach oder beliebig komplex realisiert werden kann.

## 1. Chatbot Endpoint

### Request Format
**URL**: `ai_n8nAgentWebhookUrl`  
**Method**: `POST`  
**Content-Type**: `application/json`

```json
{
  "chatInput": "Benutzer-Nachricht",
  "boardId": "board-123",
  "connectionId": "ws-connection-456",
  "boardData": {
    "id": "board-123",
    "name": "Projekt Alpha",
    "summary": "Board-Zusammenfassung",
    "columns": [
      {
        "id": "col-1",
        "name": "To Do",
        "cards": [
          {
            "id": "card-1",
            "heading": "Aufgabe 1",
            "content": "Beschreibung der Aufgabe",
            "color": "color-gradient-1",
            "url": "",
            "labels": "",
            "comments": ""
          }
        ]
      }
    ]
  },
  "timestamp": "2025-06-15T12:34:56.789Z"
}
```

### WebSocket Response Optionen

#### 1. Textantwort
```json
{
  "type": "final_answer",
  "text": "Antwort des AI-Assistenten",
  "message": "Alternative Nachricht"
}
```

#### 2. Vorschläge
```json
{
  "type": "suggestions",
  "suggestions": [
    "Vorschlag 1",
    "Vorschlag 2", 
    "Vorschlag 3"
  ]
}
```

#### 3. Denkprozess anzeigen
```json
{
  "type": "thinking",
  "message": "AI denkt über das Problem nach...",
  "label": "Analysiere Board-Struktur"
}
```

#### 4. Neue Spalte mit Karten erstellen
```json
{
  "type": "column",
  "column": "Neue Spalte",
  "cards": [
    {
      "heading": "Karten-Titel",
      "content": "Karten-Inhalt",
      "color": "color-gradient-1",
      "url": "",
      "labels": "label1, label2",
      "comments": ""
    }
  ]
}
```

#### 5. Karten zu bestehender Spalte hinzufügen
```json
{
  "type": "cards",
  "column": "Bestehende Spalte",
  "cards": [
    {
      "heading": "Neuer Titel",
      "content": "Neuer Inhalt"
    }
  ]
}
```

#### 6. Board-Summary aktualisieren
```json
{
  "type": "summary",
  "text": "Neue Board-Zusammenfassung",
  "summary": "Alternative Summary"
}
```

## 2. Column AI Endpoint

### Request Format
**URL**: `ai_columnsUrl`  
**Method**: `POST`  
**Content-Type**: `application/json`

```json
{
  "type": "column-ai-request",
  "connectionId": "ws-connection-456",
  "columnName": "In Bearbeitung",
  "chatInput": "Ergänze fehlende Details in allen Karten dieser Spalte",
  "cards": [
    {
      "id": "card-1",
      "heading": "Website Design",
      "content": "Erste Entwürfe",
      "color": "color-gradient-1",
      "thumbnail": "",
      "comments": "",
      "url": "",
      "labels": "",
      "inactive": false
    },
    {
      "id": "card-2", 
      "heading": "API Integration",
      "content": "REST API implementieren",
      "color": "color-gradient-1",
      "thumbnail": "",
      "comments": "",
      "url": "",
      "labels": "",
      "inactive": false
    }
  ],
  "boardContext": {
    "name": "Projekt Alpha",
    "summary": "Entwicklung einer neuen Website"
  },
  "timestamp": "2025-06-15T12:34:56.789Z"
}
```

**Optionale Felder:**
- `boardContext`: Board-Name und Summary (nur wenn Board-Kontext aktiviert)

### WebSocket Response
```json
{
  "type": "update-cards",
  "columnName": "In Bearbeitung",
  "columnId": "col-123",
  "connectionId": "ws-connection-456",
  "cards": [
    {
      "id": "card-1",
      "heading": "Website Design - Responsives Layout",
      "content": "Erste Entwürfe für Homepage\n\n## Details:\n- Mobile-first Ansatz\n- Responsive Grid Layout\n- Barrierefreiheit beachten",
      "color": "color-gradient-1",
      "comments": "Designsystem beachten",
      "url": "https://happel.design/design-link",
      "labels": "design, frontend, urgent"
    },
    {
      "id": "card-2",
      "heading": "API Integration - REST & GraphQL",
      "content": "REST API implementieren\n\n## Aufgaben:\n- Endpunkt-Design\n- Authentifizierung\n- Rate Limiting\n- Dokumentation",
      "comments": "Backend-Team koordinieren",
      "labels": "backend, api"
    }
  ]
}
```

## 3. Card AI Endpoint

### Request Format  
**URL**: `ai_cardsUrl`  
**Method**: `POST`  
**Content-Type**: `application/json`

```json
{
  "type": "card-ai-request",
  "boardId": "board-123",
  "connectionId": "ws-connection-456",
  "cardId": "card-456",
  "columnId": "col-789",
  "columnName": "In Bearbeitung",
  "chatInput": "Erstelle eine detaillierte To-Do-Liste für diese Aufgabe",
  "card": {
    "id": "card-456",
    "heading": "Website Design",
    "content": "Erste Entwürfe für Homepage",
    "color": "color-gradient-1",
    "thumbnail": "",
    "comments": "",
    "url": "",
    "labels": "",
    "inactive": false,
    "expanded": false
  },
  "columnCards": [
    {
      "id": "card-456",
      "heading": "Website Design"
    },
    {
      "id": "card-789", 
      "heading": "API Integration"
    }
  ],
  "boardContext": {
    "name": "Projekt Alpha",
    "summary": "Entwicklung einer neuen Website"
  },
  "timestamp": "2025-06-15T12:34:56.789Z"
}
```

**Optionale Felder:**
- `columnCards`: Array aller Karten in der Spalte (nur wenn Spalten-Kontext aktiviert)
- `boardContext`: Board-Name und Summary (nur wenn Board-Kontext aktiviert)

### WebSocket Response
```json
{
  "type": "update-card",
  "cardId": "card-456",
  "columnId": "col-789",
  "card": {
    "id": "card-456",
    "heading": "Website Design - Responsives Layout",
    "content": "Erste Entwürfe für Homepage\n\n## To-Do-Liste:\n\n- [ ] Wireframes erstellen\n- [ ] Design-System definieren\n- [ ] Mobile Layouts entwerfen\n- [ ] Desktop Layouts erstellen\n- [ ] Prototyp in Figma\n- [ ] Stakeholder-Review\n- [ ] Finales Design approval",
    "color": "color-gradient-2",
    "labels": "design, frontend, urgent"
  }
}
```

## WebSocket-Verbindung

### Verbindungsaufbau
Das System verbindet sich automatisch zum konfigurierten `ai_websocketUrl`. Bei erfolgreicher Verbindung sendet der Server:

```json
{
  "type": "welcome",
  "connectionId": "unique-connection-id-123"
}
```

Diese `connectionId` wird bei **allen** HTTP-Requests an die Endpoints mitgesendet, damit der Server weiß, über welche WebSocket-Verbindung die Antwort gesendet werden soll.

⚠️ **Wichtig**: Ohne gültige `connectionId` können keine WebSocket-Antworten zugestellt werden!

### Connection-ID Verwaltung
- Die `connectionId` wird pro Board gespeichert und verwaltet
- Bei Verbindungsverlusten wird eine neue `connectionId` generiert
- Alle AI-Requests enthalten die aktuelle `connectionId` des Boards

### Heartbeat
Das System sendet alle 30 Sekunden Ping-Nachrichten zur Verbindungsüberwachung.

### Automatische Wiederverbindung
Bei Verbindungsverlusten erfolgt automatische Wiederverbindung nach 3 Sekunden.

## Fehlerbehandlung

### HTTP-Fehler
Bei Fehlern in den HTTP-Requests werden entsprechende Fehlermeldungen in der UI angezeigt.

### WebSocket-Fehler  
```json
{
  "type": "error",
  "message": "Fehlerbeschreibung",
  "code": "ERROR_CODE"
}
```

### Unbekannte Nachrichten
Alle unbekannten WebSocket-Nachrichten werden im Chatbot-Modal als System-Nachricht angezeigt.

## Implementierungshinweise

### Kartenstruktur
Alle Karten folgen diesem Schema:
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

## Beispiel-Implementierung (Node.js/n8n)

### Column AI Webhook
```javascript
// Empfange Column AI Request
const { type, connectionId, columnName, chatInput, cards, boardContext } = $input.json;

if (type === 'column-ai-request') {
  // Verarbeite Karten mit AI
  const processedCards = await processCardsWithAI(cards, chatInput, boardContext);
  
  // Sende Response über WebSocket an spezifische Connection
  await sendWebSocketMessage(connectionId, {
    type: 'update-cards',
    columnName: columnName,
    cards: processedCards,
    exportDate: new Date().toISOString()
  });
}
```

### Card AI Webhook  
```javascript
// Empfange Card AI Request
const { type, connectionId, cardId, columnId, card, chatInput, boardContext } = $input.json;

if (type === 'card-ai-request') {
  // Verarbeite einzelne Karte mit AI
  const processedCard = await processCardWithAI(card, chatInput, boardContext);
  
  // Sende Response über WebSocket an spezifische Connection
  await sendWebSocketMessage(connectionId, {
    type: 'update-card',
    cardId: cardId,
    columnId: columnId,
    card: processedCard
  });
}
```

## Best Practices

1. **Eindeutige IDs**: Stellen Sie sicher, dass alle `cardId`, `columnId` und `boardId` eindeutig sind
2. **Zeitstempel**: Nutzen Sie Timestamps für Reihenfolge und Debugging
3. **Graceful Degradation**: Fallback bei WebSocket-Fehlern implementieren
4. **Validation**: Validieren Sie alle eingehenden Payloads
5. **Rate Limiting**: Implementieren Sie Rate Limiting für AI-Requests
6. **Logging**: Loggen Sie alle AI-Operationen für Debugging

## Debugging

### Client-seitig
- Öffnen Sie die Browser-Konsole für WebSocket-Nachrichten
- Überprüfen Sie die Network-Registerkarte für HTTP-Requests
- AI-Benachrichtigungen zeigen Status-Updates

### Server-seitig
- server.js oder anderen websocket server installieren
- n8n_example_chatbot_endpoint.json dient als Einstieg für alle drei Entdpoints
- Logge alle eingehenden Requests mit Zeitstempel
- Überwache WebSocket-Verbindungen

---

**Version**: 1.0  
**Letzte Aktualisierung**: 15. Juni 2025  
**Kompatibilität**: Kanban Board System v2.0+
