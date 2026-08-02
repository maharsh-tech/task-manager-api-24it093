# Workspace Context & Development History

## Project Overview

- **Project Name**: Task Manager API (`task-manager-api-24it093`)
- **Repository**: Standalone Express backend for Practical 4
- **Backend Stack**: Node.js, Express 4 (CommonJS), in-memory storage
- **Data Storage**: In-memory task array (no database in Week 4)

---

## Current Architecture

```
task-manager-api-24it093/
├── server.js                   # App entry: middleware pipeline + listen(5000)
├── routes/                     # CRUD route definitions
├── controllers/                # In-memory task storage & handler logic
└── middleware/                 # Logging, validation, 404, error handling
```

The server runs on port 5000. API testing is done via Postman or Thunder Client.

---

## Folder Structure & Responsibilities

```
task-manager-api-24it093/
├── context.md                      # Permanent project memory (this file)
├── README.md                       # Setup instructions & practical documentation
├── package.json                    # Express dependency & start script
├── server.js                       # App entry: middleware pipeline + listen(5000)
├── routes/
│   └── tasks.js                    # CRUD route definitions + route middleware
├── controllers/
│   └── taskController.js           # In-memory task storage & handler logic
└── middleware/
    ├── logger.js                   # Global request logging
    ├── validateContentType.js      # POST/PUT Content-Type check
    ├── validateTaskId.js           # Route-specific numeric ID validation
    ├── notFound.js                 # 404 handler for undefined routes
    └── errorHandler.js             # Global error handler (last in chain)
```

---

## Major Design Decisions

### 1. Modular structure (`routes/`, `controllers/`, `middleware/`)

**Why:** The handbook teaches middleware pipeline architecture. Splitting concerns into folders mirrors Express best practices and makes each middleware independently testable.

**Benefit:** Adding new routes or middleware requires no restructuring.

### 2. Numeric string IDs with auto-increment

**Why:** Simple in-memory ID generation (`String(nextId++)`) satisfies the handbook's `:id` parameter and enables straightforward regex validation (`/^\d+$/`) in `validateTaskId`.

**Assumption:** IDs are positive integers stored as strings for consistent JSON serialization.

### 3. Validation split between middleware and controller

**Why:** Route-specific concerns (ID format, Content-Type) live in middleware. Business rules (title required, field types) live in the controller. This matches the handbook's distinction between `app.use()` and route-specific middleware.

---

## Technologies & Versions

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend runtime | Node.js | 18+ |
| Backend framework | Express | ^4.21.2 |
| Backend module system | CommonJS | (default) |

---

## Practical 4 – RESTful API with Node.js and Express

- Express server on port 5000 with full CRUD for `/tasks`
- In-memory task array (no database)
- Middleware pipeline: logging → routes → 404 handler → global error handler
- Supplementary: Content-Type validation, task ID validation, structured 404 responses

---

## Current Implementation Status

| Area | Status |
|------|--------|
| Backend CRUD (`/tasks`) | Complete |
| Logging middleware | Complete |
| Content-Type validation | Complete |
| Task ID validation | Complete |
| 404 handler | Complete |
| Global error handler | Complete |

---

## Coding Conventions

- **Backend**: CommonJS (`require`/`module.exports`), one export per middleware file, controllers handle business logic, routes wire middleware + handlers
- **API responses**: Consistent JSON objects with `{ error: "..." }` for failures and task objects for successes
- **HTTP status codes**: 200 (read/update/delete success), 201 (create), 400 (validation), 404 (not found), 500 (server error)
- **Git commits**: Conventional Commits format (`feat:`, `docs:`, etc.)

---

## Important Constraints

- Week 4 uses in-memory storage only — no MongoDB, Docker, or authentication
- Task data is lost on server restart (expected for in-memory storage)
- No CORS configuration (not required for Postman-based testing)

---

## Verification Commands

```bash
npm install
npm start              # http://localhost:5000
```

---

## Assumptions Made During Week 4 Implementation

- Task objects include `id`, `title`, `description`, and `completed` fields (handbook specifies CRUD but not exact schema; `title` is required)
- IDs are auto-incremented positive integers stored as strings
- Postman/Thunder Client is the primary manual testing tool
- Lab screenshots are captured manually outside the repository
