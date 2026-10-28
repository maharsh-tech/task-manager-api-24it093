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
#   JWT_SECRET    — signing secret for JWT (never commit real value)
#   JWT_EXPIRES_IN — token expiry (example: 1h)
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

## Practical 11 – Containerization with Docker and Docker Compose

### What Changed

Containerized the full-stack Task Management application using Docker and orchestrated all services using Docker Compose so the entire stack starts with a single command.

1. **`Dockerfile` (backend)**: Node 18 image, copies `package*.json` first for layer caching, runs `npm install`, copies source, exposes port 5000, runs `node server.js`.
2. **`Dockerfile` (frontend — `../maharshsolanki-v2`)**: Node 18 multi-stage build — installs dependencies and builds the Vite app, then exposes port 5173 and runs `npm run preview -- --host`.
3. **`docker-compose.yml`**: Defines 3 services on a shared `app-network` bridge:
   - `mongodb` — official `mongo:7` image, port 27017, named volume `mongo-data` for persistence.
   - `backend` — built from current directory, port 5000, `MONGO_URI` set to `mongodb://mongodb:27017/taskdb` (service name, not localhost).
   - `frontend` — built from `../maharshsolanki-v2`, port 5173, depends on backend.
4. **`.dockerignore`** (both repos): Excludes `node_modules`, `.env`, `.git`, and documentation from build context.

### Architecture

```
docker-compose.yml
├── frontend  (React / Vite, port 5173)
├── backend   (Node / Express, port 5000)
└── mongodb   (official mongo image, port 27017)

Network: app-network (bridge)
frontend ──► backend ──► mongodb
All 3 services start together via: docker-compose up
```

### Running the Full Stack

```bash
# Verify Docker is installed
docker --version
docker compose version

# Start all services (from the backend repo root)
docker-compose up --build

# Confirm all containers are running
docker ps

# Stop all services
docker-compose down
```

The app is accessible at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- MongoDB: `mongodb://localhost:27017`

### Key Questions & Analysis

#### 1. Why does the backend container need to reference MongoDB by its service name (`mongodb`) rather than `localhost`?
Each Docker container has its own network namespace — `localhost` inside the backend container refers to the backend container itself, not the MongoDB container. Docker Compose creates a shared bridge network where containers are accessible by their service name. The service name `mongodb` resolves to the MongoDB container's IP on the `app-network` bridge, allowing the backend to connect.

#### 2. What is the difference between `EXPOSE` in a Dockerfile and the `ports` mapping in `docker-compose.yml`?
`EXPOSE` is a documentation directive — it declares which port the container listens on but does not publish it to the host. The `ports` mapping in `docker-compose.yml` (e.g., `"5000:5000"`) actually publishes the container port to the host machine, making it accessible from `localhost:5000` on the host. Without `ports`, the service is only reachable from other containers on the same Docker network.

#### 3. Why is it bad practice to copy `node_modules` into a Docker image instead of running `npm install` inside the container?
- **Platform mismatch**: Native binary modules (e.g., `bcrypt`) compiled on the host OS may not work inside the Linux container.
- **Bloated build context**: `node_modules` can be hundreds of megabytes, slowing down the `COPY` step and inflating the image.
- **Non-reproducible builds**: The image should be self-contained — installing from `package-lock.json` inside the container guarantees the exact dependency tree regardless of the host's state.

---

## Practical 10 – Asynchronous Processing with Event-Driven Architecture

### What Changed

Implemented asynchronous background processing using Node.js native `EventEmitter` to decouple side effects from the main HTTP request-response cycle without external message broker dependencies.

1. **`events.js`**: Created a dedicated event emitter module extending native `EventEmitter` and exported a singleton `TaskEvents` instance.
2. **`listeners.js`**: Registered listeners for:
   - `task-created`: Logs task title, timestamp, and assigned user ID. Features an artificial 2-second delay (`setTimeout`) to demonstrate non-blocking execution.
   - `task-deleted`: Logs task deletion with task title and assigned user ID.
   - `error`: Catches and logs errors thrown during event processing.
3. **`server.js`**: Requires `listeners.js` once on server startup to register listeners.
4. **`controllers/taskController.js`**:
   - `createTask`: Logs timestamp, sends `res.status(201).json(task)` immediately, and emits `task-created`.
   - `deleteTask`: Sends `res.status(200)` immediately and emits `task-deleted`.

### Execution & Console Log Evidence

Running the verification script (`node scripts/test-events.js`) demonstrates that the HTTP response is sent immediately before background listeners complete:

```
[API] Response sent at 2026-10-09T04:22:37.528Z
[Notification] Task "Delete Test" deleted at 2026-10-09T04:22:37.527Z (Assigned User: user_test_99)
[Notification] Task "Async Non-Blocking Test" created at 2026-10-09T04:22:39.529Z (Assigned User: user_test_101)
```

The API response timestamp (`...37.528Z`) precedes the listener completion timestamp (`...39.529Z`) by ~2 seconds, confirming non-blocking execution.

### Key Questions & Analysis

#### 1. Why does emitting an event not block the API response, even though both run on the same Node.js process?
The HTTP response `res.status(201).json(task)` writes to the response stream immediately. When async work (like `setTimeout` or async I/O) is scheduled in the event listener, Node's event loop offloads execution to the task queues, allowing the call stack to complete and the HTTP response to flush to the client without waiting for the background job to finish.

#### 2. What would happen to API response time if the notification logic were placed directly inside the POST route instead of in an event handler?
The client would be forced to wait for all notification tasks (external webhooks, email delivery, heavy logging) before getting a response. If the notification logic takes 2 seconds, the API response time jumps from ~20ms to >2000ms.

#### 3. Why is EventEmitter a reasonable choice for this scale of application, but not for a production system handling millions of events per day?
`EventEmitter` is an in-process, in-memory construct. It is lightweight, requires no external dependencies or infrastructure, and is simple to run. However, for large-scale production:
- **No persistence**: If the Node process crashes or restarts, all in-memory events are lost.
- **No distribution**: In a multi-instance, load-balanced setup, events cannot be shared across nodes.
- **No queue semantics**: It lacks built-in retries, dead-letter queues, backpressure, and rate limiting. Production systems require distributed message brokers like RabbitMQ, Apache Kafka, or Redis/BullMQ.

---

## Practical 9 – In-Memory Caching and Query Optimization

### What Changed

Installed `node-cache` and created a shared cache instance in `utils/cache.js` (60-second TTL). The `GET /tasks` endpoint now checks the cache before querying MongoDB; on a miss it queries and stores the result, on a hit it returns directly from memory. `POST /tasks`, `PUT /tasks/:id`, and `DELETE /tasks/:id` invalidate the cache after every successful write — failed writes (404, validation error) do not touch the cache.

### Per-User Cache Key (`all_tasks:<userId>`)

The cache key is **not** a single global `'all_tasks'`. Because every task is scoped to `req.user.id` (set by JWT middleware), a global key would serve User A's task list to User B on a cache hit. Using `` `all_tasks:${req.user.id}` `` isolates each user's cached list.

### Response Time Comparison (Cached vs Uncached)

> **Note:** No live MongoDB connection was available in this environment. The table below is a placeholder — fill it in using Postman/Thunder Client or the `curl -w "%{time_total}\n"` technique described in the booklet.

<!-- TODO: student to fill in with real readings from Postman / curl -->

| Sample | Uncached (s) | Cached (s) |
|--------|-------------|------------|
| 1 | ___ | ___ |
| 2 | ___ | ___ |
| 3 | ___ | ___ |

The first cached request (cache MISS) should be similar to uncached. Requests 2–3 (cache HITs) should be noticeably faster since they skip the MongoDB round-trip entirely.

### Key Questions

#### 1. Why must the cache be invalidated on every write, and what breaks if it isn't?
If the cache is not invalidated after a create, update, or delete, subsequent `GET /tasks` requests return stale data from the cache — a newly created task won't appear, a deleted task will still show, or an updated field will display its old value. The user sees data that doesn't match what's actually in MongoDB until the TTL expires.

#### 2. What is a reasonable TTL trade-off in this context?
A 60-second TTL balances freshness and performance: reads within the window are instant (no MongoDB query), and even if a write-invalidation is somehow missed, data self-corrects within a minute. A much shorter TTL (e.g. 5s) reduces the benefit; a much longer one (e.g. 10min) risks serving noticeably stale data if invalidation fails or a different process writes directly to the database.

#### 3. Why doesn't node-cache work correctly across multiple server instances?
`node-cache` stores data in the Node.js process's own heap memory. If you run two instances behind a load balancer, each has its own independent cache. A write hitting Instance A invalidates A's cache but Instance B still serves its stale copy. For multi-instance deployments, a shared external store like Redis is required.

---

## Practical 7 – Authentication and Middleware Pipeline

### Auth endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Create user (bcrypt hashed password) → 201 |
| POST | `/auth/login` | No | Verify password → `{ token }` JWT (1h) |
| GET | `/auth/me` | Bearer JWT | Current user `{ id, email }` |

All `/tasks` routes require `Authorization: Bearer <token>`. Each user only sees and manages their own tasks (`userId` on the Task model, set from the JWT on create).

POST `/tasks` runs validation middleware first — missing `title` returns 400 before the database.

Legacy tasks from before per-user scoping (no `userId`) were removed. To clean any stragglers:

```bash
npm run cleanup:legacy-tasks
```

### Postman test flow

1. `POST /auth/register` with `{ "email", "password" }`
2. `POST /auth/login` → copy `token`
3. Set header `Authorization: Bearer <token>`
4. `GET /tasks`, `POST /tasks`, etc. — each account gets its own task list
5. Log in as a different user → empty list (cannot read another user's task by id → 404)

### Theory & Analysis

1. **Why hash passwords?** Plain-text storage exposes every account if the database leaks. bcrypt is slow and salted, making stolen hashes hard to reverse.
2. **What does auth middleware verify?** It reads the Bearer token, verifies the JWT signature and expiry, and sets `req.user`. Missing or expired tokens return 401.
3. **Why server validation if the frontend validates?** Any client (Postman, curl) can call the API directly. Middleware rejects malformed bodies before Mongoose/DB.

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
├── .dockerignore               # Excludes node_modules, .env from Docker build
├── .env.example                # MongoDB URI template (copy to .env)
├── Dockerfile                  # Backend container: Node 18, port 5000
├── docker-compose.yml          # Orchestrates frontend, backend, MongoDB
├── server.js                   # App entry: dotenv, mongoose connect, listeners, listen(5000)
├── events.js                   # Custom TaskEvents class extending EventEmitter
├── listeners.js                # Async task-created, task-deleted, error listeners
├── package.json
├── models/
│   ├── Task.js                 # Mongoose schema, validation, pre-save hooks
│   └── User.js                 # User schema, password hashing
├── routes/
│   ├── auth.js                 # Register, login, me routes
│   └── tasks.js                # CRUD route definitions + route middleware
├── controllers/
│   ├── authController.js       # Auth handlers (JWT generation, bcrypt compare)
│   └── taskController.js       # CRUD handlers + event emitting
├── middleware/
│   ├── auth.js                 # JWT Bearer token authentication
│   ├── logger.js               # Global request logging
│   ├── validateAuthBody.js     # User registration/login validation
│   ├── validateContentType.js  # POST/PUT Content-Type check
│   ├── validateTaskId.js       # MongoDB ObjectId validation
│   ├── validateTaskPayload.js  # Task body validation
│   ├── notFound.js             # 404 handler for undefined routes
│   └── errorHandler.js         # ValidationError, CastError, and 500 handling
├── utils/
│   └── cache.js                # In-memory node-cache instance
└── scripts/
    ├── remove-legacy-tasks.js  # Utility script for database cleanup
    └── test-events.js          # Practical 10 EventEmitter verification script
```

---

## Author

Maharsh Solanki — Roll No. 24IT093
