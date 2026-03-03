import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSyncContext } from '../context/SyncContext'

const todayISO = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function Tasks() {
  const navigate = useNavigate()
  const { triggerSync } = useSyncContext()

  const [taskInput, setTaskInput] = useState('')
  const [tasks, setTasks] = useState([])
  const [todayKey, setTodayKey] = useState(() => `calorieWise.tasks.${todayISO()}`)
  const [editMode, setEditMode] = useState(false)
  const [selectedTaskIds, setSelectedTaskIds] = useState([])

  const formattedDate = useMemo(() => {
    try {
      const iso = todayKey.split('calorieWise.tasks.')[1]
      const d = new Date(iso)
      return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
    } catch (e) {
      return 'Today'
    }
  }, [todayKey])

  useEffect(() => {
    try {
      const nextKey = `calorieWise.tasks.${todayISO()}`
      setTodayKey(nextKey)
      const stored = localStorage.getItem(nextKey)
      setTasks(stored ? JSON.parse(stored) : [])
    } catch (e) {
      setTasks([])
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(todayKey, JSON.stringify(tasks))
      triggerSync()
    } catch (e) {
      console.error('Failed to save daily tasks:', e)
    }
  }, [tasks, todayKey, triggerSync])

  useEffect(() => {
    let timer = null
    const schedule = () => {
      const now = new Date()
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      const ms = Math.max(1000, next.getTime() - now.getTime() + 100)
      timer = setTimeout(() => {
        try {
          const nextKey = `calorieWise.tasks.${todayISO()}`
          setTodayKey(nextKey)
          const stored = localStorage.getItem(nextKey)
          setTasks(stored ? JSON.parse(stored) : [])
        } catch (e) {
          setTasks([])
        }
        schedule()
      }, ms)
    }
    schedule()
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [])

  const handleBack = () => {
    try {
      if (window.history && window.history.length > 1) {
        navigate(-1)
        return
      }
    } catch (e) {}
    navigate('/', { state: { fromSplash: true } })
  }

  const addTask = () => {
    const text = taskInput.trim()
    if (!text) return

    setTasks(prev => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text,
        completed: false,
      },
    ])
    setTaskInput('')
  }

  const toggleTask = (taskId) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ))
  }

  const toggleSelectTask = (taskId) => {
    setSelectedTaskIds(prev => (
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    ))
  }

  const handleToggleEditMode = () => {
    setEditMode(prev => {
      const next = !prev
      if (!next) setSelectedTaskIds([])
      return next
    })
  }

  const handleDeleteSelected = () => {
    if (selectedTaskIds.length === 0) return
    setTasks(prev => prev.filter(task => !selectedTaskIds.includes(task.id)))
    setSelectedTaskIds([])
    setEditMode(false)
  }

  return (
    <div style={{ padding: 16, maxWidth: 760, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <button className="icon-btn back-btn" onClick={handleBack} aria-label="Back">←</button>
        <h2 style={{ margin: 0 }}>Daily Tasks</h2>
      </div>

      <div className="card" style={{ padding: 12, marginBottom: 12, display: 'block' }}>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>{formattedDate}</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            type="text"
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addTask()
            }}
            placeholder="Add a task for today"
            style={{
              flex: 1,
              padding: '10px 12px',
              border: '1px solid var(--card-border)',
              borderRadius: 8,
              fontSize: 14,
              background: 'var(--bg-start)',
              color: 'var(--text)'
            }}
          />
          <button
            className="card"
            onClick={addTask}
            style={{
              padding: '10px 14px',
              cursor: 'pointer',
              borderRadius: 8,
              whiteSpace: 'nowrap'
            }}
          >
            Add Task
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            className="card"
            onClick={handleToggleEditMode}
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              borderRadius: 8,
              whiteSpace: 'nowrap'
            }}
          >
            {editMode ? 'Done' : 'Edit'}
          </button>
          {editMode && (
            <button
              className="card"
              onClick={handleDeleteSelected}
              disabled={selectedTaskIds.length === 0}
              style={{
                padding: '8px 12px',
                cursor: selectedTaskIds.length === 0 ? 'not-allowed' : 'pointer',
                borderRadius: 8,
                whiteSpace: 'nowrap',
                opacity: selectedTaskIds.length === 0 ? 0.6 : 1
              }}
            >
              Delete selected ({selectedTaskIds.length})
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {tasks.length === 0 ? (
          <div className="card" style={{ color: 'var(--muted)', justifyContent: 'center' }}>
            No tasks for today yet.
          </div>
        ) : (
          tasks.map(task => (
            <label
              key={task.id}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                background: task.completed ? 'var(--selected-bg)' : 'var(--card-bg)',
                border: task.completed ? '1px solid var(--accent1)' : '1px solid var(--card-border)',
                opacity: task.completed ? 0.95 : 1
              }}
            >
              {editMode ? (
                <input
                  type="checkbox"
                  checked={selectedTaskIds.includes(task.id)}
                  onChange={() => toggleSelectTask(task.id)}
                  style={{ width: 18, height: 18 }}
                />
              ) : (
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  style={{ width: 18, height: 18 }}
                />
              )}
              <span
                style={{
                  textDecoration: task.completed ? 'line-through' : 'none',
                  fontWeight: task.completed ? 600 : 500,
                  color: 'var(--text)'
                }}
              >
                {task.text}
              </span>
            </label>
          ))
        )}
      </div>
    </div>
  )
}
