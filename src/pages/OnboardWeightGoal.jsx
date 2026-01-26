import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function OnboardWeightGoal(){
  const navigate = useNavigate()
  const [heightCm, setHeightCm] = useState(null)
  const [age, setAge] = useState(null)
  const [gender, setGender] = useState('')
  const [currentKg, setCurrentKg] = useState('')
  const [goalKg, setGoalKg] = useState('')
  const [selectedBand, setSelectedBand] = useState('fit')
  const [months, setMonths] = useState('')
  const [error, setError] = useState('')
  const [fastConsent, setFastConsent] = useState(false)
  const [bands, setBands] = useState(null)

  useEffect(()=>{
    const h = Number(localStorage.getItem('calorieWise.height') || '')
    const a = Number(localStorage.getItem('calorieWise.age') || '')
    const g = localStorage.getItem('calorieWise.gender') || ''
    if(!h || !a){
      navigate('/onboard/details')
      return
    }
    setHeightCm(h)
    setAge(a)
    setGender(g)

    const defs = {
      lean: { bmiMin: 19, bmiMax: 22 },
      fit: { bmiMin: 21, bmiMax: 24 },
      bulk: { bmiMin: 24, bmiMax: 26 }
    }
    const hM = h / 100
    const computed = {}
    Object.keys(defs).forEach(k=>{
      const b = defs[k]
      computed[k] = {
        bmiMin: b.bmiMin,
        bmiMax: b.bmiMax,
        minKg: Math.round(b.bmiMin * hM * hM),
        maxKg: Math.round(b.bmiMax * hM * hM)
      }
    })
    setBands(computed)
  },[navigate])

  const autoSet = (bandKey)=>{
    if(!bands) return
    const mid = Math.round((bands[bandKey].minKg + bands[bandKey].maxKg) / 2)
    setSelectedBand(bandKey)
    setGoalKg(String(mid))
    // if current weight known, prefill a reasonable timeline at ~0.75 kg/week
    const c = Number(currentKg) || 0
    if(c > 0){
      const diff = c - mid
      if(diff > 0){
        // recommend a balanced pace ~1 kg/week ≈ 4 kg/month
        const recommendedMonths = Math.max(1, Math.ceil(diff / 4))
        setMonths(String(recommendedMonths))
      }
    }
  }

  const handleSubmit = (e)=>{
    e.preventDefault()
    setError('')
    const c = Number(currentKg) || 0
    const g = Number(goalKg) || 0
    const m = Number(months) || 0
    if(c <= 0){ setError('Enter your current weight.'); return }
    if(g <= 0){ setError('Enter a goal weight or use a band.'); return }
    const diff = c - g
    if(diff <= 0){ setError('Goal must be less than current weight for a weight loss plan.'); return }

    // default recommended pace: 0.5–1.0 kg/week → 2–4 kg/month
    // allow optional faster pace up to ~1.2 kg/week → 5 kg/month with explicit consent
    const recommendedMonths = Math.max(1, Math.ceil(diff / 4)) // ~1 kg/week
    const fastestMonthsAllowed = Math.max(1, Math.ceil(diff / 5)) // ~5 kg/month (≈1.2 kg/week)
    const minMonths = fastestMonthsAllowed
    let maxMonths = Math.floor(diff / 2) // slowest pace 2 kg/month
    if(!maxMonths || maxMonths < minMonths) maxMonths = minMonths
    if(m < minMonths || m > maxMonths){
      setError(`To lose ${diff} kg safely, choose a timeline between ${minMonths} and ${maxMonths} month(s) (≈0.5–1.2 kg/week).`)
      return
    }

    // if user selected a faster pace than the recommended default, require explicit consent
    if(m < recommendedMonths && !fastConsent){
      setError('Faster timelines require acknowledgement. Please check the confirmation box to proceed.')
      return
    }

    try{
      localStorage.setItem('calorieWise.currentWeightKg', String(c))
      localStorage.setItem('calorieWise.targetWeightKg', String(g))
      localStorage.setItem('calorieWise.targetBand', selectedBand)
      localStorage.setItem('calorieWise.timelineMonths', String(m))
    }catch(e){}
    navigate('/', { state: { fromSplash: true } })
  }

  return (
    <div className="goal-modal" role="main">
      <form className="goal-box" onSubmit={handleSubmit} aria-label="Set current and goal weight">
        <h2 style={{margin:0}}>Set weight target</h2>
        <p className="muted" style={{marginTop:6}}>Enter your current weight and goal, or pick a band to auto-fill.</p>

        <div className="form-row">
          <label htmlFor="current-kg">Current weight (kg)</label>
          <input id="current-kg" type="number" min="20" max="500" value={currentKg} onChange={e=>setCurrentKg(e.target.value)} />
        </div>

        <div className="form-row">
          <label htmlFor="goal-kg">Goal weight (kg)</label>
          <input id="goal-kg" type="number" min="20" max="500" value={goalKg} onChange={e=>setGoalKg(e.target.value)} />
        </div>

        {bands && (
          <div className="form-row">
            <label>Quick pick</label>
            <div style={{display:'flex',gap:8}}>
              <button type="button" className="card" onClick={()=>autoSet('lean')}>Lean</button>
              <button type="button" className={`card active`} onClick={()=>autoSet('fit')}>Fit</button>
              <button type="button" className="card" onClick={()=>autoSet('bulk')}>Bulk</button>
            </div>
            <div style={{fontSize:12,color:'var(--muted)',marginTop:8}}>If you're unsure, pick a band and we'll fill a reasonable target for you.</div>
          </div>
        )}

        <div className="form-row">
          <label htmlFor="months">Timeline (months)</label>
          <input id="months" type="number" min="1" value={months} onChange={e=>setMonths(e.target.value)} placeholder="Number of months" />
            <div style={{fontSize:12,color:'var(--muted)',marginTop:6}}>Recommended: 0.5–1.0 kg/week (≈2–4 kg/month). Optional faster pace up to 1.2 kg/week (≈5 kg/month) is allowed with acknowledgement and clinician advice.</div>
            {(() => {
              const cNum = Number(currentKg) || 0
              const gNum = Number(goalKg) || 0
              const diffPreview = cNum - gNum
              const recMonths = diffPreview > 0 ? Math.max(1, Math.ceil(diffPreview / 4)) : null
              if(recMonths && months && Number(months) < recMonths){
                return (
                  <div style={{marginTop:8,fontSize:13,color:'#a33'}}>
                    <div>You've chosen a faster pace than the recommended 1.0 kg/week. Faster loss may increase health risks.</div>
                    <label style={{display:'flex',alignItems:'center',gap:8,marginTop:6}}>
                      <input type="checkbox" checked={fastConsent} onChange={e=>setFastConsent(e.target.checked)} />
                      <span style={{fontSize:12,color:'var(--muted)'}}>I understand the risks and wish to continue.</span>
                    </label>
                  </div>
                )
              }
              return null
            })()}
        </div>

        {error && <div style={{color:'crimson',fontSize:13,marginTop:8}}>{error}</div>}

        <div style={{display:'flex',gap:10,marginTop:12}}>
          <button type="button" className="icon-btn" onClick={()=>navigate('/onboard/details')}>Back</button>
          <button type="submit" className="card" style={{flex:1}}>Finish</button>
        </div>
      </form>
    </div>
  )
}
