import React, { useState, useEffect } from 'react'
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
  const [customCalories, setCustomCalories] = useState('')
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

        <div className="form-row">
          <label>Gender</label>
          <select value={gender} onChange={e=>setGender(e.target.value)}>
            <option value="">Select</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other / Prefer not to say</option>
          </select>
        </div>

        <div className="form-row">
          <label>Activity level</label>
          <select value={activity} onChange={e=>setActivity(e.target.value)}>
            <option value="">-- Choose --</option>
            <option value="sedentary">Sedentary (little or no exercise)</option>
            <option value="light">Light (1-3 workouts/week)</option>
            <option value="moderate">Moderate (3-5 workouts/week)</option>
            <option value="active">Active (6-7 workouts/week)</option>
            <option value="very">Very active (daily intense exercise)</option>
          </select>
        </div>

        <div className="form-row">
          <label>Or enter calories burned per workout</label>
          <input type="number" min="0" value={customCalories} onChange={e=>setCustomCalories(e.target.value)} placeholder="e.g. 300" />
        </div>

        {error && <div style={{color:'crimson',fontSize:13,marginTop:8}}>{error}</div>}

        <div style={{display:'flex',gap:10,marginTop:12}}>
          <button type="button" className="icon-btn" onClick={goBack}>Back</button>
          <button type="submit" className="card" style={{flex:1}}>Continue</button>
        </div>
      </form>
    </div>
  )
}
