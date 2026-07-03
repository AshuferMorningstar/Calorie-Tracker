import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSyncContext } from '../context/SyncContext'

export default function Calendar(){
  const navigate = useNavigate()
  const { triggerSync } = useSyncContext()
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()
  const selectedDateStorageKey = 'calorieWise.calendar.selectedDate'

  const [view, setView] = useState({ year: currentYear, month: currentMonth })
  const [selectedDateIso, setSelectedDateIso] = useState(() => {
    try{ return localStorage.getItem(selectedDateStorageKey) || null }catch(e){ return null }
  })
  const [storageTick, setStorageTick] = useState(0) // bump to force re-read of localStorage-driven memos
  const [weekOffset, setWeekOffset] = useState(0) // 0 = current week, -1 = previous, etc.

  // ensure we have an install/reference date so week counting starts at user install
  try{
    if(!localStorage.getItem('calorieWise.installDate')){
      localStorage.setItem('calorieWise.installDate', new Date().toISOString().slice(0,10))
      triggerSync()
    }
  }catch(e){}
  const installIso = localStorage.getItem('calorieWise.installDate') || new Date().toISOString().slice(0,10)
  const installDate = new Date(installIso)
  const nowForWeek = new Date()
  const daysSinceInstall = Math.floor((nowForWeek - installDate) / (24 * 60 * 60 * 1000))
  const baseWeekIndex = Math.floor(daysSinceInstall / 7) + 1

  useEffect(()=>{
    const handler = ()=> setStorageTick(x => x + 1)
    try{ window.addEventListener('calorieWise.attendanceChanged', handler) }catch(e){}
    try{ window.addEventListener('calorieWise.burnedChanged', handler) }catch(e){}
    return ()=>{ try{ window.removeEventListener('calorieWise.attendanceChanged', handler) }catch(e){}; try{ window.removeEventListener('calorieWise.burnedChanged', handler) }catch(e){} }
  },[])

  const monthName = useMemo(()=> new Date(view.year, view.month, 1).toLocaleString(undefined,{month:'long', year:'numeric'}), [view])

  const isoFor = (y,m,d)=>`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`

  useEffect(()=>{
    try{
      if(selectedDateIso){
        localStorage.setItem(selectedDateStorageKey, selectedDateIso)
      }else{
        localStorage.removeItem(selectedDateStorageKey)
      }
    }catch(e){}
  }, [selectedDateIso])

  useEffect(()=>{
    if(!selectedDateIso) return
    const parts = selectedDateIso.split('-')
    if(parts.length !== 3) return
    const year = Number(parts[0])
    const month = Number(parts[1]) - 1
    if(Number.isNaN(year) || Number.isNaN(month)) return
    if(view.year !== year || view.month !== month){
      setView({ year, month })
    }
  }, [selectedDateIso, view.year, view.month])

  // compute maintenance/diet from stored profile (used to estimate deficit)
  const plan = useMemo(()=>{
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

      if(!currentKg || !age || !height) return null

      const bmr = Math.round(10 * currentKg + 6.25 * height - 5 * age + (gender === 'female' ? -161 : 5))
      const activityFactors = { sedentary:1.2, light:1.375, moderate:1.55, active:1.725, very:1.9 }
      const sedentaryFactor = activityFactors['sedentary']
      const chosenActivityFactor = activity === 'custom' ? sedentaryFactor : (activityFactors[activity] || sedentaryFactor)
      const avgDailyExercise = activity === 'custom' && customCalories && workoutDays ? Math.round((customCalories * workoutDays) / 7) : 0
      const maintenanceNoWorkout = Math.round(bmr * sedentaryFactor)

      // detect whether user uses attendance keys anywhere in storage
      let hasAttendance = false
      try{
        for(let i=0;i<localStorage.length;i++){
          const k = localStorage.key(i)
          if(k && k.startsWith('calorieWise.attendance.')){ hasAttendance = true; break }
        }
      }catch(e){}

      if(!targetKg || goal === 'maintain' || timelineMonths === 0){
        return { bmr, maintenanceNoWorkout, avgDailyExercise, hasAttendance, customCalories, workoutDays, activity, chosenActivityFactor, sedentaryFactor, diet: maintenanceNoWorkout }
      }

      const diffKg = currentKg - targetKg
      const days = Math.max(1, Math.round((timelineMonths || 1) * 30))
      const totalKcal = Math.round(Math.abs(diffKg) * 7700)
      const dailyKcal = Math.round(totalKcal / days)

      if(diffKg > 0){
        const dietNoWorkout = Math.max(1000, maintenanceNoWorkout - dailyKcal)
        const dietWithExercise = Math.max(1000, maintenanceNoWorkout + avgDailyExercise - dailyKcal)
        return { bmr, maintenanceNoWorkout, avgDailyExercise, hasAttendance, customCalories, workoutDays, activity, chosenActivityFactor, sedentaryFactor, dietNoWorkout, dietWithExercise }
      }else{
        const dietNoWorkout = maintenanceNoWorkout + dailyKcal
        const dietWithExercise = maintenanceNoWorkout + avgDailyExercise + dailyKcal
        return { bmr, maintenanceNoWorkout, avgDailyExercise, hasAttendance, customCalories, workoutDays, activity, chosenActivityFactor, sedentaryFactor, dietNoWorkout, dietWithExercise }
      }
    }catch(e){ return null }
  },[storageTick])

  // total actual deficit for viewed month — sum only days where the user logged entries
  // daily deficit = maintenance - consumed; negatives (overeating) reduce the total
  const totalMonthLost = useMemo(()=>{
    if(!plan) return null
    try{
      const last = new Date(view.year, view.month + 1, 0)
      let daysToCount = last.getDate()
      const now = new Date()
      if(view.year === now.getFullYear() && view.month === now.getMonth()) daysToCount = now.getDate()

      let total = 0
      let loggedDays = 0
      for(let day=1; day<=daysToCount; day++){
        const key = `calorieWise.entries.${isoFor(view.year, view.month, day)}`
        try{
          const raw = localStorage.getItem(key)
          if(!raw) continue // only include days where user logged items
          const parsed = JSON.parse(raw)
          const consumed = Array.isArray(parsed) ? parsed.reduce((s,i)=> s + (Number(i.calories)||0), 0) : 0
          // compute per-day maintenance using attendance (or weekly average) — match Home logic
          const dateIso = isoFor(view.year, view.month, day)
          const attendanceKey = `calorieWise.attendance.${dateIso}`
          const isWorkoutDay = localStorage.getItem(attendanceKey) === '1'
          // prefer per-day burned entry if present
          const burnedKey = `calorieWise.burned.${dateIso}`
          const burnedVal = Number(localStorage.getItem(burnedKey) || 0)
          const burnedApplied = isWorkoutDay ? burnedVal : 0
          let dailyExercise = 0
          if(burnedApplied){
            dailyExercise = burnedApplied
          }else if(plan && plan.customCalories && plan.workoutDays){
            if(plan.hasAttendance){
              dailyExercise = isWorkoutDay ? Number(plan.customCalories) : 0
            }else{
              dailyExercise = Math.round((plan.customCalories * plan.workoutDays) / 7)
            }
          }
          // for non-custom activities, use the activity factor on workout days (only if tracking attendance)
          let maintenanceForDay
          if(burnedApplied){
            maintenanceForDay = Math.round(plan.maintenanceNoWorkout + burnedApplied)
          }else if(plan.activity === 'custom'){
            maintenanceForDay = Math.round(plan.maintenanceNoWorkout + dailyExercise)
          }else if(plan.hasAttendance && isWorkoutDay){
            // non-custom activity with attendance tracking: use activity factor on marked workout days
            maintenanceForDay = Math.round(plan.bmr * plan.chosenActivityFactor)
          }else{
            maintenanceForDay = plan.maintenanceNoWorkout
          }
          const deficit = (maintenanceForDay - consumed)
          total += deficit
          loggedDays += 1
        }catch(e){ continue }
      }
      return { total, loggedDays }
    }catch(e){ return null }
  },[plan, view.year, view.month, storageTick])

  // total deficit for the current calendar week (Sunday..Saturday)
  const totalWeekLost = useMemo(()=>{
    if(!plan) return null
    try{
      const now = new Date()
      const weekStart = new Date(now)
      weekStart.setHours(0,0,0,0)
      weekStart.setDate(now.getDate() - now.getDay() + (weekOffset * 7))

      let total = 0
      let loggedDays = 0
      for(let i=0;i<7;i++){
        const d = new Date(weekStart)
        d.setDate(weekStart.getDate() + i)
        const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
        const key = `calorieWise.entries.${iso}`
        const raw = localStorage.getItem(key)
        if(!raw) continue
        const parsed = JSON.parse(raw)
        const consumed = Array.isArray(parsed) ? parsed.reduce((s,i)=> s + (Number(i.calories)||0), 0) : 0

        const attendanceKey = `calorieWise.attendance.${iso}`
        const isWorkoutDay = localStorage.getItem(attendanceKey) === '1'
        const burnedKey = `calorieWise.burned.${iso}`
        const burnedVal = Number(localStorage.getItem(burnedKey) || 0)
        const burnedApplied = isWorkoutDay ? burnedVal : 0
        let dailyExercise = 0
        if(burnedApplied){
          dailyExercise = burnedApplied
        }else if(plan && plan.customCalories && plan.workoutDays){
          if(plan.hasAttendance){
            dailyExercise = isWorkoutDay ? Number(plan.customCalories) : 0
          }else{
            dailyExercise = Math.round((plan.customCalories * plan.workoutDays) / 7)
          }
        }
        // for non-custom activities, use the activity factor on workout days (only if tracking attendance)
        let maintenanceForDay
        if(burnedApplied){
          maintenanceForDay = Math.round(plan.maintenanceNoWorkout + burnedApplied)
        }else if(plan.activity === 'custom'){
          maintenanceForDay = Math.round(plan.maintenanceNoWorkout + dailyExercise)
        }else if(plan.hasAttendance && isWorkoutDay){
          // non-custom activity with attendance tracking: use activity factor on marked workout days
          maintenanceForDay = Math.round(plan.bmr * plan.chosenActivityFactor)
        }else{
          maintenanceForDay = plan.maintenanceNoWorkout
        }
        const deficit = (maintenanceForDay - consumed)
        total += deficit
        loggedDays += 1
      }
      return { total, loggedDays, weekStart }
    }catch(e){ return null }
  },[plan, storageTick, weekOffset])

  // persist weekly and monthly deficit snapshots for cloud sync
  useEffect(()=>{
    try{
      if(totalWeekLost && totalWeekLost.weekStart){
        const w = totalWeekLost.weekStart
        const iso = `${w.getFullYear()}-${String(w.getMonth()+1).padStart(2,'0')}-${String(w.getDate()).padStart(2,'0')}`
        const weekKey = `calorieWise.deficit.week.${iso}`
        const nextWeek = JSON.stringify({
          total: Math.round(totalWeekLost.total),
          loggedDays: totalWeekLost.loggedDays,
          weekStart: iso,
          updatedAt: new Date().toISOString()
        })
        if(localStorage.getItem(weekKey) !== nextWeek){
          localStorage.setItem(weekKey, nextWeek)
          triggerSync()
        }
      }

      if(totalMonthLost){
        const monthIso = `${view.year}-${String(view.month+1).padStart(2,'0')}`
        const monthKey = `calorieWise.deficit.month.${monthIso}`
        const nextMonth = JSON.stringify({
          total: Math.round(totalMonthLost.total),
          loggedDays: totalMonthLost.loggedDays,
          month: monthIso,
          updatedAt: new Date().toISOString()
        })
        if(localStorage.getItem(monthKey) !== nextMonth){
          localStorage.setItem(monthKey, nextMonth)
          triggerSync()
        }
      }
    }catch(e){}
  },[totalWeekLost, totalMonthLost, view.year, view.month, triggerSync])

  const goPrev = ()=>{
    let y = view.year
    let m = view.month - 1
    if(m < 0){ m = 11; y -= 1 }
    setView({ year: y, month: m })
  }

  const goNext = ()=>{
    // don't allow navigating to future months beyond currentYear/currentMonth
    if(view.year > currentYear || (view.year === currentYear && view.month >= currentMonth)) return
    let y = view.year
    let m = view.month + 1
    if(m > 11){ m = 0; y += 1 }
    // prevent stepping into future
    if(y > currentYear || (y === currentYear && m > currentMonth)) return
    setView({ year: y, month: m })
  }

  const gotoToday = ()=> setView({ year: currentYear, month: currentMonth })

  const daysGrid = useMemo(()=>{
    const first = new Date(view.year, view.month, 1)
    const last = new Date(view.year, view.month + 1, 0)
    const daysInMonth = last.getDate()
    const startIdx = first.getDay() // 0..6
    const cells = []
    for(let i=0;i<startIdx;i++) cells.push(null)
    for(let d=1; d<=daysInMonth; d++) cells.push(d)
    while(cells.length % 7 !== 0) cells.push(null)
    return { cells, daysInMonth }
  }, [view])

  // compute marked days for the visible month by scanning localStorage keys
  const markedDays = useMemo(()=>{
    const set = new Set()
    try{
      for(let i=0;i<localStorage.length;i++){
        const key = localStorage.key(i)
        if(!key) continue
        if(key.startsWith('calorieWise.entries.')){
          const dateStr = key.slice('calorieWise.entries.'.length)
          const parts = dateStr.split('-')
          if(parts.length === 3){
            const y = Number(parts[0])
            const m = Number(parts[1]) - 1
            const day = Number(parts[2])
            if(y === view.year && m === view.month){
              set.add(day)
            }
          }
        }
      }
    }catch(e){}
    return set
  }, [view.year, view.month, storageTick])

  // compute attendance count for the visible month (calorieWise.attendance.YYYY-MM-DD === '1')
  const attendanceCount = useMemo(()=>{
    try{
      let count = 0
      for(let i=0;i<localStorage.length;i++){
        const key = localStorage.key(i)
        if(!key) continue
        if(!key.startsWith('calorieWise.attendance.')) continue
        const dateStr = key.slice('calorieWise.attendance.'.length)
        const parts = dateStr.split('-')
        if(parts.length !== 3) continue
        const y = Number(parts[0])
        const m = Number(parts[1]) - 1
        if(y === view.year && m === view.month){
          try{
            if(localStorage.getItem(key) === '1') count += 1
          }catch(e){}
        }
      }
      return count
    }catch(e){ return 0 }
  }, [view.year, view.month, storageTick])

  const handleBack = () => {
    try { if (window.history && window.history.length > 1) { navigate(-1); return } } catch (e) {}
    navigate('/', { state: { fromSplash: true } })
  }

  return (
    <div className="calendar-page" style={{padding:16,maxWidth:720,margin:'0 auto',display:'flex',flexDirection:'column',gap:12,height:'100dvh',boxSizing:'border-box',overflow:'hidden'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:0,flex:'0 0 auto'}}>
        <button className="icon-btn" onClick={handleBack} style={{fontSize:20,lineHeight:1}}>←</button>
        <h2 style={{margin:0}}>Calendar</h2>
      </div>

      <div className="card calendar-main-card" style={{padding:12,display:'flex',flexDirection:'column',flex:'1 1 auto',minHeight:0,overflow:'hidden'}}>
        <div className="month-cal" style={{display:'flex',flexDirection:'column',gap:10,flex:'1 1 auto',width:'100%'}}>
          <div className="cal-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:0,width:'100%'}}>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <button className="icon-btn" onClick={goPrev} aria-label="Previous month">◀</button>
              <button className="icon-btn" onClick={gotoToday} aria-label="Go to current month">Today</button>
              <button className="icon-btn" onClick={goNext} aria-label="Next month" disabled={view.year > currentYear || (view.year === currentYear && view.month >= currentMonth)}>▶</button>
            </div>
            <div style={{fontWeight:700}}>{monthName}</div>
            <div style={{width:86}} />
          </div>

          <div className="dow-row" style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',marginBottom:2,width:'100%'}}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d,i)=>(
              <div key={i} style={{fontSize:12,color:'var(--muted)',textAlign:'center'}}>{d}</div>
            ))}
          </div>

          <div className="dates-grid" style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:8,width:'100%',flex:'1 1 auto',alignContent:'stretch',minHeight:0}}>
            {daysGrid.cells.map((d,i)=>{
              const isToday = d === today.getDate() && view.month === currentMonth && view.year === currentYear
              const isFutureDay = view.year === currentYear && view.month === currentMonth && d && d > today.getDate()
              const hasEntry = d && markedDays.has(d)
              const currentIso = d ? isoFor(view.year, view.month, d) : null
              const isSelected = currentIso && selectedDateIso === currentIso
              return (
                <div key={i}
                  onClick={() => {
                    if(!d) return
                    setSelectedDateIso(prev => prev === currentIso ? null : currentIso)
                  }}
                  className={`date-cell ${isToday ? 'today' : ''} ${isFutureDay ? 'future' : ''} ${hasEntry ? 'has-entry' : ''} ${isSelected ? 'selected' : ''}`}
                  style={{minHeight:0,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:10,cursor:d ? 'pointer' : 'default', border: isSelected ? '2px solid var(--accent1)' : undefined,aspectRatio:'1 / 1',padding:0}}>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                    <div style={{fontSize:'clamp(11px, 2.2vw, 16px)',lineHeight:1}}>{d || ''}</div>
                    {hasEntry ? <div style={{width:6,height:6,borderRadius:99,background:'var(--accent1)'}} /> : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {selectedDateIso && (
        <div className="card calendar-detail-banner" style={{padding:12,marginTop:0,flex:'0 0 auto',display:'flex',flexDirection:'column',gap:8}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
            <strong>{new Date(selectedDateIso).toLocaleDateString(undefined,{weekday:'short', month:'short', day:'numeric', year:'numeric'})}</strong>
          </div>
          <SelectedDayInfo selectedDateIso={selectedDateIso} plan={plan} compact />
        </div>
      )}

      <div className="calendar-stats-grid" style={{marginTop:0,flex:'0 0 auto'}}>
            <div className="card" style={{padding:10}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,minHeight:0}}>
            <div style={{fontWeight:700}}>Workout days this month</div>
            <div>:</div>
            <div style={{fontSize:20,fontWeight:800}}>{attendanceCount}</div>
          </div>
          <div style={{fontSize:12,color:'var(--muted)',marginTop:4,textAlign:'center'}}>
            {`Marked via attendance (${attendanceCount} ${attendanceCount === 1 ? 'day' : 'days'})`}
          </div>
        </div>
            <div className="card" style={{padding:10}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,minHeight:0}}>
                <button className="icon-btn" aria-label="Previous week" onClick={()=>setWeekOffset(o=>o-1)} style={{padding:'4px 8px'}}>◀</button>
                <div style={{fontWeight:700,fontSize:14}}>{`Week ${Math.max(1, baseWeekIndex + weekOffset)}`}</div>
                <button className="icon-btn" aria-label="Next week" onClick={()=> setWeekOffset(o=> Math.min(0, o+1))} disabled={weekOffset >= 0} style={{padding:'4px 8px'}}>▶</button>
              </div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginTop:4}}>
                <div style={{fontWeight:700,fontSize:13}}>Total deficit</div>
                <div>:</div>
                <div style={{fontSize:16,fontWeight:800}}>{totalWeekLost !== null ? `${Math.round(totalWeekLost.total)} kcal` : '—'}</div>
              </div>
              <div style={{fontSize:12,color:'var(--muted)',marginTop:4,textAlign:'center'}}>
                {totalWeekLost ? `${totalWeekLost.loggedDays} ${totalWeekLost.loggedDays === 1 ? 'day' : 'days'}` : ''}
              </div>
            </div>

            <div className="card" style={{padding:10}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,minHeight:0}}>
                <div style={{fontWeight:700}}>Total deficit this month</div>
                <div>:</div>
                <div style={{fontSize:20,fontWeight:800}}>{totalMonthLost !== null ? `${Math.round(totalMonthLost.total)} kcal` : '—'}</div>
              </div>
              <div style={{fontSize:12,color:'var(--muted)',marginTop:4,textAlign:'center'}}>
                {totalMonthLost ? `${totalMonthLost.loggedDays} ${totalMonthLost.loggedDays === 1 ? 'day' : 'days'}` : ''}
              </div>
            </div>
      </div>
    </div>
  )
}
function SelectedDayInfo({ selectedDateIso, plan, compact = false }){
  try{
    if(!selectedDateIso) return (
      <div style={{marginTop:compact ? 0 : 8,textAlign:'center',fontSize:13,color:'var(--muted)'}}>
        Select a date in the calendar to view details here.
      </div>
    )

    const key = `calorieWise.entries.${selectedDateIso}`
    const attendanceKey = `calorieWise.attendance.${selectedDateIso}`
    const raw = localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : null
    const consumed = Array.isArray(parsed) ? parsed.reduce((s,i)=> s + (Number(i.calories)||0), 0) : 0
    const isAttended = localStorage.getItem(attendanceKey) === '1'
    // compute maintenance for the selected day using per-day burned if present
    const burnedKey = `calorieWise.burned.${selectedDateIso}`
    const burnedVal = Number(localStorage.getItem(burnedKey) || 0)
    const burnedApplied = isAttended ? burnedVal : 0
    let dailyExercise = 0
    if(burnedApplied){
      dailyExercise = burnedApplied
    }else if(plan && plan.customCalories && plan.workoutDays){
      if(plan.hasAttendance){
        dailyExercise = isAttended ? Number(plan.customCalories) : 0
      }else{
        dailyExercise = Math.round((plan.customCalories * plan.workoutDays) / 7)
      }
    }
    // for non-custom activities, use the activity factor on workout days (only if tracking attendance)
    let maintenanceForDay
    if(burnedApplied){
      maintenanceForDay = Math.round(plan.maintenanceNoWorkout + burnedApplied)
    }else if(plan.activity === 'custom'){
      maintenanceForDay = Math.round(plan.maintenanceNoWorkout + dailyExercise)
    }else if(plan.hasAttendance && isAttended){
      // non-custom activity with attendance tracking: use activity factor on marked workout days
      maintenanceForDay = Math.round(plan.bmr * plan.chosenActivityFactor)
    }else{
      maintenanceForDay = plan.maintenanceNoWorkout
    }
    const deficit = plan ? Math.round(maintenanceForDay - consumed) : null

    return (
      <div style={{textAlign:'left',fontSize:13,display:'grid',gap:6}}>
        {parsed ? (
          <div>{deficit !== null ? `Deficit: ${deficit} kcal` : `Consumed: ${Math.round(consumed)} kcal`}</div>
        ) : (
          <div style={{color:'var(--muted)'}}>No entries for selected date</div>
        )}
        <div style={{fontSize:12,color:'var(--muted)'}}>{isAttended ? 'Attendance: marked' : 'Attendance: not marked'}</div>
      </div>
    )
  }catch(e){
    return <div style={{textAlign:'left',color:'var(--muted)'}}>Could not read data</div>
  }
}
