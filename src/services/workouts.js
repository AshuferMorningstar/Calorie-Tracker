const weekKeyStorage = 'calorieWise.workoutCompletionWeek'

const weekStartKey = () => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - date.getDay())
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export const resetWorkoutCompletionForNewWeek = () => {
  const currentWeek = weekStartKey()
  try {
    if (localStorage.getItem(weekKeyStorage) === currentWeek) return
    for (let index = 1; index <= 7; index += 1) {
      const key = `calorieWise.workouts.day-${index}`
      const stored = localStorage.getItem(key)
      if (!stored) continue
      const workouts = JSON.parse(stored)
      if (Array.isArray(workouts)) {
        localStorage.setItem(key, JSON.stringify(workouts.map((workout) => ({ ...workout, completed: false }))))
      }
    }
    localStorage.setItem(weekKeyStorage, currentWeek)
  } catch (error) {}
}

export const scheduleWorkoutWeekReset = (onReset) => {
  const now = new Date()
  const nextWeek = new Date(now)
  nextWeek.setHours(0, 0, 0, 0)
  nextWeek.setDate(now.getDate() + (7 - now.getDay()))
  const timer = setTimeout(() => {
    resetWorkoutCompletionForNewWeek()
    onReset()
  }, Math.max(1000, nextWeek.getTime() - now.getTime() + 50))
  return () => clearTimeout(timer)
}
