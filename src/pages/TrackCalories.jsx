import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

// small built-in food database (kcal per 100 g where applicable)
const FOODS = [
  { id: 'chicken', name: 'Chicken breast', kcal: 165, protein: 31.0 },
  { id: 'rice', name: 'White rice (cooked)', kcal: 130, protein: 2.7 },
  { id: 'rice_raw', name: 'White rice (raw)', kcal: 365, protein: 7.1 },
  { id: 'basmati_rice', name: 'Basmati rice (cooked)', kcal: 130, protein: 2.6 },
  { id: 'basmati_rice_raw', name: 'Basmati rice (raw)', kcal: 365, protein: 7.1 },
  { id: 'brown_rice', name: 'Brown rice (cooked)', kcal: 123, protein: 2.6 },
  { id: 'brown_rice_raw', name: 'Brown rice (raw)', kcal: 370, protein: 7.5 },
  { id: 'chapati', name: 'Roti / Chapati (whole wheat)', kcal: 250, protein: 9.0 },
  { id: 'atta', name: 'Whole wheat flour (atta)', kcal: 340, protein: 13.2 },
  { id: 'besan', name: 'Besan (gram flour)', kcal: 387, protein: 22.4 },
  { id: 'moong_dal', name: 'Moong dal (cooked)', kcal: 105, protein: 7.0 },
  { id: 'moong_dal_raw', name: 'Moong dal (raw/dry)', kcal: 347, protein: 24.0 },
  { id: 'toor_dal', name: 'Toor dal (cooked)', kcal: 120, protein: 7.0 },
  { id: 'toor_dal_raw', name: 'Toor dal (raw/dry)', kcal: 360, protein: 22.0 },
  { id: 'masoor_dal', name: 'Masoor dal (cooked)', kcal: 116, protein: 9.0 },
  { id: 'masoor_dal_raw', name: 'Masoor dal (raw/dry)', kcal: 352, protein: 25.8 },
  { id: 'chickpeas', name: 'Chickpeas (cooked)', kcal: 164, protein: 8.9 },
  { id: 'chickpeas_raw', name: 'Chickpeas (raw/dry)', kcal: 364, protein: 19.3 },
  { id: 'rajma', name: 'Kidney beans (cooked)', kcal: 140, protein: 8.7 },
  { id: 'rajma_raw', name: 'Kidney beans (raw/dry)', kcal: 337, protein: 21.6 },
  { id: 'paneer', name: 'Paneer (cottage cheese)', kcal: 265, protein: 18.3 },
  { id: 'ghee', name: 'Ghee', kcal: 900, protein: 0 },
  { id: 'mustard_oil', name: 'Mustard oil', kcal: 884, protein: 0 },
  { id: 'coconut_oil', name: 'Coconut oil', kcal: 892, protein: 0 },
  { id: 'peanut_oil', name: 'Peanut oil', kcal: 884, protein: 0 },
  { id: 'veg_oil', name: 'Vegetable oil', kcal: 884, protein: 0 },
  { id: 'potato', name: 'Potato (boiled)', kcal: 87, protein: 1.9 },
  { id: 'potato_raw', name: 'Potato (raw)', kcal: 77, protein: 2.0 },
  { id: 'onion', name: 'Onion', kcal: 40, protein: 1.1 },
  { id: 'tomato', name: 'Tomato', kcal: 18, protein: 0.9 },
  { id: 'garlic', name: 'Garlic', kcal: 149, protein: 6.4 },
  { id: 'ginger', name: 'Ginger', kcal: 80, protein: 1.8 },
  { id: 'spinach', name: 'Spinach (cooked)', kcal: 23, protein: 2.9 },
  { id: 'spinach_raw', name: 'Spinach (raw)', kcal: 23, protein: 2.9 },
  { id: 'cauliflower', name: 'Cauliflower (cooked)', kcal: 25, protein: 1.9 },
  { id: 'cauliflower_raw', name: 'Cauliflower (raw)', kcal: 25, protein: 1.9 },
  { id: 'banana', name: 'Banana', kcal: 89, protein: 1.1 },
  { id: 'apple', name: 'Apple', kcal: 52, protein: 0.3 },
  { id: 'milk', name: 'Milk (whole)', kcal: 60, protein: 3.2 },
  { id: 'bread', name: 'Bread (white)', kcal: 265, protein: 9.0 },
  { id: 'egg', name: 'Egg (whole)', kcal: 155, unit: 'count', kcalPerUnit: 62, proteinPer100g: 13.0, proteinPerUnit: 6.5 },
  { id: 'sugar', name: 'Sugar', kcal: 387, protein: 0 },
  { id: 'jaggery', name: 'Jaggery (gur)', kcal: 383, protein: 0 },
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
  const [proteinPer100g, setProteinPer100g] = useState('')
  const [manualKcalNeeded, setManualKcalNeeded] = useState(false)
  const [unit, setUnit] = useState('g') // 'g' or 'count'
  const [kcalPerUnit, setKcalPerUnit] = useState('')
  const [proteinPerUnit, setProteinPerUnit] = useState('')

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
    const protein100 = parseFloat(proteinPer100g)

    let calories = null
    let caloriesPerGram = null
    let protein = null
    let proteinPerGram = null
    if(unit === 'count'){
      const perUnit = parseFloat(kcalPerUnit)
      const protUnit = parseFloat(proteinPerUnit)
      if(!isNaN(amt) && amt > 0 && !isNaN(perUnit) && perUnit > 0){
        calories = Math.round(amt * perUnit)
      }
      if(!isNaN(amt) && amt > 0 && !isNaN(protUnit) && protUnit >= 0){
        protein = Math.round((amt * protUnit) * 10) / 10
      }
    } else {
      if(!isNaN(kcal100) && kcal100 > 0){
        caloriesPerGram = Number((kcal100 / 100).toFixed(2))
      }
      if(!isNaN(amt) && amt > 0 && caloriesPerGram !== null){
        calories = Math.round(amt * caloriesPerGram)
      }
      if(!isNaN(protein100) && protein100 >= 0){
        proteinPerGram = Number((protein100 / 100).toFixed(3))
      }
      if(!isNaN(amt) && amt > 0 && proteinPerGram !== null){
        protein = Math.round((amt * proteinPerGram) * 10) / 10
      }
    }

    const item = {
      id: Date.now(),
      name: trimmed,
      amount: !isNaN(amt) && amt > 0 ? amt : null,
      kcalPer100g: !isNaN(kcal100) && kcal100 > 0 ? kcal100 : null,
      kcalPerUnit: unit === 'count' && kcalPerUnit ? Number(kcalPerUnit) : null,
      proteinPer100g: !isNaN(protein100) && protein100 >= 0 ? protein100 : null,
      proteinPerUnit: unit === 'count' && proteinPerUnit ? Number(proteinPerUnit) : null,
      caloriesPerGram: caloriesPerGram,
      calories: calories,
      protein: protein,
    }
    const next = [...items, item]
    setItems(next)
    persist(next)
    setName(''); setAmount(''); setKcalPer100g(''); setProteinPer100g(''); setKcalPerUnit(''); setProteinPerUnit(''); setUnit('g'); setManualKcalNeeded(false)
  }

  const removeItem = (id)=>{
    const next = items.filter(i=>i.id !== id)
    setItems(next)
    persist(next)
  }

  const totalCalories = useMemo(()=> items.reduce((s,i)=> s + (Number(i.calories)||0), 0), [items])
  const totalProtein = useMemo(()=> Math.round(items.reduce((s,i)=> s + (Number(i.protein)||0), 0) * 10) / 10, [items])

  // live preview: calculated calories for the entered amount
  const previewCalories = (()=>{
    const amt = parseFloat(amount)
    const kcal100 = parseFloat(kcalPer100g)
    const perUnit = parseFloat(kcalPerUnit)
    const protein100 = parseFloat(proteinPer100g)
    const perProtUnit = parseFloat(proteinPerUnit)
    if(unit === 'count'){
      if(!isNaN(amt) && amt > 0 && !isNaN(perUnit) && perUnit > 0){
        return Math.round(amt * perUnit)
      }
      return null
    }
    if(!isNaN(amt) && amt > 0 && !isNaN(kcal100) && kcal100 > 0){
      return Math.round((amt * kcal100) / 100)
    }
    return null
  })()

  const previewProtein = (()=>{
    const amt = parseFloat(amount)
    const protein100 = parseFloat(proteinPer100g)
    const perProtUnit = parseFloat(proteinPerUnit)
    if(unit === 'count'){
      if(!isNaN(amt) && amt > 0 && !isNaN(perProtUnit) && perProtUnit >= 0){
        return Math.round((amt * perProtUnit) * 10) / 10
      }
      return null
    }
    if(!isNaN(amt) && amt > 0 && !isNaN(protein100) && protein100 >= 0){
      return Math.round((amt * protein100) / 100 * 10) / 10
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

                if(found){
                  if(found.unit === 'count'){
                    setUnit('count')
                    setKcalPerUnit(found.kcalPerUnit || found.kcal || '')
                    setProteinPerUnit(found.proteinPerUnit || found.proteinPer100g || '')
                    setKcalPer100g('')
                    setProteinPer100g('')
                    setManualKcalNeeded(false)
                  } else {
                    setUnit('g')
                    setKcalPer100g(found.kcal)
                    setProteinPer100g(found.protein || '')
                    setKcalPerUnit('')
                    setProteinPerUnit('')
                    setManualKcalNeeded(false)
                  }
                } else {
                  setUnit('g')
                  setKcalPer100g('')
                  setKcalPerUnit('')
                  setProteinPer100g('')
                  setProteinPerUnit('')
                  // only show the manual-kcal-needed hint if the user has typed something
                  setManualKcalNeeded(Boolean(base))
                }

              }} placeholder="Start typing (e.g. Chicken breast)" />

            </div>

            <div style={{display:'flex',gap:8,alignItems:'flex-end'}}>
              <div style={{flex:1}} className="form-row">
                <label>{unit === 'count' ? 'Count' : 'Amount (g)'}</label>
                <input value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder={unit === 'count' ? '1' : '100'} type="number" step={unit === 'count' ? '1' : 'any'} min={unit === 'count' ? '1' : undefined} />
              </div>

              <div style={{width:120}} className="form-row">
                <label>{unit === 'count' ? 'kcal / unit' : 'kcal / 100g'}</label>
                {unit === 'count' ? (
                  <input value={kcalPerUnit} onChange={(e)=>{ setKcalPerUnit(e.target.value); setManualKcalNeeded(false) }} placeholder="auto" type="number" step="any" />
                ) : (
                  <input value={kcalPer100g} onChange={(e)=>{ setKcalPer100g(e.target.value); setManualKcalNeeded(false) }} placeholder="auto" type="number" step="any" />
                )}
              </div>

              <div style={{width:120}} className="form-row">
                <label>{unit === 'count' ? 'protein / unit' : 'protein / 100g'}</label>
                {unit === 'count' ? (
                  <input value={proteinPerUnit} onChange={(e)=>{ setProteinPerUnit(e.target.value); setManualKcalNeeded(false) }} placeholder="auto" type="number" step="any" />
                ) : (
                  <input value={proteinPer100g} onChange={(e)=>{ setProteinPer100g(e.target.value); setManualKcalNeeded(false) }} placeholder="auto" type="number" step="any" />
                )}
                {manualKcalNeeded && <div style={{fontSize:11,color:'var(--muted)'}}>Unknown — enter kcal/{unit === 'count' ? 'unit' : '100g'}</div>}
                {previewCalories !== null && (
                  <div style={{fontSize:12,color:'var(--muted)',marginTop:6,whiteSpace:'nowrap'}}>
                    {previewCalories} kcal{previewProtein !== null ? ` • ${previewProtein} g protein` : ''}
                  </div>
                )}
              </div>
            </div>

            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button className="card" type="submit" style={{background:'var(--accent1)',color:'#fff',border:'none',padding:'8px 12px'}}>Add</button>
              <button className="icon-btn" type="button" onClick={()=>{ setName(''); setAmount(''); setKcalPer100g(''); setProteinPer100g(''); setKcalPerUnit(''); setProteinPerUnit(''); setUnit('g'); setManualKcalNeeded(false) }}>Clear</button>
            </div>
          </form>
        </div>

        <div>
          <div className="card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',width:'100%',gap:12}}>
                <div style={{fontWeight:700}}>Logged — {date}</div>
                <div style={{fontSize:14,fontWeight:700,textAlign:'right'}}>{totalCalories} kcal{totalProtein ? ` • ${totalProtein} g` : ''}</div>
              </div>
            </div>

            {items.length === 0 ? (
              <div style={{color:'var(--muted)'}}>No items logged for this date.</div>
            ) : (
              <ul style={{listStyle:'none',padding:0,display:'flex',flexWrap:'wrap',gap:8}}>
                {items.map(it=> (
                  <li key={it.id} className="card" style={{position:'relative',padding:12,display:'flex',justifyContent:'space-between',alignItems:'center',overflow:'visible',flex:'1 1 220px',minWidth:180,boxSizing:'border-box',maxWidth:'100%'}}>
                    <button aria-label="Remove item" onClick={()=>removeItem(it.id)} className="icon-btn close-btn" style={{position:'absolute',top:4,right:4,width:32,height:32,display:'inline-flex',alignItems:'center',justifyContent:'center',borderRadius:6,zIndex:40,cursor:'pointer'}}>×</button>
                    <div style={{minWidth:0,flex:1,marginRight:8,display:'flex',alignItems:'center',gap:12}}>
                      <div style={{flex:'1 1 auto',fontWeight:600,whiteSpace:'normal',overflow:'visible',wordBreak:'normal',overflowWrap:'normal',hyphens:'none'}}>{it.name}</div>
                              <div style={{flex:'0 0 auto',minWidth:64,textAlign:'right',fontSize:13,color:'var(--muted)'}}>
                                {it.amount ? `${it.amount}${it.kcalPerUnit ? ' pcs' : ' g'}` : ''}
                              </div>
                              <div style={{flex:'0 0 auto',minWidth:84,textAlign:'right',fontSize:13,fontWeight:700}}>
                                {it.calories ? `${it.calories} kcal` : ''}
                                {it.protein !== null && it.protein !== undefined ? <div style={{fontSize:12,fontWeight:500,color:'var(--muted)'}}>{it.protein} g</div> : null}
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
