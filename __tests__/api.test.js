process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/taskdb_test'
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_practical_12'

const request = require('supertest')
const app = require('../server')

describe('API Route and Auth Guard Tests (Practical 12)', () => {
  it('GET /tasks without authorization header should return 401 Unauthorized', async () => {
    const res = await request(app).get('/tasks')
    expect(res.statusCode).toBe(401)
    expect(res.body).toHaveProperty('error', 'Unauthorized')
  })

  it('GET /nonexistent-route should return 404 Route not found', async () => {
    const res = await request(app).get('/nonexistent-route')
    expect(res.statusCode).toBe(404)
    expect(res.body).toHaveProperty('error', 'Route not found')
  })

  describe('AI Description Generator (Practical 13)', () => {
    it('POST /api/ai/generate-description without body or title returns 400 validation error', async () => {
      const res = await request(app)
        .post('/api/ai/generate-description')
        .send({})
        .set('Content-Type', 'application/json')

      expect(res.statusCode).toBe(400)
      expect(res.body).toHaveProperty('error', 'Validation failed')
    })

    it('POST /api/ai/generate-description without application/json header returns 400', async () => {
      const res = await request(app)
        .post('/api/ai/generate-description')
        .send('title=Test')
        .set('Content-Type', 'text/plain')

      expect(res.statusCode).toBe(400)
      expect(res.body).toHaveProperty('error', 'Content-Type must be application/json')
    })

    it('POST /api/ai/generate-description degrades gracefully with fallback response on external failure', async () => {
      // With test/invalid key, the endpoint must return 200 with fallback: true instead of 500
      const res = await request(app)
        .post('/api/ai/generate-description')
        .send({ title: 'Refactor authentication middleware' })
        .set('Content-Type', 'application/json')

      expect(res.statusCode).toBe(200)
      expect(res.body).toHaveProperty('fallback')
      expect(typeof res.body.description).toBe('string')
    })
  })
})
