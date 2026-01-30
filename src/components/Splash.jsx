import React, {useEffect, useState} from 'react'

export default function Splash({onFinish}){
  const [visible, setVisible] = useState(true)
  const [exiting, setExiting] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  useEffect(()=>{
    console.log('[Splash] mounted')
    const showTime = 1500
    const exitTime = 420
    const t = setTimeout(()=>{
      console.log('[Splash] starting exit')
      setExiting(true)
      setTimeout(()=> setVisible(false), exitTime)
    }, showTime)

    return ()=>{
      clearTimeout(t)
      console.log('[Splash] unmounted')
    }
  },[])

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
