# The Report – server

Express + MongoDB API for The Report.

## Run locally

```bash
cd server
npm install
cp .env.example .env   # then fill in the values
npm run dev
npm test               # week rules + upload checks
```

## Week rules (IST)

- Monday to Saturday: fill in the 6 letters (R E P O R T), in any order
- Send only when all 6 are filled; Saturday 11:59 pm is the last moment
- Sunday: everyone's sent reports are revealed to the group
- Monday: a new week starts

## API

All routes except signup/login/health need `Authorization: Bearer <token>`.

| Method | Path | What it does |
|---|---|---|
| POST | /api/auth/signup | `{ name, email, password }` |
| POST | /api/auth/login | `{ email, password }` |
| GET / PATCH | /api/auth/me | read / change `name`, `colorPair` |
| GET / POST | /api/groups | my groups / create `{ name }` |
| POST | /api/groups/join | `{ code }` |
| GET | /api/groups/:id | group with members |
| POST | /api/groups/:id/leave | leave a group |
| GET | /api/groups/:id/reports?week=YYYY-MM-DD | the week's feed (full reports only after reveal) |
| GET | /api/groups/:id/reports/me | my report this week |
| PUT | /api/groups/:id/reports/me/letters/:key | save a letter `{ text, photo, voice, video }` |
| POST | /api/groups/:id/reports/me/submit | send my report |
| POST | /api/groups/:id/reports/:reportId/reactions | `{ kind }` toggles |
| POST / DELETE | /api/groups/:id/reports/:reportId/comments | add / delete my comment |
| GET | /api/groups/:id/snaps?month=YYYY-MM | daily snaps for a month |
| PUT / DELETE | /api/groups/:id/snaps/:date | my photo for a day `{ photo, caption }` |
| POST | /api/groups/:id/uploads/signature | `{ kind: photo/voice/video }` → signed Cloudinary upload |
| POST | /api/groups/:id/nudges | `{ to, kind: report/snap }` |
| GET | /api/push/public-key | for phone notifications |
| POST | /api/push/subscribe, /unsubscribe | save / remove a phone |
| POST | /api/jobs/:name | reminders, header `x-cron-secret` |

Letter keys: `radio, eating, playing, obsessed, recommend, treating`.

## Reminders (cron-job.org, IST)

| Job | When |
|---|---|
| `saturday-reminder` | Saturday 10:00 and 20:00 |
| `snap-reminder` | Every day 20:00 |
| `reveal` | Sunday 09:00 |
