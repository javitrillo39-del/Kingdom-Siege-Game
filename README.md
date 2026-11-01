# Kingdom Siege Game

1. Keep the API running at http://localhost:3001.
2. Copy `.env.example` to `.env`.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open http://localhost:5173.

Register a new account the first time. The game saves through the API.

## Social presence

Live online status uses Supabase Realtime Presence. Configure these frontend
variables in `.env` using the project URL and publishable key:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=replace-with-your-supabase-publishable-key
```

The API also needs `SUPABASE_JWT_SECRET`, set to the compatible signing secret
for that Supabase project. Apply the API's additive presence migration before
expecting the live counter to connect. If Realtime is not configured or
reachable, Social displays “Online unavailable” rather than a guessed count.
