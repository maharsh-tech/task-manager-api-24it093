const Task = require('../models/Task')
const cache = require('../utils/cache')
const taskEvents = require('../events')

function pickTaskFields(body) {
  const { title, description, completed, priority } = body
  const payload = {}

  if (title !== undefined) payload.title = title
  if (description !== undefined) payload.description = description
  if (completed !== undefined) payload.completed = completed
  if (priority !== undefined) payload.priority = priority

  return payload
}

async function getAllTasks(req, res, next) {
  try {
    const cacheKey = `all_tasks:${req.user.id}`
    const cached = cache.get(cacheKey)
    if (cached) {
      return res.status(200).json(cached)
    }

    const tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: -1 })
    cache.set(cacheKey, tasks)
    res.status(200).json(tasks)
  } catch (err) {
    next(err)
  }
}

async function getTaskById(req, res, next) {
  try {
    const { id } = req.params
    const task = await Task.findOne({ _id: id, userId: req.user.id })

    if (!task) {
      return res.status(404).json({ error: `Task with id ${id} not found` })
    }

    res.status(200).json(task)
  } catch (err) {
    next(err)
  }
}

async function createTask(req, res, next) {
  try {
    const task = await Task.create({
      ...pickTaskFields(req.body),
      userId: req.user.id,
    })
    cache.del(`all_tasks:${req.user.id}`)
    console.log(`[API] Response sent at ${new Date().toISOString()}`)
    res.status(201).json(task)
    taskEvents.emit('task-created', task)
  } catch (err) {
    next(err)
  }
}

async function updateTask(req, res, next) {
  try {
    const { id } = req.params
    const task = await Task.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      pickTaskFields(req.body),
      { new: true, runValidators: true },
    )

    if (!task) {
      return res.status(404).json({ error: `Task with id ${id} not found` })
    }

    cache.del(`all_tasks:${req.user.id}`)
    res.status(200).json(task)
  } catch (err) {
    next(err)
  }
}

async function deleteTask(req, res, next) {
  try {
    const { id } = req.params
    const task = await Task.findOneAndDelete({ _id: id, userId: req.user.id })

    if (!task) {
      return res.status(404).json({ error: `Task with id ${id} not found` })
    }

    cache.del(`all_tasks:${req.user.id}`)
    res.status(200).json({ message: 'Task deleted successfully', task })
    taskEvents.emit('task-deleted', task)
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
}
