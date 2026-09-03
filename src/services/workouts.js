const weekKeyStorage = 'calorieWise.workoutCompletionWeek'

export const workoutDayNumberForDate = (date = new Date()) => {
  const day = date.getDay()
  return day === 0 ? 7 : day
}

export const workoutDayKeyForDate = (date = new Date()) => `day-${workoutDayNumberForDate(date)}`

export const syncTodayWorkoutAttendance = () => {
  try {
    const stored = localStorage.getItem(`calorieWise.workouts.${workoutDayKeyForDate()}`)
    const workouts = stored ? JSON.parse(stored) : []
    if (!Array.isArray(workouts) || workouts.length === 0 || !workouts.every((workout) => workout.completed)) return false

    const date = new Date()
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    const key = `calorieWise.attendance.${iso}`
    if (localStorage.getItem(key) === '1') return false
    localStorage.setItem(key, '1')
    return true
  } catch (error) {
    return false
  }
}

const weekStartKey = () => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  const daysSinceMonday = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - daysSinceMonday)
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
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7
  nextWeek.setDate(now.getDate() + daysUntilMonday)
  const timer = setTimeout(() => {
    resetWorkoutCompletionForNewWeek()
    onReset()
  }, Math.max(1000, nextWeek.getTime() - now.getTime() + 50))
  return () => clearTimeout(timer)
}
