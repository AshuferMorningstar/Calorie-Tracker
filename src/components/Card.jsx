import React from 'react'

export default function Card({item, onEdit, onDelete}){
  return (
    <div className="card">
      <div className="meta">
        <h3 className="title">{item.name}</h3>
        <div className="subtitle">{item.category} • {new Date(item.date).toLocaleString()}</div>
      </div>

      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div className="cal-badge">{item.calories} kcal</div>
        <div className="card-actions">
          <button className="icon-btn" onClick={()=>onEdit && onEdit(item)}>Edit</button>
          <button className="icon-btn" onClick={()=>onDelete && onDelete(item)}>Delete</button>
        </div>
      </div>
    </div>
  )
}
