# Nostr Integration für Kanban Board

## Übersicht

Die Nostr-Integration ermöglicht es, Kanban-Boards als Nostr-Events zu veröffentlichen und zu teilen. Die Implementierung nutzt **NIP-23 Long-form Content (Kind 30023)** für veröffentlichte Boards und **Kind 30024** für Entwürfe.

## Features

### ✅ Implementiert

1. **Board Publishing**
   - Boards als Nostr-Events veröffentlichen
   - Unterstützung für Draft-Modus (Kind 30024)
   - Mehrere Relay-Server
   - Erfolgs-/Fehlerbenachrichtigungen

2. **Board Import**
   - Import über URL-Parameter: `?import=nevent1...`
   - Automatische Board-Erkennung
   - Konfliktvermeidung durch neue IDs

3. **Schlüsselverwaltung**
   - Generierung neuer Schlüsselpaare
   - Lokale Speicherung (optional)
   - Bech32-Format (nsec/npub)

4. **UI Integration**
   - Modal-Dialog für Nostr-Einstellungen
   - Sidebar-Integration
   - Responsives Design

### 🔧 Technische Details

**Nostr Event Structure:**
```json
{
  "kind": 30023,
  "content": "{Board JSON}",
  "tags": [
    ["title", "Board Name"],
    ["summary", "Board Summary"],
    ["t", "kanban"],
    ["t", "board"],
    ["client", "Kanban Board App"]
  ]
}
```

**Default Relays:**
- wss://relay.damus.io
- wss://relay.nostr.band
- wss://nos.lol

## Verwendung

### 1. Board Veröffentlichen

1. **Sidebar öffnen** → "Via Nostr Teilen"
2. **Schlüssel konfigurieren:**
   - Bestehende nsec/npub eingeben ODER
   - "Neue Schlüssel Generieren" klicken
3. **Relay-Server** konfigurieren (optional)
4. **"Jetzt Veröffentlichen"** klicken
5. **Link kopieren** und teilen

### 2. Board Importieren

**Automatisch:**
- URL mit `?import=nevent1...` öffnen
- Board wird automatisch importiert

**Manuell:**
- Programmcode kann `importBoardFromNostr(nevent)` aufrufen

### 3. Beispiel URLs

```
http://localhost:5500/kanban.html?import=nevent1eyJldmVudElkIjoiYWJjMTIzIiwicmVsYXlzIjpbIndzcy8vcmVsYXkuZGFtdXMuaW8iXX0=
```

## Dateien

- **`share_via_nostr.js`** - Hauptfunktionalität
- **`share_via_nostr.css`** - Styling
- **`kanban.html`** - UI-Integration

## Sicherheit

⚠️ **Wichtige Hinweise:**

1. **Vereinfachte Kryptographie**: Die aktuelle Implementierung verwendet vereinfachte Hash-Funktionen statt secp256k1
2. **Produktionsreife**: Für Produktionsumgebungen sollte eine echte secp256k1-Bibliothek verwendet werden
3. **Schlüsselsicherheit**: Private Schlüssel werden nur lokal gespeichert

## Entwicklung

### Verbesserungsmöglichkeiten

1. **Echte secp256k1-Integration**
   ```javascript
   // TODO: Replace with real secp256k1 library
   import * as secp256k1 from '@noble/secp256k1';
   ```

2. **NIP-19 korrekte Implementierung**
   - Bech32-Encoding nach Standard
   - Korrekte nevent-Struktur

3. **Erweiterte Features**
   - Board-Updates (replaceable events)
   - Verschlüsselte Private Boards
   - Multi-Author Support

4. **Error Handling**
   - Retry-Mechanismus für Relays
   - Bessere Fehlerberichterstattung
   - Offline-Support

## Testing

```bash
# Server starten
cd f:\code\cards-board
python -m http.server 5500

# Browser öffnen
http://localhost:5500/kanban.html
```

**Test-Schritte:**
1. Board erstellen
2. Sidebar → "Via Nostr Teilen"
3. Neue Schlüssel generieren
4. Board veröffentlichen
5. Link kopieren und in neuem Tab testen
