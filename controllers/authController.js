const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

async function register(req, res, next) {
  try {
    const { email, password } = req.body
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await User.create({ email: email.trim().toLowerCase(), password: hashedPassword })

    res.status(201).json({
      user: { id: user._id, email: user.email },
    })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Email already registered.' })
    }
    next(err)
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email: email.trim().toLowerCase() })

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    })

    res.status(200).json({ token })
  } catch (err) {
    next(err)
  }
}

async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('email')

    if (!user) {
      return res.status(404).json({ error: 'User not found.' })
    }

    res.status(200).json({ id: user._id, email: user.email })
  } catch (err) {
    next(err)
  }
}

module.exports = { register, login, getMe }
