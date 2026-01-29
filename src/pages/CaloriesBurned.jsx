import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function CaloriesBurned(){
  const navigate = useNavigate()
  const today = new Date().toISOString().slice(0,10)
  const [iso, setIso] = useState(today)
  const [value, setValue] = useState('')

  useEffect(()=>{
    try{
      const raw = localStorage.getItem(`calorieWise.burned.${iso}`)
      setValue(raw ? String(Number(raw) || 0) : '')
    }catch(e){ setValue('') }
  },[iso])

  const save = ()=>{
    try{
      const n = Number(value) || 0
      if(n <= 0){
        localStorage.removeItem(`calorieWise.burned.${iso}`)
      }else{
        localStorage.setItem(`calorieWise.burned.${iso}`, String(Math.round(n)))
      }
      try{ window.dispatchEvent(new Event('calorieWise.burnedChanged')) }catch(e){}
      navigate(-1)
    }catch(e){ navigate(-1) }
  }

  const remove = ()=>{
    try{ localStorage.removeItem(`calorieWise.burned.${iso}`) }catch(e){}
    try{ window.dispatchEvent(new Event('calorieWise.burnedChanged')) }catch(e){}
    setValue('')
  }

  const handleBack = ()=>{
    try{ if(window.history && window.history.length > 1){ navigate(-1); return } }catch(e){}
    navigate('/', { state: { fromSplash: true } })
  }

  return (
    <div style={{padding:16,maxWidth:900,margin:'0 auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <h2 style={{margin:0}}>Calories burned</h2>
        <div>
          <button className="icon-btn" onClick={handleBack}>Back</button>
        </div>
      </div>

      <div className="track-grid">
        <div className="card">
          <form className="track-form" onSubmit={(e)=>{ e.preventDefault(); save() }}>
            <div className="form-row">
              <label>Date</label>
              <input type="date" value={iso} onChange={e=>setIso(e.target.value)} />
            </div>

            <div className="form-row">
              <label>Calories burned</label>
              <input type="number" value={value} onChange={e=>setValue(e.target.value)} placeholder="0" />
            </div>

            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button className="card" type="submit">Save</button>
              <button className="card" type="button" onClick={remove}>Remove</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
