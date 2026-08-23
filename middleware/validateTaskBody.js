function validateTaskBody(req, res, next) {
  if (req.method !== 'POST') {
    return next()
  }

  const title = req.body?.title

  if (title === undefined || title === null || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Title is required.' })
  }

  next()
}

module.exports = validateTaskBody
