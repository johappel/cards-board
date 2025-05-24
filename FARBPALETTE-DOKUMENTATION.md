# Kanban Board - Farbpalette Feature

## Übersicht der Änderungen

### ✅ Implementierte Features

**1. Neue Farbpalette für Cards und Columns**
- 10 vordefinierte Farbverläufe als runde Buttons
- Sofortige Live-Vorschau ohne Speichern
- Intuitive Auswahl durch Klick

**2. Entfernte Funktionen**
- Color-Picker Input-Felder entfernt
- Custom CSS aus Card/Column-Settings entfernt
- Custom CSS bleibt nur in Board-Settings verfügbar

### 🎨 Verfügbare Farbverläufe

1. **Purple Blue**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
2. **Pink Red**: `linear-gradient(135deg, #f093fb 0%, #f5576c 100%)`
3. **Blue Cyan**: `linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)`
4. **Green Mint**: `linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)`
5. **Pink Yellow**: `linear-gradient(135deg, #fa709a 0%, #fee140 100%)`
6. **Soft Pastel**: `linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)`
7. **Orange Peach**: `linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)`
8. **Coral Pink**: `linear-gradient(135deg, #ff8a80 0%, #ea4c89 100%)`
9. **Ice Blue**: `linear-gradient(135deg, #b2fefa 0%, #0ed2f7 100%)`
10. **Default White**: `linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)`

### 🔧 Technische Details

**Datenmodell-Änderungen:**
- `card.color` → `card.background` (Gradient statt einfache Farbe)
- `column.color` → `column.background` (Gradient statt einfache Farbe)
- Entfernt: `card.customStyle`, `column.customStyle`

**Neue JavaScript-Methoden:**
- `setupColorPalette(paletteId, hiddenInputId, updateCallback)`
- `setSelectedColorInPalette(paletteId, selectedBackground)`
- `createCardPreview()` / `createColumnPreview()`
- `updateCardPreview()` / `updateColumnPreview()`

**CSS-Klassen:**
- `.color-palette` - Container für Farbbuttons
- `.color-option` - Einzelne Farbbuttons
- `.color-option.selected` - Ausgewählter Zustand
- `.preview-card` / `.preview-column` - Live-Vorschau-Bereiche

### 🚀 Benutzung

1. **Card bearbeiten**: Klick auf ⋮ Button → Farbpalette auswählen → Live-Vorschau → Speichern
2. **Column bearbeiten**: Klick auf ⋮ → Settings → Farbpalette auswählen → Live-Vorschau → Speichern
3. **Board-CSS**: Weiterhin über Board Settings → Custom CSS verfügbar

### 📱 Browser-Kompatibilität

- ✅ Chrome/Edge (vollständig unterstützt)
- ✅ Firefox (vollständig unterstützt)  
- ✅ Safari (vollständig unterstützt)
- ⚠️ IE11 (Gradients funktionieren, aber ohne CSS Grid)

### 🔮 Zukünftige Erweiterungen

- Custom Gradient Builder
- Farbthemen (Dark Mode, High Contrast)
- Team-Farbpaletten
- Farbzugänglichkeit (WCAG-Konformität)
- Import/Export von Farbschemata

---

*Letzte Aktualisierung: Mai 2025*
