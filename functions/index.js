const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')

const openRouterApiKey = defineSecret('OPENROUTER_API_KEY')
const allowedUnits = new Set(['g', 'count'])

exports.lookupNutrition = onCall(
  { secrets: [openRouterApiKey], timeoutSeconds: 30, region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be signed in to use nutrition lookup.')
    }

    const foodName = typeof request.data?.foodName === 'string' ? request.data.foodName.trim() : ''
    const unit = typeof request.data?.unit === 'string' ? request.data.unit.trim().toLowerCase() : ''

    if (!foodName || foodName.length > 120) {
      throw new HttpsError('invalid-argument', 'Enter a valid food name.')
    }
    if (!allowedUnits.has(unit)) {
      throw new HttpsError('invalid-argument', 'Choose grams or count as the unit.')
    }

    const unitInstruction = unit === 'g'
      ? 'Return nutrition per 100 grams.'
      : 'Return nutrition per one count or piece.'

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${openRouterApiKey.value()}`,
        'X-Title': 'Calorie Wise'
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-lightning:free',
        max_tokens: 180,
        temperature: 0,
        reasoning: { enabled: true },
        response_format: { type: 'json_object' },
        messages: [{
          role: 'system',
          content: 'You provide cautious nutrition estimates. Respond with JSON only, no markdown or explanation.'
        }, {
          role: 'user',
          content: `Estimate calories and protein for this food: "${foodName}". ${unitInstruction} Use a typical edible serving and return numbers only in this exact shape: {"calories": number, "protein": number}. Calories must be kcal and protein must be grams. Use non-negative numbers.`
        }]
      })
    })

    if (!response.ok) {
      console.error('OpenRouter nutrition request failed:', response.status)
      throw new HttpsError('unavailable', 'Nutrition lookup is temporarily unavailable.')
    }

    const result = await response.json()
    const text = result.choices?.[0]?.message?.content || ''
    let nutrition
    try {
      nutrition = JSON.parse(text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, ''))
    } catch (error) {
      throw new HttpsError('internal', 'Nutrition lookup returned an invalid result.')
    }

    const calories = Number(nutrition.calories)
    const protein = Number(nutrition.protein)
    if (!Number.isFinite(calories) || calories < 0 || !Number.isFinite(protein) || protein < 0 || calories > 10000 || protein > 1000) {
      throw new HttpsError('internal', 'Nutrition lookup returned invalid values.')
    }

    return { unit, calories: Math.round(calories), protein: Math.round(protein * 10) / 10 }
  }
)
