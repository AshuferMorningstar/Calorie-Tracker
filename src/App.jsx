import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

export default function App(){
  const navigate = useNavigate()

  const previewSplash = ()=> navigate('/splash')
  const resetAndShow = ()=>{
    try{ localStorage.removeItem('calorieWise.seenEver') }catch(e){}
    navigate('/splash')
  }

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
  },[]) 

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

  return (
    <div>
      <main style={{padding:24,maxWidth:900,margin:'0 auto',display:'grid',gap:16}}>
        <div className="dashboard-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <h2 style={{margin:0}}>Calorie Wise</h2>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <button className="icon-btn hamburger-icon" title="Menu" aria-label="Open menu">☰</button>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="card">
            <strong>Maintenance calories</strong>
            <div style={{fontSize:20,marginTop:8}}>{calories ? `${calories.maintenance} kcal/day` : '—'}</div>
            <div style={{fontSize:12,color:'var(--muted)',marginTop:6}}>Estimated calories to maintain current weight.</div>
          </div>

          <div className="card">
            <strong>Diet calories</strong>
            <div style={{fontSize:20,marginTop:8}}>{calories ? `${calories.diet} kcal/day` : '—'}</div>
            <div style={{fontSize:12,color:'var(--muted)',marginTop:6}}>{calories ? calories.note : 'Provide profile and goals to see plan.'}</div>
          </div>
        </div>

        <div style={{display:'flex',gap:8}}>
          <button className="icon-btn" onClick={previewSplash}>Preview splash</button>
          <button className="icon-btn" onClick={resetAndShow}>Reset splash</button>
        </div>
      </main>
    </div>
  )
}
