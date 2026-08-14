require('dotenv').config()

const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const requestLogger = require('./middleware/logger')
const notFoundHandler = require('./middleware/notFound')
const errorHandler = require('./middleware/errorHandler')
const tasksRouter = require('./routes/tasks')

const app = express()
const PORT = 5000

app.use(express.json())
app.use(cors())
app.use(requestLogger)

app.use('/tasks', tasksRouter)

app.use(notFoundHandler)
app.use(errorHandler)

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected')
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err)
    process.exit(1)
  })
