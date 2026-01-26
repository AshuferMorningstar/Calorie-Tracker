import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Splash from '../components/Splash'

export default function SplashPage(){
  const navigate = useNavigate()

  const handleFinish = ()=>{
    console.log('[SplashPage] finished; navigating to / with fromSplash state')
    // navigate back to home and set a flag so home does not immediately redirect
    navigate('/', { state: { fromSplash: true } })
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
