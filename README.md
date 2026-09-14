# HIVE Comeback

Eine statische, responsive HIVE-Seite für GitHub Pages. Einträge werden in Supabase/PostgreSQL gespeichert; GitHub Pages allein kann keine gemeinsam bearbeitbare Datenbank betreiben.

## Einrichten

1. Ein kostenloses [Supabase-Projekt](https://supabase.com/dashboard) anlegen. In **SQL Editor** den Inhalt von [`db/supabase.sql`](db/supabase.sql) ausführen. Das Skript ist für ein frisches Projekt gedacht. Wenn die Tabelle bereits besteht, müssen die neuen Spalten zuerst per Migration ergänzt werden.
2. In **Authentication → Users** einen Admin-Nutzer mit E-Mail und Passwort anlegen. Dessen UUID aus der Nutzerliste kopieren und im SQL Editor ausführen:

   ```sql
   insert into public.hive_admins (user_id) values ('DEINE-ADMIN-USER-UUID');
   ```

3. In **Project Settings → API** die **Project URL** und einen öffentlichen **publishable key** (alternativ einen älteren **anon JWT**) kopieren und als `SUPABASE_URL` und `SUPABASE_PUBLIC_KEY` in [`dist/config.js`](dist/config.js) eintragen. Niemals einen `secret`-/`service_role`-Schlüssel oder ein Passwort dort ablegen.
4. Diesen Ordner als eigenes GitHub-Repository mit Branch `main` veröffentlichen. Unter **Settings → Pages → Build and deployment** als Quelle **GitHub Actions** wählen. Der enthaltene Workflow veröffentlicht `dist/` bei jedem Push.
5. Die veröffentlichte URL aufrufen und eine Testanmeldung machen. Den persönlichen Bearbeitungslink kopieren und eine Änderung speichern. Unter `#/uebersicht` prüfen, dass öffentlich nur Name, Rasse, Klasse, Spec und Rolle erscheinen. Unter `#/admin` mit dem Admin-Konto die vollständige Übersicht prüfen. Den Testeintrag über seinen Bearbeitungslink löschen.

## Was geschützt ist

- Teilnehmer bekommen nach dem Absenden einen zufälligen geheimen Bearbeitungslink, den sie selbst kopieren müssen. Er wird nicht dauerhaft im Browser gespeichert; in der Datenbank liegt nur sein SHA-256-Hash. Über den Link können sie ihre Angaben aktualisieren oder den Eintrag dauerhaft löschen. Ohne Link ist die Selbstbearbeitung nicht möglich; der Admin kann den Eintrag weiterhin bearbeiten.
- Unter `#/uebersicht` sind **Name, Rasse, Klasse, Spec und Rolle** aller Anmeldungen öffentlich sichtbar. Die dafür eingerichtete SQL-Funktion gibt genau diese fünf Felder zurück.
- Die vollständige Tabelle ist nicht öffentlich lesbar. Die Admin-Seite unter `#/admin` zeigt zusätzlich alle Antworten, Raidtage, Uhrzeiten und Discordnamen; sie und alle Admin-Änderungen erfordern einen angemeldeten, in `hive_admins` freigeschalteten Nutzer. Die SQL-Funktionen prüfen den Bearbeitungslink serverseitig.
- Der öffentliche publishable key bzw. ältere anon JWT ist bewusst für den Browser bestimmt. Zugriffsschutz erfolgt durch Datenbankrechte und Row Level Security. Ein privater `secret`-/`service_role`-Schlüssel darf nie in GitHub oder im Browser liegen.
- Neue Anmeldungen sind serverseitig pro Verbindung und insgesamt begrenzt. Dafür speichert die Datenbank einen mit einem privaten Schlüssel erzeugten IP-Hash höchstens einen Tag; die rohe IP wird nicht in der HIVE-Tabelle abgelegt. Das Limit schützt vor einem Überfluten der öffentlichen Liste, ersetzt aber keinen Schutz am API-Gateway gegen massenhaft ungültige Anfragen.

## Raidzeiten

Teilnehmer wählen maximal vier Raidtage pro Woche. Außerdem geben sie an, ab wann sie frühestens können (`18:00`, `18:30`, `19:00`, `19:30` oder `20:00 Uhr`) und bis wann sie maximal können (`22:00`, `22:30` oder `23:00 Uhr`). Beide Zeitangaben sind Pflichtfelder und lassen sich über den persönlichen Bearbeitungslink aktualisieren.

## Lokal ansehen

`dist/index.html` benötigt einen kleinen HTTP-Server, weil es JavaScript-Module lädt. Beispielsweise im Repository-Verzeichnis: `npx serve dist`. Ohne Supabase-Konfiguration ist die Gestaltung sichtbar, Speichern und Admin-Login zeigen einen verständlichen Einrichtungsfehler.

Die Seite hat keine Laufzeit-Abhängigkeiten und keinen Build-Schritt. Die HTML-, CSS- und JavaScript-Dateien in `dist/` können direkt bearbeitet werden.

## Icons

Klassen, Spezialisierungen und Rollen nutzen unveränderte Spiel-Icons von [Blizzards offiziellen Klassenseiten](https://worldofwarcraft.blizzard.com/en-us/game/classes) und dem `render.worldofwarcraft.com`-CDN. Die vier klassischen Horde-Rassen zeigen unveränderte Charakterbilder von [Blizzards offizieller Rassenseite](https://worldofwarcraft.blizzard.com/en-us/game/races). Die Titelillustration `forever-hero-art.png` wurde vom Betreiber bereitgestellt; sie trägt eine Horley-Signatur. Diese Bilder und World of Warcraft sind © Blizzard Entertainment. Die [Blizzard Legal FAQ](https://www.blizzard.com/en-us/legal/10390250-087d-41fd-aa47-1a44cbacb10b/legal-faq) beschreibt eine widerrufliche, beschränkte Nutzung von Blizzard-Inhalten für private, nicht-kommerzielle Fan-Webseiten. Für eine kommerzielle oder anderweitige Veröffentlichung ist eine eigene Rechteprüfung nötig.

„Noch nicht sicher“ zeigt ein unverändertes WoW-Fragezeichen. Der Skyborne-Platzhalter verwendet [„Elf ear“ von Delapouite](https://game-icons.net/1x1/delapouite/elf-ear.html) ([CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)); das Motiv wurde für HIVE farbig angepasst. Ein veröffentlichter Skyborne-Charaktereditor-Icon steht bislang nicht zur Verfügung. Wowhead- oder Warcraft-Wiki-Dateien werden nicht mitgeliefert.
