const tasks = []
let nextId = 1

function getAllTasks(req, res) {
  res.status(200).json(tasks)
}

function getTaskById(req, res, next) {
  try {
    const { id } = req.params
    const task = tasks.find((task) => task.id === id)

    if (!task) {
      return res.status(404).json({ error: `Task with id ${id} not found` })
    }

    res.status(200).json(task)
  } catch (err) {
    next(err)
  }
}

function createTask(req, res, next) {
  try {
    const { title, description, completed } = req.body

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required and must be a non-empty string' })
    }

    const task = {
      id: String(nextId++),
      title: title.trim(),
      description: typeof description === 'string' ? description.trim() : '',
      completed: Boolean(completed),
    }

    tasks.push(task)
    res.status(201).json(task)
  } catch (err) {
    next(err)
  }
}

function updateTask(req, res, next) {
  try {
    const { id } = req.params
    const taskIndex = tasks.findIndex((task) => task.id === id)

    if (taskIndex === -1) {
      return res.status(404).json({ error: `Task with id ${id} not found` })
    }

    const existingTask = tasks[taskIndex]
    const { title, description, completed } = req.body

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ error: 'Title must be a non-empty string' })
      }
      existingTask.title = title.trim()
    }

    if (description !== undefined) {
      existingTask.description = typeof description === 'string' ? description.trim() : ''
    }

    if (completed !== undefined) {
      existingTask.completed = Boolean(completed)
    }

    tasks[taskIndex] = existingTask
    res.status(200).json(existingTask)
  } catch (err) {
    next(err)
  }
}

function deleteTask(req, res, next) {
  try {
    const { id } = req.params
    const taskIndex = tasks.findIndex((task) => task.id === id)

    if (taskIndex === -1) {
      return res.status(404).json({ error: `Task with id ${id} not found` })
    }

    const deletedTask = tasks.splice(taskIndex, 1)[0]
    res.status(200).json({ message: 'Task deleted successfully', task: deletedTask })
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
