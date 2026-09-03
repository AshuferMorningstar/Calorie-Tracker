import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSyncContext } from '../context/SyncContext'
import { resetWorkoutCompletionForNewWeek, scheduleWorkoutWeekReset, syncTodayWorkoutAttendance, workoutDayKeyForDate } from '../services/workouts'

const storageKey = (day) => `calorieWise.workouts.${day}`
const titleStorageKey = (day) => `calorieWise.workoutTitle.${day}`
const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const readWorkouts = (day) => {
  try {
    const stored = localStorage.getItem(storageKey(day))
    const parsed = stored ? JSON.parse(stored) : []
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    return []
  }
}

const normalizeLink = (value) => {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export default function WorkoutDay() {
  const navigate = useNavigate()
  const { day = 'day-1' } = useParams()
  const { triggerSync } = useSyncContext()
  const dayNumber = Math.min(7, Math.max(1, Number(day.replace('day-', '')) || 1))
  const dayLabel = `Day ${dayNumber}`
  const [workouts, setWorkouts] = useState(() => readWorkouts(day))
  const [name, setName] = useState('')
  const [link, setLink] = useState('')
  const [sets, setSets] = useState('')
  const [reps, setReps] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [selectedWorkoutIds, setSelectedWorkoutIds] = useState([])
  const [workoutTitle, setWorkoutTitle] = useState('Your workouts')
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')

  useEffect(() => {
    resetWorkoutCompletionForNewWeek()
    setWorkouts(readWorkouts(day))
    if (syncTodayWorkoutAttendance()) window.dispatchEvent(new Event('calorieWise.attendanceChanged'))
    clearForm()
    try {
      const storedTitle = localStorage.getItem(titleStorageKey(day)) || 'Your workouts'
      setWorkoutTitle(storedTitle)
      setTitleDraft(storedTitle)
    } catch (error) {
      setWorkoutTitle('Your workouts')
      setTitleDraft('Your workouts')
    }
  }, [day])

  useEffect(() => scheduleWorkoutWeekReset(() => setWorkouts(readWorkouts(day))), [day])

  const saveWorkouts = (nextWorkouts) => {
    setWorkouts(nextWorkouts)
    try {
      localStorage.setItem(storageKey(day), JSON.stringify(nextWorkouts))
      window.dispatchEvent(new Event('calorieWise.workoutsChanged'))
      if (day === workoutDayKeyForDate() && nextWorkouts.length > 0 && nextWorkouts.every((workout) => workout.completed) && syncTodayWorkoutAttendance()) {
        window.dispatchEvent(new Event('calorieWise.attendanceChanged'))
      }
      triggerSync()
    } catch (error) {}
  }

  const clearForm = () => {
    setName('')
    setLink('')
    setSets('')
    setReps('')
    setEditingId(null)
    setSelectedWorkoutIds([])
    setEditMode(false)
  }

  const submitWorkout = (event) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return
    const existing = workouts.find((item) => item.id === editingId)
    const workout = {
      id: editingId || createId(),
      name: trimmedName,
      link: normalizeLink(link),
      sets: sets.trim(),
      reps: reps.trim(),
      completed: existing?.completed || false
    }
    saveWorkouts(editingId ? workouts.map((item) => item.id === editingId ? workout : item) : [...workouts, workout])
    clearForm()
  }

  const editWorkout = (workout) => {
    setEditingId(workout.id)
    setName(workout.name)
    setLink(workout.link || '')
    setSets(workout.sets || '')
    setReps(workout.reps || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleEditMode = () => {
    setEditMode((current) => {
      const next = !current
      if (!next) setSelectedWorkoutIds([])
      return next
    })
  }

  const toggleWorkoutSelection = (id) => {
    setSelectedWorkoutIds((current) => current.includes(id)
      ? current.filter((selectedId) => selectedId !== id)
      : [...current, id])
  }

  const deleteSelected = () => {
    if (selectedWorkoutIds.length === 0) return
    saveWorkouts(workouts.filter((workout) => !selectedWorkoutIds.includes(workout.id)))
    setSelectedWorkoutIds([])
    setEditMode(false)
  }

  const saveWorkoutTitle = () => {
    const nextTitle = titleDraft.trim() || 'Your workouts'
    setWorkoutTitle(nextTitle)
    setTitleDraft(nextTitle)
    setEditingTitle(false)
    try {
      localStorage.setItem(titleStorageKey(day), nextTitle)
      triggerSync()
    } catch (error) {}
  }

  return (
    <main style={{ padding: 16, maxWidth: 720, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="icon-btn" onClick={() => navigate('/workout-manager')} aria-label="Back" style={{ fontSize: 20, lineHeight: 1 }}>←</button>
        <h1 style={{ margin: 0, fontSize: 22 }}>{dayLabel}</h1>
        </div>
        <button className="icon-btn" onClick={() => navigate('/')} aria-label="Home" title="Home" style={{ fontSize: 18, lineHeight: 1 }}>⌂</button>
      </header>

      <section className="card" style={{ padding: 12, marginBottom: 12 }}>
        <h2 style={{ margin: '0 0 10px', fontSize: 18 }}>{editingId ? 'Edit workout' : 'Add workout'}</h2>
        <form onSubmit={submitWorkout} style={{ display: 'grid', gap: 8 }}>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Workout name" aria-label="Workout name" required />
          <input value={link} onChange={(event) => setLink(event.target.value)} placeholder="Workout link (optional)" aria-label="Workout link" type="text" inputMode="url" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input value={sets} onChange={(event) => setSets(event.target.value)} placeholder="Sets" aria-label="Sets" inputMode="numeric" />
            <input value={reps} onChange={(event) => setReps(event.target.value)} placeholder="Reps" aria-label="Reps" inputMode="numeric" />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="card" type="submit">{editingId ? 'Save workout' : 'Add workout'}</button>
            {editingId && <button className="card" type="button" onClick={clearForm}>Cancel</button>}
          </div>
        </form>
      </section>

      <section className="card" style={{ padding: 12, display: 'block' }} aria-label={`${dayLabel} workout list`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, minWidth: 0, flex: 1 }}>
            {editingTitle ? (
              <input
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') saveWorkoutTitle()
                  if (event.key === 'Escape') setEditingTitle(false)
                }}
                aria-label="Workout list name"
                autoFocus
                style={{ minWidth: 0, width: 'min(100%, 260px)', fontWeight: 700 }}
              />
            ) : (
              <div style={{ fontWeight: 700, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{workoutTitle}</div>
            )}
            {editingTitle ? (
              <button className="card" type="button" onClick={saveWorkoutTitle} style={{ flex: '0 0 auto', padding: '6px 10px', fontSize: 12, fontWeight: 600 }}>Save</button>
            ) : (
              <button className="icon-btn" type="button" onClick={() => { setTitleDraft(workoutTitle); setEditingTitle(true) }} aria-label="Edit workout list name" title="Edit workout list name" style={{ flex: '0 0 auto', padding: 4 }}>✎</button>
            )}
          </div>
          <button className="card" type="button" onClick={toggleEditMode} style={{ padding: '6px 10px', fontSize: 12, fontWeight: 600 }}>
            {editMode ? 'Done' : 'Edit'}
          </button>
        </div>
        {editMode && (
          <button className="card" type="button" onClick={deleteSelected} disabled={selectedWorkoutIds.length === 0} style={{ marginBottom: 8, padding: '8px 12px', opacity: selectedWorkoutIds.length === 0 ? 0.6 : 1 }}>
            Delete selected ({selectedWorkoutIds.length})
          </button>
        )}
        <div style={{ display: 'grid', gap: 0, width: '100%' }}>
          {workouts.length === 0 ? (
            <div style={{ color: 'var(--muted)' }}>No workouts added for this day yet.</div>
          ) : workouts.map((workout) => (
            <div key={workout.id} style={{ display: 'grid', gridTemplateColumns: '22px minmax(0, 1fr) auto auto auto', alignItems: 'center', gap: 8, width: '100%', padding: '10px 0', borderBottom: '1px solid var(--card-border)' }}>
              <input
                type="checkbox"
                checked={editMode ? selectedWorkoutIds.includes(workout.id) : Boolean(workout.completed)}
                onChange={() => editMode
                  ? toggleWorkoutSelection(workout.id)
                  : saveWorkouts(workouts.map((item) => item.id === workout.id ? { ...item, completed: !item.completed } : item))}
                aria-label={editMode ? `Select ${workout.name}` : `Mark ${workout.name} complete`}
                style={{ width: 18, height: 18 }}
              />
              <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {workout.link ? (
                  <a href={workout.link} target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: 'var(--accent1)', textDecoration: workout.completed ? 'line-through' : 'none' }}>{workout.name}</a>
                ) : (
                  <div style={{ fontWeight: 700, textDecoration: workout.completed ? 'line-through' : 'none' }}>{workout.name}</div>
                )}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 13, whiteSpace: 'nowrap', textAlign: 'right' }}>{workout.sets ? `${workout.sets} sets` : '—'}</div>
              <div style={{ color: 'var(--muted)', fontSize: 13, whiteSpace: 'nowrap', textAlign: 'right' }}>{workout.reps ? `${workout.reps} reps` : '—'}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {editMode && <button className="card" type="button" onClick={() => editWorkout(workout)} style={{ padding: '6px 10px', fontSize: 12, fontWeight: 600 }}>Edit</button>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
