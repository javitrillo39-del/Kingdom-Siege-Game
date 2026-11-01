# Kingdom Siege Game

1. Keep the API running at http://localhost:3001.
2. Copy `.env.example` to `.env`.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open http://localhost:5173.

Register a new account the first time. The game saves through the API.

## Social presence

The game sends an authenticated API heartbeat on session start and every 30
seconds. The API considers a player online for 90 seconds after the last
heartbeat, deduplicates accounts across tabs, and records logout immediately.
The online count refreshes independently every 30 seconds, retains the last
valid value through two failed updates, and retries transient API failures with
progressive delays. Run `npm run migrate:presence` in the API project to add
the presence columns.

## Chat

The Chat section uses the authenticated API and polls the selected channel
every three seconds while the browser tab is visible. It supports Global,
server-assigned Realm, and active-friend private conversations. Messages are
plain text only, limited to 300 characters, and include report, mute, and
block actions. Apply `npm run migrate:chat` in the API project before using it.

## Languages

The interface supports English, Spanish (Spain), and Spanish (Mexico). It
starts from the browser language and saves a manual selection in local storage.
Run `npm run check:i18n` to verify translation-key parity, browser-language
fallbacks, and number formatting.
