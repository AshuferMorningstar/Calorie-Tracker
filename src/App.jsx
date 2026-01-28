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

  const calories = useMemo(()=>{
    const { currentKg, targetKg, age, height, gender, activity, customCalories, workoutDays, timelineMonths, goal } = data || {}
    if(!currentKg || !age || !height) return null

    // BMR (Mifflin-St Jeor)
    const bmr = Math.round(10 * currentKg + 6.25 * height - 5 * age + (gender === 'female' ? -161 : 5))

    const activityFactors = { sedentary:1.2, light:1.375, moderate:1.55, active:1.725, very:1.9 }
    const activityFactor = activity === 'custom' ? 1.2 : (activityFactors[activity] || 1.2)

    // include exercise calories when custom activity provided
    const dailyExercise = activity === 'custom' && customCalories && workoutDays ? Math.round((customCalories * workoutDays) / 7) : 0

    const maintenance = Math.round(bmr * activityFactor + dailyExercise)

    if(!targetKg || goal === 'maintain' || timelineMonths === 0){
      return { maintenance, diet: maintenance, note: 'Maintenance — keep your current weight.' }
    }

    const diffKg = currentKg - targetKg
    const days = Math.max(1, Math.round((timelineMonths || 1) * 30))
    const totalKcal = Math.round(Math.abs(diffKg) * 7700)
    const dailyKcal = Math.round(totalKcal / days)

    if(diffKg > 0){
      // weight loss
      const diet = Math.max(1000, maintenance - dailyKcal)
      return { maintenance, diet, note: `Lose ${diffKg} kg in ${timelineMonths} month(s)` }
    }else{
      // weight gain
      const diet = maintenance + dailyKcal
      return { maintenance, diet, note: `Gain ${Math.abs(diffKg)} kg in ${timelineMonths} month(s)` }
    }
  },[data])

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
            <div style={{fontSize:20,marginTop:8}}>{calories ? `${calories.maintenance} kcal/day` : '—'}</div>
            <div style={{fontSize:13,color:'var(--muted)',marginTop:6}}>{`${consumedToday || 0} / ${calories ? calories.maintenance : '—'} kcal consumed today`}</div>
            <div style={{fontSize:12,color:'var(--muted)',marginTop:6}}>Estimated calories to maintain current weight.</div>
          </div>

          <div className="card">
            <strong>Diet calories</strong>
            <div style={{fontSize:20,marginTop:8}}>{calories ? `${calories.diet} kcal/day` : '—'}</div>
            <div style={{fontSize:13,color:'var(--muted)',marginTop:6}}>{`${consumedToday || 0} / ${calories ? calories.diet : '—'} kcal consumed today`}</div>
            <div style={{fontSize:12,color:'var(--muted)',marginTop:6}}>{calories ? calories.note : 'Provide profile and goals to see plan.'}</div>
          </div>

          <div style={{gridColumn: '1 / -1', display:'flex', gap:12, alignItems:'center'}}>
            <button className="card square-card" onClick={()=>navigate('/track')}>Track calories</button>
            <button className="card square-card" onClick={()=>navigate('/calendar')}>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                <div style={{fontSize:11,color:'var(--muted)',fontWeight:600,marginBottom:4}}>{new Date().toLocaleString(undefined,{weekday:'short'})}</div>
                <div style={{fontSize:28,fontWeight:800,lineHeight:1}}>{new Date().getDate()}</div>
                <div style={{fontSize:12,color:'var(--muted)',marginTop:4}}>{new Date().toLocaleString(undefined,{month:'short'})}</div>
              </div>
            </button>
          </div>
        </div>

        
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
