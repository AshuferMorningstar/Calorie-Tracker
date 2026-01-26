import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Onboard(){
  const navigate = useNavigate()

  const choose = (goal)=>{
    // route to details page to collect age/height/gender/activity
    navigate('/onboard/details', { state: { goal } })
  }

  return (
    <div className="goal-modal" role="main">
      <div className="goal-box" aria-label="Onboarding - select goal">
        <img src="/assets/Picsart_26-01-22_22-42-53-930.png" alt="Calorie Wise logo" style={{width:88,height:88,display:'block',margin:'0 auto 12px'}}/>
        <h2 style={{margin:'0 0 6px'}}>Welcome to Calorie Wise</h2>
        <p className="muted">Select a goal to personalize your experience.</p>
        <div className="goal-actions" style={{marginTop:16}}>
          <button className="card" onClick={()=>choose('loss')}>Weight loss</button>
          <button className="card secondary" onClick={()=>choose('gain')}>Weight gain</button>
          <button className="card" onClick={()=>choose('maintain')}>Maintain weight</button>
        </div>
      </div>
    </div>
  )
}
