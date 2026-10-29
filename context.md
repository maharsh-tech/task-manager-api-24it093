# Workspace Context & Development History

## Project Overview

- **Project Name**: Task Manager API (`task-manager-api-24it093`)
- **Repository**: Standalone Express backend for Practicals 4–7
- **Backend Stack**: Node.js, Express 4 (CommonJS), MongoDB via Mongoose, `cors`, `dotenv`, `jsonwebtoken`, `bcryptjs`
- **Data Storage**: MongoDB Atlas (`task-manager-api` database, `tasks` collection)
- **Frontend repo**: [maharshsolanki-v2](https://github.com/maharsh-tech/maharshsolanki-v2) (separate — no monorepo)
- **Env config**: `.env` (gitignored) + `.env.example` (committed)

---

## Current Architecture

```
Client (React / Postman)
        |
        v
Express (server.js — PORT from .env)
  → express.json()
  → cors({ origin: CORS_ORIGIN from .env })
  → requestLogger
  → /auth router (register, login public; /me protected)
  → /tasks router (auth → validation → CRUD)
  → notFoundHandler
  → errorHandler
        |
        v
Mongoose (User, Task)
        |
        v
MongoDB Atlas
        └── tasks collection
```

The server requires `MONGO_URI`, `PORT`, `CORS_ORIGIN`, and `JWT_SECRET` in `.env`.

---

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `MONGO_URI` | Yes | MongoDB Atlas connection string |
| `PORT` | Yes (example default 5000) | HTTP listen port |
| `CORS_ORIGIN` | Yes | Allowed frontend origin, e.g. `http://localhost:5173` |
| `JWT_SECRET` | Yes | JWT signing secret |
| `JWT_EXPIRES_IN` | Yes | Token expiry, e.g. `1h` |

Copy `.env.example` → `.env` and fill real values. **Never commit `.env`.**

Do not hardcode port or CORS origin in `server.js`.

---

## Folder Structure & Responsibilities

```
task-manager-api-24it093/
├── context.md                      # Permanent project memory (this file)
├── README.md                       # Setup instructions & practical documentation
├── API_SPECIFICATION.md            # Endpoint / middleware documentation
├── .env.example                    # MONGO_URI, PORT, CORS_ORIGIN templates (committed)
├── .env                            # Local secrets — gitignored
├── package.json                    # Express, Mongoose, dotenv, cors, jsonwebtoken, node-cache
├── server.js                       # App entry, listeners, listen(PORT)
├── events.js                       # Custom TaskEvents class extending EventEmitter
├── listeners.js                    # Async task-created, task-deleted, error listeners
├── models/
│   └── Task.js                     # Mongoose schema, validation, pre-save hooks
├── routes/
│   └── tasks.js                    # CRUD route definitions + route middleware
├── controllers/
│   └── taskController.js           # Async Mongoose CRUD handlers
├── middleware/
│   ├── logger.js                   # Global request logging
│   ├── validateContentType.js      # POST/PUT Content-Type check
│   ├── validateTaskId.js           # MongoDB ObjectId validation
│   ├── notFound.js                 # 404 handler for undefined routes
│   └── errorHandler.js             # ValidationError, CastError, 500 handling
├── utils/
│   └── cache.js                    # In-memory node-cache instance
└── scripts/
    ├── remove-legacy-tasks.js      # Database cleanup script
    └── test-events.js              # Practical 10 EventEmitter verification script
```

---

## Major Design Decisions

### 1. Modular structure (`routes/`, `controllers/`, `middleware/`, `models/`)

**Why:** The handbook teaches middleware pipeline architecture. Splitting concerns into folders mirrors Express best practices and keeps Mongoose schema separate from HTTP handlers.

**Benefit:** Adding new routes, middleware, or models requires no restructuring.

### 2. MongoDB ObjectId as task identifier

**Why:** Practical 5 replaces in-memory numeric IDs with MongoDB's native `_id` (ObjectId). Mongoose auto-generates these on `Task.create()`.

**Assumption:** Frontend uses `_id` from API responses when calling `/tasks/:id`.

### 3. Validation split between middleware, schema, and error handler

**Why:** Route-specific concerns (ObjectId format, Content-Type) live in middleware. Field rules (required title, enum priority, defaults) live in the Mongoose schema. The error handler converts Mongoose `ValidationError` into structured JSON — never raw error objects.

### 4. Pre-save and pre-update title trimming

**Why:** Supplementary handbook requirement. A `pre('save')` hook trims title on create; a `pre('findOneAndUpdate')` hook trims title on PUT so whitespace-only titles fail schema validation after trimming.

### 5. Connection-gated server startup

**Why:** Express only calls `app.listen()` after `mongoose.connect()` succeeds. Prevents serving CRUD requests against a disconnected database.

### 6. Env-based PORT and CORS_ORIGIN (Practical 6)

**Why:** Avoid hardcoded `5000` / `localhost:5173` in source. Local and future deploy targets differ; `.env` keeps those values out of git.

**Behavior:** `cors({ origin: process.env.CORS_ORIGIN })`. Server exits early if `MONGO_URI` or `CORS_ORIGIN` is missing.

---

## Technologies & Versions

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend runtime | Node.js | 18+ |
| Backend framework | Express | ^4.21.2 |
| ODM | Mongoose | ^8.x / ^9.x |
| Environment config | dotenv | ^16.x / ^17.x |
| CORS | cors | ^2.x |
| Database | MongoDB Atlas | Cloud |
| Backend module system | CommonJS | (default) |

---

## Completed Practicals

### Practical 4 – RESTful API with Node.js and Express

- Express server with full CRUD for `/tasks`
- In-memory task array (replaced in Practical 5)
- Middleware pipeline: logging → routes → 404 handler → global error handler
- Supplementary: Content-Type validation, task ID validation, structured 404 responses

### Practical 5 – MongoDB Integration and Schema Design with Mongoose

- MongoDB Atlas connection via `MONGO_URI` in `.env`
- Task schema: `title` (required), `description`, `completed` (default false), `createdAt` (default now)
- Supplementary: `priority` enum (`low`, `medium`, `high`), pre-save title trim hook
- CRUD via `Task.find()`, `Task.create()`, `Task.findByIdAndUpdate()`, `Task.findByIdAndDelete()`
- Structured validation errors via global error handler
- Data persists across server restarts

### Practical 6 – Full Stack Integration (CORS for React)

- `cors` middleware with origin from `CORS_ORIGIN` in `.env`
- `PORT` from `.env`
- Frontend in separate repo `maharshsolanki-v2` (uses `VITE_API_BASE_URL`)
- No Task schema or controller changes for this practical

### Practical 7 – Authentication and Middleware Pipeline

- User model with bcrypt-hashed passwords
- `POST /auth/register`, `POST /auth/login` (JWT on login, 1h expiry from env)
- `GET /auth/me` protected by JWT middleware
- All `/tasks` routes require JWT
- `validateTaskBody` rejects POST without title before DB
- **Per-user tasks:** Task schema `userId` ref User; CRUD scoped to `req.user.id` from JWT
- Legacy shared tasks (pre-auth, no `userId`) removed via `npm run cleanup:legacy-tasks`

---

## Current Implementation Status

| Area | Status |
|------|--------|
| MongoDB connection | Complete (`MONGO_URI`) |
| Task schema + model | Complete |
| Backend CRUD (`/tasks`) | Complete (MongoDB-backed) |
| Logging middleware | Complete |
| Content-Type validation | Complete |
| ObjectId validation | Complete |
| 404 handler | Complete |
| Global error handler (ValidationError) | Complete |
| Pre-save title trim | Complete |
| Priority enum field | Complete |
| PORT from env | Complete |
| CORS from env (`CORS_ORIGIN`) | Complete (Practical 6) |
| JWT auth + protected `/tasks` | Complete (Practical 7) |
| Per-user task ownership (`userId`) | Complete |
| Frontend integration | Complete in `maharshsolanki-v2` (Practical 6–7) |
| In-memory caching (node-cache, per-user, TTL 60s) | Complete (Practical 9) |
| Async event-driven processing (EventEmitter) | Complete (Practical 10) |
| Containerization (Docker, Docker Compose) | Complete (Practical 11) |
| CI/CD Pipeline (GitHub Actions, Jest, Supertest) | Complete (Practical 12) |
| AI API Integration (OpenAI SDK, OpenRouter, Graceful Fallback) | Complete (Practical 13) |

---

## Coding Conventions

- **Backend**: CommonJS (`require`/`module.exports`), async controllers with `try/catch` + `next(err)`
- **API responses**: Consistent JSON with `{ error: "..." }` for failures; Mongoose documents for successes
- **Validation errors**: `{ error: "Validation failed", details: [{ field, message }] }` — never raw Mongoose objects
- **HTTP status codes**: 200, 201, 400 (validation/invalid ID), 404 (not found), 500 (server error)
- **Config**: no hardcoded host/port/CORS — use `.env`
- **Git commits**: Conventional Commits format (`feat:`, `docs:`, etc.)
- **Secrets**: `.env` gitignored; `.env.example` committed with placeholders

---

## Important Constraints

- MongoDB connection string must stay in `.env` — never committed to git
- `PORT` and `CORS_ORIGIN` configured via `.env` (see `.env.example`)
- CORS allows only the origin defined in `CORS_ORIGIN`
- Practicals 4–13 complete

---

## Verification Commands

```bash
cp .env.example .env   # set MONGO_URI, PORT, CORS_ORIGIN
npm install
npm start              # MongoDB connected → Server running on port <PORT>
                       # CORS origin: <CORS_ORIGIN>
```

Test CRUD in Postman against `http://localhost:<PORT>/tasks`. Restart the server to confirm data persists in MongoDB.

---

## Assumptions Made During Implementation

- Task objects use MongoDB `_id` instead of numeric string `id` from Practical 4
- Database name `task-manager-api` on MongoDB Atlas cluster
- `title` is required at schema level; whitespace-only titles fail after pre-save trim
- `priority` is optional; invalid enum values return structured 400 validation errors
- Local frontend origin matches `CORS_ORIGIN` (typically Vite on 5173)
- Postman/Thunder Client remains useful for backend-only checks
- Lab screenshots are captured manually outside the repository
