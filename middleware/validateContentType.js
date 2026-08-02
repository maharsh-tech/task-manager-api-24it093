function validateContentType(req, res, next) {
  const contentType = req.get('Content-Type')

  if (!contentType || !contentType.includes('application/json')) {
    return res.status(400).json({
      error: 'Content-Type must be application/json',
    })
  }

  next()
}

module.exports = validateContentType
