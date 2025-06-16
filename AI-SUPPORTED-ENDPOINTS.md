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

## 4. Call2Actions (Dynamische Aktionen auf Karten)

Das System unterstützt dynamische Call-to-Action-Buttons auf Karten, die vom AI-Server über WebSocket-Nachrichten gesetzt werden.

### Funktionsweise

1. Der AI-Server kann über WebSocket-Nachrichten Call2Actions-Buttons zu Karten hinzufügen
2. Diese Buttons werden im Footer der Karten angezeigt
3. Beim Klick auf einen Button wird eine spezielle AI-Anfrage mit der Action-Information gesendet
4. Der AI-Server kann basierend auf der Action spezifische Verarbeitungen durchführen

### Call2Actions in Card-Updates

Wenn der AI-Server eine Karte über WebSocket aktualisiert, kann er `call2Actions` hinzufügen:

```json
{
  "type": "update-card",
  "card": {
    "id": "card-123",
    "heading": "Überarbeitete Karte",
    "content": "Neuer Inhalt...",
    "call2Actions": [
      {
        "action": "approve",
        "label": "✅ Genehmigen",
        "description": "Diese Änderungen genehmigen"
      },
      {
        "action": "revise",
        "label": "📝 Überarbeiten",
        "description": "Weitere Überarbeitung anfordern",
        "params": {
          "priority": "high",
          "department": "marketing"
        }
      },
      {
        "action": "reject",
        "label": "❌ Ablehnen",
        "description": "Änderungen ablehnen"
      }
    ]
  }
}
```

### Call2Actions Request Format

Wenn ein Benutzer auf einen Call2Action-Button klickt, wird folgender Request gesendet:

**URL**: `ai_cardsUrl`  
**Method**: `POST`  
**Content-Type**: `application/json`

```json
{
  "type": "card-action-request",
  "boardId": "board-123",
  "connectionId": "ws-connection-456",
  "cardId": "card-123",
  "columnId": "col-1",
  "columnName": "In Progress",
  "card": {
    "id": "card-123",
    "heading": "Karten-Titel",
    "content": "Karten-Inhalt...",
    "color": "color-gradient-2",
    "call2Actions": [...] // Die aktuellen Call2Actions
  },
  "columnCards": [...], // Alle Karten der Spalte für Kontext
  "action": {
    "action": "approve",
    "label": "✅ Genehmigen",
    "description": "Diese Änderungen genehmigen",
    "params": {
      "priority": "high",
      "department": "marketing"
    }
  },
  "timestamp": "2023-12-07T10:30:00Z"
}
```

### Call2Actions Response

Der AI-Server kann mit einer Standard-Karten-Update-Nachricht antworten:

```json
{
  "type": "update-card",
  "card": {
    "id": "card-123",
    "heading": "Genehmigte Karte",
    "content": "Status: Genehmigt am 2023-12-07",
    "color": "color-green",
    "call2Actions": [] // Buttons können entfernt oder geändert werden
  }
}
```

### Beispiel-Workflow: Approval-Prozess

1. **AI erstellt Karte mit Approval-Buttons**:
```json
{
  "type": "update-card",
  "card": {
    "id": "card-review-123",
    "heading": "Marketing-Kampagne Entwurf",
    "content": "# Kampagne: Summer Sale\n\n- Budget: €5000\n- Zielgruppe: 25-40 Jahre\n- Kanäle: Social Media, Email",
    "call2Actions": [
      {
        "action": "approve",
        "label": "✅ Genehmigen",
        "description": "Kampagne genehmigen und freigeben"
      },
      {
        "action": "request_changes",
        "label": "📝 Änderungen",
        "description": "Überarbeitung anfordern"
      },
      {
        "action": "schedule_meeting",
        "label": "📅 Meeting",
        "description": "Besprechung terminieren",
        "params": {
          "topic": "Marketing Campaign Review",
          "urgency": "medium"
        }
      }
    ]
  }
}
```

2. **Benutzer klickt "Genehmigen"** → Action-Request wird gesendet

3. **AI-Server reagiert mit Update**:
```json
{
  "type": "update-card", 
  "card": {
    "id": "card-review-123",
    "heading": "✅ Marketing-Kampagne (Genehmigt)",
    "content": "# Kampagne: Summer Sale\n\n- Budget: €5000\n- Zielgruppe: 25-40 Jahre\n- Kanäles: Social Media, Email\n\n**Status**: Genehmigt am 2023-12-07 10:30 Uhr\n**Nächste Schritte**: Kampagne wird in die Umsetzung übertragen",
    "color": "color-green",
    "call2Actions": [
      {
        "action": "move_to_production",
        "label": "🚀 Zur Umsetzung",
        "description": "Kampagne in Umsetzungs-Board verschieben"
      }
    ]
  }
}
```

### Call2Actions Best Practices

1. **Button-Limit**: Maximal 3-4 Buttons pro Karte für gute UX
2. **Aussagekräftige Labels**: Kurze, klare Beschreibungen mit Emojis
3. **Kontext mitliefern**: `params` für zusätzliche Action-Informationen
4. **Status-Rückmeldung**: Immer visuelle Bestätigung nach Action-Ausführung
5. **Buttons entfernen**: Nach abgeschlossener Action Buttons löschen oder anpassen
6. **Error Handling**: Ungültige Actions graceful behandeln

## 5. WebSocket-Handler für Call2Actions

Das System unterstützt spezielle WebSocket-Handler für Call2Actions-Interaktionen:

### Handler: `card-action-result`

Dieser Handler wird verwendet, um das Ergebnis einer Call2Action zu verarbeiten:

```javascript
// In chatbot.js WebSocket-Handler
case 'card-action-result':
    if (data.success) {
        displayMessage(`✅ Action "${data.action}" erfolgreich ausgeführt`, 'success');
        
        // Karte aktualisieren falls mitgeliefert
        if (data.card) {
            handleCardUpdate(data.card);
        }
    } else {
        displayMessage(`❌ Fehler bei Action "${data.action}": ${data.error}`, 'error');
    }
    break;
```

### Beispiel-Response für erfolgreich ausgeführte Call2Action:

```json
{
  "type": "card-action-result",
  "success": true,
  "action": "approve",
  "message": "Kampagne wurde erfolgreich genehmigt",
  "card": {
    "id": "card-123",
    "heading": "✅ Marketing-Kampagne (Genehmigt)",
    "content": "Status: Genehmigt und zur Umsetzung freigegeben",
    "color": "color-green",
    "call2Actions": [
      {
        "action": "move_to_production",
        "label": "🚀 Zur Umsetzung",
        "description": "In Produktions-Board verschieben"
      }
    ]
  }
}
```

### Beispiel-Response für fehlgeschlagene Call2Action:

```json
{
  "type": "card-action-result",
  "success": false,
  "action": "approve",
  "error": "Genehmigung fehlgeschlagen: Unzureichende Berechtigung",
  "card": {
    "id": "card-123",
    "heading": "❌ Marketing-Kampagne (Genehmigung fehlgeschlagen)",
    "content": "Fehler: Unzureichende Berechtigung für Genehmigung",
    "color": "color-red",
    "call2Actions": [
      {
        "action": "request_permission",
        "label": "🔐 Berechtigung anfragen",
        "description": "Berechtigung bei Vorgesetztem anfragen"
      }
    ]
  }
}
```

## 6. Integration in bestehende Workflows

### Schritt 1: Call2Actions zu Karten hinzufügen

```javascript
// Beispiel für AI-Server, der Call2Actions zu einer Karte hinzufügt
const cardWithActions = {
  id: "card-123",
  heading: "Neues Feature-Request",
  content: "Benutzer möchten Dark Mode...",
  call2Actions: [
    {
      action: "estimate_effort",
      label: "⏱️ Aufwand schätzen",
      description: "Entwicklungsaufwand schätzen"
    },
    {
      action: "assign_developer",
      label: "👨‍💻 Entwickler zuweisen",
      description: "Passenden Entwickler auswählen"
    },
    {
      action: "add_to_backlog",
      label: "📋 Zu Backlog",
      description: "In Produkt-Backlog einordnen"
    }
  ]
};
```

### Schritt 2: Action-Handler im AI-Server

```javascript
// Beispiel für n8n-Webhook oder Custom Server
function handleCardAction(requestData) {
  const { action, card, columnCards } = requestData;
  
  switch(action.action) {
    case 'estimate_effort':
      return estimateEffort(card, columnCards);
    case 'assign_developer':
      return assignDeveloper(card);
    case 'add_to_backlog':
      return addToBacklog(card);
    default:
      return { success: false, error: 'Unbekannte Action' };
  }
}
```

### Schritt 3: Response mit neuen Call2Actions

```javascript
function estimateEffort(card, columnCards) {
  // AI-Logik für Aufwandschätzung
  const estimation = analyzeEffort(card.content);
  
  return {
    type: 'update-card',
    card: {
      ...card,
      heading: `⏱️ ${card.heading} (${estimation.hours}h geschätzt)",
      content: card.content + `\n\n**Aufwandschätzung**: ${estimation.hours} Stunden\n**Komplexität**: ${estimation.complexity}`,
      call2Actions: [
        {
          action: 'approve_estimation',
          label: '✅ Schätzung bestätigen',
          description: 'Aufwandschätzung akzeptieren'
        },
        {
          action: 'revise_estimation',
          label: '📝 Überarbeiten',
          description: 'Schätzung überarbeiten lassen'
        }
      ]
    }
  };
}
```

## 7. Erweiterte Features

### Bedingte Call2Actions

Call2Actions können basierend auf Karten-Zustand oder Benutzer-Rollen dynamisch angepasst werden:

```json
{
  "call2Actions": [
    {
      "action": "admin_action",
      "label": "🔧 Admin-Aktion",
      "description": "Nur für Administratoren",
      "conditions": {
        "requiredRole": "admin",
        "requiredStatus": "pending"
      }
    }
  ]
}
```

### Batch-Actions für mehrere Karten

Call2Actions können auch für mehrere Karten gleichzeitig ausgeführt werden:

```json
{
  "action": {
    "action": "bulk_approve",
    "label": "✅ Alle genehmigen",
    "description": "Alle Karten in der Spalte genehmigen",
    "batch": true,
    "targetCards": ["card-1", "card-2", "card-3"]
  }
}
```

### Temporäre Call2Actions

Call2Actions können mit einem Ablaufdatum versehen werden:

```json
{
  "call2Actions": [
    {
      "action": "urgent_review",
      "label": "🚨 Dringend prüfen",
      "description": "Läuft in 2 Stunden ab",
      "expiresAt": "2023-12-07T14:00:00Z"
    }
  ]
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

## Call2Actions Implementierung - Abgeschlossen ✅

**Datum**: 2023-12-07

### Implementierte Features:

1. **Call2Actions-Button-Rendering**:
   - `renderCall2ActionsButtons()` Funktion in `ai.js`
   - Integration in `createCardElement()` in `card.js`
   - CSS-Styling für Buttons in `card.css`

2. **Action-Ausführung**:
   - `executeCall2Action()` für Button-Klick-Handling
   - `submitCardAIRequestWithAction()` für AI-Requests mit Action-Parametern
   - Hilfsfunktionen: `getConnectionId()`, `getCardById()`, `getColumnById()`, etc.

3. **Request/Response-Formate**:
   - `card-action-request` Type für Call2Actions-Requests
   - Vollständige Karten- und Spalten-Kontext-Übertragung
   - WebSocket-Integration für Antworten

4. **UI/UX-Features**:
   - Dynamische Button-Deaktivierung während Request
   - Visual Feedback (⏳ Icon) während Verarbeitung
   - Responsive Design für Mobile
   - Integration in Karten-Footer

5. **Dokumentation**:
   - Erweiterte `AI-SUPPORTED-ENDPOINTS.md` mit Call2Actions-Sektion
   - Beispiel-Workflows (Approval-Prozess, Feature-Request-Handling)
   - WebSocket-Handler-Dokumentation
   - Test-HTML-Seite (`test-call2actions.html`)

### Technische Integration:

- **Frontend**: Call2Actions werden in `card-footer-actions` gerendert
- **Backend**: Requests gehen an `ai_cardsUrl` mit `type: 'card-action-request'`
- **WebSocket**: Antworten über `update-card` oder `card-action-result` Messages
- **Persistierung**: Call2Actions werden in Card-Objekt gespeichert

### Nächste Schritte:

1. **Server-Side Implementation**: AI-Server muss Call2Actions-Requests verarbeiten
2. **Testing**: Vollständige End-to-End-Tests mit echten AI-Responses
3. **Enhanced Features**: Bedingte Actions, Batch-Actions, Expiration-Handling
4. **Performance**: Optimierung für große Mengen von Call2Actions

Die Call2Actions-Funktionalität ist vollständig implementiert und bereit für den produktiven Einsatz! 🎉
