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
Run `npm run migrate:presence` in the API project to add the presence columns.
