import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSyncContext } from '../context/SyncContext'
import { saveUserDataToFirestore } from '../services/firestore'

export default function CaloriesBurned(){
  const navigate = useNavigate()
  const location = useLocation()
  const { triggerSync, currentUser, isOnline } = useSyncContext()
  const localISODate = (date = new Date())=>{
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  const today = localISODate()
  const initialDate = location.state?.date || today
  const [iso, setIso] = useState(initialDate)
  const [value, setValue] = useState('')
  const [notification, setNotification] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const draftByDateRef = useRef(new Map())
  const notificationTimerRef = useRef(null)

  useEffect(()=>{
    return ()=>{
      if(notificationTimerRef.current) clearTimeout(notificationTimerRef.current)
    }
  },[])

  const showNotification = (message, type = 'success')=>{
    setNotification({ message, type })
    if(notificationTimerRef.current) clearTimeout(notificationTimerRef.current)
    notificationTimerRef.current = setTimeout(() => setNotification(null), 3000)
  }

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

  const save = async ()=>{
    if(isSaving) return
    setIsSaving(true)
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
      if(currentUser && isOnline){
        await saveUserDataToFirestore(currentUser.uid)
      }else{
        triggerSync()
      }
      try{ window.dispatchEvent(new Event('calorieWise.burnedChanged')) }catch(e){}
      showNotification(`Calories burned saved for ${iso}.`)
    }catch(e){
      showNotification('Could not save calories burned. Please try again.', 'error')
    }finally{
      setIsSaving(false)
    }
  }

  const remove = ()=>{
    try{ localStorage.removeItem(`calorieWise.burned.${iso}`) }catch(e){}
    try{ draftByDateRef.current.set(iso, '') }catch(e){}
    try{ window.dispatchEvent(new Event('calorieWise.burnedChanged')) }catch(e){}
    setValue('')
    showNotification(`Calories burned removed for ${iso}.`)
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
              <button
                className="card"
                type="submit"
                disabled={isSaving}
                style={{background:'rgba(34, 197, 94, 0.15)',color:'#15803d',border:'1px solid rgba(34, 197, 94, 0.35)',padding:'8px 14px',fontWeight:700,cursor:isSaving ? 'wait' : 'pointer',opacity:isSaving ? 0.7 : 1}}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                className="card"
                type="button"
                onClick={remove}
                disabled={isSaving}
                style={{background:'rgba(239, 68, 68, 0.12)',color:'#b91c1c',border:'1px solid rgba(239, 68, 68, 0.3)',padding:'8px 14px',fontWeight:700,cursor:isSaving ? 'not-allowed' : 'pointer',opacity:isSaving ? 0.6 : 1}}
              >
                Remove
              </button>
            </div>
            {notification && (
              <div
                role="status"
                aria-live="polite"
                style={{marginTop:12,padding:'9px 12px',borderRadius:8,background:notification.type === 'error' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',color:notification.type === 'error' ? '#b91c1c' : '#15803d',fontSize:13,fontWeight:600}}
              >
                {notification.message}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
