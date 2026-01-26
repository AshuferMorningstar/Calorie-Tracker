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

  const goEdit = ()=> navigate('/onboard/details')

  return (
    <main style={{padding:24,maxWidth:900,margin:'0 auto'}}>
      <div style={{display:'flex',gap:16,alignItems:'center'}}>
        <div style={{width:84,height:84,borderRadius:999,background:'linear-gradient(90deg,#8fbf8a,#f2b880)'}} />
        <div>
          <h2 style={{margin:0}}>Your profile</h2>
          <div style={{color:'var(--muted)',marginTop:6}}>Review and edit your personal info and plan.</div>
        </div>
      </div>

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
            <strong>Plan</strong>
            <div style={{color:'var(--muted)'}}>{data.goal || '—'}</div>
            <div style={{color:'var(--muted)'}}>Current: {data.currentKg || '—'} kg • Target: {data.targetKg || '—'} kg</div>
            <div style={{color:'var(--muted)'}}>Band: {data.targetBand || '—'} • Timeline: {data.timelineMonths ? `${data.timelineMonths} month(s)` : '—'}</div>
          </div>
        </div>

        <div style={{display:'flex',gap:8}}>
          <button className="card" onClick={goEdit}>Edit profile</button>
          <button className="icon-btn" onClick={()=>navigate('/')}>Close</button>
        </div>
      </section>
    </main>
  )
}
