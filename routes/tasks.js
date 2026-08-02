const express = require('express')
const {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController')
const validateContentType = require('../middleware/validateContentType')
const validateTaskId = require('../middleware/validateTaskId')

const router = express.Router()

router.get('/', getAllTasks)
router.get('/:id', validateTaskId, getTaskById)
router.post('/', validateContentType, createTask)
router.put('/:id', validateTaskId, validateContentType, updateTask)
router.delete('/:id', validateTaskId, deleteTask)

module.exports = router
