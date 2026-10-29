const OpenAI = require('openai')

// In-memory rate limiting map: identifier -> timestamp (ms)
const rateLimitMap = new Map()
const RATE_LIMIT_WINDOW_MS = 30 * 1000 // 30 seconds

function getAiClient() {
  const apiKey = process.env.OPENAI_API_KEY || 'missing-key'
  const baseURL = process.env.OPENAI_BASE_URL || undefined
  return new OpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  })
}

/**
 * Generate a task description from a task title using AI
 * Route: POST /api/ai/generate-description
 */
async function generateDescription(req, res) {
  const { title } = req.body || {}

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: [{ field: 'title', message: 'Task title is required to generate a description' }],
    })
  }

  // Rate-limiting check (per user ID or IP)
  const clientKey = req.user?.id || req.ip || 'anonymous'
  const now = Date.now()
  const lastRequestTime = rateLimitMap.get(clientKey)

  if (lastRequestTime && now - lastRequestTime < RATE_LIMIT_WINDOW_MS) {
    const waitSeconds = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - lastRequestTime)) / 1000)
    return res.status(429).json({
      error: `Rate limit exceeded. Please wait ${waitSeconds}s before generating again.`,
    })
  }

  try {
    const client = getAiClient()
    const model = process.env.AI_MODEL || 'gpt-4o-mini'

    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are an assistant for a software task management app. Given a task title, generate a clear, professional, single-paragraph task description (1-2 sentences max). Do not include pleasantries, introductory labels like "Description:", quotes, or markdown backticks.',
        },
        {
          role: 'user',
          content: `Write a short task description for: ${title.trim()}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
      include_reasoning: false,
    })

    let generated = completion?.choices?.[0]?.message?.content?.trim() || ''

    // If a reasoning model was selected and content is empty, attempt extraction from reasoning
    if (!generated && completion?.choices?.[0]?.message?.reasoning) {
      const reasoning = completion.choices[0].message.reasoning.trim()
      const lines = reasoning.split('\n').filter((l) => l.trim().length > 0)
      generated = lines[lines.length - 1] || ''
    }

    // Clean formatting prefixes or quotes if present
    generated = generated.replace(/^(\*\*Description:\*\*|Description:|"|')\s*/i, '').replace(/["']$/g, '').trim()

    if (!generated) {
      return res.status(200).json({
        description: '',
        fallback: true,
        error: 'AI service returned an empty suggestion. Please type your description manually.',
      })
    }

    // Update rate limit on successful external call
    rateLimitMap.set(clientKey, now)

    return res.status(200).json({
      description: generated,
      fallback: false,
    })
  } catch (err) {
    // Graceful degradation: never crash or return 500 when external AI provider fails
    console.warn('AI generation call failed, returning fallback response:', err.message)
    return res.status(200).json({
      description: '',
      fallback: true,
      error: 'AI service temporarily unavailable. Please type your description manually.',
    })
  }
}

module.exports = {
  generateDescription,
}
