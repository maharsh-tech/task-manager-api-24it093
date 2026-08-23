const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  completed: { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'medium', 'high'] },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
})

taskSchema.index({ userId: 1 })

taskSchema.pre('save', function () {
  if (this.title) {
    this.title = this.title.trim()
  }
})

taskSchema.pre('findOneAndUpdate', function () {
  const update = this.getUpdate()

  if (update.title && typeof update.title === 'string') {
    update.title = update.title.trim()
  }

  if (update.$set && update.$set.title && typeof update.$set.title === 'string') {
    update.$set.title = update.$set.title.trim()
  }
})

module.exports = mongoose.model('Task', taskSchema)
