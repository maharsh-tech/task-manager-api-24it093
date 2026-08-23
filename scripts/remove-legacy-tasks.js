require('dotenv').config()

const mongoose = require('mongoose')
const Task = require('../models/Task')

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('Missing MONGO_URI in .env')
    process.exit(1)
  }

  await mongoose.connect(process.env.MONGO_URI)

  const result = await Task.deleteMany({
    $or: [{ userId: { $exists: false } }, { userId: null }],
  })

  console.log(`Removed ${result.deletedCount} legacy task(s) without userId.`)
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
