const express = require('express')
const {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController')
const auth = require('../middleware/auth')
const validateContentType = require('../middleware/validateContentType')
const validateTaskId = require('../middleware/validateTaskId')
const validateTaskBody = require('../middleware/validateTaskBody')

const router = express.Router()

router.use(auth)

router.get('/', getAllTasks)
router.get('/:id', validateTaskId, getTaskById)
router.post('/', validateContentType, validateTaskBody, createTask)
router.put('/:id', validateTaskId, validateContentType, updateTask)
router.delete('/:id', validateTaskId, deleteTask)

module.exports = router
