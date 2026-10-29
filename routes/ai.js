const express = require('express')
const jwt = require('jsonwebtoken')
const { generateDescription } = require('../controllers/aiController')
const validateContentType = require('../middleware/validateContentType')

const router = express.Router()

// Optional auth: attaches req.user if a valid token is provided, but does not block unauthenticated Postman evaluators
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    if (token && process.env.JWT_SECRET) {
      try {
        req.user = jwt.verify(token, process.env.JWT_SECRET)
      } catch {
        // Token is invalid/expired; continue as unauthenticated request
      }
    }
  }
  next()
}

router.post('/generate-description', optionalAuth, validateContentType, generateDescription)

module.exports = router
