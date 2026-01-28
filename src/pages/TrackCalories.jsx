import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function TrackCalories(){
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')

  const addItem = (e)=>{
    e.preventDefault()
    const trimmed = (name || '').trim()
    if(!trimmed) return
    setItems(prev => [...prev, { id: Date.now(), name: trimmed, quantity: quantity || '' }])
    setName('')
    setQuantity('')
  }

  const removeItem = (id)=> setItems(prev => prev.filter(i=>i.id !== id))

  const handleBack = ()=>{
    try{
      if(window.history && window.history.length > 1){
        navigate(-1)
        return
      }
    }catch(e){}
    navigate('/', { state: { fromSplash: true } })
  }

  return (
    <div style={{padding:16,maxWidth:720,margin:'0 auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <h2>Track Calories</h2>
        <div>
          <button className="icon-btn" onClick={handleBack}>Back</button>
        </div>
      </div>

      <form onSubmit={addItem} style={{display:'grid',gap:8}}>
        <label style={{fontSize:13,color:'var(--muted)'}}>Meal or ingredient name</label>
        <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="e.g. Chicken breast, Rice, Lunch" />

        <label style={{fontSize:13,color:'var(--muted)'}}>Quantity / amount</label>
        <input value={quantity} onChange={(e)=>setQuantity(e.target.value)} placeholder="e.g. 100 g, 1 cup, 1 serving" />

        <div style={{display:'flex',gap:8}}>
          <button className="icon-btn" type="submit">Add</button>
          <button className="icon-btn" type="button" onClick={()=>{ setName(''); setQuantity('') }}>Clear</button>
        </div>
      </form>

      <div style={{marginTop:20}}>
        <h3 style={{marginBottom:8}}>Logged items</h3>
        {items.length === 0 ? (
          <div style={{color:'var(--muted)'}}>No items logged yet.</div>
        ) : (
          <ul style={{listStyle:'none',padding:0,display:'grid',gap:8}}>
            {items.map(it=> (
              <li key={it.id} className="card" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontWeight:600}}>{it.name}</div>
                  {it.quantity ? <div style={{fontSize:12,color:'var(--muted)'}}>{it.quantity}</div> : null}
                </div>
                <button className="icon-btn" onClick={()=>removeItem(it.id)}>Remove</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
