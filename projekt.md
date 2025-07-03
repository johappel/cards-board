# Projektantrag: Open-Source Kanban-Like Editor

## 1. Vision und Projektziel

Dieses Projekt zielt auf die Entwicklung eines hochgradig anpassbaren, datenschutzfreundlichen und interoperablen Kanban-ähnlichen Editors ab. Im Gegensatz zu traditionellen, Cloud-zentrierten Projektmanagement-Tools verfolgt dieser Editor einen **Local-First-Ansatz**. Alle Daten werden primär im Browser des Benutzers gespeichert, was ihm die volle Kontrolle und Souveränität über seine Informationen gibt.

Das Kernziel ist die Schaffung eines flexiblen Werkzeugs, das nicht nur für klassisches Projektmanagement, sondern auch als persönliche Wissensdatenbank, für kreative Brainstormings oder zur Erstellung von Lerninhalten dient. Durch offene Standards und konfigurierbare Schnittstellen soll eine maximale Interoperabilität und Erweiterbarkeit gewährleistet werden.

## 2. Kernphilosophie und Architektur

### 2.1. Datensouveränität (Local-First)
- **Speicherort:** Alle Boards, Spalten und Karten werden ausschließlich im `localStorage` des Webbrowsers gespeichert. Es gibt keine zentrale Server-Datenbank, die Benutzerdaten sammelt.
- **Sicherheit:** Der Benutzer behält die volle Kontrolle über seine Daten. Ein Export ist jederzeit möglich, um Backups zu erstellen oder Daten zu migrieren.

### 2.2. Interoperabilität und Offenheit
- **Datenformate:** Der Im- und Export von Boards basiert auf dem universellen **JSON-Format**. Inhalte innerhalb der Karten werden als **Markdown** gespeichert, was eine einfache Weiterverarbeitung in anderen Systemen ermöglicht.
- **Teilen via Nostr:** Eine tief integrierte Sharing-Funktion über das dezentrale **Nostr-Protokoll** ermöglicht es Benutzern, Boards sicher und zensurresistent zu teilen, ohne auf einen zentralen Dienst angewiesen zu sein. Der Austausch erfolgt über `nevent`-Links, die sowohl die Event-ID als auch empfohlene Relays enthalten.
- **Anschlussfähigkeit:** Das System ist darauf ausgelegt, in beliebige andere Formate und Plattformen exportiert zu werden. Beispielsweise können die strukturierten Markdown- und JSON-Daten leicht in interaktive Online-Kurse (z.B. mit [LiaScript](https://liascript.github.io/)) oder andere Dokumentationen umgewandelt werden.

### 2.3. Technische Architektur
- **Sprachen:** Das Projekt basiert vollständig auf Web-Standardtechnologien: **HTML5, CSS3 und JavaScript (Vanilla JS)**.
- **Abhängigkeiten:** Es werden gezielt leichtgewichtige Bibliotheken für spezifische Aufgaben eingesetzt (z.B. für die Markdown-zu-HTML-Konvertierung oder die Nostr-Kommunikation).
- **Modularität:** Der Code ist klar in Funktionsmodule gegliedert (`storage.js`, `board.js`, `card.js`, `drag_drop.js`, `import_export.js`, `share_via_nostr.js`, `onpaste.js`, `ai.js`), was die Wartbarkeit und Erweiterbarkeit verbessert.

## 3. Implementierte Features

### 3.1. Board- und Content-Management
- **Dashboard:** Eine zentrale Übersicht zur Verwaltung mehrerer Boards.
- **Drag & Drop:** Intuitives Verschieben von Karten (innerhalb und zwischen Spalten) und von Spalten selbst.
- **WYSIWYG-Editor:** Ein in das Karten-Modal integrierter Rich-Text-Editor (basierend auf Quill.js) erleichtert die Inhaltserstellung.
- **On-Paste-Funktionalität:** Eine hochentwickelte "Einfügen"-Funktion, die automatisch verschiedene Inhaltstypen erkennt und verarbeitet:
    - **Text & Markdown:** Wird direkt eingefügt.
    - **HTML-Inhalt:** Wird automatisch in sauberes Markdown konvertiert.
    - **Bilder (Screenshots):** Werden in Base64 umgewandelt und direkt als Bild in die Karte eingebettet.
    - **URLs:** Werden intelligent analysiert. Bild-URLs werden zu Markdown-Bildern, YouTube-Links zu einbettbaren Videos und allgemeine Links zu formatierten Links mit Seitentitel.

### 3.2. KI-Integration und Erweiterbarkeit
- **Frei konfigurierbare Endpoints:** Der Benutzer kann in den Einstellungen eigene Endpoints für KI-Dienste oder Automatisierungsworkflows hinterlegen. Dies unterstützt sowohl Standard-LLM-Provider als auch benutzerdefinierte Systeme wie **n8n**.
- **KI-gestützte Content-Erstellung:**
    - **Karten-Generierung:** Per Knopfdruck können basierend auf einem Prompt und dem Kontext der Spalte oder des gesamten Boards neue Karten erstellt werden.
    - **Karten-Editierung:** Bestehende Karten können durch KI-Prompts überarbeitet, zusammengefasst oder erweitert werden.
    - **Spalten-Analyse:** Eine KI-Funktion kann den gesamten Inhalt einer Spalte analysieren, um z.B. neue Karten vorzuschlagen, Zusammenfassungen zu erstellen oder Inhalte zu clustern.
- **Call2Actions:** Ein dynamisches Aktionssystem ermöglicht es, KI-generierte Buttons auf Karten zu platzieren. Ein Klick auf einen solchen Button sendet eine Anfrage an den konfigurierten Workflow-Endpoint (z.B. n8n) und kann komplexe Aktionen auslösen (z.B. "Erstelle eine Zusammenfassung dieser Karte", "Übersetze diesen Text", "Generiere passende Hashtags").

### 3.3. Import, Export und Sharing
- **JSON Export/Import:** Einfaches Sichern und Wiederherstellen von einzelnen Boards oder dem gesamten Workspace.
- **Nostr-Integration:**
    - **Schlüsselgenerierung & -verwaltung:** Benutzer können ihre Nostr-Schlüssel direkt in der Anwendung generieren oder importieren.
    - **Dezentrales Teilen:** Boards können als "Long-Form Content" (Kind 30023) auf dem Nostr-Netzwerk veröffentlicht werden.
    - **Einfacher Import:** Über einen `nevent`-Link kann jeder ein geteiltes Board mit einem Klick importieren, ohne dass eine zentrale Instanz involviert ist.

## 4. Projektstatus und Ausblick

Der Editor hat den Proof-of-Concept-Status weit hinter sich gelassen und verfügt über ein robustes Set an Kernfunktionen, die die ursprüngliche Vision von Datensouveränität und Flexibilität untermauern.

Als Open-Source-Projekt sind die nächsten Schritte:
1.  **Community-Aufbau:** Veröffentlichung auf Plattformen wie GitHub, um Entwickler und Nutzer zur Mitarbeit zu motivieren.
2.  **Dokumentation:** Ausführliche Dokumentation der API, der Konfigurationsmöglichkeiten und der n8n-Workflow-Beispiele.
3.  **Erweiterung der Plugin-Architektur:** Schaffung eines formalisierten Plugin-Systems, um Drittanbietern die Entwicklung eigener Erweiterungen zu erleichtern.
4.  **Weitere Export-Formate:** Implementierung von direkten Export-Funktionen in Formate wie PDF oder interaktive HTML-Präsentationen.

Dieses Projekt bietet eine einzigartige Alternative im Bereich der Produktivitäts-Tools und hat das Potenzial, einen neuen Standard für benutzergesteuerte, interoperable Software zu setzen.
