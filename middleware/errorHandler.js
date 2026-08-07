function errorHandler(err, req, res, next) {
  console.error(err.stack)

  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((error) => ({
      field: error.path,
      message: error.message,
    }))

    return res.status(400).json({
      error: 'Validation failed',
      details,
    })
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid task ID format.' })
  }

  res.status(500).json({ error: 'Something went wrong' })
}

module.exports = errorHandler
