# Task Manager API — Specification

**Project:** `task-manager-api-24it093`  
**Author:** Maharsh Solanki — Roll No. 24IT093  
**Practical:** Week 4 (Express REST API) + Week 5 (MongoDB / Mongoose)  
**Version:** 1.0.0

---

## Overview

RESTful JSON API for managing tasks. Data is persisted in **MongoDB** via **Mongoose**. The server uses an Express middleware pipeline for logging, validation, 404 handling, and centralized error responses.

| Property | Value |
|----------|-------|
| Base URL | `http://localhost:5000` |
| Protocol | HTTP |
| Request body format | JSON |
| Response format | JSON |
| Authentication | None (Week 7) |
| CORS | Enabled (`cors` middleware, Practical 6) |
| Database | MongoDB Atlas (`task-manager-api` database, `tasks` collection) |

---

## Getting Started

```bash
cp .env.example .env
# Set MONGO_URI in .env

npm install
npm start
```

Successful startup output:

```
MongoDB connected
Server running on port 5000
```

---

## Middleware Pipeline

Every request passes through the following order:

```
Request
  → express.json()
  → cors()
  → requestLogger
  → /tasks router (route-specific middleware on some routes)
  → notFoundHandler (undefined routes)
  → errorHandler (global)
  → Response
```

| Middleware | Scope | Purpose |
|------------|-------|---------|
| `express.json()` | Global | Parse JSON request bodies |
| `cors()` | Global | Allow browser requests from React (`localhost:5173`) — Practical 6 |
| `requestLogger` | Global | Log method, URL, ISO timestamp to console |
| `validateContentType` | POST, PUT `/tasks` | Require `Content-Type: application/json` |
| `validateTaskId` | GET, PUT, DELETE `/tasks/:id` | Validate MongoDB ObjectId format |
| `notFoundHandler` | Global (after routes) | 404 for undefined routes |
| `errorHandler` | Global (last) | Structured errors for validation, cast, and server failures |

---

## Task Data Model

MongoDB documents are shaped by the Mongoose schema in `models/Task.js`.

### Fields

| Field | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| `_id` | ObjectId | Auto | Auto-generated | MongoDB primary key |
| `title` | String | Yes | — | Trimmed on save/update via pre-hook |
| `description` | String | No | — | Optional |
| `completed` | Boolean | No | `false` | Task completion status |
| `priority` | String | No | — | Enum: `low`, `medium`, `high` |
| `createdAt` | Date | No | `Date.now` | Set on create |
| `__v` | Number | Auto | `0` | Mongoose version key (internal) |

### Example Task Object

```json
{
  "_id": "6a755d38cdb15becd13e0d74",
  "title": "Study Mongoose",
  "description": "Week 5 lab",
  "completed": false,
  "priority": "high",
  "createdAt": "2026-08-07T04:21:12.468Z",
  "__v": 0
}
```

### Schema Behaviors

- **Title trimming:** Leading/trailing whitespace is removed on create (`pre('save')`) and update (`pre('findOneAndUpdate')`).
- **Validation:** Invalid data is rejected by Mongoose before reaching the database.
- **Persistence:** Tasks survive server restarts (unlike Practical 4 in-memory storage).

---

## Common Headers

### Request headers (POST / PUT)

| Header | Value | Required |
|--------|-------|----------|
| `Content-Type` | `application/json` | Yes (POST, PUT) |

### Response headers

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json; charset=utf-8` |

---

## Endpoints

### Summary

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/tasks` | List all tasks | No |
| GET | `/tasks/:id` | Get a single task | No |
| POST | `/tasks` | Create a task | No |
| PUT | `/tasks/:id` | Update a task | No |
| DELETE | `/tasks/:id` | Delete a task | No |

---

### 1. List All Tasks

**GET** `/tasks`

Returns every task in the database, newest/oldest order not guaranteed.

#### Request

- **Headers:** None required
- **Body:** None

#### Success Response — `200 OK`

```json
[
  {
    "_id": "6a755d38cdb15becd13e0d74",
    "title": "Study Mongoose",
    "description": "Week 5 lab",
    "completed": false,
    "priority": "high",
    "createdAt": "2026-08-07T04:21:12.468Z",
    "__v": 0
  }
]
```

Empty database:

```json
[]
```

#### Error Responses

| Status | Condition |
|--------|-----------|
| 500 | Server or database error |

#### Example (curl)

```bash
curl http://localhost:5000/tasks
```

---

### 2. Get Task by ID

**GET** `/tasks/:id`

Returns a single task by MongoDB ObjectId.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | ObjectId (24-char hex string) | Task `_id` |

#### Request

- **Headers:** None required
- **Body:** None

#### Success Response — `200 OK`

```json
{
  "_id": "6a755d38cdb15becd13e0d74",
  "title": "Study Mongoose",
  "description": "Week 5 lab",
  "completed": true,
  "priority": "high",
  "createdAt": "2026-08-07T04:21:12.468Z",
  "__v": 0
}
```

#### Error Responses

| Status | Body | Condition |
|--------|------|-----------|
| 400 | `{ "error": "Invalid task ID format." }` | `id` is not a valid ObjectId |
| 404 | `{ "error": "Task with id <id> not found" }` | Valid ObjectId, no matching document |
| 500 | `{ "error": "Something went wrong" }` | Server error |

#### Example (curl)

```bash
curl http://localhost:5000/tasks/6a755d38cdb15becd13e0d74
```

---

### 3. Create Task

**POST** `/tasks`

Creates a new task in MongoDB.

#### Request

- **Headers:** `Content-Type: application/json` (required)
- **Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | String | Yes | Task title (trimmed before save) |
| `description` | String | No | Task description |
| `completed` | Boolean | No | Defaults to `false` |
| `priority` | String | No | One of: `low`, `medium`, `high` |

#### Example Request Body

```json
{
  "title": "Study Mongoose",
  "description": "Week 5 lab",
  "priority": "high"
}
```

#### Success Response — `201 Created`

```json
{
  "_id": "6a755d38cdb15becd13e0d74",
  "title": "Study Mongoose",
  "description": "Week 5 lab",
  "completed": false,
  "priority": "high",
  "createdAt": "2026-08-07T04:21:12.468Z",
  "__v": 0
}
```

#### Error Responses

| Status | Body | Condition |
|--------|------|-----------|
| 400 | `{ "error": "Content-Type must be application/json" }` | Missing or wrong Content-Type |
| 400 | `{ "error": "Validation failed", "details": [...] }` | Schema validation failed (e.g. missing title, invalid priority) |
| 500 | `{ "error": "Something went wrong" }` | Server error |

#### Validation Error Example — missing title

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "title",
      "message": "Path `title` is required."
    }
  ]
}
```

#### Validation Error Example — invalid priority

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "priority",
      "message": "`urgent` is not a valid enum value for path `priority`."
    }
  ]
}
```

#### Example (curl)

```bash
curl -X POST http://localhost:5000/tasks \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Study Mongoose\",\"description\":\"Week 5 lab\",\"priority\":\"high\"}"
```

---

### 4. Update Task

**PUT** `/tasks/:id`

Partially or fully updates an existing task. Only fields sent in the body are updated. Schema validators run on update (`runValidators: true`).

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | ObjectId | Task `_id` |

#### Request

- **Headers:** `Content-Type: application/json` (required)
- **Body:** Any subset of task fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | String | No | Updated title (trimmed) |
| `description` | String | No | Updated description |
| `completed` | Boolean | No | Updated completion status |
| `priority` | String | No | `low`, `medium`, or `high` |

#### Example Request Body

```json
{
  "completed": true
}
```

#### Success Response — `200 OK`

```json
{
  "_id": "6a755d38cdb15becd13e0d74",
  "title": "Study Mongoose",
  "description": "Week 5 lab",
  "completed": true,
  "priority": "high",
  "createdAt": "2026-08-07T04:21:12.468Z",
  "__v": 0
}
```

#### Error Responses

| Status | Body | Condition |
|--------|------|-----------|
| 400 | `{ "error": "Content-Type must be application/json" }` | Missing or wrong Content-Type |
| 400 | `{ "error": "Invalid task ID format." }` | Invalid ObjectId |
| 400 | `{ "error": "Validation failed", "details": [...] }` | Schema validation failed |
| 404 | `{ "error": "Task with id <id> not found" }` | Task does not exist |
| 500 | `{ "error": "Something went wrong" }` | Server error |

#### Example (curl)

```bash
curl -X PUT http://localhost:5000/tasks/6a755d38cdb15becd13e0d74 \
  -H "Content-Type: application/json" \
  -d "{\"completed\":true}"
```

---

### 5. Delete Task

**DELETE** `/tasks/:id`

Removes a task from MongoDB.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | ObjectId | Task `_id` |

#### Request

- **Headers:** None required
- **Body:** None

#### Success Response — `200 OK`

```json
{
  "message": "Task deleted successfully",
  "task": {
    "_id": "6a755d38cdb15becd13e0d74",
    "title": "Study Mongoose",
    "description": "Week 5 lab",
    "completed": true,
    "priority": "high",
    "createdAt": "2026-08-07T04:21:12.468Z",
    "__v": 0
  }
}
```

#### Error Responses

| Status | Body | Condition |
|--------|------|-----------|
| 400 | `{ "error": "Invalid task ID format." }` | Invalid ObjectId |
| 404 | `{ "error": "Task with id <id> not found" }` | Task does not exist |
| 500 | `{ "error": "Something went wrong" }` | Server error |

#### Example (curl)

```bash
curl -X DELETE http://localhost:5000/tasks/6a755d38cdb15becd13e0d74
```

---

## Undefined Routes

Any request to a path that is not `/tasks` or `/tasks/:id` returns:

**404 Not Found**

```json
{
  "error": "Route not found",
  "path": "/unknown",
  "method": "GET"
}
```

---

## Error Response Reference

### Standard Error Shapes

| HTTP Status | Meaning | Response shape |
|-------------|---------|------------------|
| 400 | Bad request / validation | `{ "error": "..." }` or `{ "error": "Validation failed", "details": [...] }` |
| 404 | Not found | `{ "error": "..." }` (task or route) |
| 500 | Internal server error | `{ "error": "Something went wrong" }` |

### Validation Error Detail Object

```json
{
  "field": "title",
  "message": "Path `title` is required."
}
```

### Error Handling Rules

- Raw Mongoose error objects are **never** sent to the client.
- Stack traces are logged server-side via `console.error(err.stack)`.
- `ValidationError` → 400 with structured `details` array.
- `CastError` (invalid ObjectId in DB query) → 400.
- Unhandled errors → 500 with generic message.

---

## HTTP Status Code Summary

| Code | Usage in this API |
|------|-------------------|
| 200 | Successful GET, PUT, DELETE |
| 201 | Successful POST (task created) |
| 400 | Invalid ID, missing Content-Type, schema validation failure |
| 404 | Task not found, route not found |
| 500 | Unexpected server error |

---

## Postman Quick Reference

| # | Method | URL | Body |
|---|--------|-----|------|
| 1 | GET | `http://localhost:5000/tasks` | — |
| 2 | GET | `http://localhost:5000/tasks/{{taskId}}` | — |
| 3 | POST | `http://localhost:5000/tasks` | `{ "title": "...", "description": "...", "priority": "high" }` |
| 4 | PUT | `http://localhost:5000/tasks/{{taskId}}` | `{ "completed": true }` |
| 5 | DELETE | `http://localhost:5000/tasks/{{taskId}}` | — |

**Postman variable:** Set `taskId` from the `_id` field returned by POST.

**Headers for POST/PUT:** `Content-Type: application/json`

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB Atlas connection string |

See `.env.example` for the template. Never commit `.env` to git.

---

## Related Files

| File | Role |
|------|------|
| `server.js` | App entry, DB connection, middleware registration |
| `routes/tasks.js` | Route definitions |
| `controllers/taskController.js` | CRUD handler logic |
| `models/Task.js` | Mongoose schema and model |
| `middleware/logger.js` | Request logging |
| `middleware/validateContentType.js` | JSON Content-Type check |
| `middleware/validateTaskId.js` | ObjectId format validation |
| `middleware/notFound.js` | 404 for unknown routes |
| `middleware/errorHandler.js` | Global error handling |

---

## Changelog

| Version | Practical | Changes |
|---------|-----------|---------|
| 1.0.0 | Week 4 | Initial Express CRUD with in-memory storage |
| 1.0.0 | Week 5 | MongoDB/Mongoose persistence, schema validation, priority field, structured errors |
