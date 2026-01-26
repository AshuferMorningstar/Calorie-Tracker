import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function App(){
  const navigate = useNavigate()

  const previewSplash = ()=> navigate('/splash')
  const resetAndShow = ()=>{
    try{ localStorage.removeItem('calorieWise.seenEver') }catch(e){}
    navigate('/splash')
  }

  return (
    <div>
      <main style={{padding:24,maxWidth:900,margin:'0 auto',display:'grid',gap:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <h2 style={{margin:0}}>Calorie Wise</h2>
            <p style={{margin:4,color:'var(--muted)'}}>App skeleton — next: logging UI and storage.</p>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className="icon-btn" onClick={previewSplash}>Preview splash</button>
            <button className="icon-btn" onClick={resetAndShow}>Reset splash</button>
          </div>
        </div>
      </main>
    </div>
  )
}
