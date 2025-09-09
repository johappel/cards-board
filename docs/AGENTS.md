# AGENTS — Formate, Bezeichner, Strukturen und Regeln für Contributor

**Letzte Aktualisierung:** 2025-09-09

Dieses Dokument fasst die wichtigsten Datenformate, Bezeichner, Schnittstellen-Contracts und Arbeitsregeln zusammen, damit Contributor konsistent am Code und an den AI-Integrationen weiterarbeiten können. Nutze dieses Dokument als „Styleguide“ / Contract-Layer für Integrationen (AI, n8n, WebSocket, Nostr). Verweise auf detaillierte Endpoint-Beschreibungen: [`docs/AI-SUPPORTED-ENDPOINTS.md:1`](docs/AI-SUPPORTED-ENDPOINTS.md:1), Implementierungsübersichten: [`docs/BOARD-SUMMARY-IMPLEMENTATION.md:1`](docs/BOARD-SUMMARY-IMPLEMENTATION.md:1) und Nostr: [`docs/NOSTR-INTEGRATION.md:1`](docs/NOSTR-INTEGRATION.md:1).

## 1. Ziel
Sicherstellen, dass:
- alle externen Integrationen eine einheitliche Payload-Struktur erwarten,
- IDs, Typen und Feldnamen stabil und dokumentiert sind,
- neue Contributor schnell korrekte Requests/Responses implementieren können.

## 2. Allgemeine Regeln (Naming / Style)
- JSON-Feldnamen: camelCase (z. B. `boardId`, `connectionId`, `cardId`).
- IDs: Präfix + zufälliger String, z. B. `board-123`, `col-456`, `card-789`.
- Timestamps: ISO 8601 UTC, z. B. `2025-06-15T12:34:56.789Z`.
- Typ-Felder: string Literal unter `type` (kleinbuchstabig, kebab-like für multi-word), z. B. `card-ai-request`, `update-card`.
- Optional-Felder immer weglassbar — niemals null als semantisches Feld (außer explizit dokumentiert).
- Booleans: true/false (kein String).

Beispiel-IDs:
- Board: `board-<slug-or-random>`
- Column: `col-<id>`
- Card: `card-<id>`

## 3. Kerndatenstrukturen (Schemas)
Alle Formate sind JSON-serialisierbar. Verwende im Code TypeScript-Interfaces oder JSDoc-Typen, um Konsistenz zu gewährleisten.

Card (TypeScript-Interface):
```typescript
interface Card {
  id: string;
  heading: string;
  content: string;
  color: string;
  thumbnail?: string;
  comments?: string;
  url?: string;
  labels?: string; // comma separated
  inactive?: boolean;
  expanded?: boolean;
  call2Actions?: Array<{
    action: string;
    label: string;
    description?: string;
    params?: Record<string, any>;
    expiresAt?: string; // ISO 8601
  }>;
}
```

Column:
```typescript
interface Column {
  id: string;
  name: string;
  cards: Card[];
  color?: string;
}
```

BoardContext:
```typescript
interface BoardContext {
  name: string;
  summary?: string;
}
```

(Siehe vollständige Beispiele in [`docs/AI-SUPPORTED-ENDPOINTS.md:696`](docs/AI-SUPPORTED-ENDPOINTS.md:696)).

## 4. Endpoint-Contracts (Kurzreferenz)
- Chatbot (POST → `ai_n8nAgentWebhookUrl`):
  - Required: `chatInput`, `boardId`, `connectionId`
  - Optional: `boardData`, `timestamp`
  - Response über WebSocket: verschiedene `type`-Messages (`final_answer`, `suggestions`, `column`, `cards`, `summary`)

- Column AI (POST → `ai_columnsUrl`):
  - Request `type`: `column-ai-request`
  - Required: `connectionId`, `columnName`, `cards[]`
  - Response (via WS): `type: "update-cards"`

- Card AI (POST → `ai_cardsUrl`):
  - Request `type`: `card-ai-request`
  - Required: `card`, `cardId`, `columnId`, `connectionId`
  - Response (via WS): `type: "update-card"`

- Call2Actions:
  - Request `type`: `card-action-request` (siehe [`docs/AI-SUPPORTED-ENDPOINTS.md:330`](docs/AI-SUPPORTED-ENDPOINTS.md:330))
  - Response: HTTP 200 + { success: true/false } immediately; actual card update may come async via WebSocket.

Details & Beispiele: [`docs/AI-SUPPORTED-ENDPOINTS.md:21`](docs/AI-SUPPORTED-ENDPOINTS.md:21)

## 5. WebSocket-Konventionen
- Beim Verbindungsaufbau sendet Server eine Welcome-Nachricht:
  ```json
  { "type": "welcome", "connectionId": "unique-connection-id-123" }
  ```
- Alle HTTP-Requests an AI-Endpoints müssen die aktuelle `connectionId` enthalten, damit der AI-Server Antworten an die richtige WS-Connection senden kann.
- Error-Message-Format:
  ```json
  { "type": "error", "message": "Beschreibung", "code": "ERROR_CODE" }
  ```

## 6. Call2Actions Contract
- call2Actions: Array in Card-Objekt
- Element:
  - `action`: string (identifier)
  - `label`: string (UI-Text)
  - `description?`: string
  - `params?`: object
  - `expiresAt?`: ISO 8601
- UI-Regeln:
  - Maximal 3-4 Buttons pro Karte.
  - Buttons deaktivieren während eines laufenden Requests.
- Server-Response: zuerst HTTP 200 + `{ success: true }`, dann asynchron WS `update-card` mit aktualisiertem `call2Actions`.

Beispiel in docs: [`docs/AI-SUPPORTED-ENDPOINTS.md:290`](docs/AI-SUPPORTED-ENDPOINTS.md:290)

## 7. Validierung & Defensive Coding
- Server-seitig: Validiere required fields, ID-Formate und timestamp-Format.
- Client-seitig: Prüfe `success`-Felder in HTTP-Responses; handle WS `error`-Messages gracefully.
- Bei fehlenden optionalen Feldern: Fallbacks nutzen (z. B. leere Strings, leere Arrays).

## 8. Backwards Compatibility Regeln
- Neue Felder dürfen hinzugefügt werden, solange:
  - sie optional sind,
  - bekannte Konsumenten nicht zwingend auf sie angewiesen werden.
- Entferne niemals ein Feld; deprezierte Felder markieren und 2 Releases später entfernen (mit Ankündigung).

## 9. Tests & Debugging Hinweise
- Lokale Tests: `python -m http.server 5500` und Browser öffnen auf `kanban.html`.
- WS-Debugging: Öffne Browser-Konsole und Network → WS, beobachte `welcome` und `update-*` Nachrichten.
- Unit-Tests: Für JS-Utilities (ID-Parsing, Payload-Builder) empfehlen wir einfache Jest-Tests (falls Projekt später build-tooling erhält).

## 10. Contribution Rules (Docs + Code)
- Docs: Jede Änderung an API-Contracts dokumentieren in `docs/` (neuen Abschnitt oder Revision mit Datum).
- Code: Schreibe sprechende Commit-Messages, versioniere breaking-changes.
- PRs: Include example requests/responses in PR description.
- Formatting: JSON-Examples in docs immer validieren (JSONLint).

## 11. Quick Reference: Feld- und Typen-Liste
- `boardId` (string)
- `columnId` (string)
- `cardId` (string)
- `connectionId` (string)
- `type` (string) — Message/Request Type
- `timestamp` (string, ISO 8601)
- `labels` (string, comma separated)
- `call2Actions` (array)

## 12. Beispiele (Kurz)
Chatbot-Request (gekürzt):
```json
{
  "chatInput": "Bitte fasse das Board zusammen",
  "boardId": "board-123",
  "connectionId": "ws-abc",
  "timestamp": "2025-06-15T12:34:56.789Z"
}
```

Card-Update (WS):
```json
{
  "type": "update-card",
  "cardId": "card-456",
  "card": {
    "id":"card-456",
    "heading":"Neuer Titel",
    "content":"Inhalt...",
    "color":"color-gradient-2",
    "labels":"design,frontend"
  }
}
```

## 13. Wo nachschlagen
- Endpoints & Beispiele: [`docs/AI-SUPPORTED-ENDPOINTS.md:1`](docs/AI-SUPPORTED-ENDPOINTS.md:1)
- Call2Actions-Workflows: [`docs/AI-SUPPORTED-ENDPOINTS.md:376`](docs/AI-SUPPORTED-ENDPOINTS.md:376)
- Nostr-Integration: [`docs/NOSTR-INTEGRATION.md:1`](docs/NOSTR-INTEGRATION.md:1)
- Board-Summary: [`docs/BOARD-SUMMARY-IMPLEMENTATION.md:1`](docs/BOARD-SUMMARY-IMPLEMENTATION.md:1)

---

Dieses Dokument ist die zentrale Referenz für Integrationen. Änderungen an Contracts müssen in `docs/` ergänzt werden und Versionshinweise erhalten.