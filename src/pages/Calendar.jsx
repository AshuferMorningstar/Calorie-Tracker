import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Calendar(){
  const navigate = useNavigate()
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()

  const [view, setView] = useState({ year: currentYear, month: currentMonth })

  const monthName = useMemo(()=> new Date(view.year, view.month, 1).toLocaleString(undefined,{month:'long', year:'numeric'}), [view])

  const goPrev = ()=>{
    let y = view.year
    let m = view.month - 1
    if(m < 0){ m = 11; y -= 1 }
    setView({ year: y, month: m })
  }

  const goNext = ()=>{
    // don't allow navigating to future months beyond currentYear/currentMonth
    if(view.year > currentYear || (view.year === currentYear && view.month >= currentMonth)) return
    let y = view.year
    let m = view.month + 1
    if(m > 11){ m = 0; y += 1 }
    // prevent stepping into future
    if(y > currentYear || (y === currentYear && m > currentMonth)) return
    setView({ year: y, month: m })
  }

  const gotoToday = ()=> setView({ year: currentYear, month: currentMonth })

  const daysGrid = useMemo(()=>{
    const first = new Date(view.year, view.month, 1)
    const last = new Date(view.year, view.month + 1, 0)
    const daysInMonth = last.getDate()
    const startIdx = first.getDay() // 0..6
    const cells = []
    for(let i=0;i<startIdx;i++) cells.push(null)
    for(let d=1; d<=daysInMonth; d++) cells.push(d)
    while(cells.length % 7 !== 0) cells.push(null)
    return { cells, daysInMonth }
  }, [view])

  return (
    <div style={{padding:16,maxWidth:720,margin:'0 auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <h2 style={{margin:0}}>Calendar</h2>
        <div style={{display:'flex',gap:8}}>
          <button className="icon-btn" onClick={()=>navigate('/', { state: { fromSplash: true } })}>Back</button>
        </div>
      </div>

      <div className="card" style={{padding:12}}>
        <div className="month-cal">
          <div className="cal-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <button className="icon-btn" onClick={goPrev} aria-label="Previous month">◀</button>
              <button className="icon-btn" onClick={gotoToday} aria-label="Go to current month">Today</button>
              <button className="icon-btn" onClick={goNext} aria-label="Next month" disabled={view.year > currentYear || (view.year === currentYear && view.month >= currentMonth)}>▶</button>
            </div>
            <div style={{fontWeight:700}}>{monthName}</div>
            <div style={{width:86}} />
          </div>

          <div className="dow-row" style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',marginBottom:6}}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d,i)=>(
              <div key={i} style={{fontSize:12,color:'var(--muted)',textAlign:'center'}}>{d}</div>
            ))}
          </div>

          <div className="dates-grid" style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:6}}>
            {daysGrid.cells.map((d,i)=>{
              const isToday = d === today.getDate() && view.month === currentMonth && view.year === currentYear
              const isFutureDay = view.year === currentYear && view.month === currentMonth && d && d > today.getDate()
              return (
                <div key={i} className={`date-cell ${isToday ? 'today' : ''} ${isFutureDay ? 'future' : ''}`} style={{height:40,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:8,cursor:d ? 'pointer' : 'default'}}>
                  {d || ''}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
