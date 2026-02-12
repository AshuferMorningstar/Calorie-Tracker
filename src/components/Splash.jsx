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
    // Show the splash briefly then exit
    // On fast connections, wait for image + 3000ms
    // On slow connections, fallback to 3000ms total
    const showTime = imgLoaded ? 3000 : 3000
    const exitTime = 360

    const t = setTimeout(()=>{
      setExiting(true)
      setTimeout(()=> setVisible(false), exitTime)
    }, showTime)
    
    // Always dismiss after 3000ms max, regardless of image load
    const fallback = setTimeout(()=>{
      if(!exiting){
        setExiting(true)
        setTimeout(()=> setVisible(false), exitTime)
      }
    }, 3000)
    
    return ()=>{ 
      clearTimeout(t)
      clearTimeout(fallback)
    }
  },[imgLoaded, exiting])

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
          fetchPriority="high"
          onLoad={() => setImgLoaded(true)}
        />
        <h1 className="app-name">Calorie Wise</h1>
        <p className="subtitle">Track meals. Stay mindful.</p>
      </div>
    </div>
  )
}
