import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function OnboardDetails(){
  const location = useLocation()
  const navigate = useNavigate()
  const initialGoal = (location && location.state && location.state.goal) || localStorage.getItem('calorieWise.goal') || 'loss'

  const [goal] = useState(initialGoal)
  const [dob, setDob] = useState('')
  const [height, setHeight] = useState('')
  const [heightUnit, setHeightUnit] = useState('cm')
  const [feet, setFeet] = useState('')
  const [inches, setInches] = useState('')
  const [gender, setGender] = useState('')
  const [activity, setActivity] = useState('')
  const [genderOpen, setGenderOpen] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)
  const genderRef = useRef(null)
  const activityRef = useRef(null)
  const [customCalories, setCustomCalories] = useState('')
  const [workoutDays, setWorkoutDays] = useState('')
  const [error, setError] = useState('')

  // compute max allowed DOB (10 years ago) for the date input
  const today = new Date()
  const maxDob = new Date()
  maxDob.setFullYear(today.getFullYear() - 10)
  const maxDobIso = maxDob.toISOString().slice(0,10)

  // ISO for today (prevent future dates) — allow recent years to appear in picker
  const todayIso = today.toISOString().slice(0,10)

  useEffect(()=>{
    // noop placeholder; kept for parity with earlier logic
  },[])

  // load previously-saved values so returning users see their inputs
  useEffect(()=>{
    try{
      const storedDob = localStorage.getItem('calorieWise.dob') || ''
      if(storedDob) setDob(storedDob)

      const storedHeightUnit = localStorage.getItem('calorieWise.heightUnit') || 'cm'
      setHeightUnit(storedHeightUnit)
      if(storedHeightUnit === 'cm'){
        const h = localStorage.getItem('calorieWise.height') || ''
        if(h) setHeight(h)
      }else{
        const hd = localStorage.getItem('calorieWise.heightDisplay') || ''
        if(hd){
          const m = hd.match(/(\d+)'(\d+)/)
          if(m){ setFeet(m[1]); setInches(m[2]) }
        }else{
          // fallback: convert stored cm to ft/in
          const hcm = Number(localStorage.getItem('calorieWise.height') || '')
          if(hcm){
            const totalIn = Math.round(hcm / 2.54)
            const f = Math.floor(totalIn / 12)
            const i = totalIn % 12
            setFeet(String(f)); setInches(String(i))
          }
        }
      }

      const g = localStorage.getItem('calorieWise.gender') || ''
      if(g) setGender(g)

      const act = localStorage.getItem('calorieWise.activity') || ''
      if(act === 'custom'){
        setActivity('')
        setCustomCalories(localStorage.getItem('calorieWise.customCalories') || '')
        setWorkoutDays(localStorage.getItem('calorieWise.workoutDays') || '')
      }else{
        if(act) setActivity(act)
      }
    }catch(e){}
  },[])

  // live computed age for display under DOB
  let liveAge = null
  if(dob){
    const d = new Date(dob)
    if(!Number.isNaN(d.getTime())){
      liveAge = today.getFullYear() - d.getFullYear()
      const mm = today.getMonth() - d.getMonth()
      if(mm < 0 || (mm === 0 && today.getDate() < d.getDate())) liveAge--
    }
  }

  const goBack = ()=>{
    try{
      const returnTo = (location && location.state && location.state.from)
      if(returnTo) return navigate(returnTo)
    }catch(e){}
    // fallback: go back one step in history if possible, otherwise go to /onboard
    try{ navigate(-1) }catch(e){ navigate('/onboard') }
  }

  const handleSubmit = (e)=>{
    e.preventDefault()
    setError('')
    // validate height according to selected unit
    const hasHeight = heightUnit === 'cm' ? (height && Number(height) > 0) : (feet && Number(feet) >= 0)
    if(!dob || !hasHeight || !gender) {
      setError('Please enter date of birth, height, and gender.')
      return
    }
    if(!activity && !customCalories){
      setError('Choose an activity level or enter calories burned per workout.')
      return
    }
    // calculate age from dob
    const dobDate = new Date(dob)
    if(Number.isNaN(dobDate.getTime())){
      setError('Please enter a valid date of birth.')
      return
    }
    let computedAge = today.getFullYear() - dobDate.getFullYear()
    const m = today.getMonth() - dobDate.getMonth()
    if(m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) computedAge--
    if(computedAge < 10){
      setError('You must be at least 10 years old.')
      return
    }

    // compute height in cm
    let heightCm = null
    if(heightUnit === 'cm'){
      heightCm = Number(height)
    }else{
      const f = Number(feet) || 0
      const i = Number(inches) || 0
      heightCm = Math.round((f * 12 + i) * 2.54)
    }

    try{
      localStorage.setItem('calorieWise.seenEver','1')
      localStorage.setItem('calorieWise.goal', goal)
      localStorage.setItem('calorieWise.age', String(computedAge))
      localStorage.setItem('calorieWise.dob', String(dob))
      localStorage.setItem('calorieWise.height', String(heightCm))
      localStorage.setItem('calorieWise.heightUnit', heightUnit)
      if(heightUnit === 'ft') localStorage.setItem('calorieWise.heightDisplay', `${feet}'${inches || 0}`)
      localStorage.setItem('calorieWise.gender', gender)
      localStorage.setItem('calorieWise.activity', customCalories ? 'custom' : (activity || ''))
      if(customCalories) localStorage.setItem('calorieWise.customCalories', String(customCalories))
      if(customCalories) localStorage.setItem('calorieWise.workoutDays', String(workoutDays || '0'))
    }catch(e){}

    // proceed to weight goal step, forward the chosen goal
    navigate('/onboard/weight', { state: { goal } })
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
          <label>Date of birth</label>
          <input type="date" max={todayIso} value={dob} onChange={e=>setDob(e.target.value)} />
          {dob && liveAge !== null && (
            <div style={{fontSize:13,color: liveAge < 10 ? 'crimson' : 'var(--muted)', marginTop:6}}>
              Age: {liveAge} year{liveAge === 1 ? '' : 's'} {liveAge < 10 ? ' — must be 10 or older' : ''}
            </div>
          )}
        </div>

        <div className="form-row">
          <label>Height</label>
          <div style={{display:'flex',gap:8,alignItems:'center',marginTop:6}}>
            <button type="button" className={`unit-btn ${heightUnit==='cm'?'active':''}`} onClick={()=>setHeightUnit('cm')}>cm</button>
            <button type="button" className={`unit-btn ${heightUnit==='ft'?'active':''}`} onClick={()=>setHeightUnit('ft')}>ft/in</button>
          </div>
          {heightUnit === 'cm' ? (
            <input type="number" min="50" max="250" value={height} onChange={e=>setHeight(e.target.value)} placeholder="cm" style={{marginTop:8}} />
          ) : (
            <div style={{display:'flex',gap:8,marginTop:8}}>
              <input type="number" min="3" max="8" value={feet} onChange={e=>setFeet(e.target.value)} placeholder="ft" />
              <input type="number" min="0" max="11" value={inches} onChange={e=>setInches(e.target.value)} placeholder="in" />
            </div>
          )}
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
