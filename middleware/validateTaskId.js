function validateTaskId(req, res, next) {
  const { id } = req.params

  if (!/^\d+$/.test(id)) {
    return res.status(400).json({
      error: 'Invalid task ID format. ID must be a positive integer.',
    })
  }

  next()
}

module.exports = validateTaskId
