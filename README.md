# Task Manager API (24IT093)

Express REST API for task management — **Practical 4, 5 & 6: RESTful API with Node.js, Express, MongoDB, and CORS for React**.

Frontend (separate repo): [maharshsolanki-v2](https://github.com/maharsh-tech/maharshsolanki-v2)

---

## Getting Started

1. Copy the environment file and configure values:

```bash
cp .env.example .env
# Edit .env:
#   MONGO_URI     — MongoDB Atlas connection string
#   PORT          — API port (default example: 5000)
#   CORS_ORIGIN   — allowed frontend origin (example: http://localhost:5173)
```

2. Install dependencies and start the server:

```bash
npm install
npm start
```

The API works with Postman/Thunder Client and with the React frontend origin set in `CORS_ORIGIN`.

On successful startup you should see:

```
MongoDB connected
Server running on port <PORT>
CORS origin: <CORS_ORIGIN>
```

### Dual-server local setup (Practical 6)

1. Start this API (`npm start`) using values from `.env`.
2. In the frontend repo, set `VITE_API_BASE_URL` to this API and run `npm run dev`.
3. The React app calls the API via `src/api.js` (no hardcoded host).

---

## Practical 6 – Full Stack Integration (CORS)

### What changed on the backend

- Installed and enabled the `cors` package with **origin from `CORS_ORIGIN` in `.env`**.
- `PORT` also comes from `.env`.
- Middleware order: `express.json()` → `cors({ origin })` → request logger → `/tasks` routes → 404 → error handler.
- No schema or CRUD handler changes — same MongoDB-backed endpoints as Practical 5.

### Why CORS is required

Browsers enforce the same-origin policy. The frontend origin differs from the API origin, so without `Access-Control-Allow-*` headers the browser rejects responses. Configuring `CORS_ORIGIN` in `.env` keeps that value out of source code.

---

## Practical 5 – MongoDB Integration and Schema Design with Mongoose

### Architecture Overview

```
Client (Postman / Browser)
        |
        v
[Request Logging Middleware]
        |
        v
Express Router  (/tasks)
├── GET    /tasks       → getAllTasks
├── GET    /tasks/:id   → getTaskById
├── POST   /tasks       → createTask
├── PUT    /tasks/:id   → updateTask
└── DELETE /tasks/:id   → deleteTask
        |
        v
Mongoose ODM  (models/Task.js)
        |
        v
MongoDB Database  (tasks collection)
        |
        v
[404 Handler] → [Global Error Handler]
```

### Features Implemented

- **MongoDB persistence** via Mongoose — tasks survive server restarts
- **Task schema** with required fields, defaults, and enum validation
- **CRUD endpoints** using `Task.find()`, `Task.create()`, `Task.findByIdAndUpdate()`, `Task.findByIdAndDelete()`
- **Request logging middleware** — logs method, URL, and ISO timestamp for every request
- **Content-Type validation** — rejects POST/PUT requests without `application/json`
- **Task ID validation** — validates MongoDB ObjectId format on GET/PUT/DELETE by ID
- **404 handler** — structured JSON response for undefined routes and missing tasks
- **Global error handler** — returns structured validation errors (not raw Mongoose objects)
- **Pre-save hook** — automatically trims whitespace from the title field
- **Priority field** — optional enum: `low`, `medium`, `high`

### Task Schema

| Field | Type | Constraints |
|-------|------|-------------|
| `title` | String | required |
| `description` | String | optional |
| `completed` | Boolean | default `false` |
| `priority` | String | enum: `low`, `medium`, `high` (optional) |
| `createdAt` | Date | default `Date.now` |

### API Endpoints

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| GET | `/tasks` | 200 | List all tasks |
| GET | `/tasks/:id` | 200 / 404 | Retrieve a single task by ID |
| POST | `/tasks` | 201 | Create a task (`title` required) |
| PUT | `/tasks/:id` | 200 / 404 | Update a task by ID |
| DELETE | `/tasks/:id` | 200 / 404 | Delete a task by ID |

**Task object shape:**

```json
{
  "_id": "66b1a2c3d4e5f6789012345",
  "title": "Study Express",
  "description": "Week 5 lab",
  "completed": false,
  "priority": "medium",
  "createdAt": "2026-08-07T04:12:00.000Z"
}
```

**Validation error shape:**

```json
{
  "error": "Validation failed",
  "details": [
    { "field": "title", "message": "Path `title` is required." }
  ]
}
```

### Testing

Test manually with Postman or Thunder Client against `http://localhost:5000`.

Example requests:

```bash
# List all tasks
curl http://localhost:5000/tasks

# Create a task
curl -X POST http://localhost:5000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Study Express","description":"Week 5 lab","priority":"high"}'

# Get task by ID
curl http://localhost:5000/tasks/<task-id>

# Update a task
curl -X PUT http://localhost:5000/tasks/<task-id> \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'

# Delete a task
curl -X DELETE http://localhost:5000/tasks/<task-id>
```

**Persistence check:** Create a task, restart the server, then `GET /tasks` — the task should still be present in MongoDB.

### Theory & Analysis Questions

#### 1. What is the purpose of a schema in a NoSQL database like MongoDB, given that MongoDB itself is schema-less?
MongoDB stores flexible documents without enforcing a fixed table structure at the database level. A Mongoose schema adds an application-level contract: it defines expected field types, required fields, defaults, and enums before data reaches the database. This gives developers predictable data shape and validation without sacrificing MongoDB's document flexibility.

#### 2. Why is it important to define required fields and default values at the schema level rather than relying on frontend validation alone?
Frontend validation can be bypassed — any client (Postman, curl, another app) can send requests directly to the API. Schema-level validation ensures invalid data is rejected at the server regardless of the client. Default values (`completed: false`, `createdAt: Date.now`) are applied consistently for every create operation, even when the client omits those fields.

#### 3. What happens internally when a document fails Mongoose validation — where is the request stopped?
When a Mongoose operation violates the schema (e.g. missing required `title`), Mongoose throws a `ValidationError` before the document is saved. The controller's `catch` block forwards this to the global error handler via `next(err)`, which converts it into a structured 400 JSON response. The invalid document never reaches MongoDB.

---

## Practical 4 – RESTful API with Node.js and Express

Practical 4 established the Express middleware pipeline and CRUD route structure. Practical 5 replaced the in-memory array with MongoDB persistence while keeping the same route paths and middleware order.

### Features from Practical 4 (retained)

- Modular `routes/`, `controllers/`, `middleware/` structure
- Request logging, Content-Type validation, 404 handler, global error handler
- Same CRUD endpoints at `/tasks`

---

## Project Structure

```
task-manager-api-24it093/
├── .env.example                # MongoDB URI template (copy to .env)
├── server.js                   # App entry: dotenv, mongoose connect, listen(5000)
├── package.json
├── models/
│   └── Task.js                 # Mongoose schema, validation, pre-save hooks
├── routes/
│   └── tasks.js                # CRUD route definitions + route middleware
├── controllers/
│   └── taskController.js       # Async Mongoose CRUD handlers
└── middleware/
    ├── logger.js               # Global request logging
    ├── validateContentType.js  # POST/PUT Content-Type check
    ├── validateTaskId.js       # MongoDB ObjectId validation
    ├── notFound.js             # 404 handler for undefined routes
    └── errorHandler.js         # ValidationError, CastError, and 500 handling
```

---

## Author

Maharsh Solanki — Roll No. 24IT093
