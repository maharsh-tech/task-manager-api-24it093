const Task = require('../models/Task')

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
    const tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: -1 })
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
    res.status(201).json(task)
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

    res.status(200).json({ message: 'Task deleted successfully', task })
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
