import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

// small built-in food database (kcal per 100 g)
const FOODS = [
  { id: 'chicken', name: 'Chicken breast', kcal: 165 },
  { id: 'rice', name: 'White rice (cooked)', kcal: 130 },
  { id: 'egg', name: 'Egg (whole)', kcal: 155 },
  { id: 'banana', name: 'Banana', kcal: 89 },
  { id: 'olive_oil', name: 'Olive oil', kcal: 884 },
  { id: 'bread', name: 'Bread (white)', kcal: 265 },
  { id: 'milk', name: 'Milk (whole)', kcal: 60 },
  { id: 'apple', name: 'Apple', kcal: 52 },
  { id: 'potato', name: 'Potato (boiled)', kcal: 87 },
]

const dateKey = (d)=> `calorieWise.entries.${d}`

const todayISO = ()=>{
  const d = new Date()
  return d.toISOString().slice(0,10)
}

export default function TrackCalories(){
  const navigate = useNavigate()
  const [date, setDate] = useState(todayISO())
  const [items, setItems] = useState([])

  // form fields
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('') // grams
  const [kcalPer100g, setKcalPer100g] = useState('')
  const [manualKcalNeeded, setManualKcalNeeded] = useState(false)

  useEffect(()=>{
    // load items for selected date
    try{
      const raw = localStorage.getItem(dateKey(date))
      if(raw){ setItems(JSON.parse(raw)) }
      else setItems([])
    }catch(e){ setItems([]) }
  },[date])

  const persist = (nextItems)=>{
    try{ localStorage.setItem(dateKey(date), JSON.stringify(nextItems)) }catch(e){}
  }

  const addItem = (e)=>{
    e.preventDefault()
    const trimmed = (name || '').trim()
    if(!trimmed) return

    const amt = Number(amount) || 0
    const kcal100 = Number(kcalPer100g) || 0
    let calories = 0
    if(amt > 0 && kcal100 > 0){
      calories = Math.round((amt * kcal100) / 100)
    }

    const item = { id: Date.now(), name: trimmed, amount: amt || null, kcalPer100g: kcal100 || null, calories: calories || null }
    const next = [...items, item]
    setItems(next)
    persist(next)
    setName(''); setAmount(''); setKcalPer100g(''); setDirectCalories('')
  }

  const removeItem = (id)=>{
    const next = items.filter(i=>i.id !== id)
    setItems(next)
    persist(next)
  }

  const totalCalories = useMemo(()=> items.reduce((s,i)=> s + (Number(i.calories)||0), 0), [items])

  const handleBack = ()=>{
    try{ if(window.history && window.history.length > 1){ navigate(-1); return } }catch(e){}
    navigate('/', { state: { fromSplash: true } })
  }

  return (
    <div style={{padding:16,maxWidth:900,margin:'0 auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <h2 style={{margin:0}}>Track Calories</h2>
        <div>
          <button className="icon-btn" onClick={handleBack}>Back</button>
        </div>
      </div>

      <div className="track-grid">
        <div className="card">
          <div style={{display:'flex',alignItems:'center',marginBottom:12,width:'100%'}}>
            <div>
              <div style={{fontSize:13,color:'var(--muted)'}}>Date</div>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
            </div>
          </div>

          <form onSubmit={addItem} className="track-form">
            <div className="form-row">
              <label>Ingredient</label>
              <input list="food-list" value={name} onChange={(e)=>{
                const v = e.target.value
                setName(v)
                const found = FOODS.find(f=>f.name.toLowerCase() === v.toLowerCase())
                if(found){ setKcalPer100g(found.kcal); setManualKcalNeeded(false) }else{ setKcalPer100g(''); setManualKcalNeeded(true) }
              }} placeholder="Start typing (e.g. Chicken breast)" />
              <datalist id="food-list">
                {FOODS.map(f=> <option key={f.id} value={f.name} />)}
              </datalist>
            </div>

            <div style={{display:'flex',gap:8,alignItems:'flex-end'}}>
              <div style={{flex:1}} className="form-row">
                <label>Amount (g)</label>
                <input value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder="100" type="number" />
              </div>

              <div style={{width:140}} className="form-row">
                <label>kcal / 100g</label>
                <input value={kcalPer100g} onChange={(e)=>{ setKcalPer100g(e.target.value); setManualKcalNeeded(false) }} placeholder="auto" type="number" />
                {manualKcalNeeded && <div style={{fontSize:11,color:'var(--muted)'}}>Unknown — enter kcal/100g</div>}
              </div>
            </div>

            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button className="card" type="submit" style={{background:'var(--accent1)',color:'#fff',border:'none',padding:'8px 12px'}}>Add</button>
              <button className="icon-btn" type="button" onClick={()=>{ setName(''); setAmount(''); setKcalPer100g(''); setManualKcalNeeded(false) }}>Clear</button>
            </div>
          </form>
        </div>

        <div>
          <div className="card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',width:'100%',gap:12}}>
                <div style={{fontWeight:700}}>Logged — {date}</div>
                <div style={{fontSize:14,fontWeight:700,textAlign:'right'}}>{totalCalories} kcal</div>
              </div>
            </div>

            {items.length === 0 ? (
              <div style={{color:'var(--muted)'}}>No items logged for this date.</div>
            ) : (
              <ul style={{listStyle:'none',padding:0,display:'grid',gap:8}}>
                {items.map(it=> (
                  <li key={it.id} className="card" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <div style={{fontWeight:600}}>{it.name}</div>
                      <div style={{fontSize:12,color:'var(--muted)'}}>
                        {it.amount ? `${it.amount} g • ` : ''}
                        {it.kcalPer100g ? `${it.kcalPer100g} kcal/100g • ` : ''}
                        {it.calories ? `${it.calories} kcal` : ''}
                      </div>
                    </div>
                    <button className="icon-btn" onClick={()=>removeItem(it.id)}>Remove</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
