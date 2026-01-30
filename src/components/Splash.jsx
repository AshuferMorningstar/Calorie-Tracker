import React, {useEffect, useState} from 'react'

export default function Splash({onFinish}){
  const [visible, setVisible] = useState(true)
  const [exiting, setExiting] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  useEffect(()=>{
    // keep the page from scrolling while splash is visible
    try{ if(visible) document.body.style.overflow = 'hidden' }catch(e){}
    return ()=>{ try{ document.body.style.overflow = '' }catch(e){} }
  },[visible])

  useEffect(()=>{
    // When the logo is loaded, show it briefly then play exit animation.
    // This mirrors Instagram's brief centered logo behavior.
    const showTime = 800
    const exitTime = 360

    if(imgLoaded){
      const t = setTimeout(()=>{
        setExiting(true)
        setTimeout(()=> setVisible(false), exitTime)
      }, showTime)
      return ()=> clearTimeout(t)
    }

    // Fallback: if image never loads, still dismiss after a short period
    const fallback = setTimeout(()=>{
      setExiting(true)
      setTimeout(()=> setVisible(false), exitTime)
    }, 2000)
    return ()=> clearTimeout(fallback)
  },[imgLoaded])

  useEffect(()=>{
    if(!visible && typeof onFinish === 'function'){
      try{ onFinish() }catch(e){}
    }
  },[visible,onFinish])

  if(!visible) return null

  return (
    <div className={`splash ${exiting? 'splash-exit':''}`} aria-hidden={!visible} data-visible={visible}>
      <div className="logo-wrap" role="img" aria-label="Calorie Wise logo and name">
        <img
          src="/assets/caloriewiselogo.svg"
          alt="Calorie Wise logo"
          className={`splash-logo ${imgLoaded ? 'loaded' : 'loading'}`}
          loading="eager"
          onLoad={() => setImgLoaded(true)}
        />
        <h1 className="app-name">Calorie Wise</h1>
        <p className="subtitle">Track meals. Stay mindful.</p>
      </div>
    </div>
  )
}
