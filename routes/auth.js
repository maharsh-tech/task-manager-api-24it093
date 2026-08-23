const express = require('express')
const validateAuthBody = require('../middleware/validateAuthBody')
const validateContentType = require('../middleware/validateContentType')
const auth = require('../middleware/auth')
const { register, login, getMe } = require('../controllers/authController')

const router = express.Router()

router.post('/register', validateContentType, validateAuthBody, register)
router.post('/login', validateContentType, validateAuthBody, login)
router.get('/me', auth, getMe)

module.exports = router
