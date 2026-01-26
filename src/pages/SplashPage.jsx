import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Splash from '../components/Splash'

export default function SplashPage(){
  const navigate = useNavigate()

  const handleFinish = ()=>{
    console.log('[SplashPage] finished; navigating to /onboard')
    // navigate to onboarding (login-like) page
    navigate('/onboard')
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
