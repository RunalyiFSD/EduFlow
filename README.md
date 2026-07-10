# EduFlow

EduFlow is split into two independent projects that talk to each other over
HTTP:

```
PBL-Projects/
  backend/    Express + JWT REST API server (port 5000)
  client/     React + Vite frontend (port 5173)
```

There is no more shared in-browser "mock database" — the backend now owns
all data (users, courses, enrollments, notifications, audit logs) and
persists it to a JSON file on disk. The React app is a pure client that
authenticates and fetches everything through the API.

## Running locally

You need **two terminals** — one for each project.

**Terminal 1 — backend**
```bash
cd backend
npm install
npm run dev
```
Starts the API at `http://localhost:5000`.

**Terminal 2 — frontend**
```bash
cd client
npm install
npm run dev
```
Starts the React app at `http://localhost:5173`, configured (via `client/.env`)
to call the backend at `http://localhost:5000/api`.

Open `http://localhost:5173` in your browser — that's the welcome page.

## Demo accounts

| Role       | Email                  | Password |
|------------|-------------------------|----------|
| Admin      | admin@eduflow.com       | password |
| Instructor | instructor@eduflow.com  | password |
| Student    | student@eduflow.com     | password |

## How the pieces fit together

- `client/src/api/httpClient.js` — a small fetch wrapper all frontend API
  calls go through, pointed at `VITE_API_URL` from `client/.env`.
- `client/src/api/authApi.js`, `courseApi.js`, `userApi.js` — one function
  per backend endpoint; these are the only files that know the API's URL
  shape. Every page/component goes through them rather than calling fetch
  directly.
- `backend/src/data/store.js` — a JSON-file-backed "database" (no separate
  DBMS needed). Swap this out for a real database later without touching
  any controller code, since controllers only call `getCollection` /
  `saveCollection`.
- `backend/src/middleware/auth.js` — verifies JWTs issued at login/register
  and attaches the authenticated user to `req.user`.

See `backend/README.md` for the full API reference.

## Notes for production

This is a learning/PBL project, so a few things are intentionally simple
and would need hardening for production:
- The "database" is a single JSON file with synchronous reads/writes —
  fine for one or a few concurrent users, not for production scale.
- `JWT_SECRET` in `backend/.env` is a placeholder — replace it with a long
  random value before deploying anywhere public.
- Uploaded course cover images are stored directly on the server's disk
  under `backend/uploads/` — for production you'd want object storage
  (S3, etc.) instead.
