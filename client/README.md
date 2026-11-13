# The Report – app (client)

React + Vite. Installs on Android from Chrome ("Add to Home screen") and shows notifications.

## Run locally

```bash
cd client
npm install
echo "VITE_API_URL=http://localhost:4000" > .env
npm run dev
```

## Settings on Vercel

- Root directory: `client`
- Framework: Vite (build `npm run build`, output `dist`)
- Environment variable: `VITE_API_URL` = the Render address of the server, e.g. `https://the-report-api.onrender.com` (no slash at the end)

## Screens

- Sign up / log in, join or create a group (invite code + WhatsApp share)
- Home: progress Monday–Saturday with nudges; on Sunday everyone's reports, with a comment box under each letter; arrows for past weeks
- My report: colour pair, 6 letters with text + 1 photo + 1 voice note (record or pick) + 1 video (up to 1 min), auto-save, send when all 6 are filled
- Daily snap: calendar, one photo a day each, add missed days from the gallery, nudges
- Me: profile photo, name, colours, notifications, groups, log out, and a
  Spotify song dashboard with hover-to-flip song code cards
