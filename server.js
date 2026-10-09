require('dotenv').config()

const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const requestLogger = require('./middleware/logger')
const notFoundHandler = require('./middleware/notFound')
const errorHandler = require('./middleware/errorHandler')
const tasksRouter = require('./routes/tasks')
const authRouter = require('./routes/auth')
require('./listeners')

const app = express()
const PORT = Number(process.env.PORT) || 5000
const CORS_ORIGIN = process.env.CORS_ORIGIN

if (!process.env.MONGO_URI) {
  console.error('Missing MONGO_URI in .env')
  process.exit(1)
}

if (!CORS_ORIGIN) {
  console.error('Missing CORS_ORIGIN in .env')
  process.exit(1)
}

if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET in .env')
  process.exit(1)
}

app.use(express.json())
app.use(cors({ origin: CORS_ORIGIN }))
app.use(requestLogger)

app.use('/auth', authRouter)
app.use('/tasks', tasksRouter)

app.use(notFoundHandler)
app.use(errorHandler)

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected')
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
      console.log(`CORS origin: ${CORS_ORIGIN}`)
    })
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err)
    process.exit(1)
  })
