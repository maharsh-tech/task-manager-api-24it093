const express = require('express')
const requestLogger = require('./middleware/logger')
const notFoundHandler = require('./middleware/notFound')
const errorHandler = require('./middleware/errorHandler')
const tasksRouter = require('./routes/tasks')

const app = express()
const PORT = 5000

app.use(express.json())
app.use(requestLogger)

app.use('/tasks', tasksRouter)

app.use(notFoundHandler)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
