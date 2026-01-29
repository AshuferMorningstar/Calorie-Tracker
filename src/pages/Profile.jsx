import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Profile(){
  const navigate = useNavigate()
  const data = useMemo(()=>{
    try{
      return {
        dob: localStorage.getItem('calorieWise.dob') || '',
        age: localStorage.getItem('calorieWise.age') || '',
        height: localStorage.getItem('calorieWise.height') || '',
        gender: localStorage.getItem('calorieWise.gender') || '',
        activity: localStorage.getItem('calorieWise.activity') || '',
        customCalories: localStorage.getItem('calorieWise.customCalories') || '',
        workoutDays: localStorage.getItem('calorieWise.workoutDays') || '',
        goal: localStorage.getItem('calorieWise.goal') || '',
        currentKg: localStorage.getItem('calorieWise.currentWeightKg') || '',
        targetKg: localStorage.getItem('calorieWise.targetWeightKg') || '',
        targetBand: localStorage.getItem('calorieWise.targetBand') || '',
        timelineMonths: localStorage.getItem('calorieWise.timelineMonths') || ''
      }
    }catch(e){ return {} }
  },[])

  const calcs = useMemo(()=>{
    try{
      const currentKg = Number(data.currentKg || '') || null
      const age = Number(data.age || '') || null
      const height = Number(data.height || '') || null
      const gender = data.gender || 'male'
      const activity = data.activity || 'sedentary'

      if(!currentKg || !age || !height) return null

      const bmr = Math.round(10 * currentKg + 6.25 * height - 5 * age + (gender === 'female' ? -161 : 5))
      const activityFactors = { sedentary:1.2, light:1.375, moderate:1.55, active:1.725, very:1.9 }
      const activityFactor = activity === 'custom' ? 1.2 : (activityFactors[activity] || 1.2)

      const maintenanceNoWorkout = Math.round(bmr * activityFactor)

      return { bmr, maintenanceNoWorkout }
    }catch(e){ return null }
  },[data])

  const goEdit = ()=> navigate('/onboard/details', { state: { from: '/profile' } })

  return (
    <main style={{padding:24,maxWidth:900,margin:'0 auto'}}>
      <div className="profile-top" style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <button className="icon-btn back-btn" aria-label="Go back" onClick={()=>navigate(-1)}>←</button>
          <h2 style={{margin:0}}>Your profile</h2>
        </div>
      </div>
      <div style={{color:'var(--muted)',marginTop:12}}>Review and edit your personal info and plan.</div>

      <section style={{marginTop:20,display:'grid',gap:12}}>
        <div className="card">
          <div style={{flex:1}}>
            <strong>DOB</strong>
            <div style={{color:'var(--muted)'}}>{data.dob || '—'}</div>
          </div>
        </div>

        <div className="card">
          <div style={{flex:1}}>
            <strong>Age</strong>
            <div style={{color:'var(--muted)'}}>{data.age || '—'}</div>
          </div>
        </div>

        <div className="card">
          <div style={{flex:1}}>
            <strong>Height (cm)</strong>
            <div style={{color:'var(--muted)'}}>{data.height || '—'}</div>
          </div>
        </div>

        <div className="card">
          <div style={{flex:1}}>
            <strong>Gender</strong>
            <div style={{color:'var(--muted)'}}>{data.gender || '—'}</div>
          </div>
        </div>

        <div className="card">
          <div style={{flex:1}}>
            <strong>Activity</strong>
            <div style={{color:'var(--muted)'}}>{data.activity || '—'}</div>
            {data.activity === 'custom' && <div style={{color:'var(--muted)'}}>Workout calories: {data.customCalories || '—'} — Days/week: {data.workoutDays || '—'}</div>}
          </div>
        </div>

        <div className="card">
          <div style={{flex:1}}>
            <strong>BMR</strong>
            <div style={{color:'var(--muted)'}}>{calcs ? `${calcs.bmr} kcal/day` : '—'}</div>
            <div style={{height:8}} />
            <strong>Maintenance (no workout)</strong>
            <div style={{color:'var(--muted)'}}>{calcs ? `${calcs.maintenanceNoWorkout} kcal/day` : '—'}</div>
          </div>
        </div>

        <div className="card">
          <div style={{flex:1}}>
            <strong>Plan</strong>
            <div style={{color:'var(--muted)'}}>{data.goal || '—'}</div>
            <div style={{color:'var(--muted)'}}>Current: {data.currentKg || '—'} kg • Target: {data.targetKg || '—'} kg</div>
            <div style={{color:'var(--muted)'}}>Band: {data.targetBand || '—'} • Timeline: {data.timelineMonths ? `${data.timelineMonths} month(s)` : '—'}</div>
          </div>
        </div>

        <div style={{display:'flex',gap:8}}>
          <button className="card" onClick={goEdit}>Edit profile</button>
        </div>
      </section>
    </main>
  )
}
