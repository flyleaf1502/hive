# Race-/Class-Kombinationen für WoW Forever

Geprüft am 14.09.2026, Stand der BlizzCon-Ankündigungen vor dem Betastart. HIVE spielt Horde.

| Race | Auswählbare Classes |
| --- | --- |
| Orc | Warrior, Hunter, Rogue, Shaman, Mage, Warlock |
| Troll | Warrior, Hunter, Rogue, Priest, Shaman, Mage, Warlock |
| Tauren | Warrior, Hunter, Shaman, Druid |
| Undead | Warrior, Paladin, Rogue, Priest, Mage, Warlock |
| Skyborne (Horde) | Warrior, Hunter, Rogue, Shaman, Druid |

„Noch nicht sicher“ bleibt für Race und Class möglich. Bei offener Race sind alle neun Horde-Classes auswählbar. Race oder Class können zuerst gewählt werden. Alle Kacheln bleiben sichtbar; inkompatible Optionen werden in beiden Richtungen ausgegraut und deaktiviert. Ein Wechsel zu einer kompatiblen Race erhält Class und Spec. „Auswahl zurücksetzen“ gibt alle Race-/Class-Optionen wieder frei und leert den Spec; andere Formularangaben bleiben erhalten. Eine beim Laden eines alten Eintrags inkompatible Class/Spec wird zur erneuten Auswahl geleert.

Bestehende, inzwischen ungültige Kombinationen bleiben gespeichert. Beim Bearbeiten wird eine passende Class/Spec verlangt; es wird nichts automatisch gespeichert oder gelöscht. Die neue Datenbank-Constraint wird mit `NOT VALID` angelegt und prüft neue sowie geänderte Zeilen einschließlich Admin-Änderungen. Öffentliche Felder und Zugriffsrechte auf Teilnehmerdaten bleiben unverändert.

## Quellen

- [Blizzard: Deep Dive Panel Recap](https://worldofwarcraft.blizzard.com/en-us/news/24303313/world-of-warcraft-forever-deep-dive-panel-recap): Orc/Mage, Troll/Warlock und Undead/Paladin zusätzlich zu den bisherigen Classic-Kombinationen.
- [Blizzard: What’s Next Panel Recap](https://news.blizzard.com/en-gb/article/24303862/world-of-warcraft-forever-whats-next-panel-recap): Horde-Skyborne können Warrior, Hunter, Rogue, Druid und Shaman spielen; Mage gehört zur Allianz-Variante.
- [Abgleich der vollständigen Matrix aus der BlizzCon-Demo](https://wowclassicforever.info/races/).

## Prüfung

`node --test tests/race-classes.test.mjs` prüft die neuen Horde-Kombinationen, ungültige Alternativen, offene Auswahlen, das Verhalten beim Race-Wechsel und die Übereinstimmung mit der SQL-Matrix.
