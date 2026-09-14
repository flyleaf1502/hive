# Discord-Login

Stand: 14.09.2026. Supabase Auth übernimmt Discord OAuth; die statische Website verwendet das lokal gebündelte `@supabase/auth-js` 2.116.0 mit PKCE. Die Login-Sitzung wird im Session Storage gespeichert, getrennt von der Admin-Sitzung. Bei erneutem Aufruf genügt wieder „Mit Discord anmelden“.

## Anbieter und Rückleitungen

Discord-App: HIVE FOREVER (`1549126667295785110`). Der Discord-Callback ist `https://amsmtoxjkitcwzumwyuz.supabase.co/auth/v1/callback`. Client-Secret ausschließlich direkt im Supabase Dashboard eintragen.

Supabase Site URL: `https://hive-guild.github.io/anmeldung/`.
Erlaubte Redirect URLs:
- `https://hive-guild.github.io/anmeldung/`
- `https://flyleaf1502.github.io/hive/anmeldung/`
- `http://127.0.0.1:8765/anmeldung/` (lokaler Entwicklungstest)

Discord fragt die Scopes `identify` und `email` an. Die E-Mail bleibt in Supabase Auth und wird nicht in die Raid-Tabelle oder öffentliche Übersicht kopiert. Es werden weder Discord-Server-Mitgliedschaften noch Nachrichten angefordert.

## Datenbank

Migration: `db/migrations/2026-09-14-discord-accounts.sql`. `registrations.user_id` ist eindeutig. Die neuen RPCs bestimmen Nutzer und Discordname aus der angemeldeten, verifizierten Identität; vom Formular mitgesendete IDs können keinen anderen Eintrag adressieren. Gleichzeitige Speichervorgänge desselben Kontos werden serialisiert. Die öffentlichen Bearbeitungslink-RPCs verlieren ihre Ausführungsrechte. Vorhandene Daten werden nicht gelöscht; laut Betreiber gibt es noch keine zu übernehmenden Rückmeldungen.

`tests/discord-accounts.sql` erzeugt kurzzeitig synthetische Identitäten und führt alle Datenänderungen mit abschließendem `ROLLBACK` aus. Die Tests geben ausschließlich ein Prüfergebnis aus, keine Sitzungen oder Schlüssel.

## Quellen

- [Supabase: Discord Login](https://supabase.com/docs/guides/auth/social-login/auth-discord)
- [Supabase: PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow)
- [Discord: OAuth2](https://docs.discord.com/developers/topics/oauth2)
