import React, { useMemo } from 'react'

export default function MiniCalendar(){
  const today = new Date()
  const { weeks, weekDays } = useMemo(()=>{
    const y = today.getFullYear()
    const m = today.getMonth()

    // weekday labels
    const weekDays = ['S','M','T','W','T','F','S']

    // first day of month
    const first = new Date(y, m, 1)
    const last = new Date(y, m + 1, 0)
    const daysInMonth = last.getDate()

    // start index (0=Sun)
    const startIdx = first.getDay()

    const cells = []
    // prepend blanks for previous month days
    for(let i=0;i<startIdx;i++) cells.push(null)
    for(let d=1; d<=daysInMonth; d++) cells.push(d)
    // pad to 42 cells (6 weeks)
    while(cells.length < 42) cells.push(null)

    const weeks = []
    for(let i=0;i<6;i++) weeks.push(cells.slice(i*7, i*7+7))

    return { weeks, weekDays }
  }, [today])

  const isToday = (d)=>{
    if(!d) return false
    return d === today.getDate()
  }

  // mark days that have entries in localStorage for the current month
  const marked = useMemo(()=>{
    const set = new Set()
    try{
      for(let i=0;i<localStorage.length;i++){
        const key = localStorage.key(i)
        if(!key) continue
        if(key.startsWith('calorieWise.entries.')){
          const dateStr = key.slice('calorieWise.entries.'.length)
          const parts = dateStr.split('-')
          if(parts.length === 3){
            const y = Number(parts[0])
            const m = Number(parts[1]) - 1
            const day = Number(parts[2])
            if(y === today.getFullYear() && m === today.getMonth()) set.add(day)
          }
        }
      }
    }catch(e){}
    return set
  }, [today])

  return (
    <div className="mini-cal" aria-hidden>
      <div className="dow-row">
        {weekDays.map((w,i)=> <div key={i} className="dow">{w}</div>)}
      </div>
      <div className="dates-grid">
        {weeks.flat().map((d, i)=> {
          const hasEntry = d && marked.has(d)
          return (
            <div key={i} className={`date-cell ${isToday(d) ? 'today' : ''} ${hasEntry ? 'has-entry' : ''}`}>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                <div>{d || ''}</div>
                {hasEntry ? <div style={{width:6,height:6,borderRadius:99,background:'var(--accent1)'}} /> : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
