import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Calendar(){
  const navigate = useNavigate()
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()

  const [view, setView] = useState({ year: currentYear, month: currentMonth })

  const monthName = useMemo(()=> new Date(view.year, view.month, 1).toLocaleString(undefined,{month:'long', year:'numeric'}), [view])

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
      const activityFactor = activity === 'custom' ? 1.2 : (activityFactors[activity] || 1.2)
      const dailyExercise = activity === 'custom' && customCalories && workoutDays ? Math.round((customCalories * workoutDays) / 7) : 0
      const maintenance = Math.round(bmr * activityFactor + dailyExercise)

      if(!targetKg || goal === 'maintain' || timelineMonths === 0){
        return { maintenance, diet: maintenance }
      }

      const diffKg = currentKg - targetKg
      const days = Math.max(1, Math.round((timelineMonths || 1) * 30))
      const totalKcal = Math.round(Math.abs(diffKg) * 7700)
      const dailyKcal = Math.round(totalKcal / days)

      if(diffKg > 0){
        const diet = Math.max(1000, maintenance - dailyKcal)
        return { maintenance, diet }
      }else{
        const diet = maintenance + dailyKcal
        return { maintenance, diet }
      }
    }catch(e){ return null }
  },[])

  // total actual deficit for viewed month — sum only days where the user logged entries
  // daily deficit = maintenance - consumed; negatives (overeating) reduce the total
  const totalMonthLost = useMemo(()=>{
    if(!plan) return null
    try{
      const last = new Date(view.year, view.month + 1, 0)
      let daysToCount = last.getDate()
      const now = new Date()
      if(view.year === now.getFullYear() && view.month === now.getMonth()) daysToCount = now.getDate()

      const isoFor = (y,m,d)=>`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`

      let total = 0
      let loggedDays = 0
      for(let day=1; day<=daysToCount; day++){
        const key = `calorieWise.entries.${isoFor(view.year, view.month, day)}`
        try{
          const raw = localStorage.getItem(key)
          if(!raw) continue // only include days where user logged items
          const parsed = JSON.parse(raw)
          const consumed = Array.isArray(parsed) ? parsed.reduce((s,i)=> s + (Number(i.calories)||0), 0) : 0
          const deficit = (plan.maintenance - consumed)
          total += deficit
          loggedDays += 1
        }catch(e){ continue }
      }
      return { total, loggedDays }
    }catch(e){ return null }
  },[plan, view.year, view.month])

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
  }, [view.year, view.month])

  return (
    <div style={{padding:16,maxWidth:720,margin:'0 auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <h2 style={{margin:0}}>Calendar</h2>
        <div style={{display:'flex',gap:8}}>
          <button className="icon-btn" onClick={()=>navigate('/', { state: { fromSplash: true } })}>Back</button>
        </div>
      </div>

      <div className="card" style={{padding:12}}>
        <div className="month-cal">
          <div className="cal-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <button className="icon-btn" onClick={goPrev} aria-label="Previous month">◀</button>
              <button className="icon-btn" onClick={gotoToday} aria-label="Go to current month">Today</button>
              <button className="icon-btn" onClick={goNext} aria-label="Next month" disabled={view.year > currentYear || (view.year === currentYear && view.month >= currentMonth)}>▶</button>
            </div>
            <div style={{fontWeight:700}}>{monthName}</div>
            <div style={{width:86}} />
          </div>

          <div className="dow-row" style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',marginBottom:6}}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d,i)=>(
              <div key={i} style={{fontSize:12,color:'var(--muted)',textAlign:'center'}}>{d}</div>
            ))}
          </div>

          <div className="dates-grid" style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:6}}>
            {daysGrid.cells.map((d,i)=>{
              const isToday = d === today.getDate() && view.month === currentMonth && view.year === currentYear
              const isFutureDay = view.year === currentYear && view.month === currentMonth && d && d > today.getDate()
              const hasEntry = d && markedDays.has(d)
              return (
                <div key={i} className={`date-cell ${isToday ? 'today' : ''} ${isFutureDay ? 'future' : ''} ${hasEntry ? 'has-entry' : ''}`} style={{height:40,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:8,cursor:d ? 'pointer' : 'default'}}>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                    <div>{d || ''}</div>
                    {hasEntry ? <div style={{width:6,height:6,borderRadius:99,background:'var(--accent1)'}} /> : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div className="card" style={{padding:12,marginTop:12}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{fontWeight:700}}>Total deficit this month</div>
          <div style={{fontSize:14,fontWeight:700}}>{totalMonthLost !== null ? `${Math.round(totalMonthLost.total)} kcal` : '—'}</div>
        </div>
        <div style={{fontSize:12,color:'var(--muted)',marginTop:8}}>
          {plan ? `Per-day deficit (plan): ${plan.maintenance - plan.diet} kcal — from ${totalMonthLost ? totalMonthLost.loggedDays : 0} logged day(s)` : 'Set up your profile to see estimates.'}
        </div>
      </div>
    </div>
  )
}
