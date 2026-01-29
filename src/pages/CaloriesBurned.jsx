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
      // notify other parts of the app to recompute if needed
      try{ window.dispatchEvent(new Event('calorieWise.burnedChanged')) }catch(e){}
      navigate(-1)
    }catch(e){ navigate(-1) }
  }

  const remove = ()=>{
    try{ localStorage.removeItem(`calorieWise.burned.${iso}`) }catch(e){}
    try{ window.dispatchEvent(new Event('calorieWise.burnedChanged')) }catch(e){}
    setValue('')
  }

  return (
    <main style={{padding:16,maxWidth:720,margin:'0 auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <h3>Calories burned</h3>
        <button className="card" onClick={()=>navigate(-1)}>Close</button>
      </div>

      <div className="card" style={{padding:12}}>
        <label style={{display:'block',marginBottom:8}}>Date</label>
        <input type="date" value={iso} onChange={e=>setIso(e.target.value)} style={{padding:8,width:'100%',boxSizing:'border-box',marginBottom:12}} />

        <label style={{display:'block',marginBottom:8}}>Calories burned</label>
        <input type="number" value={value} onChange={e=>setValue(e.target.value)} placeholder="0" style={{padding:8,width:'100%',boxSizing:'border-box',marginBottom:12}} />

        <div style={{display:'flex',gap:8}}>
          <button className="card" onClick={save} style={{padding:'8px 12px'}}>Save</button>
          <button className="card" onClick={remove} style={{padding:'8px 12px'}}>Remove</button>
        </div>
      </div>
    </main>
  )
}
