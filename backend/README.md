# EduFlow Backend

A real Express + JWT REST API server that backs the EduFlow React client. It
replaces the old browser-localStorage mock database — all data now lives on
the server and is persisted to `src/data/db.json`, so it survives page
refreshes for every user, not just one browser.

## Setup

```bash
cd backend
npm install
npm run dev      # uses nodemon, restarts on file changes
# or
npm start        # plain node
```

The server reads configuration from `.env` (a working default is already
included). Copy `.env.example` if you ever need to reset it:

```
PORT=5000
JWT_SECRET=replace_this_with_a_long_random_secret
CLIENT_ORIGIN=http://localhost:5173
```

On first run it seeds `src/data/db.json` with demo users and courses. Delete
that file at any time to reseed from scratch.

## Demo accounts

| Role       | Email                  | Password |
|------------|-------------------------|----------|
| Admin      | admin@eduflow.com       | password |
| Instructor | instructor@eduflow.com  | password |
| Student    | student@eduflow.com     | password |

## Architecture

```
src/
  server.js          entry point
  app.js             express app, middleware, route mounting
  config/env.js       reads .env
  data/
    seedData.js       initial demo users/courses/enrollments/notifications
    store.js           JSON-file-backed collections (getCollection/saveCollection)
    db.json             generated on first run, gitignored
  middleware/
    auth.js            JWT verification (protect) + role gate (requireRole)
    upload.js           multer config for course cover image uploads
    errorHandler.js     converts thrown ApiErrors into JSON error responses
  utils/
    ApiError.js         Error subclass carrying an HTTP status code
    asyncHandler.js      wraps async route handlers so errors reach errorHandler
  controllers/          one file per resource: auth, course, user
  routes/                Express routers, mounted under /api/*
uploads/                 uploaded course cover images, served at /uploads/*
```

## API summary

All endpoints are prefixed with `/api`. Protected routes require an
`Authorization: Bearer <token>` header.

### Auth
- `POST /auth/login` — `{ email, password }` → `{ token, user }`
- `POST /auth/register` — `{ name, email, password, role }` → `{ token, user }`
- `POST /auth/forgot-password` — `{ email }` → `{ success }`

### Courses
- `GET /courses` — public catalog browsing, supports `?isPublished=&instructor=&category=`
- `GET /courses/:id` — auth required
- `POST /courses/:id/enroll` — auth required
- `PUT /courses/:id/progress` — auth required, `{ completedLessons }`
- `POST /courses` — auth required (instructor), multipart form with optional `coverImage` file
- `PUT /courses/:id` — auth required (owner or admin), multipart form
- `DELETE /courses/:id` — auth required (owner or admin)

### Users
- `GET /users/profile` — auth required
- `GET /users/notifications` — auth required
- `PUT /users/notifications/:id/read` — auth required
- `GET /users/stats` — auth required
- `GET /users/admin/telemetry` — auth required (admin)
- `GET /users/admin/users` — auth required (admin)
- `PUT /users/admin/users/:id` — auth required (admin)
- `GET /users/admin/audit-logs` — auth required (admin)

## Notes

- Passwords are hashed with bcrypt; the API never returns password hashes.
- Tokens are real JWTs signed with `JWT_SECRET`, valid for 7 days.
- `GET /courses` is intentionally public so the client's welcome page can
  show published courses to visitors who haven't logged in yet.
