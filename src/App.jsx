import React, { useMemo, useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom'
import OnboardAuth from './pages/OnboardAuth'
import { onAuthChange, signInWithGoogle, signOut } from './services/auth'
import { useSyncContext } from './context/SyncContext'
import { loadUserDataFromFirestore, saveUserDataToFirestore, syncDataBeforeLogout } from './services/firestore'

export default function App(){
  const navigate = useNavigate()
  const { triggerSync, lastSyncAt } = useSyncContext()

  const previewSplash = ()=> navigate('/splash')
  const resetAndShow = ()=>{
    try{ localStorage.removeItem('calorieWise.seenEver') }catch(e){}
    navigate('/splash')
  }
  const [menuOpen, setMenuOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    try{ return localStorage.getItem('calorieWise.theme') === 'dark' }catch(e){return false}
  })
  const [installPrompt, setInstallPrompt] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const [syncStatus, setSyncStatus] = useState('synced')
  const [editNameOpen, setEditNameOpen] = useState(false)
  const [displayName, setDisplayName] = useState(() => {
    try{ return localStorage.getItem('calorieWise.displayName') || '' }catch(e){ return '' }
  })

  useEffect(()=>{
    try{
      if(darkMode) document.documentElement.classList.add('theme-dark')
      else document.documentElement.classList.remove('theme-dark')
      localStorage.setItem('calorieWise.theme', darkMode ? 'dark' : 'light')
    }catch(e){}
  },[darkMode])

  // Listen for PWA install prompt
  useEffect(()=>{
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  },[])

  // Listen for online/offline status
  useEffect(()=>{
    const handleOnline = () => {
      setIsOnline(true)
      setSyncStatus('syncing')
      if(currentUser){
        syncLocalDataToFirestore(currentUser.uid)
      }
    }
    const handleOffline = () => {
      setIsOnline(false)
      setSyncStatus('offline')
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  },[currentUser])

  const syncLocalDataToFirestore = async (userId) => {
    if(!isOnline) return
    try{
      setSyncStatus('syncing')
      await saveUserDataToFirestore(userId)
      setSyncStatus('synced')
    }catch(e){
      console.warn('[App] Sync failed:', e.message)
      setSyncStatus('offline')
    }
  }

  // Listen for auth state changes and load user data from Firestore when signed in
  useEffect(()=>{
    const unsubscribe = onAuthChange(async (user) => {
      setCurrentUser(user)
      setAuthLoading(false)
      if(user){
        try{
          console.log('[App] User signed in:', user.email)
          // Load user data from Firestore and restore to localStorage
          await loadUserDataFromFirestore(user.uid)
          setSyncStatus('synced')
        }catch(e){
          console.warn('[App] Failed to load cloud data:', e.message)
          if(isOnline){
            setSyncStatus('offline')
          }
        }
      }else{
        console.log('[App] User signed out')
        setSyncStatus('synced')
      }
    })
    return () => unsubscribe()
  },[])

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

  const handleSignIn = async () => {
    try{
      const user = await signInWithGoogle()
      console.log('[App] User signed in:', user.email)
      // Save current data to Firestore
      await saveUserDataToFirestore(user.uid)
      closeMenu()
    }catch(e){
      console.error('[App] Sign-in failed:', e.message)
    }
  }

  const handleSignOut = async () => {
    try{
      if(currentUser && isOnline){
        // Sync data before signing out if online
        await syncDataBeforeLogout(currentUser.uid)
      }
      await signOut()
      setSyncStatus('synced')
      closeMenu()
      navigate('/onboard-auth') // Redirect to login page
    }catch(e){
      console.error('[App] Sign-out failed:', e.message)
    }
  }

  const handleInstallClick = async () => {
    if(!installPrompt) return
    try{
      installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      if(outcome === 'accepted'){
        setInstallPrompt(null)
      }
      closeMenu()
    }catch(e){
      console.error('Install error:', e)
    }
  }

  const handleSaveDisplayName = () => {
    try{
      localStorage.setItem('calorieWise.displayName', displayName.trim())
      setEditNameOpen(false)
      // Always trigger cloud sync for profile changes
      if (typeof triggerSync === 'function') triggerSync()
    }catch(e){
      console.error('Failed to save display name:', e)
    }
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
      triggerSync()
      try{ window.dispatchEvent(new Event('calorieWise.attendanceChanged')) }catch(e){}
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
      triggerSync()
      try{ window.dispatchEvent(new Event('calorieWise.attendanceChanged')) }catch(e){}
    }catch(e){}
  }

  const [storageTick, setStorageTick] = useState(0) // bump to force re-read of attendance/burned keys
  const [selectedAttendanceIso, setSelectedAttendanceIso] = useState(null)

  useEffect(()=>{
    const onChanged = ()=> setStorageTick(x=>x+1)
    try{
      window.addEventListener('calorieWise.burnedChanged', onChanged)
      window.addEventListener('calorieWise.attendanceChanged', onChanged)
    }catch(e){}
    return ()=>{
      try{
        window.removeEventListener('calorieWise.burnedChanged', onChanged)
        window.removeEventListener('calorieWise.attendanceChanged', onChanged)
      }catch(e){}
    }
  },[])

  const calories = useMemo(()=>{
    const { currentKg, targetKg, age, height, gender, activity, customCalories, workoutDays, timelineMonths, goal } = data || {}
    if(!currentKg || !age || !height) return null

    // BMR (Mifflin-St Jeor)
    const bmr = Math.round(10 * currentKg + 6.25 * height - 5 * age + (gender === 'female' ? -161 : 5))

    const activityFactors = { sedentary:1.2, light:1.375, moderate:1.55, active:1.725, very:1.9 }
    const sedentaryFactor = activityFactors['sedentary']
    // chosenActivityFactor is the multiplier to apply when a workout is marked (non-custom activities)
    const chosenActivityFactor = activity === 'custom' ? sedentaryFactor : (activityFactors[activity] || sedentaryFactor)

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
          const burnedKey = `calorieWise.burned.${y}-${m}-${day}`
          const burnedToday = Number(localStorage.getItem(burnedKey) || 0)
          if(burnedToday){
            dailyExercise = burnedToday
          }else{
            dailyExercise = isTodayWorkout ? Number(customCalories) : 0
          }
        }else{
          dailyExercise = Math.round((customCalories * workoutDays) / 7)
        }
      }catch(e){ dailyExercise = Math.round((customCalories * workoutDays) / 7) }
    }

    const maintenanceNoWorkout = Math.round(bmr * sedentaryFactor)
    // If the user entered per-day burned calories for this day, prefer that and add it to sedentary baseline
    const todayIso = new Date().toISOString().slice(0,10)
    const burnedToday = Number(localStorage.getItem(`calorieWise.burned.${todayIso}`) || 0)
    let maintenanceWithExercise
    if(burnedToday){
      maintenanceWithExercise = Math.round(bmr * sedentaryFactor + burnedToday)
    }else{
      maintenanceWithExercise = activity === 'custom'
        ? Math.round(bmr * sedentaryFactor + dailyExercise)
        : Math.round(bmr * chosenActivityFactor)
    }

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
  },[data, workoutToday, storageTick])


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

  const maintenanceUsed = useMemo(()=>{
    if(!calories) return null
    return workoutToday ? calories.maintenanceWithExercise : calories.maintenanceNoWorkout
  },[calories, workoutToday])

  const formattedLastSync = useMemo(()=>{
    if(!lastSyncAt) return 'Never'
    try{
      const last = new Date(lastSyncAt)
      const diffMs = Date.now() - last.getTime()
      const diffSec = Math.max(0, Math.floor(diffMs / 1000))
      const diffMin = Math.floor(diffSec / 60)
      const diffHr = Math.floor(diffMin / 60)
      const diffDay = Math.floor(diffHr / 24)
      if(diffSec < 60) return 'Just now'
      if(diffMin < 60) return `${diffMin}m ago`
      if(diffHr < 24) return `${diffHr}h ago`
      return `${diffDay}d ago`
    }catch(e){ return 'Never' }
  },[lastSyncAt])

  return (
    <Routes>
      <Route path="/onboard-auth" element={<OnboardAuth />} />
      {/* ...existing routes and app UI... */}
      <Route path="*" element={
        <div>
          {/* ...existing code... */}
        </div>
      } />
    </Routes>
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

  // allow paging weeks in the home weekly attendance view
  const [weekOffset, setWeekOffset] = React.useState(0) // 0 = current week, -1 = previous, etc.

  // compute current calendar week (Sunday..Saturday) adjusted by weekOffset
  const weekStart = new Date(now)
  weekStart.setHours(0,0,0,0)
  weekStart.setDate(now.getDate() - now.getDay() + (weekOffset * 7))

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
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button className="icon-btn" aria-label="Previous week" onClick={()=>setWeekOffset(o=>o-1)}>◀</button>
          <div style={{fontWeight:700}}>{`Week ${Math.max(1, weekIndex + weekOffset)}`}</div>
          <button className="icon-btn" aria-label="Next week" onClick={()=> setWeekOffset(o=> Math.min(0, o+1))} disabled={weekOffset >= 0}>▶</button>
        </div>
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
