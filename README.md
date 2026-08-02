# Task Manager API (24IT093)

Express REST API for task management — **Practical 4: RESTful API with Node.js and Express**.

---

## Getting Started

```bash
npm install
npm start          # http://localhost:5000
```

The API is tested with Postman or Thunder Client against `http://localhost:5000`.

---

## Practical 4 – RESTful API with Node.js and Express

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
[404 Handler] → [Global Error Handler]
```

### Features Implemented

- **CRUD endpoints** for tasks stored in an in-memory array
- **Request logging middleware** — logs method, URL, and ISO timestamp for every request
- **Content-Type validation** — rejects POST/PUT requests without `application/json`
- **Task ID validation** — route-specific middleware validates numeric IDs on GET/PUT/DELETE by ID
- **404 handler** — structured JSON response for undefined routes
- **Global error handler** — last middleware in the pipeline; returns `{ error: 'Something went wrong' }` with status 500

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
  "id": "1",
  "title": "Study Express",
  "description": "Week 4 lab",
  "completed": false
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
  -d '{"title":"Study Express","description":"Week 4 lab"}'
```

### Theory & Analysis Questions

#### 1. Why must the error handling middleware be defined last in the middleware chain?
Express processes middleware in registration order. The error handler has four parameters `(err, req, res, next)` and only runs when `next(err)` is called or an error is thrown. If it is registered before routes, unmatched errors from routes defined later will bypass it. Placing it last ensures every route and middleware has already executed, so any error propagates to the single centralized handler.

#### 2. What is the difference between `app.use()` and a route-specific middleware?
`app.use()` registers middleware globally — it runs for every request matching the path prefix (or all requests if no path is given). Route-specific middleware is attached to individual routes (e.g. `router.put('/:id', validateTaskId, updateTask)`) and only executes for requests hitting that route. Global middleware suits cross-cutting concerns like logging; route-specific middleware suits validation tied to a particular endpoint.

#### 3. Why is it considered bad practice to send raw error stack traces to the client?
Stack traces expose internal file paths, function names, and library versions that help attackers map the server architecture. They also leak implementation details unrelated to the user's request. A generic `{ error: 'Something went wrong' }` response keeps the client informed while detailed diagnostics are logged server-side via `console.error(err.stack)`.

---

## Project Structure

```
task-manager-api-24it093/
├── server.js                   # App entry: middleware pipeline + listen(5000)
├── package.json                # Express dependency & start script
├── routes/
│   └── tasks.js                # CRUD route definitions + route middleware
├── controllers/
│   └── taskController.js       # In-memory task storage & handler logic
└── middleware/
    ├── logger.js               # Global request logging
    ├── validateContentType.js  # POST/PUT Content-Type check
    ├── validateTaskId.js       # Route-specific numeric ID validation
    ├── notFound.js             # 404 handler for undefined routes
    └── errorHandler.js         # Global error handler (last in chain)
```

---

## Author

Maharsh Solanki — Roll No. 24IT093
