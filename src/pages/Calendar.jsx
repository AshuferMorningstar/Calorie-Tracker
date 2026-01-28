import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Calendar(){
  const navigate = useNavigate()

  return (
    <div style={{padding:16,maxWidth:720,margin:'0 auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <h2>Calendar</h2>
        <div>
          <button className="icon-btn" onClick={()=>navigate('/', { state: { fromSplash: true } })}>Back</button>
        </div>
      </div>

      <div className="card">
        <div style={{width:'100%'}}>
          <div style={{fontWeight:700}}>Calendar view (placeholder)</div>
          <div style={{fontSize:13,color:'var(--muted)',marginTop:8}}>This will show logged days and quick navigation.</div>
        </div>
      </div>
    </div>
  )
}
