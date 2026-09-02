const allowedUnits = new Set(['g', 'count'])
const openRouterModel = process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-lightning:free'

const sendError = (res, status, message) => res.status(status).json({ error: message })

const parseNutritionResponse = (content) => {
  const text = Array.isArray(content)
    ? content.map((part) => typeof part === 'string' ? part : part?.text || '').join(' ')
    : typeof content === 'string' ? content : ''
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
  const candidates = [cleaned]
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start >= 0 && end > start) candidates.push(cleaned.slice(start, end + 1))

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate.replace(/^```json\s*/i, '').replace(/\s*```$/, ''))
    } catch (error) {}
  }
  return null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendError(res, 405, 'Method not allowed.')
  }

  const foodName = typeof req.body?.foodName === 'string' ? req.body.foodName.trim() : ''
  const unit = typeof req.body?.unit === 'string' ? req.body.unit.trim().toLowerCase() : ''

  if (!foodName || foodName.length > 120) return sendError(res, 400, 'Enter a valid food name.')
  if (!allowedUnits.has(unit)) return sendError(res, 400, 'Choose grams or count as the unit.')

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return sendError(res, 500, 'Nutrition lookup is not configured.')

  const unitInstruction = unit === 'g'
    ? 'Return nutrition per 100 grams.'
    : 'Return nutrition per one count or piece.'
  const prompt = `Estimate calories and protein for this food: "${foodName}". ${unitInstruction} Use a typical edible serving and return JSON only in this exact shape: {"calories": number, "protein": number}. Calories must be kcal and protein must be grams. Use non-negative numbers.`
  let response
  try {
    response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.APP_URL || 'https://calorie-wise.vercel.app',
        'X-Title': 'Calorie Wise'
      },
      body: JSON.stringify({
        model: openRouterModel,
        max_tokens: 180,
        temperature: 0,
        messages: [
          { role: 'system', content: 'You provide cautious nutrition estimates. After reasoning, your final answer must be only one JSON object with numeric calories and protein fields. Do not include Markdown or any other text.' },
          { role: 'user', content: prompt }
        ]
      })
    })
  } catch (error) {
    console.error('OpenRouter request failed:', error.message)
    return sendError(res, 503, 'Nutrition provider is temporarily unavailable.')
  }

  if (!response.ok) {
    let providerMessage = ''
    try {
      const providerError = await response.json()
      providerMessage = providerError.error?.message || ''
    } catch (error) {}
    console.error('OpenRouter rejected nutrition request:', response.status, providerMessage)
    return sendError(res, response.status === 429 ? 429 : 502, providerMessage
      ? `Nutrition provider rejected the request: ${providerMessage}`
      : `Nutrition provider rejected the request (${response.status}). Check the OpenRouter API key and model configuration.`)
  }

  const result = await response.json()
  const nutrition = parseNutritionResponse(result.choices?.[0]?.message?.content)
  if (!nutrition) {
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
