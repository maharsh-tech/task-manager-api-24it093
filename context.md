# Workspace Context & Development History

## Project Overview

- **Project Name**: Task Manager API (`task-manager-api-24it093`)
- **Repository**: Standalone Express backend for Practical 4 and Practical 5
- **Backend Stack**: Node.js, Express 4 (CommonJS), MongoDB via Mongoose
- **Data Storage**: MongoDB Atlas (`task-manager-api` database, `tasks` collection)

---

## Current Architecture

```
Client (Postman / Thunder Client)
        |
        v
Express (server.js :5000)
        |
        v
Mongoose ODM (models/Task.js)
        |
        v
MongoDB Atlas
        └── tasks collection
```

The server connects to MongoDB on startup via `MONGO_URI` in `.env`. The API does not start if the database connection fails.

---

## Folder Structure & Responsibilities

```
task-manager-api-24it093/
├── context.md                      # Permanent project memory (this file)
├── README.md                       # Setup instructions & practical documentation
├── .env.example                    # MongoDB URI template (committed)
├── .env                            # Local secrets — gitignored
├── package.json                    # Express, Mongoose, dotenv dependencies
├── server.js                       # dotenv, mongoose.connect, middleware pipeline
├── models/
│   └── Task.js                     # Mongoose schema, validation, pre-save hooks
├── routes/
│   └── tasks.js                    # CRUD route definitions + route middleware
├── controllers/
│   └── taskController.js           # Async Mongoose CRUD handlers
└── middleware/
    ├── logger.js                   # Global request logging
    ├── validateContentType.js      # POST/PUT Content-Type check
    ├── validateTaskId.js           # MongoDB ObjectId validation
    ├── notFound.js                 # 404 handler for undefined routes
    └── errorHandler.js             # ValidationError, CastError, 500 handling
```

---

## Major Design Decisions

### 1. Modular structure (`routes/`, `controllers/`, `middleware/`, `models/`)

**Why:** The handbook teaches middleware pipeline architecture. Splitting concerns into folders mirrors Express best practices and keeps Mongoose schema separate from HTTP handlers.

**Benefit:** Adding new routes, middleware, or models requires no restructuring.

### 2. MongoDB ObjectId as task identifier

**Why:** Practical 5 replaces in-memory numeric IDs with MongoDB's native `_id` (ObjectId). Mongoose auto-generates these on `Task.create()`.

**Assumption:** Week 6 frontend integration will use `_id` from API responses when calling `/tasks/:id`.

### 3. Validation split between middleware, schema, and error handler

**Why:** Route-specific concerns (ObjectId format, Content-Type) live in middleware. Field rules (required title, enum priority, defaults) live in the Mongoose schema. The error handler converts Mongoose `ValidationError` into structured JSON — never raw error objects.

### 4. Pre-save and pre-update title trimming

**Why:** Supplementary handbook requirement. A `pre('save')` hook trims title on create; a `pre('findOneAndUpdate')` hook trims title on PUT so whitespace-only titles fail schema validation after trimming.

### 5. Connection-gated server startup

**Why:** Express only calls `app.listen()` after `mongoose.connect()` succeeds. Prevents serving CRUD requests against a disconnected database.

---

## Technologies & Versions

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend runtime | Node.js | 18+ |
| Backend framework | Express | ^4.21.2 |
| ODM | Mongoose | ^8.x |
| Environment config | dotenv | ^16.x |
| CORS | cors | ^2.x |
| Database | MongoDB Atlas | Cloud |
| Backend module system | CommonJS | (default) |

---

## Completed Practicals

### Practical 4 – RESTful API with Node.js and Express

- Express server on port 5000 with full CRUD for `/tasks`
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

- `cors` middleware enabled with origin from `CORS_ORIGIN` in `.env`
- `PORT` read from `.env`
- Frontend lives in separate repo `maharshsolanki-v2` (no monorepo merge)
- No Task schema or controller changes for this practical

---

## Current Implementation Status

| Area | Status |
|------|--------|
| MongoDB connection | Complete |
| Task schema + model | Complete |
| Backend CRUD (`/tasks`) | Complete (MongoDB-backed) |
| Logging middleware | Complete |
| Content-Type validation | Complete |
| ObjectId validation | Complete |
| 404 handler | Complete |
| Global error handler (ValidationError) | Complete |
| Pre-save title trim | Complete |
| Priority enum field | Complete |
| CORS | Complete (Practical 6) |
| Frontend integration | Complete in `maharshsolanki-v2` (Practical 6) |
| JWT authentication | Not started (Week 7) |

---

## Coding Conventions

- **Backend**: CommonJS (`require`/`module.exports`), async controllers with `try/catch` + `next(err)`
- **API responses**: Consistent JSON with `{ error: "..." }` for failures; Mongoose documents for successes
- **Validation errors**: `{ error: "Validation failed", details: [{ field, message }] }` — never raw Mongoose objects
- **HTTP status codes**: 200, 201, 400 (validation/invalid ID), 404 (not found), 500 (server error)
- **Git commits**: Conventional Commits format (`feat:`, `docs:`, etc.)
- **Secrets**: `.env` gitignored; `.env.example` committed with placeholders

---

## Important Constraints

- MongoDB connection string must stay in `.env` — never committed to git
- `PORT` and `CORS_ORIGIN` configured via `.env` (see `.env.example`)
- CORS is enabled for the frontend origin defined in `CORS_ORIGIN`
- No JWT or authentication yet (Week 7)
- No Docker, caching, or EventEmitter yet (Weeks 9–11)

---

## Verification Commands

```bash
npm install
npm start              # MongoDB connected → Server running on port 5000
```

Test CRUD in Postman against `http://localhost:5000/tasks`. Restart the server to confirm data persists in MongoDB.

---

## Assumptions Made During Implementation

- Task objects use MongoDB `_id` instead of numeric string `id` from Practical 4
- Database name `task-manager-api` on MongoDB Atlas cluster
- `title` is required at schema level; whitespace-only titles fail after pre-save trim
- `priority` is optional; invalid enum values return structured 400 validation errors
- Postman/Thunder Client is the primary testing tool
- Lab screenshots are captured manually outside the repository
