const assert = require('assert')
const taskEvents = require('../events')
require('../listeners')

console.log('[Test] Running Practical 10 EventEmitter verification...')

let errorFired = false
taskEvents.once('error', (err) => {
  errorFired = true
  console.log('[Test] Handled error event caught successfully:', err.message)
})

// Trigger error listener test
taskEvents.emit('task-created', null)

// Trigger task-deleted test
taskEvents.emit('task-deleted', { title: 'Delete Test', userId: 'user_test_99' })

// Trigger task-created async test
const apiTimestamp = new Date().toISOString()
console.log(`[API] Response sent at ${apiTimestamp}`)
taskEvents.emit('task-created', { title: 'Async Non-Blocking Test', userId: 'user_test_101' })

setTimeout(() => {
  assert(errorFired, 'Expected error listener to fire on null task')
  console.log('[Test] Practical 10 event checks passed successfully!')
  process.exit(0)
}, 2500)
