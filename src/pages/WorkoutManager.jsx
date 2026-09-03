import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { resetWorkoutCompletionForNewWeek, scheduleWorkoutWeekReset } from '../services/workouts'

const workoutDays = Array.from({ length: 7 }, (_, index) => `Day ${index + 1}`)
const storageKey = (day) => `calorieWise.workouts.${day.toLowerCase().replace(' ', '-')}`

const isDayComplete = (day) => {
  try {
    const stored = localStorage.getItem(storageKey(day))
    const workouts = stored ? JSON.parse(stored) : []
    return Array.isArray(workouts) && workouts.length > 0 && workouts.every((workout) => workout.completed)
  } catch (error) {
    return false
  }
}

export default function WorkoutManager() {
  const navigate = useNavigate()
  const location = useLocation()

  const handleBack = () => {
    navigate(location.state?.from || '/', { state: { openMenu: true } })
  }
  const [completedDays, setCompletedDays] = useState(() => (
    (() => {
      resetWorkoutCompletionForNewWeek()
      return Object.fromEntries(workoutDays.map((day) => [day, isDayComplete(day)]))
    })()
  ))

  useEffect(() => {
    const refresh = () => setCompletedDays(Object.fromEntries(workoutDays.map((day) => [day, isDayComplete(day)])))
    window.addEventListener('calorieWise.workoutsChanged', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('calorieWise.workoutsChanged', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  useEffect(() => scheduleWorkoutWeekReset(() => {
    setCompletedDays(Object.fromEntries(workoutDays.map((day) => [day, isDayComplete(day)])))
  }), [])

  return (
    <main style={{ padding: 16, maxWidth: 720, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          className="icon-btn"
          onClick={handleBack}
          aria-label="Back"
          style={{ fontSize: 20, lineHeight: 1 }}
        >
          ←
        </button>
        <h1 style={{ margin: 0, fontSize: 22 }}>Workout Manager</h1>
        </div>
        <button className="icon-btn" onClick={() => navigate('/')} aria-label="Home" title="Home" style={{ fontSize: 18, lineHeight: 1 }}>⌂</button>
      </header>

      <section style={{ display: 'grid', gap: 10, marginBottom: 18 }} aria-label="Workout days">
        {workoutDays.map((day) => (
          <button
            key={day}
            className="card"
            type="button"
            onClick={() => navigate(`/workout-manager/${day.toLowerCase().replace(' ', '-')}`)}
            style={{
              width: '100%',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'nowrap',
              justifyContent: 'space-between',
              border: '1px solid var(--card-border)',
              background: 'var(--card-bg)'
            }}
          >
            <span style={{ flex: '1 1 auto', minWidth: 0 }}>{day}</span>
            <span
              aria-label={completedDays[day] ? `${day} completed` : `${day} incomplete`}
              title={completedDays[day] ? 'All workouts completed' : 'Complete all workouts to check this day'}
              style={{
                width: 22,
                height: 22,
                flex: '0 0 22px',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: completedDays[day] ? '2px solid var(--accent1)' : '2px solid var(--muted)',
                background: completedDays[day] ? 'var(--accent1)' : 'transparent',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                lineHeight: 1
              }}
            >
              {completedDays[day] ? '✓' : ''}
            </span>
          </button>
        ))}
      </section>
    </main>
  )
}
