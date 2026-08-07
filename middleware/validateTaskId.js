const mongoose = require('mongoose')

function validateTaskId(req, res, next) {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: 'Invalid task ID format.',
    })
  }

  next()
}

module.exports = validateTaskId
