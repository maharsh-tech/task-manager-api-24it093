const Task = require('../models/Task')

async function getAllTasks(req, res, next) {
  try {
    const tasks = await Task.find()
    res.status(200).json(tasks)
  } catch (err) {
    next(err)
  }
}

async function getTaskById(req, res, next) {
  try {
    const { id } = req.params
    const task = await Task.findById(id)

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
    const task = await Task.create(req.body)
    res.status(201).json(task)
  } catch (err) {
    next(err)
  }
}

async function updateTask(req, res, next) {
  try {
    const { id } = req.params
    const task = await Task.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })

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
    const task = await Task.findByIdAndDelete(id)

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
