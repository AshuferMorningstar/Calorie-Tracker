export const lookupNutrition = async (foodName, unit) => {
  const response = await fetch('/api/nutrition', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ foodName, unit })
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(result.error || 'Nutrition lookup is temporarily unavailable.')
  }
  return result
}
