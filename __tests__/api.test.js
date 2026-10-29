process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/taskdb_test'
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_practical_12'

const request = require('supertest')
const app = require('../server')

describe('API Route and Auth Guard Tests (Practical 12)', () => {
  it('GET /tasks without authorization header should return 401 Unauthorized', async () => {
    const res = await request(app).get('/tasks')
    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('error', 'Unauthorized')
  })

  it('GET /nonexistent-route should return 404 Route not found', async () => {
    const res = await request(app).get('/nonexistent-route')
    expect(res.statusCode).toBe(404)
    expect(res.body).toHaveProperty('error', 'Route not found')
  })
})
