const allowedUnits = new Set(['g', 'count'])
const retryableStatuses = new Set([401, 402, 429, 500, 502, 503, 529])
const claudeModel = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001'

const getApiKeys = () => [
  process.env.CLAUDE_API_KEY,
  process.env.CLAUDE_API_KEY_FALLBACK,
  process.env.CLAUDE_API_KEY_FALLBACK_2 || process.env.CLAUSE_API_KEY_FALLBACK_2,
  process.env.CLAUDE_API_KEY_FALLBACK_3 || process.env.CLAUSE_API_KEY_FALLBACK_3,
  process.env.CLAUDE_API_KEY_FALLBACK_4 || process.env.CLAUSE_API_KEY_FALLBACK_4
].filter(Boolean)

const sendError = (res, status, message) => res.status(status).json({ error: message })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendError(res, 405, 'Method not allowed.')
  }

  const foodName = typeof req.body?.foodName === 'string' ? req.body.foodName.trim() : ''
  const unit = typeof req.body?.unit === 'string' ? req.body.unit.trim().toLowerCase() : ''

  if (!foodName || foodName.length > 120) return sendError(res, 400, 'Enter a valid food name.')
  if (!allowedUnits.has(unit)) return sendError(res, 400, 'Choose grams or count as the unit.')

  const apiKeys = getApiKeys()
  if (apiKeys.length === 0) return sendError(res, 500, 'Nutrition lookup is not configured.')

  const unitInstruction = unit === 'g'
    ? 'Return nutrition per 100 grams.'
    : 'Return nutrition per one count or piece.'
  const prompt = `Estimate calories and protein for this food: "${foodName}". ${unitInstruction} Use a typical edible serving and return JSON only in this exact shape: {"calories": number, "protein": number}. Calories must be kcal and protein must be grams. Use non-negative numbers.`
  let lastStatus = 500

  for (const apiKey of apiKeys) {
    let response
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: claudeModel,
          max_tokens: 180,
          temperature: 0,
          system: 'You provide cautious nutrition estimates. Respond with JSON only, no markdown or explanation.',
          messages: [{ role: 'user', content: prompt }]
        })
      })
    } catch (error) {
      console.error('Claude request failed:', error.message)
      lastStatus = 503
      continue
    }

    lastStatus = response.status
    if (!response.ok) {
      if (retryableStatuses.has(response.status)) continue
      let providerMessage = ''
      try {
        const providerError = await response.json()
        providerMessage = providerError.error?.message || ''
      } catch (error) {}
      if (/credit balance is too low|insufficient credit|purchase credits/i.test(providerMessage)) continue
      console.error('Claude rejected nutrition request:', response.status, providerMessage)
      return sendError(res, 502, providerMessage
        ? `Nutrition provider rejected the request: ${providerMessage}`
        : `Nutrition provider rejected the request (${response.status}). Check the API key and Claude model configuration.`)
    }

    const result = await response.json()
    const text = result.content?.find((block) => block.type === 'text')?.text || ''
    let nutrition
    try {
      nutrition = JSON.parse(text.trim())
    } catch (error) {
      return sendError(res, 502, 'Nutrition lookup returned an invalid result.')
    }

    const calories = Number(nutrition.calories)
    const protein = Number(nutrition.protein)
    if (!Number.isFinite(calories) || calories < 0 || calories > 10000 || !Number.isFinite(protein) || protein < 0 || protein > 1000) {
      return sendError(res, 502, 'Nutrition lookup returned invalid values.')
    }

    return res.status(200).json({
      unit,
      calories: Math.round(calories),
      protein: Math.round(protein * 10) / 10
    })
  }

  return sendError(res, lastStatus === 429 ? 429 : 503, 'All nutrition providers are temporarily unavailable.')
}
