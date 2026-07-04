import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSyncContext } from '../context/SyncContext'

export default function CaloriesBurned(){
  const navigate = useNavigate()
  const { triggerSync } = useSyncContext()
  const today = new Date().toISOString().slice(0,10)
  const [iso, setIso] = useState(today)
  const [value, setValue] = useState('')
  const draftByDateRef = useRef(new Map())

  useEffect(()=>{
    try{
      const draft = draftByDateRef.current.get(iso)
      if(typeof draft === 'string'){
        setValue(draft)
        return
      }
      const raw = localStorage.getItem(`calorieWise.burned.${iso}`)
      const nextValue = raw ? String(Number(raw) || 0) : ''
      draftByDateRef.current.set(iso, nextValue)
      setValue(nextValue)
    }catch(e){ setValue('') }
  },[iso])

  const save = ()=>{
    try{
      const n = Number(value) || 0
      if(n <= 0){
        localStorage.removeItem(`calorieWise.burned.${iso}`)
        draftByDateRef.current.set(iso, '')
      }else{
        const nextValue = String(Math.round(n))
        localStorage.setItem(`calorieWise.burned.${iso}`, nextValue)
        draftByDateRef.current.set(iso, nextValue)
      }
      triggerSync()
      try{ window.dispatchEvent(new Event('calorieWise.burnedChanged')) }catch(e){}
      navigate(-1)
    }catch(e){ navigate(-1) }
  }

  const remove = ()=>{
    try{ localStorage.removeItem(`calorieWise.burned.${iso}`) }catch(e){}
    try{ draftByDateRef.current.set(iso, '') }catch(e){}
    try{ window.dispatchEvent(new Event('calorieWise.burnedChanged')) }catch(e){}
    setValue('')
  }

  const handleBack = ()=>{
    try{ if(window.history && window.history.length > 1){ navigate(-1); return } }catch(e){}
    navigate('/', { state: { fromSplash: true } })
  }

  return (
    <div style={{padding:16,maxWidth:900,margin:'0 auto'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
        <button className="icon-btn" onClick={handleBack} style={{fontSize:20,lineHeight:1}}>←</button>
        <h2 style={{margin:0}}>Calories burned</h2>
      </div>

      <div className="track-grid">
        <div className="card">
          <form className="track-form" onSubmit={(e)=>{ e.preventDefault(); save() }}>
            <div className="form-row">
              <label>Date</label>
              <input
                type="date"
                value={iso}
                max={today}
                onChange={e=>{
                  const next = e.target.value
                  setIso(next && next <= today ? next : today)
                }}
              />
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
