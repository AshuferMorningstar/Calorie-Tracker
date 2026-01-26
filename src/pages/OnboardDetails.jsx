import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function OnboardDetails(){
  const location = useLocation()
  const navigate = useNavigate()
  const initialGoal = (location && location.state && location.state.goal) || localStorage.getItem('calorieWise.goal') || 'loss'

  const [goal] = useState(initialGoal)
  const [age, setAge] = useState('')
  const [height, setHeight] = useState('')
  const [gender, setGender] = useState('')
  const [activity, setActivity] = useState('')
  const [genderOpen, setGenderOpen] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)
  const genderRef = useRef(null)
  const activityRef = useRef(null)
  const [customCalories, setCustomCalories] = useState('')
  const [workoutDays, setWorkoutDays] = useState('')
  const [error, setError] = useState('')

  useEffect(()=>{
    // focus first field if desired
    // noop for now
  },[])

  const goBack = ()=> navigate('/onboard')

  const handleSubmit = (e)=>{
    e.preventDefault()
    setError('')
    if(!age || !height || !gender) {
      setError('Please enter age, height, and gender.')
      return
    }
    if(!activity && !customCalories){
      setError('Choose an activity level or enter calories burned per workout.')
      return
    }

    try{
      localStorage.setItem('calorieWise.seenEver','1')
      localStorage.setItem('calorieWise.goal', goal)
      localStorage.setItem('calorieWise.age', String(age))
      localStorage.setItem('calorieWise.height', String(height))
      localStorage.setItem('calorieWise.gender', gender)
      localStorage.setItem('calorieWise.activity', activity || 'custom')
      if(customCalories) localStorage.setItem('calorieWise.customCalories', String(customCalories))
    }catch(e){}

    navigate('/', { state: { fromSplash: true } })
  }

  useEffect(()=>{
    const onDocClick = (e)=>{
      if(genderOpen && genderRef.current && !genderRef.current.contains(e.target)) setGenderOpen(false)
      if(activityOpen && activityRef.current && !activityRef.current.contains(e.target)) setActivityOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return ()=> document.removeEventListener('mousedown', onDocClick)
  },[genderOpen,activityOpen])

  return (
    <div className="goal-modal" role="main">
      <form className="goal-box" onSubmit={handleSubmit} aria-label="Provide personal details">
        <img src="/assets/Picsart_26-01-22_22-42-53-930.png" alt="Calorie Wise logo" style={{width:72,height:72,display:'block',margin:'0 auto 8px'}}/>
        <h2 style={{margin:'0 0 6px'}}>Tell us about you</h2>
        <p className="muted">This helps estimate daily needs.</p>

        <div className="form-row">
          <label>Age</label>
          <input type="number" min="10" max="120" value={age} onChange={e=>setAge(e.target.value)} placeholder="Years" />
        </div>

        <div className="form-row">
          <label>Height (cm)</label>
          <input type="number" min="50" max="250" value={height} onChange={e=>setHeight(e.target.value)} placeholder="cm" />
        </div>

        <div className="form-row dropdown" ref={genderRef}>
          <label>Gender</label>
          <div className="dropdown-trigger" tabIndex={0} role="button" onClick={()=>{setGenderOpen(v=>!v); setActivityOpen(false)}} onKeyDown={e=>{if(e.key==='Enter') setGenderOpen(v=>!v)}}>
            <span>{gender || 'Select'}</span>
            <span className="chev">▾</span>
          </div>
          {genderOpen && (
            <div className="dropdown-drawer" role="listbox">
              <button type="button" className="dropdown-item" onClick={()=>{setGender('female'); setGenderOpen(false)}}>Female</button>
              <button type="button" className="dropdown-item" onClick={()=>{setGender('male'); setGenderOpen(false)}}>Male</button>
              <button type="button" className="dropdown-item" onClick={()=>{setGender('other'); setGenderOpen(false)}}>Other / Prefer not to say</button>
            </div>
          )}
        </div>

        <div className="form-row dropdown" ref={activityRef}>
          <label>Activity level</label>
          <div
            className={`dropdown-trigger ${customCalories ? 'disabled' : ''}`}
            tabIndex={0}
            role="button"
            onClick={()=>{
              if(customCalories) return
              setActivityOpen(v=>!v); setGenderOpen(false)
            }}
            onKeyDown={e=>{if(e.key==='Enter' && !customCalories) setActivityOpen(v=>!v)}}
          >
            <span>{activity || '-- Choose --'}</span>
            <span className="chev">▾</span>
          </div>
          {activityOpen && (
            <div className="dropdown-drawer" role="listbox">
              <button type="button" className="dropdown-item" onClick={()=>{setActivity('sedentary'); setCustomCalories(''); setWorkoutDays(''); setActivityOpen(false)}}>Sedentary (little or no exercise)</button>
              <button type="button" className="dropdown-item" onClick={()=>{setActivity('light'); setCustomCalories(''); setWorkoutDays(''); setActivityOpen(false)}}>Light (1-3 workouts/week)</button>
              <button type="button" className="dropdown-item" onClick={()=>{setActivity('moderate'); setCustomCalories(''); setWorkoutDays(''); setActivityOpen(false)}}>Moderate (3-5 workouts/week)</button>
              <button type="button" className="dropdown-item" onClick={()=>{setActivity('active'); setCustomCalories(''); setWorkoutDays(''); setActivityOpen(false)}}>Active (6-7 workouts/week)</button>
              <button type="button" className="dropdown-item" onClick={()=>{setActivity('very'); setCustomCalories(''); setWorkoutDays(''); setActivityOpen(false)}}>Very active (daily intense exercise)</button>
            </div>
          )}
        </div>

        <div className="form-row">
          <label>Or enter calories burned per workout</label>
          <input type="number" min="0" value={customCalories} onChange={e=>{
            const v = e.target.value
            setCustomCalories(v)
            if(v){
              // when custom calories are entered, clear activity and close drawer
              setActivity('')
              setActivityOpen(false)
            }
          }} placeholder="e.g. 300" />
        </div>

        {customCalories && (
          <div className="form-row">
            <label>Workout days per week</label>
            <input type="number" min="1" max="7" value={workoutDays} onChange={e=>setWorkoutDays(e.target.value)} placeholder="1-7" />
          </div>
        )}

        {error && <div style={{color:'crimson',fontSize:13,marginTop:8}}>{error}</div>}

        <div style={{display:'flex',gap:10,marginTop:12}}>
          <button type="button" className="icon-btn" onClick={goBack}>Back</button>
          <button type="submit" className="card" style={{flex:1}}>Continue</button>
        </div>
      </form>
    </div>
  )
}
