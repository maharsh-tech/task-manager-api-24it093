function validateAuthBody(req, res, next) {
  const { email, password } = req.body || {}

  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ error: 'Email is required.' })
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Password is required.' })
  }

  next()
}

module.exports = validateAuthBody
