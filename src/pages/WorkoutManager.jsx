import { useNavigate } from 'react-router-dom'

const workoutDays = Array.from({ length: 7 }, (_, index) => `Day ${index + 1}`)

export default function WorkoutManager() {
  const navigate = useNavigate()

  return (
    <main style={{ padding: 16, maxWidth: 720, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          className="icon-btn"
          onClick={() => navigate(-1)}
          aria-label="Back"
          style={{ fontSize: 20, lineHeight: 1 }}
        >
          ←
        </button>
        <h1 style={{ margin: 0, fontSize: 22 }}>Workout Manager</h1>
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
              border: '1px solid var(--card-border)',
              background: 'var(--card-bg)'
            }}
          >
            {day}
          </button>
        ))}
      </section>
    </main>
  )
}
