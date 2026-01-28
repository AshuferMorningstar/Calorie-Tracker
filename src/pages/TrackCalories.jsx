import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

// small built-in food database (kcal per 100 g)
const FOODS = [
  { id: 'chicken', name: 'Chicken breast', kcal: 165 },
  { id: 'rice', name: 'White rice (cooked)', kcal: 130 },
  { id: 'rice_raw', name: 'White rice (raw)', kcal: 365 },
  { id: 'basmati_rice', name: 'Basmati rice (cooked)', kcal: 130 },
  { id: 'basmati_rice_raw', name: 'Basmati rice (raw)', kcal: 365 },
  { id: 'brown_rice', name: 'Brown rice (cooked)', kcal: 123 },
  { id: 'brown_rice_raw', name: 'Brown rice (raw)', kcal: 370 },
  { id: 'chapati', name: 'Roti / Chapati (whole wheat)', kcal: 250 },
  { id: 'atta', name: 'Whole wheat flour (atta)', kcal: 340 },
  { id: 'besan', name: 'Besan (gram flour)', kcal: 387 },
  { id: 'moong_dal', name: 'Moong dal (cooked)', kcal: 105 },
  { id: 'moong_dal_raw', name: 'Moong dal (raw/dry)', kcal: 347 },
  { id: 'toor_dal', name: 'Toor dal (cooked)', kcal: 120 },
  { id: 'toor_dal_raw', name: 'Toor dal (raw/dry)', kcal: 360 },
  { id: 'masoor_dal', name: 'Masoor dal (cooked)', kcal: 116 },
  { id: 'masoor_dal_raw', name: 'Masoor dal (raw/dry)', kcal: 352 },
  { id: 'chickpeas', name: 'Chickpeas (cooked)', kcal: 164 },
  { id: 'chickpeas_raw', name: 'Chickpeas (raw/dry)', kcal: 364 },
  { id: 'rajma', name: 'Kidney beans (cooked)', kcal: 140 },
  { id: 'rajma_raw', name: 'Kidney beans (raw/dry)', kcal: 337 },
  { id: 'paneer', name: 'Paneer (cottage cheese)', kcal: 265 },
  { id: 'ghee', name: 'Ghee', kcal: 900 },
  { id: 'mustard_oil', name: 'Mustard oil', kcal: 884 },
  { id: 'coconut_oil', name: 'Coconut oil', kcal: 892 },
  { id: 'peanut_oil', name: 'Peanut oil', kcal: 884 },
  { id: 'veg_oil', name: 'Vegetable oil', kcal: 884 },
  { id: 'potato', name: 'Potato (boiled)', kcal: 87 },
  { id: 'potato_raw', name: 'Potato (raw)', kcal: 77 },
  { id: 'onion', name: 'Onion', kcal: 40 },
  { id: 'tomato', name: 'Tomato', kcal: 18 },
  { id: 'garlic', name: 'Garlic', kcal: 149 },
  { id: 'ginger', name: 'Ginger', kcal: 80 },
  { id: 'spinach', name: 'Spinach (cooked)', kcal: 23 },
  { id: 'spinach_raw', name: 'Spinach (raw)', kcal: 23 },
  { id: 'cauliflower', name: 'Cauliflower (cooked)', kcal: 25 },
  { id: 'cauliflower_raw', name: 'Cauliflower (raw)', kcal: 25 },
  { id: 'banana', name: 'Banana', kcal: 89 },
  { id: 'apple', name: 'Apple', kcal: 52 },
  { id: 'milk', name: 'Milk (whole)', kcal: 60 },
  { id: 'bread', name: 'Bread (white)', kcal: 265 },
  { id: 'egg', name: 'Egg (whole)', kcal: 155 },
  { id: 'sugar', name: 'Sugar', kcal: 387 },
  { id: 'jaggery', name: 'Jaggery (gur)', kcal: 383 },
]

// common aliases -> preferred raw IDs
const ALIASES = {
  'rice': 'rice_raw',
  'white rice': 'rice_raw',
  'basmati': 'basmati_rice_raw',
  'basmati rice': 'basmati_rice_raw',
  'brown rice': 'brown_rice_raw',
  'chapati': 'chapati',
  'roti': 'chapati',
  'atta': 'atta',
  'besan': 'besan',
  'moong': 'moong_dal_raw',
  'moong dal': 'moong_dal_raw',
  'masoor': 'masoor_dal_raw',
  'masoor dal': 'masoor_dal_raw',
  'toor': 'toor_dal_raw',
  'toor dal': 'toor_dal_raw',
  'chickpea': 'chickpeas_raw',
  'chickpeas': 'chickpeas_raw',
  'chana': 'chickpeas_raw',
  'rajma': 'rajma_raw',
  'potato': 'potato_raw',
  'spinach': 'spinach_raw',
  'cauliflower': 'cauliflower_raw',
}

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

    const amt = parseFloat(amount)
    const kcal100 = parseFloat(kcalPer100g)

    let calories = null
    let caloriesPerGram = null
    if(!isNaN(kcal100) && kcal100 > 0){
      caloriesPerGram = Number((kcal100 / 100).toFixed(2))
    }
    if(!isNaN(amt) && amt > 0 && caloriesPerGram !== null){
      calories = Math.round(amt * caloriesPerGram)
    }

    const item = {
      id: Date.now(),
      name: trimmed,
      amount: !isNaN(amt) && amt > 0 ? amt : null,
      kcalPer100g: !isNaN(kcal100) && kcal100 > 0 ? kcal100 : null,
      caloriesPerGram: caloriesPerGram,
      calories: calories,
    }
    const next = [...items, item]
    setItems(next)
    persist(next)
    setName(''); setAmount(''); setKcalPer100g(''); setManualKcalNeeded(false)
  }

  const removeItem = (id)=>{
    const next = items.filter(i=>i.id !== id)
    setItems(next)
    persist(next)
  }

  const totalCalories = useMemo(()=> items.reduce((s,i)=> s + (Number(i.calories)||0), 0), [items])

  // live preview: calculated calories for the entered amount
  const previewCalories = (()=>{
    const amt = parseFloat(amount)
    const kcal100 = parseFloat(kcalPer100g)
    if(!isNaN(amt) && amt > 0 && !isNaN(kcal100) && kcal100 > 0){
      return Math.round((amt * kcal100) / 100)
    }
    return null
  })()

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
              <input value={name} onChange={(e)=>{
                const v = e.target.value
                setName(v)
                const raw = (v || '').trim().toLowerCase()

                // 1) exact name match
                let found = FOODS.find(f => f.name.toLowerCase() === raw)

                // 2) handle explicit "cooked" keyword
                let cookedRequested = false
                let base = raw
                if(raw.includes('cooked')){
                  cookedRequested = true
                  base = raw.replace(/cooked/g,'').trim()
                }

                // 3) alias lookup (prefer raw by default)
                if(!found){
                  const aliasId = ALIASES[base]
                  if(aliasId){
                    // if user asked for cooked, try cooked variant id by removing _raw
                    if(cookedRequested){
                      const cookedId = aliasId.replace(/_raw$/, '')
                      found = FOODS.find(f => f.id === cookedId) || FOODS.find(f => f.id === aliasId)
                    }else{
                      found = FOODS.find(f => f.id === aliasId) || FOODS.find(f => f.id === aliasId.replace(/_raw$/,''))
                    }
                  }
                }

                // 4) fallback: includes search preferring cooked/raw based on request
                if(!found && base){
                  if(cookedRequested){
                    found = FOODS.find(f => f.name.toLowerCase().includes(base) && f.name.toLowerCase().includes('cooked'))
                  }
                  if(!found){
                    // prefer raw or any non-cooked match
                    found = FOODS.find(f => f.name.toLowerCase().includes(base) && !f.name.toLowerCase().includes('cooked'))
                  }
                }

                if(found){ setKcalPer100g(found.kcal); setManualKcalNeeded(false) }
                else { setKcalPer100g(''); setManualKcalNeeded(true) }

              }} placeholder="Start typing (e.g. Chicken breast)" />

            </div>

            <div style={{display:'flex',gap:8,alignItems:'flex-end'}}>
              <div style={{flex:1}} className="form-row">
                <label>Amount (g)</label>
                <input value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder="100" type="number" step="any" />
              </div>

              <div style={{width:140}} className="form-row">
                <label>kcal / 100g</label>
                <input value={kcalPer100g} onChange={(e)=>{ setKcalPer100g(e.target.value); setManualKcalNeeded(false) }} placeholder="auto" type="number" step="any" />
                {previewCalories !== null && (
                  <div style={{fontSize:12,color:'var(--muted)',marginTop:6,whiteSpace:'nowrap'}}>{previewCalories} kcal for {amount || 0} g</div>
                )}
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
              <ul style={{listStyle:'none',padding:0,display:'flex',flexWrap:'wrap',gap:8}}>
                {items.map(it=> (
                  <li key={it.id} className="card" style={{position:'relative',padding:12,display:'flex',justifyContent:'space-between',alignItems:'center',overflow:'visible',flex:'1 1 220px',minWidth:180,boxSizing:'border-box',maxWidth:'100%'}}>
                    <button aria-label="Remove item" onClick={()=>removeItem(it.id)} className="icon-btn close-btn" style={{position:'absolute',top:4,right:4,width:32,height:32,display:'inline-flex',alignItems:'center',justifyContent:'center',borderRadius:6,zIndex:40,cursor:'pointer'}}>×</button>
                    <div style={{minWidth:0,flex:1,marginRight:8,maxWidth:'calc(100% - 48px)'}}>
                      <div style={{fontWeight:600,whiteSpace:'normal',overflow:'visible',wordBreak:'normal',overflowWrap:'normal',hyphens:'none'}}>{it.name}</div>
                      <div style={{fontSize:12,color:'var(--muted)'}}>
                        {it.amount ? `${it.amount} g • ` : ''}
                        {it.calories ? `${it.calories} kcal` : ''}
                      </div>
                    </div>
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
