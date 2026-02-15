import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Splash from '../components/Splash'

export default function SplashPage(){
  const navigate = useNavigate()

  const handleFinish = ()=>{
    try{
      const seenEver = localStorage.getItem('calorieWise.seenEver')
      if(seenEver){
        console.log('[SplashPage] finished; user onboarded — navigating to /')
        navigate('/', { state: { fromSplash: true } })
        return
      }
    }catch(e){}
    console.log('[SplashPage] finished; navigating to /onboard/auth')
    // navigate to authentication page
    navigate('/onboard/auth')
  }

  useEffect(()=>{
    console.log('[SplashPage] mounted')
  },[])

  return (
    <div>
      <Splash onFinish={handleFinish} />
    </div>
  )
}
