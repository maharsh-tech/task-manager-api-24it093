const taskEvents = require('./events')

taskEvents.on('task-created', (task) => {
  try {
    if (!task) {
      throw new Error('Task payload is missing in task-created listener')
    }
    // Simulate slow notification handler (2s delay) to demonstrate non-blocking execution
    setTimeout(() => {
      console.log(
        `[Notification] Task "${task.title}" created at ${new Date().toISOString()} (Assigned User: ${task.userId})`
      )
    }, 2000)
  } catch (err) {
    taskEvents.emit('error', err)
  }
})

taskEvents.on('task-deleted', (task) => {
  try {
    if (!task) {
      throw new Error('Task payload is missing in task-deleted listener')
    }
    console.log(
      `[Notification] Task "${task.title}" deleted at ${new Date().toISOString()} (Assigned User: ${task.userId})`
    )
  } catch (err) {
    taskEvents.emit('error', err)
  }
})

taskEvents.on('error', (err) => {
  console.error(
    `[Event Error] Error handled in task event listener: ${err && err.message ? err.message : err}`
  )
})
