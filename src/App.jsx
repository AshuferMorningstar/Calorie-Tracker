import React, { useMemo, useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function App(){
  const navigate = useNavigate()

  const previewSplash = ()=> navigate('/splash')
  const resetAndShow = ()=>{
    try{ localStorage.removeItem('calorieWise.seenEver') }catch(e){}
    navigate('/splash')
  }
  const [menuOpen, setMenuOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    try{ return localStorage.getItem('calorieWise.theme') === 'dark' }catch(e){return false}
  })

  useEffect(()=>{
    try{
      if(darkMode) document.documentElement.classList.add('theme-dark')
      else document.documentElement.classList.remove('theme-dark')
      localStorage.setItem('calorieWise.theme', darkMode ? 'dark' : 'light')
    }catch(e){}
  },[darkMode])

  // no inline profile editing in menu; profile is edited on the dedicated /profile page

  // manage focus and inert/aria-hidden when the panel opens/closes
  useEffect(()=>{
    const mainEl = mainRef.current
    const panelEl = panelRef.current
    try{
      if(menuOpen){
        // hide the main content from AT and make it inert if supported
        if(mainEl){
          mainEl.setAttribute('aria-hidden','true')
          try{ mainEl.setAttribute('inert','') }catch(e){}
        }
        // prevent background scroll
        document.body.style.overflow = 'hidden'
        // move focus into the panel (close button)
        setTimeout(()=>{ closeBtnRef.current?.focus() }, 50)
      }else{
        // remove inert/aria-hidden and restore scroll
        if(mainEl){
          mainEl.removeAttribute('aria-hidden')
          try{ mainEl.removeAttribute('inert') }catch(e){}
        }
        document.body.style.overflow = ''
        // ensure focus is not left inside the panel
        if(panelEl && panelEl.contains(document.activeElement)){
          hamburgerRef.current?.focus()
        }
      }
    }catch(e){}
    return ()=>{
      try{ if(mainEl){ mainEl.removeAttribute('aria-hidden'); mainEl.removeAttribute('inert') } }catch(e){}
      try{ document.body.style.overflow = '' }catch(e){}
    }
  },[menuOpen])

  const hamburgerRef = useRef(null)
  const panelRef = useRef(null)
  const closeBtnRef = useRef(null)
  const mainRef = useRef(null)

  const openMenu = ()=>{
    setMenuOpen(true)
  }

  const closeMenu = ()=>{
    // if focus is inside the panel, move it back to the hamburger before hiding
    try{
      if(panelRef.current && panelRef.current.contains(document.activeElement)){
        hamburgerRef.current?.focus()
      }
    }catch(e){}
    setMenuOpen(false)
  }

  const toggleMenu = ()=> menuOpen ? closeMenu() : openMenu()
  const location = useLocation()

  const data = useMemo(()=>{
    try{
      const currentKg = Number(localStorage.getItem('calorieWise.currentWeightKg') || '') || null
      const targetKg = Number(localStorage.getItem('calorieWise.targetWeightKg') || '') || null
      const age = Number(localStorage.getItem('calorieWise.age') || '') || null
      const height = Number(localStorage.getItem('calorieWise.height') || '') || null // cm
      const gender = localStorage.getItem('calorieWise.gender') || 'male'
      const activity = localStorage.getItem('calorieWise.activity') || 'sedentary'
      const customCalories = Number(localStorage.getItem('calorieWise.customCalories') || '') || 0
      const workoutDays = Number(localStorage.getItem('calorieWise.workoutDays') || '') || 0
      const timelineMonths = Number(localStorage.getItem('calorieWise.timelineMonths') || '')
      const goal = localStorage.getItem('calorieWise.goal') || 'loss'

      return { currentKg, targetKg, age, height, gender, activity, customCalories, workoutDays, timelineMonths, goal }
    }catch(e){ return {} }
  },[location.pathname]) 

  const [workoutToday, setWorkoutToday] = useState(()=>{
    try{
      const d = new Date()
      const y = d.getFullYear()
      const m = String(d.getMonth()+1).padStart(2,'0')
      const day = String(d.getDate()).padStart(2,'0')
      return localStorage.getItem(`calorieWise.attendance.${y}-${m}-${day}`) === '1'
    }catch(e){ return false }
  })

  const toggleWorkoutToday = ()=>{
    try{
      const d = new Date()
      const y = d.getFullYear()
      const m = String(d.getMonth()+1).padStart(2,'0')
      const day = String(d.getDate()).padStart(2,'0')
      const key = `calorieWise.attendance.${y}-${m}-${day}`
      if(localStorage.getItem(key) === '1'){
        localStorage.removeItem(key)
        setWorkoutToday(false)
      }else{
        localStorage.setItem(key, '1')
        setWorkoutToday(true)
      }
    }catch(e){}
  }

  const toggleAttendance = (iso) => {
    try{
      const key = `calorieWise.attendance.${iso}`
      if(localStorage.getItem(key) === '1'){
        localStorage.removeItem(key)
      }else{
        localStorage.setItem(key, '1')
      }
      setStorageTick(x => x + 1)
      const todayIso = new Date().toISOString().slice(0,10)
      if(iso === todayIso){
        const nowMarked = localStorage.getItem(key) === '1'
        setWorkoutToday(nowMarked)
      }
      try{ window.dispatchEvent(new Event('calorieWise.attendanceChanged')) }catch(e){}
    }catch(e){}
  }

  const calories = useMemo(()=>{
    const { currentKg, targetKg, age, height, gender, activity, customCalories, workoutDays, timelineMonths, goal } = data || {}
    if(!currentKg || !age || !height) return null

    // BMR (Mifflin-St Jeor)
    const bmr = Math.round(10 * currentKg + 6.25 * height - 5 * age + (gender === 'female' ? -161 : 5))

    const activityFactors = { sedentary:1.2, light:1.375, moderate:1.55, active:1.725, very:1.9 }
    const activityFactor = activity === 'custom' ? 1.2 : (activityFactors[activity] || 1.2)

    // include exercise calories when custom activity provided
    // If the user has marked attendance (calorieWise.attendance.YYYY-MM-DD keys) we treat exercise as occurring
    // only on marked days (add `customCalories` on those days). Otherwise fall back to averaging weekly workouts across 7 days.
    let dailyExercise = 0
    if(activity === 'custom' && customCalories && workoutDays){
      try{
        // detect whether any attendance keys exist (user opted into marking days)
        let hasAttendance = false
        for(let i=0;i<localStorage.length;i++){
          const k = localStorage.key(i)
          if(k && k.startsWith('calorieWise.attendance.')){ hasAttendance = true; break }
        }

        if(hasAttendance){
          const d = new Date()
          const y = d.getFullYear()
          const m = String(d.getMonth()+1).padStart(2,'0')
          const day = String(d.getDate()).padStart(2,'0')
          const todayKey = `calorieWise.attendance.${y}-${m}-${day}`
          const isTodayWorkout = localStorage.getItem(todayKey) === '1'
          dailyExercise = isTodayWorkout ? Number(customCalories) : 0
        }else{
          dailyExercise = Math.round((customCalories * workoutDays) / 7)
        }
      }catch(e){ dailyExercise = Math.round((customCalories * workoutDays) / 7) }
    }

    const maintenanceNoWorkout = Math.round(bmr * activityFactor)
    const maintenanceWithExercise = Math.round(bmr * activityFactor + dailyExercise)

    if(!targetKg || goal === 'maintain' || timelineMonths === 0){
      return { maintenanceNoWorkout, maintenanceWithExercise, dietNoWorkout: maintenanceNoWorkout, dietWithExercise: maintenanceWithExercise, note: 'Maintenance — keep your current weight.' }
    }

    const diffKg = currentKg - targetKg
    const days = Math.max(1, Math.round((timelineMonths || 1) * 30))
    const totalKcal = Math.round(Math.abs(diffKg) * 7700)
    const dailyKcal = Math.round(totalKcal / days)

    if(diffKg > 0){
      // weight loss
      const dietNoWorkout = Math.max(1000, maintenanceNoWorkout - dailyKcal)
      const dietWithExercise = Math.max(1000, maintenanceWithExercise - dailyKcal)
      return { maintenanceNoWorkout, maintenanceWithExercise, dietNoWorkout, dietWithExercise, note: `Lose ${diffKg} kg in ${timelineMonths} month(s)` }
    }else{
      // weight gain
      const dietNoWorkout = maintenanceNoWorkout + dailyKcal
      const dietWithExercise = maintenanceWithExercise + dailyKcal
      return { maintenanceNoWorkout, maintenanceWithExercise, dietNoWorkout, dietWithExercise, note: `Gain ${Math.abs(diffKg)} kg in ${timelineMonths} month(s)` }
    }
  },[data, workoutToday])

  const [storageTick, setStorageTick] = useState(0) // bump to force re-read of attendance keys
  const [selectedAttendanceIso, setSelectedAttendanceIso] = useState(null)

  const selectedMarked = selectedAttendanceIso ? (localStorage.getItem(`calorieWise.attendance.${selectedAttendanceIso}`) === '1') : null
  const workoutButtonIcon = selectedAttendanceIso ? (selectedMarked ? '🔥' : '⚪') : (workoutToday ? '🔥' : '⚪')
  const workoutButtonLabel = selectedAttendanceIso ? (selectedMarked ? 'Workout marked' : 'Mark workout') : (workoutToday ? 'Workout marked' : 'Mark workout')

  const todayISO = ()=>{
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth()+1).padStart(2,'0')
    const day = String(d.getDate()).padStart(2,'0')
    return `${y}-${m}-${day}`
  }

  const consumedToday = useMemo(()=>{
    try{
      const raw = localStorage.getItem(`calorieWise.entries.${todayISO()}`)
      if(!raw) return 0
      const parsed = JSON.parse(raw)
      if(!Array.isArray(parsed)) return 0
      return parsed.reduce((s,i)=> s + (Number(i.calories) || 0), 0)
    }catch(e){ return 0 }
  },[location.pathname])

  const maintenanceUsed = (()=>{
    try{
      if(!calories) return null
      return workoutToday ? calories.maintenanceWithExercise : calories.maintenanceNoWorkout
    }catch(e){ return null }
  })()

  return (
    <div>
      <div className="dashboard-header profile-top" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <h2>Calorie Wise</h2>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button ref={hamburgerRef} className="icon-btn hamburger-icon" title="Menu" aria-label="Open menu" onClick={toggleMenu}>☰</button>
        </div>
      </div>

      <main ref={mainRef} style={{padding:16,maxWidth:720,margin:'0 auto',display:'grid',gap:16}}>

        <div className="dashboard-grid">
          <div className="card">
            <strong>Maintenance calories</strong>
            <div style={{fontSize:20,marginTop:8}}>{maintenanceUsed ? `${maintenanceUsed} kcal/day` : '—'}</div>
            <div style={{fontSize:13,color:'var(--muted)',marginTop:6}}>{`${consumedToday || 0} / ${maintenanceUsed || '—'} kcal consumed today`}</div>
            <div style={{fontSize:12,color:'var(--muted)',marginTop:6}}>{maintenanceUsed ? `Today's deficit: ${Math.round(maintenanceUsed - (consumedToday || 0))} kcal` : '—'}</div>
          </div>

          <div style={{display:'flex',gap:8,alignItems:'stretch'}}>
            <div className="card" style={{flex:1,minWidth:0,padding:12}}>
              <strong>Diet calories</strong>
              <div style={{fontSize:16,marginTop:6}}>{calories ? `${workoutToday ? calories.dietWithExercise : calories.dietNoWorkout} kcal/day` : '—'}</div>
              <div style={{fontSize:12,color:'var(--muted)',marginTop:6}}>{`${consumedToday || 0} / ${calories ? (workoutToday ? calories.dietWithExercise : calories.dietNoWorkout) : '—'} kcal consumed today`}</div>
              <div style={{fontSize:11,color:'var(--muted)',marginTop:6}}>{calories ? calories.note : 'Provide profile and goals to see plan.'}</div>
            </div>
            <button className="card" style={{width:120,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6}} title="Calories burned" onClick={()=>navigate('/track')}>
              <div style={{fontSize:20}}>🏃</div>
              <div style={{fontSize:12,color:'var(--muted)'}}>Calories burned</div>
            </button>
          </div>

          <div style={{gridColumn: '1 / -1', display:'flex', gap:8, alignItems:'stretch', flexWrap:'wrap'}}>
            <button className="card square-card" style={{flex:'1 1 30%', minWidth:96}} onClick={()=>navigate('/track')}>Track calories</button>
            <button className="card square-card" style={{flex:'1 1 30%', minWidth:96}} onClick={()=>navigate('/calendar')}>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                <div style={{fontSize:11,color:'var(--muted)',fontWeight:600,marginBottom:4}}>{new Date().toLocaleString(undefined,{weekday:'short'})}</div>
                <div style={{fontSize:28,fontWeight:800,lineHeight:1}}>{new Date().getDate()}</div>
                <div style={{fontSize:12,color:'var(--muted)',marginTop:4}}>{new Date().toLocaleString(undefined,{month:'short'})}</div>
              </div>
            </button>
            <button className="card square-card" style={{flex:'1 1 30%', minWidth:96, display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}} title="Workout today" onClick={() => {
              // if a past day is selected in WeeklyAttendance, mark/unmark that date; otherwise toggle today
              try{
                const iso = selectedAttendanceIso
                if(iso){
                  const isFuture = new Date(iso) > new Date()
                  if(!isFuture){
                    toggleAttendance(iso)
                    setSelectedAttendanceIso(null)
                    return
                  }
                }
              }catch(e){}
              toggleWorkoutToday()
            }}>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                <div style={{fontSize:22}} aria-hidden>{workoutButtonIcon}</div>
                <div style={{fontSize:12,color:'var(--muted)',marginTop:6}}>{workoutButtonLabel}</div>
              </div>
            </button>
          </div>
        </div>

        <WeeklyAttendance storageTick={storageTick} setStorageTick={setStorageTick} setWorkoutToday={setWorkoutToday} toggleAttendance={toggleAttendance} selectedIso={selectedAttendanceIso} setSelectedIso={setSelectedAttendanceIso} />

        
      </main>

      { /* backdrop to dim page while panel open; clicking closes the panel */ }
      <div className={`panel-backdrop ${menuOpen ? 'open' : ''}`} onClick={closeMenu} aria-hidden="true" />

      <div ref={panelRef} className={`slide-panel ${menuOpen ? 'open' : ''}`} role="dialog" aria-hidden={!menuOpen}>
        <div className="panel-header">
          <div>
            <button
              className="theme-toggle"
              aria-pressed={darkMode}
              onClick={()=>setDarkMode(d=>!d)}
              title={darkMode ? 'Switch to light' : 'Switch to dark'}
            >
              <span className="tt-icon" aria-hidden>{darkMode ? '🌙' : '☀️'}</span>
            </button>
          </div>
          <button ref={closeBtnRef} className="icon-btn" aria-label="Close menu" onClick={closeMenu}>✕</button>
        </div>
        <div className="panel-body">
          

          <nav style={{display:'flex',flexDirection:'column',gap:8,marginTop:8}} aria-label="Main menu">
            <button className="card" onClick={()=>{ navigate('/profile'); closeMenu() }}>Profile</button>
            <button className="card" onClick={()=>{ navigate('/', { state: { fromSplash: true } }); closeMenu() }}>Home</button>
            <button className="card" onClick={()=>{ try{ localStorage.clear() }catch(e){}; resetAndShow(); closeMenu() }}>Reset app</button>
          </nav>
        </div>
      </div>
    </div>
  )
}

function WeeklyAttendance({ storageTick, setStorageTick, setWorkoutToday, toggleAttendance, selectedIso, setSelectedIso }){
  // ensure we have an install/reference date so week counting starts at user install
  try{ if(!localStorage.getItem('calorieWise.installDate')){ localStorage.setItem('calorieWise.installDate', new Date().toISOString().slice(0,10)) } }catch(e){}
  const installIso = localStorage.getItem('calorieWise.installDate') || new Date().toISOString().slice(0,10)
  const installDate = new Date(installIso)
  const now = new Date()

  // week number since install (1-based)
  const daysSinceInstall = Math.floor((now - installDate) / (24 * 60 * 60 * 1000))
  const weekIndex = Math.floor(daysSinceInstall / 7) + 1

  // compute current calendar week (Sunday..Saturday) that contains today
  const weekStart = new Date(now)
  weekStart.setHours(0,0,0,0)
  weekStart.setDate(now.getDate() - now.getDay())

  const days = []
  for(let i=0;i<7;i++){
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    const y = d.getFullYear()
    const m = d.toLocaleString(undefined,{month:'short'})
    const dayNum = d.getDate()
    const iso = `${y}-${String(d.getMonth()+1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`
    days.push({ iso, dow: d.toLocaleString(undefined,{weekday:'short'}), month: m, dayNum })
  }
  const todayIso = new Date().toISOString().slice(0,10)

  // use the parent-provided `toggleAttendance` to avoid duplicating logic

  return (
    <div className="card" style={{padding:12}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <strong>Week {weekIndex}</strong>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:6,alignItems:'stretch',width:'100%'}}>
        {days.map(d=>{
          const isMarked = localStorage.getItem(`calorieWise.attendance.${d.iso}`) === '1'
          const isFuture = new Date(d.iso) > new Date()
          const isSelected = selectedIso === d.iso
          return (
            <div key={d.iso}
              onClick={() => !isFuture && setSelectedIso(d.iso)}
              style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:8,borderRadius:6,minHeight:72, cursor: isFuture ? 'default' : 'pointer', border: isSelected ? '2px solid var(--accent1)' : undefined, background: isSelected ? 'var(--selected-bg)' : undefined}}>
              <div style={{fontSize:12,color:'var(--muted)'}}>{d.dow}</div>
              <div style={{fontSize:12,color:'var(--muted)'}}>{d.month}</div>
              <div style={{fontSize:16,fontWeight:700,marginTop:6}}>{d.dayNum}</div>
              <div style={{fontSize:18,marginTop:6}}>{isMarked ? '🔥' : ''}</div>
            </div>
          )
        })}
      </div>
      <div style={{marginTop:10,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{textAlign:'left'}}>
          {selectedIso ? (
            <>
              <div style={{fontSize:13}}><strong>Selected:</strong> {new Date(selectedIso).toLocaleDateString()}</div>
              <div style={{fontSize:12,color:'var(--muted)',marginTop:8}}>{new Date(selectedIso) > new Date() ? 'Cannot mark future days' : "Press 'Mark workout' card above to mark/unmark this day."}</div>
            </>
          ) : (
            <div style={{fontSize:13,color:'var(--muted)'}}>Tap a day to select and then use the 'Mark workout' button above</div>
          )}
        </div>
        <div style={{minWidth:96,display:'flex',justifyContent:'flex-end'}}>
          {selectedIso ? (
            <button onClick={()=>setSelectedIso(null)} style={{padding:'6px 12px',borderRadius:6,border:'1px solid var(--card-border)',background:'var(--card-bg)',color:'var(--text)',cursor:'pointer'}}>Done</button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
