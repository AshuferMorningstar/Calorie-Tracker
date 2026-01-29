import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import vegetables from '../data/vegetables_india.json'
import fruits from '../data/fruits.json'

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
  { id: 'chapati_unit', name: 'Roti / Chapati (whole wheat) - piece', unit: 'count', kcalPerUnit: 250, proteinPerUnit: 9.0 },
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

  // Common Indian breads / unit items
  { id: 'naan_plain', name: 'Naan (plain)', unit: 'count', kcalPerUnit: 270, proteinPerUnit: 8.0 },
  { id: 'naan_butter', name: 'Butter naan', unit: 'count', kcalPerUnit: 350, proteinPerUnit: 8.0 },
  { id: 'naan_garlic', name: 'Garlic naan', unit: 'count', kcalPerUnit: 330, proteinPerUnit: 8.0 },
  { id: 'naan_stuffed', name: 'Stuffed naan (cheese/keema)', unit: 'count', kcalPerUnit: 380, proteinPerUnit: 10.0 },
  { id: 'kulcha', name: 'Kulcha', unit: 'count', kcalPerUnit: 260, proteinPerUnit: 7.0 },
  { id: 'lachha_paratha', name: 'Lachha Paratha', unit: 'count', kcalPerUnit: 320, proteinPerUnit: 6.0 },
  { id: 'paratha_plain', name: 'Paratha (plain)', unit: 'count', kcalPerUnit: 300, proteinPerUnit: 6.0 },
  { id: 'aloo_paratha', name: 'Aloo Paratha', unit: 'count', kcalPerUnit: 350, proteinPerUnit: 6.0 },
  { id: 'sattu_paratha', name: 'Sattu Paratha', unit: 'count', kcalPerUnit: 330, proteinPerUnit: 8.0 },
  { id: 'missi_roti', name: 'Missi Roti', unit: 'count', kcalPerUnit: 220, proteinPerUnit: 8.0 },
  { id: 'roomali_roti', name: 'Roomali Roti', unit: 'count', kcalPerUnit: 200, proteinPerUnit: 5.0 },
  { id: 'parotta', name: 'Parotta / Malabar Parotta', unit: 'count', kcalPerUnit: 300, proteinPerUnit: 6.0 },
  { id: 'puri', name: 'Puri', unit: 'count', kcalPerUnit: 165, proteinPerUnit: 2.0 },
  { id: 'bhatura', name: 'Bhatura', unit: 'count', kcalPerUnit: 400, proteinPerUnit: 6.0 },

  // South Indian breakfast items (unit-based)
  { id: 'dosa_plain', name: 'Dosa (plain)', unit: 'count', kcalPerUnit: 168, proteinPerUnit: 4.0 },
  { id: 'idli', name: 'Idli', unit: 'count', kcalPerUnit: 58, proteinPerUnit: 2.0 },
  { id: 'medu_vada', name: 'Medu Vada', unit: 'count', kcalPerUnit: 135, proteinPerUnit: 3.5 },
  { id: 'suji_chilla', name: 'Suji Chilla', unit: 'count', kcalPerUnit: 120, proteinPerUnit: 4.0 },
  { id: 'besan_chilla', name: 'Besan Chilla', unit: 'count', kcalPerUnit: 150, proteinPerUnit: 6.0 },
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
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2,'0')
  const day = String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${day}`
}

export default function TrackCalories(){
  const navigate = useNavigate()
  const ALL_FOODS = useMemo(()=>{
    try{
      const extras = []
      if(Array.isArray(vegetables)){
        vegetables.forEach((v, idx)=>{
          const id = `veg_${idx}_${(v.name_en||'').toLowerCase().replace(/\s+/g,'_')}`
          extras.push({ id, name: v.name_en, kcal: v.calories_per_100g || v.calories_per_100g, protein: v.protein_per_100g || v.protein_per_100g, name_hi: v.name_hi || '', name_hi_translit: v.name_hi_translit || '', unit: v.unit || 'g' })
        })
      }
      if(Array.isArray(fruits)){
        fruits.forEach((f, idx)=>{
          const id = `fruit_${idx}_${(f.name_en||'').toLowerCase().replace(/\s+/g,'_')}`
          extras.push({ id, name: f.name_en, kcal: f.calories_per_100g || f.calories_per_100g, protein: f.protein_per_100g || f.protein_per_100g, name_hi: f.name_hi || '', name_hi_translit: f.name_hi_translit || '', unit: f.unit || 'g' })
        })
      }
      return [...FOODS, ...extras]
    }catch(e){ return FOODS }
  },[])
  const [date, setDate] = useState(todayISO())
  const [items, setItems] = useState([])

  // keep track of what the "today" value was when scheduling updates
  const prevTodayRef = useRef(todayISO())

  // form fields
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('') // grams
  const [kcalPer100g, setKcalPer100g] = useState('')
  const [proteinPer100g, setProteinPer100g] = useState('')
  const [manualKcalNeeded, setManualKcalNeeded] = useState(false)
  const [unit, setUnit] = useState('g') // 'g' or 'count'
  const [kcalPerUnit, setKcalPerUnit] = useState('')
  const [proteinPerUnit, setProteinPerUnit] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  useEffect(()=>{
    // load items for selected date
    try{
      const raw = localStorage.getItem(dateKey(date))
      if(raw){
        const parsed = JSON.parse(raw)
        // normalize older items: compute protein if missing
        const normalized = parsed.map(it=>{
          if(it && (it.protein === null || it.protein === undefined)){
            let prot = null
            const amt = parseFloat(it.amount)
            if(it.proteinPerUnit && !isNaN(amt) && amt > 0){
              prot = Math.round((amt * Number(it.proteinPerUnit)) * 10) / 10
            } else if(it.proteinPer100g && !isNaN(amt) && amt > 0){
              prot = Math.round((amt * Number(it.proteinPer100g) / 100) * 10) / 10
            } else {
              // try to infer from built-in FOODS by name
              try{
                const name = (it.name || '').toLowerCase()
                const found = ALL_FOODS.find(f=> (f.name||'').toLowerCase() === name || (f.name_hi||'').toLowerCase() === name || (f.name_hi_translit||'').toLowerCase() === name) || ALL_FOODS.find(f=> name.includes((f.name||'').toLowerCase()))
                if(found && !isNaN(amt) && amt > 0){
                  if(found.unit === 'count' && found.proteinPerUnit){ prot = Math.round((amt * found.proteinPerUnit) * 10) / 10 }
                  else if(found.protein){ prot = Math.round((amt * found.protein / 100) * 10) / 10 }
                }
              }catch(e){}
            }
            return {...it, protein: prot}
          }
          return it
        })
        setItems(normalized)
      }
      else setItems([])
    }catch(e){ setItems([]) }
  },[date])

  // automatically advance `date` when the system day rolls over.
  // Only update if the user is currently viewing the previous "today" value
  // (so we don't override when they explicitly selected another date).
  useEffect(()=>{
    let timer = null
    const schedule = ()=>{
      const now = new Date()
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      const ms = Math.max(1000, next.getTime() - now.getTime() + 50)
      timer = setTimeout(()=>{
        try{
          const newToday = todayISO()
          // only advance if the currently-selected date equals the previous today
          if(date === prevTodayRef.current){
            setDate(newToday)
          }
          prevTodayRef.current = newToday
        }catch(e){}
        schedule()
      }, ms)
    }
    // initialize prevTodayRef to current today value
    prevTodayRef.current = todayISO()
    schedule()
    return ()=>{ if(timer) clearTimeout(timer) }
  },[date])

  const persist = (nextItems, forDate = date)=>{
    try{ localStorage.setItem(dateKey(forDate), JSON.stringify(nextItems)) }catch(e){}
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
    // if the system date advanced since the user opened the page, and the
    // currently-selected `date` still equals the previous "today" value,
    // treat the item as intended for the new today date and persist there.
    const currentToday = todayISO()
    let effectiveDate = date
    if(currentToday !== date && date === prevTodayRef.current){
      effectiveDate = currentToday
      prevTodayRef.current = currentToday
      // update UI to show the new date
      setDate(currentToday)
    }

    if(effectiveDate === date){
      const next = [...items, item]
      setItems(next)
      persist(next, effectiveDate)
    }else{
      // append item to whatever entries already exist for effectiveDate
      try{
        const raw = localStorage.getItem(dateKey(effectiveDate))
        const parsed = raw ? JSON.parse(raw) : []
        const merged = Array.isArray(parsed) ? [...parsed, item] : [item]
        persist(merged, effectiveDate)
        // if we switched the UI to the new date, update in-memory items immediately
        if(effectiveDate === currentToday){
          setItems(merged)
        }
      }catch(e){
        // fallback: just write the single item
        persist([item], effectiveDate)
        if(effectiveDate === currentToday){ setItems([item]) }
      }
    }
    setName(''); setAmount(''); setKcalPer100g(''); setProteinPer100g(''); setKcalPerUnit(''); setProteinPerUnit(''); setUnit('g'); setManualKcalNeeded(false)
  }

  const removeItem = (id)=>{
    const next = items.filter(i=>i.id !== id)
    setItems(next)
    persist(next)
  }

  const toggleSelect = (id)=>{
    setSelectedIds(prev=>{
      const s = new Set(prev)
      if(s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }

  const deleteSelected = ()=>{
    if(!selectedIds || selectedIds.size === 0) return
    const next = items.filter(i=> !selectedIds.has(i.id))
    setItems(next)
    persist(next)
    setSelectedIds(new Set())
    setEditMode(false)
  }

  const clearAll = ()=>{
    if(items.length === 0) return
    // show inline confirmation card instead of native confirm
    setShowClearConfirm(true)
  }

  const confirmClearAll = ()=>{
    setItems([])
    persist([])
    setSelectedIds(new Set())
    setEditMode(false)
    setShowClearConfirm(false)
  }

  const cancelClear = ()=>{
    setShowClearConfirm(false)
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

                // 1) exact name match (match English, Hindi, or transliteration)
                let found = ALL_FOODS.find(f => (f.name || '').toLowerCase() === raw || (f.name_hi || '').toLowerCase() === raw || (f.name_hi_translit || '').toLowerCase() === raw)

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
                    if(cookedRequested){
                      const cookedId = aliasId.replace(/_raw$/, '')
                      found = ALL_FOODS.find(f => f.id === cookedId) || ALL_FOODS.find(f => f.id === aliasId)
                    }else{
                      found = ALL_FOODS.find(f => f.id === aliasId) || ALL_FOODS.find(f => f.id === aliasId.replace(/_raw$/,''))
                    }
                  }
                }

                // 4) fallback: includes search preferring cooked/raw based on request
                if(!found && base){
                  if(cookedRequested){
                    found = ALL_FOODS.find(f => (f.name||'').toLowerCase().includes(base) && (f.name||'').toLowerCase().includes('cooked'))
                  }
                  if(!found){
                    // prefer raw or any non-cooked match; also match Hindi/translit
                    found = ALL_FOODS.find(f => ((f.name||'').toLowerCase().includes(base) || (f.name_hi||'').toLowerCase().includes(base) || (f.name_hi_translit||'').toLowerCase().includes(base)) && !(f.name||'').toLowerCase().includes('cooked'))
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
              </div>
            </div>

            {previewCalories !== null && (
              <div style={{fontSize:12,color:'var(--muted)',marginTop:8}}>
                {previewCalories} kcal{previewProtein !== null ? ` • ${previewProtein} g protein` : ''}
              </div>
            )}

            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button className="card" type="submit" style={{background:'var(--accent1)',color:'#fff',border:'none',padding:'8px 12px'}}>Add</button>
              <button className="icon-btn" type="button" onClick={()=>{ setName(''); setAmount(''); setKcalPer100g(''); setProteinPer100g(''); setKcalPerUnit(''); setProteinPerUnit(''); setUnit('g'); setManualKcalNeeded(false) }}>Clear</button>
            </div>
          </form>
        </div>

        <div>
          <div className="card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <div style={{fontWeight:700}}>Logged — {date}</div>
              <div style={{fontSize:14,fontWeight:700,textAlign:'right',minWidth:140,marginLeft:12}}>{totalCalories} kcal • {totalProtein.toFixed(1)} g</div>
            </div>

            {items.length === 0 ? (
              <div style={{color:'var(--muted)'}}>No items logged for this date.</div>
            ) : (
              <ul style={{listStyle:'none',padding:0,display:'flex',flexDirection:'column',gap:8}}>
                {items.map(it=> {
                  // compute display protein if missing
                  let displayProtein = null
                  if(it.protein !== null && it.protein !== undefined){ displayProtein = it.protein }
                  else {
                    const amt = parseFloat(it.amount)
                    if(it.proteinPerUnit && !isNaN(amt) && amt > 0){ displayProtein = Math.round((amt * Number(it.proteinPerUnit)) * 10) / 10 }
                    else if(it.proteinPer100g && !isNaN(amt) && amt > 0){ displayProtein = Math.round((amt * Number(it.proteinPer100g) / 100) * 10) / 10 }
                    else {
                      // fallback: try to find in FOODS
                      try{
                        const nm = (it.name || '').toLowerCase()
                        const found = ALL_FOODS.find(f=> (f.name||'').toLowerCase() === nm || (f.name_hi||'').toLowerCase() === nm || (f.name_hi_translit||'').toLowerCase() === nm) || ALL_FOODS.find(f=> nm.includes((f.name||'').toLowerCase()))
                        if(found && !isNaN(amt) && amt > 0){
                          if(found.unit === 'count' && found.proteinPerUnit){ displayProtein = Math.round((amt * found.proteinPerUnit) * 10) / 10 }
                          else if(found.protein){ displayProtein = Math.round((amt * found.protein / 100) * 10) / 10 }
                        }
                      }catch(e){}
                    }
                  }

                  return (
                  <li key={it.id} className="card" style={{position:'relative',padding:6,overflow:'visible',width:'100%',boxSizing:'border-box',maxWidth:'100%',flex:'0 0 100%',alignSelf:'stretch',display:'grid',gridTemplateColumns:'14px minmax(20px,1fr) 64px 100px',alignItems:'center',gap:4,paddingLeft:6}} onClick={(e)=>{ if(editMode){ toggleSelect(it.id) } }}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {editMode ? (
                        <input type="checkbox" checked={selectedIds.has(it.id)} onClick={(e)=>e.stopPropagation()} onChange={(e)=>{ e.stopPropagation(); toggleSelect(it.id) }} />
                      ) : null}
                    </div>
                    <div title={it.name} style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontWeight:600}}>{it.name}</div>
                    <div style={{display:'flex',justifyContent:'center',alignItems:'center',fontSize:13,color:'var(--muted)'}}>
                      {it.amount ? `${it.amount}${it.kcalPerUnit ? ' pcs' : ' g'}` : ''}
                    </div>
                    <div style={{textAlign:'right',fontSize:13,fontWeight:700}}>
                      {it.calories ? `${it.calories} kcal` : ''}{displayProtein !== null && displayProtein !== undefined ? ` • ${displayProtein} g` : ''}
                    </div>
                  </li>
                )})}
              </ul>
            )}

            <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:12}}>
              {!editMode ? (
                <button className="icon-btn" onClick={()=>{ setEditMode(true); setSelectedIds(new Set()) }}>Edit</button>
              ) : (
                <>
                  <button className="icon-btn" onClick={deleteSelected} disabled={!selectedIds || selectedIds.size===0}>Delete</button>
                  <button className="icon-btn" onClick={()=>{ setEditMode(false); setSelectedIds(new Set()) }}>Cancel</button>
                </>
              )}
              <button className="icon-btn" onClick={clearAll}>Clear</button>
            </div>

            {showClearConfirm && (
              <div style={{position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',zIndex:1200}}>
                <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.32)'}} onClick={cancelClear}></div>
                <div className="card" style={{zIndex:1201,maxWidth:520,width:'92%',padding:18,display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
                  <div>
                    <div style={{fontWeight:700}}>Clear all entries?</div>
                    <div style={{fontSize:13,color:'var(--muted)'}}>This will remove all logged items for {date}.</div>
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <button className="icon-btn" onClick={cancelClear}>Cancel</button>
                    <button className="card" onClick={confirmClearAll} style={{background:'var(--accent2)',color:'#fff',border:'none',padding:'8px 12px'}}>Confirm</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
